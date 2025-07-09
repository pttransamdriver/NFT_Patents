import axios from 'axios';

const HF_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY;
const HF_BASE_URL = 'https://api-inference.huggingface.co/models';

export class HuggingFaceSearchService {
  private static instance: HuggingFaceSearchService;
  
  public static getInstance(): HuggingFaceSearchService {
    if (!HuggingFaceSearchService.instance) {
      HuggingFaceSearchService.instance = new HuggingFaceSearchService();
    }
    return HuggingFaceSearchService.instance;
  }

  async convertNaturalLanguageToSearch(query: string): Promise<{
    searchTerms: string;
    explanation: string;
    confidence: number;
  }> {
    try {
      // Use a text generation model to convert natural language to search terms
      const response = await axios.post(
        `${HF_BASE_URL}/microsoft/DialoGPT-medium`,
        {
          inputs: `Convert this to patent search terms: "${query}" -> Search terms:`,
          parameters: {
            max_length: 100,
            temperature: 0.3,
            do_sample: true
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${HF_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const generatedText = response.data[0]?.generated_text || query;
      const searchTerms = this.extractSearchTerms(generatedText);

      return {
        searchTerms,
        explanation: 'AI-generated using Hugging Face',
        confidence: 75
      };
    } catch (error) {
      console.error('Hugging Face API Error:', error);
      return this.fallbackSearch(query);
    }
  }

  async classifyPatentCategory(text: string): Promise<string> {
    try {
      const response = await axios.post(
        `${HF_BASE_URL}/facebook/bart-large-mnli`,
        {
          inputs: text,
          parameters: {
            candidate_labels: [
              'Healthcare',
              'Technology',
              'Energy',
              'Transportation',
              'Materials',
              'Environmental',
              'Other'
            ]
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${HF_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.labels[0] || 'Other';
    } catch (error) {
      console.error('Classification Error:', error);
      return 'Other';
    }
  }

  private extractSearchTerms(generatedText: string): string {
    // Extract search terms from generated text
    const lines = generatedText.split('\n');
    for (const line of lines) {
      if (line.includes('Search terms:')) {
        return line.split('Search terms:')[1].trim();
      }
    }
    return generatedText.substring(0, 100);
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

export const huggingFaceService = HuggingFaceSearchService.getInstance();
