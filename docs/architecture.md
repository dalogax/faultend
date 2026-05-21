# Architecture

This document describes the technical architecture, codebase structure, and key design decisions behind Faultend.

---

## Backend

A small reverse proxy optimized strictly for REST + JSON:
- Routes requests based on priority-ordered rules
- Rules can either mock responses OR proxy to specified backends
- Optional JS transform step runs against the response before it is sent
- Applies latency (fixed or range) to both mock and proxy responses
- Persists traffic logs, rule definitions, users, and servers in PostgreSQL
- Session-based authentication via Google and GitHub OAuth
- Exposes a REST API for the frontend

**Tech Stack:**
- Node.js with Express
- PostgreSQL (via `pg` + `pg-pool`)
- `http-proxy-middleware` for proxying
- `connect-pg-simple` + `express-session` for sessions
- `passport` + `passport-google-oauth20` + `passport-github2` for OAuth
- Node.js `vm` module for sandboxed JS transform execution
- Vanilla JavaScript (no compilation required)

## Frontend

A single-page application served as static files:
- Hash-based routing (`#server/:id`, `#invite/:token`)
- Real-time traffic viewer with auto-refresh
- Rule editor with CRUD, latency controls, and optional JS transform field
- Settings drawer: export config, invite link generation, collaborators list with role management
- Server list with owner/admin/shared role badges
- Login overlay with Google and GitHub OAuth buttons

**Tech Stack:**
- Vanilla HTML, CSS, JavaScript (ES modules)
- No build process or compilation
- Served as static files from Express

---

## Architecture Flow

```
Client Request
    ↓
Faultend Proxy (subdomain routing)
    ↓
Check Rules (by priority, high to low)
    ↓
Rule Match? → Yes → Action Type?
                       ↓
                   Mock  → Build response → [Transform] → [Latency] → Send
                       ↓
                   Proxy → [Latency] → Forward to target backend
                             → Buffer response → [Transform] → Send
Rule Match? → No → 502
    ↓
Log Traffic (PostgreSQL)

Frontend UI ←→ API (app.* subdomain) ←→ PostgreSQL
```

---

## Directory Structure

```
faultend/
├── .env                          # Local environment config (gitignored)
├── .env.example                  # Template for env vars (no credentials)
├── agents.md                     # AI agent directives (CLAUDE.md symlinks here)
├── CLAUDE.md -> agents.md        # Symlink — read by Claude Code automatically
├── db/
│   └── schema.sql                # Full schema + idempotent migration blocks
│
├── src/
│   ├── index.js                  # Entry point: DB connect, migrate, sample data, listen
│   ├── server.js                 # Express app: CORS, sessions, routes, auth middleware
│   ├── auth/
│   │   ├── passport.js           # Google + GitHub Passport strategies
│   │   ├── routes.js             # /api/auth/google, /github, /me, /logout, /dev-login
│   │   └── middleware.js         # authRequired, requireServerAccess, requireOwner
│   ├── db/
│   │   ├── pool.js               # pg-pool singleton
│   │   └── migrate.js            # Runs schema.sql on startup (idempotent)
│   ├── middleware/
│   │   └── subdomainRouter.js    # Sets req.routeType, req.serverId from Host header
│   ├── api/
│   │   ├── servers.js            # CRUD for fault servers
│   │   ├── rules.js              # Rules CRUD + toggle + export/import
│   │   ├── traffic.js            # Traffic read/delete/stats
│   │   ├── collaborators.js      # Invite generation, collaborator list, admin promotion
│   │   └── invite.js             # Invite preview + acceptance (open, no owner required)
│   ├── proxy/
│   │   ├── config.js             # Proxy defaults (timeout, changeOrigin, etc.)
│   │   ├── proxyHandler.js       # createFaultendProxy, executeProxy, executeProxyWithTransform
│   │   └── router.js             # Applies rules engine, dispatches mock/proxy
│   ├── rules/
│   │   ├── rulesEngine.js        # findMatchingRule, executeMockRule, executeProxyRule, validateRule
│   │   ├── templateEngine.js     # {{uuid()}}, {{random()}}, etc. in mock bodies
│   │   └── transformEngine.js    # vm.Script sandbox for user JS transforms
│   ├── storage/
│   │   ├── storage.js            # Re-exports everything (users + rules + traffic)
│   │   ├── users.js              # Users, servers, collaborators, invite tokens, roles
│   │   ├── rules.js              # Rules CRUD + ruleFromRow mapping
│   │   └── traffic.js            # logTransaction, getTraffic, clearTraffic, stats
│   └── utils/
│       └── subdomain.js          # Subdomain parsing helpers
│
├── public/                       # Static frontend (no build step)
│   ├── app.html                  # SPA shell
│   ├── landing.html              # Marketing landing page
│   ├── css/
│   │   ├── variables.css         # Design tokens
│   │   ├── components.css        # Shared UI components
│   │   ├── layout.css            # Grid + responsive layout
│   │   ├── drawer.css            # Right-side drawer
│   │   └── app.css               # App-specific + role badge styles
│   └── js/
│       ├── config.js             # API_BASE, buildSubdomainUrl
│       ├── api.js                # All fetch wrappers (servers, rules, traffic, auth, invite)
│       ├── auth.js               # AuthManager (fetchMe, signOut, getLoginUrl)
│       ├── app.js                # Root controller: server list, create/delete server
│       ├── router.js             # Hash router + settings drawer + invite acceptance
│       ├── drawer.js             # DrawerController (open, close, setContent)
│       ├── components.js         # Toast, ConfirmDialog
│       └── views/
│           ├── traffic.js        # Traffic polling + rendering
│           ├── rules.js          # Rules CRUD form + latency + transform fields
│           └── config.js         # Export config view
│
└── tests/
    ├── backend.test.js           # Integration tests (Node.js + real DB)
    └── frontend.spec.js          # Playwright E2E tests
```

---

## Key Technical Decisions

1. **No Build Step:** Vanilla JS ES modules served directly — no Webpack, Vite, or TypeScript.
2. **PostgreSQL for Everything:** Users, servers, rules, traffic, sessions all in one Postgres DB. Schema applied at startup via `db/schema.sql` (idempotent).
3. **Schema Migrations via `DO $$ IF NOT EXISTS $$`:** Each new column or table is wrapped in a guard block so the same `schema.sql` can run safely on a production DB that already has data.
4. **Subdomain Routing:** `app.*` serves the management UI/API; `<server-id>.*` serves the fault proxy. Determined from the `Host` header in `subdomainRouter.js`.
5. **Session Auth:** Passport OAuth with sessions stored in PostgreSQL (`connect-pg-simple`). `MOCK_AUTH_ENABLED=true` adds a `/api/auth/dev-login` shortcut for local development.
6. **vm Sandbox for Transforms:** User-supplied JS runs in a Node.js `vm.Script` with a 1-second timeout. The sandbox only exposes the `res` object — no Node.js globals.
7. **`responseInterceptor` for Proxy Transforms:** `http-proxy-middleware`'s `selfHandleResponse + responseInterceptor` buffers the upstream response so transforms can mutate it before it reaches the client.
8. **Role-Based Collaboration:** `server_collaborators.role` is `collaborator` or `admin`. Owners are identified by `servers.owner_id`. Ownership transfer moves the old owner into the collaborators table as admin atomically.

---

## Related Docs

- [Overview](./overview.md) – Project concept and deployment model
- [Features](./features.md) – Detailed feature lists
- [API Reference](./api-reference.md) – Endpoints and data models
- [Development Workflow](./development.md) – How to run and develop locally
