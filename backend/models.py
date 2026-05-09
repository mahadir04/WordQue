"""Pydantic models for WordQue API request/response schemas."""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional


# ── Auth ───────────────────────────────────────────────────
class UserCreate(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    name: str = Field(default="", max_length=100)


class UserLogin(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)


class GoogleLogin(BaseModel):
    id_token: str


class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    avatar_color: str = "#6366f1"


class AuthResponse(BaseModel):
    token: str
    user: UserProfile


# ── Citations ──────────────────────────────────────────────
class Citation(BaseModel):
    doc_id: str
    filename: str
    page: int
    line: Optional[int] = None
    text: str


# ── Chat ───────────────────────────────────────────────────
class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=20)
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    citations: list[Citation] = []
    session_id: Optional[str] = None


# ── Chat History ───────────────────────────────────────────
class CreateSessionRequest(BaseModel):
    title: str = "New Chat"


class ChatSessionInfo(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int = 0


class ChatSessionList(BaseModel):
    sessions: list[ChatSessionInfo]


class ChatMessageInfo(BaseModel):
    id: str
    role: str
    content: str
    citations: list[dict] = []
    doc_type: Optional[str] = None
    created_at: str


class ChatSessionMessages(BaseModel):
    session_id: str
    title: str
    messages: list[ChatMessageInfo]


# ── Summarize ──────────────────────────────────────────────
class SummarizeRequest(BaseModel):
    doc_id: Optional[str] = None  # None = summarize entire corpus


class SummarizeResponse(BaseModel):
    summary: str
    citations: list[Citation] = []


# ── Quiz / Tutor ───────────────────────────────────────────
class QuizQuestion(BaseModel):
    question: str
    choices: list[str] = []        # empty for short-answer
    correct_answer: str
    explanation: str = ""
    question_type: str = "mcq"     # mcq | true_false | short_answer
    source: Optional[Citation] = None


class TutorRequest(BaseModel):
    topic: Optional[str] = None
    doc_id: Optional[str] = None
    num_questions: int = Field(default=5, ge=1, le=20)
    question_type: str = Field(default="mcq")  # mcq | true_false | short_answer


class TutorResponse(BaseModel):
    questions: list[QuizQuestion]


# ── Corpus / Upload ───────────────────────────────────────
class DocumentInfo(BaseModel):
    doc_id: str
    filename: str
    page_count: int
    chunk_count: int
    size_bytes: int
    doc_type: str = "textbook"   # code | math | business | story | textbook
    session_id: Optional[str] = None


class UploadResponse(BaseModel):
    documents: list[DocumentInfo]
    total_chunks: int
    errors: Optional[list[str]] = None


class CorpusResponse(BaseModel):
    documents: list[DocumentInfo]
    total_chunks: int


class DeleteResponse(BaseModel):
    deleted: str
    remaining_docs: int
