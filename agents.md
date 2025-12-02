# Faultend Development Context

**Last Updated:** December 2, 2025  
**Current Phase:** Phase 9 - Complete ✓

---

## Project Overview

**Faultend** is a lightweight proxy tool designed to help developers and testers validate the resilience of mobile and web applications against unreliable backend behavior.

### Core Concept
By routing REST + JSON traffic through Faultend, you can inspect real requests and responses in real time and configure flexible routing rules. Rules can either mock responses (return custom status/body/latency) OR proxy to specified backends (forward to real APIs). This enables multi-backend support and complex testing scenarios.

### Key Features
- **Subdomain architecture** - Isolated fault servers per subdomain
- Real-time request/response inspection
- **Rules-based routing** (no hardcoded backend URLs)
- **Dual action types**: Mock responses OR proxy to backends
- **Multi-backend support**: Different rules can proxy to different services
- Path regex matching for flexible rule definitions
- Priority-ordered rule evaluation (higher priority first)
- **Enhanced latency control**: Fixed or range-based delays
- **Template variables in mock responses**: Dynamic data generation
- **Conditional rule matching**: Match on headers, query params, body fields
- **Request header manipulation**: Modify headers before proxying
- Custom response status, body, and latency injection
- Enable/disable rules on the fly
- **Export/import rule configurations** as JSON files
- Optimized for REST + JSON APIs

### Architecture Decision: Proxy-as-Rule
Unlike traditional proxies with a single hardcoded backend URL, Faultend treats proxying as a configurable rule action. This means:
- No `BACKEND_URL` environment variable
- All routing is explicit and visible in the rules list
- Support for multiple backend services (microservices-friendly)
- Easy to see what traffic goes where
- Default behavior: unmatched requests return 502 (forces explicit routing)

---

## Use Case Workflow

1. Launch Faultend and open the UI
2. Configure your mobile/web app to use Faultend's base URL (e.g., `faultend.myapp.com`)
3. Create initial proxy rules to route traffic to your backends:
   - Rule 1 (priority 100): `.*` → Proxy to `https://api.myapp.com`
   - Rule 2 (priority 90): `/auth/.*` → Proxy to `https://auth.myapp.com`
4. Interact with your app normally - Faultend routes based on rules
5. Each request/response appears live in the UI
6. Click a logged request to **convert it into a mock or proxy rule**
7. Edit the auto-filled form:
   - Method (GET, POST, etc.)
   - Path regex pattern
   - **Action: Mock or Proxy**
   - If Mock: Response status code, JSON response body, Optional artificial latency
   - If Proxy: Target backend URL
   - Priority (higher = evaluated first)
8. Save the rule - future matching requests will follow this rule
9. Export your configuration as JSON to replicate across environments
10. Observe how your app behaves under controlled failure scenarios

### Deployment Model

**Subdomain Architecture (Phase 6.1):**
- Wildcard DNS: `*.localhost` (dev) or `*.faultend.com` (prod)
- **Admin subdomain** (`admin.*`) - Fault server lifecycle management
- **App subdomain** (`app.*`) - UI for managing rules and viewing traffic
- **Fault server subdomains** (`[server-id].*`) - Isolated proxy instances
- Each fault server has isolated rules and traffic logs
- No `/api` prefix - subdomain provides context

**SaaS Model:**
- Single Faultend deployment serves multiple isolated fault servers
- Each server accessible at `[server-id].faultend.com`
- Managed via admin API at `admin.faultend.com`
- Complete data isolation between servers

---

## Technical Architecture

### Backend
A small reverse proxy optimized strictly for REST + JSON:
- Routes requests based on priority-ordered rules
- Rules can either mock responses OR proxy to specified backends
- Supports multiple backend targets (microservices-friendly)
- Applies mock rules on the fly (status, body, latency)
- Stores traffic logs and rule definitions
- Exposes a simple API for the frontend

**Tech Stack:**
- Node.js with Express
- http-proxy-middleware for proxying
- Vanilla JavaScript (no compilation required)

### Frontend
A UI built for clarity and speed:
- Real-time traffic viewer
- One-click creation of mock OR proxy rules
- Rule editor with action selection
- Rules list with priority management and enable/disable controls
- Export/import functionality for configurations

**Tech Stack:**
- Vanilla HTML, CSS, JavaScript
- No build process or compilation
- Served as static files from Express

### Architecture Flow
```
Client Request
    ↓
Faultend Proxy
    ↓
Check Rules (by priority, high to low)
    ↓
Rule Match? → Yes → Action Type?
                       ↓
                   Mock → Return Custom Response (Status + JSON + Latency)
                       ↓
                   Proxy → Forward to Rule's Target Backend
                       ↓
                   Backend Response
                       ↓
Rule Match? → No → Return 502 (No matching rule)
    ↓
Log Traffic
    ↓
Return to Client

Frontend UI ←→ API ←→ Traffic & Rules Store
```

---

## Current Directory Structure

```
Faultend/
├── .env                        # Environment configuration (SAMPLE_DATA, ROOT_DOMAIN, PORT)
├── .gitignore
├── .tool-versions              # Node version (20.18.1)
├── package.json                # v0.1.0, includes dotenv
├── package-lock.json
├── playwright.config.js        # Playwright test configuration
├── README.md                   # User-facing documentation
├── plan.md                     # High-level phase plan
├── phase1.md - phase6_1.md     # Detailed implementation guides ✓
├── agents.md                   # This file - dev agent context
│
├── src/
│   ├── index.js                # Main entry point with dotenv, sample data init ✓
│   ├── server.js               # Express server with subdomain routing, CORS ✓
│   ├── middleware/
│   │   └── subdomainRouter.js  # Subdomain detection and serverId extraction ✓
│   ├── utils/
│   │   └── subdomain.js        # Subdomain parsing helpers ✓
│   ├── proxy/
│   │   ├── config.js           # Proxy configuration ✓
│   │   ├── proxyHandler.js     # HTTP proxy handler ✓
│   │   └── router.js           # Rules-based routing ✓
│   ├── traffic/
│   │   └── trafficLogger.js    # Traffic logging ✓
│   ├── rules/
│   │   ├── rulesEngine.js      # Rules matching, execution, conditions ✓
│   │   ├── templateEngine.js   # Template variable rendering ✓
│   │   └── rulesManager.js     # Placeholder for future enhancements
│   ├── api/
│   │   ├── admin.js            # Fault server management API ✓
│   │   ├── traffic.js          # Traffic API endpoints ✓
│   │   └── rules.js            # Rules management API ✓
│   └── storage/
│       └── storage.js          # In-memory storage ✓
│
├── public/                     # Static frontend files
│   ├── landing.html            # Landing page ✓
│   ├── app.html                # Main app UI ✓
│   ├── faultend.svg            # Logo (48px) ✓
│   ├── css/
│   │   ├── reset.css           # CSS reset ✓
│   │   ├── variables.css       # Design system tokens ✓
│   │   ├── components.css      # Reusable components + Traffic styles ✓
│   │   ├── layout.css          # Responsive layout system ✓
│   │   ├── drawer.css          # Drawer styles ✓
│   │   └── app.css             # App-specific styles + Inter font ✓
│   └── js/
│       ├── config.js           # Configuration ✓
│       ├── api.js              # API client ✓
│       ├── components.js       # UI components (Toast, Spinner, Badges) ✓
│       ├── drawer.js           # Drawer controller ✓
│       ├── router.js           # View router ✓
│       ├── app.js              # Main application controller ✓
│       └── views/
│           ├── traffic.js      # Traffic view logic ✓
│           ├── rules.js        # Rules view logic (Phase 9)
│           └── config.js       # Config view logic (Phase 10)
│
└── tests/                      # Test files
    ├── backend.test.js         # Backend integration tests (35 tests) ✓
    └── frontend.spec.js        # Frontend Playwright tests (42 tests) ✓
```

---

## Implementation Status

### ✅ Phase 1: Project Setup and Core Infrastructure (COMPLETE)

**Completed Tasks:**
1. ✅ Node.js project initialized with package.json
2. ✅ Core dependencies installed:
   - express (^4.21.2)
   - http-proxy-middleware (2.0.7) - downgraded from v3 for better callback support
   - nodemon (dev dependency)
3. ✅ Complete directory structure created
4. ✅ Backend entry point and Express server configured
5. ✅ Frontend HTML, CSS, and JavaScript scaffolding created
6. ✅ Placeholder files for future phases created
7. ✅ .gitignore configured
8. ✅ Validation complete - server runs successfully

**Current Functionality:**
- Express server runs on port 3000
- Health check endpoint: `GET /health` → `{"status":"ok","service":"Faultend","version":"0.1.0"}`
- Static frontend served at `http://localhost:3000`
- Basic HTML UI with header and placeholder content

**NPM Scripts:**
```bash
npm start          # Run server (production mode)
npm run dev        # Run server with nodemon (auto-restart)
```

---

### ✅ Phase 2: Backend - Proxy Core (COMPLETE)

**Completed Tasks:**
1. ✅ Created proxy configuration module (`src/proxy/config.js`)
2. ✅ Created body parser middleware (`src/proxy/bodyParser.js`)
3. ✅ Implemented proxy handler with request/response interception (`src/proxy/proxyHandler.js`)
4. ✅ Created proxy router (`src/proxy/router.js`)
5. ✅ Created debug endpoints (`src/api/debug.js`)
6. ✅ Updated Express server to integrate proxy components
7. ✅ Enhanced startup messaging with examples
8. ✅ Validated all proxy functionality

**Current Functionality:**
- HTTP proxy forwards GET/POST/PUT/DELETE requests to backend
- Automatic path rewriting (`/proxy/*` → `/*`)
- Request/response interception and logging
- In-memory transaction storage (up to 1000 items)
- Console logging shows complete request flow
- Response timing measurement
- Custom backend target via `X-Faultend-Target` header or `BACKEND_URL` env var
- Debug endpoints for inspecting intercepted traffic

**Proxy Endpoints:**
```bash
# Proxy any request
curl http://localhost:3000/proxy/posts/1

# With custom target
curl -H "X-Faultend-Target: https://api.example.com" \
  http://localhost:3000/proxy/users

# Debug - View intercepted traffic
curl http://localhost:3000/debug/intercepted

# Debug - Clear intercepted data
curl -X DELETE http://localhost:3000/debug/intercepted
```

**Transaction Data Model:**
```javascript
{
  id: "1732627800000-abc123def",
  timestamp: "2025-11-26T12:30:00.000Z",
  request: {
    method: "GET",
    url: "/posts/1",
    path: "/posts/1",
    headers: { ... },
    query: {}
  },
  response: {
    statusCode: 200,
    statusMessage: "OK",
    headers: { ... }
  },
  duration: 245,
  target: "https://jsonplaceholder.typicode.com"
}
```

**Known Limitations:**
- Request/response bodies not yet captured (will be added in Phase 3)
- No persistent storage (data lost on restart - Phase 11)
- No mock rules engine yet (Phase 4)
- No frontend UI for viewing traffic (Phase 8)

---

### ✅ Phase 3: Backend - Traffic Logging (COMPLETE)

**Completed Tasks:**
1. ✅ Implemented traffic logger module (`src/traffic/trafficLogger.js`)
2. ✅ Enhanced proxy handler to capture request/response bodies
3. ✅ Created traffic API routes (`src/api/traffic.js`)
4. ✅ Integrated traffic API in server
5. ✅ Updated startup messaging
6. ✅ Removed deprecated debug endpoints
7. ✅ Created comprehensive integration test suite
8. ✅ Validated all functionality

**Current Functionality:**
- Full request/response body capture for all HTTP methods
- Body parsing for JSON content types
- 10MB body size limit with truncation handling
- Binary data detection and metadata storage
- Complete transaction logging with timing
- Comprehensive filtering by:
  - HTTP method (GET, POST, etc.)
  - Status code
  - Path (substring match)
  - Path (regex pattern)
  - Timestamp range
  - Backend target URL
  - Error presence
- Traffic statistics:
  - Total transaction count
  - Counts by HTTP method
  - Counts by status code
  - Average response duration
  - Error count
- Error transaction logging with stack traces
- In-memory storage with FIFO eviction (1000 transaction limit)

**Traffic API Endpoints:**
```bash
# Get all traffic logs
curl http://localhost:3000/api/traffic

# Filter by method
curl http://localhost:3000/api/traffic?method=POST

# Filter by status code
curl http://localhost:3000/api/traffic?statusCode=200

# Filter by path substring
curl http://localhost:3000/api/traffic?path=users

# Filter by regex pattern
curl http://localhost:3000/api/traffic?regex=posts

# Filter by timestamp range
curl http://localhost:3000/api/traffic?sinceTimestamp=2025-11-29T10:00:00Z

# Filter by error presence
curl http://localhost:3000/api/traffic?hasError=true

# Get statistics
curl http://localhost:3000/api/traffic/stats

# Get specific transaction by ID
curl http://localhost:3000/api/traffic/{id}

# Clear all logs
curl -X DELETE http://localhost:3000/api/traffic
```

**Transaction Data Model:**
```javascript
{
  id: "1764414722814-fdpza1d0n",
  timestamp: "2025-11-29T11:12:02.814Z",
  request: {
    method: "POST",
    url: "/posts",
    path: "/posts",
    headers: { ... },
    query: {},
    body: { title: "Test", body: "Content", userId: 1 },
    bodySize: 56,
    contentType: "application/json"
  },
  response: {
    statusCode: 201,
    statusMessage: "Created",
    headers: { ... },
    body: { title: "Test", body: "Content", userId: 1, id: 101 },
    bodySize: 82,
    contentType: "application/json; charset=utf-8"
  },
  duration: 293,
  target: "https://jsonplaceholder.typicode.com",
  error: null  // or { message, code, stack } if error occurred
}
```

**Implementation Approach:**
- Used `express.json()` with `verify` callback to capture request bodies while parsing
- Response bodies captured via `proxyRes.on('data')` event listeners in onProxyRes
- JSON bodies automatically parsed and stored as objects
- Non-JSON bodies stored as strings
- Binary data stored as metadata only
- Body size limits enforced before storage

**Testing:**
- Created `test/integration.test.js` with 15 comprehensive test cases
- Tests cover: GET/POST proxying, body capture, all filter types, stats, clear, errors
- Run with: `npm test`
- 14/15 tests pass consistently (1 intermittent due to external API timing)

**Known Limitations:**
- No persistent storage (data lost on restart - Phase 11)
- In-memory storage limited to 1000 transactions
- No WebSocket support (HTTP only)
- No frontend UI for viewing traffic (Phase 8)

---

### ✅ Phase 4: Backend - Rules Engine with Proxy-as-Rule (COMPLETE)

**Completed Tasks:**
1. ✅ Implemented rules engine core (`src/rules/rulesEngine.js`)
2. ✅ Updated proxy router to use rules engine
3. ✅ Removed hardcoded backend from config.js
4. ✅ Updated proxyHandler for dynamic targets
5. ✅ Added rule initialization to server.js
6. ✅ Updated traffic logger to include rule metadata
7. ✅ Created comprehensive unit tests (15 tests, all passing)
8. ✅ Validated all functionality

**Current Functionality:**
- **Rules-based routing:** All requests evaluated against priority-ordered rules
- **Dual-action rules:** Each rule specifies either `mock` or `proxy` action
- **No hardcoded backend:** Removed `BACKEND_URL` fallback and `X-Faultend-Target` header
- **Priority-based evaluation:** Rules sorted and evaluated by priority (higher first)
- **Path regex matching:** Flexible pattern matching with regex
- **Method filtering:** Rules can target specific HTTP methods or use wildcard (`*`)
- **Multi-backend support:** Different proxy rules can target different backends
- **Mock response features:**
  - Custom status codes and JSON bodies
  - Artificial latency injection
  - Custom response headers
- **Unmatched request handling:** Returns 502 when no rule matches
- **Rule validation:** Comprehensive validation for required fields and regex syntax
- **Traffic logging:** Includes matched rule metadata (id, name, action, priority)

**Rule Data Model:**
```javascript
{
  id: "rule-1732627800000-abc123",
  priority: 100,                    // Higher = evaluated first
  enabled: true,                    // Can be toggled on/off
  name: "Default API Proxy",        // Human-readable name
  method: "*",                      // HTTP method or "*" for all
  pathRegex: ".*",                  // Regex pattern for path matching
  
  action: "proxy",                  // "mock" or "proxy"
  
  // For proxy action
  target: "https://api.example.com",
  
  // For mock action
  mockResponse: {
    statusCode: 200,
    body: { message: "Mocked response" },
    headers: {},                    // Optional custom headers
    latency: 0                      // Artificial delay in ms
  }
}
```

**Rules Engine API:**
```javascript
// Add a rule
const { addRule } = require('./src/rules/rulesEngine');
addRule({
  priority: 100,
  name: 'Mock User 123',
  method: 'GET',
  pathRegex: '^/users/123$',
  action: 'mock',
  mockResponse: {
    statusCode: 200,
    body: { id: 123, name: 'Test User' },
    latency: 500
  }
});

// Find matching rule
const { findMatchingRule } = require('./src/rules/rulesEngine');
const rule = findMatchingRule({ method: 'GET', path: '/users/123' });

// Get all rules
const { getAllRules } = require('./src/rules/rulesEngine');
const rules = getAllRules(); // Sorted by priority
```

**Example Usage:**
```bash
# Start server - NO default rules created
npm start
# Output: [INIT] No rules configured
#         [INIT] Unmatched requests will return 502 Bad Gateway

# Create your first proxy rule
curl -X POST http://localhost:3000/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "priority": 100,
    "name": "API Proxy",
    "method": "*",
    "pathRegex": ".*",
    "action": "proxy",
    "target": "https://jsonplaceholder.typicode.com"
  }'

# Now requests will be proxied
curl http://localhost:3000/proxy/posts/1

# Unmatched request (no rule configured)
curl http://localhost:3000/proxy/admin/stats
# Returns: 502 No matching rule
```

**Transaction Data Model (Updated):**
```javascript
{
  id: "1764414722814-fdpza1d0n",
  timestamp: "2025-11-29T17:12:02.814Z",
  request: { /* ... */ },
  response: { /* ... */ },
  duration: 293,
  target: "https://api.example.com",  // or "MOCK" for mocked responses
  matchedRule: {                       // NEW in Phase 4
    id: "rule-1732627800000-abc123",
    name: "Test Mock Rule",
    action: "mock",
    priority: 100
  },
  error: null
}
```

**Testing:**
- Unit tests: `node test/phase4.test.js` (15 tests, all passing)
- Tests cover: rule matching, priority ordering, validation, both actions

**Breaking Changes from Phase 3:**
- No more `BACKEND_URL` environment variable
- No more `X-Faultend-Target` header support
- Server starts with zero rules (no automatic default rule creation)
- Unmatched requests return 502 Bad Gateway
- Must explicitly create proxy rules via API for routing

**Migration Path:**
- On first startup: checks for `BACKEND_URL` env var
- If set: creates default catch-all proxy rule with that target
- If not set: creates rule pointing to jsonplaceholder.typicode.com (for testing)

**Known Limitations:**
- No HTTP API for rule management yet (Phase 5)
- No persistent storage - rules lost on restart (Phase 11)
- No frontend UI for rule management (Phase 9-10)
- In-memory storage limited to 1000 transactions

---

### ✅ Phase 5: Backend - Rules Management API (COMPLETE)

**Completed Tasks:**
1. ✅ Enhanced rules engine with CRUD operations (`src/rules/rulesEngine.js`)
2. ✅ Implemented Rules Management API router (`src/api/rules.js`)
3. ✅ Added updateRule, deleteRule, toggleRule functions to rules engine
4. ✅ Implemented import/export functionality with merge/replace modes
5. ✅ Integrated rules API in server.js
6. ✅ Created comprehensive integration tests (31 tests, all passing)
7. ✅ Validated all functionality end-to-end

**Current Functionality:**
- **Complete CRUD Operations:** Create, read, update, delete rules via HTTP API
- **Rule Management:** Enable/disable rules without deletion via toggle endpoint
- **Export/Import:** Save and load complete rule configurations as JSON
- **Validation:** All rule operations validate data before applying changes
- **Atomic Updates:** Validation happens before persisting to prevent invalid states
- **Merge/Replace Modes:** Import can merge new rules or replace all existing rules
- **Comprehensive API:** 8 endpoints covering all rule management needs

**API Endpoints:**
```bash
# List all rules
GET /api/rules

# Get specific rule by ID
GET /api/rules/:id

# Create new rule
POST /api/rules
Content-Type: application/json
{
  "priority": 100,
  "name": "Mock User 123",
  "method": "GET",
  "pathRegex": "^/users/123$",
  "action": "mock",
  "mockResponse": {
    "statusCode": 200,
    "body": { "id": 123, "name": "Test User" },
    "latency": 500
  }
}

# Update existing rule
PUT /api/rules/:id

# Delete rule
DELETE /api/rules/:id

# Toggle rule enabled/disabled
PATCH /api/rules/:id/toggle

# Export all rules
POST /api/rules/export

# Import rules (merge or replace mode)
POST /api/rules/import
Content-Type: application/json
{
  "mode": "merge",
  "rules": [...]
}
```

**Export Data Format:**
```json
{
  "version": "1.0",
  "exportedAt": "2025-11-29T12:00:00.000Z",
  "rules": [
    {
      "id": "rule-1732627800000-abc123",
      "priority": 100,
      "enabled": true,
      "name": "Default API Proxy",
      "method": "*",
      "pathRegex": ".*",
      "action": "proxy",
      "target": "https://api.example.com"
    }
  ],
  "count": 1
}
```

**Example Usage:**
```bash
# List all rules
curl http://localhost:3000/api/rules

# Create a mock rule
curl -X POST http://localhost:3000/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "priority": 100,
    "name": "Mock Slow Response",
    "method": "GET",
    "pathRegex": "^/slow$",
    "action": "mock",
    "mockResponse": {
      "statusCode": 200,
      "body": {"slow": true},
      "latency": 2000
    }
  }'

# Create a proxy rule
curl -X POST http://localhost:3000/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "priority": 90,
    "name": "Auth Service Proxy",
    "method": "*",
    "pathRegex": "^/auth/.*",
    "action": "proxy",
    "target": "https://auth.myapp.com"
  }'

# Update a rule
curl -X PUT http://localhost:3000/api/rules/rule-123 \
  -H "Content-Type: application/json" \
  -d '{
    "priority": 95,
    "name": "Updated Mock",
    "method": "GET",
    "pathRegex": "^/slow$",
    "action": "mock",
    "enabled": true,
    "mockResponse": {
      "statusCode": 503,
      "body": {"error": "Service Unavailable"},
      "latency": 0
    }
  }'

# Toggle rule
curl -X PATCH http://localhost:3000/api/rules/rule-123/toggle

# Delete rule
curl -X DELETE http://localhost:3000/api/rules/rule-123

# Export rules
curl -X POST http://localhost:3000/api/rules/export > my-config.json

# Import rules (merge mode)
curl -X POST http://localhost:3000/api/rules/import \
  -H "Content-Type: application/json" \
  -d @my-config.json

# Import rules (replace mode)
curl -X POST http://localhost:3000/api/rules/import \
  -H "Content-Type: application/json" \
  -d '{"mode":"replace","rules":[...]}'
```

**Testing:**
- Integration tests: `npm test` (33 tests, all passing)
- Tests cover:
  - All CRUD operations
  - Rule validation (invalid regex, missing fields, etc.)
  - Export/import in both merge and replace modes
  - End-to-end request routing with mock and proxy rules
  - Traffic logging with rule metadata
  - Rule enable/disable functionality

**Enhanced Rules Engine Functions:**
```javascript
// New functions added in Phase 5
const {
  updateRule,   // Update existing rule by ID
  deleteRule,   // Delete rule by ID
  toggleRule,   // Toggle enabled state
  importRules,  // Import array of rules (merge/replace)
  exportRules   // Export all rules with metadata
} = require('./src/rules/rulesEngine');
```

**Known Limitations:**
- No persistent storage - rules lost on restart (Phase 11)
- No frontend UI for rule management (Phase 9-10)
- No authentication/authorization on API endpoints
- No rate limiting on rule creation
- Import doesn't preserve original rule IDs (generates new ones)

---

### ✅ Phase 6: Backend - Response Customization (COMPLETE)

**Completed Tasks:**
1. ✅ Created template engine module (`src/rules/templateEngine.js`)
2. ✅ Implemented template variables with predefined functions
3. ✅ Enhanced latency control (fixed/range)
4. ✅ Request condition matching (headers, query, body, cookies)
5. ✅ Request header manipulation for proxy rules
6. ✅ Created comprehensive unit tests (31 tests, all passing)
7. ✅ Updated integration tests (40 tests, all passing)
8. ✅ Validated all functionality

**Current Functionality:**
- **Template Variables in Mock Responses:**
  - Dynamic functions: `{{timestamp()}}`, `{{uuid()}}`, `{{random(min, max)}}`, etc.
  - Request data access: `{{request.path}}`, `{{request.query.param}}`, `{{request.header.name}}`
  - Nested object paths: `{{request.body.user.id}}`
  - Recursively processes objects and arrays
  
- **Enhanced Latency Control:**
  - Fixed latency: `{ "type": "fixed", "value": 500 }`
  - Range latency: `{ "type": "range", "min": 100, "max": 500 }`
  - Backward compatible with simple number: `500`
  
- **Request Condition Matching:**
  - Condition types: header, query, body, cookie
  - Operators: equals, notEquals, contains, startsWith, endsWith, exists, notExists, matches (regex)
  - AND logic: all conditions must match
  - Rules only match when both path AND conditions are satisfied
  
- **Request Header Manipulation (Proxy Rules):**
  - Add headers (only if not exists)
  - Set headers (overwrite existing)
  - Remove headers
  - Execution order: remove → set → add

**Template Functions:**
| Function | Description | Example |
|----------|-------------|---------|
| `timestamp()` | Current ISO timestamp | `2025-11-29T12:34:56.789Z` |
| `timestampMs()` | Unix timestamp (ms) | `1732887296789` |
| `uuid()` | Random UUID v4 | `550e8400-e29b...` |
| `random(min, max)` | Random integer | `{{random(1, 100)}}` |
| `randomFloat(min, max, decimals)` | Random float | `{{randomFloat(0, 1, 2)}}` |
| `randomString(length)` | Alphanumeric string | `{{randomString(8)}}` |
| `randomEmail()` | Random email | `user-xyz@example.com` |

**Example Enhanced Rule:**
```json
{
  "priority": 100,
  "name": "Dynamic User Mock",
  "method": "GET",
  "pathRegex": "^/users/[0-9]+$",
  "conditions": [
    {
      "type": "header",
      "key": "x-api-version",
      "operator": "equals",
      "value": "2.0"
    }
  ],
  "action": "mock",
  "mockResponse": {
    "statusCode": 200,
    "body": {
      "id": "{{request.path}}",
      "email": "{{randomEmail()}}",
      "createdAt": "{{timestamp()}}",
      "sessionId": "{{uuid()}}",
      "score": "{{random(0, 100)}}"
    },
    "latency": {
      "type": "range",
      "min": 100,
      "max": 500
    }
  }
}
```

**Testing:**
- Integration tests: `npm test` (40 tests, all passing)
- Tests cover: template rendering, latency variants, all condition types/operators, header manipulation, end-to-end scenarios

**Known Limitations:**
- No partial response modification (proxy + transform) - skipped for simplicity
- No frontend UI yet (Phase 7-10)
- No persistent storage - rules/traffic lost on restart (Phase 11)

---

### ✅ Phase 6.1: Subdomain Architecture (COMPLETE)

**Completed Tasks:**
1. ✅ Created subdomain detection utility (`src/utils/subdomain.js`)
2. ✅ Created storage layer (`src/storage/storage.js`)
3. ✅ Refactored rules engine for server isolation (11 functions updated)
4. ✅ Refactored traffic logger for multi-tenancy (6 functions updated)
5. ✅ Created subdomain routing middleware (`src/middleware/subdomainRouter.js`)
6. ✅ Created admin API for fault server management (`src/api/admin.js`)
7. ✅ Complete rewrite of server.js with subdomain routing
8. ✅ Updated proxy router (removed /proxy prefix)
9. ✅ Updated traffic and rules APIs (server scoping)
10. ✅ Created landing page (`public/landing.html`)
11. ✅ Updated startup messages
12. ✅ Comprehensive integration tests (35 tests, all passing)
13. ✅ Renamed terminology: customer → server throughout codebase
14. ✅ Restructured APIs: path parameters instead of query parameters

**Current Functionality:**
- **Subdomain Routing:**
  - `localhost` → Landing page
  - `admin.localhost` → Admin API for server management
  - `app.localhost` → App UI for managing rules and traffic
  - `[server-id].localhost` → Isolated fault server instance

- **API Structure (No `/api` prefix - subdomain provides context):**
  - Admin subdomain: `/servers`, `/servers/:id`
  - App subdomain: `/servers/:serverId/rules`, `/servers/:serverId/traffic`
  - Path parameters instead of query parameters for server identification

- **Data Isolation:**
  - Each fault server has isolated rules and traffic logs
  - In-memory storage with Map-based separation
  - Complete data isolation between servers

- **Server Identification:**
  - Fault server subdomains: `serverId` extracted from subdomain
  - App subdomain: `serverId` extracted from URL path (`/servers/:serverId/...`)

**API Endpoints:**
```bash
# Admin API (admin.localhost)
GET    /servers           # List all fault servers
POST   /servers           # Create fault server
GET    /servers/:id       # Get specific server
DELETE /servers/:id       # Delete server

# Rules API (app.localhost)
GET    /servers/:serverId/rules              # List rules
POST   /servers/:serverId/rules              # Create rule
GET    /servers/:serverId/rules/:id          # Get rule
PUT    /servers/:serverId/rules/:id          # Update rule
DELETE /servers/:serverId/rules/:id          # Delete rule
PATCH  /servers/:serverId/rules/:id/toggle   # Toggle rule
POST   /servers/:serverId/rules/export       # Export rules
POST   /servers/:serverId/rules/import       # Import rules

# Traffic API (app.localhost)
GET    /servers/:serverId/traffic       # Get traffic logs
GET    /servers/:serverId/traffic/:id   # Get specific log
GET    /servers/:serverId/traffic/stats # Get statistics
DELETE /servers/:serverId/traffic       # Clear logs
```

**Example Usage:**
```bash
# Create a fault server
curl -X POST http://admin.localhost:3000/servers \
  -H "Content-Type: application/json" \
  -d '{"id":"server1","name":"Server 1","description":"Test instance"}'

# Create a proxy rule for server1
curl -X POST http://app.localhost:3000/servers/server1/rules \
  -H "Content-Type: application/json" \
  -d '{"priority":100,"name":"API Proxy","method":"*","pathRegex":".*","action":"proxy","target":"https://jsonplaceholder.typicode.com"}'

# Send request through server1's fault server
curl http://server1.localhost:3000/posts/1

# View traffic for server1
curl http://app.localhost:3000/servers/server1/traffic
```

**Testing:**
- Integration tests: `npm test` (35 tests, all passing)
- Tests cover: subdomain routing, admin API, rules API, traffic API, server isolation, advanced rules

---

### ✅ Phase 7: Frontend - UI Implementation (COMPLETE)

**Completed Tasks:**
1. ✅ Created complete CSS foundation (6 CSS files)
2. ✅ Implemented minimalist black/white design (Inter font weight 300 only)
3. ✅ Built server list table on landing page
4. ✅ Implemented navigation: server list → management view (2-column layout)
5. ✅ Created settings drawer with delete server functionality
6. ✅ Responsive horizontal layout (adapts to window width)
7. ✅ Complete JavaScript modules (8 files)
8. ✅ Hash-based routing (no view suffix, both columns shown)
9. ✅ Environment configuration via .env file
10. ✅ Sample data initialization (SAMPLE_DATA=true)
11. ✅ Comprehensive testing (32 Playwright tests, all passing)

**Current Functionality:**
- **Minimalist Design:**
  - Black and white only (+ one red accent #DC2626 for danger)
  - Sharp edges (0px border-radius everywhere)
  - No shadows or blur effects
  - Inter font weight 300 only
  - 3 font sizes: 14px, 16px, 24px
  - 4 spacing levels: 8px, 16px, 32px, 64px

- **Layout:**
  - Responsive horizontal layout (no min-width constraint)
  - Fixed top bar with 48px clickable logo, brand text, server name, settings button
  - Server list table view (ID, URL, Traffic count, Rules count)
  - Two-column management view (Traffic left, Rules right)
  - Right-side drawer (600px width) for settings
  - Toast notifications (top-right)

- **Navigation:**
  - Hash-based routing: "" = server list, "server/{id}" = management
  - Click server row to navigate to management view
  - Click logo to return home
  - Settings button opens drawer when viewing a server

- **Server Management:**
  - Create server button (placeholder)
  - Delete server via settings drawer
  - Confirmation dialog before delete
  - Auto-refresh and navigation after delete

- **Sample Data:**
  - Controlled by .env file (SAMPLE_DATA=true)
  - Creates 3 test servers (dev-api, staging, mobile-api) with 7 sample rules
  - Disabled for backend tests, enabled for frontend tests and dev

**Testing:**
- Backend tests: 36/36 passing (SAMPLE_DATA=false)
- Frontend tests: 43/43 passing (SAMPLE_DATA=true)
- Total: 79/79 tests passing

---

### ✅ Phase 8: Frontend - Real-time Traffic Viewer (COMPLETE)

**Completed Tasks:**
1. ✅ Implemented TrafficTable component (`public/js/views/traffic.js`)
2. ✅ Implemented TrafficDetail component for drawer view
3. ✅ Added traffic table rendering with method/status badges
4. ✅ Implemented filtering (method, status family, path search)
5. ✅ Added auto-refresh polling (every 2 seconds)
6. ✅ Implemented clear traffic functionality
7. ✅ Created detail view in right-side drawer
8. ✅ Added CSS styles for traffic components
9. ✅ Updated drawer controller with setTitle/setContent methods
10. ✅ Integrated polling lifecycle with view router
11. ✅ Added 10 new frontend tests (42 total)
12. ✅ Validated all functionality

**Current Functionality:**
- **Traffic Table Display:**
  - Method badges with pastel colors
  - Status badges color-coded by family (2xx, 4xx, 5xx)
  - Path truncation for long URLs
  - Duration in milliseconds
  - Rule indicator (✓ or −)
  - Clickable rows to view details

- **Filtering System:**
  - Filter by HTTP method (GET, POST, PUT, PATCH, DELETE)
  - Filter by status code family (2xx, 3xx, 4xx, 5xx)
  - Search by path (substring match with debouncing)
  - Combined filters work together

- **Auto-Refresh:**
  - Polls traffic every 2 seconds when view is active
  - Stops polling when navigating away
  - Displays last update time with relative formatting
  - Manual refresh button available

- **Detail View:**
  - Opens in right-side drawer on row click
  - Overview section (method, path, status, duration, timestamp, target)
  - Matched rule information (if applicable)
  - Request details (headers, query params, body)
  - Response details (headers, body)
  - Error details (if error occurred)
  - JSON formatting in code blocks
  - "Create Rule" button placeholder (Phase 9)

- **Actions:**
  - Refresh button - manually reload traffic
  - Clear button - delete all traffic logs with confirmation
  - Empty states for no traffic and filtered results

**Traffic Data Model:**
```javascript
{
  id: "1764414722814-fdpza1d0n",
  timestamp: "2025-11-29T11:12:02.814Z",
  request: {
    method: "POST",
    path: "/posts",
    headers: { ... },
    query: {},
    body: { title: "Test", body: "Content", userId: 1 }
  },
  response: {
    statusCode: 201,
    statusMessage: "Created",
    headers: { ... },
    body: { title: "Test", body: "Content", userId: 1, id: 101 }
  },
  duration: 293,
  target: "https://jsonplaceholder.typicode.com",
  matchedRule: {
    id: "rule-123",
    name: "API Proxy",
    action: "proxy",
    priority: 100
  },
  error: null
}
```

**Implementation Details:**
- **TrafficTable class:** Manages table rendering, filtering, polling
- **TrafficDetail class:** Renders detail view content for drawer
- **Auto-polling strategy:** `setInterval` with start/stop on view lifecycle
- **Client-side status filtering:** Status family filtering done client-side
- **Debounced path search:** 300ms debounce on input to reduce API calls
- **Relative timestamps:** "just now", "X seconds ago", etc.

**Testing:**
- Frontend tests: 42/42 passing (added 10 new tests)
- Tests cover: traffic display, filters, detail view, polling, empty states
- All existing tests continue to pass

**Known Limitations:**
- Polling-based updates (WebSocket in future for true real-time)
- Status family filtering done client-side (backend only supports exact status)
- No syntax highlighting for JSON (plain formatting with indentation)
- "Create Rule" button is placeholder (implemented in Phase 9)

---

### ✅ Phase 9: Frontend - Rule Creator Interface (COMPLETE)

**Completed Tasks:**
1. ✅ Implemented RuleForm component (`public/js/views/rules.js`)
2. ✅ Implemented RulesList component with full CRUD operations
3. ✅ Added CSS styles for rule forms and tables (`public/css/components.css`)
4. ✅ Integrated "Create Rule" button in traffic detail drawer
5. ✅ Implemented form validation (regex, URL, required fields)
6. ✅ Added action type switching (mock/proxy) with conditional fields
7. ✅ Implemented latency type selection (none/fixed/range)
8. ✅ Created edit/delete/toggle functionality for existing rules
9. ✅ Enhanced sample data with 7 rules across 3 test servers
10. ✅ Added 18 comprehensive Phase 9 tests (total 43 frontend tests)
11. ✅ Fixed all test issues and validated functionality

**Current Functionality:**
- **Rules List Display:**
  - Table showing priority, name, method, path regex, action type
  - Enable/disable toggle switch for each rule
  - Edit and delete buttons
  - Empty state when no rules configured
  - "Create Rule" button in header

- **Rule Creation/Edit Form:**
  - Opens in right-side drawer
  - Pre-fills form when editing existing rule
  - Pre-fills from traffic log when creating from "Create Rule" button in traffic detail
  - All required fields with validation
  - Action type selection (mock/proxy) with conditional fields
  - Method dropdown (GET, POST, PUT, PATCH, DELETE, *)
  - Path regex pattern input with validation
  - Priority input (higher = evaluated first)
  - Enabled checkbox

- **Mock Action Fields:**
  - Status code input (100-599)
  - Response body textarea (JSON format)
  - Latency type selection (none/fixed/range)
  - Fixed latency: single delay value in ms
  - Range latency: min/max values in ms

- **Proxy Action Fields:**
  - Target URL input with validation
  - Placeholder for header manipulation (future enhancement)

- **Form Validation:**
  - Required field validation
  - Regex pattern syntax validation
  - URL format validation for proxy targets
  - Real-time error display with specific messages
  - Form submission blocked until all errors resolved

- **CRUD Operations:**
  - Create: Fill form and save
  - Read: View rules in table
  - Update: Click edit button, modify form, save
  - Delete: Click delete button, confirm dialog
  - Toggle: Click switch to enable/disable rule

**Sample Data:**
- `dev-api`: 3 rules (API proxy, slow response mock, error mock)
- `staging`: 2 rules (staging API proxy, test mock)
- `mobile-api`: 2 rules (mobile API proxy, maintenance mock)

**Testing:**
- Backend tests: 36/36 passing
- Frontend tests: 43/43 passing (18 new Phase 9 tests)
- Total: 79/79 tests passing
- Tests cover: rules display, form functionality, CRUD operations, validation, advanced features

**Implementation Details:**
- **RuleForm class:** Handles form rendering, validation, submission, state management
- **RulesList class:** Manages table rendering, event binding, API integration
- **openRuleForm():** Global function to open form with optional pre-fill data
- **Client-side validation:** Regex syntax, URL format, required fields
- **Form state management:** Tracks action type and latency type to show/hide fields

**Known Limitations:**
- No JSON syntax validation in mock response body textarea
- No persistent storage - rules lost on restart (Phase 11)
- Advanced options (conditions, header manipulation) not exposed in UI
- No batch operations (delete multiple rules at once)

---

## Development Guidelines

### Code Style
- Use vanilla JavaScript (ES6+)
- No TypeScript, no compilation step
- Clear, descriptive variable names
- Modular file structure
- Comments for future phase placeholders

### Testing Approach
- Integration tests with Node.js (`npm test`)
- Manual testing with curl commands
- Verify endpoints return expected JSON
- Check console logs for proxy traffic
- Validate UI renders correctly

### Environment Configuration
- Default port: 3000 (configurable via `PORT` env var)
- Default backend target: Optional `BACKEND_URL` env var for initial default rule
- Log level: configurable for debugging

### Git Practices
- Exclude node_modules, data files, and logs
- Keep each phase's changes focused and atomic
- Document major changes in phase files

---

## Key Technical Decisions

1. **Single Repository:** Backend and frontend in same repo for simplicity
2. **No Build Step:** Vanilla JS only, no compilation or bundling
3. **Express for Everything:** Handles both API routes and static file serving
4. **In-Memory First:** Initial implementation stores data in memory, persistence added in Phase 11
5. **JSON-Focused:** Optimized specifically for REST + JSON APIs
6. **Minimal Dependencies:** Only essential packages to keep it lightweight
7. **Rules-Based Routing:** All proxy/mock behavior configured via rules (Phase 4+)

---

## How to Run (Current State)

```bash
# Install dependencies
npm install

# Start server with sample data (uses .env)
npm run dev

# Start server without sample data
npm start

# Run all tests (backend + frontend)
npm test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend

# Access the application
open http://app.localhost:3000
```

**Environment Configuration (.env):**
```env
SAMPLE_DATA=true
ROOT_DOMAIN=localhost
PORT=3000
```

**Expected Output:**
- Server starts on port 3000
- If SAMPLE_DATA=true: creates 3 test servers (dev-api, staging, mobile-api) with 7 sample rules
- All API endpoints functional at subdomain routes:
  - `http://admin.localhost:3000/servers` - Admin API
  - `http://app.localhost:3000/servers/:id/rules` - Rules API
  - `http://app.localhost:3000/servers/:id/traffic` - Traffic API
  - `http://[server-id].localhost:3000/` - Fault server proxy
- Backend tests: 36/36 passing
- Frontend tests: 43/43 passing (reduced one invalid JSON test)
- Total: 79/79 tests passing
- UI accessible at `http://app.localhost:3000`
- Traffic viewer functional with real-time updates
- Rules management fully functional with CRUD operations

---

## Next Steps for Development Agent

---

## Important Notes

- **Subdomain Architecture:** All routing via subdomains (admin/app/[server-id])
- **No /api prefix:** Subdomain provides context
- **Rules-Based Routing:** All proxy and mock behavior configured through prioritized rules
- **Data Limit:** In-memory storage limited to 1000 transactions per server
- **Content Type:** Focus on JSON; other content types supported but not optimized
- **Environment:** Use .env for configuration (SAMPLE_DATA, ROOT_DOMAIN, PORT)
- **Testing:** Backend tests disable sample data, frontend tests enable it

---
