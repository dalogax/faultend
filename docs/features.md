# Features

This document lists the current capabilities of Faultend, split by user-facing functionality and backend behavior.

---

## Core Functionality

- **Subdomain Architecture:** Isolated fault servers per subdomain — `<id>.faultend.com` is the proxy, `app.faultend.com` is the UI
- **Real-time Traffic Inspection:** Request/response logging with filtering
- **Rules-Based Routing:** Priority-ordered rules for mock or proxy actions
- **Multi-Backend Support:** Different rules can proxy to different backends
- **Latency Simulation:** Fixed or random-range delays on both mock and proxy rules
- **JS Response Transform:** Optional JavaScript snippet runs against any response before it is sent; can modify status, headers, and body
- **Template Variables:** Dynamic data generation in mock response bodies
- **Conditional Matching:** Match on headers, query params, body fields, cookies
- **Request Header Manipulation:** Add, set, or remove headers before proxying
- **Export/Import:** Save and load server configurations as JSON
- **Server Management:** Create, delete, and configure fault servers

## Authentication & Collaboration

- **OAuth Login:** Google and GitHub OAuth (email-based account linking across providers)
- **Server Sharing:** Generate invite links; recipients join as collaborators
- **Role-Based Access:** Three roles per server — **owner** (full control), **admin** (can share and configure), **collaborator** (view and use)
- **Admin Promotion:** Owner can promote/demote any collaborator to admin
- **Ownership Transfer:** Owner can hand off ownership to any collaborator (owner becomes admin)
- **Server List Badges:** Each server is labelled `owner`, `admin`, or `shared` in the UI

## Backend

- Rules-based routing with priority-ordered evaluation
- Dual-action rules: Mock responses OR proxy to specified backends
- Optional JS transform step (Node.js `vm` sandbox, 1-second timeout)
- Latency applied server-side before forwarding or responding
- Full request/response body capture for all HTTP methods (10 MB limit)
- Complete transaction logging with timing, stored in PostgreSQL
- Comprehensive traffic filtering and statistics
- Template variables in mock responses (`uuid()`, `random()`, `timestamp()`, etc.)
- Conditional matching (header, query, body path, cookie)
- Request header manipulation for proxy rules (add/set/remove)
- Export/import rule configurations as JSON
- Subdomain-based routing and server isolation
- Session-based auth with PostgreSQL session store

---

## Related Docs

- [Overview](./overview.md) – High-level project concept
- [Workflow](./workflow.md) – How to use these features in practice
- [API Reference](./api-reference.md) – How to interact with features programmatically
