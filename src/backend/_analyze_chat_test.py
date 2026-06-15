"""Tests for the 'Analyser le contrat' endpoint + documents exposure."""
import os
import tempfile

import fitz

passed = failed = 0
def check(name, cond):
    global passed, failed
    passed, failed = (passed + 1, failed) if cond else (passed, failed + 1)
    print(f"  {'PASS' if cond else 'FAIL'}  {name}")

tmp = tempfile.mkdtemp()
import database
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
database.engine = create_engine(f"sqlite:///{os.path.join(tmp,'api.db')}", connect_args={"check_same_thread": False})
database.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=database.engine)
from fastapi.testclient import TestClient
import main
def _db():
    db = database.SessionLocal()
    try: yield db
    finally: db.close()
main.app.dependency_overrides[main.get_db] = _db
database.Base.metadata.create_all(bind=database.engine)
CUR = {"uid": "alice"}
main.app.dependency_overrides[main.get_current_user_id] = lambda: CUR["uid"]

# Fake the heavy RAG analysis with a realistic structured payload.
FAKE = {
    "summary": "Bail commercial avec clauses defavorables au locataire.",
    "language": "fr",
    "obligations": ["Payer 18000 MAD/mois", "Entretenir le local"],
    "risks": [
        {"clause": "Penalite de retard", "severity": "eleve",
         "explanation": "25%/jour est disproportionne.", "law_reference": "Article 264 DOC"},
        {"clause": "Depot non remboursable", "severity": "moyen",
         "explanation": "6 mois non remboursables.", "law_reference": ""},
    ],
    "missing_clauses": ["Clause de revision encadree"],
    "recommendations": ["Negocier la penalite"],
    "sources": [{"text": "Article 264...", "metadata": {"source": "DOC"}}],
    "grounded": True,
}
main.analyze_contract = lambda text, language="fr": FAKE
client = TestClient(main.app)

doc = fitz.open(); page = doc.new_page()
page.insert_text((72, 72), "CONTRAT DE BAIL. Loyer 18000 MAD. Penalite 25% par jour.")
pdf_bytes = doc.tobytes(); doc.close()

cid = client.post("/api/chat/new", json={"title": "Bail"}).json()["conversation_id"]

print("== no document -> 400 ==")
check("analyze without doc -> 400", client.post(f"/api/chat/{cid}/analyze").status_code == 400)

print("== attach then analyze ==")
client.post(f"/api/chat/{cid}/attach", files={"file": ("bail.pdf", pdf_bytes, "application/pdf")})
r = client.post(f"/api/chat/{cid}/analyze")
check("analyze -> 200", r.status_code == 200)
body = r.json()
check("returns document name", body.get("document") == "bail.pdf")
a = body.get("analysis", {})
check("analysis has summary", bool(a.get("summary")))
check("analysis has 2 risks", len(a.get("risks", [])) == 2)
check("risk has severity", a["risks"][0].get("severity") == "eleve")
check("grounded flag present", a.get("grounded") is True)

print("== documents field exposed ==")
conv = client.get(f"/api/chat/{cid}").json()
check("/chat/{id} lists documents", conv.get("documents") == ["bail.pdf"])
mine = client.get("/api/chats").json()
check("/chats lists documents", any(c.get("documents") == ["bail.pdf"] for c in mine))

print("== auth/ownership ==")
CUR["uid"] = "bob"
check("bob 403 analyze alice's chat", client.post(f"/api/chat/{cid}/analyze").status_code == 403)
CUR["uid"] = "alice"
check("missing chat -> 404", client.post("/api/chat/zzz/analyze").status_code == 404)

import shutil; shutil.rmtree(tmp, ignore_errors=True)
print(f"\nRESULT: {passed} passed, {failed} failed")
raise SystemExit(1 if failed else 0)
