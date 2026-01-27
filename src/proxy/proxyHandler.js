const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('./config');
const { logTransaction } = require('../traffic/trafficLogger');

function createFaultendProxy(targetUrl) {
  const target = targetUrl || config.defaultTarget;
  
  return createProxyMiddleware({
    target: target,
    changeOrigin: config.changeOrigin,
    xfwd: config.xfwd,
    logLevel: config.logLevel,
    timeout: config.timeout,
    proxyTimeout: config.proxyTimeout,
    
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[PROXY] → ${req.method} ${req.url} → ${target}`);
      
      // Store metadata for later use
      req.proxyStartTime = Date.now();
      req.proxyTarget = target;
      
      if (req.matchedRule && req.matchedRule.modifyRequestHeaders) {
        const modifications = req.matchedRule.modifyRequestHeaders;
        
        // Remove headers (first)
        if (modifications.remove && Array.isArray(modifications.remove)) {
          modifications.remove.forEach(header => {
            proxyReq.removeHeader(header);
            console.log(`[PROXY] Removed header: ${header}`);
          });
        }
        
        // Set headers (overwrite existing, second)
        if (modifications.set && typeof modifications.set === 'object') {
          Object.entries(modifications.set).forEach(([key, value]) => {
            proxyReq.setHeader(key, value);
            console.log(`[PROXY] Set header: ${key} = ${value}`);
          });
        }
        
        // Add headers (only if not exists, last)
        if (modifications.add && typeof modifications.add === 'object') {
          Object.entries(modifications.add).forEach(([key, value]) => {
            if (!proxyReq.getHeader(key)) {
              proxyReq.setHeader(key, value);
              console.log(`[PROXY] Added header: ${key} = ${value}`);
            }
          });
        }
      }
      
      // If we have a parsed body from express.json(), write it to the proxy request
      if (req.body && Object.keys(req.body).length > 0 && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const bodyData = JSON.stringify(req.body);
        
        // Update content-length header
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        
        // Write body to proxy request
        proxyReq.write(bodyData);
      }
      
      // Store request data for transaction logging
      req.capturedRequest = {
        method: req.method,
        url: req.url,
        path: req.path,
        headers: req.headers,
        query: req.query,
        body: req.rawBody || req.body || null,
        bodySize: req.rawBodySize || (req.body ? Buffer.byteLength(JSON.stringify(req.body)) : 0),
        contentType: req.headers['content-type'] || null
      };
    },
    
    // Intercept responses
    onProxyRes: (proxyRes, req, res) => {
      const duration = Date.now() - req.proxyStartTime;
      console.log(`[PROXY] ← ${proxyRes.statusCode} ${req.method} ${req.url} (${duration}ms)`);
      
      // Capture response body
      let responseBody = [];
      let responseBodySize = 0;
      
      proxyRes.on('data', (chunk) => {
        responseBody.push(chunk);
        responseBodySize += chunk.length;
      });
      
      proxyRes.on('end', () => {
        // Combine chunks and parse body
        const bodyBuffer = Buffer.concat(responseBody);
        const bodyString = bodyBuffer.toString('utf8');
        
        let parsedBody = null;
        const contentType = proxyRes.headers['content-type'] || '';
        
        const maxBodySize = 10 * 1024 * 1024;
        if (responseBodySize > maxBodySize) {
          parsedBody = `<response too large: ${responseBodySize} bytes>`;
        } else if (contentType.includes('application/json')) {
          // Try to parse JSON responses
          try {
            parsedBody = JSON.parse(bodyString);
          } catch (e) {
            // Not valid JSON, store as string
            parsedBody = bodyString;
          }
        } else if (contentType.includes('text/')) {
          parsedBody = bodyString;
        } else {
          // Binary data - store metadata only
          parsedBody = `<binary data: ${responseBodySize} bytes>`;
        }
        
        // Log the complete transaction
        const serverId = req.serverId || 'unknown';
        logTransaction(serverId, {
          request: req.capturedRequest,
          response: {
            statusCode: proxyRes.statusCode,
            statusMessage: proxyRes.statusMessage,
            headers: proxyRes.headers,
            body: parsedBody,
            bodySize: responseBodySize,
            contentType: contentType
          },
          duration: duration,
          target: req.proxyTarget,
          matchedRule: req.matchedRule || null
        });
      });
    },
    
    // Error handling
    onError: (err, req, res) => {
      const duration = Date.now() - (req.proxyStartTime || Date.now());
      console.error(`[PROXY ERROR] ${req.method} ${req.url}:`, err.message);
      
      // Log error transaction
      const serverId = req.serverId || 'unknown';
      logTransaction(serverId, {
        request: req.capturedRequest || {
          method: req.method,
          url: req.url,
          path: req.path,
          headers: req.headers,
          query: req.query,
          body: null,
          bodySize: 0,
          contentType: null
        },
        response: {
          statusCode: 502,
          statusMessage: 'Bad Gateway',
          headers: {},
          body: { error: 'Proxy Error', message: err.message },
          bodySize: 0,
          contentType: 'application/json'
        },
        duration: duration,
        target: req.proxyTarget || 'unknown',
        matchedRule: req.matchedRule || null,
        error: {
          message: err.message,
          code: err.code,
          stack: err.stack
        }
      });
      
      // Send error response to client
      res.status(502).json({
        error: 'Proxy Error',
        message: err.message,
        target: req.proxyTarget || 'unknown',
        timestamp: new Date().toISOString()
      });
    }
  });
}

/**
 * Execute proxy for a specific target URL
 * Used by rules engine to proxy requests dynamically
 * @param {String} targetUrl - Backend URL to proxy to
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
function executeProxy(targetUrl, req, res, next) {
  const proxyMiddleware = createFaultendProxy(targetUrl);
  proxyMiddleware(req, res, next);
}

/**
 * Middleware to capture request body by buffering it completely
 * Must be applied before the proxy middleware
 */
function bodyCaptureMiddleware(req, res, next) {
  // Only capture body for methods that typically have one
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    let chunks = [];
    let bodySize = 0;
    const maxBodySize = 10 * 1024 * 1024; // 10MB limit
    
    req.on('data', (chunk) => {
      bodySize += chunk.length;
      if (bodySize <= maxBodySize) {
        chunks.push(chunk);
      }
    });
    
    req.on('end', () => {
      if (bodySize > maxBodySize) {
        req.rawBody = `<request too large: ${bodySize} bytes>`;
        req.rawBodySize = bodySize;
      } else if (chunks.length > 0) {
        const bodyBuffer = Buffer.concat(chunks);
        const bodyString = bodyBuffer.toString('utf8');
        const contentType = req.headers['content-type'] || '';
        
        // Try to parse JSON
        if (contentType.includes('application/json')) {
          try {
            req.rawBody = JSON.parse(bodyString);
          } catch (e) {
            req.rawBody = bodyString;
          }
        } else {
          req.rawBody = bodyString;
        }
        req.rawBodySize = bodySize;
      }
      
      // Continue after body is fully buffered
      next();
    });
  } else {
    // No body to capture, continue immediately
    next();
  }
}

module.exports = {
  createFaultendProxy,
  executeProxy
};
