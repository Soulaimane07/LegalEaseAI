def chunk_text(text, size=1000):

    chunks = []

    for i in range(0, len(text), size):
        chunks.append(text[i:i+size])

    return chunks