"""FAISS vector store with local HuggingFace embeddings."""
import os
import json
import numpy as np
import faiss
from dotenv import load_dotenv
from pathlib import Path
from sentence_transformers import SentenceTransformer
import asyncio

load_dotenv()

# ── Config ─────────────────────────────────────────────────
EMBED_MODEL = "all-MiniLM-L6-v2"
EMBED_DIM = 384  # all-MiniLM-L6-v2 dimension
INDEX_DIR = Path(os.getenv("FAISS_INDEX_PATH", "./data/faiss_index"))

class EmbeddingError(Exception):
    pass

class VectorStore:
    """Manages a FAISS index with chunk metadata using local embeddings."""

    def __init__(self):
        self.index: faiss.IndexFlatIP | None = None
        self.chunks: list[dict] = []
        self.doc_metadata: dict = {}
        
        print(f"Loading local embedding model: {EMBED_MODEL}...")
        self.encoder = SentenceTransformer(EMBED_MODEL)
        print("Model loaded successfully.")
        
        self._ensure_dirs()
        self._load()

    def _ensure_dirs(self):
        INDEX_DIR.mkdir(parents=True, exist_ok=True)

    def _load(self):
        """Load persisted index + metadata from disk."""
        idx_path = INDEX_DIR / "index.faiss"
        meta_path = INDEX_DIR / "chunks.json"
        docs_path = INDEX_DIR / "docs.json"

        if idx_path.exists() and meta_path.exists():
            self.index = faiss.read_index(str(idx_path))
            
            # Safety check: if dimension changed (e.g. from Gemini's 3072 to local 384)
            if self.index.d != EMBED_DIM:
                print(f"⚠️ FAISS index dimension mismatch (expected {EMBED_DIM}, got {self.index.d}). Wiping old index...")
                self.index = faiss.IndexFlatIP(EMBED_DIM)
                self.chunks = []
                self.doc_metadata = {}
                self.save()
            else:
                with open(meta_path, "r", encoding="utf-8") as f:
                    self.chunks = json.load(f)
                if docs_path.exists():
                    with open(docs_path, "r", encoding="utf-8") as f:
                        self.doc_metadata = json.load(f)
        else:
            self.index = faiss.IndexFlatIP(EMBED_DIM)
            self.chunks = []
            self.doc_metadata = {}

    def save(self):
        """Persist index + metadata to disk."""
        faiss.write_index(self.index, str(INDEX_DIR / "index.faiss"))
        with open(INDEX_DIR / "chunks.json", "w", encoding="utf-8") as f:
            json.dump(self.chunks, f, ensure_ascii=False)
        with open(INDEX_DIR / "docs.json", "w", encoding="utf-8") as f:
            json.dump(self.doc_metadata, f, ensure_ascii=False)

    def embed_texts(self, texts: list[str]) -> np.ndarray:
        """Embed texts using the local SentenceTransformer."""
        try:
            # normalize_embeddings=True for IndexFlatIP (cosine similarity equivalent)
            vectors = self.encoder.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
            if vectors.ndim == 1:
                vectors = vectors.reshape(1, -1)
            return vectors.astype(np.float32)
        except Exception as e:
            raise EmbeddingError(f"Failed to generate embeddings: {str(e)}")

    def embed_query(self, query: str) -> np.ndarray:
        """Embed a single query."""
        return self.embed_texts([query])

    async def add_chunks_async(self, chunks: list[dict], doc_meta: dict):
        """Add document chunks to the index."""
        user_id = doc_meta.get("user_id")
        if not chunks:
            self.doc_metadata[doc_meta["doc_id"]] = doc_meta
            self.save()
            return

        texts = [c["text"] for c in chunks]
        
        # Run local embedding in a thread so it doesn't block the async event loop
        vectors = await asyncio.to_thread(self.embed_texts, texts)
        
        self.index.add(vectors)
        self.chunks.extend(chunks)
        self.doc_metadata[doc_meta["doc_id"]] = doc_meta
        self.save()

    def remove_document(self, doc_id: str, user_id: str = None):
        """Remove all chunks for a document, delete local file, and rebuild the index."""
        if doc_id in self.doc_metadata:
            meta = self.doc_metadata[doc_id]
            
            # Security check: only allow if user owns the document (or if no user_id provided for legacy)
            if user_id and meta.get("user_id") != user_id:
                print(f"🚫 Unauthorized delete attempt for doc {doc_id} by user {user_id}")
                return

            file_path = meta.get("file_path")
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    print(f"🗑️ Deleted local file: {file_path}")
                except Exception as e:
                    print(f"⚠️ Failed to delete local file {file_path}: {e}")
            
            del self.doc_metadata[doc_id]

        new_chunks = [c for c in self.chunks if c["doc_id"] != doc_id]
        self.index = faiss.IndexFlatIP(EMBED_DIM)
        self.chunks = []

        if new_chunks:
            texts = [c["text"] for c in new_chunks]
            vectors = self.embed_texts(texts)
            self.index.add(vectors)
            self.chunks = new_chunks

        self.save()

    def search(self, query: str, top_k: int = 5, session_id: str = None, user_id: str = None) -> list[dict]:
        """Search the index and return top-k matching chunks with scores."""
        if self.index is None or self.index.ntotal == 0:
            return []

        q_vec = self.embed_query(query)

        # Multi-tenancy: filter chunks by user_id
        # Also supports session-specific search
        indices = []
        for i, c in enumerate(self.chunks):
            # Check user ownership first
            if user_id and c.get("user_id") != user_id:
                continue
            # Check session isolation if requested
            # Global chunks (session_id is None) are visible everywhere
            chunk_sid = c.get("session_id")
            if session_id and chunk_sid is not None and chunk_sid != session_id:
                continue
            indices.append(i)

        if not indices:
            return []

        # Reconstruct vectors to form a temporary isolated index
        # (This is more efficient for small subsets than filtering the whole index every time)
        session_vectors = np.vstack([self.index.reconstruct(i) for i in indices])
        temp_index = faiss.IndexFlatIP(EMBED_DIM)
        temp_index.add(session_vectors)
        
        scores, temp_indices = temp_index.search(q_vec, min(top_k, temp_index.ntotal))
        
        results = []
        for score, temp_idx in zip(scores[0], temp_indices[0]):
            if temp_idx < 0:
                continue
            original_idx = indices[temp_idx]
            chunk = self.chunks[original_idx].copy()
            chunk["score"] = float(score)
            results.append(chunk)
        return results

    def get_all_docs(self, user_id: str = None) -> list[dict]:
        """Return metadata for all indexed documents (filtered by user)."""
        if not user_id:
            return list(self.doc_metadata.values())
        return [d for d in self.doc_metadata.values() if d.get("user_id") == user_id]

    @property
    def total_chunks(self) -> int:
        return len(self.chunks)

    def get_chunks_for_doc(self, doc_id: str) -> list[dict]:
        """Return all chunks belonging to a specific document."""
        return [c for c in self.chunks if c["doc_id"] == doc_id]

# ── Singleton ──────────────────────────────────────────────
_store: VectorStore | None = None

def get_vector_store() -> VectorStore:
    global _store
    if _store is None:
        _store = VectorStore()
    return _store
