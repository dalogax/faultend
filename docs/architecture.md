# Architecture

This document describes the technical architecture, codebase structure, and key design decisions behind Faultend.

---

## Backend

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

## Frontend

A UI built for clarity and speed:
- Real-time traffic viewer with auto-refresh
- Server creation with manual/import modes (ID-only manual form)
- Copyable server URL in top bar for easy access
- One-click creation of mock OR proxy rules from traffic logs
- Rule editor with full CRUD operations
- Rules list with priority management and enable/disable controls
- Export functionality in Settings drawer
- Import functionality for server configurations
- Drawer-based modal system
- Custom confirmation dialogs (no browser popups)
- Error-only toast notifications (no success toasts)

**Tech Stack:**
- Vanilla HTML, CSS, JavaScript
- No build process or compilation
- Served as static files from Express

---

## Architecture Flow

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

## Directory Structure

```
Faultend/
├── .env                        # Environment configuration (SAMPLE_DATA, ROOT_DOMAIN, PORT)
├── .gitignore
├── .tool-versions              # Node version (20.18.1)
├── package.json                # v0.1.0, includes dotenv
├── package-lock.json
├── playwright.config.js        # Playwright test configuration
├── README.md                   # User-facing documentation
├── agents.md                   # Index for AI assistants
│
├── src/
│   ├── index.js                # Main entry point with dotenv, sample data init
│   ├── server.js               # Express server with subdomain routing, CORS
│   ├── middleware/
│   │   └── subdomainRouter.js  # Subdomain detection and serverId extraction
│   ├── utils/
│   │   └── subdomain.js        # Subdomain parsing helpers
│   ├── proxy/
│   │   ├── config.js           # Proxy configuration
│   │   ├── proxyHandler.js     # HTTP proxy handler
│   │   └── router.js           # Rules-based routing
│   ├── traffic/
│   │   └── trafficLogger.js    # Traffic logging
│   ├── rules/
│   │   ├── rulesEngine.js      # Rules matching, execution, conditions
│   │   ├── templateEngine.js   # Template variable rendering
│   │   └── rulesManager.js     # Placeholder for future enhancements
│   ├── api/
│   │   ├── admin.js            # Fault server management API
│   │   ├── traffic.js          # Traffic API endpoints
│   │   └── rules.js            # Rules management API
│   └── storage/
│       └── storage.js          # In-memory storage
│
├── public/                     # Static frontend files
│   ├── landing.html            # Landing page
│   ├── app.html                # Main app UI
│   ├── img/faultend.svg       # Logo (48px)
│   ├── css/
│   │   ├── reset.css           # CSS reset
│   │   ├── variables.css       # Design system tokens
│   │   ├── components.css      # Reusable components + ConfirmDialog
│   │   ├── layout.css          # Responsive layout system
│   │   ├── drawer.css          # Drawer styles
│   │   └── app.css             # App-specific styles + server URL display
│   └── js/
│       ├── config.js           # Configuration
│       ├── api.js              # API client
│       ├── components.js       # UI components (Toast, ConfirmDialog, Badges)
│       ├── drawer.js           # Drawer controller
│       ├── router.js           # View router + server URL + export in Settings
│       ├── app.js              # Main application controller
│       └── views/
│           ├── traffic.js      # Traffic view logic
│           └── rules.js        # Rules view logic
│
└── tests/                      # Test files
    ├── backend.test.js         # Backend integration tests (36 tests)
    └── frontend.spec.js        # Frontend Playwright tests (43 tests × 2 browsers)
```

---

## Key Technical Decisions

1. **Single Repository:** Backend and frontend in same repo for simplicity
2. **No Build Step:** Vanilla JS only, no compilation or bundling
3. **Express for Everything:** Handles both API routes and static file serving
4. **In-Memory Storage:** Current implementation stores data in memory (persistence planned for future)
5. **JSON-Focused:** Optimized specifically for REST + JSON APIs
6. **Minimal Dependencies:** Only essential packages to keep it lightweight
7. **Rules-Based Routing:** All proxy/mock behavior configured via priority-ordered rules

---

## Related Docs

- [Overview](./overview.md) – Project concept and deployment model
- [Features](./features.md) – Detailed feature lists
- [API Reference](./api-reference.md) – Endpoints and data models
- [Development Workflow](./development.md) – How to run and develop locally
