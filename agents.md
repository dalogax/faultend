# Faultend Development Context

**Last Updated:** April 28, 2026

**Faultend** is a lightweight proxy tool designed to help developers and testers validate the resilience of mobile and web applications against unreliable backend behavior.

---

## Documentation Index

This file is the central index for AI assistants working on Faultend. Detailed information has been split into focused documents below:

| Document | Purpose |
|----------|---------|
| **[Overview](./docs/overview.md)** | What Faultend is, core concept, key features, proxy-as-rule decision, deployment model |
| **[Workflow](./docs/workflow.md)** | Step-by-step use case workflow for testing with Faultend |
| **[Architecture](./docs/architecture.md)** | Backend/frontend tech stack, architecture flow diagram, directory structure, key technical decisions |
| **[Features](./docs/features.md)** | Detailed list of user-facing and backend capabilities |
| **[API Reference](./docs/api-reference.md)** | HTTP endpoints, data models, template functions, export format |
| **[Testing](./docs/testing.md)** | Test suite details, running commands, coverage summary |
| **[Development Workflow](./docs/development.md)** | Local setup, branching, PR workflow, code style, repo hygiene |
| **[Deployment Guide](./docs/deployment.md)** | How to deploy, restart, rollback, and troubleshoot production |
| **[Infrastructure & Operations](./docs/infrastructure.md)** | Server details, Coolify, Traefik, Cloudflare DNS, networking |
| **[README.md](./README.md)** | User-facing quick start and feature overview |
| **[INSTALL.md](./INSTALL.md)** | Generic installation instructions for self-hosting with Traefik |

**Secrets & Credentials:** All passwords, API tokens, and deployment credentials are stored in `.env` at the repository root. `.env` is gitignored and must never be committed or pasted into any markdown file.

---

## Quick Reference

| Resource | Link / Value |
|----------|--------------|
| **GitHub Repo** | `https://github.com/dalogax/faultend` |
| **Production Domain** | `https://faultend.com` |
| **App UI** | `https://app.faultend.com` |
| **Admin API** | `https://admin.faultend.com` |
| **Coolify Dashboard** | `https://coolify.dalogax.com` |
| **Server IP** | `158.101.198.12` |

---

## High-Level Constraints

- **Subdomain Architecture:** All routing via subdomains (`admin` / `app` / `[server-id]`)
- **No `/api` prefix:** Subdomain provides the API context
- **Rules-Based Routing:** All proxy/mock behavior is configured through prioritized rules
- **Data Limit:** In-memory storage limited to 1000 transactions per server
- **Content Type:** Focus on JSON; other content types are supported but not optimized
- **Environment:** Use `.env` for configuration (`SAMPLE_DATA`, `ROOT_DOMAIN`, `PORT`)
