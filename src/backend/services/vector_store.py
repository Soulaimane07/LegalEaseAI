"""ChromaDB persistent vector store for the Moroccan-law knowledge base.

We pass PRE-COMPUTED embeddings (from Gemini) so Chroma never needs its own
embedding model. Cosine space matches Gemini embeddings.
"""
import os

import chromadb

DEFAULT_PATH = os.path.join(os.path.dirname(__file__), "..", "chroma_db")
DEFAULT_COLLECTION = "moroccan_law"


class LegalVectorStore:
    def __init__(self, path: str = None, collection_name: str = DEFAULT_COLLECTION):
        self.client = chromadb.PersistentClient(path=path or DEFAULT_PATH)
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
        )

    def add(self, ids, documents, embeddings, metadatas=None):
        self.collection.add(
            ids=list(ids),
            documents=list(documents),
            embeddings=[list(e) for e in embeddings],
            metadatas=metadatas,
        )

    def query(self, query_embedding, n_results: int = 5) -> list:
        if self.count() == 0:
            return []
        res = self.collection.query(
            query_embeddings=[list(query_embedding)],
            n_results=min(n_results, self.count()),
        )
        docs = (res.get("documents") or [[]])[0]
        metas = (res.get("metadatas") or [[]])[0] or [{}] * len(docs)
        dists = (res.get("distances") or [[]])[0] or [None] * len(docs)
        return [
            {"text": d, "metadata": m or {}, "distance": dist}
            for d, m, dist in zip(docs, metas, dists)
        ]

    def count(self) -> int:
        return self.collection.count()

    def reset(self):
        """Drop and recreate the collection (used by the ingestion script)."""
        name = self.collection.name
        self.client.delete_collection(name)
        self.collection = self.client.get_or_create_collection(
            name=name, metadata={"hnsw:space": "cosine"}
        )
