const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for demo (use database in production)
const userCredits = new Map();
const pspPayments = new Map(); // Track PSP token payments

// Verify PSP token payment
app.post('/api/payments/verify-psp-payment', async (req, res) => {
  try {
    const { userAddress, transactionHash, tokenAmount } = req.body;

    if (!userAddress || !transactionHash || !tokenAmount) {
      return res.status(400).json({ error: 'Missing required payment data' });
    }

    // In production, verify the transaction on blockchain
    // For now, we'll trust the frontend verification

    // Store payment record
    pspPayments.set(transactionHash, {
      userAddress,
      tokenAmount,
      timestamp: Date.now(),
      status: 'confirmed'
    });

    // Add search credits (1 search per 500 PSP tokens)
    const searchCredits = Math.floor(tokenAmount / 500);
    const currentCredits = userCredits.get(userAddress) || 0;
    userCredits.set(userAddress, currentCredits + searchCredits);

    res.json({
      success: true,
      creditsAdded: searchCredits,
      totalCredits: userCredits.get(userAddress)
    });
  } catch (error) {
    console.error('PSP payment verification error:', error);
    res.status(500).json({ error: 'Failed to verify PSP payment' });
  }
});



// Get user search credits
app.get('/api/users/:address/search-credits', (req, res) => {
  try {
    const { address } = req.params;
    const credits = userCredits.get(address.toLowerCase()) || 0;
    res.json({ credits });
  } catch (error) {
    console.error('Get credits error:', error);
    res.status(500).json({ error: 'Failed to get credits' });
  }
});

// Deduct search credit
app.post('/api/users/:address/deduct-credit', (req, res) => {
  try {
    const { address } = req.params;
    const currentCredits = userCredits.get(address.toLowerCase()) || 0;

    if (currentCredits > 0) {
      userCredits.set(address.toLowerCase(), currentCredits - 1);
      res.json({ success: true, remainingCredits: currentCredits - 1 });
    } else {
      res.status(400).json({ error: 'No credits available' });
    }
  } catch (error) {
    console.error('Deduct credit error:', error);
    res.status(500).json({ error: 'Failed to deduct credit' });
  }
});

// Handle PSP token payment notification (legacy endpoint for compatibility)
app.post('/api/payments/crypto-payment', async (req, res) => {
  try {
    const { userAddress, transactionHash, amount, currency } = req.body;

    // Redirect to PSP payment verification
    if (currency === 'PSP' || currency === 'psp') {
      return res.redirect(307, '/api/payments/verify-psp-payment');
    }

    // For backward compatibility, treat other crypto payments as PSP
    console.log('Legacy crypto payment received, treating as PSP:', {
      userAddress,
      transactionHash,
      amount,
      currency
    });

    // Assume 500 PSP per search for legacy payments
    const tokenAmount = amount || 500;
    const searchCredits = Math.floor(tokenAmount / 500);
    const currentCredits = userCredits.get(userAddress.toLowerCase()) || 0;
    userCredits.set(userAddress.toLowerCase(), currentCredits + searchCredits);

    res.json({
      success: true,
      credits: currentCredits + searchCredits,
      transactionHash
    });

  } catch (error) {
    console.error('Crypto payment processing error:', error);
    res.status(500).json({ error: 'Failed to process crypto payment' });
  }
});



// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
