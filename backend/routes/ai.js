const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * AI search proxy endpoints
 * AI API keys are stored server-side only — never exposed to the browser bundle.
 */

const OPENAI_BASE_URL = 'https://api.openai.com/v1';

function buildSearchPrompt(query) {
  return `Convert this natural language patent search query into Google Patents search terms:
"${query}"

Please provide:
1. Optimized search terms for Google Patents database (supports boolean operators, quotes, wildcards)
2. Brief explanation of the search strategy
3. Confidence level (0-100)
4. Suggested filters (category, date range, status)

Format your response as JSON:
{
  "searchTerms": "optimized search string using Google Patents syntax",
  "explanation": "brief explanation of search approach",
  "confidence": 85,
  "suggestedFilters": {
    "category": "Technology",
    "dateRange": "2020-2024",
    "status": "active"
  }
}`;
}

// POST /api/ai/search — convert natural language query to patent search terms
router.post('/search', async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query string is required' });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!openaiKey && !geminiKey) {
    return res.status(503).json({ error: 'No AI provider configured on server' });
  }

  try {
    if (openaiKey) {
      const response = await axios.post(
        `${OPENAI_BASE_URL}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a patent search expert specialising in Google Patents. Convert natural language queries into effective search terms and provide helpful context.'
            },
            { role: 'user', content: buildSearchPrompt(query) }
          ],
          max_tokens: 500,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const text = response.data.choices[0].message.content;
      return res.json({ provider: 'openai', result: text });
    }

    // Gemini fallback
    const geminiPrompt = `As a patent search expert, convert this natural language query into effective Google Patents search terms:\n\n"${query}"\n\nProvide optimised search terms, brief explanation, and confidence level 0-100.\n\nRespond in JSON:\n{\n  "searchTerms": "optimized search string",\n  "explanation": "brief explanation",\n  "confidence": 85\n}`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
      { contents: [{ parts: [{ text: geminiPrompt }] }] },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const text = response.data.candidates[0].content.parts[0].text;
    return res.json({ provider: 'gemini', result: text });

  } catch (error) {
    console.error('AI search error:', error.message);
    res.status(502).json({ error: 'AI provider request failed' });
  }
});

// POST /api/ai/suggestions — autocomplete suggestions for a partial query
router.post('/suggestions', async (req, res) => {
  const { partialQuery } = req.body;
  if (!partialQuery || typeof partialQuery !== 'string' || partialQuery.length < 3) {
    return res.status(400).json({ error: 'partialQuery must be at least 3 characters' });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return res.status(503).json({ error: 'OpenAI not configured on server' });
  }

  try {
    const response = await axios.post(
      `${OPENAI_BASE_URL}/chat/completions`,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Generate 5 patent search suggestions based on the partial query. Return only a JSON array of strings.'
          },
          { role: 'user', content: `Partial query: "${partialQuery}"` }
        ],
        max_tokens: 200,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const suggestions = JSON.parse(response.data.choices[0].message.content);
    return res.json({ suggestions: Array.isArray(suggestions) ? suggestions : [] });
  } catch (error) {
    console.error('AI suggestions error:', error.message);
    res.status(502).json({ error: 'AI provider request failed' });
  }
});

module.exports = router;
