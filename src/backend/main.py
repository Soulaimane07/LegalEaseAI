import os
import datetime
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import firebase_admin
from firebase_admin import credentials, firestore, auth
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# --- INITIALIZE FIREBASE ADMIN ENGINE ---
cred_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")

if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

app = FastAPI(title="LegalEase AI - Firestore Engine")
security = HTTPBearer()

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

# Added Schema for handling Title Updates
class ConversationUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100, description="The new custom title for the chat session")

# --- AUTH DEPENDENCY (THE GATEKEEPER) ---
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

# --- SECURE FIRESTORE ENDPOINTS ---

@app.post("/api/chat/new")
async def create_conversation(
    payload: ConversationCreate, 
    user_id: str = Depends(get_current_user_id)
):
    """Creates a secure conversation document mapped directly to the verified user account."""
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
    """Safely appends a message bubble directly inside the Firestore Document array."""
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
    """Retrieves all data and complete message list from a protected Firestore document."""
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
    """Updates the title field of a conversation if the requester owns the document."""
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
    """Permanently deletes a conversation log from Firestore if the requester owns it."""
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
    """Retrieves every chat session from the database globally without authentication."""
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