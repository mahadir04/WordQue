"""Summarize routes — document or corpus summarization."""
from fastapi import APIRouter, Depends
from models import SummarizeRequest, SummarizeResponse
from services.llm_chain import summarize_document
from routes.auth import get_current_user

router = APIRouter(prefix="/api", tags=["summarize"])


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(request: SummarizeRequest, current_user: dict = Depends(get_current_user)):
    """Summarize a single document or the entire corpus."""
    result = await summarize_document(doc_id=request.doc_id, user_id=current_user["id"])
    return SummarizeResponse(**result)
