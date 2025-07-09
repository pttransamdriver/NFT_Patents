import axios from 'axios';
import type { Patent } from '../types';

const USPTO_BASE_URL = 'https://developer.uspto.gov/ds-api';
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
  inventorName: string[];
  assigneeName: string;
  filingDate: string;
  publicationDate: string;
  patentType: string;
  applicationNumber: string;
}

export class USPTOApiService {
  private static instance: USPTOApiService;
  
  public static getInstance(): USPTOApiService {
    if (!USPTOApiService.instance) {
      USPTOApiService.instance = new USPTOApiService();
    }
    return USPTOApiService.instance;
  }

  async searchPatents(params: USPTOSearchParams): Promise<Patent[]> {
    try {
      const response = await axios.get(`${USPTO_BASE_URL}/search/publications`, {
        params: {
          criteria: params.query,
          start: params.start || 0,
          rows: params.rows || 20,
          sort: params.sort || 'date desc'
        },
        headers: {
          'X-API-Key': USPTO_API_KEY,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      return this.transformUSPTOData(response.data.results || []);
    } catch (error) {
      console.error('USPTO API Error:', error);
      throw new Error('Failed to fetch patents from USPTO API');
    }
  }

  async getPatentByNumber(patentNumber: string): Promise<Patent | null> {
    try {
      const response = await axios.get(`${USPTO_BASE_URL}/search/publications`, {
        params: {
          criteria: `patentNumber:${patentNumber}`,
          rows: 1
        },
        headers: {
          'X-API-Key': USPTO_API_KEY,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      const results = response.data.results || [];
      if (results.length === 0) return null;

      const transformed = this.transformUSPTOData(results);
      return transformed[0] || null;
    } catch (error) {
      console.error('USPTO API Error:', error);
      return null;
    }
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
      claims: [], // USPTO API doesn't provide claims in search results
      isAvailableForMinting: true
    }));
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
      return 'Energy';
    }
    if (text.includes('computer') || text.includes('software') || text.includes('algorithm') || text.includes('ai') || text.includes('artificial intelligence')) {
      return 'Technology';
    }
    if (text.includes('vehicle') || text.includes('automotive') || text.includes('transportation')) {
      return 'Transportation';
    }
    if (text.includes('material') || text.includes('chemical') || text.includes('polymer')) {
      return 'Materials';
    }
    
    return 'Other';
  }
}

export const usptoApi = USPTOApiService.getInstance();