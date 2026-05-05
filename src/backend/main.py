import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from pydantic import BaseModel
from typing import Optional

app = FastAPI(
    title="LegalEase AI Backend (Pure FastAPI)",
    version="1.0.0"
)

# Configure CORS for your development domains
origins = [
    "http://localhost:5173",
    "https://silver-fiesta-p5x6gpxv5w9c7p9r-5173.app.github.dev", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# Replace this with your Google Client ID (found in your Google Cloud Console / Firebase config)
# It usually ends with .apps.googleusercontent.com
GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"

class UserProfile(BaseModel):
    uid: str
    email: Optional[str] = None
    name: Optional[str] = None
    picture: Optional[str] = None

# Authentication Gate: Verifies Google Identity Tokens directly
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserProfile:
    token = credentials.credentials
    try:
        # Verify the token against Google's public key infrastructure
        id_info = id_token.verify_oauth2_token(
            token, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID
        )

        # Ensure the token issuer is Google
        if id_info['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')

        # Return clean user information
        return UserProfile(
            uid=id_info.get("sub"), # 'sub' is the unique Google User ID
            email=id_info.get("email"),
            name=id_info.get("name"),
            picture=id_info.get("picture")
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid backend authorization: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

# --- ENDPOINTS ---

@app.get("/")
async def root():
    return {"message": "LegalEase AI Engine Online"}

@app.get("/api/protected-data", response_model=UserProfile)
async def get_secure_dashboard_data(current_user: UserProfile = Depends(get_current_user)):
    """
    Locked down endpoint. Only accessible with a valid Google login token from React.
    """
    return current_user