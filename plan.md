# Fault-end Implementation Plan

## Overview

Fault-end uses a **rules-based routing system** where both mocking and proxying are configured through prioritized rules. There is no hardcoded backend URL - all routing is explicit and configurable.

### Core Concepts

- **Rules**: Ordered list of routing instructions evaluated by priority (higher first)
- **Actions**: Each rule specifies either `mock` (return custom response) or `proxy` (forward to backend)
- **Multi-Backend Support**: Different rules can proxy to different backend URLs
- **Default Behavior**: Without a catch-all proxy rule, unmatched requests return 502
- **Export/Import**: Complete rule configurations can be saved and loaded as JSON files

### Deployment Model

- **One Fault-end instance = One app/tester**
- Deploy at a custom domain (e.g., `faultend.myapp.com`)
- Configure rules for specific testing needs
- Data and rules are isolated per instance
- Export/import configs for easy replication across environments

### Future SaaS Vision

- On-demand instance provisioning (e.g., `customer1.faultend.io`)
- Each customer gets isolated Fault-end instance
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

## Phase 6: Backend - Response Customization

Enhance mock rule responses with additional capabilities beyond basic status/body.

### Features:
- Artificial latency injection (delay before response)
- Response header customization
- Partial response mocking (modify specific fields)
- Request condition matching (query params, headers)
- Template variables in mock responses (use request data)

## Phase 7: Frontend - Project Setup and UI Framework

Create the frontend using vanilla HTML, CSS, and JavaScript served as static files from the Node.js backend. Set up basic HTML structure with no build process or compilation required. Use simple DOM manipulation and fetch API for backend communication.

## Phase 8: Frontend - Real-time Traffic Viewer

Create the main traffic viewer component that displays proxied requests and responses in real-time. Implement polling or simple auto-refresh for live updates using vanilla JavaScript. Add filtering and search capabilities with DOM manipulation.

## Phase 9: Frontend - Rule Creator Interface

Build the one-click workflow to convert a logged request into a rule (mock OR proxy). Implement the rule editor form with:
- Method and path regex
- Action selector (Mock / Proxy radio buttons)
- For Mock: status code, JSON body, latency
- For Proxy: target backend URL input
- Priority slider/input
- JSON syntax validation

### Workflow:
1. Click logged request → "Create Rule" button
2. Auto-fill: method, path, current response
3. Choose action: Mock (pre-filled with current response) OR Proxy (empty target input)
4. Edit as needed
5. Save → rule created and activated

## Phase 10: Frontend - Rules Management Interface

Create the rules list view showing all defined rules with:
- Visual distinction between mock and proxy rules (icons, colors)
- Priority ordering (drag-and-drop reordering)
- Enable/disable toggles
- Edit and delete buttons
- Quick action chips showing: method, path pattern, action type
- Export/Import buttons for rule configuration

### Import/Export Feature:
- Export button → Download `fault-end-config.json`
- Import button → File picker → Load rules
- Import options: Merge (add new rules) or Replace (clear existing)
- Validation before import with error messages

## Phase 11: Data Persistence and Storage

Implement persistent storage for traffic logs and rules using JSON files in `data/` directory.

### Files:
- `data/traffic.json` - Traffic logs (with size limits and rotation)
- `data/rules.json` - Rule definitions (auto-save on changes)
- `data/config.json` - Instance metadata (created date, description)

### Features:
- Auto-save rules on every change
- Traffic log rotation (keep last N transactions or last N days)
- Atomic writes (temp file + rename)
- Backup on import (save previous state before loading new config)
- Load rules on startup

## Phase 12: Docker Support and Deployment ✅

Enable easy deployment and instance provisioning through Docker.

**Status:** Complete - Basic Dockerfile implemented

### Implemented:
- ✅ `Dockerfile` - Alpine-based production image
- ✅ `.dockerignore` - Optimized build context
- ✅ Health check integration
- ✅ Non-root user for security
- ✅ Data directory for persistence

### Usage:
```bash
# Build image
docker build -t fault-end:latest .

# Run container
docker run -p 3000:3000 -v $(pwd)/data:/app/data fault-end:latest
```

### Deployment Options:
- Single instance: `docker run -p 3000:3000 -v $(pwd)/data:/app/data fault-end`
- Docker Compose for easy setup with persistent storage
- Kubernetes manifests for scalable SaaS deployment
- Cloud platform support (AWS ECS, Google Cloud Run, Azure Container Instances)

### SaaS Infrastructure:
- Base Docker image published to registry
- Instance provisioning via container orchestration
- Volume/storage provisioning per customer instance
- Reverse proxy/ingress for custom subdomains
- Resource limits per container (CPU, memory)
