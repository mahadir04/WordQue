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
            from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
            print("🤖 Loading BART model and tokenizer (first run may take a moment)...")
            CACHE_DIR.mkdir(parents=True, exist_ok=True)
            
            tokenizer = AutoTokenizer.from_pretrained(
                "facebook/bart-large-cnn",
                cache_dir=str(CACHE_DIR)
            )
            model = AutoModelForSeq2SeqLM.from_pretrained(
                "facebook/bart-large-cnn",
                cache_dir=str(CACHE_DIR)
            )
            
            # Use CPU by default (device=-1 in pipeline equivalent)
            _pipeline = {"model": model, "tokenizer": tokenizer}
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


def _generate_bart(chunk: str, model, tokenizer, max_length: int, min_length: int) -> str:
    """Helper to perform manual BART generation."""
    inputs = tokenizer(chunk, return_tensors="pt", truncation=True, max_length=1024)
    summary_ids = model.generate(
        inputs["input_ids"],
        max_length=max_length,
        min_length=min_length,
        do_sample=False,
        length_penalty=2.0,
        num_beams=4,
        early_stopping=True
    )
    return tokenizer.decode(summary_ids[0], skip_special_tokens=True)


def summarize_with_bart(text: str, max_length: int = 300, min_length: int = 60) -> str:
    """
    Summarize text using BART (manual model/tokenizer pass).
    """
    pipe_data = _get_pipeline()

    if not text.strip():
        return "No content available to summarize."

    # Chunk the text
    chunks = _chunk_for_bart(text, max_tokens=900)

    if pipe_data == "fallback":
        return _extractive_fallback(text)

    model = pipe_data["model"]
    tokenizer = pipe_data["tokenizer"]

    # Map: summarize each chunk
    partial_summaries = []
    for chunk in chunks:
        if len(chunk.split()) < 30:
            continue
        try:
            summary = _generate_bart(chunk, model, tokenizer, max_length, min_length)
            partial_summaries.append(summary)
        except Exception as e:
            print(f"⚠️ Chunk summary failed: {e}")
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
            summary = _generate_bart(chunk, model, tokenizer, max_length, min_length)
            final_parts.append(summary)
        except Exception as e:
            print(f"⚠️ Reduce summary failed: {e}")
            final_parts.append(chunk[:500])

    return " ".join(final_parts)
