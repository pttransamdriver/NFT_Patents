"""
Patent NFT — LangChain AI Service (FastAPI)

Start with:
    cd ai_service
    uvicorn main:app --reload --port 8000

Routes (all called by the Express backend, never the browser):
    GET  /health
    POST /index              — (re)index patents-db.json into ChromaDB
    POST /search             — PatentSearchChain  (replaces raw OpenAI call)
    POST /suggest            — autocomplete suggestions
    POST /analyze            — PatentAnalysisChain
    POST /prior-art          — PriorArtChain
    POST /agent/query        — one-shot ReAct agent query
    POST /agent/chat         — multi-turn agent query (session_id required)
    DELETE /agent/session/{id} — clear a conversation session
"""

from __future__ import annotations

import os
import uuid
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

from .agent.patent_agent import (
    build_patent_agent,
    clear_session,
    get_or_create_session,
)
from .agent.tools import build_tools
from .chains.analysis_chain import build_analysis_chain
from .chains.prior_art_chain import build_prior_art_chain
from .chains.search_chain import build_search_chain
from .config import get_settings
from .rag.vector_store import get_vectorstore, index_patents

# ── Module-level singletons (populated in lifespan) ───────────────────────────
_search_chain = None
_analysis_chain = None
_prior_art_chain = None
_tools: list = []
_llm: ChatOpenAI | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise LangChain components on startup."""
    global _search_chain, _analysis_chain, _prior_art_chain, _tools, _llm

    s = get_settings()

    # Wire LangSmith tracing via env vars (LangChain picks these up automatically)
    if s.langchain_api_key:
        os.environ.setdefault("LANGCHAIN_API_KEY", s.langchain_api_key)
        os.environ.setdefault("LANGCHAIN_TRACING_V2", s.langchain_tracing_v2)
        os.environ.setdefault("LANGCHAIN_PROJECT", s.langchain_project)

    _llm = ChatOpenAI(
        model=s.llm_model,
        openai_api_key=s.openai_api_key,
        temperature=0.2,
    )

    vectorstore = get_vectorstore(s.openai_api_key, s.chroma_persist_dir, s.embedding_model)

    # Auto-index on first run
    existing = vectorstore.get()
    if not existing["ids"]:
        print("🔄  Indexing patents into ChromaDB…")
        result = index_patents(s.patents_db_path, s.openai_api_key, s.chroma_persist_dir, s.embedding_model)
        print(f"✅  Indexed {result['indexed_chunks']} chunks from {result['patents_db']}")
    else:
        print(f"✅  ChromaDB ready — {len(existing['ids'])} chunks loaded")

    _search_chain = build_search_chain(_llm, vectorstore)
    _analysis_chain = build_analysis_chain(_llm)
    _prior_art_chain = build_prior_art_chain(_llm, vectorstore)
    _tools = build_tools(vectorstore, _analysis_chain)

    print("🤖  All LangChain chains and agent tools initialised")
    yield


app = FastAPI(
    title="Patent NFT AI Service",
    description="LangChain RAG + ReAct Agent for patent research",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],  # Express backend only
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)


# ── Request / Response models ─────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str

class AnalyzeRequest(BaseModel):
    patent_text: str

class PriorArtRequest(BaseModel):
    claims_text: str

class AgentRequest(BaseModel):
    query: str
    session_id: str | None = None


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    s = get_settings()
    return {
        "status": "ok",
        "services": {
            "langchain": True,
            "chromadb": True,
            "langsmith_tracing": s.langchain_tracing_v2 == "true",
            "llm_model": s.llm_model,
        },
    }


@app.post("/index")
async def reindex():
    """Re-index patents-db.json. Call after adding new patents."""
    s = get_settings()
    result = index_patents(s.patents_db_path, s.openai_api_key, s.chroma_persist_dir, s.embedding_model)
    return {"success": True, **result}


@app.post("/search")
async def search(req: SearchRequest) -> dict[str, Any]:
    try:
        result = await _search_chain.ainvoke({"query": req.query})
        return {"provider": "langchain-rag", "result": result}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@app.post("/suggest")
async def suggest(req: SearchRequest) -> dict[str, Any]:
    """Return 5 autocomplete suggestions for a partial patent query."""
    try:
        prompt = (
            f'Generate 5 concise patent search suggestions based on: "{req.query}". '
            "Return a JSON array of strings only."
        )
        response = await _llm.ainvoke(prompt)
        import json
        suggestions = json.loads(response.content)
        return {"suggestions": suggestions if isinstance(suggestions, list) else []}
    except Exception:
        return {"suggestions": []}


@app.post("/analyze")
async def analyze(req: AnalyzeRequest) -> dict[str, Any]:
    try:
        result = await _analysis_chain.ainvoke({"patent_text": req.patent_text})
        return {"analysis": result}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@app.post("/prior-art")
async def prior_art(req: PriorArtRequest) -> dict[str, Any]:
    try:
        result = await _prior_art_chain.ainvoke({"claims_text": req.claims_text})
        return {"prior_art": result}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@app.post("/agent/query")
async def agent_query(req: AgentRequest) -> dict[str, Any]:
    """One-shot agent query — no persistent memory."""
    try:
        executor = build_patent_agent(_llm, _tools)
        result = await executor.ainvoke({"input": req.query})
        return {
            "answer": result.get("output", ""),
            "steps": [
                {"tool": s[0].tool, "input": str(s[0].tool_input), "output": str(s[1])}
                for s in result.get("intermediate_steps", [])
            ],
        }
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@app.post("/agent/chat")
async def agent_chat(req: AgentRequest) -> dict[str, Any]:
    """Multi-turn agent query — persists memory per session_id."""
    session_id = req.session_id or str(uuid.uuid4())
    try:
        executor = get_or_create_session(session_id, _llm, _tools)
        result = await executor.ainvoke({"input": req.query})
        return {
            "session_id": session_id,
            "answer": result.get("output", ""),
            "steps": [
                {"tool": s[0].tool, "input": str(s[0].tool_input), "output": str(s[1])}
                for s in result.get("intermediate_steps", [])
            ],
        }
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@app.delete("/agent/session/{session_id}")
def delete_session(session_id: str):
    existed = clear_session(session_id)
    return {"cleared": existed, "session_id": session_id}
