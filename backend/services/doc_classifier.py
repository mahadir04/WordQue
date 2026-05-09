"""
Document type classifier.

Detects the primary context of a PDF from its extracted text using
keyword-frequency heuristics — fast, zero-dependency, no extra model needed.

Supported types:
  - "code"       → programming / software content
  - "math"       → mathematics / statistics / physics
  - "business"   → finance, management, marketing
  - "story"      → fiction, novel, narrative
  - "research"   → scientific research papers
  - "legal"      → contracts, legal documents
  - "textbook"   → general academic / educational default
"""

import re
from collections import Counter

# ── Keyword vocabularies per domain ───────────────────────
KEYWORDS: dict[str, list[str]] = {
    "code": [
        "function", "class", "import", "return", "variable", "algorithm",
        "array", "loop", "recursion", "compiler", "runtime", "syntax",
        "boolean", "integer", "string", "object", "method", "api",
        "database", "server", "client", "framework", "library", "module",
        "git", "repository", "stack", "queue", "pointer", "binary",
        "debug", "exception", "inheritance", "polymorphism", "interface",
        "async", "thread", "process", "memory", "cpu", "code", "script",
        "programming", "software", "developer", "python", "javascript",
        "java", "c++", "html", "css", "sql", "json", "xml",
    ],
    "math": [
        "theorem", "proof", "lemma", "corollary", "equation", "matrix",
        "vector", "integral", "derivative", "polynomial", "function",
        "probability", "statistics", "regression", "correlation",
        "hypothesis", "distribution", "variance", "eigenvalue",
        "calculus", "algebra", "geometry", "topology", "set",
        "axiom", "proposition", "conjecture", "infinity", "limit",
        "differential", "gradient", "optimization", "stochastic",
        "sigma", "delta", "epsilon", "lambda", "theta", "pi",
        "sample", "mean", "median", "deviation", "confidence",
    ],
    "business": [
        "revenue", "profit", "loss", "investment", "portfolio", "market",
        "strategy", "management", "leadership", "stakeholder", "roi",
        "budget", "forecast", "kpi", "quarterly", "fiscal", "equity",
        "merger", "acquisition", "compliance", "regulation", "contract",
        "marketing", "sales", "customer", "brand", "campaign",
        "supply chain", "logistics", "operations", "hr", "talent",
        "startup", "venture", "funding", "shareholder", "dividend",
        "audit", "balance sheet", "cash flow", "liability", "asset",
        "negotiation", "partnership", "franchise", "entrepreneur",
    ],
    "story": [
        "chapter", "character", "protagonist", "antagonist", "narrator",
        "dialogue", "plot", "setting", "climax", "resolution",
        "said", "replied", "whispered", "shouted", "thought",
        "felt", "looked", "walked", "ran", "smiled", "cried",
        "love", "fear", "hope", "dream", "adventure", "mystery",
        "once upon", "the end", "novel", "story", "tale", "fiction",
        "hero", "villain", "journey", "quest", "battle", "magic",
        "castle", "kingdom", "forest", "ocean", "night", "dawn",
    ],
    "research": [
        "abstract", "methodology", "conclusion", "results", "discussion",
        "references", "literature", "review", "hypothesis", "experiment",
        "dataset", "empirical", "findings", "implications", "limitations",
        "significant", "analysis", "study", "paper", "author", "et al",
        "figure", "table", "survey", "participants", "control", "variable",
    ],
    "legal": [
        "contract", "agreement", "party", "parties", "hereby", "shall",
        "liability", "indemnification", "jurisdiction", "law", "court",
        "clause", "section", "article", "provision", "termination",
        "breach", "damages", "warranties", "obligations", "notwithstanding",
        "pursuant", "witnesseth", "hereinafter", "whereas", "arbitration",
    ],
}


def _tokenize(text: str) -> list[str]:
    """Lowercase and split text into words."""
    return re.findall(r"[a-z]+", text.lower())


def classify_document(text: str) -> str:
    """
    Classify document content into one of:
    code | math | business | story | textbook

    Args:
        text: Raw extracted text (first ~5000 chars is enough).

    Returns:
        Document type string.
    """
    sample = text[:5000]
    tokens = _tokenize(sample)
    token_set = set(tokens)

    scores: dict[str, int] = {}
    for doc_type, keywords in KEYWORDS.items():
        # Count keyword hits (each keyword counts once per doc)
        hits = sum(1 for kw in keywords if kw in token_set)
        # Bonus: raw frequency for very short matches
        freq_bonus = sum(tokens.count(kw) for kw in keywords[:10]) // 5
        scores[doc_type] = hits + freq_bonus

    best_type = max(scores, key=lambda k: scores[k])
    best_score = scores[best_type]

    # Fall back to "textbook" if no clear signal
    if best_score < 3:
        return "textbook"

    return best_type


def get_type_label(doc_type: str) -> str:
    """Human-readable label for a document type."""
    return {
        "code": "💻 Code / Programming",
        "math": "🔢 Math / Science",
        "business": "💼 Business / Finance",
        "story": "📖 Story / Fiction",
        "research": "🔬 Research Paper",
        "legal": "⚖️ Legal / Contract",
        "tutor": "🎓 Tutor / Quiz Mode",
        "textbook": "📚 General Textbook",
    }.get(doc_type, "📚 General Textbook")
