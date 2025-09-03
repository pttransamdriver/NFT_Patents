const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { PDFDocument } = require('pdf-lib');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    'http://127.0.0.1:5174',
    'http://localhost:5174'
  ],
  credentials: true
}));
app.use(express.json());

// In-memory storage for temporary data
const tempStorage = new Map();

// Health check - no database needed
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
      storage: 'IPFS + blockchain'
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
app.post('/api/pdf/process-patent', async (req, res) => {
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
app.get('/api/patents/search', async (req, res) => {
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

    const response = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_patents',
        q: criteria,
        start: parseInt(start),
        num: parseInt(rows),
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

// Store temporary IPFS metadata
app.post('/api/metadata/:patentNumber', (req, res) => {
  try {
    const { patentNumber } = req.params;
    const metadata = req.body;
    
    tempStorage.set(patentNumber, {
      ...metadata,
      timestamp: new Date().toISOString()
    });
    
    console.log('📝 Temporary metadata stored for:', patentNumber);
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Metadata storage error:', error);
    res.status(500).json({ error: 'Failed to store metadata' });
  }
});

// Serve NFT metadata for tokenURI calls
app.get('/api/metadata/:patentNumber', (req, res) => {
  try {
    const { patentNumber } = req.params;
    const metadata = tempStorage.get(patentNumber);
    
    if (!metadata) {
      return res.status(404).json({ error: 'Metadata not found' });
    }
    
    // Extract patent data if available
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
  console.log(`⛓️  Fully decentralized - no database required!`);
});