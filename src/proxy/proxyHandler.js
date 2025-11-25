const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('./config');

// In-memory store for intercepted requests/responses
let interceptedData = [];

/**
 * Custom proxy middleware that intercepts requests and responses
 */
function createFaultendProxy(targetUrl) {
  const target = targetUrl || config.defaultTarget;
  
  return createProxyMiddleware({
    target: target,
    changeOrigin: config.changeOrigin,
    logLevel: config.logLevel,
    timeout: config.timeout,
    proxyTimeout: config.proxyTimeout,
    pathRewrite: {
      '^/proxy': '', // Remove /proxy prefix
    },
    
    // Intercept requests before forwarding
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[PROXY] → ${req.method} ${req.url} → ${target}`);
      
      // Store metadata for later use
      req.proxyStartTime = Date.now();
      req.proxyTarget = target;
      
      // Store minimal request info immediately
      req.capturedRequest = {
        method: req.method,
        url: req.url,
        path: req.path,
        headers: req.headers,
        query: req.query
      };
    },
    
    // Intercept responses
    onProxyRes: (proxyRes, req, res) => {
      const duration = Date.now() - req.proxyStartTime;
      console.log(`[PROXY] ← ${proxyRes.statusCode} ${req.method} ${req.url} (${duration}ms)`);
      
      // Store transaction with response metadata (without body for now)
      const transaction = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        request: req.capturedRequest || {
          method: req.method,
          url: req.url,
          path: req.path,
          headers: req.headers,
          query: req.query
        },
        response: {
          statusCode: proxyRes.statusCode,
          statusMessage: proxyRes.statusMessage,
          headers: proxyRes.headers
        },
        duration: duration,
        target: req.proxyTarget
      };
      
      interceptedData.push(transaction);
      
      // Keep only last 1000 transactions
      if (interceptedData.length > 1000) {
        interceptedData.shift();
      }
    },
    
    // Error handling
    onError: (err, req, res) => {
      console.error(`[PROXY ERROR] ${req.method} ${req.url}:`, err.message);
      
      // Send error response to client
      res.status(502).json({
        error: 'Proxy Error',
        message: err.message,
        target: req.proxyTarget || target,
        timestamp: new Date().toISOString()
      });
    }
  });
}

/**
 * Try to parse JSON, return original string if fails
 */
function tryParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

/**
 * Generate unique ID for transaction
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all intercepted transactions
 */
function getInterceptedData() {
  return interceptedData;
}

/**
 * Clear intercepted data
 */
function clearInterceptedData() {
  interceptedData = [];
}

/**
 * Get a single transaction by ID
 */
function getTransactionById(id) {
  return interceptedData.find(t => t.id === id);
}

module.exports = {
  createFaultendProxy,
  getInterceptedData,
  clearInterceptedData,
  getTransactionById
};
