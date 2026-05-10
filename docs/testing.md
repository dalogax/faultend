# Testing

This document describes the test suite, how to run it, and what is covered.

---

## Test Suite

### Backend Tests

**~20 integration tests** (`tests/backend.test.js`)

- **Authentication:** Login, logout, session management, dev login
- **Server Management:** Creation, listing, access control
- **Rules API:** CRUD operations, validation, authorization
- **Proxy:** Public routing, no auth required
- **Collaboration:** Invite generation, access permissions

### Frontend Tests

**Playwright end-to-end tests**

- Authentication flow (login overlay, Google OAuth, dev login)
- Server list rendering and management
- Traffic view: Filtering, real-time updates, detail modal
- Rules view: Creation, editing, priority reordering
- Config view: Export functionality
- Drawer interactions
- Toast notifications
- Router navigation

---

## Running Tests

### Automatic (Recommended)

```bash
# Run all tests with automatic Docker orchestration
npm test
```

This command will:
1. Start the Docker environment (`docker-compose.dev.yml`)
2. Wait for PostgreSQL to be ready
3. Run backend integration tests
4. Run Playwright frontend tests
5. **Tear down Docker** automatically (always runs, even on failure)

### Manual (When Docker Already Running)

```bash
# Run tests directly against existing PostgreSQL
npm run test:direct
```

Use this when you already have `docker compose -f docker-compose.dev.yml up` running in another terminal.

---

## How It Works

The `npm test` command runs `scripts/test-with-docker.js`, which handles Docker lifecycle management:

| Step | What happens |
|------|--------------|
| **Start** | `docker compose -f docker-compose.dev.yml up -d --wait` |
| **Wait** | Polls `pg_isready` until PostgreSQL accepts connections |
| **Test Backend** | Runs `tests/backend.test.js` against port 3001 |
| **Test Frontend** | Runs Playwright tests |
| **Teardown** | `docker compose down -v` (always runs in `finally` block) |

### Test Isolation

- Uses `COMPOSE_PROJECT_NAME=faultend-test` so test containers don't conflict with your development environment
- Backend tests start their own server on **port 3001** (separate from the Dockerized app on 3000)
- The `down -v` command cleans up containers and volumes after tests finish

---

## Prerequisites

- Docker and Docker Compose installed
- `docker compose` CLI available
- Port 3001 free for the test server
- Port 5432 free (or adjust `DATABASE_URL` in `docker-compose.dev.yml`)

---

## Test Coverage

- All API endpoints tested with auth/authorization
- All UI interactions tested
- Authentication flows validated
- Access control verified (owner vs collaborator)
- Error handling checked

---

## Related Docs

- [Development Workflow](./development.md) – Local setup and branching
- [docker-compose.dev.yml](../docker-compose.dev.yml) – Test infrastructure
