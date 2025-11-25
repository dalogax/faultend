# Fault-end Development Context

**Last Updated:** November 26, 2025  
**Current Phase:** Phase 2 - Complete ✓

---

## Project Overview

**Fault-end** is a lightweight proxy tool designed to help developers and testers validate the resilience of mobile and web applications against unreliable backend behavior.

### Core Concept
By routing REST + JSON traffic through Fault-end, you can inspect real requests and responses in real time and, with a single click, transform them into mocked or modified responses.

### Key Features
- Real-time request/response inspection
- One-click conversion of logged requests into mock rules
- Path regex matching for flexible rule definitions
- Custom response status, body, and latency injection
- Enable/disable mock rules on the fly
- Optimized for REST + JSON APIs

---

## Use Case Workflow

1. Launch Fault-end and open the UI
2. Configure your mobile/web app to use Fault-end's base URL instead of the real backend
3. Interact with your app normally - Fault-end proxies all REST + JSON calls to the real backend
4. Each request/response appears live in the UI
5. Click a logged request to **convert it into a mock**
6. Edit the auto-filled form:
   - Method (GET, POST, etc.)
   - Path regex pattern
   - Response status code
   - JSON response body
   - Optional artificial latency
7. Save the rule - future matching requests will return your mock instantly
8. Observe how your app behaves under controlled failure scenarios

---

## Technical Architecture

### Backend
A small reverse proxy optimized strictly for REST + JSON:
- Forwards requests to the real backend unless a matching rule exists
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
- One-click creation of mock rules
- Simple rule editor
- Rule list with enable/disable controls

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
Check mock rules → Rule Match? → Yes → Mocked Response (Status + JSON + Latency)
                             ↓ No
                    Forward to Real Backend
                             ↓
                    Backend Response
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
├── agents.md                   # This file - dev agent context
│
├── src/
│   ├── index.js                # Main entry point ✓
│   ├── server.js               # Express server setup ✓
│   ├── proxy/                  # Proxy logic
│   │   ├── config.js           # Proxy configuration ✓
│   │   ├── bodyParser.js       # Body parsing middleware ✓
│   │   ├── proxyHandler.js     # HTTP proxy handler ✓
│   │   └── router.js           # Proxy routing ✓
│   ├── traffic/                # Traffic logging
│   │   └── trafficLogger.js    # Placeholder for Phase 3
│   ├── rules/                  # Mock rules engine
│   │   ├── rulesEngine.js      # Placeholder for Phase 4
│   │   └── rulesManager.js     # Placeholder for Phase 5
│   ├── api/                    # API routes
│   │   ├── routes.js           # Placeholder for Phase 5
│   │   └── debug.js            # Debug endpoints ✓
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
└── data/                       # Runtime data storage
    ├── traffic.json            # Will store logged traffic
    └── rules.json              # Will store mock rules
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

### 🔜 Phase 3: Backend - Traffic Logging (NEXT)

**Objectives:**
- Formalize traffic data models
- Add request/response body capture
- Implement body size limits
- Add filtering and search capabilities
- Prepare data structure for persistence

**Key Deliverables:**
- Enhanced transaction storage with full request/response bodies
- Traffic filtering by method, status code, path
- Timestamp-based queries
- JSON parsing and validation
- Error tracking and categorization

---

### 📋 Upcoming Phases

- **Phase 3:** Backend - Traffic Logging (formalize data models, add body capture)
- **Phase 4:** Backend - Mock Rules Engine (rules matching)
- **Phase 5:** Backend - Rules Management API (CRUD endpoints)
- **Phase 6:** Backend - Response Customization (status, body, latency)
- **Phase 7:** Frontend - Project Setup and UI Framework
- **Phase 8:** Frontend - Real-time Traffic Viewer
- **Phase 9:** Frontend - Mock Rule Creator
- **Phase 10:** Frontend - Rules Management Interface
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

# Test health endpoint
curl http://localhost:3000/health

# View UI
open http://localhost:3000
```

**Expected Output:**
- Server starts on port 3000
- Health endpoint returns `{"status":"ok","service":"fault-end"}`
- UI shows "Fault-end is ready. Waiting for implementation..."

---

## Next Steps for Development Agent

When implementing Phase 3:

1. Read `phase3.md` for detailed implementation tasks (to be created)
2. Enhance proxy handler to capture request/response bodies
3. Implement traffic filtering and search
4. Add data validation and sanitization
5. Create traffic data models and types
6. Add body size limits and truncation
7. Implement timestamp-based queries
8. Test body capture for various content types

---

## Important Notes

- **Backend URL:** Will default to jsonplaceholder.typicode.com for testing
- **Request Flow:** All proxied requests will go to `/proxy/*` path
- **Data Limit:** Initial in-memory storage limited to 1000 transactions
- **Content Type:** Focus on JSON; other content types supported but not optimized
- **CORS:** May need to handle CORS headers for web client testing

---

## Questions to Consider for Future Phases

1. Should we support WebSocket proxying or only HTTP?
2. What's the best persistence strategy - SQLite, JSON files, or other?
3. How should rule priorities be handled when multiple rules match?
4. Should we support request body transformation in rules?
5. Do we need authentication/authorization for the UI?

---

*This document should be updated at the end of each phase implementation.*
