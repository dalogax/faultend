# Testing

This document describes the test suite, how to run it, and what is covered.

---

## Test Suite

### Backend Tests

**36 integration tests** (`npm run test:backend`)

- **Traffic API:** Filtering, pagination, stats, cleanup
- **Rules API:** CRUD operations, validation, priority ordering
- **Admin API:** Server management, creation, deletion
- **Rules Engine:** Matching logic, conditions, templates
- **Proxy:** Request/response capture, routing

### Frontend Tests

**43 tests × 2 browsers = 86 total** (`npm run test:frontend`)

- Server list rendering and management
- Traffic view: Filtering, real-time updates, detail modal
- Rules view: Creation, editing, priority reordering
- Config view: Export functionality
- Drawer interactions
- Toast notifications
- Router navigation

---

## Running Tests

```bash
# Run all tests (backend + frontend)
npm test

# Backend only (Node.js)
npm run test:backend

# Frontend only (Playwright)
npm run test:frontend
```

---

## Test Coverage

- All API endpoints tested
- All UI interactions tested
- Template functions validated
- Condition matching verified
- Error handling checked

---

## Related Docs

- [Development Workflow](./development.md) – Local setup and CI/CD ideas
