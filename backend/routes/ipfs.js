const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * Pinata IPFS proxy endpoints (secure - JWT never exposed to frontend)
 * All IPFS operations go through this backend to keep Pinata JWT safe
 */

// Upload file to IPFS via Pinata
router.post('/upload-file', async (req, res) => {
  try {
    const pinataJWT = process.env.PINATA_JWT;

    if (!pinataJWT) {
      return res.status(500).json({ error: 'Pinata not configured on server' });
    }

    const { file, filename } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'File data required' });
    }

    console.log('📤 Uploading file to Pinata:', filename);

    // Convert base64 to buffer
    const buffer = Buffer.from(file, 'base64');

    // Create FormData for Pinata
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', buffer, filename || 'file');
    formData.append('pinataMetadata', JSON.stringify({
      name: filename || 'patent-file',
      description: 'Patent document for NFT'
    }));

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${pinataJWT}`
        },
        maxBodyLength: Infinity
      }
    );

    console.log('✅ File uploaded to Pinata:', response.data.IpfsHash);
    res.json({
      success: true,
      ipfsHash: response.data.IpfsHash
    });

  } catch (error) {
    console.error('❌ Pinata file upload error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to upload file to Pinata',
      details: error.response?.data || error.message
    });
  }
});

// Upload JSON metadata to IPFS via Pinata
router.post('/upload-json', async (req, res) => {
  try {
    const pinataJWT = process.env.PINATA_JWT;

    if (!pinataJWT) {
      return res.status(500).json({ error: 'Pinata not configured on server' });
    }

    const { json, filename } = req.body;

    if (!json) {
      return res.status(400).json({ error: 'JSON data required' });
    }

    console.log('📤 Uploading JSON to Pinata:', filename);

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      {
        pinataContent: json,
        pinataMetadata: {
          name: filename || 'metadata.json'
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pinataJWT}`
        }
      }
    );

    console.log('✅ JSON uploaded to Pinata:', response.data.IpfsHash);
    res.json({
      success: true,
      ipfsHash: response.data.IpfsHash
    });

  } catch (error) {
    console.error('❌ Pinata JSON upload error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to upload JSON to Pinata',
      details: error.response?.data || error.message
    });
  }
});

module.exports = router;

