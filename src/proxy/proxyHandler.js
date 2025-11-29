const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('./config');
const { logTransaction } = require('../traffic/trafficLogger');

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
        
        // Apply body size limit for storage (10MB)
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
        logTransaction({
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
          target: req.proxyTarget
        });
      });
    },
    
    // Error handling
    onError: (err, req, res) => {
      const duration = Date.now() - (req.proxyStartTime || Date.now());
      console.error(`[PROXY ERROR] ${req.method} ${req.url}:`, err.message);
      
      // Log error transaction
      logTransaction({
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
        target: req.proxyTarget || config.defaultTarget,
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
        target: req.proxyTarget || config.defaultTarget,
        timestamp: new Date().toISOString()
      });
    }
  });
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
  createFaultendProxy
};
