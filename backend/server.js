const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import route modules
const patentsRouter = require('./routes/patents');
const ipfsRouter = require('./routes/ipfs');
const pdfRouter = require('./routes/pdf');
const healthRouter = require('./routes/health');
const aiRouter = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting configuration
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many requests for this operation, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many search requests, please try again in a minute.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://nft-patents.vercel.app',
  credentials: true
}));
app.use(express.json());

// Apply general rate limiting to all API routes
app.use('/api/', generalLimiter);

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

// Health check endpoints
app.use('/api', healthRouter);

// Patent verification and search endpoints
app.use('/api/patents', searchLimiter, patentsRouter);

// IPFS upload endpoints (strict rate limiting for expensive operations)
app.use('/api/pinata', strictLimiter, ipfsRouter);

// PDF processing endpoints (strict rate limiting)
app.use('/api/pdf', strictLimiter, pdfRouter);

// AI search proxy (keys stay server-side, never in the browser bundle)
app.use('/api/ai', strictLimiter, aiRouter);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((error, _req, res, _next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(PORT, () => {
  console.log(`🚀 Patent NFT Backend Server running on port ${PORT}`);
  console.log(`🔗 CORS enabled for: ${process.env.CORS_ORIGIN || 'Vercel deployments'}`);
  console.log(`⛓️  Fully decentralized - metadata stored on IPFS`);
  console.log(`📌 Available endpoints:`);
  console.log(`   - GET  /api/health - Health check`);
  console.log(`   - GET  /api/status - Service status`);
  console.log(`   - POST /api/patents/verify/:patentNumber - Verify patent`);
  console.log(`   - GET  /api/patents/:id - Get patent details`);
  console.log(`   - POST /api/pinata/upload-file - Upload file to IPFS`);
  console.log(`   - POST /api/pinata/upload-json - Upload JSON to IPFS`);
  console.log(`   - POST /api/pdf/process-patent - Process patent PDF`);
  console.log(`   - POST /api/pdf/generate-placeholder - Generate placeholder PDF`);
  
  // Warn if critical services are not configured
  if (!process.env.SERPAPI_KEY) {
    console.warn('⚠️  WARNING: SERPAPI_KEY not configured - patent verification disabled');
  }
  if (!process.env.PINATA_JWT) {
    console.warn('⚠️  WARNING: PINATA_JWT not configured - IPFS uploads disabled');
  }
});

module.exports = app;

