const express = require('express');
const router = express.Router();

/**
 * Health check and status endpoints
 */

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Status endpoint with service information
router.get('/status', (req, res) => {
  const status = {
    status: 'operational',
    timestamp: new Date().toISOString(),
    services: {
      patents: {
        enabled: !!process.env.SERPAPI_KEY,
        description: 'Patent verification via SerpAPI'
      },
      ipfs: {
        enabled: !!process.env.PINATA_JWT,
        description: 'IPFS storage via Pinata'
      },
      pdf: {
        enabled: true,
        description: 'PDF processing and generation'
      }
    },
    deployment: {
      platform: process.env.VERCEL ? 'Vercel' : 'Local',
      region: process.env.VERCEL_REGION || 'unknown',
      environment: process.env.NODE_ENV || 'development'
    }
  };

  // Check if critical services are configured
  if (!process.env.SERPAPI_KEY || !process.env.PINATA_JWT) {
    status.status = 'degraded';
    status.warnings = [];
    if (!process.env.SERPAPI_KEY) {
      status.warnings.push('SERPAPI_KEY not configured - patent verification disabled');
    }
    if (!process.env.PINATA_JWT) {
      status.warnings.push('PINATA_JWT not configured - IPFS uploads disabled');
    }
  }

  res.json(status);
});

module.exports = router;

