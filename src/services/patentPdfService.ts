import { PDFDocument } from 'pdf-lib';
// Temporarily disable Helia imports to fix ESM issues
// import { getDocument } from 'pdfjs-dist';
// import { createHelia } from 'helia';
// import { unixfs } from '@helia/unixfs';
// import html2canvas from 'html2canvas';

/**
 * Service for handling patent PDF processing and IPFS storage
 * Extracts and compresses first page of patent PDFs into single-page PDFs for NFT use
 */
export class PatentPdfService {
  private helia: any = null;
  private fs: any = null;

  constructor() {
    this.initializeIPFS();
  }

  /**
   * Initialize IPFS connection - temporarily disabled for ESM fix
   */
  private async initializeIPFS() {
    try {
      // Temporarily disable Helia to fix ESM import issues
      console.log('📌 IPFS initialization skipped - using Pinata only');
      this.helia = null;
      this.fs = null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('⚠️ IPFS initialization failed, using Pinata fallback:', errorMessage);
      this.helia = null;
      this.fs = null;
    }
  }

  /**
   * Fetch patent PDF from various sources
   * @param patentNumber - Patent number (e.g., US10123456)
   * @returns PDF blob or null if not found
   */
  async fetchPatentPdf(patentNumber: string): Promise<Blob | null> {
    try {
      // Try Google Patents first
      const googleUrl = this.getGooglePatentsPdfUrl(patentNumber);
      let response = await fetch(googleUrl);
      
      if (response.ok) {
        return await response.blob();
      }

      // Try alternative Google Patents URL as fallback
      const alternativeUrl = `https://patents.google.com/patent/${patentNumber}.pdf`;
      response = await fetch(alternativeUrl);
      
      if (response.ok) {
        return await response.blob();
      }

      // If no PDF found, generate a placeholder
      return this.generatePlaceholderPdf(patentNumber);

    } catch (error) {
      console.error('Error fetching patent PDF:', error);
      return this.generatePlaceholderPdf(patentNumber);
    }
  }

  /**
   * Extract and compress first page of PDF into a single-page PDF
   * @param pdfBlob - Original multi-page PDF file as blob
   * @returns Single-page PDF blob containing only the first page
   */
  async extractFirstPagePdf(pdfBlob: Blob): Promise<Blob> {
    try {
      // Load the original PDF
      const originalPdfBytes = await pdfBlob.arrayBuffer();
      const originalPdf = await PDFDocument.load(originalPdfBytes);
      
      // Create a new PDF document
      const newPdf = await PDFDocument.create();
      
      // Copy only the first page from the original PDF
      const [firstPage] = await newPdf.copyPages(originalPdf, [0]);
      newPdf.addPage(firstPage);
      
      // Save the new single-page PDF with compression
      const pdfBytes = await newPdf.save({
        useObjectStreams: false, // Better compression
      });
      
      return new Blob([pdfBytes], { type: 'application/pdf' });

    } catch (error) {
      console.error('Error extracting first page from PDF:', error);
      return this.generatePlaceholderPdf(error.message || 'Unknown error');
    }
  }

  /**
   * Store file on IPFS or fallback to Pinata
   * @param file - File to store
   * @param filename - Optional filename
   * @returns IPFS hash or placeholder for local testing
   */
  async storeOnIPFS(file: Blob, filename?: string): Promise<string> {
    // Check if Pinata credentials are configured
    const pinataApiKey = import.meta.env.VITE_PINATA_API_KEY;
    const pinataSecretKey = import.meta.env.VITE_PINATA_SECRET_KEY;

    // If Pinata is configured, use it
    if (pinataApiKey && pinataSecretKey && pinataApiKey !== 'your_pinata_api_key_here') {
      console.log('📌 Using Pinata for IPFS storage');
      return this.storeOnPinata(file, filename);
    }

    // For local testing without IPFS, return a placeholder hash
    console.log('📌 Local testing mode - using placeholder IPFS hash');
    const placeholderHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    return placeholderHash;
  }

  /**
   * Store file on Pinata (IPFS service) as fallback
   */
  private async storeOnPinata(file: Blob, filename?: string): Promise<string> {
    const pinataApiKey = import.meta.env.VITE_PINATA_API_KEY;
    const pinataSecretKey = import.meta.env.VITE_PINATA_SECRET_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      throw new Error('Pinata credentials not configured');
    }

    const formData = new FormData();
    formData.append('file', file, filename || 'patent-file');
    formData.append('pinataMetadata', JSON.stringify({
      name: filename || 'patent-file',
      description: 'Patent document for NFT'
    }));

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to store on Pinata');
    }

    const result = await response.json();
    return result.IpfsHash;
  }

  /**
   * Process patent for NFT creation using backend PDF processing
   * @param patentNumber - Patent number
   * @returns Object containing IPFS hashes for original PDF and compressed single-page PDF
   */
  async processPatentForNFT(patentNumber: string): Promise<{
    originalPdfHash: string;
    singlePagePdfHash: string;
    pdfUrl: string;
  }> {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://nft-patents.vercel.app';
      
      // 1. Try to fetch and process patent PDF via backend
      let pdfBlob: Blob;
      
      try {
        // Try to get PDF from Google Patents/USPTO via backend
        const pdfUrl = this.getGooglePatentsPdfUrl(patentNumber);
        
        const response = await fetch(`${apiBaseUrl}/api/pdf/process-patent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patentNumber, pdfUrl })
        });

        if (response.ok) {
          const result = await response.json();
          // Convert base64 back to blob
          const pdfData = atob(result.pdf.data);
          const uint8Array = new Uint8Array(pdfData.length);
          for (let i = 0; i < pdfData.length; i++) {
            uint8Array[i] = pdfData.charCodeAt(i);
          }
          pdfBlob = new Blob([uint8Array], { type: 'application/pdf' });
          
          console.log('✅ PDF processing stats:', result.stats);
        } else {
          throw new Error('Backend PDF processing failed');
        }
        
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn('⚠️ Backend PDF processing failed, generating placeholder:', errorMessage);
        
        // Fallback: generate placeholder PDF via backend
        const response = await fetch(`${apiBaseUrl}/api/pdf/generate-placeholder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            patentNumber,
            title: `Patent ${patentNumber}`,
            inventor: 'Unknown',
            assignee: 'Unassigned'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate placeholder PDF');
        }

        const result = await response.json();
        // Convert base64 to blob
        const pdfData = atob(result.pdf.data);
        const uint8Array = new Uint8Array(pdfData.length);
        for (let i = 0; i < pdfData.length; i++) {
          uint8Array[i] = pdfData.charCodeAt(i);
        }
        pdfBlob = new Blob([uint8Array], { type: 'application/pdf' });
      }

      // 2. Store single-page PDF on IPFS (we only have the compressed version now)
      const singlePagePdfHash = await this.storeOnIPFS(pdfBlob, `${patentNumber}-page1.pdf`);

      // 3. Generate PDF URL (using single-page PDF as the NFT "image")
      const ipfsGateway = import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
      const pdfUrl = `${ipfsGateway}${singlePagePdfHash}`;

      return {
        originalPdfHash: singlePagePdfHash, // We only have the single-page version
        singlePagePdfHash,                   // Compressed first page for NFT display
        pdfUrl                              // URL to single-page PDF (used as NFT image)
      };

    } catch (error) {
      console.error('Error processing patent for NFT:', error);
      throw error;
    }
  }

  /**
   * Generate Google Patents PDF URL
   */
  private getGooglePatentsPdfUrl(patentNumber: string): string {
    // Clean patent number (remove spaces, hyphens)
    const cleanNumber = patentNumber.replace(/[^\w]/g, '');
    
    // Extract country code and number
    const match = cleanNumber.match(/^([A-Z]{2})(\d+)/);
    if (!match) {
      throw new Error('Invalid patent number format');
    }

    const [, country] = match;
    
    if (country === 'US') {
      // Google Patents PDF URLs (when available)
      return `https://patents.google.com/patent/${patentNumber}/en?oq=${patentNumber}`;
    }
    
    return `https://worldwide.espacenet.com/patent/search/family/simple/pdf/${patentNumber}`;
  }


  /**
   * Generate placeholder single-page PDF when patent PDF is not available
   */
  private async generatePlaceholderPdf(patentNumber: string): Promise<Blob> {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      
      // Add text to the page
      page.drawText(`Patent Number: ${patentNumber}`, {
        x: 50,
        y: 750,
        size: 24,
      });
      
      page.drawText('Original PDF not available from patent office.', {
        x: 50,
        y: 700,
        size: 16,
      });
      
      page.drawText('This single-page PDF serves as the NFT visual representation.', {
        x: 50,
        y: 650,
        size: 12,
      });
      
      page.drawText('Patent NFT Marketplace - PDF-First Approach', {
        x: 50,
        y: 600,
        size: 10,
      });

      const pdfBytes = await pdfDoc.save();
      return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

    } catch (error) {
      console.error('Error generating placeholder PDF:', error);
      throw error;
    }
  }

  /**
   * Generate placeholder image when PDF conversion fails
   * @unused - keeping for potential future use
   */
  private async generatePlaceholderImage(): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 600;
    
    const ctx = canvas.getContext('2d')!;
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Gray border
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    // Text
    ctx.fillStyle = '#333333';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Patent Document', canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText('Preview Not Available', canvas.width / 2, canvas.height / 2 + 20);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png');
    });
  }

  /**
   * Cleanup IPFS connection
   */
  async dispose() {
    // Temporarily disabled
    console.log('📌 IPFS cleanup skipped');
  }
}

// Export singleton instance
export const patentPdfService = new PatentPdfService();