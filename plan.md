# Faultend Implementation Plan

## Overview

Faultend uses a **rules-based routing system** where both mocking and proxying are configured through prioritized rules. There is no hardcoded backend URL - all routing is explicit and configurable.

### Core Concepts

- **Rules**: Ordered list of routing instructions evaluated by priority (higher first)
- **Actions**: Each rule specifies either `mock` (return custom response) or `proxy` (forward to backend)
- **Multi-Backend Support**: Different rules can proxy to different backend URLs
- **Default Behavior**: Without a catch-all proxy rule, unmatched requests return 502
- **Export/Import**: Complete rule configurations can be saved and loaded as JSON files

### Deployment Model

- **One Faultend instance = One app/tester**
- Deploy at a custom domain (e.g., `faultend.myapp.com`)
- Configure rules for specific testing needs
- Data and rules are isolated per instance
- Export/import configs for easy replication across environments

### Future SaaS Vision

- On-demand instance provisioning (e.g., `customer1.faultend.io`)
- Each customer gets isolated Faultend instance
- Complete data isolation (rules, traffic logs, configuration)
- Multi-tenant architecture with separate databases/storage
- API-driven instance management
- Usage-based billing per instance

---

## Phase 1: Project Setup and Core Infrastructure ✅

Set up a single Node.js project structure with backend and frontend in the same repository. Initialize package.json, configure basic directory structure for server code and static frontend files. Use vanilla JavaScript with no compilation step required.

**Status:** Complete

## Phase 2: Backend - Proxy Core ✅

Build the core HTTP proxy functionality that intercepts REST + JSON requests, forwards them to a configurable backend, and returns responses. Implement the request/response pipeline with proper error handling and logging capabilities.

**Status:** Complete (uses temporary hardcoded backend URL, will be replaced in Phase 4)

## Phase 3: Backend - Traffic Logging ✅

Create the traffic logging system to capture and store all proxied requests and responses. Design the data model for traffic logs including timestamps, HTTP methods, paths, headers, request/response bodies, and status codes. Add filtering and statistics capabilities.

**Status:** Complete

## Phase 4: Backend - Rules Engine with Proxy-as-Rule

**CRITICAL:** Remove hardcoded backend URL configuration. Implement rules-based routing system where both mocking and proxying are configured through prioritized rules.

### Objectives:
- Design rule data model with `action` field (`"mock"` or `"proxy"`)
- Implement priority-based rule evaluation (higher priority first)
- Support path regex matching and HTTP method filtering
- For `proxy` action: forward to rule-specified `target` URL
- For `mock` action: return custom response (status, body, latency)
- Remove `BACKEND_URL` environment variable and hardcoded defaults
- Handle unmatched requests (no matching rule = 502 error)
- Server starts with zero rules configured

### Deliverables:
- `src/rules/rulesEngine.js` - Rule matching and evaluation logic
- Rule data model: `{ id, priority, enabled, method, pathRegex, action, target?, mockResponse? }`
- Integration with proxy handler to use rules instead of hardcoded target
- Tests for rule matching, priority ordering, and both actions

**Phase complete when:** Server starts with zero rules. All routing is explicit via configured rules. Unmatched requests return 502. No hardcoded backend URLs remain.

## Phase 5: Backend - Rules Management API

Build REST API endpoints for managing rules: create, read, update, delete, enable/disable. Include rule validation and conflict detection (duplicate priorities).

### Endpoints:
- `GET /api/rules` - List all rules
- `POST /api/rules` - Create new rule
- `GET /api/rules/:id` - Get rule by ID
- `PUT /api/rules/:id` - Update rule
- `DELETE /api/rules/:id` - Delete rule
- `PATCH /api/rules/:id/toggle` - Enable/disable rule
- `POST /api/rules/export` - Export all rules as JSON
- `POST /api/rules/import` - Import rules from JSON file

### Features:
- Rule validation (regex syntax, required fields based on action)
- Priority conflict resolution
- Atomic updates (validate before applying)
- Export includes all rules, import merges or replaces

## Phase 6: Backend - Response Customization ✅

Enhance mock rule responses with additional capabilities beyond basic status/body.

### Features:
- Artificial latency injection (delay before response)
- Response header customization
- Partial response mocking (modify specific fields)
- Request condition matching (query params, headers)
- Template variables in mock responses (use request data)

**Status:** Complete

## Phase 6.1: Subdomain-Based Multi-Tenant Architecture

Transform Faultend from single-instance proxy to multi-tenant SaaS-ready platform with subdomain-based routing. Remove `/proxy` URL prefix and implement intelligent routing based on subdomains.

### Architecture Overview:
- **Root Domain Configuration:** Configurable via `ROOT_DOMAIN` env var (e.g., `localhost` for dev, `faultend.com` for production)
- **Landing Page:** `[ROOT_DOMAIN]` (no subdomain) → Static landing page explaining the service
- **Admin API:** `admin.[ROOT_DOMAIN]` → Management API for creating/deleting fault servers
- **User App:** `app.[ROOT_DOMAIN]` → Main UI for managing rules and viewing traffic (current frontend)
- **Fault Servers:** `[customer-id].[ROOT_DOMAIN]` → Customer-specific proxy instances (e.g., `customer1.localhost`, `companyB.localhost`)

### Key Changes:
- Remove `/proxy` URL prefix - all requests to fault servers are proxied directly
- Subdomain detection middleware in Express
- Multi-tenant data isolation (rules and traffic scoped per customer-id)
- Admin API for fault server lifecycle management (create, list, delete)
- Enhanced frontend to work at `app.[ROOT_DOMAIN]` subdomain
- DNS wildcard support (`*.[ROOT_DOMAIN]`)

### Benefits:
- **Seamless Integration:** Users only change domain, not URL structure (`api.myapp.com/users` → `customer1.faultend.com/users`)
- **SaaS-Ready:** Each customer gets isolated subdomain with own data
- **Local Development:** Works with `*.localhost` natively (no DNS setup)
- **Production Ready:** Uses wildcard DNS (`*.faultend.com A 123.45.67.89`)

**See `phase6_1.md` for detailed implementation plan**

## Phase 7: Frontend - Project Setup and UI Framework ✅

Create the frontend using vanilla HTML, CSS, and JavaScript served as static files from the Node.js backend. Set up basic HTML structure with no build process or compilation required. Use simple DOM manipulation and fetch API for backend communication.

**Status:** Complete

## Phase 8: Frontend - Real-time Traffic Viewer ✅

Create the main traffic viewer component that displays proxied requests and responses in real-time. Implement polling or simple auto-refresh for live updates using vanilla JavaScript. Add filtering and search capabilities with DOM manipulation.

**Status:** Complete

## Phase 9: Frontend - Rule Creator Interface

Build the one-click workflow to convert a logged request into a rule (mock OR proxy). Implement the rule editor form in the right column of the server management view.

### Features:
- Rule creation form with all necessary fields
- Method selector and path regex input
- Action selector (Mock / Proxy radio buttons)
- For Mock action: status code, JSON body editor, latency configuration
- For Proxy action: target backend URL input
- Priority slider/input
- JSON syntax validation
- Template variable support in mock responses
- Condition matching UI (headers, query params, body fields)
- Enable/disable toggle for new rules
- Form validation and error handling

### Workflow:
1. Click logged request → "Create Rule" button in traffic detail drawer
2. Auto-fill: method, path pattern (extracted from request), current response body
3. Choose action: Mock (pre-filled with current response) OR Proxy (empty target input)
4. Edit fields as needed (adjust regex, modify response, set latency, add conditions)
5. Set priority (suggest next available priority)
6. Save → rule created, activated, and appears in rules list

### Deliverables:
- Rule creation form component in `public/js/views/rules.js`
- Integration with traffic detail drawer "Create Rule" button
- Form state management (validation, error display)
- API integration for rule creation
- Success/error toast notifications

## Phase 10: Frontend - Rules Management Interface

Create the rules list view showing all defined rules in the right column, with comprehensive management capabilities.

### Features:
- Rules list displaying all configured rules
- Visual distinction between mock and proxy rules (icons, colors, or badges)
- Rule information cards showing: name, method, path pattern, action type, priority, enabled status
- Priority ordering display (sorted by priority, high to low)
- Priority reordering (drag-and-drop or up/down buttons)
- Enable/disable toggle switches per rule
- Edit button (opens rule editor - reuse Phase 9 form component)
- Delete button with confirmation dialog
- Expand/collapse for full rule details (conditions, headers, etc.)
- Empty state when no rules configured
- Rule count display

### Export/Import Feature:
- Export button → Download `faultend-config.json` with all rules
- Import button → File picker → Upload and load rules
- Import options modal: 
  - Merge mode (add new rules, keep existing)
  - Replace mode (clear all existing rules first)
- Validation before import with detailed error messages
- Preview of rules to be imported
- Backup creation before replace mode

### Additional Features:
- Search/filter rules by name, method, path pattern
- Bulk operations (enable/disable multiple, delete multiple)
- Rule duplication (copy existing rule as template)
- Quick stats (total rules, enabled/disabled count, mock/proxy breakdown)

### Deliverables:
- Complete rules list component in `public/js/views/rules.js`
- Rule card component for individual rule display
- Export/import functionality with file handling
- Drag-and-drop priority reordering
- Edit modal integration (reuse Phase 9 form)
- Delete confirmation dialogs
- Rule validation for imports

## Phase 10.5: Frontend - Server Lifecycle Management

Complete the server management functionality with creation and deletion capabilities.

### Server Creation Features:
- Server creation modal/drawer triggered by "Create Server" button
- Form fields:
  - Server ID (required, validated for uniqueness and format)
  - Server Name (optional, human-readable display name)
  - Description (optional, purpose/notes about the server)
- Server ID validation:
  - Alphanumeric and hyphens only
  - Must start with letter
  - Check for duplicates via API
  - Real-time validation feedback
- Form validation and error display
- Integration with Admin API (`POST /servers`)
- Success feedback and automatic navigation to new server
- Error handling for conflicts and API failures

### Server Deletion Features:
- Delete server button in server settings drawer (already implemented)
- Confirmation dialog with warning about data loss
- Integration with Admin API (`DELETE /servers/:id`)
- Auto-navigation to server list after deletion
- Refresh server list after deletion
- Error handling for API failures

### Workflow:
1. Click "Create Server" button on server list page
2. Modal/drawer opens with creation form
3. Enter server ID (validated in real-time)
4. Optionally enter name and description
5. Submit → API call to create server
6. On success: Close modal, refresh server list, navigate to new server
7. On error: Display error message, keep form open

### Deliverables:
- Server creation form component
- Integration with existing drawer or modal system
- Admin API integration for server creation
- Form validation (client-side and server-side feedback)
- Success/error handling with toast notifications
- Auto-navigation to newly created server

## Phase 11: Data Persistence and Storage (TBD)

Implement persistent storage for traffic logs and rules. **Storage solution to be decided** (options: JSON files, SQLite, PostgreSQL, or other database).

### Goals:
- Persist rules across server restarts
- Persist traffic logs with rotation/limits
- Persist server metadata (name, description, created date)
- Maintain data isolation per server
- Support backup and restore

### Requirements (regardless of solution):
- Per-server data isolation
- Atomic writes to prevent corruption
- Auto-save rules on every change
- Traffic log rotation (size or time-based limits)
- Load data on startup
- Migration from in-memory to persistent storage
- Graceful handling of missing/corrupted data
- Backup support before destructive operations (e.g., rule imports)

### Storage Options Under Consideration:
1. **JSON Files** - Simple, no dependencies, good for single-instance
2. **SQLite** - Embedded database, better querying, transactions
3. **PostgreSQL** - Full database, better for multi-instance/SaaS
4. **Redis** - Fast, good for caching, but requires external service

**Decision pending based on deployment requirements and scalability needs.**

## Phase 12: Future Enhancements (Post-MVP)

After completing Phases 1-11, the following enhancements can be considered for future versions:

### Real-time Features:
- **WebSocket support** - Replace polling with WebSocket for true real-time traffic updates
- **Live rule editing** - See rule changes reflected immediately without refresh

### Traffic Management:
- **Export as HAR file** - Export traffic logs in HTTP Archive format for analysis tools
- **Request replay** - Replay captured requests through the proxy
- **Traffic diff viewer** - Compare request/response pairs side-by-side
- **Traffic statistics dashboard** - Visualize traffic patterns, response times, error rates

### UI/UX Improvements:
- **Syntax highlighting** - Color-coded JSON in traffic detail view
- **Copy to clipboard** - Quick copy buttons for request/response data
- **Advanced filtering** - Filter by date/time range, regex patterns on any field
- **Saved filter presets** - Save and reuse common filter combinations
- **Dark mode** - Optional dark theme for the UI

### Rule Management:
- **Rule templates** - Pre-built rule templates for common scenarios
- **Rule testing** - Test rules against sample requests before activating
- **Rule history** - Track changes to rules over time
- **Conditional rule chains** - Multiple rules with AND/OR logic

### DevOps & Deployment:
- **Docker Compose templates** - Ready-to-use compose files for various setups
- **Kubernetes manifests** - Production-ready K8s deployment configs
- **Monitoring & observability** - Metrics, logging, health checks
- **Multi-instance coordination** - Share rules across multiple Faultend instances

### API & Integration:
- **REST API for automation** - Programmatic rule management
- **CI/CD integration** - Import/export rules in pipelines
- **Webhook notifications** - Alert on specific traffic patterns
- **Plugin system** - Extend Faultend with custom processors

**Note:** These features are not currently planned for implementation but represent potential future directions based on user needs.
