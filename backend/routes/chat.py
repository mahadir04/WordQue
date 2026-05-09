"""Chat routes — RAG Q&A with history persistence."""
import uuid
import json
from fastapi import APIRouter, Depends
from models import ChatRequest, ChatResponse
from services.llm_chain import chat_with_rag
from database import get_db
from routes.auth import get_current_user

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    """Ask a question and get a cited answer from the corpus."""
    user_id = current_user["id"]
    
    result = await chat_with_rag(
        query=request.query, 
        top_k=request.top_k, 
        session_id=request.session_id,
        user_id=user_id
    )

    # ── Persist to chat history ──
    session_id = request.session_id

    db = await get_db()
    try:
        # Auto-create session if needed
        if not session_id:
            session_id = str(uuid.uuid4())
            # Use first 50 chars of query as session title
            title = request.query[:50] + ("..." if len(request.query) > 50 else "")
            await db.execute(
                "INSERT INTO chat_sessions (id, user_id, title) VALUES (?, ?, ?)",
                (session_id, user_id, title),
            )

        # Save user message
        await db.execute(
            "INSERT INTO chat_messages (id, session_id, role, content) VALUES (?, ?, ?, ?)",
            (str(uuid.uuid4()), session_id, "user", request.query),
        )

        # Save assistant message
        citations_json = json.dumps(result.get("citations", []))
        await db.execute(
            "INSERT INTO chat_messages (id, session_id, role, content, citations, doc_type) VALUES (?, ?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), session_id, "assistant", result["answer"], citations_json, result.get("doc_type")),
        )

        # Update session timestamp
        await db.execute(
            "UPDATE chat_sessions SET updated_at = datetime('now') WHERE id = ?",
            (session_id,),
        )
        await db.commit()
    except Exception as e:
        print(f"⚠️  Failed to save chat history: {e}")
    finally:
        await db.close()

    return ChatResponse(
        answer=result["answer"],
        citations=result.get("citations", []),
        session_id=session_id,
    )
