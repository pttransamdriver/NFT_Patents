import axios from 'axios';
import { BaseSingleton } from '../utils/baseSingleton';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

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

export class AISearchService extends BaseSingleton {

  async convertNaturalLanguageToSearch(request: AISearchRequest): Promise<AISearchResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai/search`, {
        query: request.naturalLanguageQuery
      });
      return this.parseAIResponse(response.data.result);
    } catch (error: any) {
      // Backend has no AI key configured, or provider failed — use local fallback
      if (error?.response?.status === 503 || error?.response?.status === 502) {
        console.info('AI provider unavailable, using rule-based fallback');
      } else {
        console.error('AI Search Error:', error);
      }
      return this.getEnhancedFallbackSearchResponse(request.naturalLanguageQuery);
    }
  }

  async generateSearchSuggestions(partialQuery: string): Promise<string[]> {
    if (partialQuery.length < 3) return [];

    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai/suggestions`, {
        partialQuery
      });
      return response.data.suggestions ?? [];
    } catch (error) {
      console.error('AI Suggestions Error:', error);
      return this.fallbackSuggestions(partialQuery);
    }
  }

  private parseAIResponse(aiResponse: string): AISearchResponse {
    try {
      const parsed = JSON.parse(aiResponse);
      return {
        searchTerms: parsed.searchTerms || '',
        explanation: parsed.explanation || 'AI-generated search terms',
        confidence: parsed.confidence || 75,
        suggestedFilters: parsed.suggestedFilters || {}
      };
    } catch (error) {
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
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('search') && line.includes(':')) {
        return line.split(':')[1].trim().replace(/['"]/g, '');
      }
    }
    return text.substring(0, 100);
  }

  private getEnhancedFallbackSearchResponse(query: string): AISearchResponse {
    const lowerQuery = query.toLowerCase();
    let searchTerms = query;
    let explanation = 'Using enhanced rule-based search conversion';
    let confidence = 60;
    let category = 'Other';

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

export const aiSearchService = AISearchService.getInstance() as AISearchService;
