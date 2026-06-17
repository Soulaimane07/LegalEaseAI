"""Thin wrapper around the Google Gemini API (google-genai SDK).

Isolates ALL Gemini calls in one place so:
  - model names / config live in a single spot (env-overridable), and
  - tests can monkeypatch `embed_texts` / `generate_json` with fakes.

Set your key before running the backend or the ingestion script:
    export GEMINI_API_KEY="..."        # from https://aistudio.google.com/apikey
Optional overrides:
    export GEMINI_MODEL="gemini-2.5-flash"
    export GEMINI_EMBED_MODEL="gemini-embedding-001"
"""
import os
import time
from functools import lru_cache

from google import genai
from google.genai import types

# Defaults are known free-tier models; override via env if Google renames them.
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash").strip()
GEMINI_EMBED_MODEL = os.environ.get("GEMINI_EMBED_MODEL", "gemini-embedding-001").strip()

# Embedding batch size (one API call per batch keeps us under free-tier RPM).
EMBED_BATCH_SIZE = int(os.environ.get("GEMINI_EMBED_BATCH", "50"))


@lru_cache(maxsize=1)
def _client() -> "genai.Client":
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY manquante. Recupere une cle gratuite sur "
            "https://aistudio.google.com/apikey puis: export GEMINI_API_KEY=..."
        )
    return genai.Client(api_key=api_key)


def _embed_one(text: str, task_type: str, retries: int = 3) -> list:
    """Embed a single string, retrying on transient/rate-limit errors."""
    client = _client()
    for attempt in range(retries):
        try:
            r = client.models.embed_content(
                model=GEMINI_EMBED_MODEL,
                contents=text or " ",
                config=types.EmbedContentConfig(task_type=task_type),
            )
            return list(r.embeddings[0].values)
        except Exception:
            if attempt == retries - 1:
                raise
            time.sleep(2 * (attempt + 1))  # simple backoff


def embed_texts(texts, task_type: str = "RETRIEVAL_DOCUMENT") -> list:
    """Embed a list of strings -> list of float vectors.

    task_type should be RETRIEVAL_DOCUMENT for indexed law chunks and
    RETRIEVAL_QUERY for the contract query (Gemini optimizes each differently).
    """
    if isinstance(texts, str):
        texts = [texts]
    return [_embed_one(t, task_type) for t in texts]


def _generate(config, prompt: str, retries: int = 4) -> str:
    """Run generate_content with backoff on transient errors (503/429/overload)."""
    client = _client()
    for attempt in range(retries):
        try:
            resp = client.models.generate_content(
                model=GEMINI_MODEL, contents=prompt, config=config
            )
            return resp.text
        except Exception as e:
            msg = str(e)
            transient = any(
                code in msg for code in ("503", "429", "UNAVAILABLE", "overloaded", "high demand")
            )
            if attempt == retries - 1 or not transient:
                raise
            time.sleep(2 * (attempt + 1))  # 2s, 4s, 6s


def generate_json(prompt: str) -> str:
    """Call the LLM and return raw text constrained to JSON output."""
    return _generate(
        types.GenerateContentConfig(
            response_mime_type="application/json", temperature=0.2
        ),
        prompt,
    )


def generate_text(prompt: str, temperature: float = 0.3) -> str:
    """Call the LLM for a free-form conversational answer (plain text)."""
    return _generate(types.GenerateContentConfig(temperature=temperature), prompt)
