"""PDF text extraction (PyMuPDF). No OCR for now — digital/text PDFs only."""
import fitz  # PyMuPDF


def extract_text_from_pdf(path: str) -> str:
    """Extract plain text from a PDF file on disk."""
    doc = fitz.open(path)
    try:
        return "\n".join(page.get_text() for page in doc).strip()
    finally:
        doc.close()


def extract_text_from_bytes(data: bytes) -> str:
    """Extract plain text from in-memory PDF bytes."""
    doc = fitz.open(stream=data, filetype="pdf")
    try:
        return "\n".join(page.get_text() for page in doc).strip()
    finally:
        doc.close()


# Backwards-compatible alias (old name used in early prototype).
def extract_text(pdf_path: str) -> str:
    return extract_text_from_pdf(pdf_path)
