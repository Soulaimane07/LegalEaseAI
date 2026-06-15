import os
import uuid
import datetime
import shutil
from typing import List

# Load environment variables from a local .env file (if present) BEFORE the
# modules that read them at import time (firebase_auth, gemini_client).
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
except ImportError:
    pass

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from firebase_auth import verify_firebase_token
from database import Conversation, Document, ChatDocument, User, get_db, init_db
from services.parser import extract_text_from_pdf, extract_text_from_bytes
from services.legal_analyzer import analyze_contract
from services import chat_assistant

# --- AUTH NOTE ---
# Firebase ID tokens are verified WITHOUT any service account private key
# (see firebase_auth.py), using only Google's public certs + the public
# FIREBASE_PROJECT_ID env var. This bypasses the org policy
# `iam.disableServiceAccountKeyCreation`. No firebase-admin, no Firestore,
# no credit card.

# --- INITIALIZE LOCAL SQLITE DATABASE ---
init_db()

app = FastAPI(title="LegalEase AI - SQLite Engine")
security = HTTPBearer()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# --- CORS MIDDLEWARE ---
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- STATIC SAMPLE CONTRACTS (public, for testing) ---
# Lets anyone on the LAN download the ready-made test PDFs from a browser.
TEST_DOCS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "test_documents"))
os.makedirs(TEST_DOCS_DIR, exist_ok=True)
app.mount("/test_documents", StaticFiles(directory=TEST_DOCS_DIR), name="test_documents")

# --- PYDANTIC SCHEMAS ---
class MessageModel(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str
    timestamp: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

class ConversationCreate(BaseModel):
    title: str = Field(default="New Legal Consultation")

class ConversationUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="The new custom title for the chat session")

class AnalyzeRequest(BaseModel):
    document_id: str | None = Field(default=None, description="Id of a previously uploaded document")
    text: str | None = Field(default=None, description="Raw contract text (alternative to document_id)")
    language: str = Field(default="fr", description="'fr' or 'ar'")

class AskRequest(BaseModel):
    content: str = Field(..., min_length=1, description="The user's message/question")
    language: str = Field(default="fr", description="'fr' or 'ar'")

class SubscriptionUpdate(BaseModel):
    plan: str = Field(..., description="'freemium', 'premium' or 'subscribed'")


# --- SUBSCRIPTION / FREE-TRIAL LOGIC ---
# Free tier gives 3 contract analyses. Once exhausted, ALL premium features
# (chat, analyze, attach, new conversation) require an upgrade.
FREE_ANALYSIS_LIMIT = 3
PAID_PLANS = ("premium", "subscribed")


def _get_or_create_user(db: Session, user_id: str) -> User:
    user = db.get(User, user_id)
    if not user:
        user = User(id=user_id, plan="freemium", analyses_used=0)
        db.add(user)
        db.commit()
    return user


def _is_paid(user: User) -> bool:
    return user.plan in PAID_PLANS


def _is_exhausted(user: User) -> bool:
    """Freemium user who has used up their free analyses."""
    return not _is_paid(user) and user.analyses_used >= FREE_ANALYSIS_LIMIT


def _upgrade_required(message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={"code": "UPGRADE_REQUIRED", "message": message},
    )


def _gate_premium(db: Session, user_id: str):
    """Block premium features for freemium users who exhausted their trials."""
    user = _get_or_create_user(db, user_id)
    if _is_exhausted(user):
        raise _upgrade_required(
            "Vous avez utilisé vos 3 analyses gratuites. Passez au plan Pro pour un accès illimité."
        )
    return user


# --- AUTH DEPENDENCY (THE GATEKEEPER) ---
async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extracts and verifies the Firebase ID token from the Authorization header."""
    token = credentials.credentials
    try:
        return verify_firebase_token(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Authorization Token: {str(e)}"
        )


def _serialize_conversation(conv: Conversation, db: Session = None) -> dict:
    """Shapes a Conversation row; includes attached document filenames if db given."""
    data = {
        "id": conv.id,
        "user_id": conv.user_id,
        "title": conv.title,
        "created_at": conv.created_at,
        "messages": conv.messages or [],
        "documents": [],
    }
    if db is not None:
        rows = (
            db.query(ChatDocument.filename)
            .filter(ChatDocument.conversation_id == conv.id)
            .all()
        )
        data["documents"] = [r[0] for r in rows]
    return data


# --- SECURE CHAT ENDPOINTS (per-user, SQLite-backed) ---

@app.get("/api/user/profile")
async def get_user_profile(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Returns the user's subscription plan and remaining free analyses."""
    user = _get_or_create_user(db, user_id)
    remaining = None if _is_paid(user) else max(0, FREE_ANALYSIS_LIMIT - user.analyses_used)
    return {
        "user_id": user.id,
        "subscription_plan": user.plan,
        "analyses_used": user.analyses_used,
        "analyses_limit": FREE_ANALYSIS_LIMIT,
        "analyses_remaining": remaining,
        "exhausted": _is_exhausted(user),
    }


@app.patch("/api/user/subscription")
async def update_subscription_plan(
    payload: SubscriptionUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Updates the user's plan (called after a successful payment)."""
    if payload.plan not in ("freemium", "premium", "subscribed"):
        raise HTTPException(status_code=400, detail="Invalid subscription plan.")
    user = _get_or_create_user(db, user_id)
    user.plan = payload.plan
    user.updated_at = datetime.datetime.utcnow()
    db.commit()
    return {"status": "success", "updated_plan": user.plan}


@app.post("/api/chat/new")
async def create_conversation(
    payload: ConversationCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Creates a conversation owned by the verified user account."""
    _gate_premium(db, user_id)  # blocked once free analyses are exhausted
    conv = Conversation(
        id=uuid.uuid4().hex,
        user_id=user_id,
        title=payload.title,
        created_at=datetime.datetime.utcnow(),
        messages=[],
    )
    db.add(conv)
    db.commit()
    return {"conversation_id": conv.id, "status": "created"}


@app.post("/api/chat/{conversation_id}/message")
async def append_message(
    conversation_id: str,
    message: MessageModel,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Appends a message to the conversation if the requester owns it."""
    conv = db.get(Conversation, conversation_id)

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation thread not found")
    if conv.user_id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this chat session")

    new_message = {
        "role": message.role,
        "content": message.content,
        "timestamp": message.timestamp.isoformat(),
    }
    # Reassign (not in-place append) so SQLAlchemy detects the JSON change.
    conv.messages = (conv.messages or []) + [new_message]
    db.commit()
    return {"status": "success", "new_message": new_message}


@app.get("/api/chat/{conversation_id}")
async def get_conversation_history(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Retrieves a single conversation owned by the requester."""
    conv = db.get(Conversation, conversation_id)

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation history not found")
    if conv.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return _serialize_conversation(conv, db)


@app.patch("/api/chat/{conversation_id}")
async def rename_conversation(
    conversation_id: str,
    payload: ConversationUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Updates the title if the requester owns the conversation."""
    conv = db.get(Conversation, conversation_id)

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation thread not found")
    if conv.user_id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized modification request")

    conv.title = payload.title
    db.commit()
    return {"status": "updated", "new_title": payload.title}


@app.delete("/api/chat/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Permanently deletes a conversation if the requester owns it."""
    conv = db.get(Conversation, conversation_id)

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation thread not found")
    if conv.user_id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized deletion request")

    db.delete(conv)
    db.commit()
    return {"status": "deleted", "conversation_id": conversation_id}


@app.get("/api/chats", response_model=List[dict])
async def get_my_chats(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Retrieves ONLY the conversations owned by the authenticated user."""
    convs = (
        db.query(Conversation)
        .filter(Conversation.user_id == user_id)
        .order_by(Conversation.created_at.desc())
        .all()
    )
    return [_serialize_conversation(c, db) for c in convs]


@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Stores an uploaded PDF on disk and records its metadata in SQLite."""
    filename = f"{user_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_FOLDER, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    doc = Document(
        id=uuid.uuid4().hex,
        user_id=user_id,
        filename=file.filename,
        stored_filename=filename,
        file_path=file_path,
        status="uploaded",
        created_at=datetime.datetime.utcnow(),
    )
    db.add(doc)
    db.commit()

    return {
        "status": "success",
        "document_id": doc.id,
        "filename": file.filename,
    }


@app.post("/api/chat/{conversation_id}/attach")
async def attach_document(
    conversation_id: str,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Attach a PDF to a conversation so the assistant can answer from it."""
    conv = db.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation thread not found")
    if conv.user_id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this chat session")
    _gate_premium(db, user_id)  # blocked once free analyses are exhausted

    data = await file.read()
    try:
        text = extract_text_from_bytes(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Lecture du PDF impossible: {e}")

    if not text.strip():
        raise HTTPException(
            status_code=400,
            detail="Aucun texte exploitable (PDF scanne ? l'OCR n'est pas encore actif).",
        )

    # Persist the extracted text, linked to this conversation.
    cd = ChatDocument(
        id=uuid.uuid4().hex,
        conversation_id=conversation_id,
        user_id=user_id,
        filename=file.filename,
        text=text,
        created_at=datetime.datetime.utcnow(),
    )
    db.add(cd)

    # Add a visible confirmation bubble in the thread.
    note = {
        "role": "assistant",
        "content": f"📎 J'ai bien reçu **{file.filename}**. Pose-moi tes questions sur ce document.",
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }
    conv.messages = (conv.messages or []) + [note]
    db.commit()

    return {
        "status": "success",
        "filename": file.filename,
        "chars": len(text),
        "note_message": note,
    }


@app.post("/api/chat/{conversation_id}/ask")
async def ask_assistant(
    conversation_id: str,
    payload: AskRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Append the user's message, generate a RAG-grounded AI reply, save it, and
    return BOTH messages. This is what powers the live chat with the LLM."""
    conv = db.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation thread not found")
    if conv.user_id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this chat session")
    _gate_premium(db, user_id)  # blocked once free analyses are exhausted

    now = datetime.datetime.utcnow().isoformat()
    user_message = {"role": "user", "content": payload.content, "timestamp": now}

    # Pull any documents attached to THIS conversation -> grounding context.
    attached = (
        db.query(ChatDocument)
        .filter(ChatDocument.conversation_id == conversation_id)
        .all()
    )
    document_context = "\n\n".join(f"[{d.filename}]\n{d.text}" for d in attached)

    # Generate the grounded reply from the prior history (before this message).
    try:
        result = chat_assistant.answer(
            history=conv.messages or [],
            user_message=payload.content,
            language=payload.language,
            document_context=document_context,
        )
        reply_text = result["reply"] or "Je n'ai pas pu generer de reponse."
    except Exception as e:
        # Most common cause: GEMINI_API_KEY missing or quota exceeded.
        raise HTTPException(status_code=502, detail=f"Echec de la generation IA: {e}")

    assistant_message = {
        "role": "assistant",
        "content": reply_text,
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }

    # Persist both messages atomically.
    conv.messages = (conv.messages or []) + [user_message, assistant_message]
    db.commit()

    return {
        "status": "success",
        "user_message": user_message,
        "assistant_message": assistant_message,
        "sources": result.get("sources", []),
        "grounded": result.get("grounded", False),
    }


@app.post("/api/analyze")
async def analyze(
    payload: AnalyzeRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """RAG analysis: extract a contract, retrieve relevant Moroccan law, and
    return a structured, grounded analysis (summary, obligations, risks with
    law references, missing clauses, recommendations)."""
    # 1) Resolve the contract text from a document or raw text.
    if payload.text and payload.text.strip():
        contract_text = payload.text
    elif payload.document_id:
        doc = db.get(Document, payload.document_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        if doc.user_id != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized access to this document")
        try:
            contract_text = extract_text_from_pdf(doc.file_path)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Lecture du PDF impossible: {e}")
    else:
        raise HTTPException(status_code=400, detail="Fournir 'document_id' ou 'text'.")

    if not contract_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Aucun texte exploitable (PDF scanne ? l'OCR n'est pas encore actif).",
        )

    # 2) Enforce the free-analysis quota (freemium = 3 analyses).
    user = _get_or_create_user(db, user_id)
    if not _is_paid(user) and user.analyses_used >= FREE_ANALYSIS_LIMIT:
        raise _upgrade_required(
            "Vous avez utilisé vos 3 analyses gratuites. Passez au plan Pro pour analyser sans limite."
        )

    # 3) Run the RAG pipeline (calls Gemini).
    try:
        analysis = analyze_contract(contract_text, language=payload.language)
    except Exception as e:
        # Most common cause: GEMINI_API_KEY missing or quota exceeded.
        raise HTTPException(status_code=502, detail=f"Echec de l'analyse IA: {e}")

    # 4) Count this analysis against the free quota.
    if not _is_paid(user):
        user.analyses_used += 1
        db.commit()

    return {"status": "success", "analysis": analysis}


@app.post("/api/chat/{conversation_id}/analyze")
async def analyze_chat_document(
    conversation_id: str,
    language: str = "fr",
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Run the full structured RAG analysis on the document(s) attached to this
    conversation. Returns summary, obligations, risks (with severity + law refs),
    missing clauses and recommendations."""
    conv = db.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation thread not found")
    if conv.user_id != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this chat session")

    docs = (
        db.query(ChatDocument)
        .filter(ChatDocument.conversation_id == conversation_id)
        .all()
    )
    if not docs:
        raise HTTPException(
            status_code=400,
            detail="Aucun document à analyser. Joins d'abord un PDF avec 📎.",
        )

    # Enforce the free-analysis quota (freemium = 3 analyses).
    user = _get_or_create_user(db, user_id)
    if not _is_paid(user) and user.analyses_used >= FREE_ANALYSIS_LIMIT:
        raise _upgrade_required(
            "Vous avez utilisé vos 3 analyses gratuites. Passez au plan Pro pour analyser sans limite."
        )

    contract_text = "\n\n".join(d.text for d in docs)
    try:
        analysis = analyze_contract(contract_text, language=language)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Echec de l'analyse IA: {e}")

    # Count this analysis against the free quota.
    if not _is_paid(user):
        user.analyses_used += 1
        db.commit()

    return {
        "status": "success",
        "document": docs[-1].filename,
        "analysis": analysis,
        "analyses_remaining": None if _is_paid(user) else max(0, FREE_ANALYSIS_LIMIT - user.analyses_used),
    }


@app.get("/api/health")
async def health_check():
    """Lightweight liveness probe (no auth) for quick E2E checks."""
    return {"status": "ok", "engine": "sqlite"}
