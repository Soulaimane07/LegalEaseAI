import os
import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import firebase_admin
from firebase_admin import credentials, firestore, auth
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from fastapi import UploadFile, File
import shutil

# --- INITIALIZE FIREBASE ADMIN ENGINE ---
cred_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")

if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

app = FastAPI(title="LegalEase AI - Firestore Engine")
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

# --- PYDANTIC SCHEMAS ---
class MessageModel(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str
    timestamp: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

class ConversationCreate(BaseModel):
    title: str = Field(default="New Legal Consultation")

class ConversationUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="The new custom title for the chat session")

# UPDATED: Added 'subscribed' to allowed values
class SubscriptionUpdate(BaseModel):
    plan: str = Field(..., description="Must be 'freemium', 'premium', or 'subscribed'")


# --- SUBSCRIPTION LAYER & AUTH ---

async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extracts and verifies the Firebase ID token from the Authorization header."""
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token.get("uid")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Authorization Token: {str(e)}"
        )

async def get_user_tier(user_id: str = Depends(get_current_user_id)) -> str:
    """
    Fetches the user's subscription plan from Firestore. 
    If the user profile does not exist yet, it safely creates one with the default 'freemium' plan.
    """
    user_ref = db.collection("users").document(user_id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        default_profile = {
            "user_id": user_id,
            "plan": "freemium",
            "updated_at": datetime.datetime.utcnow()
        }
        user_ref.set(default_profile)
        return "freemium"
    
    return user_doc.to_dict().get("plan", "freemium")

# UPDATED: Changed condition to check for your new target tier value: 'subscribed'
def require_premium(tier: str = Depends(get_user_tier)):
    """Dependency modifier used to fence off endpoints exclusively for paid/subscribed accounts."""
    if tier not in ["subscribed", "premium"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feature requires an active Subscribed account status."
        )


# --- SUBSCRIPTION MANAGEMENT ENDPOINTS ---

@app.get("/api/user/profile")
async def get_user_profile(
    user_id: str = Depends(get_current_user_id), 
    tier: str = Depends(get_user_tier)
):
    """Returns the logged-in user's account registration details and current tier."""
    return {"user_id": user_id, "subscription_plan": tier}


@app.patch("/api/user/subscription")
async def update_subscription_plan(
    payload: SubscriptionUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Updates a user's operational tier to 'subscribed' following confirmation signals."""
    if payload.plan not in ["freemium", "premium", "subscribed"]:
        raise HTTPException(status_code=400, detail="Invalid subscription plan configuration assigned.")
        
    user_ref = db.collection("users").document(user_id)
    user_ref.set({
        "user_id": user_id,
        "plan": payload.plan,
        "updated_at": datetime.datetime.utcnow()
    }, merge=True)
    
    return {"status": "success", "updated_plan": payload.plan}


# --- SECURE FIRESTORE ENDPOINTS ---

@app.post("/api/chat/new")
async def create_conversation(
    payload: ConversationCreate, 
    user_id: str = Depends(get_current_user_id),
    tier: str = Depends(get_user_tier)
):
    """Creates a conversation document. Enforces slot limits for freemium tiers."""
    
    # UPDATED: Checks if the user is still stuck on the free plan tier
    if tier == "freemium":
        existing_chats = db.collection("conversations").where("user_id", "==", user_id).get()
        
        if len(existing_chats) >= 3:  
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Freemium users are capped at 3 conversation slots. Please upgrade to premium for infinite access."
            )

    conversation_data = {
        "user_id": user_id, 
        "title": payload.title,
        "created_at": datetime.datetime.utcnow(),
        "messages": [] 
    }
    
    _, doc_ref = db.collection("conversations").add(conversation_data)
    return {"conversation_id": doc_ref.id, "status": "created"}


@app.post("/api/chat/{conversation_id}/message")
async def append_message(
    conversation_id: str,
    message: MessageModel,
    user_id: str = Depends(get_current_user_id)
):
    doc_ref = db.collection("conversations").document(conversation_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Conversation thread not found")
        
    if doc.to_dict().get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this chat session")

    serialized_message = {
        "role": message.role,
        "content": message.content,
        "timestamp": message.timestamp
    }

    doc_ref.update({
        "messages": firestore.ArrayUnion([serialized_message])
    })
    return {"status": "success"}


@app.get("/api/chat/{conversation_id}")
async def get_conversation_history(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id)
):
    doc_ref = db.collection("conversations").document(conversation_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Conversation history not found")
        
    data = doc.to_dict()
    if data.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    return data


@app.patch("/api/chat/{conversation_id}")
async def rename_conversation(
    conversation_id: str,
    payload: ConversationUpdate,
    user_id: str = Depends(get_current_user_id)
):
    doc_ref = db.collection("conversations").document(conversation_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Conversation thread not found")

    if doc.to_dict().get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized modification request")

    doc_ref.update({"title": payload.title})
    return {"status": "updated", "new_title": payload.title}


@app.delete("/api/chat/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id)
):
    doc_ref = db.collection("conversations").document(conversation_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Conversation thread not found")

    if doc.to_dict().get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized deletion request")

    doc_ref.delete()
    return {"status": "deleted", "conversation_id": conversation_id}


@app.get("/api/chats/all", response_model=List[dict])
async def get_all_global_chats():
    try:
        chats_ref = db.collection("conversations").order_by(
            "created_at", direction=firestore.Query.DESCENDING
        )
        docs = chats_ref.stream()
        
        all_chats = []
        for doc in docs:
            data = doc.to_dict()
            chat_summary = {
                "id": doc.id,
                "user_id": data.get("user_id"), 
                "title": data.get("title", "Global Conversation"),
                "created_at": data.get("created_at"),
                "messages": data.get("messages", []) 
            }
            all_chats.append(chat_summary)
            
        return all_chats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch global database records: {str(e)}"
        )


# --- PREMIUM ONLY BOUNDARY ---

@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    _=Depends(require_premium)  
):
    filename = f"{user_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_FOLDER, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    doc_ref = db.collection("documents").document()

    doc_ref.set({
        "user_id": user_id,
        "filename": file.filename,
        "stored_filename": filename,
        "file_path": file_path,
        "status": "uploaded",
        "created_at": datetime.datetime.utcnow()
    })

    return {
        "status": "success",
        "document_id": doc_ref.id,
        "filename": file.filename
    }