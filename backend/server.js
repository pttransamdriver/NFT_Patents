const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { ethers } = require('ethers');
require('dotenv').config();

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
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());

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

// Enhanced mock data generator for Google Patents format
function generateEnhancedMockPatents(criteria, start, rows) {
  const categories = ['solar', 'artificial intelligence', 'medical device', 'battery', 'robotics', 'biotech'];
  const countries = ['US', 'EP', 'CN', 'JP', 'KR'];
  const assignees = [
    'Google LLC', 'Apple Inc.', 'Microsoft Corporation', 'Samsung Electronics',
    'Tesla Inc.', 'IBM', 'Intel Corporation', 'Qualcomm', 'Sony Corporation',
    'General Electric', 'Johnson & Johnson', 'Pfizer Inc.', 'MIT', 'Stanford University'
  ];

  const mockPatents = [];
  const searchTerm = criteria.toLowerCase();
  
  for (let i = 0; i < Math.min(rows, 20); i++) {
    const patentNum = `${countries[i % countries.length]}${Math.floor(Math.random() * 9000000) + 1000000}`;
    const assignee = assignees[i % assignees.length];
    const year = 2015 + Math.floor(Math.random() * 9);
    
    // Generate relevant title based on search criteria
    let title = '';
    if (searchTerm.includes('solar')) {
      title = `Advanced Solar Cell Technology with ${['Enhanced Efficiency', 'Improved Durability', 'Novel Materials'][i % 3]}`;
    } else if (searchTerm.includes('ai') || searchTerm.includes('artificial intelligence')) {
      title = `AI-Powered ${['Medical Diagnosis', 'Image Recognition', 'Natural Language Processing'][i % 3]} System`;
    } else if (searchTerm.includes('battery')) {
      title = `High-Capacity ${['Lithium-Ion', 'Solid-State', 'Graphene'][i % 3]} Battery Design`;
    } else {
      title = `Advanced ${searchTerm} Technology for ${['Industrial Applications', 'Consumer Devices', 'Medical Use'][i % 3]}`;
    }

    mockPatents.push({
      position: start + i + 1,
      title: title,
      link: `https://patents.google.com/patent/${patentNum}`,
      patent_id: patentNum,
      priority_date: `${year}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      publication_date: `${year + 2}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      assignee: assignee,
      inventor: `Dr. ${['John Smith', 'Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'David Kim'][i % 5]}`,
      abstract: `This invention relates to ${searchTerm} technology and provides improved methods for ${['efficiency enhancement', 'cost reduction', 'performance optimization'][i % 3]}. The invention addresses current limitations in ${searchTerm} systems and offers novel solutions for industrial and commercial applications.`,
      classification: {
        cpc: `H01L31/${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
        ipc: `H01L 31/${String(Math.floor(Math.random() * 90) + 10)}`
      },
      legal_status: ['Active', 'Granted', 'Published'][i % 3],
      citations: Math.floor(Math.random() * 200) + 10
    });
  }
  
  return mockPatents;
}

// Search patents via Google Patents (SerpApi)
app.get('/api/uspto/search', async (req, res) => {
  try {
    const { criteria, start = 0, rows = 20, sort = 'date desc' } = req.query;
    
    if (!criteria) {
      return res.status(400).json({ error: 'Search criteria required' });
    }

    console.log(`Searching Google Patents for: ${criteria}`);

    // Use SerpApi to search Google Patents
    // Note: SerpApi provides free tier (100 searches/month)
    // For production, you'd need a SerpApi API key
    const serpApiKey = process.env.SERPAPI_KEY || process.env.VITE_SERPAPI_KEY;
    
    // If no valid SerpApi key, fall back to mock data with enhanced info
    if (!serpApiKey || serpApiKey === 'demo') {
      console.log('No SerpApi key configured, using enhanced mock data');
      const mockPatents = generateEnhancedMockPatents(criteria, start, rows);
      return res.json({
        organic_results: mockPatents,
        search_information: {
          query_displayed: criteria,
          total_results: mockPatents.length * 10, // Simulate more results available
          time_taken_displayed: 0.5
        }
      });
    }

    const searchParams = {
      engine: 'google_patents',
      q: criteria,
      start: start,
      num: Math.min(rows, 100),
      api_key: serpApiKey
    };

    console.log(`SerpApi Google Patents search params:`, searchParams);

    const response = await axios.get(SERPAPI_BASE_URL, {
      params: searchParams,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PatentNFT-Backend/1.0'
      },
      timeout: 15000
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
app.get('/api/uspto/patent/:patentNumber', async (req, res) => {
  try {
    const { patentNumber } = req.params;
    
    console.log(`Fetching Google Patents patent: ${patentNumber}`);

    // Search for the specific patent number using Google Patents
    const serpApiKey = process.env.SERPAPI_KEY || process.env.VITE_SERPAPI_KEY;
    
    const searchParams = {
      engine: 'google_patents',
      q: patentNumber,
      num: 1,
      api_key: serpApiKey || 'demo'
    };

    const response = await axios.get(SERPAPI_BASE_URL, {
      params: searchParams,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PatentNFT-Backend/1.0'
      },
      timeout: 15000
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
    
    if (error.response) {
      res.status(error.response.status).json({
        error: `Google Patents API Error: ${error.response.status}`,
        message: error.response.data?.error || error.message
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch patent', 
        message: error.message 
      });
    }
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const { pool } = require('./database');
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    // Test Google Patents API connection via SerpApi
    let patentsApiStatus = 'not tested';
    const serpApiKey = process.env.SERPAPI_KEY || process.env.VITE_SERPAPI_KEY;
    
    try {
      const testResponse = await axios.get(SERPAPI_BASE_URL, {
        params: { 
          engine: 'google_patents',
          q: 'solar',
          num: 1,
          api_key: serpApiKey || 'demo'
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

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Patent NFT Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
});
