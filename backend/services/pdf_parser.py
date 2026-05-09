"""PDF text extraction and chunking using PyMuPDF."""
import fitz  # PyMuPDF
import hashlib
import os
from typing import BinaryIO


def generate_doc_id(filename: str, content_bytes: bytes, user_id: str = "global") -> str:
    """Generate a stable document ID from filename + content hash + user_id."""
    h = hashlib.sha256(content_bytes[:4096]).hexdigest()[:10]
    safe = filename.replace(" ", "_").split(".")[0][:15]
    user_suffix = user_id[:8]
    return f"{safe}_{user_suffix}_{h}"


def extract_text_from_pdf(pdf_bytes: bytes, filename: str) -> dict:
    """
    Extract text from a PDF and return structured page data.

    Returns:
        {
            "filename": str,
            "page_count": int,
            "pages": [{"page": int, "text": str}, ...]
        }
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = []
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text("text")
        if text.strip():
            pages.append({"page": page_num + 1, "text": text.strip()})
    page_count = len(doc)
    doc.close()

    return {
        "filename": filename,
        "page_count": page_count,
        "pages": pages,
    }


def chunk_document(
    doc_data: dict,
    doc_id: str,
    chunk_size: int = 1000,
    overlap: int = 100,
) -> list[dict]:
    """
    Split extracted PDF pages into overlapping text chunks.

    Each chunk includes metadata:
        - doc_id, filename, page, text, chunk_index
    """
    chunks = []
    chunk_index = 0

    for page_data in doc_data["pages"]:
        text = page_data["text"]
        page = page_data["page"]

        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk_text = text[start:end]

            if len(chunk_text.strip()) > 20:  # skip tiny fragments
                chunks.append({
                    "doc_id": doc_id,
                    "filename": doc_data["filename"],
                    "page": page,
                    "text": chunk_text.strip(),
                    "chunk_index": chunk_index,
                })
                chunk_index += 1

            start += chunk_size - overlap

    return chunks


def process_pdf(pdf_bytes: bytes, filename: str, user_id: str = "global") -> tuple[str, list[dict], dict]:
    """
    Full pipeline: extract → chunk → return (doc_id, chunks, metadata).
    """
    doc_id = generate_doc_id(filename, pdf_bytes, user_id)
    doc_data = extract_text_from_pdf(pdf_bytes, filename)

    # Fix page_count (doc is closed, so use pages list length)
    doc_data["page_count"] = len(doc_data["pages"])

    chunks = chunk_document(doc_data, doc_id)

    metadata = {
        "doc_id": doc_id,
        "filename": filename,
        "page_count": doc_data["page_count"],
        "chunk_count": len(chunks),
        "size_bytes": len(pdf_bytes),
        "user_id": user_id
    }

    return doc_id, chunks, metadata
