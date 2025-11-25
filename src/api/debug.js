const express = require('express');
const { getInterceptedData, clearInterceptedData } = require('../proxy/proxyHandler');

const router = express.Router();

/**
 * Get all intercepted traffic (for debugging)
 */
router.get('/intercepted', (req, res) => {
  const data = getInterceptedData();
  res.json({
    count: data.length,
    transactions: data
  });
});

/**
 * Clear all intercepted data
 */
router.delete('/intercepted', (req, res) => {
  clearInterceptedData();
  res.json({ 
    success: true, 
    message: 'All intercepted data cleared' 
  });
});

module.exports = router;
