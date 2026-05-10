# Project Overview

**Faultend** is a lightweight proxy tool designed to help developers and testers validate the resilience of mobile and web applications against unreliable backend behavior.

---

## Core Concept

By routing REST + JSON traffic through Faultend, you can inspect real requests and responses in real time and configure flexible routing rules. Rules can either mock responses (return custom status/body/latency) OR proxy to specified backends (forward to real APIs). This enables multi-backend support and complex testing scenarios.

---

## Key Features

- **Subdomain architecture** – Isolated fault servers per subdomain
- Real-time request/response inspection
- **Rules-based routing** (no hardcoded backend URLs)
- **Dual action types**: Mock responses OR proxy to backends
- **Multi-backend support**: Different rules can proxy to different services
- Path regex matching for flexible rule definitions
- Priority-ordered rule evaluation (higher priority first)
- **Enhanced latency control**: Fixed or range-based delays
- **Template variables in mock responses**: Dynamic data generation
- **Conditional rule matching**: Match on headers, query params, body fields
- **Request header manipulation**: Modify headers before proxying
- Custom response status, body, and latency injection
- Enable/disable rules on the fly
- **Export/import rule configurations** as JSON files
- Optimized for REST + JSON APIs

---

## Architecture Decision: Proxy-as-Rule

Unlike traditional proxies with a single hardcoded backend URL, Faultend treats proxying as a configurable rule action. This means:
- No `BACKEND_URL` environment variable
- All routing is explicit and visible in the rules list
- Support for multiple backend services (microservices-friendly)
- Easy to see what traffic goes where
- Default behavior: unmatched requests return 502 (forces explicit routing)

---

## Deployment Model

### Subdomain Architecture
- Wildcard DNS: `*.localhost` (dev) or `*.faultend.com` (prod)
- **App subdomain** (`app.*`) – UI and server management API
- **Fault server subdomains** (`[server-id].*`) – Isolated proxy instances
- Each fault server has isolated rules and traffic logs
- No `/api` prefix – subdomain provides context

### SaaS Model
- Single Faultend deployment serves multiple isolated fault servers
- Each server accessible at `[server-id].faultend.com`
- Managed via app UI at `app.faultend.com`
- Complete data isolation between servers

---

## Constraints & Important Notes

- **Subdomain Architecture:** All routing via subdomains (`app` / `[server-id]`)
- **No `/api` prefix:** Subdomain provides the API context
- **Rules-Based Routing:** All proxy/mock behavior is configured through prioritized rules
- **Data Limit:** In-memory storage limited to 1000 transactions per server
- **Content Type:** Focus on JSON; other content types are supported but not optimized
- **Environment:** Use `.env` for configuration (`SAMPLE_DATA`, `ROOT_DOMAIN`, `PORT`)
- **Testing:** Backend tests disable sample data; frontend tests enable it

---

## Related Docs

- [Workflow](./workflow.md) – Step-by-step use case workflow
- [Architecture](./architecture.md) – Technical architecture and directory structure
- [Features](./features.md) – Detailed feature lists
- [API Reference](./api-reference.md) – Endpoints, data models, and templates
