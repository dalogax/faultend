# Development Workflow & Repository Management

This document covers how to develop Faultend locally, manage the repository, and move code safely from development to production.

---

## Repository

| Property | Value |
|----------|-------|
| **GitHub URL** | `https://github.com/<YOUR_USERNAME>/faultend` |
| **Default Branch** | `main` |
| **Clone URL (HTTPS)** | `https://github.com/<YOUR_USERNAME>/faultend.git` |
| **Clone URL (SSH)** | `git@github.com:<YOUR_USERNAME>/faultend.git` |

---

## Local Development Setup

### Prerequisites
- Node.js `20.18.1` (see `.tool-versions` for exact version)
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

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in the values:

```env
DATABASE_URL=postgresql://faultend:faultend@localhost:5432/faultend
SESSION_SECRET=any-random-string-for-local
ROOT_DOMAIN=localhost
PORT=3000
NODE_ENV=development
MOCK_AUTH_ENABLED=true   # Enables /api/auth/dev-login — no OAuth needed locally
SAMPLE_DATA=true
```

Google/GitHub OAuth credentials are optional for local development when `MOCK_AUTH_ENABLED=true`.

### 3. Install & Run

```bash
npm install
npm run dev
# or: node src/index.js

open http://app.localhost:3000
```

The schema is applied automatically on every startup via `db/schema.sql` — no manual migrations needed.

To log in without OAuth: visit `http://app.localhost:3000/api/auth/dev-login`.

### Access Points (Local)
- **App UI:** `http://app.localhost:3000`
- **API:** `http://app.localhost:3000/api`
- **Proxy (any server ID):** `http://<server-id>.localhost:3000`

> Local development relies on wildcard DNS resolution for `*.localhost`. If your OS does not support this, add entries to `/etc/hosts` (e.g., `127.0.0.1 app.localhost dev-api.localhost`).

### Expected Output
- Server starts on port 3000
- If `SAMPLE_DATA=true`: creates 3 test servers (`dev-api`, `staging`, `mobile-api`) with 7 sample rules
- All API endpoints functional at subdomain routes:
  - `http://app.localhost:3000/api/servers` – Servers API
  - `http://app.localhost:3000/api/servers/:id/rules` – Rules API
  - `http://app.localhost:3000/api/servers/:id/traffic` – Traffic API
  - `http://[server-id].localhost:3000/` – Fault server proxy
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

## Environment Configuration

All settings are controlled by `.env` at the repository root (gitignored). Required variables:

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://faultend:faultend@localhost:5432/faultend` | PostgreSQL connection string |
| `SESSION_SECRET` | `any-random-string` | Signs session cookies |
| `ROOT_DOMAIN` | `localhost` | Base domain for subdomain routing |
| `PORT` | `3000` | HTTP listen port |
| `NODE_ENV` | `development` | Enables trust-proxy in production |
| `MOCK_AUTH_ENABLED` | `true` | Enables `/api/auth/dev-login` (local only) |
| `SAMPLE_DATA` | `true` | Seeds test servers/rules on startup |
| `GOOGLE_CLIENT_ID` | — | Google OAuth (optional locally) |
| `GOOGLE_CLIENT_SECRET` | — | Google OAuth (optional locally) |
| `GITHUB_CLIENT_ID` | — | GitHub OAuth (optional locally) |
| `GITHUB_CLIENT_SECRET` | — | GitHub OAuth (optional locally) |

Do not commit `.env`. If you add a new variable, add it to `.env.example` with an empty value and a comment.

---

## Branching Strategy

We use a simple **trunk-based** workflow:

- **`main`** – Always deployable. All production releases are built from this branch.
- **Feature branches** – Create short-lived branches for new features or fixes:
  ```bash
  git checkout -b feature/my-feature
  ```
- **Pull Requests** – Merge feature branches into `main` via GitHub PRs.

### Commit Style
- Keep commits focused and atomic.
- Use clear messages: `feat: add latency range control`, `fix: handle binary response bodies`, `docs: update deployment guide`.

---

## Testing

Always run tests before opening a PR or merging to `main`.

```bash
# Run all tests (backend + frontend)
npm test

# Backend only (36 integration tests)
npm run test:backend

# Frontend only (Playwright, 43 tests x 2 browsers = 86 total)
npm run test:frontend
```

### What Tests Cover
- **Backend:** Traffic API, Rules API, Servers API, proxy routing, rules engine, templates
- **Frontend:** Server management, traffic viewer, rules CRUD, drawer interactions, export/import

### Adding Tests
- Backend tests: Add to `tests/backend.test.js`
- Frontend tests: Add to `tests/frontend.spec.js`

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

## DB Schema Changes

`db/schema.sql` is the single source of truth. It runs on every startup — so every change must be **idempotent**.

- New tables: use `CREATE TABLE IF NOT EXISTS`
- New columns: wrap in a `DO $$ IF NOT EXISTS $$` block:

```sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'my_table' AND column_name = 'new_column'
    ) THEN
        ALTER TABLE my_table ADD COLUMN new_column TEXT;
    END IF;
END $$;
```

Place migration blocks **before** the corresponding `CREATE TABLE IF NOT EXISTS` so new installs and upgrades both get the column.

---

## Pull Request Workflow

1. **Branch:** `git checkout -b feature/<description>`
2. **Develop:** Make changes, run tests locally
3. **Commit:** `git commit -m "feat: description"`
4. **Push:** `git push -u origin feature/<description>`
5. **Open PR:** On GitHub, open a PR against `main`
6. **Add screenshots** (if UI changed) — see below
7. **Review:** Ensure tests pass; review changes for style and correctness
8. **Merge:** Squash or merge commit as appropriate
9. **Deploy:** Coolify auto-deploys `main` (see [Deployment Guide](./deployment.md))

### PR Body Structure

Every PR should have:

```
## Summary
Closes #<issue>

- Bullet summarising what changed and why (user-visible behaviour first)

## Changes
**Backend:** list of files + what each one does
**Frontend:** list of files + what each one does

## Screenshots
(one screenshot per meaningful UI state — see workflow below)

## Test plan
- [ ] Checkbox items the reviewer should manually verify
```

### Taking Screenshots

Screenshots are **evidence that the UI change works** — take one per meaningful state (e.g. form open, form filled, result visible). Run Playwright from the repo root so `node_modules/playwright` is found:

```javascript
// screenshot_<feature>.js  — run from repo root, delete after use
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({
    executablePath: '/home/dalogax/.cache/ms-playwright/chromium-1224/chrome-linux/chrome',
    headless: true
  });
  const page = await browser.newPage();

  // Log in via dev-login (requires MOCK_AUTH_ENABLED=true)
  await page.goto('http://app.localhost:3000/api/auth/dev-login');
  await page.waitForTimeout(2000);

  // Navigate to the feature and take screenshots
  await page.goto('http://app.localhost:3000/#server/test-server');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/my-feature.png' });

  await browser.close();
})();
```

### Attaching Screenshots to a PR

**Never commit screenshot PNG files to the repository.** Upload them to the persistent `pr-screenshots` GitHub release instead:

```bash
# Upload (--clobber overwrites if the filename already exists)
gh release upload pr-screenshots /tmp/my-feature.png --clobber

# The permanent URL to embed in the PR body:
# https://github.com/dalogax/faultend/releases/download/pr-screenshots/my-feature.png
```

Embed in the PR body as markdown:
```markdown
![description](https://github.com/dalogax/faultend/releases/download/pr-screenshots/my-feature.png)
```

If you need to recover a screenshot that was accidentally committed and then removed:
```bash
git show <commit-sha>:path/to/file.png > /tmp/file.png
```

---

## Release Process

There is no formal versioning pipeline yet. Releases are implicit:

1. Merge tested code to `main`
2. Coolify detects the push and deploys
3. Verify production health:
   ```bash
    curl -s https://<YOUR_DOMAIN>/health
    curl -s https://app.<YOUR_DOMAIN>
    curl -s https://app.<YOUR_DOMAIN>/api/servers
   ```

If you want to add Git tags for versioning:
```bash
git tag -a v0.1.1 -m "Patch release description"
git push origin v0.1.1
```

---

## CI/CD

Currently there are **no GitHub Actions workflows**. All deployment is handled by Coolify's native Git integration.

### Future CI/CD Ideas
- GitHub Actions workflow to run `npm test` on every PR
- Automated Docker image build and push to a registry
- Preview deployments for PRs using Coolify's PR deployment feature

---

## Repository Hygiene

### `.gitignore` Checklist
Ensure these are never committed:
- `.env`
- `node_modules/`
- `*.log`
- Playwright artifacts (`test-results/`, `playwright-report/`)
- Screenshot PNG files (upload to GitHub release instead — see PR workflow above)

### Before Committing
```bash
# Verify nothing sensitive is staged
git diff --cached --name-only

# If you accidentally staged .env
git reset HEAD .env
```

---

## Getting Help

- **Coolify issues:** Check [Coolify Troubleshooting Docs](https://coolify.io/docs/troubleshoot/overview)
- **Traefik issues:** Check labels in `docker-compose.yml` and proxy logs
- **DNS issues:** Verify Cloudflare A records and nameservers
- **Project docs:** See [Repository Index](../agents.md) for full architecture context

---

## Related Docs

- [Overview](./overview.md) – Project concept and feature summary
- [Architecture](./architecture.md) – Technical architecture and directory structure
- [Testing](./testing.md) – Detailed test suite information
- [Deployment Guide](./deployment.md) – How to deploy and troubleshoot in production
- [Infrastructure & Operations](./infrastructure.md) – Server, DNS, and networking details
