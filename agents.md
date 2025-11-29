# Fault-end Development Context

**Last Updated:** November 29, 2025  
**Current Phase:** Phase 3 - Complete ✓

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
├── agents.md                   # This file - dev agent context
│
├── src/
│   ├── index.js                # Main entry point ✓
│   ├── server.js               # Express server setup ✓
│   ├── proxy/                  # Proxy logic
│   │   ├── config.js           # Proxy configuration ✓
│   │   ├── proxyHandler.js     # HTTP proxy handler with body capture ✓
│   │   └── router.js           # Proxy routing with express.json() ✓
│   ├── traffic/                # Traffic logging
│   │   └── trafficLogger.js    # Traffic logging with filtering ✓
│   ├── rules/                  # Mock rules engine
│   │   ├── rulesEngine.js      # Placeholder for Phase 4
│   │   └── rulesManager.js     # Placeholder for Phase 5
│   ├── api/                    # API routes
│   │   ├── traffic.js          # Traffic API endpoints ✓
│   │   └── routes.js           # Placeholder for Phase 5
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
│   └── integration.test.js     # Integration tests for Phase 3 ✓
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
- No mock rules engine yet (Phase 4)
- No frontend UI for viewing traffic (Phase 8)

---

### 📋 Upcoming Phases

- **Phase 4:** Backend - Rules Engine with Proxy-as-Rule (remove hardcoded backend, implement dual-action rules)
- **Phase 5:** Backend - Rules Management API (CRUD endpoints, export/import)
- **Phase 6:** Backend - Response Customization (enhanced mock features)
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
- Default backend target: will be configurable via `BACKEND_URL` env var
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

---

## How to Run (Current State)

```bash
# Install dependencies (already done)
npm install

# Start server
npm start

# Or with auto-restart during development
npm run dev

# Run integration tests
npm test

# Test proxy endpoints
curl http://localhost:3000/proxy/posts/1

curl -X POST http://localhost:3000/proxy/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Content","userId":1}'

# View traffic logs
curl http://localhost:3000/api/traffic

# Get statistics
curl http://localhost:3000/api/traffic/stats

# Clear logs
curl -X DELETE http://localhost:3000/api/traffic

# View UI
open http://localhost:3000
```

**Expected Output:**
- Server starts on port 3000
- Health endpoint returns `{"status":"ok","service":"fault-end"}`
- Proxy endpoints forward requests and capture bodies
- Traffic API returns logged transactions with full request/response data
- Tests run and pass (14/15 consistently)
- UI shows "Fault-end is ready. Waiting for implementation..."

---

## Next Steps for Development Agent

When implementing Phase 4:

1. Read `phase4.md` for detailed implementation tasks (to be created)
2. Design rule data model with `action`, `target`, `mockResponse` fields
3. Remove hardcoded `BACKEND_URL` from config.js
4. Implement priority-based rule matching engine
5. Support both `mock` and `proxy` actions
6. Add path regex pattern matching
7. Create initial default catch-all proxy rule on first startup
8. Update proxy router to use rules engine instead of static target
9. Handle unmatched requests (502 error)
10. Test both mock and proxy actions with various rule priorities

**Phase 4 Complete When:** No hardcoded backend URLs exist, all routing happens via rules

---

## Important Notes

- **Backend URL:** Currently uses temporary hardcoded default (jsonplaceholder.typicode.com) - will be removed in Phase 4
- **Rules-Based Routing:** Phase 4 will replace static backend with configurable proxy rules
- **Request Flow:** All proxied requests go to `/proxy/*` path
- **Data Limit:** Initial in-memory storage limited to 1000 transactions
- **Content Type:** Focus on JSON; other content types supported but not optimized
- **CORS:** May need to handle CORS headers for web client testing
- **Export/Import:** Rule configuration export/import will be implemented in Phase 5 (API) and Phase 10 (UI)

---

## Questions to Consider for Future Phases

1. Should we support WebSocket proxying or only HTTP?
2. What's the best persistence strategy - SQLite, JSON files, or other?
3. How should rule priorities be handled when multiple rules match?
4. Should we support request body transformation in rules?
5. Do we need authentication/authorization for the UI?
6. **Export/Import format:** Should exported configs include traffic logs or just rules?
7. **Import behavior:** Merge with existing rules or replace entirely? Both options?
8. **Rule validation:** How strict should regex validation be? Allow testing patterns?

---

*This document should be updated at the end of each phase implementation.*
