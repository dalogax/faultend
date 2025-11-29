# Fault-end Development Context

**Last Updated:** November 29, 2025  
**Current Phase:** Phase 6 - Complete ✓

---

## Project Overview

**Fault-end** is a lightweight proxy tool designed to help developers and testers validate the resilience of mobile and web applications against unreliable backend behavior.

### Core Concept
By routing REST + JSON traffic through Fault-end, you can inspect real requests and responses in real time and configure flexible routing rules. Rules can either mock responses (return custom status/body/latency) OR proxy to specified backends (forward to real APIs). This enables multi-backend support and complex testing scenarios.

### Key Features
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
Unlike traditional proxies with a single hardcoded backend URL, Fault-end treats proxying as a configurable rule action. This means:
- No `BACKEND_URL` environment variable
- All routing is explicit and visible in the rules list
- Support for multiple backend services (microservices-friendly)
- Easy to see what traffic goes where
- Default behavior: unmatched requests return 502 (forces explicit routing)

---

## Use Case Workflow

1. Launch Fault-end and open the UI
2. Configure your mobile/web app to use Fault-end's base URL (e.g., `faultend.myapp.com`)
3. Create initial proxy rules to route traffic to your backends:
   - Rule 1 (priority 100): `.*` → Proxy to `https://api.myapp.com`
   - Rule 2 (priority 90): `/auth/.*` → Proxy to `https://auth.myapp.com`
4. Interact with your app normally - Fault-end routes based on rules
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

- **One Fault-end instance = One app/tester**
- Deploy at a custom domain (e.g., `faultend.myapp.com`)
- Configure rules for your specific testing needs
- Data and rules are isolated per instance
- Export/import configs for easy replication

**Future SaaS Model:**
- Spin up isolated instances (e.g., `customer1.faultend.io`)
- Each with own rules, traffic logs, configuration
- Multi-tenant with complete isolation

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
Fault-end Proxy
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
fault-end/
├── .gitignore
├── .tool-versions              # Node version (20.18.1)
├── package.json                # v0.1.0
├── package-lock.json
├── README.md                   # User-facing documentation
├── plan.md                     # High-level phase plan
├── phase1.md                   # Detailed Phase 1 implementation guide
├── phase2.md                   # Detailed Phase 2 implementation guide
├── phase3.md                   # Detailed Phase 3 implementation guide
├── phase4.md                   # Detailed Phase 4 implementation guide ✓
├── phase5.md                   # Detailed Phase 5 implementation guide ✓
├── phase6.md                   # Detailed Phase 6 implementation guide ✓
├── agents.md                   # This file - dev agent context
│
├── src/
│   ├── index.js                # Main entry point with rule initialization ✓
│   ├── server.js               # Express server setup ✓
│   ├── proxy/                  # Proxy logic
│   │   ├── config.js           # Proxy configuration (no hardcoded backend) ✓
│   │   ├── proxyHandler.js     # HTTP proxy handler with header manipulation ✓
│   │   └── router.js           # Rules-based routing ✓
│   ├── traffic/                # Traffic logging
│   │   └── trafficLogger.js    # Traffic logging with rule metadata ✓
│   ├── rules/                  # Rules engine
│   │   ├── rulesEngine.js      # Rules matching, execution, conditions ✓
│   │   ├── templateEngine.js   # Template variable rendering ✓
│   │   └── rulesManager.js     # Placeholder for future enhancements
│   ├── api/                    # API routes
│   │   ├── traffic.js          # Traffic API endpoints ✓
│   │   └── rules.js            # Rules management API ✓
│   └── storage/                # Data persistence
│       └── storage.js          # Placeholder for Phase 11
│
├── public/                     # Static frontend files
│   ├── index.html              # Main HTML template ✓
│   ├── css/
│   │   └── styles.css          # Base styles ✓
│   └── js/
│       └── app.js              # Frontend JavaScript ✓
│
├── test/                       # Test files
│   ├── integration.test.js     # Integration tests (Phase 3-6) ✓
│   ├── phase4.test.js          # Unit tests for Phase 4 rules engine ✓
│   └── phase4-integration.test.js  # Integration helper for Phase 4 ✓
│
└── data/                       # Runtime data storage
    ├── traffic.json            # Will store logged traffic (Phase 11)
    └── rules.json              # Will store mock rules (Phase 11)
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
- Health check endpoint: `GET /health` → `{"status":"ok","service":"fault-end","version":"0.1.0"}`
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
- Custom backend target via `X-Fault-End-Target` header or `BACKEND_URL` env var
- Debug endpoints for inspecting intercepted traffic

**Proxy Endpoints:**
```bash
# Proxy any request
curl http://localhost:3000/proxy/posts/1

# With custom target
curl -H "X-Fault-End-Target: https://api.example.com" \
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
- **No hardcoded backend:** Removed `BACKEND_URL` fallback and `X-Fault-End-Target` header
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
- No more `X-Fault-End-Target` header support
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

### 📋 Upcoming Phases

- **Phase 7:** Frontend - Project Setup and UI Framework
- **Phase 8:** Frontend - Real-time Traffic Viewer
- **Phase 9:** Frontend - Rule Creator Interface (mock OR proxy)
- **Phase 10:** Frontend - Rules Management Interface (with export/import UI)
- **Phase 11:** Data Persistence and Storage

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
# Install dependencies (already done)
npm install

# Start server (creates default proxy rule on first run)
npm start

# Or with auto-restart during development
npm run dev

# Run integration tests (Phase 4-5)
npm test

# Test proxy with default rule
curl http://localhost:3000/proxy/posts/1

# View traffic logs (includes matchedRule metadata)
curl http://localhost:3000/api/traffic

# Get statistics
curl http://localhost:3000/api/traffic/stats

# Clear logs
curl -X DELETE http://localhost:3000/api/traffic

# List all rules
curl http://localhost:3000/api/rules

# Create a mock rule
curl -X POST http://localhost:3000/api/rules \
  -H "Content-Type: application/json" \
  -d '{"priority":100,"name":"Test Mock","method":"GET","pathRegex":"^/test$","action":"mock","mockResponse":{"statusCode":200,"body":{"test":true}}}'

# Export rules
curl -X POST http://localhost:3000/api/rules/export > config.json

# View UI
open http://localhost:3000
```

**Expected Output (Phase 6):**
- Server starts on port 3000
- Starts with zero rules configured
- Unmatched requests return 502 Bad Gateway with helpful error
- Health endpoint returns `{"status":"ok","service":"fault-end"}`
- All API endpoints functional:
  - `/health` - Health check
  - `/api/traffic` - Traffic logs with filtering
  - `/api/traffic/stats` - Statistics
  - `/api/rules` - List rules
  - `/api/rules` (POST) - Create rule
  - `/api/rules/:id` - Get/Update/Delete rule
  - `/api/rules/:id/toggle` - Enable/disable
  - `/api/rules/export` - Export configuration
  - `/api/rules/import` - Import configuration
  - `/proxy/*` - Proxy with rules
- Phase 6 unit tests: `node test/phase6.test.js` (31/31 passing)
- Integration tests: `npm test` (40/40 passing)
- Template variables render in mock responses
- Enhanced latency (fixed/range) works correctly
- Condition matching filters requests properly
- Header manipulation modifies proxy requests
- Traffic logs include `matchedRule` field with rule metadata
- UI shows "Fault-end is ready. Waiting for implementation..."

---

## Next Steps for Development Agent

When implementing Phase 7:

1. Read `phase7.md` for detailed implementation tasks
2. Set up frontend build process (or continue with vanilla JS)
3. Create UI framework and layout
4. Implement navigation and routing (if needed)
5. Design component structure for traffic viewer and rule management

**Phase 7 Complete When:** Frontend foundation is established and ready for feature implementation

---

## Important Notes

- **Backend URL:** No hardcoded backend URLs - all routing via rules
- **Rules-Based Routing:** All proxy and mock behavior configured through prioritized rules
- **Request Flow:** All proxied requests go to `/proxy/*` path
- **Data Limit:** Initial in-memory storage limited to 1000 transactions
- **Content Type:** Focus on JSON; other content types supported but not optimized
- **CORS:** May need to handle CORS headers for web client testing
- **Export/Import:** Rule configuration export/import implemented in Phase 5 (API) and Phase 10 (UI)

---

## Questions to Consider for Future Phases

1. Should we support WebSocket proxying or only HTTP?
2. What's the best persistence strategy - SQLite, JSON files, or other?
3. How should rule priorities be handled when multiple rules match?
4. Should we support request body transformation in rules?
5. Do we need authentication/authorization for the UI?

---

*This document should be updated at the end of each phase implementation.*
