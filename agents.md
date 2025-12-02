# Faultend Development Context

**Last Updated:** December 2, 2025

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

**Subdomain Architecture:**
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
├── agents.md                   # This file - dev agent context
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
│   ├── faultend.svg            # Logo (48px)
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

## Current Features

**Core Functionality:**
- **Subdomain Architecture:** Isolated fault servers per subdomain
- **Real-time Traffic Inspection:** Request/response logging with filtering
- **Rules-Based Routing:** Priority-ordered rules for mock or proxy actions
- **Multi-Backend Support:** Different rules can proxy to different services
- **Template Variables:** Dynamic data generation in mock responses
- **Conditional Matching:** Match on headers, query params, body fields
- **Request Manipulation:** Modify headers before proxying
- **Export/Import:** Save and load server configurations as JSON
- **Server Management:** Create, delete, and configure fault servers
- **Server URL Display:** Copyable proxy URL in top bar
- **Custom Dialogs:** Native-looking confirmation dialogs (no browser popups)
- **Minimal Notifications:** Error-only toasts (no success spam)

**Backend Features:**
- Rules-based routing with priority-ordered evaluation
- Dual-action rules: Mock responses OR proxy to specified backends
- Multi-backend support (different rules can proxy to different services)
- Full request/response body capture for all HTTP methods
- Body parsing for JSON content types (10MB limit)
- Binary data detection and metadata storage
- Complete transaction logging with timing
- Comprehensive traffic filtering
- Traffic statistics and analytics
- Error transaction logging with stack traces
- In-memory storage with FIFO eviction (1000 transaction limit)
- Template variables in mock responses
- Enhanced latency control (fixed/range)
- Request condition matching (headers, query, body, cookies)
- Request header manipulation for proxy rules
- Export/import rule configurations as JSON
- Subdomain-based routing and isolation

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

# Clear all logs
curl -X DELETE http://localhost:3000/api/traffic
```

**Transaction Data Model:**
```javascript
{
  id: "1764414722814-fdpza1d0n",
  timestamp: "2025-11-29T17:12:02.814Z",
  request: { /* ... */ },
  response: { /* ... */ },
  duration: 293,
  target: "https://api.example.com",  // or "MOCK" for mocked responses
  matchedRule: {
    id: "rule-1732627800000-abc123",
    name: "Test Mock Rule",
    action: "mock",
    priority: 100
  },
  error: null
}
```

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

**Export Data Format:**
```json
{
  "version": "1.0",
  "exportedAt": "2025-12-02T12:00:00.000Z",
  "server": {
    "id": "dev-api",
    "name": "Development API",
    "description": "Test instance"
  },
  "rules": [...],
  "metadata": {
    "rulesCount": 7,
    "exportSource": "faultend-ui"
  }
}
```

---

## Testing

**Test Suite:**
- **Backend Tests:** 36 integration tests (`npm run test:backend`)
  - Traffic API: Filtering, pagination, stats, cleanup
  - Rules API: CRUD operations, validation, priority ordering
  - Admin API: Server management, creation, deletion
  - Rules Engine: Matching logic, conditions, templates
  - Proxy: Request/response capture, routing
  
- **Frontend Tests:** 43 tests × 2 browsers = 86 total (`npm run test:frontend`)
  - Server list rendering and management
  - Traffic view: Filtering, real-time updates, detail modal
  - Rules view: Creation, editing, priority reordering
  - Config view: Export functionality
  - Drawer interactions
  - Toast notifications
  - Router navigation

**Running Tests:**
```bash
npm test              # Run all tests (backend + frontend)
npm run test:backend  # Backend only (Node.js)
npm run test:frontend # Frontend only (Playwright)
```

**Test Coverage:**
- All API endpoints tested
- All UI interactions tested
- Template functions validated
- Condition matching verified
- Error handling checked

---

## Development Guidelines

### Code Style
- Use vanilla JavaScript (ES6+)
- No TypeScript, no compilation step
- Clear, descriptive variable names
- Modular file structure
- Comments where appropriate for clarity

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
- Keep changes focused and atomic
- Document major changes appropriately

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
- Frontend tests: 86/86 passing (43 tests × 2 browsers)
- Total: 122/122 tests passing
- UI accessible at `http://app.localhost:3000`
- Traffic viewer functional with real-time updates
- Rules management fully functional with CRUD operations
- Server creation with manual/import modes (ID-only manual form)
- Server URL display with copy functionality
- Export configurations in Settings drawer
- Import configurations as JSON files
- Custom confirmation dialogs replace browser popups
- Error-only notifications (success toasts removed)

---

## Next Steps for Development Agent

---

## Important Notes

- **Subdomain Architecture:** All routing via subdomains (admin/app/[server-id])
- **No /api prefix:** Subdomain provides context
- **Rules-Based Routing:** All proxy/mock behavior configured through prioritized rules
- **Data Limit:** In-memory storage limited to 1000 transactions per server
- **Content Type:** Focus on JSON; other content types supported but not optimized
- **Environment:** Use .env for configuration (SAMPLE_DATA, ROOT_DOMAIN, PORT)
- **Testing:** Backend tests disable sample data, frontend tests enable it

---
