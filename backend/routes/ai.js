const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * AI proxy layer — Express routes call the Python LangChain service.
 *
 * Architecture:
 *   Browser → Express (/api/ai/*) → Python FastAPI (:8000) → LangChain RAG / Agent
 *
 * Express handles auth, rate limiting, CORS, and key management.
 * Python handles LangChain chains, ChromaDB, and the ReAct agent.
 *
 * If the Python service is unavailable, /search and /suggestions fall back to
 * direct OpenAI calls so the app stays functional during development.
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/** Forward a request body to the Python service; return its JSON response. */
async function proxyToPython(path, body) {
  const response = await axios.post(`${AI_SERVICE_URL}${path}`, body, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  });
  return response.data;
}

// ── Legacy fallback prompt (used when Python service is offline) ──────────────
const OPENAI_BASE_URL = 'https://api.openai.com/v1';

function buildSearchPrompt(query) {
  return `Convert this natural language patent search query into Google Patents search terms:
"${query}"

Respond as JSON:
{
  "searchTerms": "optimized search string using Google Patents syntax",
  "explanation": "brief explanation of search approach",
  "confidence": 85,
  "suggestedFilters": { "category": "Technology", "dateRange": "2020-2024", "status": "active" }
}`;
}

const MAX_QUERY_LENGTH = 500;       // chars — enough for any real patent query
const MAX_PARTIAL_QUERY_LENGTH = 200; // chars — for autocomplete suggestions

// POST /api/ai/search — RAG-powered search (Python) with OpenAI fallback
router.post('/search', async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query string is required' });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return res.status(400).json({ error: `query must not exceed ${MAX_QUERY_LENGTH} characters` });
  }

  // Try Python LangChain service first
  try {
    const data = await proxyToPython('/search', { query });
    return res.json(data);
  } catch (pythonErr) {
    console.warn('⚠️  Python AI service unavailable, falling back to direct OpenAI:', pythonErr.message);
  }

  // Fallback: direct OpenAI call (keeps app functional during development)
  const userApiKey = typeof req.headers['x-user-api-key'] === 'string'
    ? req.headers['x-user-api-key'].trim() : null;
  const openaiKey = userApiKey || process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!openaiKey && !geminiKey) {
    return res.status(503).json({ error: 'No AI provider configured on server' });
  }

  try {
    if (openaiKey) {
      const response = await axios.post(
        `${OPENAI_BASE_URL}/chat/completions`,
        { model: 'gpt-3.5-turbo', messages: [
            { role: 'system', content: 'You are a patent search expert specialising in Google Patents.' },
            { role: 'user', content: buildSearchPrompt(query) }
          ], max_tokens: 500, temperature: 0.3 },
        { headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' } }
      );
      return res.json({ provider: 'openai-fallback', result: response.data.choices[0].message.content });
    }
    const geminiPrompt = `Convert this patent query to search terms: "${query}". Respond as JSON with searchTerms, explanation, confidence fields.`;
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      { contents: [{ parts: [{ text: geminiPrompt }] }] },
      { headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey } }
    );
    return res.json({ provider: 'gemini-fallback', result: response.data.candidates[0].content.parts[0].text });
  } catch (error) {
    console.error('AI search fallback error:', error.message);
    res.status(502).json({ error: 'AI provider request failed' });
  }
});

// POST /api/ai/suggestions — autocomplete via Python, fallback to OpenAI
router.post('/suggestions', async (req, res) => {
  const { partialQuery } = req.body;
  if (!partialQuery || typeof partialQuery !== 'string' || partialQuery.length < 3) {
    return res.status(400).json({ error: 'partialQuery must be at least 3 characters' });
  }
  if (partialQuery.length > MAX_PARTIAL_QUERY_LENGTH) {
    return res.status(400).json({ error: `partialQuery must not exceed ${MAX_PARTIAL_QUERY_LENGTH} characters` });
  }

  try {
    const data = await proxyToPython('/suggest', { query: partialQuery });
    return res.json(data);
  } catch (_) { /* fall through to OpenAI */ }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return res.status(503).json({ error: 'OpenAI not configured on server' });

  try {
    const response = await axios.post(
      `${OPENAI_BASE_URL}/chat/completions`,
      { model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Generate 5 patent search suggestions. Return only a JSON array of strings.' },
          { role: 'user', content: `Partial query: "${partialQuery}"` }
        ], max_tokens: 200, temperature: 0.7 },
      { headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' } }
    );
    const suggestions = JSON.parse(response.data.choices[0].message.content);
    return res.json({ suggestions: Array.isArray(suggestions) ? suggestions : [] });
  } catch (error) {
    console.error('AI suggestions error:', error.message);
    res.status(502).json({ error: 'AI provider request failed' });
  }
});

// ── New LangChain-powered endpoints ──────────────────────────────────────────

// POST /api/ai/analyze — PatentAnalysisChain
router.post('/analyze', async (req, res) => {
  const { patent_text } = req.body;
  if (!patent_text || typeof patent_text !== 'string') {
    return res.status(400).json({ error: 'patent_text is required' });
  }
  if (patent_text.length > 8000) {
    return res.status(400).json({ error: 'patent_text must not exceed 8000 characters' });
  }
  try {
    const data = await proxyToPython('/analyze', { patent_text });
    return res.json(data);
  } catch (error) {
    console.error('Patent analysis error:', error.message);
    res.status(502).json({ error: 'Patent analysis service unavailable' });
  }
});

// POST /api/ai/prior-art — PriorArtChain
router.post('/prior-art', async (req, res) => {
  const { claims_text } = req.body;
  if (!claims_text || typeof claims_text !== 'string') {
    return res.status(400).json({ error: 'claims_text is required' });
  }
  if (claims_text.length > 8000) {
    return res.status(400).json({ error: 'claims_text must not exceed 8000 characters' });
  }
  try {
    const data = await proxyToPython('/prior-art', { claims_text });
    return res.json(data);
  } catch (error) {
    console.error('Prior art search error:', error.message);
    res.status(502).json({ error: 'Prior art service unavailable' });
  }
});

// POST /api/ai/agent/query — one-shot ReAct agent
router.post('/agent/query', async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query is required' });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return res.status(400).json({ error: `query must not exceed ${MAX_QUERY_LENGTH} characters` });
  }
  try {
    const data = await proxyToPython('/agent/query', { query });
    return res.json(data);
  } catch (error) {
    console.error('Agent query error:', error.message);
    res.status(502).json({ error: 'Agent service unavailable' });
  }
});

// POST /api/ai/agent/chat — multi-turn ReAct agent with session memory
router.post('/agent/chat', async (req, res) => {
  const { query, session_id } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query is required' });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return res.status(400).json({ error: `query must not exceed ${MAX_QUERY_LENGTH} characters` });
  }
  try {
    const data = await proxyToPython('/agent/chat', { query, session_id });
    return res.json(data);
  } catch (error) {
    console.error('Agent chat error:', error.message);
    res.status(502).json({ error: 'Agent service unavailable' });
  }
});

// POST /api/ai/reindex — trigger a ChromaDB re-index of patents-db.json
router.post('/reindex', async (req, res) => {
  try {
    const data = await proxyToPython('/index', {});
    return res.json(data);
  } catch (error) {
    console.error('Reindex error:', error.message);
    res.status(502).json({ error: 'AI service unavailable' });
  }
});

module.exports = router;
