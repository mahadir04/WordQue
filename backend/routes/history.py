"""Chat history routes — session management and message persistence."""
import uuid
from fastapi import APIRouter, HTTPException, Depends
from database import get_db
from routes.auth import get_current_user
from models import (
    ChatSessionList, ChatSessionInfo, ChatSessionMessages,
    ChatMessageInfo, CreateSessionRequest,
)
import json

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=ChatSessionList)
async def list_sessions(current_user: dict = Depends(get_current_user)):
    """List all chat sessions for the current user, newest first."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT s.id, s.title, s.created_at, s.updated_at,
                      (SELECT COUNT(*) FROM chat_messages WHERE session_id = s.id) as message_count
               FROM chat_sessions s
               WHERE s.user_id = ?
               ORDER BY s.updated_at DESC""",
            (current_user["id"],),
        )
        rows = await cursor.fetchall()

        sessions = [
            ChatSessionInfo(
                id=r["id"],
                title=r["title"],
                created_at=r["created_at"],
                updated_at=r["updated_at"],
                message_count=r["message_count"],
            )
            for r in rows
        ]
        return ChatSessionList(sessions=sessions)
    finally:
        await db.close()


@router.post("", response_model=ChatSessionInfo)
async def create_session(
    body: CreateSessionRequest = None,
    current_user: dict = Depends(get_current_user),
):
    """Create a new chat session."""
    db = await get_db()
    try:
        session_id = str(uuid.uuid4())
        title = body.title if body and body.title else "New Chat"

        await db.execute(
            "INSERT INTO chat_sessions (id, user_id, title) VALUES (?, ?, ?)",
            (session_id, current_user["id"], title),
        )
        await db.commit()

        return ChatSessionInfo(
            id=session_id,
            title=title,
            created_at="",
            updated_at="",
            message_count=0,
        )
    finally:
        await db.close()


@router.get("/{session_id}", response_model=ChatSessionMessages)
async def get_session_messages(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get all messages for a specific chat session."""
    db = await get_db()
    try:
        # Verify session belongs to user
        cursor = await db.execute(
            "SELECT id, title FROM chat_sessions WHERE id = ? AND user_id = ?",
            (session_id, current_user["id"]),
        )
        session = await cursor.fetchone()
        if not session:
            raise HTTPException(404, "Session not found")

        cursor = await db.execute(
            """SELECT id, role, content, citations, doc_type, created_at
               FROM chat_messages
               WHERE session_id = ?
               ORDER BY created_at ASC""",
            (session_id,),
        )
        rows = await cursor.fetchall()

        messages = [
            ChatMessageInfo(
                id=r["id"],
                role=r["role"],
                content=r["content"],
                citations=json.loads(r["citations"]) if r["citations"] else [],
                doc_type=r["doc_type"],
                created_at=r["created_at"],
            )
            for r in rows
        ]

        return ChatSessionMessages(
            session_id=session_id,
            title=session["title"],
            messages=messages,
        )
    finally:
        await db.close()


@router.put("/{session_id}/title")
async def update_session_title(
    session_id: str,
    body: dict,
    current_user: dict = Depends(get_current_user),
):
    """Update a session's title."""
    db = await get_db()
    try:
        await db.execute(
            "UPDATE chat_sessions SET title = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?",
            (body.get("title", "Untitled"), session_id, current_user["id"]),
        )
        await db.commit()
        return {"ok": True}
    finally:
        await db.close()


@router.delete("/{session_id}")
async def delete_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a chat session and all its messages."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?",
            (session_id, current_user["id"]),
        )
        session = await cursor.fetchone()
        if not session:
            raise HTTPException(404, "Session not found")

        await db.execute("DELETE FROM chat_messages WHERE session_id = ?", (session_id,))
        await db.execute("DELETE FROM chat_sessions WHERE id = ?", (session_id,))
        await db.commit()

        return {"deleted": session_id}
    finally:
        await db.close()
