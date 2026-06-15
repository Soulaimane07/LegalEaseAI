"""Offline E2E tests of the RAG pipeline. No Gemini key, no network.

Embeddings + generation are replaced by deterministic fakes; ChromaDB runs on a
temp path; PDF parsing runs on a real generated PDF.
"""
import json
import os
import shutil
import tempfile

import fitz  # to create a real test PDF

from services.chunker import chunk_text
from services.parser import extract_text_from_pdf
from services.vector_store import LegalVectorStore
from services import legal_analyzer

passed = failed = 0
def check(name, cond):
    global passed, failed
    passed, failed = (passed + 1, failed) if cond else (passed, failed + 1)
    print(f"  {'PASS' if cond else 'FAIL'}  {name}")

# ---- Deterministic fake embedder (keyword-count vectors) ----
KEYWORDS = ["bail", "loyer", "penalite", "resiliation", "nda",
            "confidentialite", "travail", "salaire"]
def fake_embed(texts):
    vecs = []
    for t in texts:
        low = t.lower()
        v = [float(low.count(k)) + 0.01 for k in KEYWORDS]  # +eps avoids zero-vector
        vecs.append(v)
    return vecs

# ---- Fake LLM: returns a structured JSON analysis, fenced like a real model ----
def fake_generate(prompt):
    has_law = "Source 1" in prompt
    payload = {
        "summary": "Contrat de bail commercial avec clause de penalite.",
        "language": "fr",
        "obligations": ["Payer le loyer mensuel"],
        "risks": [{
            "clause": "Penalite de retard",
            "severity": "eleve",
            "explanation": "Penalite disproportionnee.",
            "law_reference": "Article 264 DOC" if has_law else "",
        }],
        "missing_clauses": ["Clause de revision du loyer"],
        "recommendations": ["Negocier le plafond de penalite"],
    }
    return "```json\n" + json.dumps(payload, ensure_ascii=False) + "\n```"

print("== 1. Chunker ==")
long_text = ("Article premier. " * 200).strip()
chunks = chunk_text(long_text, size=300, overlap=50)
check("chunks created", len(chunks) > 1)
check("chunk size bounded", all(len(c) <= 320 for c in chunks))
check("empty -> []", chunk_text("") == [])

print("== 2. PDF parser (real PDF) ==")
tmp = tempfile.mkdtemp()
pdf_path = os.path.join(tmp, "contract.pdf")
doc = fitz.open()
page = doc.new_page()
page.insert_text((72, 72), "BAIL COMMERCIAL\nLoyer mensuel 5000 MAD\nPenalite de retard 10%.")
doc.save(pdf_path); doc.close()
extracted = extract_text_from_pdf(pdf_path)
check("pdf text extracted", "BAIL COMMERCIAL" in extracted and "Penalite" in extracted)

print("== 3. Vector store retrieval (fake embeddings) ==")
store_dir = os.path.join(tmp, "chroma")
store = LegalVectorStore(path=store_dir, collection_name="test_law")
law_snippets = [
    "Article 264 DOC: la penalite de retard et le loyer du bail commercial.",
    "Article 38: clauses de confidentialite et NDA entre les parties.",
    "Article 12: contrat de travail, salaire et duree.",
]
store.add(
    ids=["a", "b", "c"],
    documents=law_snippets,
    embeddings=fake_embed(law_snippets),
    metadatas=[{"source": "DOC", "chunk": i} for i in range(3)],
)
check("store count == 3", store.count() == 3)
qvec = fake_embed(["penalite de retard sur le loyer du bail"])[0]
hits = store.query(qvec, n_results=1)
check("retrieves the bail/loyer/penalite article", hits and "264" in hits[0]["text"])

print("== 4. analyze_contract (full RAG, injected fakes) ==")
result = legal_analyzer.analyze_contract(
    "Bail commercial. Loyer 5000 MAD. Penalite de retard de 10% par jour.",
    language="fr",
    store=store,
    embed_fn=fake_embed,
    generate_fn=fake_generate,
)
check("returns dict", isinstance(result, dict))
check("has summary", bool(result.get("summary")))
check("has risks", len(result.get("risks", [])) >= 1)
check("risk has law_reference", result["risks"][0].get("law_reference", "") != "")
check("grounded == True", result.get("grounded") is True)
check("sources attached", len(result.get("sources", [])) >= 1)

print("== 5. JSON parsing robustness ==")
check("parses fenced json", legal_analyzer._parse_json('```json\n{\"summary\":\"x\"}\n```')["summary"] == "x")
check("parses raw json", legal_analyzer._parse_json('{"summary":"y"}')["summary"] == "y")
check("garbage -> fallback (no crash)", legal_analyzer._parse_json("not json").get("parse_error") is True)

print("== 6. empty contract rejected ==")
try:
    legal_analyzer.analyze_contract("   ", store=store, embed_fn=fake_embed, generate_fn=fake_generate)
    check("empty raises", False)
except ValueError:
    check("empty raises", True)

# ---- Endpoint test (auth + ownership + wiring), analyze_contract faked ----
print("== 7. /api/analyze endpoint ==")
import database
TEST_DB = os.path.join(tmp, "api.db")
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
database.engine = create_engine(f"sqlite:///{TEST_DB}", connect_args={"check_same_thread": False})
database.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=database.engine)

from fastapi.testclient import TestClient
import main

def _get_test_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()
main.app.dependency_overrides[main.get_db] = _get_test_db
database.Base.metadata.create_all(bind=database.engine)

CURRENT = {"uid": "alice"}
main.app.dependency_overrides[main.get_current_user_id] = lambda: CURRENT["uid"]
# Replace the heavy Gemini call with the fake.
main.analyze_contract = lambda text, language="fr": {
    "summary": "ok", "risks": [], "obligations": [], "missing_clauses": [],
    "recommendations": [], "sources": [], "grounded": False, "language": language,
}
client = TestClient(main.app)

# Seed a document owned by alice, pointing at the real test PDF.
with database.SessionLocal() as db:
    db.add(database.Document(id="doc1", user_id="alice", filename="contract.pdf",
                             stored_filename="contract.pdf", file_path=pdf_path, status="uploaded"))
    db.commit()

r = client.post("/api/analyze", json={"text": "Bail commercial, penalite 10%."})
check("analyze text -> 200", r.status_code == 200 and r.json()["status"] == "success")

r = client.post("/api/analyze", json={"document_id": "doc1"})
check("analyze own document -> 200", r.status_code == 200)

CURRENT["uid"] = "bob"
r = client.post("/api/analyze", json={"document_id": "doc1"})
check("bob cannot analyze alice's doc -> 403", r.status_code == 403)

CURRENT["uid"] = "alice"
r = client.post("/api/analyze", json={"document_id": "missing"})
check("missing document -> 404", r.status_code == 404)
r = client.post("/api/analyze", json={})
check("no text/document -> 400", r.status_code == 400)

shutil.rmtree(tmp, ignore_errors=True)
print(f"\nRESULT: {passed} passed, {failed} failed")
raise SystemExit(1 if failed else 0)
