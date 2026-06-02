const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');
const zlib = require('zlib');
const { promisify } = require('util');
const config = require('./config');
const { logTransaction } = require('../storage/traffic');

const gunzip = promisify(zlib.gunzip);
const inflate = promisify(zlib.inflate);
const brotliDecompress = promisify(zlib.brotliDecompress);

/**
 * Decompress a buffer according to its Content-Encoding.
 * Returns the decompressed buffer, or the original on failure/unknown encoding.
 */
async function decompressBuffer(buffer, encoding) {
  const enc = (encoding || '').toLowerCase().trim();
  try {
    if (enc === 'gzip' || enc === 'x-gzip') return await gunzip(buffer);
    if (enc === 'deflate') return await inflate(buffer);
    if (enc === 'br') return await brotliDecompress(buffer);
  } catch (e) {
    console.error(`[PROXY] Decompression failed (${enc}):`, e.message);
  }
  return buffer;
}

// Headers redacted in stored logs (proxy still forwards originals as-is).
const REDACTED_HEADERS = new Set([
  'authorization', 'cookie', 'proxy-authorization',
  'x-api-key', 'x-auth-token', 'x-access-token'
]);

/**
 * Returns a shallow copy of the headers object with sensitive values replaced
 * by '[redacted]'. The original object is never mutated so the proxy
 * continues to forward the real values to the backend unchanged.
 */
function redactHeaders(headers) {
  if (!headers || typeof headers !== 'object') return headers;
  const out = { ...headers };
  for (const key of Object.keys(out)) {
    if (REDACTED_HEADERS.has(key.toLowerCase())) out[key] = '[redacted]';
  }
  return out;
}

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
        const preserve = new Set((req.serverConfig?.preserveHeaders || []).map(h => h.toLowerCase()));

        // Remove headers (first) — but never remove a server-level preserved header
        if (modifications.remove && Array.isArray(modifications.remove)) {
          modifications.remove.forEach(header => {
            if (preserve.has(String(header).toLowerCase())) {
              console.log(`[PROXY] Skip remove (preserved): ${header}`);
              return;
            }
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
      
      // Store request data for transaction logging.
      // Headers are redacted for storage; the proxy already forwarded originals above.
      req.capturedRequest = {
        method: req.method,
        url: req.url,
        path: req.path,
        headers: redactHeaders(req.headers),
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
      
      let responseBody = [];
      let responseBodySize = 0;
      let logged = false;
      
      async function doLog() {
        if (logged) return;
        logged = true;

        const rawBuffer = Buffer.concat(responseBody);
        const contentType = proxyRes.headers['content-type'] || '';
        const contentEncoding = proxyRes.headers['content-encoding'] || '';

        let parsedBody = null;
        const maxBodySize = 10 * 1024 * 1024;

        if (responseBodySize > maxBodySize) {
          parsedBody = `<response too large: ${responseBodySize} bytes>`;
        } else {
          // Decompress if needed so we can inspect/store the real body
          const bodyEncoding = (contentEncoding && contentEncoding !== 'identity') ? contentEncoding : null;
          const bodyBuffer = bodyEncoding ? await decompressBuffer(rawBuffer, contentEncoding) : rawBuffer;
          const bodyString = bodyBuffer.toString('utf8');

          if (contentType.includes('application/json')) {
            try {
              parsedBody = JSON.parse(bodyString);
            } catch (e) {
              parsedBody = bodyString;
            }
          } else if (contentType.includes('text/')) {
            parsedBody = bodyString;
          } else if (bodyEncoding) {
            // Could not interpret as text even after decompression (binary content)
            parsedBody = `<binary data: ${bodyBuffer.length} bytes>`;
          } else {
            parsedBody = `<binary data: ${responseBodySize} bytes>`;
          }
        }

        const serverId = req.serverId || 'unknown';
        if (req.serverConfig?.recordingEnabled === false) return;
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
        }).catch(err => console.error('[PROXY] Log error:', err.message));
      }
      
      proxyRes.on('data', (chunk) => {
        responseBody.push(chunk);
        responseBodySize += chunk.length;
      });
      
      proxyRes.on('end', doLog);
    },
    
    // Error handling
    onError: (err, req, res) => {
      const duration = Date.now() - (req.proxyStartTime || Date.now());
      console.error(`[PROXY ERROR] ${req.method} ${req.url}:`, err.message);
      
      const serverId = req.serverId || 'unknown';
      if (req.serverConfig?.recordingEnabled === false) return;
      logTransaction(serverId, {
        request: req.capturedRequest || {
          method: req.method,
          url: req.url,
          path: req.path,
          headers: redactHeaders(req.headers),
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
      }).catch(logErr => console.error('[PROXY] Log error:', logErr.message));
      
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
 * Execute proxy with a response transform applied before sending.
 * Buffers the entire proxy response so the transform function can
 * inspect and mutate { status, headers, body } before it is sent.
 */
function executeProxyWithTransform(targetUrl, req, res, next, runTransform, transformCode) {
  const target = targetUrl || config.defaultTarget;

  const proxyMiddleware = createProxyMiddleware({
    target,
    changeOrigin: config.changeOrigin,
    selfHandleResponse: true,
    logLevel: config.logLevel,
    timeout: config.timeout,
    proxyTimeout: config.proxyTimeout,

    onProxyReq: (proxyReq, req) => {
      console.log(`[PROXY+TRANSFORM] → ${req.method} ${req.url} → ${target}`);
      req.proxyStartTime = Date.now();
      req.proxyTarget = target;

      if (req.matchedRule && req.matchedRule.modifyRequestHeaders) {
        const modifications = req.matchedRule.modifyRequestHeaders;
        const preserve = new Set((req.serverConfig?.preserveHeaders || []).map(h => h.toLowerCase()));
        if (modifications.remove) modifications.remove.forEach(h => {
          if (preserve.has(String(h).toLowerCase())) return;
          proxyReq.removeHeader(h);
        });
        if (modifications.set) Object.entries(modifications.set).forEach(([k, v]) => proxyReq.setHeader(k, v));
        if (modifications.add) Object.entries(modifications.add).forEach(([k, v]) => { if (!proxyReq.getHeader(k)) proxyReq.setHeader(k, v); });
      }

      if (req.body && Object.keys(req.body).length > 0 && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }

      req.capturedRequest = {
        method: req.method, url: req.url, path: req.path,
        headers: redactHeaders(req.headers), query: req.query,
        body: req.rawBody || req.body || null,
        bodySize: req.rawBodySize || (req.body ? Buffer.byteLength(JSON.stringify(req.body)) : 0),
        contentType: req.headers['content-type'] || null
      };
    },

    onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
      const duration = Date.now() - req.proxyStartTime;
      const contentType = proxyRes.headers['content-type'] || '';

      let parsedBody;
      try {
        const bodyStr = responseBuffer.toString('utf8');
        parsedBody = contentType.includes('application/json') ? JSON.parse(bodyStr) : bodyStr;
      } catch (e) {
        parsedBody = responseBuffer.toString('utf8');
      }

      let responseObj = {
        status: proxyRes.statusCode,
        headers: { ...proxyRes.headers },
        body: parsedBody
      };

      try {
        responseObj = runTransform(transformCode, responseObj);
        console.log(`[PROXY+TRANSFORM] Transform applied for ${req.url}`);
      } catch (e) {
        console.error(`[PROXY+TRANSFORM] Transform error:`, e.message);
      }

      // Apply transformed status and headers
      res.status(responseObj.status);
      Object.entries(responseObj.headers).forEach(([k, v]) => {
        if (!['transfer-encoding', 'content-encoding'].includes(k.toLowerCase())) {
          res.setHeader(k, v);
        }
      });

      const responseBody = typeof responseObj.body === 'object'
        ? JSON.stringify(responseObj.body)
        : String(responseObj.body);

      res.setHeader('content-type', 'application/json');
      res.setHeader('content-length', Buffer.byteLength(responseBody));

      const { logTransaction } = require('../storage/traffic');
      if (req.serverConfig?.recordingEnabled === false) return;
      logTransaction(req.serverId || 'unknown', {
        request: req.capturedRequest,
        response: {
          statusCode: responseObj.status,
          statusMessage: proxyRes.statusMessage,
          headers: responseObj.headers,
          body: responseObj.body,
          bodySize: Buffer.byteLength(responseBody),
          contentType: 'application/json'
        },
        duration,
        target: req.proxyTarget,
        matchedRule: req.matchedRule || null
      }).catch(err => console.error('[PROXY+TRANSFORM] Log error:', err.message));

      return Buffer.from(responseBody);
    }),

    onError: (err, req, res) => {
      console.error(`[PROXY+TRANSFORM ERROR] ${req.method} ${req.url}:`, err.message);
      res.status(502).json({ error: 'Proxy Error', message: err.message });
    }
  });

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
  executeProxy,
  executeProxyWithTransform
};
