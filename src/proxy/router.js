const express = require('express');
const { findMatchingRule, executeRule } = require('../rules/rulesEngine');

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
 * Evaluates rules and executes matched rule (mock or proxy)
 */
router.use('/', (req, res, next) => {
  // Extract method and path for rule matching
  const request = {
    method: req.method,
    path: req.path
  };
  
  console.log(`[PROXY ROUTER] Evaluating rules for ${req.method} ${req.path}`);
  
  // Find matching rule
  const rule = findMatchingRule(request);
  
  if (!rule) {
    console.log(`[PROXY ROUTER] No matching rule for ${req.method} ${req.path}`);
    return res.status(502).json({
      error: 'No matching rule',
      message: `No proxy or mock rule configured for ${req.method} ${req.path}`,
      hint: 'Configure routing rules to proxy or mock this endpoint'
    });
  }
  
  console.log(`[PROXY ROUTER] Matched rule: ${rule.name} (priority: ${rule.priority}, action: ${rule.action})`);
  
  // Execute the rule (mock or proxy)
  executeRule(rule, req, res, next);
});

module.exports = router;
