const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * Patent verification and search endpoints
 */

// Helper functions
function extractCleanPatentNumber(patentId) {
  if (!patentId) return null;
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

// Verify patent existence and get details
router.post('/verify/:patentNumber', async (req, res) => {
  try {
    const { patentNumber } = req.params;
    const serpApiKey = process.env.SERPAPI_KEY;

    if (!serpApiKey) {
      return res.status(500).json({ error: 'Patents API not configured' });
    }

    // Check for mock data in development
    if (process.env.VITE_ENABLE_MOCK_DATA === 'true' && patentNumber.startsWith('MOCK')) {
      const mockPatent = {
        patentNumber: patentNumber,
        title: `Mock Patent: ${patentNumber}`,
        abstract: 'This is a mock patent for testing purposes.',
        inventors: ['Mock Inventor'],
        inventor: 'Mock Inventor',
        assignee: 'Mock Corporation',
        filingDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        publicationDate: new Date().toISOString(),
        status: 'Active',
        category: 'Software',
        isAvailableForMinting: true,
        country: extractCountryFromPatentNumber(patentNumber),
        legalStatus: 'Granted'
      };
      return res.json({ success: true, patent: mockPatent });
    }

    console.log('🔍 Verifying patent:', patentNumber);

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

// Get specific patent details
router.get('/:id', async (req, res) => {
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

    const patent = results[0];
    res.json({
      success: true,
      patent: {
        patentNumber: extractCleanPatentNumber(patent.patent_id) || id,
        title: patent.title || 'Untitled Patent',
        abstract: patent.snippet || 'No abstract available',
        inventor: Array.isArray(patent.inventor) ? patent.inventor[0] : (patent.inventor || 'Unknown'),
        assignee: patent.assignee || 'Unassigned',
        filingDate: patent.filing_date || new Date().toISOString(),
        status: determinePatentStatus(patent.filing_date || '')
      }
    });

  } catch (error) {
    console.error('❌ Patent details error:', error.message);
    res.status(500).json({
      error: 'Failed to get patent details',
      details: error.message
    });
  }
});

module.exports = router;

