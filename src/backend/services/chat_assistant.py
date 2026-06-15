"""Conversational legal assistant (RAG-grounded chat).

Given the conversation history + the user's new message, retrieves relevant
Moroccan-law snippets from ChromaDB and asks Gemini for a grounded reply.

Dependencies (store / embed_fn / generate_fn) are injectable for offline tests.
"""
from services import gemini_client
from services.vector_store import LegalVectorStore

# How many past turns to include for context (keeps prompts bounded).
HISTORY_TURNS = 8
QUERY_CHARS = 1500
# Max characters of the attached document injected into the prompt.
DOC_CONTEXT_CHARS = 12000

SYSTEM = """Tu es LegalEase, un assistant juridique specialise en droit marocain.
Tu reponds de maniere claire, pedagogique et bilingue (francais / arabe selon la
langue de l'utilisateur). Appuie-toi en priorite sur les EXTRAITS DE LOI fournis
et cite l'article quand c'est pertinent. Si l'information n'est pas dans les
extraits, reponds avec prudence et precise que ce n'est pas une garantie
juridique. Termine si utile par une courte recommandation actionnable."""


def _build_prompt(history, user_message, law_context, language, document_context=""):
    convo = "\n".join(
        f"{'Utilisateur' if m.get('role') == 'user' else 'Assistant'}: {m.get('content', '')}"
        for m in history[-HISTORY_TURNS:]
    )
    law_block = law_context.strip() or "(Aucun extrait de loi pertinent trouve.)"

    doc_section = ""
    if document_context.strip():
        doc_section = (
            "=== DOCUMENT DE L'UTILISATEUR (SOURCE PRIORITAIRE) ===\n"
            "Reponds en te basant EN PRIORITE sur ce document. Cite/recopie les "
            "passages pertinents quand c'est utile.\n"
            f"{document_context[:DOC_CONTEXT_CHARS]}\n\n"
        )

    return (
        f"{SYSTEM}\n\nLangue de reponse souhaitee: {language}\n\n"
        f"{doc_section}"
        f"=== EXTRAITS DE LOI (SOURCES SECONDAIRES) ===\n{law_block}\n\n"
        f"=== HISTORIQUE DE LA CONVERSATION ===\n{convo or '(debut de conversation)'}\n\n"
        f"=== NOUVELLE QUESTION DE L'UTILISATEUR ===\n{user_message}\n\n"
        f"Reponds maintenant en tant qu'Assistant LegalEase :"
    )


def answer(
    history,
    user_message,
    language: str = "fr",
    document_context: str = "",
    k: int = 4,
    store=None,
    embed_fn=None,
    generate_fn=None,
) -> dict:
    user_message = (user_message or "").strip()
    if not user_message:
        raise ValueError("Message vide.")

    store = store if store is not None else LegalVectorStore()
    embed_fn = embed_fn or (
        lambda texts: gemini_client.embed_texts(texts, task_type="RETRIEVAL_QUERY")
    )
    generate_fn = generate_fn or gemini_client.generate_text

    law_hits = []
    if store.count() > 0:
        law_hits = store.query(embed_fn([user_message[:QUERY_CHARS]])[0], n_results=k)

    law_context = "\n\n".join(
        f"[Source {i + 1}] {h['text']}" for i, h in enumerate(law_hits)
    )
    prompt = _build_prompt(history or [], user_message, law_context, language, document_context)
    reply = (generate_fn(prompt) or "").strip()

    return {
        "reply": reply,
        "sources": [
            {"text": h["text"][:300], "metadata": h.get("metadata", {})}
            for h in law_hits
        ],
        "grounded": bool(law_hits),
        "used_document": bool(document_context.strip()),
    }
