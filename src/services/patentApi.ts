import axios from 'axios';
import { BaseSingleton } from '../utils/baseSingleton';
import type { Patent, NFT } from '../types';
import { checkPatentExists, createReadOnlyProvider } from '../utils/contracts';
import { web3Utils } from '../utils/web3Utils';

// Google Patents API via backend proxy
// This service uses Google Patents exclusively through our backend

export interface PatentSearchParams {
  query: string;
  start?: number;
  rows?: number;
  sort?: string;
}

export interface PatentData {
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

export class PatentApiService extends BaseSingleton {

  /**
   * Search patents using Google Patents API via backend
   */
  async searchPatents(params: PatentSearchParams): Promise<Patent[]> {
    try {
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'https://nft-patents-backend.vercel.app';
      console.log('🔍 Searching patents with params:', params);
      console.log('🌐 Using backend URL:', backendUrl);
      
      const response = await axios.get(`${backendUrl}/api/patents/search`, {
        params: {
          criteria: params.query,
          start: params.start || 0,
          rows: params.rows || 20,
          sort: params.sort || 'date'
        },
        timeout: 30000
      });

      console.log('📡 Raw API response status:', response.status);
      console.log('📊 Raw response data keys:', Object.keys(response.data || {}));
      
      const results = response.data?.organic_results || response.data?.results || response.data || [];
      
      if (!Array.isArray(results) || results.length === 0) {
        console.warn('⚠️ No patent results found for query:', params.query);
        console.log('📄 Full response data:', response.data);
        return [];
      }
      
      console.log('✅ Found', results.length, 'patent results');
      const patents = this.transformPatentData(results);
      console.log('🔄 Transformed to', patents.length, 'patent objects');
      
      // Check blockchain for each patent's availability
      return await this.checkPatentAvailability(patents);
    } catch (error: any) {
      console.error('Patent search error:', error);
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Backend server not running. Please start the backend with: cd backend && npm start');
      } else if (error.response?.status === 400 && error.response?.data?.error?.includes('SerpApi key required')) {
        throw new Error('SerpApi key required for real patent data. Please set SERPAPI_KEY in backend/.env');
      } else if (error.response?.status === 401) {
        throw new Error('Google Patents API authentication failed.');
      } else if (error.response?.status === 403) {
        throw new Error('Google Patents API access forbidden.');
      } else if (error.response?.status === 429) {
        throw new Error('Google Patents API rate limit exceeded. Please try again later.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please check your connection and try again.');
      } else if (error.response?.status >= 500) {
        throw new Error('Patent search service is temporarily unavailable.');
      } else {
        throw new Error(error.response?.data?.message || error.message || 'Patent search failed. Please try again.');
      }
    }
  }

  /**
   * Get specific patent by number
   */
  async getPatentByNumber(patentNumber: string): Promise<Patent | null> {
    try {
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      
      const response = await axios.get(`${backendUrl}/api/patents/patent/${patentNumber}`, {
        timeout: 15000
      });

      if (response.data?.organic_results?.[0]) {
        const transformed = this.transformPatentData([response.data.organic_results[0]]);
        return transformed[0] || null;
      } else if (response.data) {
        const transformed = this.transformPatentData([response.data]);
        return transformed[0] || null;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Convert patent data to NFT-compatible format
   */
  async convertPatentToNFT(patent: Patent, price: number = 0.1): Promise<Partial<NFT>> {
    return {
      id: patent.patentNumber,
      title: patent.title,
      description: patent.abstract,
      creator: patent.inventor,
      owner: patent.assignee,
      imageUrl: patent.imageUrl,
      category: patent.category,
      price: price
    };
  }

  /**
   * Check blockchain for patent availability and update the isAvailableForMinting flag
   */
  private async checkPatentAvailability(patents: Patent[]): Promise<Patent[]> {
    try {
      // Try to get provider - if Web3 is not connected, default to available
      const { connected } = await web3Utils.isConnected();
      if (!connected) {
        console.warn('Web3 not connected, showing all patents as available');
        return patents;
      }

      const provider = await web3Utils.createProvider();
      if (!provider) {
        console.warn('No provider available, showing all patents as available');
        return patents;
      }

      // Check each patent's availability in parallel
      const availabilityChecks = patents.map(async (patent) => {
        try {
          const exists = await checkPatentExists(provider, patent.patentNumber);
          return {
            ...patent,
            isAvailableForMinting: !exists // Available if NOT already minted
          };
        } catch (error) {
          console.warn(`Failed to check availability for patent ${patent.patentNumber}:`, error);
          return {
            ...patent,
            isAvailableForMinting: true // Default to available on error
          };
        }
      });

      return await Promise.all(availabilityChecks);

    } catch (error) {
      console.warn('Failed to check patent availability from blockchain:', error);
      // Return original patents with default availability if blockchain check fails
      return patents;
    }
  }

  /**
   * Transform Google Patents API data to our internal format
   */
  private transformPatentData(patentData: any[]): Patent[] {
    return patentData.map(patent => {
      // Google Patents format (from SerpApi)
      if (patent.patent_id || patent.title) {
        // Extract clean patent number from format "patent/US1234567/en" -> "US1234567"
        const cleanPatentNumber = this.extractCleanPatentNumber(patent.patent_id);
        
        return {
          patentNumber: cleanPatentNumber || 'N/A',
          title: patent.title || 'Untitled Patent',
          inventors: Array.isArray(patent.inventor) ? patent.inventor : [patent.inventor || 'Unknown'],
          inventor: Array.isArray(patent.inventor) ? patent.inventor[0] : (patent.inventor || 'Unknown'),
          assignee: patent.assignee || 'Unassigned',
          abstract: patent.snippet || patent.abstract || 'No abstract available',
          filingDate: patent.filing_date || new Date().toISOString(),
          publicationDate: patent.publication_date || new Date().toISOString(),
          patentType: patent.type || 'Utility',
          applicationNumber: patent.application_number || 'Unknown',
          category: this.categorizePatent(patent.title || '', patent.snippet || ''),
          status: this.determinePatentStatus(patent.filing_date || ''),
          imageUrl: patent.thumbnail || `https://via.placeholder.com/300x400.png?text=${cleanPatentNumber || 'Patent'}`,
          citationCount: parseInt(patent.cited_by_count) || 0,
          claims: patent.claims || [],
          description: patent.snippet || patent.abstract || 'No description available',
          legalStatus: patent.legal_status || 'Unknown',
          priorityDate: patent.priority_date || patent.filing_date || '',
          expirationDate: patent.expiration_date || '',
          country: this.extractCountryFromPatentNumber(cleanPatentNumber || ''),
          classification: {
            cpc: patent.cpc_classification || [],
            ipc: patent.ipc_classification || []
          },
          isAvailableForMinting: true // Real patents are available for minting
        };
      }

      // Fallback format
      return {
        patentNumber: patent.patentNumber || 'Unknown',
        title: patent.patentTitle || patent.title || 'Untitled Patent',
        inventors: Array.isArray(patent.inventorName) ? patent.inventorName : [patent.inventorName || 'Unknown'],
        inventor: Array.isArray(patent.inventorName) ? patent.inventorName[0] : (patent.inventorName || 'Unknown'),
        assignee: patent.assigneeName || patent.assignee || 'Unassigned',
        abstract: patent.patentAbstract || patent.abstract || 'No abstract available',
        filingDate: patent.filingDate || new Date().toISOString(),
        publicationDate: patent.publicationDate || new Date().toISOString(),
        patentType: patent.patentType || 'Utility',
        applicationNumber: patent.applicationNumber || 'Unknown',
        category: 'Technology',
        status: 'Active',
        imageUrl: `https://via.placeholder.com/300x400.png?text=${patent.patentNumber || 'Patent'}`,
        citationCount: 0,
        claims: [],
        description: patent.patentAbstract || patent.abstract || 'No description available',
        legalStatus: 'Unknown',
        priorityDate: patent.filingDate || '',
        expirationDate: '',
        country: this.extractCountryFromPatentNumber(patent.patentNumber || ''),
        classification: {
          cpc: [],
          ipc: []
        },
        isAvailableForMinting: true // Fallback patents are also available for minting
      };
    }).filter(patent => patent.patentNumber !== 'N/A' && patent.patentNumber !== 'Unknown');
  }

  /**
   * Determine patent status based on filing date
   */
  private determinePatentStatus(filingDate: string): string {
    if (!filingDate) return 'Unknown';
    
    const filing = new Date(filingDate);
    const now = new Date();
    const yearsDiff = (now.getTime() - filing.getTime()) / (1000 * 60 * 60 * 24 * 365);

    if (yearsDiff < 1) return 'Recently Filed';
    if (yearsDiff < 3) return 'Pending';
    if (yearsDiff < 20) return 'Active';
    return 'Expired';
  }

  /**
   * Categorize patent based on title and abstract
   */
  private categorizePatent(title: string, abstract: string): string {
    const text = `${title} ${abstract}`.toLowerCase();
    
    if (text.includes('software') || text.includes('algorithm') || text.includes('computer')) return 'Software';
    if (text.includes('medical') || text.includes('pharmaceutical') || text.includes('drug')) return 'Medical';
    if (text.includes('energy') || text.includes('solar') || text.includes('battery')) return 'Energy';
    if (text.includes('automotive') || text.includes('vehicle') || text.includes('transportation')) return 'Automotive';
    if (text.includes('telecommunications') || text.includes('wireless') || text.includes('communication')) return 'Telecommunications';
    if (text.includes('manufacturing') || text.includes('industrial') || text.includes('mechanical')) return 'Manufacturing';
    if (text.includes('chemical') || text.includes('material') || text.includes('compound')) return 'Chemical';
    if (text.includes('biotechnology') || text.includes('genetic') || text.includes('biological')) return 'Biotechnology';
    
    return 'Technology';
  }

  /**
   * Extract clean patent number from Google Patents API format
   * Converts "patent/US1234567/en" to "US1234567"
   */
  private extractCleanPatentNumber(patentId: string): string {
    if (!patentId) return '';
    
    // Handle Google Patents API format: "patent/US1234567/en" -> "US1234567"
    if (patentId.startsWith('patent/')) {
      const parts = patentId.split('/');
      if (parts.length >= 2) {
        return parts[1]; // Extract the patent number part
      }
    }
    
    // If already clean, return as-is
    return patentId;
  }

  /**
   * Extract country code from patent number
   */
  private extractCountryFromPatentNumber(patentNumber: string): string {
    if (!patentNumber) return 'Unknown';
    
    if (patentNumber.startsWith('US')) return 'United States';
    if (patentNumber.startsWith('EP')) return 'Europe';
    if (patentNumber.startsWith('CN')) return 'China';
    if (patentNumber.startsWith('JP')) return 'Japan';
    if (patentNumber.startsWith('KR')) return 'South Korea';
    if (patentNumber.startsWith('WO')) return 'World';
    
    return 'Unknown';
  }
}

// Export singleton instance
export const patentApi = PatentApiService.getInstance() as PatentApiService;