"""Build the Moroccan-law knowledge base into ChromaDB.

Usage:
    export GEMINI_API_KEY=...
    python ingest_laws.py "../../docs/Lois et Décrets.pdf" --reset
    python ingest_laws.py "../../docs/Lois et Décrets.pdf" --max-chunks 50   # quick test

No OCR: the source PDF must be a digital/text PDF.
"""
import argparse
import os
import sys
import time

from services.parser import extract_text_from_pdf
from services.chunker import chunk_text
from services.gemini_client import embed_texts, EMBED_BATCH_SIZE
from services.vector_store import LegalVectorStore


def ingest(pdf_path: str, reset: bool, max_chunks: int | None, batch_size: int):
    if not os.path.exists(pdf_path):
        sys.exit(f"Fichier introuvable : {pdf_path}")

    source = os.path.basename(pdf_path)
    print(f"[1/4] Extraction du texte de '{source}' ...")
    text = extract_text_from_pdf(pdf_path)
    print(f"      {len(text):,} caracteres extraits.")
    if not text:
        sys.exit("Aucun texte extrait (PDF scanne ? l'OCR n'est pas encore active).")

    print("[2/4] Decoupage en chunks ...")
    chunks = chunk_text(text)
    if max_chunks:
        chunks = chunks[:max_chunks]
    print(f"      {len(chunks)} chunks.")

    store = LegalVectorStore()
    if reset:
        print("      Reinitialisation de la collection ...")
        store.reset()

    print(f"[3/4] Embeddings + indexation (batch={batch_size}) ...")
    start = time.time()
    done = 0
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        vectors = embed_texts(batch, task_type="RETRIEVAL_DOCUMENT")
        ids = [f"{source}::chunk-{i + j}" for j in range(len(batch))]
        metadatas = [{"source": source, "chunk": i + j} for j in range(len(batch))]
        store.add(ids=ids, documents=batch, embeddings=vectors, metadatas=metadatas)
        done += len(batch)
        print(f"      {done}/{len(chunks)} indexes ...", flush=True)

    print(f"[4/4] Termine en {time.time() - start:.1f}s. "
          f"Total dans la base : {store.count()} chunks.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf", help="Chemin du PDF de lois")
    ap.add_argument("--reset", action="store_true", help="Vider la collection avant")
    ap.add_argument("--max-chunks", type=int, default=None, help="Limiter (test rapide)")
    ap.add_argument("--batch-size", type=int, default=EMBED_BATCH_SIZE)
    args = ap.parse_args()
    ingest(args.pdf, args.reset, args.max_chunks, args.batch_size)
