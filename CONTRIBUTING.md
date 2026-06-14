# Contributing to Faultend

Thanks for your interest in contributing. This document covers everything you need to get started.

## Local development setup

### Prerequisites

- Node.js `20.18.1` (see `.tool-versions`)
- npm
- Docker (for local PostgreSQL)

### 1. Start PostgreSQL

```bash
docker run -d \
  --name faultend-pg-dev \
  -e POSTGRES_USER=faultend \
  -e POSTGRES_PASSWORD=faultend \
  -e POSTGRES_DB=faultend \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. Configure environment

```bash
cp .env.example .env
```

For local development, the minimum `.env` is:

```env
DATABASE_URL=postgresql://faultend:faultend@localhost:5432/faultend
SESSION_SECRET=any-random-string-for-local
ROOT_DOMAIN=localhost
PORT=3000
NODE_ENV=development
MOCK_AUTH_ENABLED=true
SAMPLE_DATA=true
```

With `MOCK_AUTH_ENABLED=true`, Google/GitHub OAuth credentials are not required.

### 3. Install and run

```bash
npm install
npm run dev
```

The app starts at `http://app.localhost:3000`. To log in without OAuth, visit `http://app.localhost:3000/api/auth/dev-login`.

> Local subdomain routing relies on wildcard resolution for `*.localhost`. If your OS does not support this, add entries to `/etc/hosts` (e.g., `127.0.0.1 app.localhost`).

## Running tests

```bash
# All tests (backend + frontend)
npm test

# Backend only
npm run test:backend

# Frontend only (Playwright, Chromium + Firefox)
npm run test:frontend
```

Tests must pass before opening a pull request. See [docs/testing.md](docs/testing.md) for full details.

## Branching and pull requests

Faultend uses the standard GitHub fork-and-PR workflow:

1. **Fork** the repository on GitHub (click *Fork* on the repo page)
2. **Clone** your fork locally: `git clone https://github.com/your-username/faultend`
3. **Create a branch** in your fork: `git checkout -b feature/my-feature`
4. Make your changes, commit, and push to your fork
5. **Open a pull request** from your fork's branch against `main` on `dalogax/faultend`

Keep commits focused and atomic. Use conventional commit prefixes: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`. Include a summary of what changed and why in the PR body, and add screenshots if the UI changed.

## Code style

- Vanilla JavaScript (ES6+) — no TypeScript, no build step, no frameworks
- No compilation or bundling required; the server runs directly with `node src/index.js`
- Clear, descriptive variable names
- Comments where the intent is not obvious

## DB schema changes

`db/schema.sql` runs on every startup and must be idempotent. New columns require a `DO $$ IF NOT EXISTS $$` guard — see [docs/development.md](docs/development.md#db-schema-changes) for the exact pattern.

## Reporting bugs and discussing ideas

Open an issue on GitHub. For bugs, include steps to reproduce and what you expected vs. what happened. For feature ideas, describe the use case rather than jumping straight to a solution.
