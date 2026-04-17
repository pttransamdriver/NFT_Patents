"""
PatentAnalysisChain — structured patent analysis with Pydantic output schema.

Demonstrates LangChain's StructuredOutputParser pattern: instead of asking
the LLM to "return JSON", we define a Pydantic schema, attach it to
JsonOutputParser, and get back a validated Python dict every time.

Input:  {"patent_text": str}   — full patent text, abstract, or claims
Output: PatentAnalysis dict
"""

from __future__ import annotations

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field


# ── Output schema ─────────────────────────────────────────────────────────────

class PatentAnalysis(BaseModel):
    title: str = Field(description="Patent title")
    patent_number: str = Field(description="Patent number if identifiable, else 'Unknown'")
    technology_class: str = Field(
        description="Primary technology classification (e.g. 'Medical Devices', "
                    "'Clean Energy', 'Semiconductor')"
    )
    novelty_assessment: str = Field(
        description="What makes this patent novel over existing art — 2–3 sentences"
    )
    key_claims: list[str] = Field(
        description="The 3 most legally / commercially important claims, each summarised "
                    "in plain English"
    )
    potential_applications: list[str] = Field(
        description="2–4 concrete real-world applications or industries this could serve"
    )
    prior_art_risk: str = Field(
        description="Overall prior art risk: LOW | MEDIUM | HIGH"
    )
    investment_potential: str = Field(
        description="NFT minting investment potential: LOW | MEDIUM | HIGH"
    )
    summary: str = Field(
        description="2–3 sentence plain-English executive summary"
    )


# ── Prompt ───────────────────────────────────────────────────────────────────

_ANALYSIS_PROMPT = ChatPromptTemplate.from_template(
    """You are a senior patent attorney and technology investment analyst.

Analyse the patent information below and produce a structured assessment.
Be concise, accurate, and commercially grounded.

PATENT INFORMATION:
{patent_text}

{format_instructions}"""
)


# ── Chain builder ─────────────────────────────────────────────────────────────

def build_analysis_chain(llm: ChatOpenAI):
    """Return a runnable PatentAnalysisChain.

    Input:  {{"patent_text": str}}
    Output: PatentAnalysis dict
    """
    parser = JsonOutputParser(pydantic_object=PatentAnalysis)

    prompt = _ANALYSIS_PROMPT.partial(
        format_instructions=parser.get_format_instructions()
    )

    return prompt | llm | parser
