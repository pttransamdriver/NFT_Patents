"""
Patent-aware document loader with domain-specific chunking.

Key insight from LANG_RAG.md: patent sections serve different legal/semantic
purposes and must be chunked independently:

  - Abstract  : 1–2 dense paragraphs; kept as a single small chunk.
                Best for precise Q&A retrieval.
  - Metadata  : structured fields (inventors, assignee, dates, category);
                kept as a single chunk for keyword / filter retrieval.
  - Full doc  : abstract + all fields concatenated; split with a larger
                recursive splitter for broad semantic similarity search.

This three-way split lets the hybrid_search() function target the right
section per use-case rather than fishing through a single undifferentiated
chunk pool.
"""

import json
from pathlib import Path

from langchain_core.documents import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Tighter splitter for full-document chunks (abstract is already 1 chunk)
_FULL_DOC_SPLITTER = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=100,
    separators=["\n\n", "\n", ". ", " "],
)


def load_patents_from_db(db_path: str) -> list[Document]:
    """Load patents-db.json and produce three document types per patent.

    Returns a flat list of Documents ready to be embedded and stored in
    ChromaDB.  Each Document carries rich metadata so hybrid_search() can
    apply structured filters on top of vector similarity.
    """
    path = Path(db_path)
    if not path.exists():
        raise FileNotFoundError(f"patents-db.json not found at: {path.resolve()}")

    with open(path) as f:
        data = json.load(f)

    documents: list[Document] = []

    for patent in data.get("patents", []):
        patent_number = patent.get("patentNumber", "UNKNOWN")
        inventors = ", ".join(patent.get("inventors", []))

        # Shared metadata attached to every chunk from this patent
        base_meta = {
            "patent_number": patent_number,
            "title": patent.get("title", ""),
            "category": patent.get("category", ""),
            "filing_date": patent.get("filingDate", ""),
            "publication_date": patent.get("publicationDate", ""),
            "status": patent.get("status", "active"),
            "assignee": patent.get("assignee", ""),
            "inventors": inventors,
            # Stored as string because ChromaDB metadata must be scalar
            "is_available_for_minting": str(
                patent.get("isAvailableForMinting", True)
            ),
        }

        abstract = patent.get("abstract", "")

        # ── 1. ABSTRACT CHUNK ────────────────────────────────────────────────
        # Legally distinct from claims and description; kept as one small chunk
        # so it can be retrieved precisely for Q&A grounding.
        if abstract:
            documents.append(
                Document(
                    page_content=f"PATENT ABSTRACT [{patent_number}]: {abstract}",
                    metadata={**base_meta, "section": "abstract"},
                )
            )

        # ── 2. METADATA CHUNK ────────────────────────────────────────────────
        # Structured fields; great for keyword-level retrieval when a user
        # searches by inventor name, assignee, or date range.
        metadata_text = (
            f"PATENT METADATA [{patent_number}]\n"
            f"Title: {patent.get('title', '')}\n"
            f"Category: {patent.get('category', '')}\n"
            f"Inventors: {inventors}\n"
            f"Assignee: {patent.get('assignee', '')}\n"
            f"Filed: {patent.get('filingDate', '')}\n"
            f"Published: {patent.get('publicationDate', '')}\n"
            f"Status: {patent.get('status', '')}\n"
            f"Available for minting: {patent.get('isAvailableForMinting', True)}"
        )
        documents.append(
            Document(
                page_content=metadata_text,
                metadata={**base_meta, "section": "metadata"},
            )
        )

        # ── 3. FULL-DOCUMENT CHUNKS ──────────────────────────────────────────
        # All fields concatenated and recursively split.  Used for broad
        # semantic similarity (e.g. "find patents similar to X").
        full_text = (
            f"FULL PATENT [{patent_number}]\n"
            f"Title: {patent.get('title', '')}\n"
            f"Abstract: {abstract}\n"
            f"Category: {patent.get('category', '')}\n"
            f"Inventors: {inventors}\n"
            f"Assignee: {patent.get('assignee', '')}\n"
            f"Filed: {patent.get('filingDate', '')}\n"
            f"Published: {patent.get('publicationDate', '')}\n"
            f"Status: {patent.get('status', '')}"
        )
        full_chunks = _FULL_DOC_SPLITTER.create_documents(
            [full_text],
            metadatas=[{**base_meta, "section": "full"}],
        )
        documents.extend(full_chunks)

    return documents
