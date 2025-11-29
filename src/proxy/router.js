const express = require('express');
const { createFaultendProxy } = require('./proxyHandler');
const config = require('./config');

const router = express.Router();

/**
 * Body parser for POST/PUT/PATCH - captures body for logging
 */
router.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    // Store raw body for logging
    if (buf && buf.length) {
      req.rawBody = JSON.parse(buf.toString(encoding || 'utf8'));
      req.rawBodySize = buf.length;
    }
  }
}));

/**
 * Main proxy route - catches all requests to /proxy/*
 * Strips /proxy prefix and forwards to target backend
 */
router.use('/', (req, res, next) => {
  // Get target from header or use default
  const targetUrl = req.headers['x-fault-end-target'] || config.defaultTarget;
  
  if (!targetUrl) {
    return res.status(400).json({
      error: 'No target backend specified',
      message: 'Set BACKEND_URL environment variable or X-Fault-End-Target header'
    });
  }
  
  console.log(`[PROXY ROUTER] Routing ${req.method} ${req.url} to ${targetUrl}`);
  
  // Create and apply proxy middleware
  const proxyMiddleware = createFaultendProxy(targetUrl);
  proxyMiddleware(req, res, next);
});

module.exports = router;
