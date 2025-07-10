const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for demo (use database in production)
const userCredits = new Map();
const paymentIntents = new Map();

// Create payment intent for AI search
app.post('/api/payments/create-search-intent', async (req, res) => {
  try {
    const { amount, currency, description, metadata } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Store payment intent for later confirmation
    paymentIntents.set(paymentIntent.id, {
      userAddress: metadata.userAddress,
      searchQuery: metadata.searchQuery,
      amount,
      status: 'pending'
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm payment and add search credit
app.post('/api/payments/confirm-search-payment', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      const storedIntent = paymentIntents.get(paymentIntentId);
      if (storedIntent) {
        const userAddress = storedIntent.userAddress;
        
        // Add 3 search credits to user account ($15 for 3 searches)
        const currentCredits = userCredits.get(userAddress) || 0;
        userCredits.set(userAddress, currentCredits + 3);
        
        // Update stored intent status
        storedIntent.status = 'completed';
        paymentIntents.set(paymentIntentId, storedIntent);
        
        res.json({ success: true, credits: currentCredits + 3 });
      } else {
        res.status(404).json({ error: 'Payment intent not found' });
      }
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
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

// Handle crypto payment notification
app.post('/api/payments/crypto-payment', async (req, res) => {
  try {
    const { userAddress, transactionHash, amount, currency, contractAddress } = req.body;

    // In production, you should verify the transaction on-chain
    // For now, we'll trust the frontend verification
    console.log('Crypto payment received:', {
      userAddress,
      transactionHash,
      amount,
      currency
    });

    // Add 3 search credits to user account
    const currentCredits = userCredits.get(userAddress.toLowerCase()) || 0;
    userCredits.set(userAddress.toLowerCase(), currentCredits + 3);

    // Store transaction record (in production, use a database)
    const transactionRecord = {
      userAddress: userAddress.toLowerCase(),
      transactionHash,
      amount,
      currency,
      contractAddress,
      timestamp: new Date().toISOString(),
      creditsAdded: 3,
      status: 'completed'
    };

    // In production, store this in your database
    console.log('Transaction recorded:', transactionRecord);

    res.json({
      success: true,
      credits: currentCredits + 3,
      transactionHash
    });

  } catch (error) {
    console.error('Crypto payment processing error:', error);
    res.status(500).json({ error: 'Failed to process crypto payment' });
  }
});

// Stripe webhook for payment events
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      
      // Auto-confirm payment and add credits
      const storedIntent = paymentIntents.get(paymentIntent.id);
      if (storedIntent && storedIntent.status === 'pending') {
        const userAddress = storedIntent.userAddress;
        const currentCredits = userCredits.get(userAddress) || 0;
        userCredits.set(userAddress, currentCredits + 3);
        
        storedIntent.status = 'completed';
        paymentIntents.set(paymentIntent.id, storedIntent);
        
        console.log(`Added search credit to ${userAddress}`);
      }
      break;
      
    case 'payment_intent.payment_failed':
      console.log('Payment failed:', event.data.object.id);
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
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
