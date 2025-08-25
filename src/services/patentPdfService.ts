import { PDFDocument } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist';
import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import html2canvas from 'html2canvas';

/**
 * Service for handling patent PDF processing and IPFS storage
 * Converts patent PDFs to images and stores both on IPFS
 */
export class PatentPdfService {
  private helia: any = null;
  private fs: any = null;

  constructor() {
    this.initializeIPFS();
  }

  /**
   * Initialize IPFS connection
   */
  private async initializeIPFS() {
    try {
      this.helia = await createHelia();
      this.fs = unixfs(this.helia);
    } catch (error) {
      console.error('Failed to initialize IPFS:', error);
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
   * Convert PDF to image for NFT display
   * @param pdfBlob - PDF file as blob
   * @returns Image blob
   */
  async convertPdfToImage(pdfBlob: Blob): Promise<Blob> {
    try {
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1); // Get first page

      // Create canvas for rendering
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      
      // Set up viewport (high resolution for better quality)
      const viewport = page.getViewport({ scale: 2.0 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      // Convert canvas to blob
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png');
      });

    } catch (error) {
      console.error('Error converting PDF to image:', error);
      return this.generatePlaceholderImage();
    }
  }

  /**
   * Store file on IPFS
   * @param file - File to store
   * @param filename - Optional filename
   * @returns IPFS hash
   */
  async storeOnIPFS(file: Blob, filename?: string): Promise<string> {
    try {
      if (!this.fs) {
        await this.initializeIPFS();
      }

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      const cid = await this.fs.addBytes(uint8Array);
      return cid.toString();

    } catch (error) {
      console.error('Error storing on IPFS:', error);
      
      // Fallback to Pinata if direct IPFS fails
      return this.storeOnPinata(file, filename);
    }
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
   * Process patent for NFT creation - fetches PDF, converts to image, stores both on IPFS
   * @param patentNumber - Patent number
   * @returns Object containing IPFS hashes for PDF and image
   */
  async processPatentForNFT(patentNumber: string): Promise<{
    pdfHash: string;
    imageHash: string;
    imageUrl: string;
  }> {
    try {
      // 1. Fetch patent PDF
      const pdfBlob = await this.fetchPatentPdf(patentNumber);
      if (!pdfBlob) {
        throw new Error('Could not fetch patent PDF');
      }

      // 2. Convert PDF to image
      const imageBlob = await this.convertPdfToImage(pdfBlob);

      // 3. Store both on IPFS
      const [pdfHash, imageHash] = await Promise.all([
        this.storeOnIPFS(pdfBlob, `${patentNumber}.pdf`),
        this.storeOnIPFS(imageBlob, `${patentNumber}.png`)
      ]);

      // 4. Generate image URL
      const ipfsGateway = import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
      const imageUrl = `${ipfsGateway}${imageHash}`;

      return {
        pdfHash,
        imageHash,
        imageUrl
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

    const [, country, number] = match;
    
    if (country === 'US') {
      // Google Patents PDF URLs (when available)
      return `https://patents.google.com/patent/${patentNumber}/en?oq=${patentNumber}`;
    }
    
    return `https://worldwide.espacenet.com/patent/search/family/simple/pdf/${patentNumber}`;
  }


  /**
   * Generate placeholder PDF when patent PDF is not available
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
      
      page.drawText('PDF not available from patent office.', {
        x: 50,
        y: 700,
        size: 16,
      });
      
      page.drawText('This is a placeholder document for NFT purposes.', {
        x: 50,
        y: 650,
        size: 12,
      });

      const pdfBytes = await pdfDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });

    } catch (error) {
      console.error('Error generating placeholder PDF:', error);
      throw error;
    }
  }

  /**
   * Generate placeholder image when PDF conversion fails
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
    if (this.helia) {
      await this.helia.stop();
    }
  }
}

// Export singleton instance
export const patentPdfService = new PatentPdfService();