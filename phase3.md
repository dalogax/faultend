# Phase 3: Backend - Traffic Logging

## Objective
Create the traffic logging system to capture and store all proxied requests and responses with complete data. Design the data model for traffic logs including timestamps, HTTP methods, paths, headers, request/response bodies, and status codes. Add filtering and search capabilities.

---

## Tasks

### 3.1 Enhance Transaction Data Model

**File:** `src/traffic/trafficLogger.js`

Create a comprehensive traffic logging module with proper data structures:

```javascript
/**
 * Traffic Logger Module
 * Handles capturing, storing, and querying HTTP traffic
 */

// Traffic storage
let trafficLogs = [];
let maxLogs = 1000; // Maximum number of logs to keep in memory

/**
 * Transaction data model
 */
class Transaction {
  constructor(data) {
    this.id = data.id || generateId();
    this.timestamp = data.timestamp || new Date().toISOString();
    this.request = {
      method: data.request.method,
      url: data.request.url,
      path: data.request.path,
      headers: data.request.headers || {},
      query: data.request.query || {},
      body: data.request.body || null,
      bodySize: data.request.bodySize || 0,
      contentType: data.request.contentType || null
    };
    this.response = {
      statusCode: data.response.statusCode,
      statusMessage: data.response.statusMessage,
      headers: data.response.headers || {},
      body: data.response.body || null,
      bodySize: data.response.bodySize || 0,
      contentType: data.response.contentType || null
    };
    this.duration = data.duration || 0;
    this.target = data.target;
    this.error = data.error || null;
  }
}

/**
 * Generate unique transaction ID
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log a new transaction
 */
function logTransaction(transactionData) {
  const transaction = new Transaction(transactionData);
  
  trafficLogs.push(transaction);
  
  // Enforce max logs limit (FIFO)
  if (trafficLogs.length > maxLogs) {
    trafficLogs.shift();
  }
  
  return transaction;
}

/**
 * Get all traffic logs
 */
function getAllLogs() {
  return trafficLogs;
}

/**
 * Get transaction by ID
 */
function getLogById(id) {
  return trafficLogs.find(log => log.id === id);
}

/**
 * Filter logs by criteria
 */
function filterLogs(criteria = {}) {
  let filtered = [...trafficLogs];
  
  // Filter by HTTP method
  if (criteria.method) {
    filtered = filtered.filter(log => 
      log.request.method.toUpperCase() === criteria.method.toUpperCase()
    );
  }
  
  // Filter by status code
  if (criteria.statusCode) {
    filtered = filtered.filter(log => 
      log.response.statusCode === parseInt(criteria.statusCode)
    );
  }
  
  // Filter by status code range
  if (criteria.statusCodeMin) {
    filtered = filtered.filter(log => 
      log.response.statusCode >= parseInt(criteria.statusCodeMin)
    );
  }
  if (criteria.statusCodeMax) {
    filtered = filtered.filter(log => 
      log.response.statusCode <= parseInt(criteria.statusCodeMax)
    );
  }
  
  // Filter by path (simple contains)
  if (criteria.path) {
    filtered = filtered.filter(log => 
      log.request.path.includes(criteria.path)
    );
  }
  
  // Filter by path regex
  if (criteria.pathRegex) {
    try {
      const regex = new RegExp(criteria.pathRegex);
      filtered = filtered.filter(log => regex.test(log.request.path));
    } catch (e) {
      // Invalid regex, skip filtering
    }
  }
  
  // Filter by timestamp range
  if (criteria.timestampFrom) {
    filtered = filtered.filter(log => 
      new Date(log.timestamp) >= new Date(criteria.timestampFrom)
    );
  }
  if (criteria.timestampTo) {
    filtered = filtered.filter(log => 
      new Date(log.timestamp) <= new Date(criteria.timestampTo)
    );
  }
  
  // Filter by target
  if (criteria.target) {
    filtered = filtered.filter(log => 
      log.target.includes(criteria.target)
    );
  }
  
  // Filter by has error
  if (criteria.hasError !== undefined) {
    filtered = filtered.filter(log => 
      criteria.hasError ? log.error !== null : log.error === null
    );
  }
  
  return filtered;
}

/**
 * Clear all logs
 */
function clearLogs() {
  trafficLogs = [];
}

/**
 * Get statistics
 */
function getStats() {
  return {
    total: trafficLogs.length,
    byMethod: countByMethod(),
    byStatusCode: countByStatusCode(),
    errors: trafficLogs.filter(log => log.error !== null).length,
    averageDuration: calculateAverageDuration()
  };
}

function countByMethod() {
  const counts = {};
  trafficLogs.forEach(log => {
    counts[log.request.method] = (counts[log.request.method] || 0) + 1;
  });
  return counts;
}

function countByStatusCode() {
  const counts = {};
  trafficLogs.forEach(log => {
    const code = log.response.statusCode;
    counts[code] = (counts[code] || 0) + 1;
  });
  return counts;
}

function calculateAverageDuration() {
  if (trafficLogs.length === 0) return 0;
  const total = trafficLogs.reduce((sum, log) => sum + log.duration, 0);
  return Math.round(total / trafficLogs.length);
}

/**
 * Set maximum logs to keep
 */
function setMaxLogs(max) {
  maxLogs = max;
  // Trim if necessary
  if (trafficLogs.length > maxLogs) {
    trafficLogs = trafficLogs.slice(-maxLogs);
  }
}

module.exports = {
  Transaction,
  logTransaction,
  getAllLogs,
  getLogById,
  filterLogs,
  clearLogs,
  getStats,
  setMaxLogs
};
```

---

### 3.2 Add Body Capture to Proxy Handler

**File:** `src/proxy/proxyHandler.js`

Update proxy handler to capture request and response bodies:

```javascript
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
      
      // Capture request body if present
      let requestBody = null;
      let requestBodySize = 0;
      
      if (req.body && Object.keys(req.body).length > 0) {
        requestBody = req.body;
        requestBodySize = JSON.stringify(req.body).length;
      }
      
      // Store request data for transaction logging
      req.capturedRequest = {
        method: req.method,
        url: req.url,
        path: req.path,
        headers: req.headers,
        query: req.query,
        body: requestBody,
        bodySize: requestBodySize,
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
        
        // Try to parse JSON responses
        if (contentType.includes('application/json')) {
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
        
        // Apply body size limit for storage (10MB)
        const maxBodySize = 10 * 1024 * 1024;
        if (responseBodySize > maxBodySize) {
          parsedBody = `<response too large: ${responseBodySize} bytes>`;
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

module.exports = {
  createFaultendProxy
};
```

---

### 3.3 Create Traffic API Endpoints

**File:** `src/api/traffic.js`

Create API endpoints for traffic log access:

```javascript
const express = require('express');
const {
  getAllLogs,
  getLogById,
  filterLogs,
  clearLogs,
  getStats
} = require('../traffic/trafficLogger');

const router = express.Router();

/**
 * GET /api/traffic
 * Get all traffic logs with optional filtering
 */
router.get('/', (req, res) => {
  const {
    method,
    statusCode,
    statusCodeMin,
    statusCodeMax,
    path,
    pathRegex,
    timestampFrom,
    timestampTo,
    target,
    hasError
  } = req.query;
  
  // Build filter criteria from query params
  const criteria = {};
  if (method) criteria.method = method;
  if (statusCode) criteria.statusCode = statusCode;
  if (statusCodeMin) criteria.statusCodeMin = statusCodeMin;
  if (statusCodeMax) criteria.statusCodeMax = statusCodeMax;
  if (path) criteria.path = path;
  if (pathRegex) criteria.pathRegex = pathRegex;
  if (timestampFrom) criteria.timestampFrom = timestampFrom;
  if (timestampTo) criteria.timestampTo = timestampTo;
  if (target) criteria.target = target;
  if (hasError !== undefined) criteria.hasError = hasError === 'true';
  
  const logs = Object.keys(criteria).length > 0 
    ? filterLogs(criteria) 
    : getAllLogs();
  
  res.json({
    count: logs.length,
    logs: logs
  });
});

/**
 * GET /api/traffic/stats
 * Get traffic statistics
 */
router.get('/stats', (req, res) => {
  res.json(getStats());
});

/**
 * GET /api/traffic/:id
 * Get a specific traffic log by ID
 */
router.get('/:id', (req, res) => {
  const log = getLogById(req.params.id);
  
  if (!log) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Traffic log with ID ${req.params.id} not found`
    });
  }
  
  res.json(log);
});

/**
 * DELETE /api/traffic
 * Clear all traffic logs
 */
router.delete('/', (req, res) => {
  clearLogs();
  res.json({
    success: true,
    message: 'All traffic logs cleared'
  });
});

module.exports = router;
```

---

### 3.4 Update Server to Use New Traffic API

**File:** `src/server.js`

Update server to use the new traffic API instead of debug endpoints:

```javascript
const express = require('express');
const path = require('path');
const proxyRouter = require('./proxy/router');
const trafficRouter = require('./api/traffic');

const app = express();

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'fault-end',
    version: '0.1.0',
    timestamp: new Date().toISOString()
  });
});

// Traffic API endpoints
app.use('/api/traffic', trafficRouter);

// Proxy routes - must be last to catch all unmatched routes
app.use('/proxy', proxyRouter);

// 404 handler for non-proxied routes
app.use((req, res) => {
  // If request accepts JSON, return JSON error
  if (req.accepts('json') && !req.accepts('html')) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Route not found. Use /proxy/* for proxied requests.',
      availableRoutes: [
        '/health',
        '/api/traffic',
        '/api/traffic/stats',
        '/api/traffic/:id',
        '/proxy/*'
      ]
    });
  }
  
  // Otherwise serve the frontend
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

module.exports = app;
```

---

### 3.5 Update Main Entry Point

**File:** `src/index.js`

Update startup message with new API endpoints:

```javascript
const server = require('./server');

const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'https://jsonplaceholder.typicode.com';

console.log('='.repeat(60));
console.log('Fault-end Proxy Server');
console.log('='.repeat(60));
console.log(`Port:            ${PORT}`);
console.log(`Default Backend: ${BACKEND_URL}`);
console.log(`UI:              http://localhost:${PORT}`);
console.log(`Proxy:           http://localhost:${PORT}/proxy/*`);
console.log(`Traffic API:     http://localhost:${PORT}/api/traffic`);
console.log('='.repeat(60));

server.listen(PORT, () => {
  console.log(`\n✓ Server is running\n`);
  console.log(`Examples:`);
  console.log(`  curl http://localhost:${PORT}/proxy/posts/1`);
  console.log(`  curl http://localhost:${PORT}/api/traffic`);
  console.log(`  curl http://localhost:${PORT}/api/traffic/stats\n`);
});
```

---

## Validation Steps

### Test 1: Basic Request Body Capture
```bash
npm start

# In another terminal
curl -X POST http://localhost:3000/proxy/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Content","userId":1}'

# Check if body was captured
curl http://localhost:3000/api/traffic | grep -o '"body":{[^}]*}'
```

### Test 2: Response Body Capture
```bash
curl http://localhost:3000/proxy/posts/1

# Check response body was stored
curl http://localhost:3000/api/traffic | grep -o '"userId":1'
```

### Test 3: Filter by Method
```bash
# Make various requests
curl http://localhost:3000/proxy/posts/1
curl -X POST http://localhost:3000/proxy/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Test","userId":1}'

# Filter GET requests only
curl "http://localhost:3000/api/traffic?method=GET"

# Filter POST requests only
curl "http://localhost:3000/api/traffic?method=POST"
```

### Test 4: Filter by Status Code
```bash
curl "http://localhost:3000/api/traffic?statusCode=200"
curl "http://localhost:3000/api/traffic?statusCodeMin=200&statusCodeMax=299"
```

### Test 5: Filter by Path
```bash
curl "http://localhost:3000/api/traffic?path=/posts"
curl "http://localhost:3000/api/traffic?pathRegex=^/posts/[0-9]+"
```

### Test 6: Get Statistics
```bash
curl http://localhost:3000/api/traffic/stats
```

### Test 7: Get Specific Transaction
```bash
# Get all logs and extract an ID
ID=$(curl -s http://localhost:3000/api/traffic | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Get specific transaction
curl http://localhost:3000/api/traffic/$ID
```

### Test 8: Clear Traffic Logs
```bash
curl -X DELETE http://localhost:3000/api/traffic

# Verify empty
curl http://localhost:3000/api/traffic
```

### Test 9: Error Logging
```bash
# Trigger an error with invalid backend
curl -H "X-Fault-End-Target: http://invalid-backend-12345.local" \
  http://localhost:3000/proxy/test

# Check error was logged
curl "http://localhost:3000/api/traffic?hasError=true"
```

### Test 10: Body Size Limits
```bash
# Large response handling is automatic
curl http://localhost:3000/proxy/posts
```

---

## Success Criteria

- [x] Request bodies captured for POST/PUT/PATCH
- [x] Response bodies captured and parsed
- [x] JSON responses automatically parsed
- [x] Text responses stored as strings
- [x] Binary data handled with size metadata
- [x] Body size limits enforced (10MB)
- [x] Complete transaction data model implemented
- [x] Traffic filtering by method works
- [x] Traffic filtering by status code works
- [x] Traffic filtering by path works
- [x] Path regex filtering works
- [x] Timestamp filtering works
- [x] Get traffic statistics works
- [x] Get specific transaction by ID works
- [x] Clear traffic logs works
- [x] Error transactions logged properly
- [x] Content-Type headers captured
- [x] All API endpoints working

---

## Data Model - Complete Transaction

```javascript
{
  id: "1732627800000-abc123def",
  timestamp: "2025-11-26T12:30:00.000Z",
  request: {
    method: "POST",
    url: "/posts",
    path: "/posts",
    headers: { "content-type": "application/json", ... },
    query: {},
    body: { title: "Test", body: "Content", userId: 1 },
    bodySize: 45,
    contentType: "application/json"
  },
  response: {
    statusCode: 201,
    statusMessage: "Created",
    headers: { "content-type": "application/json", ... },
    body: { id: 101, title: "Test", body: "Content", userId: 1 },
    bodySize: 58,
    contentType: "application/json"
  },
  duration: 245,
  target: "https://jsonplaceholder.typicode.com",
  error: null
}
```

---

## API Endpoints Summary

```
GET    /api/traffic              # Get all traffic (with optional filters)
GET    /api/traffic/stats        # Get statistics
GET    /api/traffic/:id          # Get specific transaction
DELETE /api/traffic              # Clear all traffic
```

**Query Parameters for Filtering:**
- `method` - HTTP method (GET, POST, etc.)
- `statusCode` - Exact status code
- `statusCodeMin` - Minimum status code
- `statusCodeMax` - Maximum status code
- `path` - Path contains string
- `pathRegex` - Path matches regex
- `timestampFrom` - ISO timestamp
- `timestampTo` - ISO timestamp
- `target` - Target URL contains
- `hasError` - true/false

---

## Next Phase Preview

**Phase 4: Backend - Mock Rules Engine** will build on the traffic logging data to implement rule matching and mock response generation based on captured traffic patterns.

---

*This phase establishes comprehensive traffic logging that will be essential for creating mock rules and debugging in future phases.*
