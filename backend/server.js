const express = require('express');
const cors = require('cors');
const axios = require('axios');
const metadataStore = require('./metadata');
const { ethers } = require('ethers');
const { PDFDocument } = require('pdf-lib');
const multer = require('multer');
require('dotenv').config({ path: '../.env' });

const {
  initializeDatabase,
  getOrCreateUser,
  addUserCredits,
  createPayment,
  verifyPayment,
  getPaymentByHash,
  createPatentNFT,
  updatePatentNFTOwner,
  verifyPatentNFT,
  createSearchRecord
} = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - Allow both localhost and 127.0.0.1 for development
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

// Configure multer for file uploads (in-memory storage)
const upload = multer({ storage: multer.memoryStorage() });

// Initialize database on startup
initializeDatabase().catch(console.error);

// Verify payment (PSP, ETH, or USDC)
app.post('/api/payments/verify-payment', async (req, res) => {
  try {
    const { userAddress, transactionHash, paymentType, tokenAmount, blockNumber } = req.body;

    if (!userAddress || !transactionHash || !paymentType || !tokenAmount) {
      return res.status(400).json({ error: 'Missing required payment data' });
    }

    // Check if payment already exists
    const existingPayment = await getPaymentByHash(transactionHash);
    if (existingPayment) {
      return res.status(400).json({ error: 'Payment already processed' });
    }

    // Calculate search credits based on payment type
    let searchCredits = 1; // Default 1 search per payment
    if (paymentType === 'PSP') {
      searchCredits = Math.floor(tokenAmount / 500); // 1 search per 500 PSP tokens
    }

    // Ensure user exists in database
    await getOrCreateUser(userAddress);

    // Create payment record
    const payment = await createPayment({
      userAddress,
      transactionHash,
      paymentType,
      tokenAmount,
      searchCredits,
      blockNumber
    });

    // Add credits to user account
    const updatedUser = await addUserCredits(userAddress, searchCredits);

    // Mark payment as verified
    await verifyPayment(transactionHash);

    res.json({
      success: true,
      creditsAdded: searchCredits,
      totalCredits: updatedUser.search_credits,
      paymentId: payment.id
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});



// Get user search credits
app.get('/api/users/:address/search-credits', async (req, res) => {
  try {
    const { address } = req.params;
    const user = await getOrCreateUser(address.toLowerCase());
    res.json({ credits: user.search_credits });
  } catch (error) {
    console.error('Get credits error:', error);
    res.status(500).json({ error: 'Failed to get credits' });
  }
});

// Deduct search credit and record search
app.post('/api/users/:address/deduct-credit', async (req, res) => {
  try {
    const { address } = req.params;
    const { searchQuery, searchResults } = req.body;

    const user = await getOrCreateUser(address.toLowerCase());

    if (user.search_credits > 0) {
      // Deduct credit
      const updatedUser = await addUserCredits(address.toLowerCase(), -1);

      // Record search history if provided
      if (searchQuery) {
        await createSearchRecord(address.toLowerCase(), searchQuery, searchResults);
      }

      res.json({
        success: true,
        remainingCredits: updatedUser.search_credits
      });
    } else {
      res.status(400).json({ error: 'No credits available' });
    }
  } catch (error) {
    console.error('Deduct credit error:', error);
    res.status(500).json({ error: 'Failed to deduct credit' });
  }
});

// Legacy endpoint for PSP payments (backward compatibility)
app.post('/api/payments/verify-psp-payment', async (req, res) => {
  try {
    const { userAddress, transactionHash, tokenAmount } = req.body;

    // Redirect to new unified payment endpoint
    req.body.paymentType = 'PSP';
    return app._router.handle(req, res, () => {
      req.url = '/api/payments/verify-payment';
      app._router.handle(req, res);
    });
  } catch (error) {
    console.error('Legacy PSP payment error:', error);
    res.status(500).json({ error: 'Failed to process PSP payment' });
  }
});

// Patent NFT endpoints
app.post('/api/patents/mint', async (req, res) => {
  try {
    const { tokenId, ownerAddress, title, inventor, patentNumber, tokenUri, filingDate } = req.body;

    if (!tokenId || !ownerAddress || !title || !inventor || !patentNumber || !tokenUri) {
      return res.status(400).json({ error: 'Missing required patent data' });
    }

    const patent = await createPatentNFT({
      tokenId,
      ownerAddress: ownerAddress.toLowerCase(),
      title,
      inventor,
      patentNumber,
      tokenUri,
      filingDate: filingDate ? new Date(filingDate) : new Date()
    });

    res.json({ success: true, patent });
  } catch (error) {
    console.error('Patent minting error:', error);
    res.status(500).json({ error: 'Failed to record patent mint' });
  }
});

app.post('/api/patents/:tokenId/transfer', async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { newOwnerAddress } = req.body;

    if (!newOwnerAddress) {
      return res.status(400).json({ error: 'New owner address required' });
    }

    const patent = await updatePatentNFTOwner(parseInt(tokenId), newOwnerAddress.toLowerCase());

    if (!patent) {
      return res.status(404).json({ error: 'Patent not found' });
    }

    res.json({ success: true, patent });
  } catch (error) {
    console.error('Patent transfer error:', error);
    res.status(500).json({ error: 'Failed to update patent ownership' });
  }
});

app.post('/api/patents/:tokenId/verify', async (req, res) => {
  try {
    const { tokenId } = req.params;

    const patent = await verifyPatentNFT(parseInt(tokenId));

    if (!patent) {
      return res.status(404).json({ error: 'Patent not found' });
    }

    res.json({ success: true, patent });
  } catch (error) {
    console.error('Patent verification error:', error);
    res.status(500).json({ error: 'Failed to verify patent' });
  }
});

// Get user profile with stats
app.get('/api/users/:address/profile', async (req, res) => {
  try {
    const { address } = req.params;
    const user = await getOrCreateUser(address.toLowerCase());

    // Get additional stats from database
    const { pool } = require('./database');
    const client = await pool.connect();

    try {
      // Get payment history
      const paymentsResult = await client.query(
        'SELECT payment_type, COUNT(*) as count, SUM(token_amount) as total_amount FROM payments WHERE user_address = $1 AND status = $2 GROUP BY payment_type',
        [address.toLowerCase(), 'confirmed']
      );

      // Get search history count
      const searchResult = await client.query(
        'SELECT COUNT(*) as search_count FROM search_history WHERE user_address = $1',
        [address.toLowerCase()]
      );

      res.json({
        user,
        paymentStats: paymentsResult.rows,
        totalSearches: parseInt(searchResult.rows[0].search_count)
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Google Patents API via SerpApi (much more reliable than USPTO)
// This provides access to global patents, not just US patents
// SerpApi documentation: https://serpapi.com/google-patents-api
const SERPAPI_BASE_URL = 'https://serpapi.com/search.json';

// Mock data functions removed - using real Google Patents API only

// Search patents via Google Patents (SerpApi)
// Google Patents search endpoint
app.get('/api/patents/search', async (req, res) => {
  try {
    const { criteria, start = 0, rows = 20, sort = 'date desc' } = req.query;
    
    if (!criteria) {
      return res.status(400).json({ error: 'Search criteria required' });
    }


    // Use SerpApi to search Google Patents
    const serpApiKey = process.env.SERPAPI_KEY;
    
    // Require a valid SerpApi key
    if (!serpApiKey || serpApiKey === 'demo' || serpApiKey === 'your_serpapi_key_here') {
      return res.status(400).json({
        error: 'SerpApi key required',
        message: 'Please set a valid SERPAPI_KEY in your environment variables to access real Google Patents data.',
        instructions: 'Get your free API key at https://serpapi.com/google-patents-api'
      });
    }

    const searchParams = {
      engine: 'google_patents',
      q: criteria,
      start: start,
      num: Math.max(10, Math.min(rows, 100)), // SerpApi requires num to be between 10-100
      api_key: serpApiKey
    };


    const response = await axios.get(SERPAPI_BASE_URL, {
      params: searchParams,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PatentNFT-Backend/1.0'
      },
      timeout: 45000 // Increase timeout for SerpApi to 45 seconds
    });

    res.json(response.data);
  } catch (error) {
    console.error('Google Patents Search API Error:', error.message);
    
    // Return detailed error for debugging
    if (error.response) {
      res.status(error.response.status).json({
        error: `Google Patents API Error: ${error.response.status}`,
        message: error.response.data?.error || error.message,
        details: error.response.data
      });
    } else if (error.code === 'ECONNABORTED') {
      res.status(408).json({ error: 'Google Patents API timeout' });
    } else {
      res.status(500).json({ 
        error: 'Failed to search patents', 
        message: error.message 
      });
    }
  }
});

// Get specific patent by number
// Get specific patent by number
app.get('/api/patents/patent/:patentNumber', async (req, res) => {
  try {
    const { patentNumber } = req.params;
    

    // Search for the specific patent number using Google Patents
    const serpApiKey = process.env.SERPAPI_KEY;
    
    // Require a valid SerpApi key
    if (!serpApiKey || serpApiKey === 'demo' || serpApiKey === 'your_serpapi_key_here') {
      return res.status(400).json({
        error: 'SerpApi key required',
        message: 'Please set a valid SERPAPI_KEY in your environment variables to access real Google Patents data.',
        instructions: 'Get your free API key at https://serpapi.com/google-patents-api'
      });
    }
    
    const searchParams = {
      engine: 'google_patents',
      q: patentNumber,
      num: 10, // SerpApi requires num to be between 10-100, will return the first match
      api_key: serpApiKey
    };

    const response = await axios.get(SERPAPI_BASE_URL, {
      params: searchParams,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PatentNFT-Backend/1.0'
      },
      timeout: 45000 // Increase timeout for SerpApi to 45 seconds
    });

    if (response.data.organic_results && response.data.organic_results.length > 0) {
      res.json(response.data.organic_results[0]);
    } else if (response.data.results && response.data.results.length > 0) {
      res.json(response.data.results[0]);
    } else {
      res.status(404).json({ error: 'Patent not found' });
    }
  } catch (error) {
    console.error('Google Patents API Error:', error.message);
    
    // Return proper error instead of mock data
    if (error.response) {
      res.status(error.response.status).json({
        error: `Google Patents API Error: ${error.response.status}`,
        message: error.response.data?.error || error.message,
        details: error.response.data
      });
    } else if (error.code === 'ECONNABORTED') {
      res.status(408).json({ error: 'Google Patents API timeout' });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch patent', 
        message: error.message 
      });
    }
  }
});

// Generate mock patent data for specific patent number
// Mock data functions removed - using real Google Patents API only

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    // Test database connection
    const { pool } = require('./database');
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    // Test Google Patents API connection via SerpApi
    let patentsApiStatus = 'not configured';
    const serpApiKey = process.env.SERPAPI_KEY;
    
    if (!serpApiKey || serpApiKey === 'demo' || serpApiKey === 'your_serpapi_key_here') {
      patentsApiStatus = 'SerpApi key required - set SERPAPI_KEY in environment';
    } else {
      try {
        const testResponse = await axios.get(SERPAPI_BASE_URL, {
          params: { 
            engine: 'google_patents',
            q: 'solar',
            num: 10, // SerpApi requires num to be between 10-100
            api_key: serpApiKey
          },
          headers: { 'Accept': 'application/json' },
          timeout: 5000
        });
        
        if (testResponse.data.organic_results || testResponse.data.results) {
          patentsApiStatus = 'connected (Google Patents via SerpApi)';
        } else {
          patentsApiStatus = 'connected but no results';
        }
      } catch (error) {
        patentsApiStatus = `error: ${error.response?.status || error.message}`;
      }
    }

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'connected',
      patentsApi: patentsApiStatus
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      patentsApi: 'not tested',
      error: error.message
    });
  }
});

// NFT Metadata endpoint for smart contract tokenURI
app.get('/metadata/:patentNumber', async (req, res) => {
  try {
    const { patentNumber } = req.params;
    
    // Get metadata from store or create default
    let metadata = metadataStore.getMetadata(patentNumber);
    if (!metadata) {
      metadata = metadataStore.createDefaultMetadata(patentNumber);
      metadataStore.storeMetadata(patentNumber, metadata);
    }
    
    res.json(metadata);
  } catch (error) {
    console.error('Metadata generation error:', error);
    res.status(500).json({ error: 'Failed to generate metadata' });
  }
});

// Endpoint to store IPFS metadata for NFTs
app.post('/metadata/:patentNumber/ipfs', async (req, res) => {
  try {
    const { patentNumber } = req.params;
    const { pdfHash, imageHash, imageUrl } = req.body;
    
    if (!pdfHash && !imageHash && !imageUrl) {
      return res.status(400).json({ error: 'At least one IPFS hash or URL required' });
    }
    
    // Update metadata with IPFS data
    metadataStore.updateIPFSData(patentNumber, { pdfHash, imageHash, imageUrl });
    
    res.json({ 
      success: true, 
      message: `IPFS metadata updated for patent ${patentNumber}`,
      metadata: metadataStore.getMetadata(patentNumber)
    });
    
  } catch (error) {
    console.error('IPFS metadata update error:', error);
    res.status(500).json({ error: 'Failed to update IPFS metadata' });
  }
});

// ========================================
// PDF Processing Endpoints
// ========================================

/**
 * Extract first page from uploaded PDF and return compressed single-page PDF
 */
app.post('/api/pdf/extract-first-page', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'File must be a PDF' });
    }

    // Load the original PDF
    const originalPdf = await PDFDocument.load(req.file.buffer);
    const pageCount = originalPdf.getPageCount();

    if (pageCount === 0) {
      return res.status(400).json({ error: 'PDF contains no pages' });
    }

    // Create new PDF with only first page
    const newPdf = await PDFDocument.create();
    const [firstPage] = await newPdf.copyPages(originalPdf, [0]);
    newPdf.addPage(firstPage);

    // Save compressed PDF
    const pdfBytes = await newPdf.save({
      useObjectStreams: false, // Better compression
    });

    // Calculate compression stats
    const originalSize = req.file.buffer.length;
    const compressedSize = pdfBytes.length;
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

    // Return the compressed PDF
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="first-page.pdf"',
      'X-Original-Size': originalSize,
      'X-Compressed-Size': compressedSize,
      'X-Compression-Ratio': `${compressionRatio}%`,
      'X-Original-Pages': pageCount,
      'X-Compressed-Pages': 1
    });

    res.send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('PDF processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process PDF',
      message: error.message 
    });
  }
});

/**
 * Process patent PDF from URL - fetch, extract first page, return compressed PDF
 */
app.post('/api/pdf/process-patent', async (req, res) => {
  try {
    const { patentNumber, pdfUrl } = req.body;

    if (!patentNumber || !pdfUrl) {
      return res.status(400).json({ 
        error: 'Missing required fields: patentNumber and pdfUrl' 
      });
    }

    // Fetch PDF from URL
    const response = await axios.get(pdfUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Patent NFT Marketplace/1.0'
      }
    });

    if (response.status !== 200) {
      return res.status(400).json({ error: 'Failed to fetch PDF from URL' });
    }

    // Load and process PDF
    const originalPdf = await PDFDocument.load(response.data);
    const pageCount = originalPdf.getPageCount();

    if (pageCount === 0) {
      return res.status(400).json({ error: 'PDF contains no pages' });
    }

    // Extract first page
    const newPdf = await PDFDocument.create();
    const [firstPage] = await newPdf.copyPages(originalPdf, [0]);
    newPdf.addPage(firstPage);

    // Save compressed PDF
    const pdfBytes = await newPdf.save({
      useObjectStreams: false,
    });

    // Calculate stats
    const originalSize = response.data.length;
    const compressedSize = pdfBytes.length;
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

    res.json({
      success: true,
      patentNumber,
      stats: {
        originalSize,
        compressedSize,
        compressionRatio: `${compressionRatio}%`,
        originalPages: pageCount,
        compressedPages: 1
      },
      pdf: {
        data: Buffer.from(pdfBytes).toString('base64'),
        mimeType: 'application/pdf',
        filename: `${patentNumber}-page1.pdf`
      }
    });

  } catch (error) {
    console.error('Patent PDF processing error:', error);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({ error: 'PDF fetch timeout' });
    }
    
    res.status(500).json({ 
      error: 'Failed to process patent PDF',
      message: error.message 
    });
  }
});

/**
 * Generate placeholder single-page PDF for patents without available PDFs
 */
app.post('/api/pdf/generate-placeholder', async (req, res) => {
  try {
    const { patentNumber, title, inventor, assignee } = req.body;

    if (!patentNumber) {
      return res.status(400).json({ error: 'Patent number is required' });
    }

    // Create placeholder PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size

    // Add patent information
    page.drawText(`Patent Number: ${patentNumber}`, {
      x: 50, y: 750, size: 24,
    });

    if (title) {
      page.drawText(`Title: ${title}`, {
        x: 50, y: 700, size: 16,
      });
    }

    if (inventor) {
      page.drawText(`Inventor: ${inventor}`, {
        x: 50, y: 660, size: 14,
      });
    }

    if (assignee) {
      page.drawText(`Assignee: ${assignee}`, {
        x: 50, y: 620, size: 14,
      });
    }

    page.drawText('Original PDF not available from patent office.', {
      x: 50, y: 550, size: 12,
    });

    page.drawText('This single-page PDF serves as the NFT visual representation.', {
      x: 50, y: 520, size: 12,
    });

    page.drawText('Patent NFT Marketplace - PDF-First Approach', {
      x: 50, y: 490, size: 10,
    });

    const pdfBytes = await pdfDoc.save();

    res.json({
      success: true,
      patentNumber,
      pdf: {
        data: Buffer.from(pdfBytes).toString('base64'),
        mimeType: 'application/pdf',
        filename: `${patentNumber}-placeholder.pdf`
      }
    });

  } catch (error) {
    console.error('Placeholder PDF generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate placeholder PDF',
      message: error.message 
    });
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
});
