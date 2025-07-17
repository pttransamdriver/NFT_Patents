import axios from 'axios';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_BASE_URL = 'https://api.openai.com/v1';

export interface AISearchRequest {
  naturalLanguageQuery: string;
  context?: string;
  maxResults?: number;
}

export interface AISearchResponse {
  searchTerms: string;
  explanation: string;
  confidence: number;
  suggestedFilters?: {
    category?: string;
    dateRange?: string;
    status?: string;
  };
}

export class AISearchService {
  private static instance: AISearchService;
  
  public static getInstance(): AISearchService {
    if (!AISearchService.instance) {
      AISearchService.instance = new AISearchService();
    }
    return AISearchService.instance;
  }

  async convertNaturalLanguageToSearch(request: AISearchRequest): Promise<AISearchResponse> {
    // Check if API key is available
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.warn('OpenAI API key not configured. Using fallback search conversion.');
      return this.getFallbackSearchResponse(request.naturalLanguageQuery);
    }

    try {
      const prompt = this.buildSearchPrompt(request.naturalLanguageQuery);

      const response = await axios.post(
        `${OPENAI_BASE_URL}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a patent search expert. Convert natural language queries into USPTO search terms and provide helpful context.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return this.parseAIResponse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('AI Search Error:', error);
      // Fallback to rule-based search
      return this.fallbackSearch(request.naturalLanguageQuery);
    }
  }

  private buildSearchPrompt(query: string): string {
    return `
Convert this natural language patent search query into USPTO search terms:
"${query}"

Please provide:
1. Optimized search terms for USPTO database
2. Brief explanation of the search strategy
3. Confidence level (0-100)
4. Suggested filters (category, date range, status)

Format your response as JSON:
{
  "searchTerms": "optimized search string",
  "explanation": "brief explanation",
  "confidence": 85,
  "suggestedFilters": {
    "category": "Technology",
    "dateRange": "2020-2024",
    "status": "active"
  }
}
`;
  }

  private parseAIResponse(aiResponse: string): AISearchResponse {
    try {
      // Try to parse JSON response
      const parsed = JSON.parse(aiResponse);
      return {
        searchTerms: parsed.searchTerms || '',
        explanation: parsed.explanation || 'AI-generated search terms',
        confidence: parsed.confidence || 75,
        suggestedFilters: parsed.suggestedFilters || {}
      };
    } catch (error) {
      // If JSON parsing fails, extract search terms from text
      const searchTerms = this.extractSearchTermsFromText(aiResponse);
      return {
        searchTerms,
        explanation: 'AI-generated search terms',
        confidence: 60,
        suggestedFilters: {}
      };
    }
  }

  private extractSearchTermsFromText(text: string): string {
    // Extract search terms from unstructured AI response
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('search') && line.includes(':')) {
        return line.split(':')[1].trim().replace(/['"]/g, '');
      }
    }
    return text.substring(0, 100); // Fallback
  }

  private fallbackSearch(query: string): AISearchResponse {
    // Enhanced rule-based fallback
    const lowerQuery = query.toLowerCase();
    let searchTerms = query;
    let category = 'Other';
    
    if (lowerQuery.includes('renewable energy') || lowerQuery.includes('solar') || lowerQuery.includes('wind')) {
      searchTerms = 'renewable energy OR solar OR wind OR photovoltaic OR sustainable';
      category = 'Energy';
    } else if (lowerQuery.includes('ai') || lowerQuery.includes('artificial intelligence') || lowerQuery.includes('machine learning')) {
      searchTerms = 'artificial intelligence OR machine learning OR neural network OR deep learning OR AI';
      category = 'Technology';
    } else if (lowerQuery.includes('medical') || lowerQuery.includes('health') || lowerQuery.includes('drug')) {
      searchTerms = 'medical OR healthcare OR pharmaceutical OR drug OR therapy OR treatment';
      category = 'Healthcare';
    } else if (lowerQuery.includes('battery') || lowerQuery.includes('energy storage')) {
      searchTerms = 'battery OR energy storage OR lithium OR electrochemical OR power storage';
      category = 'Energy';
    } else if (lowerQuery.includes('quantum')) {
      searchTerms = 'quantum computing OR quantum OR qubit OR quantum algorithm';
      category = 'Technology';
    } else if (lowerQuery.includes('blockchain') || lowerQuery.includes('crypto')) {
      searchTerms = 'blockchain OR cryptocurrency OR distributed ledger OR smart contract';
      category = 'Technology';
    }

    return {
      searchTerms,
      explanation: 'Rule-based search term generation',
      confidence: 70,
      suggestedFilters: { category }
    };
  }

  async generateSearchSuggestions(partialQuery: string): Promise<string[]> {
    if (partialQuery.length < 3) return [];

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
            {
              role: 'user',
              content: `Partial query: "${partialQuery}"`
            }
          ],
          max_tokens: 200,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const suggestions = JSON.parse(response.data.choices[0].message.content);
      return Array.isArray(suggestions) ? suggestions : [];
    } catch (error) {
      console.error('AI Suggestions Error:', error);
      return this.fallbackSuggestions(partialQuery);
    }
  }

  private getFallbackSearchResponse(query: string): AISearchResponse {
    const lowerQuery = query.toLowerCase();
    let searchTerms = query;
    let explanation = 'Using basic keyword matching';
    let confidence = 60;

    // Simple rule-based conversion
    if (lowerQuery.includes('renewable energy') || lowerQuery.includes('solar') || lowerQuery.includes('wind')) {
      searchTerms = 'renewable energy OR solar OR wind OR photovoltaic';
      explanation = 'Converted to renewable energy search terms';
      confidence = 75;
    } else if (lowerQuery.includes('ai') || lowerQuery.includes('artificial intelligence') || lowerQuery.includes('machine learning')) {
      searchTerms = 'artificial intelligence OR machine learning OR neural network';
      explanation = 'Converted to AI/ML search terms';
      confidence = 75;
    } else if (lowerQuery.includes('battery') || lowerQuery.includes('energy storage')) {
      searchTerms = 'battery OR energy storage OR lithium';
      explanation = 'Converted to battery technology search terms';
      confidence = 75;
    } else if (lowerQuery.includes('quantum')) {
      searchTerms = 'quantum computing OR quantum';
      explanation = 'Converted to quantum technology search terms';
      confidence = 75;
    } else if (lowerQuery.includes('medical') || lowerQuery.includes('healthcare')) {
      searchTerms = 'medical OR healthcare OR diagnostic';
      explanation = 'Converted to medical technology search terms';
      confidence = 75;
    }

    return {
      searchTerms,
      explanation,
      confidence
    };
  }

  private fallbackSuggestions(partialQuery: string): string[] {
    const suggestions = [
      'Find renewable energy patents from 2020-2024',
      'Show me AI patents in healthcare',
      'Search for battery technology innovations',
      'Find quantum computing patents',
      'Medical device patents with FDA approval'
    ];

    return suggestions.filter(s =>
      s.toLowerCase().includes(partialQuery.toLowerCase())
    ).slice(0, 5);
  }
}

export const aiSearchService = AISearchService.getInstance();
