"""
ReAct Patent Research Agent.

Uses create_react_agent (Reason + Act loop) so the model can:
  - Call multiple tools in sequence
  - Observe results and plan the next step
  - Continue until it has enough information to answer

Example multi-step query (from LANG_RAG.md):
  "Find unminted battery technology patents from 2022 similar to US10456789,
   and tell me which would be most valuable to mint."

The agent would:
  1. retrieve_similar_patents("battery technology 2022")
  2. check_minted_nfts("all")
  3. Filter candidates to unminted ones
  4. analyze_patent_claims(top candidates)
  5. Rank and explain

ConversationBufferWindowMemory (k=10) enables multi-turn sessions so
researchers can naturally narrow their query across messages.
"""

from __future__ import annotations

from langchain.agents import AgentExecutor, create_react_agent
from langchain.memory import ConversationBufferWindowMemory
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI


# ── ReAct prompt ──────────────────────────────────────────────────────────────
# The template must contain: {tools}, {tool_names}, {input},
# {agent_scratchpad}, and our memory key {chat_history}.

_REACT_PROMPT = PromptTemplate.from_template(
    """You are an expert patent research agent with access to a live patent database,
a local semantic knowledge base, and the NFT Patents blockchain marketplace.

You help users:
• Find patents matching specific technology criteria
• Analyze claims and assess novelty / investment value
• Identify prior art risks
• Discover which patents are already minted as NFTs — and which are unminted opportunities

Always reason step-by-step. Use multiple tools when a question requires it.
Be precise: cite patent numbers and titles in your final answer.

Available tools:
{tools}

Tool names: {tool_names}

Previous conversation:
{chat_history}

Question: {input}
Thought:{agent_scratchpad}"""
)


# ── Session memory store ──────────────────────────────────────────────────────

def _make_memory() -> ConversationBufferWindowMemory:
    return ConversationBufferWindowMemory(
        memory_key="chat_history",
        k=10,           # keep last 10 turns — enough context without token bloat
        return_messages=False,
    )


# ── Agent builder ─────────────────────────────────────────────────────────────

def build_patent_agent(
    llm: ChatOpenAI,
    tools: list,
    memory: ConversationBufferWindowMemory | None = None,
) -> AgentExecutor:
    """Build and return a ReAct AgentExecutor.

    Args:
        llm:     ChatOpenAI instance (gpt-4o-mini recommended — good at tool use).
        tools:   List of LangChain tools from agent/tools.py.
        memory:  Optional pre-existing memory (for session continuity).

    Returns:
        AgentExecutor ready to call with {"input": "user question"}.
    """
    if memory is None:
        memory = _make_memory()

    agent = create_react_agent(llm, tools, _REACT_PROMPT)

    return AgentExecutor(
        agent=agent,
        tools=tools,
        memory=memory,
        verbose=True,           # prints Thought/Action/Observation for LangSmith
        max_iterations=8,       # guard against runaway loops
        handle_parsing_errors=True,
        return_intermediate_steps=True,  # expose tool calls to the API response
    )


# ── Session registry ─────────────────────────────────────────────────────────
# Simple in-memory dict {session_id → AgentExecutor}.
# For production, replace with Redis-backed sessions.

_sessions: dict[str, AgentExecutor] = {}


def get_or_create_session(
    session_id: str,
    llm: ChatOpenAI,
    tools: list,
) -> AgentExecutor:
    """Return an existing agent session or create a fresh one."""
    if session_id not in _sessions:
        _sessions[session_id] = build_patent_agent(llm, tools)
    return _sessions[session_id]


def clear_session(session_id: str) -> bool:
    """Remove a session from the registry. Returns True if it existed."""
    return _sessions.pop(session_id, None) is not None
