"""Tests for chat-with-document: chat_assistant doc grounding + /attach + /ask wiring."""
import os
import tempfile

import fitz

from services import chat_assistant
from services.vector_store import LegalVectorStore

passed = failed = 0
def check(name, cond):
    global passed, failed
    passed, failed = (passed + 1, failed) if cond else (passed, failed + 1)
    print(f"  {'PASS' if cond else 'FAIL'}  {name}")

tmp = tempfile.mkdtemp()
fake_embed = lambda texts: [[1.0, 0.0] for _ in texts]
def fake_generate(prompt):
    return "DOC_SEEN" if "DOCUMENT DE L'UTILISATEUR" in prompt else "NO_DOC"

print("== 1. chat_assistant uses document_context ==")
store = LegalVectorStore(path=os.path.join(tmp, "db"), collection_name="attach_test_law")
res = chat_assistant.answer([], "Quel est le loyer ?", document_context="Loyer mensuel: 5000 MAD.",
                            store=store, embed_fn=fake_embed, generate_fn=fake_generate)
check("used_document True", res["used_document"] is True)
check("prompt included the doc (reply=DOC_SEEN)", res["reply"] == "DOC_SEEN")
res2 = chat_assistant.answer([], "Bonjour", store=store, embed_fn=fake_embed, generate_fn=fake_generate)
check("no doc -> used_document False", res2["used_document"] is False)

print("== 2. /attach + /ask endpoints ==")
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
client = TestClient(main.app)

# Build a real PDF in memory.
doc = fitz.open(); page = doc.new_page()
page.insert_text((72, 72), "CONTRAT NDA. Confidentialite pendant 5 ans. Penalite 50000 MAD.")
pdf_bytes = doc.tobytes(); doc.close()

cid = client.post("/api/chat/new", json={"title": "Doc chat"}).json()["conversation_id"]

# Capture what /ask passes as document_context (avoid real Gemini).
captured = {}
def fake_answer(history, user_message, language="fr", document_context=""):
    captured["doc"] = document_context
    return {"reply": "ok", "sources": [], "grounded": False, "used_document": bool(document_context)}
main.chat_assistant.answer = fake_answer

r = client.post(f"/api/chat/{cid}/attach", files={"file": ("nda.pdf", pdf_bytes, "application/pdf")})
check("attach -> 200", r.status_code == 200 and r.json()["filename"] == "nda.pdf")
check("attach extracted text", r.json()["chars"] > 10)

# A ChatDocument row must exist.
with database.SessionLocal() as db:
    rows = db.query(database.ChatDocument).filter(database.ChatDocument.conversation_id == cid).all()
check("ChatDocument persisted", len(rows) == 1 and "NDA" in rows[0].text)

# Conversation got the confirmation note.
hist = client.get(f"/api/chat/{cid}").json()
check("note bubble added", any("nda.pdf" in m["content"] for m in hist["messages"]))

# /ask now receives the document text as context.
r = client.post(f"/api/chat/{cid}/ask", json={"content": "Quelle est la penalite ?"})
check("ask -> 200", r.status_code == 200)
check("document_context passed to assistant", "Penalite 50000 MAD" in captured.get("doc", ""))

# Auth/ownership.
CUR["uid"] = "bob"
r = client.post(f"/api/chat/{cid}/attach", files={"file": ("x.pdf", pdf_bytes, "application/pdf")})
check("bob 403 attaching to alice's chat", r.status_code == 403)
CUR["uid"] = "alice"
r = client.post("/api/chat/zzz/attach", files={"file": ("x.pdf", pdf_bytes, "application/pdf")})
check("attach missing chat -> 404", r.status_code == 404)

# Reject a non-PDF / empty-text payload.
r = client.post(f"/api/chat/{cid}/attach", files={"file": ("empty.pdf", b"%PDF-1.4 broken", "application/pdf")})
check("unreadable pdf -> 400", r.status_code == 400)

import shutil; shutil.rmtree(tmp, ignore_errors=True)
print(f"\nRESULT: {passed} passed, {failed} failed")
raise SystemExit(1 if failed else 0)
