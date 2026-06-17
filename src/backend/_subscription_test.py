"""Tests for the 3-free-analyses subscription gating (SQLite port)."""
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
main.analyze_contract = lambda text, language="fr": {"summary": "ok", "risks": [], "obligations": [],
                                                     "missing_clauses": [], "recommendations": [], "sources": [], "grounded": False}
main.chat_assistant.answer = lambda history, user_message, language="fr", document_context="": {
    "reply": "ok", "sources": [], "grounded": False, "used_document": False}
client = TestClient(main.app)

doc = fitz.open(); p = doc.new_page(); p.insert_text((72,72), "CONTRAT test penalite."); pdf = doc.tobytes(); doc.close()

print("== fresh freemium profile ==")
prof = client.get("/api/user/profile").json()
check("plan freemium", prof["subscription_plan"] == "freemium")
check("3 analyses remaining", prof["analyses_remaining"] == 3)
check("not exhausted", prof["exhausted"] is False)

print("== create conversation + chat while free ==")
cid = client.post("/api/chat/new", json={"title": "T"}).json()["conversation_id"]
check("new chat allowed (free)", bool(cid))
check("ask allowed (free)", client.post(f"/api/chat/{cid}/ask", json={"content": "salut"}).status_code == 200)

print("== consume 3 free analyses ==")
codes = [client.post("/api/analyze", json={"text": "Contrat penalite 25%."}).status_code for _ in range(3)]
check("3 analyses succeed (200x3)", codes == [200, 200, 200])
prof = client.get("/api/user/profile").json()
check("remaining now 0", prof["analyses_remaining"] == 0)
check("exhausted now True", prof["exhausted"] is True)

print("== 4th analysis blocked + everything Pro-gated ==")
r = client.post("/api/analyze", json={"text": "encore"})
check("4th analyze -> 403", r.status_code == 403)
check("upgrade code returned", r.json()["detail"]["code"] == "UPGRADE_REQUIRED")
check("ask blocked -> 403", client.post(f"/api/chat/{cid}/ask", json={"content": "x"}).status_code == 403)
check("attach blocked -> 403", client.post(f"/api/chat/{cid}/attach", files={"file": ("c.pdf", pdf, "application/pdf")}).status_code == 403)
check("new chat blocked -> 403", client.post("/api/chat/new", json={"title": "X"}).status_code == 403)

print("== upgrade to subscribed -> unlimited ==")
up = client.patch("/api/user/subscription", json={"plan": "subscribed"})
check("subscription patch ok", up.status_code == 200 and up.json()["updated_plan"] == "subscribed")
check("analyze unlimited now", client.post("/api/analyze", json={"text": "ok"}).status_code == 200)
check("ask works now", client.post(f"/api/chat/{cid}/ask", json={"content": "x"}).status_code == 200)
check("new chat works now", client.post("/api/chat/new", json={"title": "Y"}).status_code == 200)
prof = client.get("/api/user/profile").json()
check("profile subscribed, remaining null", prof["subscription_plan"] == "subscribed" and prof["analyses_remaining"] is None)

print("== isolation: bob has his own fresh quota ==")
CUR["uid"] = "bob"
check("bob fresh 3 remaining", client.get("/api/user/profile").json()["analyses_remaining"] == 3)

import shutil; shutil.rmtree(tmp, ignore_errors=True)
print(f"\nRESULT: {passed} passed, {failed} failed")
raise SystemExit(1 if failed else 0)
