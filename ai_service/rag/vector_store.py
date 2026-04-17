"""
ChromaDB vector store with hybrid retrieval.

"Hybrid" here means combining:
  1. Semantic similarity  — OpenAI text-embedding-3-small vectors
  2. Structured filtering — ChromaDB where-clauses on metadata fields
                           (category, status, section, patent_number)

Naive vector search alone fails when users apply hard constraints
(e.g. "only active patents in healthcare").  The metadata filter handles
those constraints before semantic ranking, which is the production-grade
approach vs. post-hoc keyword filtering.
"""

from __future__ import annotations

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings

from .document_loader import load_patents_from_db

# Module-level singleton so the vectorstore is only initialised once per
# FastAPI process lifetime.
_store: Chroma | None = None


def get_vectorstore(
    openai_api_key: str,
    persist_dir: str,
    embedding_model: str = "text-embedding-3-small",
) -> Chroma:
    """Return the singleton ChromaDB store, creating it if necessary."""
    global _store
    if _store is None:
        embeddings = OpenAIEmbeddings(
            model=embedding_model,
            openai_api_key=openai_api_key,
        )
        _store = Chroma(
            collection_name="patents",
            embedding_function=embeddings,
            persist_directory=persist_dir,
        )
    return _store


def index_patents(
    db_path: str,
    openai_api_key: str,
    persist_dir: str,
    embedding_model: str = "text-embedding-3-small",
) -> dict:
    """Load patents-db.json, embed each document chunk, and store in ChromaDB.

    Wipes the existing collection before re-indexing so repeated calls are
    idempotent.  Returns a summary dict for the /index API response.
    """
    global _store

    embeddings = OpenAIEmbeddings(
        model=embedding_model,
        openai_api_key=openai_api_key,
    )
    store = Chroma(
        collection_name="patents",
        embedding_function=embeddings,
        persist_directory=persist_dir,
    )

    # Wipe before re-index so duplicates don't accumulate
    existing = store.get()
    if existing["ids"]:
        store.delete(ids=existing["ids"])

    documents = load_patents_from_db(db_path)
    store.add_documents(documents)

    _store = store  # update singleton

    return {
        "indexed_chunks": len(documents),
        "patents_db": db_path,
        "persist_dir": persist_dir,
    }


def hybrid_search(
    store: Chroma,
    query: str,
    k: int = 5,
    *,
    section: str | None = None,
    category: str | None = None,
    status: str | None = None,
    patent_number: str | None = None,
) -> list[Document]:
    """Semantic similarity search with optional structured metadata filters.

    Args:
        store:          Initialised ChromaDB instance.
        query:          Natural language search query.
        k:              Number of results to return.
        section:        Filter by document section — 'abstract', 'metadata', or 'full'.
        category:       Filter by patent category (e.g. 'Healthcare').
        status:         Filter by patent status (e.g. 'active').
        patent_number:  Filter to a specific patent number.

    Returns:
        List of LangChain Documents ranked by cosine similarity.
    """
    where: dict = {}
    if section:
        where["section"] = {"$eq": section}
    if category:
        where["category"] = {"$eq": category}
    if status:
        where["status"] = {"$eq": status}
    if patent_number:
        where["patent_number"] = {"$eq": patent_number}

    kwargs: dict = {"k": k}
    if where:
        # ChromaDB requires $and when multiple filters are combined
        if len(where) > 1:
            kwargs["filter"] = {"$and": [{k: v} for k, v in where.items()]}
        else:
            kwargs["filter"] = where

    return store.similarity_search(query, **kwargs)
