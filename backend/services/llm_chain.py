"""
LLM chain service.

- Chat / Q&A   → Google Gemini 2.0 Flash with context-aware prompt templates
- Summarize    → facebook/bart-large-cnn (local, no API key needed)
- Quiz         → Google Gemini 2.0 Flash with structured JSON output
"""

import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
from services.embedder import get_vector_store
from services.prompt_templates import get_prompt
from services.summarizer import summarize_with_bart

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY", ""))

GEMINI_MODEL = "gemini-flash-latest"


# ── Helpers ────────────────────────────────────────────────

def _build_context(chunks: list[dict]) -> str:
    """Format retrieved chunks into a numbered context string."""
    parts = []
    for i, chunk in enumerate(chunks):
        parts.append(
            f"[Source {i+1}: {chunk['filename']}, Page {chunk['page']}]\n"
            f"{chunk['text']}\n"
        )
    return "\n---\n".join(parts)


def _format_citations(chunks: list[dict]) -> list[dict]:
    """Deduplicate and format citations from chunks."""
    seen = set()
    citations = []
    for chunk in chunks:
        key = (chunk["doc_id"], chunk["page"])
        if key not in seen:
            seen.add(key)
            citations.append({
                "doc_id":   chunk["doc_id"],
                "filename": chunk["filename"],
                "page":     chunk["page"],
                "text":     chunk["text"][:150] + "...",
            })
    return citations


def _infer_doc_type(chunks: list[dict]) -> str:
    """Infer dominant doc_type from a set of retrieved chunks."""
    if not chunks:
        return "textbook"
    from collections import Counter
    types = [c.get("doc_type", "textbook") for c in chunks]
    return Counter(types).most_common(1)[0][0]


# ── Chat with RAG ──────────────────────────────────────────

async def chat_with_rag(query: str, top_k: int = 5, session_id: str = None, user_id: str = None) -> dict:
    """
    RAG pipeline with user isolation:
      1. Embed query → retrieve top-k chunks from FAISS (filtered by user_id)
      2. Detect document type from retrieved chunks
      3. Select matching prompt template
      4. Generate answer with Gemini
    """
    store = get_vector_store()
    chunks = store.search(query, top_k=top_k, session_id=session_id, user_id=user_id)

    if not chunks:
        return {
            "answer": (
                "I don't have any documents to search in your Knowledge Base. "
                "Please upload some PDFs in the Workspace first."
            ),
            "citations": [],
        }

    context = _build_context(chunks)
    doc_type = _infer_doc_type(chunks)

    # Build context-aware prompt
    prompt = get_prompt(doc_type=doc_type, context=context, query=query)

    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(prompt)
        answer = response.text
    except Exception as e:
        answer = f"⚠️ I encountered an error communicating with the AI model: {str(e)}\n\nThis is usually due to free-tier rate limits. Please try again in a few moments."

    return {
        "answer":    answer,
        "citations": _format_citations(chunks),
        "doc_type":  doc_type,
    }


# ── Summarize with BART ────────────────────────────────────

async def summarize_document(doc_id: str | None = None, user_id: str = None) -> dict:
    """
    Summarize with user isolation.
    """
    store = get_vector_store()

    if doc_id:
        chunks = store.get_chunks_for_doc(doc_id)
        # Security check
        if chunks and user_id and chunks[0].get("user_id") != user_id:
             chunks = []
             
        if not chunks:
            return {"summary": "Document not found or access denied.", "citations": []}
        label = chunks[0]["filename"]
    else:
        # Summarize entire corpus for THIS user
        chunks = [c for c in store.chunks if c.get("user_id") == user_id] if user_id else store.chunks
        if not chunks:
            return {"summary": "No documents in your knowledge base.", "citations": []}
        label = "entire corpus"

    # Combine all chunk texts for this doc/corpus
    full_text = "\n\n".join(c["text"] for c in chunks)
    doc_type  = _infer_doc_type(chunks)

    # ── BART summarization ──
    # First pass: use local BART to reduce the text length.
    bart_summary = summarize_with_bart(full_text)

    # ── Gemini Polish Pass ──
    # Second pass: use Gemini (1.5 Flash) to format the raw BART summary into beautiful markdown.
    prompt = f"""You are an elite technical editor and summarizer. Your goal is to transform a raw, dense summary into a professional, highly readable study guide.

Document Title: {label}
Document Category: {doc_type}

Raw Summary Material (to be formatted):
{bart_summary}

INSTRUCTIONS:
1. Create a structured, easy-to-read summary with plenty of vertical space.
2. Provide a 2-3 sentence introductory summary.
3. Use Markdown headings (###) for each major section or theme.
4. Use double line breaks between sections to ensure the text is "breathable".
5. Use bullet points for key concepts, definitions, and important details.
6. **HIGHLIGHT** critical terms, keywords, and definitions by using **bold text**.
7. Keep the tone academic yet very clear.
8. Respond ONLY with the formatted summary.

Follow this exact visual style:
### [Main Section Heading]

[Introductory paragraph for this section...]

* **[Important Term]**: [Explanation].
* **[Key Concept]**: [Explanation].

### [Next Section Heading]

* **[Next Point]**: [Details].

OUTPUT (Beautifully formatted Markdown):"""

    try:
        model    = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(prompt)
        final_summary = response.text
    except Exception as e:
        # If Gemini fails (e.g. rate limit), fallback to raw BART
        print(f"⚠️ Gemini polish failed: {e}. Falling back to raw BART.")
        final_summary = bart_summary

    return {
        "summary":  final_summary,
        "citations": _format_citations(chunks[:10]),
        "doc_type":  doc_type,
    }


# ── Quiz generation ────────────────────────────────────────

async def generate_quiz(
    topic: str | None = None,
    doc_id: str | None = None,
    num_questions: int = 5,
    question_type: str = "mcq",
    user_id: str = None
) -> list[dict]:
    """Generate quiz questions with user isolation."""
    store = get_vector_store()

    if doc_id:
        chunks = store.get_chunks_for_doc(doc_id)
        # Security check
        if chunks and user_id and chunks[0].get("user_id") != user_id:
             chunks = []
    elif topic:
        chunks = store.search(topic, top_k=10, user_id=user_id)
    else:
        chunks = [c for c in store.chunks if c.get("user_id") == user_id] if user_id else store.chunks
        chunks = chunks[:15]

    if not chunks:
        return []

    context  = _build_context(chunks[:10])
    doc_type = _infer_doc_type(chunks)

    type_instructions = {
        "mcq": (
            "Multiple-choice questions with exactly 4 options (A, B, C, D). "
            "One correct answer. Distractors must be plausible but clearly wrong."
        ),
        "true_false": (
            "True/False questions. The correct_answer must be exactly 'True' or 'False'."
        ),
        "short_answer": (
            "Short-answer questions requiring 1–3 sentence responses."
        ),
    }

    # Domain-specific quiz flavour
    domain_hints = {
        "code":     "Focus on syntax, algorithms, design patterns, and best practices.",
        "math":     "Include formula recall, derivation steps, and numerical problems.",
        "business": "Focus on definitions, frameworks, case-based reasoning, and KPIs.",
        "story":    "Focus on character motivation, plot events, themes, and symbolism.",
        "research": "Focus on methodology, study limitations, empirical findings, and conclusions.",
        "legal":    "Focus on clause definitions, obligations, liabilities, and strict interpretations.",
        "textbook": "Cover key concepts, definitions, cause-and-effect, and applications.",
    }

    instruction  = type_instructions.get(question_type, type_instructions["mcq"])
    domain_hint  = domain_hints.get(doc_type, domain_hints["textbook"])

    prompt = f"""You are a university professor generating a quiz on {doc_type} content.

Generate exactly {num_questions} {question_type} questions.
FORMAT: {instruction}
DOMAIN FOCUS: {domain_hint}

Each question JSON object must have:
- "question": the question text
- "choices": array of choices (empty [] for short_answer)
- "correct_answer": the correct answer text
- "explanation": one-sentence explanation of why this is correct
- "question_type": "{question_type}"

CONTENT:
{context}

{f'TOPIC FOCUS: {topic}' if topic else ''}

Respond ONLY with a valid JSON array. No markdown. No code fences:"""

    model    = genai.GenerativeModel(GEMINI_MODEL)
    response = model.generate_content(prompt)

    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

    try:
        questions = json.loads(text)
    except json.JSONDecodeError:
        start = text.find("[")
        end   = text.rfind("]") + 1
        try:
            questions = json.loads(text[start:end]) if start >= 0 and end > start else []
        except json.JSONDecodeError:
            questions = []

    # Attach source citation
    source = {
        "doc_id":   chunks[0]["doc_id"],
        "filename": chunks[0]["filename"],
        "page":     chunks[0]["page"],
        "text":     chunks[0]["text"][:100] + "...",
    }
    for q in questions:
        q["source"]   = source
        q["doc_type"] = doc_type

    return questions
