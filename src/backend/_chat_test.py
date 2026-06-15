"""Tests for the conversational RAG assistant: offline (fakes) + the /ask endpoint."""
import json
import os
import tempfile

from services import chat_assistant
from services.vector_store import LegalVectorStore

passed = failed = 0
def check(name, cond):
    global passed, failed
    passed, failed = (passed + 1, failed) if cond else (passed, failed + 1)
    print(f"  {'PASS' if cond else 'FAIL'}  {name}")

tmp = tempfile.mkdtemp()

def fake_embed(texts):
    return [[float(len(t) % 7) + 0.1, 1.0] for t in texts]

def fake_generate(prompt):
    grounded = "Source 1" in prompt
    return ("D'apres l'article cite, " if grounded else "") + "voici une reponse juridique claire."

print("== 1. chat_assistant.answer (no law indexed) ==")
store = LegalVectorStore(path=os.path.join(tmp, "c1"), collection_name="test_chat_law")
res = chat_assistant.answer([], "Bonjour", store=store, embed_fn=fake_embed, generate_fn=fake_generate)
check("returns reply", bool(res["reply"]))
check("grounded False when empty", res["grounded"] is False)

print("== 2. chat_assistant.answer (law indexed -> grounded) ==")
store.add(ids=["x"], documents=["Article 230 DOC: les contrats obligent."],
          embeddings=fake_embed(["Article 230 DOC: les contrats obligent."]),
          metadatas=[{"source": "DOC"}])
res2 = chat_assistant.answer([], "Un contrat m'engage-t-il ?", store=store, embed_fn=fake_embed, generate_fn=fake_generate)
check("grounded True", res2["grounded"] is True)
check("sources attached", len(res2["sources"]) >= 1)
check("history honored", chat_assistant.answer([{"role":"user","content":"q"}], "suite", store=store, embed_fn=fake_embed, generate_fn=fake_generate)["reply"] != "")

print("== 3. /api/chat/{id}/ask endpoint ==")
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
# Fake the AI so the endpoint test needs no network.
main.chat_assistant.answer = lambda history, user_message, language="fr": {
    "reply": f"Reponse a: {user_message}", "sources": [], "grounded": False}
client = TestClient(main.app)

cid = client.post("/api/chat/new", json={"title": "Test"}).json()["conversation_id"]
r = client.post(f"/api/chat/{cid}/ask", json={"content": "Mon bail est-il valide ?"})
check("ask -> 200", r.status_code == 200)
body = r.json()
check("returns user_message", body["user_message"]["role"] == "user")
check("returns assistant_message", body["assistant_message"]["role"] == "assistant")
# Both messages persisted (2 total).
hist = client.get(f"/api/chat/{cid}").json()
check("both messages saved", len(hist["messages"]) == 2)

CUR["uid"] = "bob"
check("bob 403 on alice chat", client.post(f"/api/chat/{cid}/ask", json={"content": "x"}).status_code == 403)
CUR["uid"] = "alice"
check("missing chat -> 404", client.post("/api/chat/zzz/ask", json={"content": "x"}).status_code == 404)

print(f"\nRESULT: {passed} passed, {failed} failed")
import shutil; shutil.rmtree(tmp, ignore_errors=True)
raise SystemExit(1 if failed else 0)
