"""
PriorArtChain — semantic prior art search with similarity scoring.

Workflow:
  1. Run hybrid_search on the full-doc section (broadest coverage)
  2. De-duplicate results by patent number
  3. Ask the LLM to rank each candidate and assess overall prior art risk

Input:  {"claims_text": str}   — patent claims or description to search against
Output: PriorArtResult dict
"""

from __future__ import annotations

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from ..rag.vector_store import Chroma, hybrid_search


# ── Output schema ─────────────────────────────────────────────────────────────

class PriorArtCandidate(BaseModel):
    patent_number: str
    title: str
    similarity_score: str = Field(description="HIGH | MEDIUM | LOW")
    relevant_aspects: str = Field(
        description="Which aspects of the subject patent this prior art addresses"
    )


class PriorArtResult(BaseModel):
    query_summary: str = Field(description="One-sentence summary of what was searched")
    candidates: list[PriorArtCandidate] = Field(
        description="Prior art candidates ranked by relevance, most relevant first"
    )
    overall_risk: str = Field(description="Aggregate prior art risk: LOW | MEDIUM | HIGH")
    recommendation: str = Field(
        description="Actionable recommendation for the patent holder (2–3 sentences)"
    )


# ── Prompt ────────────────────────────────────────────────────────────────────

_PRIOR_ART_PROMPT = ChatPromptTemplate.from_template(
    """You are a patent prior art specialist.

Given the patent claims / description below, analyse the potentially relevant
prior art retrieved from the knowledge base and assess the risk.

PATENT CLAIMS / DESCRIPTION TO ANALYSE:
{claims_text}

POTENTIALLY RELEVANT PRIOR ART FROM KNOWLEDGE BASE:
{retrieved}

{format_instructions}"""
)


# ── Chain builder ─────────────────────────────────────────────────────────────

def build_prior_art_chain(llm: ChatOpenAI, vectorstore: Chroma):
    """Return a runnable PriorArtChain.

    Input:  {{"claims_text": str}}
    Output: PriorArtResult dict
    """

    def _retrieve(inputs: dict) -> dict:
        docs = hybrid_search(
            vectorstore,
            inputs["claims_text"],
            k=6,
            section="full",  # full-doc chunks give broadest coverage for prior art
        )

        # De-duplicate by patent number, keep first occurrence (highest similarity)
        seen: set[str] = set()
        lines: list[str] = []
        for doc in docs:
            pn = doc.metadata.get("patent_number", "UNKNOWN")
            if pn in seen:
                continue
            seen.add(pn)
            title = doc.metadata.get("title", "Unknown")
            snippet = doc.page_content[:250].replace("\n", " ")
            lines.append(f"• [{pn}] {title}\n  {snippet}…")

        return {
            "claims_text": inputs["claims_text"],
            "retrieved": "\n\n".join(lines) or "No similar patents found in knowledge base.",
        }

    parser = JsonOutputParser(pydantic_object=PriorArtResult)
    prompt = _PRIOR_ART_PROMPT.partial(
        format_instructions=parser.get_format_instructions()
    )

    chain = RunnablePassthrough() | _retrieve | prompt | llm | parser
    return chain
