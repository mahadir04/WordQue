"""WordQue — Multi-PDF AI Assistant Backend."""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routes import upload, chat, summarize, tutor, corpus
from routes import auth, history, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # ── Startup ──
    from database import init_db
    await init_db()

    from services.embedder import get_vector_store
    store = get_vector_store()
    print(f"✅ WordQue started — {store.total_chunks} chunks in index, {len(store.doc_metadata)} documents")

    yield

    # ── Shutdown ──
    print("🛑 WordQue shutting down")


app = FastAPI(
    title="WordQue API",
    description="Multi-PDF AI Assistant with RAG, Summarization, and Quiz Generation",
    version="1.0.0",
    lifespan=lifespan,
)

# ── Static Files & CORS ─────────────────────────────────────
from fastapi.staticfiles import StaticFiles

# Ensure pdfs directory exists
os.makedirs("data/pdfs", exist_ok=True)
app.mount("/pdfs", StaticFiles(directory="data/pdfs"), name="pdfs")

# Production CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount routers ──────────────────────────────────────────
app.include_router(upload.router)
app.include_router(chat.router)
app.include_router(summarize.router)
app.include_router(tutor.router)
app.include_router(corpus.router)
app.include_router(auth.router)
app.include_router(history.router)
app.include_router(analytics.router)

# ── Serve Static Frontend ───────────────────────────────────
import os
from fastapi.responses import FileResponse

# Check if static directory exists (production)
if os.path.exists("static"):
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Serve static files if they exist
        file_path = os.path.join("static", full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        # Fallback to index.html for React routing
        return FileResponse("static/index.html")
else:
    @app.get("/")
    async def root():
        return {"message": "WordQue API is running. Static frontend not found (Development Mode)."}


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "WordQue"}
