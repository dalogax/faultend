const express = require('express');
const { findMatchingRule, executeRule } = require('../rules/rulesEngine');
const { logTransaction } = require('../storage/traffic');
const { serverExists, getServer } = require('../storage/users');

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

router.use('/', async (req, res, next) => {
  const serverId = req.serverId;
  
  if (!serverId) {
    return res.status(500).json({
      error: 'Internal Error',
      message: 'Server ID not set. This should be a fault-server route.'
    });
  }
  
  const server = await getServer(serverId);
  if (!server) {
    console.log(`[PROXY ROUTER] Server '${serverId}' does not exist`);
    return res.status(404).json({
      error: 'Server Not Found',
      message: `Fault server '${serverId}' does not exist`,
      hint: 'Create the server via the app UI before routing traffic to it',
      serverId: serverId
    });
  }

  // Expose behaviour knobs to downstream handlers (rules engine + proxyHandler)
  req.serverConfig = {
    recordingEnabled: server.recording_enabled !== false,
    defaultLatencyMs: server.default_latency_ms || 0,
    preserveHeaders: (server.preserve_headers || '')
      .split(',').map(h => h.trim().toLowerCase()).filter(Boolean)
  };

  const request = {
    method: req.method,
    path: req.path,
    req: req
  };
  
  console.log(`[PROXY ROUTER] [${serverId}] Evaluating rules for ${req.method} ${req.path}`);
  
  const rule = await findMatchingRule(serverId, request);
  
  if (!rule) {
    console.log(`[PROXY ROUTER] [${serverId}] No matching rule for ${req.method} ${req.path}`);
    
    const startTime = Date.now();
    if (req.serverConfig.recordingEnabled) await logTransaction(serverId, {
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
          hint: `Configure routing rules for server '${serverId}' via the app UI`,
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
  
  executeRule(serverId, rule, req, res, next);
});

module.exports = router;
