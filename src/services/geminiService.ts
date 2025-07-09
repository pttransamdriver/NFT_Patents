import axios from 'axios';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export class GeminiSearchService {
  private static instance: GeminiSearchService;
  
  public static getInstance(): GeminiSearchService {
    if (!GeminiSearchService.instance) {
      GeminiSearchService.instance = new GeminiSearchService();
    }
    return GeminiSearchService.instance;
  }

  async convertNaturalLanguageToSearch(query: string): Promise<{
    searchTerms: string;
    explanation: string;
    confidence: number;
    suggestedFilters?: any;
  }> {
    try {
      const prompt = `
You are a patent search expert. Convert this natural language query into optimized USPTO search terms:

Query: "${query}"

Provide your response in this exact JSON format:
{
  "searchTerms": "optimized search string with OR operators",
  "explanation": "brief explanation of search strategy",
  "confidence": 85,
  "suggestedFilters": {
    "category": "Technology",
    "dateRange": "2020-2024"
  }
}
`;

      const response = await axios.post(
        `${GEMINI_BASE_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const generatedText = response.data.candidates[0].content.parts[0].text;
      return this.parseGeminiResponse(generatedText);
    } catch (error) {
      console.error('Gemini API Error:', error);
      return this.fallbackSearch(query);
    }
  }

  private parseGeminiResponse(response: string): {
    searchTerms: string;
    explanation: string;
    confidence: number;
    suggestedFilters?: any;
  } {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          searchTerms: parsed.searchTerms || '',
          explanation: parsed.explanation || 'AI-generated search terms',
          confidence: parsed.confidence || 75,
          suggestedFilters: parsed.suggestedFilters || {}
        };
      }
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
    }

    // Fallback parsing
    return {
      searchTerms: this.extractSearchTermsFromText(response),
      explanation: 'AI-generated search terms',
      confidence: 60
    };
  }

  private extractSearchTermsFromText(text: string): string {
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('search') && line.includes(':')) {
        return line.split(':')[1].trim().replace(/['"]/g, '');
      }
    }
    return text.substring(0, 100);
  }

  private fallbackSearch(query: string): {
    searchTerms: string;
    explanation: string;
    confidence: number;
  } {
    return {
      searchTerms: query,
      explanation: 'Fallback search (original query)',
      confidence: 50
    };
  }
}

export const geminiService = GeminiSearchService.getInstance();
