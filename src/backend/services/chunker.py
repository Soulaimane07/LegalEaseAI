"""Split long legal text into overlapping chunks for embedding/retrieval.

Overlap keeps an article that straddles a chunk boundary retrievable from
either side. Paragraph-aware: we try to break on blank lines first.
"""


def chunk_text(text: str, size: int = 1200, overlap: int = 150) -> list:
    text = (text or "").strip()
    if not text:
        return []
    if overlap >= size:
        overlap = size // 4

    chunks = []
    start = 0
    n = len(text)
    while start < n:
        end = min(start + size, n)

        # Prefer to cut on a paragraph/sentence boundary near the end.
        if end < n:
            window = text[start:end]
            for sep in ("\n\n", "\n", ". ", " "):
                idx = window.rfind(sep)
                if idx > size * 0.5:  # only if the break isn't too early
                    end = start + idx + len(sep)
                    break

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= n:
            break
        start = max(end - overlap, start + 1)

    return chunks
