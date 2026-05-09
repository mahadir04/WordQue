"""Analytics routes."""
from fastapi import APIRouter, Depends
from database import get_db
from services.embedder import get_vector_store
from routes.auth import get_current_user

router = APIRouter(prefix="/api", tags=["analytics"])

@router.get("/analytics")
async def get_analytics(user: dict = Depends(get_current_user)):
    """Get user-specific corpus metrics and chat metrics."""
    store = get_vector_store()
    
    # Corpus Metrics — filtered by user
    user_id = user["id"]
    docs = store.get_all_docs(user_id=user_id)
    total_docs = len(docs)
    
    # Calculate chunks only for this user's documents
    user_chunks = [c for c in store.chunks if c.get("user_id") == user_id]
    total_chunks = len(user_chunks)
    
    total_pages = sum(d.get("page_count", 0) for d in docs)
    total_size = sum(d.get("size_bytes", 0) for d in docs)
    
    # Doc type distribution
    doc_types = {}
    for d in docs:
        dt = d.get("doc_type", "unknown")
        doc_types[dt] = doc_types.get(dt, 0) + 1
        
    # Chat Metrics for current user
    db = await get_db()
    try:
        # Count sessions
        async with db.execute("SELECT COUNT(*) FROM chat_sessions WHERE user_id = ?", (user["id"],)) as cursor:
            row = await cursor.fetchone()
            total_chats = row[0] if row else 0
            
        # Count messages (for this user's sessions)
        async with db.execute("""
            SELECT COUNT(*) FROM chat_messages 
            JOIN chat_sessions ON chat_messages.session_id = chat_sessions.id
            WHERE chat_sessions.user_id = ?
        """, (user["id"],)) as cursor:
            row = await cursor.fetchone()
            total_messages = row[0] if row else 0
            
        # Recent chat activity (last 5 messages)
        recent_messages = []
        async with db.execute("""
            SELECT chat_messages.role, chat_messages.content, chat_sessions.title 
            FROM chat_messages
            JOIN chat_sessions ON chat_messages.session_id = chat_sessions.id
            WHERE chat_sessions.user_id = ?
            ORDER BY chat_messages.created_at DESC
            LIMIT 5
        """, (user["id"],)) as cursor:
            async for row in cursor:
                recent_messages.append({
                    "role": row["role"],
                    "content": row["content"],
                    "session_title": row["title"]
                })
            
    finally:
        await db.close()

    return {
        "corpus": {
            "total_documents": total_docs,
            "total_pages": total_pages,
            "total_chunks": total_chunks,
            "total_size_bytes": total_size,
            "doc_types": doc_types
        },
        "chat": {
            "total_sessions": total_chats,
            "total_messages": total_messages,
            "recent_messages": recent_messages
        }
    }
