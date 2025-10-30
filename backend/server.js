const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { PDFDocument } = require('pdf-lib');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import Vercel KV for persistent storage (optional - falls back to memory)
let kv;
try {
  kv = require('@vercel/kv');
} catch (error) {
  console.warn('⚠️ @vercel/kv not installed, using in-memory storage');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting configuration
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiting for expensive operations
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: 'Too many requests for this operation, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict rate limiting for patent searches (API calls)
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 searches per minute
  message: 'Too many search requests, please try again in a minute.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    'http://127.0.0.1:5174',
    'http://localhost:5174',
    /\.vercel\.app$/, // Allow all Vercel deployments
    'https://nft-patents.vercel.app' // Your production Vercel URL
  ],
  credentials: true
}));
app.use(express.json());

// Apply general rate limiting to all API routes
app.use('/api/', generalLimiter);

// In-memory storage for temporary data (fallback when KV not available)
const tempStorage = new Map();

// Check if Vercel KV is available and configured
const USE_KV = !!(kv && process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

// Helper functions for persistent storage
async function storeMetadata(patentNumber, metadata) {
  try {
    if (USE_KV) {
      // Use Vercel KV (persistent - survives cold starts)
      await kv.set(`metadata:${patentNumber}`, metadata);
      console.log(`📝 Metadata stored in KV (persistent) for: ${patentNumber}`);
    } else {
      // Fallback to in-memory (development only - lost on restart)
      tempStorage.set(patentNumber, metadata);
      console.log(`📝 Metadata stored in memory (temporary) for: ${patentNumber}`);
    }
  } catch (error) {
    console.error('Storage error:', error);
    // Fallback to in-memory on error
    tempStorage.set(patentNumber, metadata);
  }
}

async function getMetadata(patentNumber) {
  try {
    if (USE_KV) {
      // Try Vercel KV first
      const metadata = await kv.get(`metadata:${patentNumber}`);
      if (metadata) {
        console.log(`✅ Metadata retrieved from KV for: ${patentNumber}`);
        return metadata;
      }
    }

    // Fallback to in-memory
    const memoryData = tempStorage.get(patentNumber);
    if (memoryData) {
      console.log(`✅ Metadata retrieved from memory for: ${patentNumber}`);
      return memoryData;
    }

    return null;
  } catch (error) {
    console.error('Retrieval error:', error);
    // Fallback to in-memory on error
    return tempStorage.get(patentNumber);
  }
}

// Health check - shows storage type
app.get('/api/health', async (_req, res) => {
  try {
    let patentsApiStatus = 'not configured';
    const serpApiKey = process.env.SERPAPI_KEY;
    if (serpApiKey) {
      patentsApiStatus = 'configured';
    }

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      patentsApi: patentsApiStatus,
      blockchain: 'decentralized',
      storage: USE_KV ? 'Vercel KV (persistent)' : 'In-memory (temporary - will be lost on restart)',
      kvEnabled: USE_KV,
      warning: USE_KV ? null : 'Using in-memory storage - metadata will be lost on server restart. Set up Vercel KV for production.'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Process patent PDF - extract first page and compress
app.post('/api/pdf/process-patent', strictLimiter, async (req, res) => {
  try {
    const { patentNumber, pdfUrl } = req.body;
    
    if (!patentNumber) {
      return res.status(400).json({ error: 'Patent number required' });
    }

    console.log('📄 Processing patent PDF for:', patentNumber);
    
    // Try to fetch PDF from Google Patents
    let pdfResponse;
    try {
      pdfResponse = await axios.get(pdfUrl || `https://patents.google.com/patent/${patentNumber}.pdf`, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
    } catch (error) {
      console.warn('⚠️ Could not fetch PDF, generating placeholder');
      return res.status(404).json({ error: 'PDF not found' });
    }

    // Process PDF with pdf-lib
    const originalPdfBytes = new Uint8Array(pdfResponse.data);
    const originalPdf = await PDFDocument.load(originalPdfBytes);
    
    // Create new PDF with only first page
    const newPdf = await PDFDocument.create();
    const [firstPage] = await newPdf.copyPages(originalPdf, [0]);
    newPdf.addPage(firstPage);
    
    // Save compressed PDF
    const compressedPdfBytes = await newPdf.save({
      useObjectStreams: false
    });
    
    // Convert to base64 for transmission
    const base64Pdf = Buffer.from(compressedPdfBytes).toString('base64');
    
    res.json({
      success: true,
      pdf: {
        data: base64Pdf,
        size: compressedPdfBytes.length
      },
      stats: {
        originalPages: originalPdf.getPageCount(),
        compressedSize: compressedPdfBytes.length,
        originalSize: originalPdfBytes.length
      }
    });
    
  } catch (error) {
    console.error('❌ PDF processing error:', error.message);
    res.status(500).json({ 
      error: 'PDF processing failed',
      details: error.message 
    });
  }
});

// Generate placeholder PDF when original is not available
app.post('/api/pdf/generate-placeholder', async (req, res) => {
  try {
    const { patentNumber, title, inventor, assignee } = req.body;
    
    if (!patentNumber) {
      return res.status(400).json({ error: 'Patent number required' });
    }

    console.log('🎨 Generating placeholder PDF for:', patentNumber);
    
    // Create placeholder PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    
    // Add content to placeholder
    page.drawText(`Patent Number: ${patentNumber}`, {
      x: 50,
      y: 750,
      size: 24
    });
    
    if (title) {
      page.drawText(`Title: ${title}`, {
        x: 50,
        y: 700,
        size: 16
      });
    }
    
    if (inventor) {
      page.drawText(`Inventor: ${inventor}`, {
        x: 50,
        y: 650,
        size: 14
      });
    }
    
    if (assignee) {
      page.drawText(`Assignee: ${assignee}`, {
        x: 50,
        y: 600,
        size: 14
      });
    }
    
    page.drawText('Original PDF not available from patent office.', {
      x: 50,
      y: 550,
      size: 12
    });
    
    page.drawText('This placeholder serves as the NFT visual representation.', {
      x: 50,
      y: 520,
      size: 12
    });
    
    page.drawText('Patent NFT Marketplace - PDF-First Approach', {
      x: 50,
      y: 470,
      size: 10
    });

    const pdfBytes = await pdfDoc.save();
    const base64Pdf = Buffer.from(pdfBytes).toString('base64');
    
    res.json({
      success: true,
      pdf: {
        data: base64Pdf,
        size: pdfBytes.length
      }
    });
    
  } catch (error) {
    console.error('❌ Placeholder PDF generation error:', error.message);
    res.status(500).json({ 
      error: 'Placeholder generation failed',
      details: error.message 
    });
  }
});

// Patent search via Google Patents API
app.get('/api/patents/search', searchLimiter, async (req, res) => {
  try {
    const { criteria, start = 0, rows = 20 } = req.query;

    if (!criteria) {
      return res.status(400).json({ error: 'Search criteria required' });
    }

    const serpApiKey = process.env.SERPAPI_KEY;
    if (!serpApiKey) {
      return res.status(500).json({ error: 'Patents API not configured' });
    }

    console.log('🔍 Searching patents for:', criteria);

    // SerpApi Google Patents requires num to be between 10-100
    const numResults = Math.max(10, Math.min(100, parseInt(rows)));

    const response = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_patents',
        q: criteria,
        start: parseInt(start),
        num: numResults,
        api_key: serpApiKey
      },
      timeout: 30000
    });

    console.log('✅ Patents API response received');
    res.json(response.data);

  } catch (error) {
    console.error('❌ Patent search error:', error.message);
    res.status(500).json({
      error: 'Patent search failed',
      details: error.message
    });
  }
});

// USPTO/Google Patents search endpoint (for compatibility with README documentation)
app.get('/api/uspto/search', searchLimiter, async (req, res) => {
  try {
    const { criteria, start = 0, rows = 20 } = req.query;

    if (!criteria) {
      return res.status(400).json({ error: 'Search criteria required' });
    }

    const serpApiKey = process.env.SERPAPI_KEY;
    if (!serpApiKey) {
      return res.status(500).json({ error: 'Patents API not configured' });
    }

    console.log('🔍 Searching patents via USPTO endpoint for:', criteria);

    // SerpApi Google Patents requires num to be between 10-100
    const numResults = Math.max(10, Math.min(100, parseInt(rows)));

    const response = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_patents',
        q: criteria,
        start: parseInt(start),
        num: numResults,
        api_key: serpApiKey
      },
      timeout: 30000
    });

    console.log('✅ USPTO Patents API response received');
    res.json(response.data);

  } catch (error) {
    console.error('❌ USPTO Patent search error:', error.message);
    res.status(500).json({
      error: 'Patent search failed',
      details: error.message
    });
  }
});

// Patent verification endpoint for minting
app.get('/api/patents/verify/:patentNumber', searchLimiter, async (req, res) => {
  try {
    const { patentNumber } = req.params;

    if (!patentNumber) {
      return res.status(400).json({ error: 'Patent number required' });
    }

    const serpApiKey = process.env.SERPAPI_KEY;

    // If no API key is configured, provide mock data for testing
    if (!serpApiKey || serpApiKey === 'your_serpapi_key_here') {
      console.log('🧪 Using mock data for patent verification:', patentNumber);

      const mockPatent = {
        patentNumber: patentNumber,
        title: `Method and System for ${patentNumber.replace(/[^A-Za-z0-9]/g, ' ')} Technology`,
        abstract: `This patent describes an innovative method and system for implementing advanced technology solutions. The invention provides improved efficiency and novel approaches to existing technical challenges in the field.`,
        inventors: ['Dr. Jane Smith', 'Prof. John Doe'],
        inventor: 'Dr. Jane Smith',
        assignee: 'Tech Innovation Corp.',
        filingDate: '2023-01-15T00:00:00.000Z',
        publicationDate: '2023-07-15T00:00:00.000Z',
        status: 'Active',
        category: 'Software',
        isAvailableForMinting: true,
        country: extractCountryFromPatentNumber(patentNumber),
        legalStatus: 'Granted'
      };

      console.log('✅ Mock patent verified:', mockPatent.title);
      return res.json({
        success: true,
        patent: mockPatent
      });
    }

    console.log('🔍 Verifying patent:', patentNumber);

    // Search for the specific patent
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_patents',
        q: patentNumber,
        num: 1,
        api_key: serpApiKey
      },
      timeout: 30000
    });

    const results = response.data?.organic_results || [];

    if (results.length === 0) {
      return res.json({
        success: false,
        error: 'Patent not found in database'
      });
    }

    const patent = results[0];

    // Transform the patent data to match frontend expectations
    const transformedPatent = {
      patentNumber: extractCleanPatentNumber(patent.patent_id) || patentNumber,
      title: patent.title || 'Untitled Patent',
      abstract: patent.snippet || patent.abstract || 'No abstract available',
      inventors: Array.isArray(patent.inventor) ? patent.inventor : [patent.inventor || 'Unknown'],
      inventor: Array.isArray(patent.inventor) ? patent.inventor[0] : (patent.inventor || 'Unknown'),
      assignee: patent.assignee || 'Unassigned',
      filingDate: patent.filing_date || new Date().toISOString(),
      publicationDate: patent.publication_date || new Date().toISOString(),
      status: determinePatentStatus(patent.filing_date || ''),
      category: categorizePatent(patent.title || '', patent.snippet || ''),
      isAvailableForMinting: true,
      country: extractCountryFromPatentNumber(patentNumber),
      legalStatus: patent.legal_status || 'Unknown'
    };

    console.log('✅ Patent verified:', transformedPatent.title);
    res.json({
      success: true,
      patent: transformedPatent
    });

  } catch (error) {
    console.error('❌ Patent verification error:', error.message);
    res.status(500).json({
      error: 'Patent verification failed',
      details: error.message
    });
  }
});

// Helper functions for patent data transformation
function extractCleanPatentNumber(patentId) {
  if (!patentId) return null;
  // Extract from format "patent/US1234567/en" -> "US1234567"
  const match = patentId.match(/([A-Z]{2}\d+[A-Z]?\d*)/);
  return match ? match[1] : patentId;
}

function determinePatentStatus(filingDate) {
  if (!filingDate) return 'Unknown';

  const filing = new Date(filingDate);
  const now = new Date();
  const yearsDiff = (now.getTime() - filing.getTime()) / (1000 * 60 * 60 * 24 * 365);

  if (yearsDiff < 1) return 'Recently Filed';
  if (yearsDiff < 3) return 'Pending';
  if (yearsDiff < 20) return 'Active';
  return 'Expired';
}

function categorizePatent(title, abstract) {
  const text = `${title} ${abstract}`.toLowerCase();

  if (text.includes('software') || text.includes('computer') || text.includes('algorithm')) {
    return 'Software';
  } else if (text.includes('medical') || text.includes('pharmaceutical') || text.includes('drug')) {
    return 'Medical';
  } else if (text.includes('mechanical') || text.includes('engine') || text.includes('machine')) {
    return 'Mechanical';
  } else if (text.includes('chemical') || text.includes('compound') || text.includes('molecule')) {
    return 'Chemical';
  } else if (text.includes('electronic') || text.includes('circuit') || text.includes('semiconductor')) {
    return 'Electronics';
  }

  return 'Other';
}

function extractCountryFromPatentNumber(patentNumber) {
  if (!patentNumber) return 'Unknown';

  const prefix = patentNumber.substring(0, 2).toUpperCase();
  const countryMap = {
    'US': 'United States',
    'EP': 'European Patent Office',
    'JP': 'Japan',
    'CN': 'China',
    'KR': 'South Korea',
    'GB': 'United Kingdom',
    'DE': 'Germany',
    'FR': 'France',
    'CA': 'Canada',
    'AU': 'Australia'
  };

  return countryMap[prefix] || 'Unknown';
}

// Get specific patent details (USPTO endpoint for compatibility)
app.get('/api/uspto/patent/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Patent ID required' });
    }

    const serpApiKey = process.env.SERPAPI_KEY;
    if (!serpApiKey) {
      return res.status(500).json({ error: 'Patents API not configured' });
    }

    console.log('🔍 Getting patent details for:', id);

    // Search for the specific patent
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_patents',
        q: id,
        num: 1,
        api_key: serpApiKey
      },
      timeout: 30000
    });

    const results = response.data?.organic_results || [];

    if (results.length === 0) {
      return res.status(404).json({ error: 'Patent not found' });
    }

    console.log('✅ Patent details retrieved');
    res.json(response.data);

  } catch (error) {
    console.error('❌ Patent details error:', error.message);
    res.status(500).json({
      error: 'Failed to get patent details',
      details: error.message
    });
  }
});

// Store IPFS metadata (persistent with KV)
app.post('/api/metadata/:patentNumber', async (req, res) => {
  try {
    const { patentNumber } = req.params;
    const metadata = req.body;

    await storeMetadata(patentNumber, {
      ...metadata,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      storage: USE_KV ? 'persistent' : 'temporary',
      warning: USE_KV ? null : 'Using temporary storage - data will be lost on server restart'
    });

  } catch (error) {
    console.error('❌ Metadata storage error:', error);
    res.status(500).json({ error: 'Failed to store metadata' });
  }
});

// Serve NFT metadata for tokenURI calls (with persistent storage)
app.get('/api/metadata/:patentNumber', async (req, res) => {
  try {
    const { patentNumber } = req.params;
    const metadata = await getMetadata(patentNumber);

    if (!metadata) {
      console.warn(`⚠️ Metadata not found for: ${patentNumber}`);
      return res.status(404).json({
        error: 'Metadata not found',
        message: `No metadata stored for patent ${patentNumber}. Please re-mint this NFT or check if it was stored before KV was enabled.`
      });
    }

    // If metadata has an IPFS hash, redirect to IPFS
    if (metadata.ipfsHash) {
      const ipfsGateway = process.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
      return res.redirect(`${ipfsGateway}${metadata.ipfsHash}`);
    }

    // Check if metadata is already in NFT format (has attributes) or legacy format (has patentData)
    if (metadata.attributes) {
      // Already in NFT format, return as-is
      res.json(metadata);
    } else {
      // Legacy format - extract patent data if available
      const patentData = metadata.patentData || {};

      res.json({
        name: patentData.title || `Patent NFT - ${patentNumber}`,
        description: patentData.abstract || patentData.description || `Tokenized patent ${patentNumber}`,
        image: metadata.imageUrl || `https://via.placeholder.com/400x600?text=Patent+${patentNumber}`,
        external_url: `https://patents.google.com/patent/${patentNumber}`,
        attributes: [
          { trait_type: "Patent Number", value: patentNumber },
          { trait_type: "Title", value: patentData.title || "Unknown" },
          { trait_type: "Inventor", value: patentData.inventor || patentData.inventors?.[0] || "Unknown" },
          { trait_type: "Assignee", value: patentData.assignee || "Unknown" },
          { trait_type: "Filing Date", value: patentData.filingDate || "Unknown" },
          { trait_type: "Country", value: patentData.country || "Unknown" },
          { trait_type: "Status", value: patentData.status || patentData.legalStatus || "Unknown" },
          { trait_type: "Storage", value: "IPFS" },
          { trait_type: "Minted", value: metadata.timestamp }
        ]
      });
    }

  } catch (error) {
    console.error('❌ Metadata retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve metadata' });
  }
});

// Error handling middleware
app.use((error, req, res, _next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Patent NFT Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
  console.log(`💾 Storage: ${USE_KV ? 'Vercel KV (persistent) ✅' : 'In-memory (temporary) ⚠️'}`);
  if (!USE_KV) {
    console.log(`⚠️  WARNING: Using in-memory storage - metadata will be lost on restart!`);
    console.log(`   Set up Vercel KV for production: https://vercel.com/docs/storage/vercel-kv`);
  }
  console.log(`⛓️  Fully decentralized - ${USE_KV ? 'with persistent metadata!' : 'no database required!'}`);
});