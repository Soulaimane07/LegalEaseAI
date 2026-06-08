import chromadb

client = chromadb.PersistentClient(path="./chroma_db")

collection = client.get_or_create_collection(
    name="legal_documents"
)

collection.add(
    documents=[chunk],
    embeddings=[embedding],
    ids=[chunk_id]
)