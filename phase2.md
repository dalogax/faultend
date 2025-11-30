# Phase 2: Backend - Proxy Core

## Objective
Build the core HTTP proxy functionality that intercepts REST + JSON requests, forwards them to the real backend, and returns responses. Implement the request/response pipeline with proper error handling and logging capabilities.

---

## Tasks

### 2.1 Create Proxy Configuration Module

**File:** `src/proxy/config.js`

Create a configuration module to centralize proxy settings:

```javascript
// Proxy configuration settings
module.exports = {
  // Default target backend - can be overridden via environment variable
  defaultTarget: process.env.BACKEND_URL || 'https://jsonplaceholder.typicode.com',
  
  // Proxy options
  changeOrigin: true,
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Timeout settings (in milliseconds)
  timeout: 30000,
  proxyTimeout: 30000,
  
  // Request size limits
  bodyParserLimit: '10mb'
};
```

**Purpose:**
- Centralize configuration for easy maintenance
- Support environment variable overrides
- Define sensible defaults for timeouts and limits

---

### 2.2 Create Request Body Parser Middleware

**File:** `src/proxy/bodyParser.js`

Create custom body parsing middleware that preserves raw body for proxying while making parsed body available for inspection:

```javascript
const express = require('express');

/**
 * Custom body parser that preserves raw body for proxying
 * while making parsed body available for inspection
 */
function createBodyParser() {
  return [
    // Parse JSON bodies
    express.json({
      limit: '10mb',
      verify: (req, res, buf, encoding) => {
        // Store raw body for proxying
        req.rawBody = buf.toString(encoding || 'utf8');
      }
    }),
    
    // Parse URL-encoded bodies
    express.urlencoded({ 
      extended: true,
      limit: '10mb',
      verify: (req, res, buf, encoding) => {
        if (!req.rawBody) {
          req.rawBody = buf.toString(encoding || 'utf8');
        }
      }
    }),
    
    // Handle raw text
    express.text({
      type: 'text/*',
      limit: '10mb',
      verify: (req, res, buf, encoding) => {
        req.rawBody = buf.toString(encoding || 'utf8');
      }
    })
  ];
}

module.exports = { createBodyParser };
```

**Key Features:**
- Preserves raw request body in `req.rawBody` for proxying
- Parses JSON, URL-encoded, and text bodies
- Configurable size limits
- Multiple content-type support

---

### 2.3 Create Proxy Handler with Request/Response Interception

**File:** `src/proxy/proxyHandler.js`

Implement the core proxy logic with interceptors:

```javascript
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
    
    // Intercept requests before forwarding
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[PROXY] → ${req.method} ${req.url} → ${target}`);
      
      // Store metadata for later use
      req.proxyStartTime = Date.now();
      req.proxyTarget = target;
      
      // Re-apply body for POST/PUT/PATCH requests
      if (req.rawBody && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        proxyReq.setHeader('Content-Length', Buffer.byteLength(req.rawBody));
        proxyReq.write(req.rawBody);
      }
    },
    
    // Intercept responses before sending to client
    onProxyRes: (proxyRes, req, res) => {
      const duration = Date.now() - req.proxyStartTime;
      console.log(`[PROXY] ← ${proxyRes.statusCode} ${req.method} ${req.url} (${duration}ms)`);
      
      // Capture response body
      let responseBody = '';
      
      proxyRes.on('data', (chunk) => {
        responseBody += chunk.toString('utf8');
      });
      
      proxyRes.on('end', () => {
        // Store the complete transaction
        storeTransaction(req, proxyRes, responseBody, duration);
      });
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
 * Store transaction data for later retrieval
 */
function storeTransaction(req, proxyRes, responseBody, duration) {
  const transaction = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    request: {
      method: req.method,
      url: req.url,
      path: req.path,
      headers: req.headers,
      body: req.body || null,
      query: req.query || {},
      rawBody: req.rawBody || null
    },
    response: {
      statusCode: proxyRes.statusCode,
      statusMessage: proxyRes.statusMessage,
      headers: proxyRes.headers,
      body: tryParseJSON(responseBody),
      rawBody: responseBody
    },
    duration: duration,
    target: req.proxyTarget
  };
  
  interceptedData.push(transaction);
  
  // Keep only last 1000 transactions in memory
  if (interceptedData.length > 1000) {
    interceptedData.shift();
  }
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
```

**Key Features:**
- Intercepts all HTTP methods (GET, POST, PUT, DELETE, etc.)
- Captures complete request/response data
- Measures response time
- Stores transactions in memory (max 1000)
- Handles JSON parsing safely
- Comprehensive error handling
- Console logging for debugging

---

### 2.4 Create Proxy Router

**File:** `src/proxy/router.js`

Create Express router for proxy endpoints:

```javascript
const express = require('express');
const { createFaultendProxy } = require('./proxyHandler');
const config = require('./config');

const router = express.Router();

/**
 * Main proxy route - catches all requests to /proxy/*
 * Strips /proxy prefix and forwards to target backend
 */
router.use('/', (req, res, next) => {
  // Get target from header or use default
  const targetUrl = req.headers['x-Faultend-target'] || config.defaultTarget;
  
  if (!targetUrl) {
    return res.status(400).json({
      error: 'No target backend specified',
      message: 'Set BACKEND_URL environment variable or X-Faultend-Target header'
    });
  }
  
  console.log(`[PROXY ROUTER] Routing ${req.method} ${req.url} to ${targetUrl}`);
  
  // Create and apply proxy middleware
  const proxyMiddleware = createFaultendProxy(targetUrl);
  proxyMiddleware(req, res, next);
});

module.exports = router;
```

**Features:**
- Routes all `/proxy/*` requests
- Supports custom target via header
- Falls back to default target from config
- Validates target exists before proxying

---

### 2.5 Create Debug/Testing Endpoints

**File:** `src/api/debug.js`

Create temporary debug endpoints for testing:

```javascript
const express = require('express');
const { getInterceptedData, clearInterceptedData } = require('../proxy/proxyHandler');

const router = express.Router();

/**
 * Get all intercepted traffic (for debugging)
 */
router.get('/intercepted', (req, res) => {
  const data = getInterceptedData();
  res.json({
    count: data.length,
    transactions: data
  });
});

/**
 * Clear all intercepted data
 */
router.delete('/intercepted', (req, res) => {
  clearInterceptedData();
  res.json({ 
    success: true, 
    message: 'All intercepted data cleared' 
  });
});

module.exports = router;
```

**Purpose:**
- Test that traffic interception works
- Inspect captured request/response data
- Clear data during testing

---

### 2.6 Update Express Server Configuration

**File:** `src/server.js`

Update the server to integrate proxy and body parsing:

```javascript
const express = require('express');
const path = require('path');
const { createBodyParser } = require('./proxy/bodyParser');
const proxyRouter = require('./proxy/router');
const debugRouter = require('./api/debug');

const app = express();

// Body parsing with raw body preservation
// Must come BEFORE proxy routes
app.use(createBodyParser());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Faultend',
    version: '0.1.0',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoints (temporary for Phase 2 testing)
app.use('/debug', debugRouter);

// Proxy routes - must be last to catch all unmatched routes
app.use('/proxy', proxyRouter);

// 404 handler for non-proxied routes
app.use((req, res) => {
  // If request accepts JSON, return JSON error
  if (req.accepts('json') && !req.accepts('html')) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Route not found. Use /proxy/* for proxied requests.',
      availableRoutes: ['/health', '/debug/intercepted', '/proxy/*']
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

**Changes:**
- Added body parser middleware
- Added proxy router
- Added debug endpoints
- Added 404 handler with helpful message
- Added global error handler
- Enhanced health check with timestamp

---

### 2.7 Update Main Entry Point

**File:** `src/index.js`

Enhance startup messaging:

```javascript
const server = require('./server');

const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'https://jsonplaceholder.typicode.com';

console.log('='.repeat(60));
console.log('Faultend Proxy Server');
console.log('='.repeat(60));
console.log(`Port:            ${PORT}`);
console.log(`Default Backend: ${BACKEND_URL}`);
console.log(`UI:              http://localhost:${PORT}`);
console.log(`Proxy:           http://localhost:${PORT}/proxy/*`);
console.log(`Debug:           http://localhost:${PORT}/debug/intercepted`);
console.log('='.repeat(60));

server.listen(PORT, () => {
  console.log(`\n✓ Server is running\n`);
  console.log(`Examples:`);
  console.log(`  curl http://localhost:${PORT}/proxy/posts/1`);
  console.log(`  curl http://localhost:${PORT}/debug/intercepted\n`);
});
```

**Improvements:**
- Better startup banner
- Shows all available endpoints
- Provides example curl commands
- More informative output

---

## Validation Steps

### Test 1: Basic GET Request Proxying
```bash
# Start server
npm run dev

# In another terminal, test basic proxy
curl http://localhost:3000/proxy/posts/1

# Expected: JSON response from jsonplaceholder.typicode.com
# Should see console logs showing request flow
```

### Test 2: POST Request with Body
```bash
curl -X POST http://localhost:3000/proxy/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Post","body":"Test body","userId":1}'

# Expected: JSON response with created post including ID
```

### Test 3: Verify Traffic Interception
```bash
# Make a few requests
curl http://localhost:3000/proxy/posts/1
curl http://localhost:3000/proxy/users/1

# Check intercepted data
curl http://localhost:3000/debug/intercepted

# Expected: JSON array containing both transactions with full request/response details
```

### Test 4: Custom Backend Target
```bash
curl -X GET http://localhost:3000/proxy/users \
  -H "X-Faultend-Target: https://jsonplaceholder.typicode.com"

# Expected: Users list from specified backend
```

### Test 5: Error Handling - Invalid Backend
```bash
curl -X GET http://localhost:3000/proxy/test \
  -H "X-Faultend-Target: https://invalid-backend-url-that-does-not-exist.example"

# Expected: 502 error with proper error message
```

### Test 6: PUT/PATCH Requests
```bash
curl -X PUT http://localhost:3000/proxy/posts/1 \
  -H "Content-Type: application/json" \
  -d '{"id":1,"title":"Updated","body":"Updated body","userId":1}'

# Expected: JSON response with updated data
```

### Test 7: DELETE Requests
```bash
curl -X DELETE http://localhost:3000/proxy/posts/1

# Expected: Success response (jsonplaceholder returns empty object)
```

### Test 8: Query Parameters
```bash
curl "http://localhost:3000/proxy/posts?userId=1"

# Expected: Filtered posts for user 1
```

### Test 9: Response Timing
```bash
# Check that duration is recorded
curl http://localhost:3000/proxy/posts/1
curl http://localhost:3000/debug/intercepted | jq '.[].duration'

# Expected: Should show duration in milliseconds for each request
```

### Test 10: Clear Intercepted Data
```bash
curl -X DELETE http://localhost:3000/debug/intercepted

# Then verify it's empty
curl http://localhost:3000/debug/intercepted

# Expected: Empty transactions array
```

---

## Success Criteria

- [x] Proxy successfully forwards GET requests to backend
- [x] Proxy successfully forwards POST/PUT/PATCH/DELETE requests with body
- [x] Request bodies are preserved and forwarded correctly
- [x] Response bodies are captured completely
- [x] Request/response data stored in memory with all details
- [x] Custom backend targets work via X-Faultend-Target header
- [x] Error handling returns 502 with descriptive messages
- [x] Console logging shows complete request flow
- [x] Response timing is measured accurately
- [x] JSON responses are parsed and stored
- [x] Query parameters are preserved
- [x] All HTTP methods supported
- [x] Transaction storage limited to 1000 items
- [x] Debug endpoints allow inspection of intercepted data

---

## Architecture Notes

### Request Flow
```
Client Request
    ↓
Express Server (port 3000)
    ↓
Body Parser Middleware (preserves raw body)
    ↓
Proxy Router (/proxy/*)
    ↓
Proxy Handler
    ↓
onProxyReq (intercept outgoing)
    ↓
http-proxy-middleware
    ↓
Target Backend (e.g., jsonplaceholder.typicode.com)
    ↓
Backend Response
    ↓
onProxyRes (intercept incoming)
    ↓
Store Transaction (in-memory)
    ↓
Client Response
```

### Data Model - Transaction Object
```javascript
{
  id: "1732627800000-abc123def",
  timestamp: "2025-11-26T12:30:00.000Z",
  request: {
    method: "POST",
    url: "/posts",
    path: "/posts",
    headers: { "content-type": "application/json", ... },
    body: { title: "Test", body: "Test body", userId: 1 },
    query: {},
    rawBody: '{"title":"Test","body":"Test body","userId":1}'
  },
  response: {
    statusCode: 201,
    statusMessage: "Created",
    headers: { "content-type": "application/json", ... },
    body: { id: 101, title: "Test", body: "Test body", userId: 1 },
    rawBody: '{"id":101,"title":"Test","body":"Test body","userId":1}'
  },
  duration: 245,
  target: "https://jsonplaceholder.typicode.com"
}
```

### Key Design Decisions

1. **Raw Body Preservation**: Custom body parser keeps `rawBody` for accurate proxying while parsing for inspection
2. **In-Memory Storage**: Simple array with 1000-item limit (FIFO) for Phase 2; will persist in Phase 11
3. **Target Flexibility**: Support both `BACKEND_URL` env var and `X-Faultend-Target` header
4. **Error Handling**: Return 502 for proxy errors with detailed context
5. **Timing**: Capture response time for each request
6. **JSON Optimization**: Auto-parse JSON responses but preserve raw text as fallback

---

## Known Limitations (To Address in Future Phases)

1. **No Rule Matching**: All requests proxied directly (Phase 4 will add rules)
2. **No Persistence**: Data lost on server restart (Phase 11 will add storage)
3. **No Frontend Display**: Must use curl/debug endpoints (Phase 8 will add UI)
4. **Memory Limited**: 1000 transactions max (acceptable for testing)
5. **No Filtering**: Cannot search/filter transactions yet (Phase 8)

---

## Environment Variables

Create `.env.example` file:

```bash
# Faultend Configuration

# Server port
PORT=3000

# Default backend URL to proxy requests to
BACKEND_URL=https://jsonplaceholder.typicode.com

# Logging level (error, warn, info, debug)
LOG_LEVEL=info
```

---

## Testing Checklist

Before completing Phase 2, verify:

- [ ] Server starts without errors
- [ ] Health check endpoint responds
- [ ] GET requests are proxied correctly
- [ ] POST requests with JSON body work
- [ ] PUT/PATCH requests preserve body
- [ ] DELETE requests work
- [ ] Query parameters are forwarded
- [ ] Request headers are preserved
- [ ] Response headers are captured
- [ ] Response bodies are stored
- [ ] Timing is measured
- [ ] Errors return 502 with details
- [ ] Console shows request/response logs
- [ ] Debug endpoint shows intercepted data
- [ ] Custom target via header works
- [ ] Transaction storage limits to 1000
- [ ] Clear intercepted data works

---

## Next Phase Preview

**Phase 3: Backend - Traffic Logging** will formalize the data models and storage structure, preparing for persistence. It will build on the intercepted data we're capturing in Phase 2 and add proper data management, filtering, and retrieval capabilities.

---

*This phase establishes the core proxy functionality that all future phases will build upon.*
