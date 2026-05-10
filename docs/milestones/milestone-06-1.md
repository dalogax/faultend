# Phase 6.1: Subdomain-Based Multi-Tenant Architecture

**Status:** Planning  
**Priority:** High  
**Estimated Effort:** Large (Breaking Changes)

---

## Overview

Transform Faultend from a single-instance proxy tool to a multi-tenant SaaS-ready platform using subdomain-based routing. This phase removes the `/proxy` URL prefix requirement and enables seamless integration by allowing users to simply replace their backend domain with a Faultend subdomain.

---

## Architecture Design

### Subdomain Routing Strategy

All routing decisions are made based on the subdomain in the `Host` header:

| Subdomain Pattern | Purpose | Routes To | Example |
|------------------|---------|-----------|---------|
| `[ROOT_DOMAIN]` (no subdomain) | Landing page | Static HTML landing page | `localhost` or `faultend.com` |
| `app.[ROOT_DOMAIN]` | Servers API | Servers API routes | `app.localhost` or `app.faultend.com` |
| `app.[ROOT_DOMAIN]` | User Application | Current frontend UI | `app.localhost` or `app.faultend.com` |
| `[customer-id].[ROOT_DOMAIN]` | Fault Server | Proxy with customer rules | `customer1.localhost`, `acme.faultend.com` |

### Configuration

**Environment Variable:**
```bash
ROOT_DOMAIN=localhost           # Development
ROOT_DOMAIN=faultend.com        # Production
```

### DNS Setup

**Development (localhost):**
- No DNS configuration needed
- `*.localhost` resolves natively to `127.0.0.1` in most systems
- Node.js HTTP server detects subdomain via `Host` header

**Production (faultend.com):**
```
# DNS Wildcard Record
*.faultend.com.    IN    A    123.45.67.89

# Specific records (optional, for clarity)
faultend.com.         IN    A    123.45.67.89
app.faultend.com.   IN    A    123.45.67.89
app.faultend.com.     IN    A    123.45.67.89
```

---

## Data Model Changes

### Multi-Tenant Data Isolation

**Current State:**
- Global `rules` array in rulesEngine.js
- Global `trafficLogs` array in trafficLogger.js

**New State:**
- **Scoped by customer ID**
- Each fault server (subdomain) has isolated data

**Data Structure:**
```javascript
// In-memory storage (Phase 6.1)
const customers = {
  'customer1': {
    metadata: {
      id: 'customer1',
      createdAt: '2025-11-29T10:00:00Z',
      name: 'Customer 1',
      description: 'Test instance for customer 1'
    },
    rules: [],        // Customer-specific rules
    traffic: []       // Customer-specific traffic logs
  },
  'acme': {
    metadata: { ... },
    rules: [],
    traffic: []
  }
}
```

**File Storage (Phase 11 enhancement):**
```
data/
  customers/
    customer1/
      metadata.json
      rules.json
      traffic.json
    acme/
      metadata.json
      rules.json
      traffic.json
```

---

## Implementation Tasks

### Task 1: Utility - Subdomain Detection

**File:** `src/utils/subdomain.js` (NEW)

**Purpose:** Extract subdomain from request and determine routing type

**Implementation:**
```javascript
/**
 * Extract subdomain from request
 * @param {Express.Request} req - Express request object
 * @returns {string} Subdomain (empty string if none)
 */
function getSubdomain(req) {
  const rootDomain = process.env.ROOT_DOMAIN || 'localhost';
  const host = req.hostname || req.headers.host?.split(':')[0] || '';
  
  // Remove port if present
  const hostname = host.split(':')[0];
  
  // If hostname equals root domain, no subdomain
  if (hostname === rootDomain) {
    return '';
  }
  
  // Extract subdomain: subdomain.rootdomain.com -> subdomain
  const parts = hostname.split('.');
  const rootParts = rootDomain.split('.');
  
  // Calculate subdomain parts (everything before root domain)
  const subdomainParts = parts.slice(0, parts.length - rootParts.length);
  
  return subdomainParts.join('.');
}

/**
 * Determine routing type based on subdomain
 * @param {string} subdomain
 * @returns {'landing'|'app'|'app'|'fault-server'}
 */
function getRouteType(subdomain) {
  if (!subdomain || subdomain === '') return 'landing';
  if (subdomain === 'app') return 'app';
  if (subdomain === 'app') return 'app';
  return 'fault-server';
}

module.exports = { getSubdomain, getRouteType };
```

**Tests Required:**
- ✅ `localhost` → subdomain: `''`, type: `'landing'`
- ✅ `app.localhost` → subdomain: `'app'`, type: `'app'`
- ✅ `app.localhost` → subdomain: `'app'`, type: `'app'`
- ✅ `customer1.localhost` → subdomain: `'customer1'`, type: `'fault-server'`
- ✅ `acme.faultend.com` → subdomain: `'acme'`, type: `'fault-server'`

---

### Task 2: Multi-Tenant Storage Layer

**File:** `src/storage/multiTenant.js` (NEW)

**Purpose:** Manage customer-scoped data (rules and traffic)

**Implementation:**
```javascript
// In-memory multi-tenant storage
const customers = new Map();

/**
 * Initialize customer if not exists
 */
function ensureCustomer(customerId) {
  if (!customers.has(customerId)) {
    customers.set(customerId, {
      metadata: {
        id: customerId,
        createdAt: new Date().toISOString(),
        name: customerId,
        description: `Fault server for ${customerId}`
      },
      rules: [],
      traffic: []
    });
  }
  return customers.get(customerId);
}

/**
 * Get customer data
 */
function getCustomer(customerId) {
  return customers.get(customerId);
}

/**
 * Get all customers
 */
function getAllCustomers() {
  return Array.from(customers.values()).map(c => c.metadata);
}

/**
 * Create customer
 */
function createCustomer(customerId, metadata = {}) {
  if (customers.has(customerId)) {
    throw new Error(`Customer '${customerId}' already exists`);
  }
  
  const customer = {
    metadata: {
      id: customerId,
      createdAt: new Date().toISOString(),
      name: metadata.name || customerId,
      description: metadata.description || `Fault server for ${customerId}`
    },
    rules: [],
    traffic: []
  };
  
  customers.set(customerId, customer);
  return customer;
}

/**
 * Delete customer
 */
function deleteCustomer(customerId) {
  if (!customers.has(customerId)) {
    throw new Error(`Customer '${customerId}' not found`);
  }
  customers.delete(customerId);
}

module.exports = {
  ensureCustomer,
  getCustomer,
  getAllCustomers,
  createCustomer,
  deleteCustomer
};
```

---

### Task 3: Refactor Rules Engine for Multi-Tenancy

**File:** `src/rules/rulesEngine.js` (MODIFY)

**Changes Required:**
1. Add `customerId` parameter to all functions
2. Store rules in multi-tenant storage instead of global array
3. Scope all operations to customer

**Example Refactoring:**
```javascript
// BEFORE (Phase 6)
let rules = [];

function addRule(ruleData) {
  // ... validation ...
  const rule = { id: generateRuleId(), ...ruleData };
  rules.push(rule);
  rules.sort((a, b) => b.priority - a.priority);
  return rule;
}

// AFTER (Phase 6.1)
const { ensureCustomer } = require('../storage/multiTenant');

function addRule(customerId, ruleData) {
  const customer = ensureCustomer(customerId);
  // ... validation ...
  const rule = { id: generateRuleId(), ...ruleData };
  customer.rules.push(rule);
  customer.rules.sort((a, b) => b.priority - a.priority);
  return rule;
}

function getAllRules(customerId) {
  const customer = ensureCustomer(customerId);
  return customer.rules;
}

function findMatchingRule(customerId, request) {
  const customer = ensureCustomer(customerId);
  // ... existing matching logic but using customer.rules ...
}
```

**Functions to Update:**
- ✅ `addRule(customerId, ruleData)`
- ✅ `updateRule(customerId, ruleId, ruleData)`
- ✅ `deleteRule(customerId, ruleId)`
- ✅ `toggleRule(customerId, ruleId)`
- ✅ `getAllRules(customerId)`
- ✅ `getRuleById(customerId, ruleId)`
- ✅ `findMatchingRule(customerId, request)`
- ✅ `executeRule(customerId, rule, req, res, next)`
- ✅ `importRules(customerId, rules, mode)`
- ✅ `exportRules(customerId)`

---

### Task 4: Refactor Traffic Logger for Multi-Tenancy

**File:** `src/traffic/trafficLogger.js` (MODIFY)

**Changes Required:**
1. Add `customerId` parameter to all functions
2. Store traffic in multi-tenant storage
3. Scope filtering and stats to customer

**Example Refactoring:**
```javascript
// BEFORE
let trafficLogs = [];

function logTransaction(transactionData) {
  const transaction = new Transaction(transactionData);
  trafficLogs.push(transaction);
  if (trafficLogs.length > maxLogs) {
    trafficLogs.shift();
  }
  return transaction;
}

// AFTER
const { ensureCustomer } = require('../storage/multiTenant');

function logTransaction(customerId, transactionData) {
  const customer = ensureCustomer(customerId);
  const transaction = new Transaction(transactionData);
  customer.traffic.push(transaction);
  if (customer.traffic.length > maxLogs) {
    customer.traffic.shift();
  }
  return transaction;
}

function getAllLogs(customerId) {
  const customer = ensureCustomer(customerId);
  return customer.traffic;
}
```

**Functions to Update:**
- ✅ `logTransaction(customerId, transactionData)`
- ✅ `getAllLogs(customerId)`
- ✅ `getLogById(customerId, id)`
- ✅ `filterLogs(customerId, criteria)`
- ✅ `clearLogs(customerId)`
- ✅ `getStats(customerId)`

---

### Task 5: Update Proxy Router - Remove /proxy Prefix

**File:** `src/proxy/router.js` (MODIFY)

**Changes Required:**
1. Remove `/proxy` prefix - route all paths
2. Get `customerId` from request context (set by middleware)
3. Pass `customerId` to rules engine

**Before:**
```javascript
router.use('/', (req, res, next) => {
  const request = { method: req.method, path: req.path, req: req };
  const rule = findMatchingRule(request);
  // ...
});
```

**After:**
```javascript
router.use('/', (req, res, next) => {
  const customerId = req.customerId; // Set by subdomain middleware
  
  if (!customerId) {
    return res.status(500).json({
      error: 'Internal Error',
      message: 'Customer ID not set. This is a fault-server route.'
    });
  }
  
  const request = { method: req.method, path: req.path, req: req };
  const rule = findMatchingRule(customerId, request);
  
  if (!rule) {
    return res.status(502).json({
      error: 'No matching rule',
      message: `No proxy or mock rule configured for ${req.method} ${req.path}`,
      hint: `Configure routing rules for customer '${customerId}'`
    });
  }
  
  executeRule(customerId, rule, req, res, next);
});
```

---

### Task 6: Update Traffic API - Add Customer Scoping

**File:** `src/api/traffic.js` (MODIFY)

**Changes Required:**
1. Get `customerId` from request context
2. Pass to all traffic logger functions
3. Validate customer exists

**Example:**
```javascript
router.get('/', (req, res) => {
  const customerId = req.customerId;
  
  if (!customerId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Customer ID required. Access via app.[ROOT_DOMAIN]'
    });
  }
  
  // ... build filters ...
  
  let logs = Object.keys(filters).length > 0 
    ? filterLogs(customerId, filters) 
    : getAllLogs(customerId);
  
  // ... apply limit ...
  
  res.json({ count: logs.length, logs: logs });
});
```

**All endpoints require similar update:**
- ✅ `GET /api/traffic`
- ✅ `GET /api/traffic/stats`
- ✅ `GET /api/traffic/:id`
- ✅ `DELETE /api/traffic`

---

### Task 7: Update Rules API - Add Customer Scoping

**File:** `src/api/rules.js` (MODIFY)

**Changes Required:**
1. Get `customerId` from request context
2. Pass to all rules engine functions

**Example:**
```javascript
router.get('/', (req, res) => {
  const customerId = req.customerId;
  
  if (!customerId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Customer ID required. Access via app.[ROOT_DOMAIN]'
    });
  }
  
  const rules = getAllRules(customerId);
  res.json({ rules, count: rules.length });
});

router.post('/', (req, res) => {
  const customerId = req.customerId;
  
  if (!customerId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Customer ID required'
    });
  }
  
  try {
    const rule = addRule(customerId, req.body);
    console.log(`[API] Created rule for '${customerId}': ${rule.name}`);
    res.status(201).json(rule);
  } catch (error) {
    res.status(400).json({ error: 'Validation Error', message: error.message });
  }
});
```

**All endpoints require similar update:**
- ✅ `GET /api/rules`
- ✅ `GET /api/rules/:id`
- ✅ `POST /api/rules`
- ✅ `PUT /api/rules/:id`
- ✅ `DELETE /api/rules/:id`
- ✅ `PATCH /api/rules/:id/toggle`
- ✅ `POST /api/rules/export`
- ✅ `POST /api/rules/import`

---

### Task 8: Create Servers API for Fault Server Management

**File:** `src/api/servers.js` (NEW)

**Purpose:** Manage fault server lifecycle (create, list, delete)

**Implementation:**
```javascript
const express = require('express');
const router = express.Router();
const {
  getAllCustomers,
  getCustomer,
  createCustomer,
  deleteCustomer
} = require('../storage/multiTenant');

router.use(express.json());

/**
 * GET /api/servers
 * List all fault servers
 */
router.get('/servers', (req, res) => {
  const servers = getAllCustomers();
  res.json({ servers, count: servers.length });
});

/**
 * GET /api/servers/:id
 * Get specific fault server details
 */
router.get('/servers/:id', (req, res) => {
  const customer = getCustomer(req.params.id);
  
  if (!customer) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Fault server '${req.params.id}' not found`
    });
  }
  
  res.json({
    ...customer.metadata,
    rulesCount: customer.rules.length,
    trafficCount: customer.traffic.length
  });
});

/**
 * POST /api/servers
 * Create new fault server
 * 
 * Body: { id: "customer1", name: "Customer 1", description: "..." }
 */
router.post('/servers', (req, res) => {
  const { id, name, description } = req.body;
  
  if (!id || typeof id !== 'string' || !/^[a-z0-9-]+$/.test(id)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'id is required and must contain only lowercase letters, numbers, and hyphens'
    });
  }
  
  try {
    const customer = createCustomer(id, { name, description });
    console.log(`[ADMIN] Created fault server: ${id}`);
    
    const rootDomain = process.env.ROOT_DOMAIN || 'localhost';
    res.status(201).json({
      ...customer.metadata,
      url: `http://${id}.${rootDomain}:${process.env.PORT || 3000}`
    });
  } catch (error) {
    res.status(400).json({
      error: 'Validation Error',
      message: error.message
    });
  }
});

/**
 * DELETE /api/servers/:id
 * Delete fault server and all its data
 */
router.delete('/servers/:id', (req, res) => {
  try {
    deleteCustomer(req.params.id);
    console.log(`[ADMIN] Deleted fault server: ${req.params.id}`);
    res.json({
      message: 'Fault server deleted successfully',
      id: req.params.id
    });
  } catch (error) {
    res.status(404).json({
      error: 'Not Found',
      message: error.message
    });
  }
});

module.exports = router;
```

---

### Task 9: Create Subdomain Routing Middleware

**File:** `src/middleware/subdomainRouter.js` (NEW)

**Purpose:** Detect subdomain and set routing context

**Implementation:**
```javascript
const path = require('path');
const { getSubdomain, getRouteType } = require('../utils/subdomain');

/**
 * Subdomain routing middleware
 * Sets req.subdomain, req.routeType, req.customerId
 */
function subdomainRouter(req, res, next) {
  const subdomain = getSubdomain(req);
  const routeType = getRouteType(subdomain);
  
  req.subdomain = subdomain;
  req.routeType = routeType;
  
  // For fault-server routes, set customerId for data isolation
  if (routeType === 'fault-server') {
    req.customerId = subdomain;
  }
  
  // For app routes, allow accessing different customers via query param
  // This enables the UI to manage multiple customers
  if (routeType === 'app' && req.query.customerId) {
    req.customerId = req.query.customerId;
  }
  
  console.log(`[SUBDOMAIN] ${req.hostname} → subdomain: '${subdomain}', type: ${routeType}`);
  
  next();
}

module.exports = subdomainRouter;
```

---

### Task 10: Update Express Server with Subdomain Routing

**File:** `src/server.js` (MODIFY)

**Changes Required:**
1. Add subdomain routing middleware
2. Create separate route handlers for each subdomain type
3. Move proxy router to catch-all for fault-server subdomains
4. Add admin API routes
5. Create landing page route

**Implementation:**
```javascript
const express = require('express');
const path = require('path');
const subdomainRouter = require('./middleware/subdomainRouter');
const proxyRouter = require('./proxy/router');
const trafficRouter = require('./api/traffic');
const rulesRouter = require('./api/rules');
const serversRouter = require('./api/servers');

const app = express();

// Apply subdomain detection middleware FIRST
app.use(subdomainRouter);

// Health check endpoint (available on all subdomains)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Faultend',
    version: '0.1.0',
    subdomain: req.subdomain,
    routeType: req.routeType,
    timestamp: new Date().toISOString()
  });
});

// Route based on subdomain type
app.use((req, res, next) => {
  const { routeType } = req;
  
  // Landing page (no subdomain)
  if (routeType === 'landing') {
    if (req.path === '/' || req.path === '/index.html') {
      return res.sendFile(path.join(__dirname, '../public/landing.html'));
    }
    return res.status(404).json({
      error: 'Not Found',
      message: 'Landing page only. Use app.* for management, app.* for UI, or [customer].* for fault servers.'
    });
  }
  
  // Servers API
  if (routeType === 'app') {
    if (req.path.startsWith('/api/admin')) {
      return next(); // Let admin router handle it
    }
    return res.status(404).json({
      error: 'Not Found',
      message: 'Servers API routes start with /api/admin/*'
    });
  }
  
  // App UI
  if (routeType === 'app') {
    // Serve static frontend files
    if (req.path.startsWith('/api/')) {
      return next(); // Let API routers handle it
    }
    // Serve frontend
    express.static(path.join(__dirname, '../public'))(req, res, next);
    return;
  }
  
  // Fault server - proxy all requests
  if (routeType === 'fault-server') {
    return next(); // Let proxy router handle it
  }
  
  res.status(500).json({ error: 'Unknown route type' });
});

// Servers API routes (only on app.*)
app.use('/api/admin', (req, res, next) => {
  if (req.routeType !== 'app') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Servers API only accessible on app subdomain'
    });
  }
  next();
}, serversRouter);

// Traffic and Rules APIs (only on app.*)
app.use('/api/traffic', (req, res, next) => {
  if (req.routeType !== 'app') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'API only accessible on app subdomain'
    });
  }
  next();
}, trafficRouter);

app.use('/api/rules', (req, res, next) => {
  if (req.routeType !== 'app') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'API only accessible on app subdomain'
    });
  }
  next();
}, rulesRouter);

// Proxy router - handles ALL requests on fault-server subdomains
app.use((req, res, next) => {
  if (req.routeType === 'fault-server') {
    return proxyRouter(req, res, next);
  }
  next();
});

// 404 handler for app subdomain
app.use((req, res, next) => {
  if (req.routeType === 'app') {
    // Serve main app HTML for SPA routing
    return res.sendFile(path.join(__dirname, '../public/index.html'));
  }
  next();
});

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Route not found',
    subdomain: req.subdomain,
    routeType: req.routeType
  });
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

### Task 11: Create Landing Page

**File:** `public/landing.html` (NEW)

**Purpose:** Explain the service on root domain

**Implementation:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Faultend - Resilience Testing Proxy</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: 800px;
      margin: 60px auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 { color: #e74c3c; }
    code { 
      background: #f4f4f4; 
      padding: 2px 6px; 
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    .box {
      background: #f9f9f9;
      border-left: 4px solid #e74c3c;
      padding: 15px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <h1>🔧 Faultend</h1>
  <p>Lightweight proxy for testing application resilience against unreliable backends.</p>
  
  <h2>Quick Start</h2>
  <div class="box">
    <p><strong>Admin Panel:</strong> <a href="" id="app-link">Loading...</a></p>
    <p><strong>User App:</strong> <a href="" id="app-link">Loading...</a></p>
  </div>
  
  <h2>How It Works</h2>
  <ol>
    <li>Create a fault server via admin panel</li>
    <li>Configure routing rules (proxy or mock)</li>
    <li>Point your app to <code>your-server.ROOT_DOMAIN</code></li>
    <li>Watch your app handle failures gracefully</li>
  </ol>
  
  <h2>Documentation</h2>
  <p>Visit <a href="https://github.com/<YOUR_USERNAME>/faultend">GitHub</a> for full documentation.</p>
  
  <script>
    const rootDomain = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    document.getElementById('app-link').href = `http://app.${rootDomain}${port}/api/servers`;
    document.getElementById('app-link').textContent = `app.${rootDomain}`;
    document.getElementById('app-link').href = `http://app.${rootDomain}${port}`;
    document.getElementById('app-link').textContent = `app.${rootDomain}`;
  </script>
</body>
</html>
```

---

### Task 12: Update Startup Initialization

**File:** `src/index.js` (MODIFY)

**Changes Required:**
1. Show ROOT_DOMAIN configuration
2. Display subdomain URLs
3. Remove /proxy prefix from examples

**Before:**
```javascript
console.log(`Proxy:           http://localhost:${PORT}/proxy/*`);
```

**After:**
```javascript
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'localhost';

console.log('='.repeat(60));
console.log('Faultend Proxy Server');
console.log('='.repeat(60));
console.log(`Port:            ${PORT}`);
console.log(`Root Domain:     ${ROOT_DOMAIN}`);
console.log(`Landing:         http://${ROOT_DOMAIN}:${PORT}`);
console.log(`Servers API:       http://app.${ROOT_DOMAIN}:${PORT}/api/servers`);
console.log(`User App:        http://app.${ROOT_DOMAIN}:${PORT}`);
console.log(`Fault Servers:   http://[customer-id].${ROOT_DOMAIN}:${PORT}`);
console.log('='.repeat(60));

// ... initialization ...

console.log(`Examples:`);
console.log(`  # Create fault server`);
console.log(`  curl -X POST http://app.${ROOT_DOMAIN}:${PORT}/api/servers \\`);
console.log(`    -H "Content-Type: application/json" \\`);
console.log(`    -d '{"id":"customer1","name":"Customer 1"}'`);
console.log(``);
console.log(`  # Access customer's fault server`);
console.log(`  curl http://customer1.${ROOT_DOMAIN}:${PORT}/users/123`);
```

---

### Task 13: Update Integration Tests

**File:** `test/integration.test.js` (MODIFY)

**Breaking Changes:**
1. Remove `/proxy` prefix from all test URLs
2. Use subdomain URLs (`customer1.localhost:3000`)
3. Test subdomain detection and routing
4. Test admin API for server creation
5. Test multi-tenant data isolation

**Example Changes:**
```javascript
// BEFORE
function request(method, path, body = null, headers = {}) {
  const url = new URL(path, 'http://localhost:3000');
  // ...
}

// Test: curl http://localhost:3000/proxy/posts/1

// AFTER
function request(method, path, body = null, headers = {}, subdomain = 'customer1') {
  const rootDomain = process.env.ROOT_DOMAIN || 'localhost';
  const host = subdomain ? `${subdomain}.${rootDomain}` : rootDomain;
  const url = new URL(path, `http://${host}:3000`);
  
  const options = {
    method,
    hostname: '127.0.0.1',  // Connect to localhost IP
    port: 3000,
    path: url.pathname + url.search,
    headers: { 
      'Host': `${host}:3000`,  // Send subdomain in Host header
      'Content-Type': 'application/json', 
      ...headers 
    },
    timeout: 5000
  };
  // ...
}

// Test: curl http://customer1.localhost:3000/posts/1
```

**New Tests Required:**
1. ✅ Subdomain detection (landing, admin, app, fault-server)
2. ✅ Servers API - Create fault server
3. ✅ Servers API - List fault servers
4. ✅ Servers API - Delete fault server
5. ✅ Multi-tenant isolation (customer1 rules don't affect customer2)
6. ✅ Fault server proxying without /proxy prefix
7. ✅ App subdomain serves frontend
8. ✅ Traffic and rules APIs scoped per customer

---

## Testing Strategy

### Unit Tests

**File:** `test/phase6_1.test.js` (NEW)

**Coverage:**
1. Subdomain extraction logic (`src/utils/subdomain.js`)
2. Route type detection
3. Multi-tenant storage operations
4. Customer CRUD operations

### Integration Tests

**File:** `test/integration.test.js` (UPDATE)

**Coverage:**
1. End-to-end subdomain routing
2. Servers API workflows
3. Multi-tenant data isolation
4. Proxy functionality without /proxy prefix
5. API access control (app.* vs app.* vs fault-server.*)

### Manual Testing Checklist

- [ ] Landing page loads on `http://localhost:3000`
- [ ] Servers API accessible on `http://app.localhost:3000/api/servers`
- [ ] Create fault server via admin API
- [ ] App UI loads on `http://app.localhost:3000`
- [ ] Fault server proxies requests on `http://customer1.localhost:3000/*`
- [ ] Rules scoped per customer (customer1 rules don't affect customer2)
- [ ] Traffic logs scoped per customer
- [ ] Export/import works per customer

---

## Migration Guide

### Breaking Changes

1. **URL Structure Changed:**
   - Before: `http://localhost:3000/proxy/users/123`
   - After: `http://customer1.localhost:3000/users/123`

2. **API Access:**
   - Traffic API: Now on `http://app.localhost:3000/api/traffic?customerId=customer1`
   - Rules API: Now on `http://app.localhost:3000/api/rules?customerId=customer1`
   - Servers API: Now on `http://app.localhost:3000/api/servers`

3. **Multi-Tenant Data:**
   - All existing rules and traffic will be migrated to a default customer
   - New fault servers start with empty rules and traffic

### Migration Script

**File:** `scripts/migrate-to-multitenant.js` (NEW)

```javascript
// Migrate existing single-tenant data to multi-tenant structure
const { createCustomer } = require('../src/storage/multiTenant');
const { getAllRules } = require('../src/rules/rulesEngine');
const { getAllLogs } = require('../src/traffic/trafficLogger');

function migrateToMultiTenant() {
  const DEFAULT_CUSTOMER_ID = 'default';
  
  // Get existing data (Phase 6 global storage)
  const existingRules = getAllRules(); // Old function signature
  const existingTraffic = getAllLogs(); // Old function signature
  
  if (existingRules.length === 0 && existingTraffic.length === 0) {
    console.log('[MIGRATION] No data to migrate');
    return;
  }
  
  // Create default customer
  createCustomer(DEFAULT_CUSTOMER_ID, {
    name: 'Default',
    description: 'Migrated from single-tenant installation'
  });
  
  // Import rules and traffic
  // ... (implementation details)
  
  console.log(`[MIGRATION] Migrated ${existingRules.length} rules and ${existingTraffic.length} traffic logs to '${DEFAULT_CUSTOMER_ID}'`);
}

module.exports = { migrateToMultiTenant };
```

---

## Deployment Considerations

### Environment Variables

```bash
# Development
ROOT_DOMAIN=localhost
PORT=3000

# Production
ROOT_DOMAIN=faultend.com
PORT=3000
```

### DNS Configuration

**Production Setup:**
```bash
# At your DNS provider (e.g., AWS Route 53, Cloudflare)
# Add wildcard A record
*.faultend.com.    IN    A    <YOUR_SERVER_IP>
```

### Docker Support

**Update Dockerfile:**
```dockerfile
# Add ROOT_DOMAIN as build arg
ARG ROOT_DOMAIN=localhost
ENV ROOT_DOMAIN=${ROOT_DOMAIN}
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  Faultend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - ROOT_DOMAIN=faultend.com
      - PORT=3000
    volumes:
      - ./data:/app/data
```

---

## Success Criteria

Phase 6.1 is complete when:

1. ✅ Subdomain routing works for all types (landing, admin, app, fault-server)
2. ✅ Servers API can create/list/delete fault servers
3. ✅ Multi-tenant data isolation works (rules and traffic scoped per customer)
4. ✅ No `/proxy` prefix required - requests to `customer1.localhost:3000/users` work
5. ✅ All existing tests updated and passing
6. ✅ New integration tests for multi-tenancy passing
7. ✅ Landing page displays on root domain
8. ✅ App UI works on `app.*` subdomain
9. ✅ Servers API works on `app.*` subdomain
10. ✅ Documentation updated in README.md and agents.md

---

## Future Enhancements (Beyond Phase 6.1)

1. **Phase 11 Integration:** Persist customer data to files (`data/customers/*/`)
2. **Authentication:** Protect admin API with API keys or OAuth
3. **UI Updates:** Frontend to manage multiple customers from app subdomain
4. **Rate Limiting:** Per-customer rate limits and quotas
5. **Metrics:** Customer usage statistics and billing data
6. **Custom Domains:** Allow customers to use their own domains (CNAME)
7. **WebSocket Support:** Proxy WebSocket connections per customer

---

## Implementation Order

1. ✅ Create utility modules (subdomain detection, multi-tenant storage)
2. ✅ Update rules engine for multi-tenancy
3. ✅ Update traffic logger for multi-tenancy
4. ✅ Create admin API
5. ✅ Create subdomain routing middleware
6. ✅ Update Express server with new routing logic
7. ✅ Update proxy router (remove /proxy prefix)
8. ✅ Update traffic and rules APIs
9. ✅ Create landing page
10. ✅ Update startup initialization
11. ✅ Write unit tests
12. ✅ Update integration tests
13. ✅ Update documentation
14. ✅ Manual testing across all subdomain types

**Start with:** Task 1 (Subdomain Detection) → Task 2 (Multi-Tenant Storage) → Build up from there

---

*Phase 6.1 implementation complete when all tasks are checked and tests pass*
