const express = require('express');
const { findMatchingRule, executeRule } = require('../rules/rulesEngine');

const router = express.Router();

router.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = JSON.parse(buf.toString(encoding || 'utf8'));
      req.rawBodySize = buf.length;
    }
  }
}));

router.use('/', (req, res, next) => {
  const serverId = req.serverId;
  
  if (!serverId) {
    return res.status(500).json({
      error: 'Internal Error',
      message: 'Server ID not set. This should be a fault-server route.'
    });
  }
  
  const request = {
    method: req.method,
    path: req.path,
    req: req  // Include Express request for condition evaluation
  };
  
  console.log(`[PROXY ROUTER] [${serverId}] Evaluating rules for ${req.method} ${req.path}`);
  
  // Find matching rule
  const rule = findMatchingRule(serverId, request);
  
  if (!rule) {
    console.log(`[PROXY ROUTER] [${serverId}] No matching rule for ${req.method} ${req.path}`);
    return res.status(502).json({
      error: 'No matching rule',
      message: `No proxy or mock rule configured for ${req.method} ${req.path}`,
      hint: `Configure routing rules for customer '${serverId}' via the admin panel`,
      serverId: serverId
    });
  }
  
  console.log(`[PROXY ROUTER] [${serverId}] Matched rule: ${rule.name} (priority: ${rule.priority}, action: ${rule.action})`);
  
  // Execute the rule (mock or proxy)
  executeRule(serverId, rule, req, res, next);
});

module.exports = router;
