"""Upload routes — batch PDF upload with document type detection."""
import os
import traceback
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from models import UploadResponse, DocumentInfo
from services.pdf_parser import process_pdf
from services.embedder import get_vector_store, EmbeddingError
from services.doc_classifier import classify_document
from routes.auth import get_current_user
from fastapi import Depends

router = APIRouter(prefix="/api", tags=["upload"])

MAX_FILES = 10
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("/upload", response_model=UploadResponse)
async def upload_pdfs(
    files: list[UploadFile] = File(...),
    session_id: str = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Upload 1–10 PDFs, detect content type, and index into the vector store."""
    user_id = current_user["id"]
    if len(files) > MAX_FILES:
        raise HTTPException(400, f"Max {MAX_FILES} files per upload")

    store = get_vector_store()
    documents = []
    errors = []

    async def process_file(file: UploadFile):
        """Helper to process a single file concurrently."""
        if not file.filename.lower().endswith(".pdf"):
            return None, f"Only PDF files are accepted: {file.filename}"

        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            return None, f"File too large: {file.filename} (max 50MB)"
        if len(content) == 0:
            return None, f"Empty file: {file.filename}"

        try:
            doc_id, chunks, metadata = process_pdf(content, file.filename, user_id=user_id)
            
            # Save the PDF to disk for the frontend preview drawer
            pdf_filename = f"{doc_id}.pdf"
            pdf_path = os.path.join("data", "pdfs", pdf_filename)
            with open(pdf_path, "wb") as f:
                f.write(content)
            
            metadata["pdf_url"] = f"/pdfs/{pdf_filename}"
            
            if chunks:
                sample_text = " ".join(c["text"] for c in chunks[:8])
                doc_type = classify_document(sample_text)
            else:
                doc_type = "textbook"

            metadata["doc_type"] = doc_type
            metadata["session_id"] = session_id
            metadata["user_id"] = user_id

            for chunk in chunks:
                chunk["doc_type"] = doc_type
                chunk["session_id"] = session_id
                chunk["user_id"] = user_id

            # Check if document already exists
            if doc_id in store.doc_metadata:
                return DocumentInfo(**store.doc_metadata[doc_id]), None

            # ── Embed and index (Async) ──
            await store.add_chunks_async(chunks, metadata)
            return DocumentInfo(**metadata), None

        except EmbeddingError as e:
            return None, f"Embedding failed for '{file.filename}': {str(e)}"
        except Exception as e:
            print(f"❌ Error processing {file.filename}: {traceback.format_exc()}")
            return None, f"Failed to index '{file.filename}': {str(e)}"

    import asyncio
    results = await asyncio.gather(*(process_file(f) for f in files))
    
    for doc, err in results:
        if doc:
            documents.append(doc)
        if err:
            errors.append(err)

    if errors and not documents:
        raise HTTPException(422, detail="; ".join(errors))

    if documents and session_id:
        from database import get_db
        import uuid
        import json
        
        db = await get_db()
        try:
            for doc in documents:
                msg_id = f"msg_{uuid.uuid4().hex[:8]}"
                content = f"I have received and indexed the document: **{doc.filename}**. What would you like to know about it?"
                await db.execute(
                    "INSERT INTO chat_messages (id, session_id, role, content, citations, doc_type) VALUES (?, ?, ?, ?, ?, ?)",
                    (msg_id, session_id, "assistant", content, json.dumps([]), doc.doc_type)
                )
            await db.commit()
        except Exception as e:
            print(f"Failed to insert upload message into chat: {e}")
        finally:
            await db.close()

    return UploadResponse(
        documents=documents,
        total_chunks=store.total_chunks,
        errors=errors if errors else None
    )
