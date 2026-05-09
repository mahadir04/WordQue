"""
BART-based local summarization service.

Uses facebook/bart-large-cnn (fine-tuned for summarization) from HuggingFace.
The model is lazy-loaded and cached on first use — download ~1.6 GB, runs locally.

Falls back to a lightweight extractive summary if CUDA is unavailable.
"""

import os
from pathlib import Path

# Cache dir inside project so it's portable
CACHE_DIR = Path(os.getenv("HF_CACHE_DIR", "./data/hf_cache"))

_pipeline = None   # lazy singleton


def _get_pipeline():
    """Lazy-load BART summarization pipeline (downloads model on first call)."""
    global _pipeline
    if _pipeline is None:
        try:
            from transformers import pipeline as hf_pipeline
            print("🤖 Loading BART summarization model (first run may take a moment)...")
            CACHE_DIR.mkdir(parents=True, exist_ok=True)
            _pipeline = hf_pipeline(
                "summarization",
                model="facebook/bart-large-cnn",
                cache_dir=str(CACHE_DIR),
                device=-1,  # CPU — set to 0 for GPU
            )
            print("✅ BART model loaded.")
        except Exception as e:
            print(f"⚠️  BART load failed ({e}). Falling back to extractive summary.")
            _pipeline = "fallback"
    return _pipeline


def _extractive_fallback(text: str, max_sentences: int = 6) -> str:
    """Simple extractive summarizer — picks top sentences by length/position."""
    sentences = [s.strip() for s in text.replace("\n", " ").split(".") if len(s.strip()) > 40]
    # Score: prefer early sentences and longer ones (more content)
    scored = [(i, len(s), s) for i, s in enumerate(sentences)]
    scored.sort(key=lambda x: (-x[1], x[0]))
    top = sorted(scored[:max_sentences], key=lambda x: x[0])
    return ". ".join(s for _, _, s in top) + "."


def _chunk_for_bart(text: str, max_tokens: int = 900) -> list[str]:
    """
    Split text into chunks BART can handle (~1024 tokens max).
    We use ~900 word-equivalent characters as a safe limit.
    """
    words = text.split()
    chunks = []
    current: list[str] = []
    count = 0
    for word in words:
        current.append(word)
        count += 1
        if count >= max_tokens:
            chunks.append(" ".join(current))
            current = []
            count = 0
    if current:
        chunks.append(" ".join(current))
    return chunks


def summarize_with_bart(text: str, max_length: int = 300, min_length: int = 60) -> str:
    """
    Summarize text using BART (local, no API needed).

    Handles documents longer than BART's context window via chunked
    map-reduce: summarize each chunk → combine → final summary.

    Args:
        text:       Raw text to summarize.
        max_length: Max tokens for each chunk summary.
        min_length: Min tokens for each chunk summary.

    Returns:
        Final summary string.
    """
    pipe = _get_pipeline()

    if not text.strip():
        return "No content available to summarize."

    # Chunk the text
    chunks = _chunk_for_bart(text, max_tokens=900)

    if pipe == "fallback":
        return _extractive_fallback(text)

    # Map: summarize each chunk
    partial_summaries = []
    for chunk in chunks:
        if len(chunk.split()) < 30:
            continue
        try:
            result = pipe(
                chunk,
                max_length=max_length,
                min_length=min_length,
                do_sample=False,
                truncation=True,
            )
            partial_summaries.append(result[0]["summary_text"])
        except Exception:
            partial_summaries.append(_extractive_fallback(chunk, max_sentences=3))

    if not partial_summaries:
        return _extractive_fallback(text)

    # Reduce: if multiple chunks, combine and re-summarize
    if len(partial_summaries) == 1:
        return partial_summaries[0]

    combined = " ".join(partial_summaries)
    # One final BART pass over the combined summary
    combined_chunks = _chunk_for_bart(combined, max_tokens=900)
    final_parts = []
    for chunk in combined_chunks:
        try:
            result = pipe(
                chunk,
                max_length=max_length,
                min_length=min_length,
                do_sample=False,
                truncation=True,
            )
            final_parts.append(result[0]["summary_text"])
        except Exception:
            final_parts.append(chunk[:500])

    return " ".join(final_parts)
