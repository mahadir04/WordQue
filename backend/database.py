"""SQLite database for user accounts and chat history."""
import os
import aiosqlite
from pathlib import Path

DB_PATH = Path(os.getenv("DB_PATH", "./data/wordque.db"))


async def get_db() -> aiosqlite.Connection:
    """Get a database connection."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    db = await aiosqlite.connect(str(DB_PATH))
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    return db


async def init_db():
    """Create tables if they don't exist."""
    db = await get_db()
    try:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id          TEXT PRIMARY KEY,
                email       TEXT UNIQUE NOT NULL,
                password    TEXT NOT NULL,
                name        TEXT NOT NULL DEFAULT '',
                avatar_color TEXT NOT NULL DEFAULT '#6366f1',
                created_at  TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS chat_sessions (
                id          TEXT PRIMARY KEY,
                user_id     TEXT NOT NULL,
                title       TEXT NOT NULL DEFAULT 'New Chat',
                created_at  TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS chat_messages (
                id          TEXT PRIMARY KEY,
                session_id  TEXT NOT NULL,
                role        TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
                content     TEXT NOT NULL,
                citations   TEXT DEFAULT '[]',
                doc_type    TEXT DEFAULT NULL,
                created_at  TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_sessions_user ON chat_sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id);
        """)
        await db.commit()
        print("✅ Database initialized")
    finally:
        await db.close()
