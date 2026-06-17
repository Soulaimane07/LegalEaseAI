"""Embeddings facade — delegates to the Gemini wrapper.

Kept as a separate module so callers import a stable name; the underlying
provider can change without touching the rest of the code.
"""
from services.gemini_client import embed_texts


def embed_documents(texts):
    """Embed law/document chunks (indexed side)."""
    return embed_texts(texts, task_type="RETRIEVAL_DOCUMENT")


def embed_query(text):
    """Embed a single search query (contract side). Returns one vector."""
    return embed_texts([text], task_type="RETRIEVAL_QUERY")[0]
