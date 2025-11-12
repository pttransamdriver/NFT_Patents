const express = require('express');
const axios = require('axios');
const { PDFDocument } = require('pdf-lib');
const router = express.Router();

/**
 * PDF processing endpoints
 * Handles patent PDF extraction and placeholder generation
 */

// Process patent PDF - extract first page
router.post('/process-patent', async (req, res) => {
  try {
    const { patentNumber, pdfUrl } = req.body;

    if (!patentNumber || !pdfUrl) {
      return res.status(400).json({ error: 'Patent number and PDF URL required' });
    }

    console.log('📄 Processing patent PDF:', patentNumber);

    // Fetch PDF from URL
    let pdfResponse;
    try {
      pdfResponse = await axios.get(pdfUrl, {
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
router.post('/generate-placeholder', async (req, res) => {
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
      y: 500,
      size: 12
    });
    
    page.drawText('Patent NFT Marketplace - PDF-First Approach', {
      x: 50,
      y: 450,
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
    console.error('❌ Placeholder generation error:', error.message);
    res.status(500).json({
      error: 'Failed to generate placeholder PDF',
      details: error.message
    });
  }
});

module.exports = router;

