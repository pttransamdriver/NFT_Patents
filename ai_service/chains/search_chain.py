"""
PatentSearchChain — RAG-powered natural language → patent search terms.

Replaces the raw single-shot prompt in backend/routes/ai.js with a full
retrieval-augmented chain:

  1. Retrieve the 4 most relevant patent abstracts from ChromaDB
     (abstracts are the best grounding signal — they're dense and precise)
  2. Inject retrieved context into a structured prompt
  3. Parse the LLM response into a typed Pydantic schema via JsonOutputParser

Using StructuredOutputParser with a Pydantic schema rather than asking the
LLM to "respond in JSON" makes the output reliable and testable — a common
interview talking point.
"""

from __future__ import annotations

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from ..rag.vector_store import Chroma, hybrid_search


# ── Output schema ────────────────────────────────────────────────────────────

class SearchResult(BaseModel):
    searchTerms: str = Field(
        description="Optimized patent search string using Google Patents syntax "
                    "(boolean operators AND/OR/NOT, quoted phrases, wildcards *)"
    )
    explanation: str = Field(
        description="Brief explanation of the search strategy and why these "
                    "terms were chosen"
    )
    confidence: int = Field(
        description="Confidence score 0–100",
        ge=0,
        le=100,
    )
    suggestedFilters: dict = Field(
        default_factory=dict,
        description="Suggested filters: category, dateRange, status",
    )
    retrievedContext: list[str] = Field(
        default_factory=list,
        description="Titles of similar patents retrieved from the knowledge base "
                    "that grounded this response",
    )


# ── Prompt ───────────────────────────────────────────────────────────────────

_SEARCH_PROMPT = ChatPromptTemplate.from_template(
    """You are a senior patent search specialist with deep expertise in Google Patents.

SIMILAR PATENTS RETRIEVED FROM THE KNOWLEDGE BASE:
{context}

USER QUERY: {query}

Using the retrieved patent context above as grounding (not as the answer),
generate optimised search terms for Google Patents.

Google Patents syntax reference:
- Boolean: AND  OR  NOT
- Exact phrase: "neural network inference"
- Wildcard: electron*
- Field prefix: title:  abstract:  inventor:  assignee:

Respond ONLY with valid JSON matching this exact schema:
{{
  "searchTerms": "optimized search string",
  "explanation": "2–3 sentences on the search strategy",
  "confidence": 85,
  "suggestedFilters": {{
    "category": "Technology",
    "dateRange": "2020-2024",
    "status": "active"
  }},
  "retrievedContext": ["Patent Title 1", "Patent Title 2"]
}}"""
)


# ── Chain builder ─────────────────────────────────────────────────────────────

def build_search_chain(llm: ChatOpenAI, vectorstore: Chroma):
    """Return a runnable PatentSearchChain.

    Input:  {"query": str}
    Output: SearchResult dict
    """

    def _retrieve(inputs: dict) -> dict:
        docs = hybrid_search(
            vectorstore,
            inputs["query"],
            k=4,
            section="abstract",  # abstracts are the best grounding signal
        )
        context_lines = []
        for doc in docs:
            title = doc.metadata.get("title", "Unknown")
            pn = doc.metadata.get("patent_number", "")
            snippet = doc.page_content[:180].replace("\n", " ")
            context_lines.append(f"• [{pn}] {title}: {snippet}…")

        return {
            "query": inputs["query"],
            "context": "\n".join(context_lines) or "No similar patents in knowledge base.",
        }

    parser = JsonOutputParser(pydantic_object=SearchResult)

    chain = RunnablePassthrough() | _retrieve | _SEARCH_PROMPT | llm | parser
    return chain
