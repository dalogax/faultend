const express = require('express');
const { findMatchingRule, executeRule } = require('../rules/rulesEngine');
const { logTransaction } = require('../traffic/trafficLogger');
const { customerExists } = require('../storage/storage');

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
  
  // Check if server exists
  if (!customerExists(serverId)) {
    console.log(`[PROXY ROUTER] Server '${serverId}' does not exist`);
    return res.status(404).json({
      error: 'Server Not Found',
      message: `Fault server '${serverId}' does not exist`,
      hint: 'Create the server via the admin API before routing traffic to it',
      serverId: serverId
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
    
    // Log the 502 response to traffic
    const startTime = Date.now();
    logTransaction(serverId, {
      request: {
        method: req.method,
        url: req.url,
        path: req.path,
        headers: req.headers,
        query: req.query,
        body: req.rawBody || req.body || null,
        bodySize: req.rawBodySize || 0,
        contentType: req.get('content-type') || null
      },
      response: {
        statusCode: 502,
        statusMessage: 'Bad Gateway',
        headers: { 'content-type': 'application/json' },
        body: {
          error: 'No matching rule',
          message: `No proxy or mock rule configured for ${req.method} ${req.path}`,
          hint: `Configure routing rules for customer '${serverId}' via the admin panel`,
          serverId: serverId
        },
        bodySize: 0,
        contentType: 'application/json'
      },
      duration: Date.now() - startTime,
      target: 'UNMATCHED',
      matchedRule: null
    });
    
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
