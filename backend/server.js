const express = require('express');
const cors = require('cors');
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

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
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

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const { pool } = require('./database');
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
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
