# Development Workflow & Repository Management

This document covers how to develop Faultend locally, manage the repository, and move code safely from development to production.

---

## Repository

| Property | Value |
|----------|-------|
| **GitHub URL** | `https://github.com/dalogax/faultend` |
| **Default Branch** | `main` |
| **Clone URL (HTTPS)** | `https://github.com/dalogax/faultend.git` |
| **Clone URL (SSH)** | `git@github.com:dalogax/faultend.git` |

---

## Local Development Setup

### Prerequisites
- Node.js `20.18.1` (see `.tool-versions` for exact version)
- npm
- Docker (optional, for local deployment testing)

### Install & Run

```bash
# Clone the repository
git clone https://github.com/dalogax/faultend.git
cd faultend

# Install dependencies
npm install

# Start with sample data and hot-reload (uses .env)
npm run dev

# Or start without sample data
npm start
```

### Access Points (Local)
- **App UI:** `http://app.localhost:3000`
- **Admin API:** `http://admin.localhost:3000/servers`
- **Proxy (any server ID):** `http://<server-id>.localhost:3000`

> Local development relies on wildcard DNS resolution for `*.localhost`. If your OS does not support this, add entries to `/etc/hosts` (e.g., `127.0.0.1 app.localhost admin.localhost dev-api.localhost`).

### Expected Output
- Server starts on port 3000
- If `SAMPLE_DATA=true`: creates 3 test servers (`dev-api`, `staging`, `mobile-api`) with 7 sample rules
- All API endpoints functional at subdomain routes:
  - `http://admin.localhost:3000/servers` – Admin API
  - `http://app.localhost:3000/servers/:id/rules` – Rules API
  - `http://app.localhost:3000/servers/:id/traffic` – Traffic API
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

Local settings are controlled by `.env` at the repository root:

```env
SAMPLE_DATA=true       # Populate test servers and rules on startup
ROOT_DOMAIN=localhost  # Base domain for subdomain routing
PORT=3000              # Local server port
```

**`.env` is ignored by Git.** Do not commit it. If you add new environment variables that other developers need, update `.env.example` (create it if it doesn't exist) with empty values and documentation.

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
- **Backend:** Traffic API, Rules API, Admin API, proxy routing, rules engine, templates
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

## Pull Request Workflow

1. **Branch:** `git checkout -b feature/<description>`
2. **Develop:** Make changes, run tests locally
3. **Commit:** `git commit -m "feat: description"`
4. **Push:** `git push -u origin feature/<description>`
5. **Open PR:** On GitHub, open a PR against `main`
6. **Review:** Ensure tests pass; review changes for style and correctness
7. **Merge:** Squash or merge commit as appropriate
8. **Deploy:** Coolify auto-deploys `main` (see [Deployment Guide](./deployment.md))

---

## Release Process

There is no formal versioning pipeline yet. Releases are implicit:

1. Merge tested code to `main`
2. Coolify detects the push and deploys
3. Verify production health:
   ```bash
   curl -s https://faultend.com/health
   curl -s https://app.faultend.com
   curl -s https://admin.faultend.com/servers
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
- `data/*.json`
- `*.log`
- Playwright artifacts (`test-results/`, `playwright-report/`)
- Local screenshots or scripts with secrets

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
