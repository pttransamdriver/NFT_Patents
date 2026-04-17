"""
Custom LangChain tools for the Patent Research Agent.

Five tools that let the ReAct agent answer multi-step questions:

  1. search_patent_database     — live search via Express /api/patents
  2. get_patent_details         — fetch full patent by number
  3. check_minted_nfts          — query which patents are already minted on-chain
  4. retrieve_similar_patents   — semantic search in local ChromaDB knowledge base
  5. analyze_patent_claims      — run PatentAnalysisChain on arbitrary patent text

Tools 4 and 5 require runtime dependencies (vectorstore, analysis_chain).
They are built via factory functions (closures) so the agent builder can
inject those dependencies cleanly without globals.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated

import httpx
from langchain_core.tools import tool

if TYPE_CHECKING:
    from langchain_chroma import Chroma
    from langchain_core.runnables import Runnable


# ── 1. Search Patent Database ─────────────────────────────────────────────────

@tool
def search_patent_database(
    query: Annotated[str, "Keyword or natural-language patent search query"],
) -> str:
    """Search the live Google Patents database via the Express backend.
    Returns up to 5 matching patents with titles and abstracts."""
    from ..config import get_settings
    url = f"{get_settings().express_backend_url}/api/patents/search"
    try:
        with httpx.Client(timeout=15.0) as client:
            r = client.get(url, params={"q": query, "rows": 5})
        if r.status_code != 200:
            return f"Search failed (HTTP {r.status_code})."
        patents = r.json().get("patents", [])
        if not patents:
            return "No patents found for that query."
        lines = []
        for p in patents[:5]:
            lines.append(
                f"[{p.get('patentNumber', 'N/A')}] {p.get('title', 'Unknown')}\n"
                f"  {p.get('abstract', '')[:200]}…"
            )
        return "\n\n".join(lines)
    except Exception as exc:
        return f"Error reaching patent database: {exc}"


# ── 2. Get Patent Details ──────────────────────────────────────────────────────

@tool
def get_patent_details(
    patent_number: Annotated[str, "Patent number, e.g. US-10123456-B2"],
) -> str:
    """Fetch full structured details for a specific patent by its patent number."""
    from ..config import get_settings
    url = f"{get_settings().express_backend_url}/api/patents/{patent_number}"
    try:
        with httpx.Client(timeout=15.0) as client:
            r = client.get(url)
        if r.status_code == 404:
            return f"Patent {patent_number} not found."
        if r.status_code != 200:
            return f"Request failed (HTTP {r.status_code})."
        p = r.json()
        return (
            f"Patent:    {p.get('patentNumber')}\n"
            f"Title:     {p.get('title')}\n"
            f"Abstract:  {p.get('abstract', '')[:400]}\n"
            f"Inventors: {', '.join(p.get('inventors', []))}\n"
            f"Assignee:  {p.get('assignee')}\n"
            f"Filed:     {p.get('filingDate')}\n"
            f"Published: {p.get('publicationDate')}\n"
            f"Category:  {p.get('category')}\n"
            f"Status:    {p.get('status')}"
        )
    except Exception as exc:
        return f"Error fetching patent details: {exc}"


# ── 3. Check Minted NFTs ──────────────────────────────────────────────────────

@tool
def check_minted_nfts(
    patent_number: Annotated[
        str,
        "Patent number to check, or 'all' to list every minted NFT",
    ],
) -> str:
    """Check whether a patent has been minted as an NFT on the blockchain.
    Pass 'all' to retrieve a list of every minted patent NFT."""
    from ..config import get_settings
    base = get_settings().express_backend_url
    path = "/api/patents/minted" if patent_number.lower() == "all" \
        else f"/api/patents/minted/{patent_number}"
    try:
        with httpx.Client(timeout=15.0) as client:
            r = client.get(f"{base}{path}")
        if r.status_code != 200:
            return f"Could not retrieve minting status (HTTP {r.status_code})."
        return str(r.json())
    except Exception as exc:
        return f"Error checking NFT status: {exc}"


# ── 4. Retrieve Similar Patents (factory — needs vectorstore) ─────────────────

def make_retrieve_similar_patents_tool(vectorstore: "Chroma"):
    """Factory that returns the retrieve_similar_patents tool with vectorstore
    injected via closure."""
    from ..rag.vector_store import hybrid_search

    @tool
    def retrieve_similar_patents(
        description: Annotated[
            str, "Technology description or invention concept to find similar patents for"
        ],
    ) -> str:
        """Search the local patent knowledge base using semantic similarity.
        More precise than keyword search for conceptual / technology-level similarity."""
        docs = hybrid_search(vectorstore, description, k=5)
        if not docs:
            return "No similar patents found in the knowledge base."
        lines = []
        seen: set[str] = set()
        for doc in docs:
            pn = doc.metadata.get("patent_number", "UNKNOWN")
            if pn in seen:
                continue
            seen.add(pn)
            title = doc.metadata.get("title", "Unknown")
            snippet = doc.page_content[:200].replace("\n", " ")
            lines.append(f"[{pn}] {title}\n  {snippet}…")
        return "\n\n".join(lines)

    return retrieve_similar_patents


# ── 5. Analyze Patent Claims (factory — needs analysis_chain) ─────────────────

def make_analyze_patent_claims_tool(analysis_chain: "Runnable"):
    """Factory that returns the analyze_patent_claims tool with analysis_chain
    injected via closure."""

    @tool
    def analyze_patent_claims(
        patent_text: Annotated[
            str, "Full patent text, abstract, or claims to analyze"
        ],
    ) -> str:
        """Analyze patent claims and produce a structured assessment of novelty,
        technology class, key claims, and investment potential for NFT minting."""
        try:
            result = analysis_chain.invoke({"patent_text": patent_text})
            return str(result)
        except Exception as exc:
            return f"Analysis failed: {exc}"

    return analyze_patent_claims


# ── Tool builder ──────────────────────────────────────────────────────────────

def build_tools(vectorstore: "Chroma", analysis_chain: "Runnable") -> list:
    """Return the full list of agent tools with dependencies injected."""
    return [
        search_patent_database,
        get_patent_details,
        check_minted_nfts,
        make_retrieve_similar_patents_tool(vectorstore),
        make_analyze_patent_claims_tool(analysis_chain),
    ]
