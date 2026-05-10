# Milestone 11: Authentication, Persistence & Collaboration

**Status:** ✅ Complete  
**Implemented:** May 10, 2026  
**Milestone Tag:** `v1.0.0-auth-db-working` (commit `013a97d`)

---

## Overview

This milestone transformed Faultend from a single-user, in-memory tool into a **multi-user, persistent, collaborative platform**. Three core capabilities were introduced:

1. **Authentication** — Google OAuth 2.0 login protecting the admin UI and admin API
2. **Persistence** — PostgreSQL replacing in-memory storage
3. **Collaboration** — Server owners can share servers with other logged-in users via invite links

**Key constraint:** Proxy servers (`[server-id].*`) remain **public and unauthenticated**. Only `app.*` is protected.

---

## Completed Tasks

### 1. Repository Cleanup

| Task | Status |
|------|--------|
| Rename `migrations/` folder to `db/` | ✅ Done — moved `001_initial_schema.sql` to `db/schema.sql`, updated all references |
| Move `faultend.svg` to `img/` folder | ✅ Done — moved file, updated 7 references across 5 files |
| Consolidate `INSTALL.md` into `docs/` | ✅ Done — moved to `docs/installation.md`, updated `agents.md` reference |
| Remove temp screenshots from root | ✅ Done — deleted 18 `coolify_*.png` files |
| Fix `.env.example` | ✅ Done — removed infrastructure-specific values (coolify, cloudflare) |

### 2. Security Hardening

| Task | Status |
|------|--------|
| Auth middleware validates user exists in DB | ✅ Done — `authRequired` now fetches user from DB, destroys session if invalid |
| Rate limiting on auth endpoints | ✅ Done — simple in-memory rate limiter, 10 req/min per IP, 429 with Retry-After |
| Session regeneration after OAuth | ✅ Done — Google callback now regenerates session to prevent fixation |
| CSRF protection evaluation | ✅ Done — current setup sufficient: SameSite=lax, CORS restricted, no state-changing GETs |

### 3. Documentation

| Task | Status |
|------|--------|
| Refactor `AGENTS.md` | ✅ Done — clean index with "read before action" directives for each doc |
| Update `README.md` | ✅ Done — marked PostgreSQL as implemented, updated tech stack |
| Consolidate plan files | ✅ Done — moved `.github/plan/` to `docs/milestones/`, created `docs/todo.md` |
| Test orchestration docs | ✅ Done — documented `npm test` Docker automation in `docs/testing.md` |

### 4. Dev Infrastructure

| Task | Status |
|------|--------|
| Dev docker-compose.yml | ✅ Verified — PostgreSQL, hot-reload, dev login |
| Test suite updates | ✅ Done — rewritten `tests/backend.test.js` with proper auth flow, collaboration tests |
| Docker test orchestration | ✅ Done — `scripts/test-with-docker.js` starts/stops Docker for `npm test` |

---

## Database Schema

### Tables

- `users` — Google OAuth users (id, google_id, email, name, avatar_url)
- `servers` — Fault servers (id, server_id, name, description, owner_id, invite_token)
- `rules` — Routing rules per server (priority, method, path_regex, action, target, mock_response)
- `traffic` — Request/response logs per server
- `server_collaborators` — Many-to-many join for sharing
- `session` — Managed by connect-pg-simple

All queries use parameterized statements. No SQL injection risk.

---

## Environment Variables (Production)

```bash
# Core
ROOT_DOMAIN=faultend.com
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://postgres:PASSWORD@host:5432/postgres

# Session (generate with: openssl rand -hex 32)
SESSION_SECRET=change-me-to-random-64-char-string

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Development only
MOCK_AUTH_ENABLED=false   # Never true in production
```

**CRITICAL:** `.env` is gitignored. Use `.env.example` for sharing configuration structure without values.

---

## Production URLs

- Landing: https://faultend.com
- App: https://app.faultend.com
- OAuth callback: https://app.faultend.com/auth/google/callback
- Admin API: https://app.faultend.com/api/*

---

## Rollback Plan

If issues arise in production:

1. **Database issues:** Can revert to in-memory storage by setting `DATABASE_URL=` (empty) and restoring old `storage.js` logic.
2. **Auth issues:** Can disable auth by setting `AUTH_ENABLED=false` env var, making all endpoints public again (temporary fallback).
3. **OAuth issues:** If Google OAuth is down, users cannot log in. Ensure `MOCK_AUTH_ENABLED=false` in production.

---

## CSRF Decision

**Current setup is sufficient** for this phase. Rationale:
- Session cookie uses `SameSite: 'lax'` — not sent on cross-origin POSTs
- CORS is restricted to app/admin subdomains only
- All state-changing operations use POST/PUT/DELETE (no GET mutations)
- No sensitive actions can be triggered via simple links

If the app adds sensitive GET endpoints or expands to third-party integrations, explicit CSRF tokens should be added.

---

## Open Questions / Future Work

1. **Ownership transfer** — Not in this phase. Only owner can delete.
2. **Real-time collaboration** — No WebSocket or real-time sync. Last-write-wins on rule editing.
3. **Global admin role** — No super-admin concept.
4. **Audit log** — No tracking of who changed what.
5. **API keys for proxy** — Proxy is public. Future: optional API key auth.
