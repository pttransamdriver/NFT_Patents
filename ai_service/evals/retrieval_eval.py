"""
Retrieval Quality Evaluations — LangChain Eval Framework.

Run with:
    cd ai_service
    python -m evals.retrieval_eval

What this tests (and why it matters for a portfolio):
  - Context Recall   : did we retrieve the right patents for each query?
  - Context Precision: did we avoid retrieving irrelevant patents?
  - Embedding quality: are semantically similar patents nearby in vector space?

Most RAG portfolio projects skip evals entirely. Including this shows you
understand that RAG is not "set and forget" — retrieval quality degrades as
the corpus changes and needs to be measured.

The eval set below is intentionally small (6 queries) so it runs quickly.
In production you'd grow this to 50–100 labelled examples.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Allow running as a script from ai_service/
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from ai_service.config import get_settings
from ai_service.rag.vector_store import get_vectorstore, hybrid_search, index_patents


# ── Labelled eval set ─────────────────────────────────────────────────────────
# Format: (query, expected_patent_numbers_that_should_appear_in_top_5)
EVAL_CASES: list[tuple[str, list[str]]] = [
    (
        "solar energy photovoltaic quantum dots",
        ["US-10123456-B2"],
    ),
    (
        "machine learning cardiovascular diagnosis",
        ["US-10234567-B2"],
    ),
    (
        "autonomous vehicle LIDAR urban navigation",
        ["US-10345678-B1"],
    ),
    (
        "quantum error correction coherence",
        ["US-10456789-B2"],
    ),
    (
        "biodegradable plastic seaweed eco-friendly",
        ["US-10567890-B1"],
    ),
    (
        "AI healthcare medical imaging neural network",
        ["US-10234567-B2"],
    ),
]


# ── Metrics ───────────────────────────────────────────────────────────────────

def precision_at_k(retrieved: list[str], expected: list[str], k: int = 5) -> float:
    """Fraction of retrieved[0:k] that are in expected."""
    top_k = retrieved[:k]
    hits = sum(1 for pn in top_k if pn in expected)
    return hits / k if k else 0.0


def recall_at_k(retrieved: list[str], expected: list[str], k: int = 5) -> float:
    """Fraction of expected that appear in retrieved[0:k]."""
    if not expected:
        return 1.0
    top_k = set(retrieved[:k])
    hits = sum(1 for pn in expected if pn in top_k)
    return hits / len(expected)


# ── Runner ────────────────────────────────────────────────────────────────────

def run_evals() -> dict:
    s = get_settings()
    store = get_vectorstore(s.openai_api_key, s.chroma_persist_dir, s.embedding_model)

    # Auto-index if the store is empty
    if not store.get()["ids"]:
        print("⚙️  Index empty — indexing patents first…")
        index_patents(s.patents_db_path, s.openai_api_key, s.chroma_persist_dir, s.embedding_model)

    precisions, recalls = [], []

    print("\n" + "=" * 60)
    print("PATENT RETRIEVAL EVALUATION")
    print("=" * 60)

    for query, expected in EVAL_CASES:
        docs = hybrid_search(store, query, k=5)
        retrieved = [d.metadata.get("patent_number", "") for d in docs]

        p = precision_at_k(retrieved, expected)
        r = recall_at_k(retrieved, expected)
        precisions.append(p)
        recalls.append(r)

        status = "✅" if r >= 1.0 else "⚠️ "
        print(f"\n{status} Query: {query!r}")
        print(f"   Expected : {expected}")
        print(f"   Retrieved: {retrieved[:5]}")
        print(f"   Precision@5={p:.2f}  Recall@5={r:.2f}")

    avg_p = sum(precisions) / len(precisions)
    avg_r = sum(recalls) / len(recalls)

    print("\n" + "=" * 60)
    print(f"SUMMARY — {len(EVAL_CASES)} eval cases")
    print(f"  Mean Precision@5 : {avg_p:.2f}")
    print(f"  Mean Recall@5    : {avg_r:.2f}")
    if avg_r >= 0.8:
        print("  🟢 Retrieval quality: GOOD")
    elif avg_r >= 0.6:
        print("  🟡 Retrieval quality: ACCEPTABLE — consider re-embedding")
    else:
        print("  🔴 Retrieval quality: POOR — check chunking strategy and embeddings")
    print("=" * 60 + "\n")

    return {"mean_precision_at_5": avg_p, "mean_recall_at_5": avg_r, "cases": len(EVAL_CASES)}


if __name__ == "__main__":
    run_evals()
