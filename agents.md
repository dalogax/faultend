# Faultend Development Context

**Last Updated:** May 10, 2026

**Faultend** is a lightweight proxy tool designed to help developers and testers validate the resilience of mobile and web applications against unreliable backend behavior.

---

## Agent Directives

> **Before performing ANY action related to a domain below, read the linked document first.**

| Before you... | Read this | Why |
|---------------|-----------|-----|
| **Modify code** (backend, frontend, API, routing) | [Architecture](./docs/architecture.md) | Codebase structure, tech stack, routing logic, subdomain system |
| **Add or change a feature** | [Features](./docs/features.md) | Existing capabilities, what's in/out of scope, user-facing behavior |
| **Change how traffic is proxied or mocked** | [Workflow](./docs/workflow.md) | End-to-end user flow, how rules are evaluated, traffic lifecycle |
| **Add, remove, or modify an API endpoint** | [API Reference](./docs/api-reference.md) | Endpoint patterns, data models, auth requirements, response formats |
| **Write or modify tests** | [Testing](./docs/testing.md) | Test structure, running commands, coverage areas, mocking strategy |
| **Set up local development environment** | [Development Workflow](./docs/development.md) | Local setup, dependencies, branching, PR workflow, code style |
| **Deploy to production or troubleshoot a deployment** | [Deployment Guide](./docs/deployment.md) | Deploy pipeline, environment variables, health checks, rollback |
| **Provision infrastructure or debug networking/DNS** | [Infrastructure & Operations](./docs/infrastructure.md) | Server details, Coolify, Traefik, Cloudflare, networking topology |
| **Install on a new server or self-host** | [Installation Guide](./docs/installation.md) | Generic self-hosting instructions with Traefik, domain requirements |
| **Understand the product and its purpose** | [Overview](./docs/overview.md) | Core concept, key features, deployment model, target users |

---

## Quick Reference

| Resource | Link / Value |
|----------|--------------|
| **GitHub Repo** | `https://github.com/dalogax/faultend` |
| **Production Domain** | `https://faultend.com` |
| **App UI** | `https://app.faultend.com` |
| **Admin API** | `https://app.faultend.com/api/*` (same subdomain as app) |

---

## High-Level Constraints

- **Subdomain Architecture:** All routing via subdomains (`app.*` / `[server-id].*`). `admin.*` redirects to `app.*`.
- **No `/api` prefix:** API endpoints live on the `app` subdomain directly.
- **Rules-Based Routing:** All proxy/mock behavior is configured through prioritized rules.
- **Authentication:** Google OAuth 2.0 with server-side sessions. Proxy endpoints remain public.
- **Persistence:** PostgreSQL for users, servers, rules, traffic, and sessions.
- **Content Type:** Focus on JSON; other content types are supported but not optimized.
- **Environment:** Use `.env` for configuration (`DATABASE_URL`, `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, etc.).

**Secrets & Credentials:** All passwords, API tokens, and deployment credentials are stored in `.env` at the repository root. `.env` is gitignored and must never be committed or pasted into any markdown file.
