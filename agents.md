# Faultend Development Context

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
| **API** | `https://app.faultend.com/api/*` |

---

**Secrets & Credentials:** All passwords, API tokens, and deployment credentials are stored in `.env` at the repository root. `.env` is gitignored and must never be committed or pasted into any markdown file. `.env.example` will be an example `.env` without credentials and only variables that are relative to the general application, not the specific deployment and infrastructure chosen by the main project site.
