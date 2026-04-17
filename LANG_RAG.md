This project is an excellent RAG candidate. The existing AI feature is just raw prompting via axios — no
  LangChain, no vector store, no retrieval. That gap is your opportunity. Patents are dense, domain-specific
  documents with claims, abstracts, and citations — exactly the kind of corpus that makes RAG genuinely
  valuable vs. basic prompting.

  Here's a plan to make this a standout portfolio piece:

  ---
  The Narrative

  ▎ "I replaced a basic prompt → search-term converter with a full LangChain RAG agent that can research,
  ▎ compare, and analyze patents like an expert assistant — integrated into a live Web3 marketplace."

  That's a story that shows the full stack: document ingestion, embeddings, retrieval, agentic tool use, and real-world integration.

  ---
  Phase 1: RAG Knowledge Base (Core LangChain Skills)

  What to build: A vector store of patent documents that gets queried instead of just sending user text to GPT.

  Key pieces:
  - LangChain Document Loaders — load from your existing patents-db.json + patent PDFs fetched via your
  existing PDF route
  - RecursiveCharacterTextSplitter — chunk patent claims, abstracts, and descriptions separately (claims are legally distinct from abstracts — show you know this)
  - OpenAIEmbeddings or HuggingFaceInferenceAPIEmbeddings (free tier)
  - ChromaDB (local, zero infra) or Pinecone (cloud, better for portfolio demos)
  - RetrievalQAChain — wire retrieval into a Q&A chain

  Portfolio signal: Shows you understand why naive prompting fails on specialized corpora and how retrieval
  grounds the model in real data.

  ---
  Phase 2: LangChain Chains (Showcase Composability)

  Replace backend/routes/ai.js with a proper LangChain layer. Three chains:

  ┌─────────────────────┬────────────────────────┬───────────────────────────────────────────────────────┐
  │        Chain        │         Input          │                        Output                         │
  ├─────────────────────┼────────────────────────┼───────────────────────────────────────────────────────┤
  │ PatentSearchChain   │ Natural language query │ Optimized search terms + retrieved similar patents    │
  ├─────────────────────┼────────────────────────┼───────────────────────────────────────────────────────┤
  │ PatentAnalysisChain │ Patent ID or text      │ Structured summary: claims, novelty, technology class │
  ├─────────────────────┼────────────────────────┼───────────────────────────────────────────────────────┤
  │ PriorArtChain       │ Patent claims text     │ Top-N prior art candidates with similarity scores     │
  └─────────────────────┴────────────────────────┴───────────────────────────────────────────────────────┘

  Key LangChain features to use:
  - PromptTemplate with variables (not hardcoded strings like the current code)
  - StructuredOutputParser with Zod/Pydantic schema — shows you can get reliable JSON back
  - LLMChain → SequentialChain for multi-step analysis

  ---
  Phase 3: Patent Research Agent (The "Agentic" Showcase)

  This is the differentiator. Build a ReAct agent with custom tools that can answer complex research questions
  in multiple steps.

  Agent tools to define:

  - SearchPatentDatabase(query) → calls your existing /api/patents route
  - RetrieveSimilarPatents(embedding_query) → hits your vector store
  - GetPatentDetails(patent_id) → fetches full patent data
  - CheckMintedNFTs() → reads from your smart contract via ethers.js
  - AnalyzePatentClaims(claims_text) → runs the analysis chain

  Example agent query that shows multi-step reasoning: 
  "Find me unminted battery technology patents from 2022 that are similar to US11234567, and tell me which ones would be most valuable to mint."

  The agent would: retrieve similar patents → check which are already minted on-chain → analyze remaining
  candidates → rank by relevance. That's a real workflow that couldn't be done with a single prompt.

  Key LangChain features: AgentExecutor, Tool, create_react_agent or create_openai_tools_agent,
  ConversationBufferMemory for multi-turn sessions.

  ---
  Phase 4: Conversation Memory + Multi-turn Research Sessions

  Add ConversationBufferWindowMemory so the agent remembers context within a research session:

  ▎ "Show me AI patents in healthcare"
  ▎ "Now filter those to just 2023"
  ▎ "Which of these are already in the marketplace?"

  This is a natural fit for patent research (researchers iterate, narrow, pivot) and clearly differentiates
  from stateless one-shot API calls.

  ---
  Tech Stack for the AI Layer

  LangChain (Python) — new backend/ai/ service
    ├── FastAPI server (or keep Express and call Python as a microservice)
    ├── ChromaDB — vector store (persisted to disk, zero infra)
    ├── OpenAI / Claude API — LLM + embeddings
    └── LangSmith — tracing & observability (free tier, shows in portfolio)

  ▎ Language choice: LangChain is substantially more mature in Python than JS (langchain npm pkg lags
  ▎ significantly). A Python FastAPI microservice that your existing Express backend calls is the professional
  ▎ approach and signals you know the ecosystem.

  ---
  What Makes This Stand Out vs. Generic RAG Demos

  1. Domain-specific chunking — splitting patent claims vs abstract vs description differently, because those sections serve different legal/search purposes
  2. Hybrid retrieval — combine semantic similarity (embeddings) with keyword filters (patent class, date
  range) — shows you know naive vector search has limits
  3. On-chain integration — the agent checking minted NFTs via ethers.js is something no tutorial RAG demo does
  4. LangSmith traces — screenshot your agent's reasoning chain in the portfolio; it's visually compelling and proves it actually works
  5. Evaluation — add a small evals/ folder with LangChain's eval framework testing retrieval quality. Very few portfolio projects include this.

  ---
  Suggested Build Order

  1. Set up Python FastAPI service with LangChain + ChromaDB, index patents-db.json
  2. Wire POST /api/ai/search to the new RAG chain (drop-in replacement, same API contract)
  3. Add the analysis + prior art chains
  4. Build the agent with tools
  5. Add conversation memory to the frontend chat UI
  6. Add LangSmith tracing + screenshot it
  7. Write a concise AI_ARCHITECTURE.md explaining your choices