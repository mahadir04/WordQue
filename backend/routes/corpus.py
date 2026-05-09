from fastapi import APIRouter, HTTPException, Depends
from models import CorpusResponse, DeleteResponse, DocumentInfo
from services.embedder import get_vector_store
from routes.auth import get_current_user

router = APIRouter(prefix="/api", tags=["corpus"])


@router.get("/corpus", response_model=CorpusResponse)
async def list_corpus(current_user: dict = Depends(get_current_user)):
    """List all documents in the corpus for the current user."""
    store = get_vector_store()
    docs = store.get_all_docs(user_id=current_user["id"])
    return CorpusResponse(
        documents=[DocumentInfo(**d) for d in docs],
        total_chunks=store.total_chunks,
    )


@router.delete("/corpus/{doc_id}", response_model=DeleteResponse)
async def delete_document(doc_id: str, current_user: dict = Depends(get_current_user)):
    """Remove a document from the corpus (only if owned by user)."""
    store = get_vector_store()

    if doc_id not in store.doc_metadata:
        raise HTTPException(404, f"Document not found: {doc_id}")
        
    if store.doc_metadata[doc_id].get("user_id") != current_user["id"]:
        raise HTTPException(403, "You do not have permission to delete this document.")

    store.remove_document(doc_id, user_id=current_user["id"])

    return DeleteResponse(
        deleted=doc_id,
        remaining_docs=len(store.get_all_docs(user_id=current_user["id"])),
    )


@router.get("/dashboard/insights")
async def get_dashboard_insights():
    """Generate dynamic insights from the current corpus."""
    store = get_vector_store()
    docs = store.get_all_docs()
    
    if not docs:
        return {"insights": [], "feed": []}

    # Pick 2-3 most recent documents
    recent_docs = sorted(docs, key=lambda x: x.get("doc_id", ""), reverse=True)[:3]
    
    insights = []
    for d in recent_docs:
        insights.append({
            "text": f"Review {d['filename']} — Classified as {d.get('doc_type', 'document')}",
            "doc_id": d["doc_id"]
        })

    # Mock feed for now but based on real docs
    feed = [
        {
            "tag": d.get("doc_type", "General").title(),
            "time": "Just now",
            "content": f"Successfully indexed {d['filename']}. {d.get('chunk_count', 0)} chunks available for RAG."
        } for d in recent_docs[:2]
    ]

    return {"insights": insights, "feed": feed}
@router.get("/search")
async def search_corpus(q: str, current_user: dict = Depends(get_current_user)):
    """Semantic search across all documents for the current user."""
    if not q:
        return {"results": []}
        
    store = get_vector_store()
    results = store.search(q, k=5, user_id=current_user["id"])
    
    formatted_results = []
    for res in results:
        formatted_results.append({
            "content": res["content"],
            "doc_id": res["metadata"].get("doc_id"),
            "filename": res["metadata"].get("filename"),
            "page": res["metadata"].get("page"),
            "score": res.get("score")
        })
        
    return {"results": formatted_results}
