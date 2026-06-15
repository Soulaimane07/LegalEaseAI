"""RAG orchestration: retrieve relevant law, then ask Gemini for a structured,
grounded analysis of a contract.

The two external dependencies (embedding + generation) are injectable so the
whole pipeline can be unit-tested offline with fakes.
"""
import json

from services import gemini_client
from services.vector_store import LegalVectorStore

# Max characters of the contract used to BUILD THE RETRIEVAL QUERY.
QUERY_CHARS = 3000
# Max characters of the contract sent to the LLM (keeps prompts bounded).
CONTRACT_CHARS = 18000


SYSTEM_INSTRUCTIONS = """Tu es un analyste juridique expert en droit marocain.
Analyse le CONTRAT ci-dessous en t'appuyant UNIQUEMENT sur les EXTRAITS DE LOI
fournis comme source. Si une information n'est pas couverte par les extraits,
dis-le explicitement plutot que d'inventer.

Reponds STRICTEMENT en JSON valide, dans la langue demandee ({language}),
avec EXACTEMENT cette structure :
{{
  "summary": "resume clair et vulgarise du contrat",
  "language": "{language}",
  "obligations": ["obligation 1", "obligation 2"],
  "risks": [
    {{
      "clause": "clause ou point concerne",
      "severity": "faible | moyen | eleve",
      "explanation": "pourquoi c'est un risque, en langage simple",
      "law_reference": "article/source de loi parmi les extraits, ou '' si aucun"
    }}
  ],
  "missing_clauses": ["clause importante absente 1"],
  "recommendations": ["recommandation actionnable 1"]
}}
N'ajoute aucun texte hors du JSON."""


def _build_prompt(contract_text: str, law_context: str, language: str) -> str:
    law_block = law_context.strip() or "(Aucun extrait de loi pertinent trouve dans la base.)"
    return (
        SYSTEM_INSTRUCTIONS.format(language=language)
        + "\n\n=== EXTRAITS DE LOI (SOURCES) ===\n"
        + law_block
        + "\n\n=== CONTRAT A ANALYSER ===\n"
        + contract_text[:CONTRACT_CHARS]
    )


def _parse_json(raw: str) -> dict:
    """Robustly parse the model output into a dict."""
    text = (raw or "").strip()
    if text.startswith("```"):
        # Strip ```json ... ``` fences if present.
        text = text.split("```", 2)[1]
        if text.lower().startswith("json"):
            text = text[4:]
        text = text.strip().rstrip("`").strip()
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except Exception:
        pass
    # Fallback: never crash the endpoint — return a minimal valid shape.
    return {
        "summary": (raw or "")[:500],
        "obligations": [],
        "risks": [],
        "missing_clauses": [],
        "recommendations": [],
        "parse_error": True,
    }


def retrieve_law(query_text: str, store, embed_fn, k: int = 5) -> list:
    query_vec = embed_fn([query_text[:QUERY_CHARS]])[0]
    return store.query(query_vec, n_results=k)


def analyze_contract(
    contract_text: str,
    language: str = "fr",
    k: int = 5,
    store=None,
    embed_fn=None,
    generate_fn=None,
) -> dict:
    """Full RAG analysis. Inject store/embed_fn/generate_fn in tests."""
    contract_text = (contract_text or "").strip()
    if not contract_text:
        raise ValueError("Contrat vide : aucun texte a analyser.")

    store = store if store is not None else LegalVectorStore()
    embed_fn = embed_fn or (
        lambda texts: gemini_client.embed_texts(texts, task_type="RETRIEVAL_QUERY")
    )
    generate_fn = generate_fn or gemini_client.generate_json

    # 1) Retrieve grounding law (skip gracefully if the index is empty).
    law_hits = []
    if store.count() > 0:
        law_hits = retrieve_law(contract_text, store, embed_fn, k=k)

    law_context = "\n\n".join(
        f"[Source {i + 1}] {h['text']}" for i, h in enumerate(law_hits)
    )

    # 2) Generate the structured analysis.
    prompt = _build_prompt(contract_text, law_context, language)
    raw = generate_fn(prompt)
    data = _parse_json(raw)

    # 3) Attach which law snippets were used as grounding (traceability).
    data.setdefault("language", language)
    data["sources"] = [
        {"text": h["text"][:300], "metadata": h.get("metadata", {})}
        for h in law_hits
    ]
    data["grounded"] = bool(law_hits)
    return data
