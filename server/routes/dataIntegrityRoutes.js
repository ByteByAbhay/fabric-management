const express = require('express');
const router = express.Router();
const { fixInlineStockRelationships } = require('../utils/dataIntegrityCheck');

// Debug middleware for this route
router.use((req, res, next) => {
  console.log('Data Integrity Route:', {
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query
  });
  next();
});

// Endpoint to fix missing lot numbers and patterns in inline stock
router.post('/fix-inline-stock', async (req, res) => {
  try {
    console.log('Running data integrity check for inline stock...');
    const result = await fixInlineStockRelationships();
    
    res.json({
      success: true,
      message: `Checked ${result.checked} items, fixed ${result.fixed} items, unable to fix ${result.unfixable} items`,
      result
    });
  } catch (error) {
    console.error('Error running data integrity check:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to run data integrity check'
    });
  }
});

module.exports = router;
