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
    // Check if any AI API key is available (OpenAI or Gemini)
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const hasValidApiKey = (OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key_here') ||
                          (geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here');

    if (!hasValidApiKey) {
      console.warn('No AI API key configured. Using enhanced fallback search conversion.');
      return this.getEnhancedFallbackSearchResponse(request.naturalLanguageQuery);
    }

    try {
      // Try OpenAI first
      if (OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key_here') {
        return await this.searchWithOpenAI(request.naturalLanguageQuery);
      }
      
      // Try Gemini as fallback
      if (geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here') {
        return await this.searchWithGemini(request.naturalLanguageQuery);
      }
      
      throw new Error('No valid AI API keys available');
    } catch (error) {
      console.error('AI Search Error:', error);
      // Enhanced fallback to rule-based search
      return this.getEnhancedFallbackSearchResponse(request.naturalLanguageQuery);
    }
  }

  private async searchWithOpenAI(query: string): Promise<AISearchResponse> {
    const prompt = this.buildSearchPrompt(query);

    const response = await axios.post(
      `${OPENAI_BASE_URL}/chat/completions`,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a patent search expert specializing in Google Patents search. Convert natural language queries into effective search terms for Google Patents database and provide helpful context.'
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
  }

  private async searchWithGemini(query: string): Promise<AISearchResponse> {
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const prompt = `As a patent search expert, convert this natural language query into effective Google Patents search terms:
    
"${query}"

Provide optimized search terms that work well with Google Patents database, brief explanation, and confidence level 0-100.

Respond in JSON format:
{
  "searchTerms": "optimized search string",
  "explanation": "brief explanation of search strategy",
  "confidence": 85
}`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.candidates[0].content.parts[0].text;
    return this.parseAIResponse(aiResponse);
  }

  private buildSearchPrompt(query: string): string {
    return `
Convert this natural language patent search query into Google Patents search terms:
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

  private getEnhancedFallbackSearchResponse(query: string): AISearchResponse {
    const lowerQuery = query.toLowerCase();
    let searchTerms = query;
    let explanation = 'Using enhanced rule-based search conversion';
    let confidence = 60;
    let category = 'Other';

    // Enhanced rule-based conversion with more sophisticated patterns
    if (lowerQuery.includes('renewable energy') || lowerQuery.includes('solar') || lowerQuery.includes('wind') || lowerQuery.includes('photovoltaic')) {
      searchTerms = '"renewable energy" OR "solar cell" OR "wind turbine" OR photovoltaic OR "clean energy"';
      explanation = 'Converted to comprehensive renewable energy search terms with Google Patents syntax';
      confidence = 80;
      category = 'Energy';
    } else if (lowerQuery.includes('ai') || lowerQuery.includes('artificial intelligence') || lowerQuery.includes('machine learning') || lowerQuery.includes('neural network')) {
      searchTerms = '"artificial intelligence" OR "machine learning" OR "neural network" OR "deep learning" OR "computer vision"';
      explanation = 'Converted to comprehensive AI/ML search terms';
      confidence = 80;
      category = 'Technology';
    } else if (lowerQuery.includes('battery') || lowerQuery.includes('energy storage') || lowerQuery.includes('lithium')) {
      searchTerms = 'battery OR "energy storage" OR "lithium ion" OR "electrochemical cell" OR "power storage"';
      explanation = 'Converted to comprehensive battery technology search terms';
      confidence = 80;
      category = 'Energy';
    } else if (lowerQuery.includes('quantum')) {
      searchTerms = '"quantum computing" OR quantum OR qubit OR "quantum algorithm" OR "quantum processor"';
      explanation = 'Converted to comprehensive quantum technology search terms';
      confidence = 80;
      category = 'Technology';
    } else if (lowerQuery.includes('medical') || lowerQuery.includes('healthcare') || lowerQuery.includes('drug') || lowerQuery.includes('pharmaceutical')) {
      searchTerms = 'medical OR healthcare OR pharmaceutical OR "medical device" OR diagnostic OR therapy';
      explanation = 'Converted to comprehensive medical technology search terms';
      confidence = 80;
      category = 'Healthcare';
    } else if (lowerQuery.includes('blockchain') || lowerQuery.includes('crypto') || lowerQuery.includes('cryptocurrency')) {
      searchTerms = 'blockchain OR cryptocurrency OR "distributed ledger" OR "smart contract" OR "digital currency"';
      explanation = 'Converted to comprehensive blockchain technology search terms';
      confidence = 80;
      category = 'Technology';
    } else if (lowerQuery.includes('robotics') || lowerQuery.includes('robot') || lowerQuery.includes('automation')) {
      searchTerms = 'robotics OR robot OR automation OR "autonomous system" OR "robotic arm"';
      explanation = 'Converted to comprehensive robotics search terms';
      confidence = 75;
      category = 'Technology';
    } else if (lowerQuery.includes('semiconductor') || lowerQuery.includes('microchip') || lowerQuery.includes('processor')) {
      searchTerms = 'semiconductor OR microchip OR processor OR "integrated circuit" OR "computer chip"';
      explanation = 'Converted to comprehensive semiconductor search terms';
      confidence = 75;
      category = 'Technology';
    } else {
      // Extract key technical terms and enhance with quotes for exact matches
      const words = query.split(' ').filter(word => word.length > 3);
      if (words.length > 1) {
        searchTerms = `"${query}" OR ${words.join(' OR ')}`;
        explanation = 'Enhanced search using exact phrase matching and key terms';
        confidence = 65;
      }
    }

    return {
      searchTerms,
      explanation,
      confidence,
      suggestedFilters: { category }
    };
  }

  private getFallbackSearchResponse(query: string): AISearchResponse {
    // Legacy method for backward compatibility
    return this.getEnhancedFallbackSearchResponse(query);
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
