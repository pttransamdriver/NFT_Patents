// Simple metadata storage for NFT metadata
// In production, this would use a proper database

class MetadataStore {
  constructor() {
    this.metadataCache = new Map();
  }

  /**
   * Store metadata for a patent NFT
   * @param {string} patentNumber - Patent number
   * @param {Object} metadata - Metadata object
   */
  storeMetadata(patentNumber, metadata) {
    this.metadataCache.set(patentNumber, {
      ...metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Get metadata for a patent NFT
   * @param {string} patentNumber - Patent number
   * @returns {Object|null} Metadata object or null if not found
   */
  getMetadata(patentNumber) {
    return this.metadataCache.get(patentNumber) || null;
  }

  /**
   * Update IPFS hashes for a patent (PDF-first approach)
   * @param {string} patentNumber - Patent number
   * @param {Object} ipfsData - Object containing singlePagePdfHash, originalPdfHash, pdfUrl
   */
  updateIPFSData(patentNumber, ipfsData) {
    const existing = this.getMetadata(patentNumber) || this.createDefaultMetadata(patentNumber);
    
    this.storeMetadata(patentNumber, {
      ...existing,
      image: ipfsData.pdfUrl, // Use PDF URL as the "image" for NFT marketplaces
      ipfsSinglePagePdfHash: ipfsData.singlePagePdfHash,
      ipfsOriginalPdfHash: ipfsData.originalPdfHash,
      properties: {
        ...existing.properties,
        document_type: "patent_pdf",
        compression_stats: ipfsData.stats || {},
        files: [
          {
            uri: ipfsData.pdfUrl,
            type: "application/pdf",
            description: "Single-page patent document (NFT visual representation)"
          },
          ...(ipfsData.originalPdfHash && ipfsData.originalPdfHash !== ipfsData.singlePagePdfHash ? [{
            uri: `https://ipfs.io/ipfs/${ipfsData.originalPdfHash}`,
            type: "application/pdf",
            description: "Original full patent document"
          }] : [])
        ]
      },
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Create default metadata for a patent
   * @param {string} patentNumber - Patent number
   * @returns {Object} Default metadata object
   */
  createDefaultMetadata(patentNumber) {
    return {
      name: `Patent NFT - ${patentNumber}`,
      description: `NFT representing patent ${patentNumber} with verified authenticity and ownership on the blockchain.`,
      image: `https://via.placeholder.com/400x600.png?text=Patent+${patentNumber}`,
      external_url: `https://patents.google.com/patent/${patentNumber}`,
      attributes: [
        {
          trait_type: "Patent Number",
          value: patentNumber
        },
        {
          trait_type: "Patent Type",
          value: "Utility"
        },
        {
          trait_type: "Blockchain",
          value: "Ethereum"
        },
        {
          trait_type: "Status",
          value: "Minted"
        }
      ],
      properties: {
        files: [
          {
            uri: `https://patents.google.com/patent/${patentNumber}/pdf`,
            type: "application/pdf"
          }
        ],
        category: "patent"
      }
    };
  }

  /**
   * Get all stored metadata (for debugging)
   * @returns {Array} Array of all metadata entries
   */
  getAllMetadata() {
    return Array.from(this.metadataCache.entries()).map(([patentNumber, metadata]) => ({
      patentNumber,
      ...metadata
    }));
  }

  /**
   * Clear all metadata (for testing)
   */
  clear() {
    this.metadataCache.clear();
  }
}

// Export singleton instance
module.exports = new MetadataStore();