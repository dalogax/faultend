# Phase 11: Authentication, Persistence & Collaboration

**Status:** Planning  
**Last Updated:** April 28, 2026  
**Prerequisites:** Phases 1-10.10 Complete

---

## Overview

This phase transforms Faultend from a single-user, in-memory tool into a **multi-user, persistent, collaborative platform**. Three core capabilities are introduced:

1. **Authentication** — Google OAuth 2.0 login protecting the admin UI and admin API
2. **Persistence** — PostgreSQL replacing in-memory storage
3. **Collaboration** — Server owners can share servers with other logged-in users via invite links

**Key constraint:** Proxy servers (`[server-id].*`) remain **public and unauthenticated**. Only `admin.*` and `app.*` are protected.

---

## Resolved Decisions

| # | Decision | Resolution |
|---|---|---|
| 1 | **Collaborator permissions** | Full edit access (rules, traffic, export/import). Cannot: delete server, manage collaborators, change server settings. Can leave server on their own. |
| 2 | **Invite mechanism** | Magic link per server, multi-use, revocable by owner. Link format: `https://app.faultend.com/invite/{token}`. No expiry. |
| 3 | **Authentication approach** | Server-side sessions with `express-session` + `connect-pg-simple` (PostgreSQL session store). |
| 4 | **Cookie scope** | `domain: '.faultend.com'` — cookie sent to all subdomains. Proxy routes explicitly skip auth middleware. |
| 5 | **Admin API subdomain** | Keep `admin.*` separate. Auth middleware required on both `admin.*` and `app.*`. CORS with credentials remains. |
| 6 | **Data migration** | Clean start. In-memory data is ephemeral. `SAMPLE_DATA` flag seeds PostgreSQL on first startup. |
| 7 | **Database access layer** | Raw `pg` driver + `node-pg-migrate` for schema migrations. No ORM. |
| 8 | **Landing page** | Always static. No auth detection. "Get Started" always goes to `app.*`. |

---

## Database Schema

### Tables

#### `users`

```sql
CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  google_id     VARCHAR(255) NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  name          VARCHAR(255),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

- `google_id` is Google's `sub` claim (stable identifier)
- `email` stored for display; not used as primary key (emails can change)
- No `role` column (no global admin/users distinction in this phase)

#### `servers`

```sql
CREATE TABLE servers (
  id            BIGSERIAL PRIMARY KEY,
  server_id     VARCHAR(255) NOT NULL UNIQUE,  -- user-chosen subdomain (e.g., "dev-api")
  name          VARCHAR(255),
  description   TEXT,
  owner_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_token  VARCHAR(255) UNIQUE,            -- SHA-256 hash of the invite token
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

- `server_id` remains the user-chosen string used as subdomain
- Globally unique (first-come, first-served on the subdomain namespace)
- `owner_id` is immutable after creation (no ownership transfer in this phase)

#### `rules`

```sql
CREATE TABLE rules (
  id            BIGSERIAL PRIMARY KEY,
  server_id     BIGINT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  priority      INTEGER NOT NULL,
  enabled       BOOLEAN DEFAULT true,
  name          VARCHAR(255),
  method        VARCHAR(10) NOT NULL,
  path_regex    VARCHAR(500) NOT NULL,
  action        VARCHAR(10) NOT NULL CHECK (action IN ('mock', 'proxy')),
  target        TEXT,                           -- for proxy actions
  mock_response JSONB,                          -- for mock actions
  conditions    JSONB DEFAULT '[]',             -- array of condition objects
  request_headers JSONB DEFAULT '{}',           -- header manipulation
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

- `mock_response`, `conditions`, `request_headers` stored as JSONB (same structure as current in-memory format)
- No `version` or optimistic locking in this phase (last-write-wins for rule editing)

#### `traffic`

```sql
CREATE TABLE traffic (
  id            BIGSERIAL PRIMARY KEY,
  server_id     BIGINT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  request_id    VARCHAR(255),                   -- unique per request
  timestamp     TIMESTAMPTZ DEFAULT NOW(),
  request       JSONB NOT NULL,
  response      JSONB,
  duration      INTEGER,                        -- milliseconds
  target        TEXT,
  matched_rule_id BIGINT REFERENCES rules(id) ON DELETE SET NULL,
  error         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_traffic_server_id ON traffic(server_id);
CREATE INDEX idx_traffic_timestamp ON traffic(timestamp DESC);
```

- Same 1000-record limit per server, enforced in application code (FIFO eviction)
- `request` and `response` stored as JSONB (same structure as current)

#### `server_collaborators`

```sql
CREATE TABLE server_collaborators (
  id            BIGSERIAL PRIMARY KEY,
  server_id     BIGINT NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(server_id, user_id)
);
```

- No `role` column (all collaborators have the same permissions in this phase)
- Owner is NOT in this table (owner is defined by `servers.owner_id`)

#### `sessions` (managed by connect-pg-simple)

```sql
-- Created automatically by connect-pg-simple
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);
CREATE INDEX "IDX_session_expire" ON "session" ("expire");
```

---

## Authentication & Authorization

### Authentication Flow (Google OAuth 2.0)

```
User clicks "Sign in with Google" on app.faultend.com
    ↓
Frontend redirects to /auth/google
    ↓
Backend redirects to Google OAuth consent screen
    ↓
User consents, Google redirects to /auth/google/callback?code=...
    ↓
Backend exchanges code for tokens, fetches user profile
    ↓
Backend creates/updates user in PostgreSQL
    ↓
Backend creates session (req.session.regenerate())
    ↓
Backend redirects to app.faultend.com (original page or dashboard)
```

**Session configuration:**
```javascript
app.use(session({
  store: new PgSession({ pool: dbPool }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    domain: '.faultend.com',      // All subdomains
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000  // 30 days
  },
  name: 'faultend.sid'
}));
```

**CSRF protection:**
- `SameSite: 'lax'` is sufficient for this phase
- No explicit CSRF tokens needed (state-changing API calls are authenticated via cookies that are not sent cross-origin by default)
- CORS is restricted to `admin.*` and `app.*` subdomains only

### Authorization Model

**Access checks on every protected endpoint:**

| Endpoint | Requirement |
|---|---|
| `GET /servers` | Authenticated |
| `POST /servers` | Authenticated |
| `GET /servers/:id` | Authenticated + owner OR collaborator |
| `DELETE /servers/:id` | Authenticated + owner only |
| `GET /servers/:id/rules` | Authenticated + owner OR collaborator |
| `POST /servers/:id/rules` | Authenticated + owner OR collaborator |
| `PUT /servers/:id/rules/:ruleId` | Authenticated + owner OR collaborator |
| `DELETE /servers/:id/rules/:ruleId` | Authenticated + owner OR collaborator |
| `GET /servers/:id/traffic` | Authenticated + owner OR collaborator |
| `DELETE /servers/:id/traffic` | Authenticated + owner OR collaborator |
| `GET /servers/:id/export` | Authenticated + owner OR collaborator |
| `POST /servers/:id/import` | Authenticated + owner OR collaborator |
| `POST /servers/:id/invite` | Authenticated + owner only |
| `DELETE /servers/:id/invite` | Authenticated + owner only (revoke) |
| `POST /invite/:token` | Authenticated |
| `GET /invite/:token` | Authenticated (preview) |
| `DELETE /servers/:id/collaborators/:userId` | Authenticated + owner only |

**Middleware hierarchy:**
```
cors → subdomainRouter → session → authRequired → route handlers
```

**`authRequired` middleware:**
- Skips `landing` and `fault-server` route types (always public)
- Checks `req.session.userId` exists
- If missing: returns 401 with `{ error: 'Unauthorized', loginUrl: '/auth/google' }`
- If present: fetches user from DB and attaches to `req.user`

**`requireServerAccess` middleware:**
- Used on all `/servers/:id/*` endpoints
- Checks `req.user.id` === server.owner_id OR exists in `server_collaborators`
- If missing: returns 403 with `{ error: 'Forbidden', message: 'You do not have access to this server' }`

**`requireOwner` middleware:**
- Used on owner-only endpoints (delete server, manage collaborators, manage invite)
- Checks `req.user.id` === server.owner_id
- If missing: returns 403

---

## API Changes

### New Endpoints

#### Authentication

```
GET /auth/google
  Redirects to Google OAuth consent screen.
  Query params: ?redirectTo=/ (optional, where to go after login)

GET /auth/google/callback?code=...
  Handles OAuth callback. Creates/updates user, creates session.
  Redirects to redirectTo or app root.

GET /auth/me
  Returns current user: { id, email, name, avatarUrl }
  401 if not logged in.

POST /auth/logout
  Destroys session, clears cookie.
  Returns { success: true }.
```

#### Sharing / Collaboration

```
POST /servers/:id/invite
  Body: {} (no body needed, generates new token)
  Returns: { inviteUrl: "https://app.faultend.com/invite/abc123..." }
  Owner only. Overwrites any existing invite token.

DELETE /servers/:id/invite
  Revokes the current invite token.
  Owner only. Returns { success: true }.

GET /servers/:id/collaborators
  Returns list of collaborators: [{ id, email, name, avatarUrl, joinedAt }]
  Owner or collaborator.

DELETE /servers/:id/collaborators/:userId
  Removes a collaborator. Cannot remove owner.
  Owner only. Returns { success: true }.

POST /invite/:token
  Accepts invite. Adds current user as collaborator.
  Requires authentication. Returns { serverId, serverName }.

GET /invite/:token
  Previews invite. Returns { serverId, serverName, ownerName }.
  Requires authentication. Does NOT accept the invite.
```

### Modified Endpoints

All existing `admin.*` and `app.*` endpoints now require authentication.

#### `GET /servers` (admin.*)

**Before:** Returns all servers globally.  
**After:** Returns only servers where user is owner OR collaborator.

```json
{
  "servers": [
    {
      "id": "dev-api",
      "name": "dev-api",
      "ownerId": 1,
      "isOwner": true,
      "collaboratorsCount": 2,
      "rulesCount": 5,
      "trafficCount": 128,
      "createdAt": "2026-04-28T10:00:00Z"
    }
  ],
  "count": 1
}
```

#### `POST /servers` (admin.*)

**Before:** Anyone can create a server.  
**After:** Authenticated users only. Sets `owner_id` to current user.

Body unchanged: `{ id, name?, description? }`

#### `GET /servers/:id` (admin.*)

**Before:** Anyone can view any server.  
**After:** Owner or collaborator only.

#### `DELETE /servers/:id` (admin.*)

**Before:** Anyone can delete.  
**After:** Owner only. Returns 403 for collaborators.

#### `GET /servers/:id/rules` (app.*)

**Before:** Anyone can view rules.  
**After:** Owner or collaborator only.

#### All other `/servers/:id/*` endpoints (app.*)

Same pattern: owner or collaborator required.

### Unchanged Endpoints

All proxy traffic on `[server-id].*` remains **completely unauthenticated**.

```
GET /health                    # Still public on all subdomains
ALL /* on [server-id].*       # Still public, no auth checks
```

---

## Frontend Changes

### New UI Components

#### Login State Management

```javascript
// public/js/auth.js
class AuthManager {
  constructor() {
    this.user = null;
    this.loading = true;
  }

  async init() {
    try {
      this.user = await fetchMe();
    } catch (e) {
      this.user = null;
    } finally {
      this.loading = false;
    }
  }

  isLoggedIn() { return !!this.user; }
  getUser() { return this.user; }
}
```

- On `app.html` load: call `GET /auth/me`
- If 401: show login overlay (not redirect — user can still see the landing page via "Get Started")
- If 200: show app UI, attach user info to top bar

#### Login Overlay

- Modal overlay on `app.faultend.com` when not authenticated
- Contains: "Sign in with Google" button
- No separate login page (keeps it simple)
- After login, overlay disappears, app initializes normally

#### User Display in Top Bar

```
+--------------------------------------------------+
| [logo] faultend    Servers         [Avatar] Name ▼ |
+--------------------------------------------------+
```

- Clicking avatar shows dropdown: "Logout"
- No settings/profile page in this phase

#### Share Button in Settings Drawer

```
+----------------------------------+
| Server Settings             [×]  |
+----------------------------------+
| Server ID: dev-api               |
| URL: https://dev-api.faultend.com|
|                                  |
| --- Sharing ---                  |
| [Copy Invite Link]               |
| https://app.faultend.com/inv...  |
|                                  |
| Collaborators:                   |
| • John Doe (Owner)               |
| • Jane Smith                     |
| • Bob Wilson                [×]  |
+----------------------------------+
```

- "Copy Invite Link" generates/regenerates the invite token
- "Revoke Invite" removes the token (existing links stop working)
- Collaborator list shows all collaborators with remove button (owner only)
- Owner cannot remove themselves

#### Invite Acceptance Page

- Visiting `app.faultend.com/invite/:token`
- If not logged in: show login overlay first
- If logged in: show preview (server name, owner name) + "Join Server" button
- After joining: redirect to that server's dashboard
- If already a collaborator: redirect immediately

### Modified UI Components

#### Server List

- Only shows servers user owns or collaborates on
- Owner servers: normal display
- Collaborator servers: small badge "Shared" or show owner's name

#### Settings Drawer

- Owner view: full settings + sharing section
- Collaborator view: read-only server info, no sharing section, no delete button
- "Leave Server" button for collaborators

---

## Implementation Phases

### Phase 11.1: Database Infrastructure

**Goal:** Set up PostgreSQL, migration system, and connection pool.

**Files to create/modify:**
1. `.env` — add `DATABASE_URL`, `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
2. `migrations/001_initial_schema.sql` — create all tables
3. `src/db/pool.js` — PostgreSQL connection pool setup
4. `src/db/migrate.js` — migration runner script
5. `package.json` — add `pg`, `node-pg-migrate`, `connect-pg-simple`, `passport`, `passport-google-oauth20`

**Acceptance criteria:**
- `npm run migrate` creates all tables
- `npm run migrate:down` rolls back
- Connection pool works, can query `SELECT 1`
- Sample data seeds correctly when `SAMPLE_DATA=true`

### Phase 11.2: Data Layer Rewrite

**Goal:** Replace in-memory storage with PostgreSQL queries.

**Files to modify:**
1. `src/storage/storage.js` — rewrite all functions to use SQL
2. `src/rules/rulesEngine.js` — replace `ensureServer()` with explicit server checks
3. `src/traffic/trafficLogger.js` — replace `ensureServer()` with explicit checks
4. `src/api/admin.js` — update to use new storage layer
5. `src/api/rules.js` — update to use new storage layer
6. `src/api/traffic.js` — update to use new storage layer

**Key changes:**
- Remove `ensureServer()` — all code paths must explicitly check server exists
- `getAllServers()` now filters by user access (owner or collaborator)
- `createServer()` now requires `ownerId`
- Traffic FIFO eviction (1000 limit) enforced in `trafficLogger.js`

**Acceptance criteria:**
- All backend tests pass with PostgreSQL backend
- Sample data creates 3 servers with rules on startup
- Traffic logs persist across server restarts
- Creating a server requires authentication (tested in Phase 11.3)

### Phase 11.3: Authentication Backend

**Goal:** Implement Google OAuth and session management.

**Files to create/modify:**
1. `src/auth/passport.js` — Passport Google strategy setup
2. `src/auth/middleware.js` — `authRequired`, `requireServerAccess`, `requireOwner`
3. `src/auth/routes.js` — `/auth/google`, `/auth/google/callback`, `/auth/me`, `/auth/logout`
4. `src/server.js` — add session middleware, auth routes, CORS tightening
5. `src/api/admin.js` — add auth middleware
6. `src/api/rules.js` — add auth middleware
7. `src/api/traffic.js` — add auth middleware

**CORS tightening:**
```javascript
// Replace origin: true with specific origins
app.use(cors({
  origin: [
    `http://app.${ROOT_DOMAIN}`,
    `https://app.${ROOT_DOMAIN}`,
    `http://admin.${ROOT_DOMAIN}`,
    `https://admin.${ROOT_DOMAIN}`
  ],
  credentials: true
}));
```

**Acceptance criteria:**
- `GET /auth/me` returns 401 when not logged in
- `GET /auth/me` returns user when logged in
- `POST /servers` returns 401 when not logged in
- `GET /servers` returns only user's servers when logged in
- Proxy endpoints (`[server-id].*`) still work without auth
- Session persists across browser restarts (30 days)

### Phase 11.4: Collaboration Backend

**Goal:** Implement invite system and collaborator management.

**Files to create/modify:**
1. `src/api/collaborators.js` — invite generation, acceptance, revocation, collaborator CRUD
2. `src/storage/collaborators.js` — SQL queries for collaborators
3. `src/server.js` — mount collaborator routes

**Invite token generation:**
- Use `crypto.randomBytes(32).toString('hex')` for token
- Store SHA-256 hash in DB, return full token in URL
- One token per server (regenerating overwrites)

**Acceptance criteria:**
- Owner can generate invite link: `POST /servers/:id/invite`
- Logged-in user can accept invite: `POST /invite/:token`
- After accepting, server appears in user's server list
- Owner can revoke invite: `DELETE /servers/:id/invite`
- Owner can remove collaborator: `DELETE /servers/:id/collaborators/:userId`
- Collaborator cannot delete server (403)
- Collaborator cannot manage invite (403)

### Phase 11.5: Frontend Authentication

**Goal:** Add login UI and auth state management to the app.

**Files to create/modify:**
1. `public/js/auth.js` — AuthManager class
2. `public/js/api.js` — add `fetchMe()`, `logout()` functions
3. `public/app.html` — add login overlay, user avatar in top bar
4. `public/css/components.css` — add login overlay styles, avatar styles
5. `public/js/app.js` — integrate auth check before loading servers

**Login overlay design:**
- Centered modal with "Sign in with Google" button
- Google button uses Google's brand guidelines (if possible, or simple styled button)
- Overlay blocks all app UI until logged in
- No separate login page

**Acceptance criteria:**
- Unauthenticated user sees login overlay on `app.faultend.com`
- Clicking "Sign in" redirects to Google OAuth
- After OAuth callback, user is logged in, overlay disappears
- User avatar and name appear in top bar
- Logout button works, overlay reappears
- Server list loads only after successful auth

### Phase 11.6: Frontend Collaboration

**Goal:** Add sharing UI to settings drawer and invite acceptance page.

**Files to create/modify:**
1. `public/js/views/settings.js` — sharing section (or modify existing settings drawer logic)
2. `public/js/api.js` — add sharing API functions
3. `public/js/router.js` — add `/invite/:token` route handling
4. `public/css/components.css` — add collaborator list styles

**Acceptance criteria:**
- Owner sees "Share" section in settings drawer
- "Copy Invite Link" button works, copies URL to clipboard
- Collaborator list shows with remove buttons (owner only)
- Collaborator sees "Leave Server" button instead of sharing section
- Visiting `/invite/:token` shows preview page
- Clicking "Join Server" adds user as collaborator
- Joined server appears in user's home page immediately

### Phase 11.7: Testing & QA

**Goal:** Update all tests for auth and collaboration.

**Files to modify:**
1. `tests/backend.test.js` — add auth headers/session cookies to all tests
2. `tests/frontend.spec.js` — add login flow, collaboration flow tests

**New test cases:**
- Backend: OAuth callback creates user, session auth protects endpoints, owner vs collaborator permissions, invite flow
- Frontend: Login overlay, server list filtering, share button, invite acceptance, collaborator removal

**Acceptance criteria:**
- `npm test` passes (backend + frontend)
- All existing functionality works with auth
- Collaboration flow tested end-to-end

---

## Local Development & Testing

### Docker Compose (Recommended)

A `docker-compose.dev.yml` is provided for local development with PostgreSQL:

```bash
# Start everything (postgres + app)
docker compose -f docker-compose.dev.yml up

# The app will auto-run migrations on startup
# Access at: http://app.localhost:3000
```

Services:
- **postgres** — PostgreSQL 16 with persistent volume
- **faultend** — App with hot-reload via volume mounts

### Testing Google OAuth Locally

Real Google OAuth requires HTTPS redirect URIs and a registered app. For local development, use the **mock auth endpoint**:

```bash
# With MOCK_AUTH_ENABLED=true (default in development)
curl http://app.localhost:3000/auth/dev-login
```

This creates a fake user (`dev@faultend.local`) and session instantly. The login overlay shows a "Dev Login" link when running locally.

For real Google OAuth testing:
1. Create OAuth 2.0 credentials at https://console.cloud.google.com/
2. Add authorized redirect URI: `http://app.localhost:3000/auth/google/callback`
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
4. Set `MOCK_AUTH_ENABLED=false` to disable dev login

### Manual Testing Checklist

```bash
# 1. Start services
docker compose up

# 2. Dev login (opens app directly)
open http://app.localhost:3000/auth/dev-login

# 3. Create a server
curl -b cookie.txt -c cookie.txt http://app.localhost:3000/admin/servers \
  -X POST -H "Content-Type: application/json" -d '{"id":"test-api"}'

# 4. Create a proxy rule
curl -b cookie.txt -c cookie.txt \
  http://app.localhost:3000/servers/test-api/rules \
  -X POST -H "Content-Type: application/json" \
  -d '{"priority":100,"method":"*","pathRegex":".*","action":"proxy","target":"https://httpbin.org"}'

# 5. Test proxy (public, no auth needed)
curl http://test-api.localhost:3000/get

# 6. Generate invite link
curl -b cookie.txt -c cookie.txt \
  -X POST http://app.localhost:3000/servers/test-api/invite

# 7. Open invite URL in another browser/incognito to test collaboration
```

## Testing Strategy

### Backend Tests

```javascript
// Auth
GET /auth/me → 401 (no session)
GET /auth/dev-login → 302 redirect (when MOCK_AUTH_ENABLED=true)
GET /auth/google → 302 redirect to Google

// Server access control
POST /servers (no auth) → 401
GET /servers (no auth) → 401
GET /servers/:id (collaborator) → 200
DELETE /servers/:id (collaborator) → 403
GET /servers/:id/rules (collaborator) → 200
POST /servers/:id/rules (collaborator) → 200

// Invite flow
POST /servers/:id/invite (owner) → 200 { inviteUrl }
POST /servers/:id/invite (collaborator) → 403
POST /invite/:token (logged in) → 200
GET /servers (after invite) → includes shared server
DELETE /servers/:id/invite (owner) → 200
POST /invite/:token (after revoke) → 404
```

### Frontend Tests (Playwright)

```javascript
test('shows login overlay when not authenticated', async ({ page }) => {
  await page.goto('http://app.localhost:3000');
  await expect(page.locator('.login-overlay')).toBeVisible();
  await expect(page.locator('.server-list')).not.toBeVisible();
});

test('dev login works locally', async ({ page }) => {
  await page.goto('http://app.localhost:3000/auth/dev-login');
  await page.waitForURL('http://app.localhost:3000/');
  await expect(page.locator('.login-overlay')).not.toBeVisible();
});

test('server list shows only accessible servers', async ({ page }) => {
  // Dev login, create server
  // Clear cookies, dev login as different user
  // Verify server not in list
  // Accept invite, verify server appears
});

test('owner can share server', async ({ page }) => {
  // Dev login, create server
  // Open settings, click "Copy Invite Link"
  // Verify clipboard contains invite URL
});

test('collaborator can edit rules but not delete server', async ({ page }) => {
  // Dev login as collaborator
  // Create rule → success
  // Delete server → 403 error toast
});
```

---

## Security Considerations

| Concern | Mitigation |
|---|---|
| **Auth cookie on proxy subdomains** | Cookie scoped to `.faultend.com`, but proxy routes explicitly skip `authRequired` middleware. Proxy handlers never check auth. |
| **CSRF attacks** | `SameSite: 'lax'` on session cookie. CORS restricted to app/admin subdomains. No state-changing GET endpoints. |
| **Session fixation** | `req.session.regenerate()` called after successful OAuth callback. |
| **Invite link abuse** | One token per server. Owner can revoke. Token is 64-char hex (256 bits). No expiry (user must revoke). |
| **Server ID enumeration** | `GET /servers/:id` returns 404 (not 403) for unauthorized access to prevent leaking server existence. |
| **Rate limiting** | Not in this phase. Add per-IP rate limiting on auth endpoints in future phase. |
| **SQL injection** | Use parameterized queries exclusively via `pg` driver. Never concatenate user input into SQL. |
| **XSS** | No user-generated HTML rendered. All user data escaped in frontend. Session cookie is httpOnly. |

---

## Environment Variables

```bash
# Core
ROOT_DOMAIN=localhost
PORT=3000
NODE_ENV=development
SAMPLE_DATA=true

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/faultend

# Session (generate with: openssl rand -hex 32)
SESSION_SECRET=change-me-to-random-64-char-string

# Google OAuth (https://console.cloud.google.com/)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Development
MOCK_AUTH_ENABLED=true
```

**CRITICAL:** `.env` is gitignored. Use `.env.example` for sharing configuration structure without values.

---

## Open Questions / Future Work

1. **Ownership transfer** — Not in this phase. Only owner can delete. Future: allow transferring ownership before leaving.
2. **Rate limiting** — Proxy servers are public. Add per-IP rate limiting in future phase.
3. **Real-time collaboration** — No WebSocket or real-time sync. Last-write-wins on rule editing. Future: add optimistic locking or operational transforms.
4. **Global admin role** — No super-admin concept. Future: add `users.role = 'admin'` for platform administration.
5. **Audit log** — No tracking of who changed what. Future: add `server_audit_log` table.
6. **API keys for proxy** — Proxy is public. Future: optional API key auth on proxy endpoints for private servers.

---

## Rollback Plan

If issues arise in production:

1. **Database issues:** Can revert to in-memory storage by setting `DATABASE_URL=` (empty) and restoring old `storage.js` logic. Both backends can coexist with a feature flag.
2. **Auth issues:** Can disable auth by setting `AUTH_ENABLED=false` env var, making all endpoints public again (temporary fallback).
3. **OAuth issues:** If Google OAuth is down, users cannot log in. The dev login (`/auth/dev-login`) only works when `MOCK_AUTH_ENABLED=true`, which should never be set in production.

---

## Summary

This phase adds **three major capabilities** while preserving the core proxy behavior:

| Capability | User Impact |
|---|---|
| **Google Login** | Users authenticate once, stay logged in for 30 days |
| **PostgreSQL** | Data persists across restarts, scales beyond memory limits |
| **Collaboration** | Teams can share and jointly manage fault servers |

**Total estimated effort:** 4-6 days of focused development.  
**Risk level:** Medium (auth is always tricky, but Passport.js + sessions is a well-trodden path).  
**Biggest risk:** Cookie domain configuration in production. Must test thoroughly on `*.faultend.com` before shipping.
