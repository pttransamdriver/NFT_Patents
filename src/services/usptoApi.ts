import axios from 'axios';
import type { Patent, NFT } from '../types';

// USPTO Patent Examination Research Dataset API
const USPTO_BASE_URL = 'https://developer.uspto.gov/ds-api';
const USPTO_SEARCH_URL = 'https://developer.uspto.gov/ds-api';
const USPTO_API_KEY = import.meta.env.VITE_USPTO_API_KEY;

export interface USPTOSearchParams {
  query: string;
  start?: number;
  rows?: number;
  sort?: string;
}

export interface USPTOPatentData {
  patentNumber: string;
  patentTitle: string;
  patentAbstract: string;
  inventorName: string | string[];
  assigneeName: string;
  filingDate: string;
  publicationDate: string;
  patentType: string;
  applicationNumber: string;
}

export class USPTOApiService {
  private static instance: USPTOApiService;

  // Validate API key configuration
  private validateApiKey(): boolean {
    if (!USPTO_API_KEY || USPTO_API_KEY === 'your_uspto_api_key') {
      console.warn('USPTO API key not configured. Using mock data. Add VITE_USPTO_API_KEY to your .env file for real data.');
      return false;
    }
    return true;
  }
  
  public static getInstance(): USPTOApiService {
    if (!USPTOApiService.instance) {
      USPTOApiService.instance = new USPTOApiService();
    }
    return USPTOApiService.instance;
  }

  async searchPatents(params: USPTOSearchParams): Promise<Patent[]> {
    const hasValidApiKey = this.validateApiKey();

    // If no valid API key, return mock data for development
    if (!hasValidApiKey) {
      return this.getMockPatents(params.query);
    }

    try {
      // Use USPTO's public search API
      const response = await axios.get(`${USPTO_SEARCH_URL}/search/publications`, {
        params: {
          criteria: params.query,
          start: params.start || 0,
          rows: params.rows || 20,
          sort: params.sort || 'date desc'
        },
        headers: {
          'X-API-Key': USPTO_API_KEY,
          'Accept': 'application/json',
          'User-Agent': 'PatentNFT-App/1.0'
        },
        timeout: 15000
      });

      return this.transformUSPTOData(response.data.results || []);
    } catch (error: any) {
      console.error('USPTO API Error:', error);

      // Provide specific error messages based on response
      if (error.response?.status === 401) {
        throw new Error('USPTO API authentication failed. Please check your API key.');
      } else if (error.response?.status === 403) {
        throw new Error('USPTO API access forbidden. Your API key may not have proper permissions.');
      } else if (error.response?.status === 429) {
        throw new Error('USPTO API rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 500) {
        throw new Error('USPTO API server error. Please try again later.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('USPTO API request timed out. Please try again.');
      } else if (error.message.includes('Network Error')) {
        throw new Error('Network error. Please check your internet connection.');
      } else {
        throw new Error(`USPTO API error: ${error.message || 'Unknown error occurred'}`);
      }
    }
  }

  async getPatentByNumber(patentNumber: string): Promise<Patent | null> {
    this.validateApiKey();

    try {
      // Note: USPTO API has CORS restrictions for browser calls
      // For now, we'll use the mock data fallback and log the attempt
      console.log(`Attempting to fetch patent: ${patentNumber}`);
      console.log('USPTO API call would be made here, but CORS prevents direct browser access');
      
      // In production, this would need to go through a backend proxy
      throw new Error('CORS_RESTRICTION');

      const results = response.data?.results || [];
      if (results.length === 0) return null;

      const transformed = this.transformUSPTOData(results);
      return transformed[0] || null;
    } catch (error: any) {
      console.log('USPTO API Error:', error.message);

      // Handle CORS restriction specifically
      if (error.message === 'CORS_RESTRICTION') {
        console.log('Using mock data due to CORS restrictions. In production, use a backend proxy.');
      }

      // Fallback to mock data with the searched patent number
      try {
        return this.getMockPatentByNumber(patentNumber) || this.createMockPatent(patentNumber);
      } catch {
        return null;
      }
    }
  }

  async convertPatentToNFT(patent: Patent, price: number = 0.1): Promise<Partial<NFT>> {
    return {
      patentNumber: patent.patentNumber,
      title: patent.title,
      description: patent.abstract,
      inventor: patent.inventors.join(', '),
      assignee: patent.assignee,
      filingDate: patent.filingDate,
      category: patent.category,
      status: patent.status,
      price: price,
      priceChange: 0,
      isListed: true,
      views: 0,
      likes: 0,
      transactionHistory: []
    };
  }

  private transformUSPTOData(usptoData: USPTOPatentData[]): Patent[] {
    return usptoData.map(patent => ({
      patentNumber: patent.patentNumber || 'N/A',
      title: patent.patentTitle || 'Untitled Patent',
      abstract: patent.patentAbstract || 'No abstract available',
      inventors: Array.isArray(patent.inventorName) ? patent.inventorName : [patent.inventorName || 'Unknown'],
      assignee: patent.assigneeName || 'Unassigned',
      filingDate: patent.filingDate || '',
      publicationDate: patent.publicationDate || '',
      status: this.determinePatentStatus(patent.filingDate),
      category: this.categorizePatent(patent.patentTitle, patent.patentAbstract),
      claims: [],
      isAvailableForMinting: true
    }));
  }

  private getMockPatents(query: string): Patent[] {
    const mockPatents = [
      {
        patentNumber: 'US10123456B2',
        title: 'Advanced Solar Cell Technology',
        abstract: 'A novel photovoltaic cell design that increases efficiency by 25% through innovative semiconductor layering.',
        inventors: ['Dr. Sarah Johnson', 'Michael Chen'],
        assignee: 'SolarTech Industries',
        filingDate: '2020-03-15',
        publicationDate: '2022-11-08',
        status: 'active' as const,
        category: 'Clean Energy',
        claims: [],
        isAvailableForMinting: true
      },
      {
        patentNumber: 'US10234567B2',
        title: 'AI-Powered Medical Diagnostic System',
        abstract: 'Machine learning algorithm for early detection of cardiovascular diseases using non-invasive imaging.',
        inventors: ['Dr. Emily Rodriguez', 'James Park'],
        assignee: 'MedTech Solutions',
        filingDate: '2019-08-22',
        publicationDate: '2021-12-14',
        status: 'active' as const,
        category: 'Healthcare',
        claims: [],
        isAvailableForMinting: true
      }
    ];
    
    return mockPatents.filter(patent => 
      patent.title.toLowerCase().includes(query.toLowerCase()) ||
      patent.abstract.toLowerCase().includes(query.toLowerCase())
    );
  }

  private getMockPatentByNumber(patentNumber: string): Patent | null {
    const mockPatents = this.getMockPatents('');
    return mockPatents.find(p => p.patentNumber === patentNumber) || null;
  }

  private createMockPatent(patentNumber: string): Patent {
    return {
      patentNumber: patentNumber,
      title: `Patent ${patentNumber} - Advanced Technology System`,
      abstract: `This patent describes an innovative technological solution that addresses current industry challenges. The invention provides improved efficiency and novel approaches to existing problems.`,
      inventors: ['Dr. John Smith', 'Dr. Sarah Johnson'],
      assignee: 'Technology Innovations Inc.',
      filingDate: '2023-01-15',
      publicationDate: '2024-01-15',
      status: 'active' as const,
      category: 'Technology',
      claims: [],
      isAvailableForMinting: true
    };
  }

  private determinePatentStatus(filingDate: string): 'active' | 'expired' | 'pending' {
    if (!filingDate) return 'pending';
    
    const filed = new Date(filingDate);
    const now = new Date();
    const yearsDiff = (now.getTime() - filed.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    // US patents typically last 20 years from filing date
    return yearsDiff > 20 ? 'expired' : 'active';
  }

  private categorizePatent(title: string, abstract: string): string {
    const text = `${title} ${abstract}`.toLowerCase();
    
    if (text.includes('medical') || text.includes('health') || text.includes('drug') || text.includes('pharmaceutical')) {
      return 'Healthcare';
    }
    if (text.includes('energy') || text.includes('solar') || text.includes('battery') || text.includes('renewable')) {
      return 'Clean Energy';
    }
    if (text.includes('computer') || text.includes('software') || text.includes('algorithm') || text.includes('ai') || text.includes('artificial intelligence')) {
      return 'Computing';
    }
    if (text.includes('vehicle') || text.includes('automotive') || text.includes('transportation')) {
      return 'Transportation';
    }
    if (text.includes('material') || text.includes('chemical') || text.includes('polymer')) {
      return 'Materials';
    }
    if (text.includes('storage') || text.includes('memory') || text.includes('data')) {
      return 'Energy Storage';
    }
    
    return 'Other';
  }
}

export const usptoApi = USPTOApiService.getInstance();