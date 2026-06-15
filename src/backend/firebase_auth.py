"""Verify Firebase ID tokens WITHOUT any service account private key.

Firebase ID tokens are JWTs signed by Google. Verifying them only needs:
  - Google's PUBLIC signing certificates (fetched from a public URL), and
  - the Firebase Project ID (public, not a secret — it is in firebaseConfig).

So this works even when the organization policy
`iam.disableServiceAccountKeyCreation` blocks generating serviceAccountKey.json.
No private key, no firebase-admin, no Firestore, no credit card.

Set the project id once before launching the backend:
    export FIREBASE_PROJECT_ID="your-project-id"
"""
import os

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "").strip()

# Reusable transport — caches Google's public certs between verifications.
_request = google_requests.Request()


def verify_firebase_token(token: str) -> str:
    """Return the verified user's uid, or raise ValueError/RuntimeError."""
    if not FIREBASE_PROJECT_ID:
        raise RuntimeError(
            "Variable d'environnement FIREBASE_PROJECT_ID manquante. "
            "Definis-la avec le Project ID Firebase (public), ex: "
            "export FIREBASE_PROJECT_ID=legalease-ai"
        )

    # Validates signature against Firebase public certs AND audience == project id.
    claims = id_token.verify_firebase_token(
        token, _request, audience=FIREBASE_PROJECT_ID
    )

    # Defense in depth: the issuer must be the Firebase secure token service.
    expected_iss = f"https://securetoken.google.com/{FIREBASE_PROJECT_ID}"
    if claims.get("iss") != expected_iss:
        raise ValueError("Invalid token issuer")

    uid = claims.get("user_id") or claims.get("sub")
    if not uid:
        raise ValueError("Token does not contain a user id")

    return uid
