# Infrastructure & Operations

This document describes the infrastructure stack, networking, and external services used to run Faultend in production. **All secrets are stored in `.env` at the repository root and must never be committed.**

---

## Server Overview

| Property | Value |
|----------|-------|
| **Public IP** | `<YOUR_SERVER_IP>` |
| **OS / Platform** | Linux VPS (ARM64, inferred from deployment environment) |
| **Control Panel** | [Coolify](https://coolify.io/) self-hosted at `<YOUR_COOLIFY_URL>` |
| **Reverse Proxy** | Traefik v3 (managed by Coolify) |
| **Docker Network** | `coolify` (external, created by Coolify) |

All inbound traffic arrives on **TCP 80/443**, is terminated by Traefik, and routed to the Faultend container via Docker labels.

---

## DNS & Domains (Cloudflare)

**Registrar / DNS Provider:** Cloudflare  
**Apex Domain:** `faultend.com`

| Record | Type | Target / Value | Proxied |
|--------|------|----------------|---------|
| `<YOUR_DOMAIN>` | A | `<YOUR_SERVER_IP>` | No (DNS-only) |
| `*.<YOUR_DOMAIN>` | A | `<YOUR_SERVER_IP>` (wildcard) | No (DNS-only) |
| `_acme-challenge.<YOUR_DOMAIN>` | TXT | `<ACME_CHALLENGE_VALUE>` | No |

Subdomains like `app.<YOUR_DOMAIN>` resolve through the wildcard A record. All records point directly to the server IP without Cloudflare proxying (orange cloud off).

**Cloudflare Nameservers:**
- `chris.ns.cloudflare.com`
- `cortney.ns.cloudflare.com`

Cloudflare account credentials and API token are stored in `.env` under `CLOUDFLARE_*` variables. The API token can be used to automate DNS record updates if the server IP ever changes.

| Property | Value |
|----------|-------|
| **Zone ID** | `<CLOUDFLARE_ZONE_ID>` (stored in `.env`) |
| **Account ID** | `<CLOUDFLARE_ACCOUNT_ID>` (stored in `.env`) |

> **Token Validation:** The Cloudflare API token is active and can read zone data. It has been verified to retrieve DNS records for `<YOUR_DOMAIN>`.

---

## Coolify Deployment

Coolify is the primary deployment platform. It manages the Docker container, Traefik routing, SSL certificates, and environment variables.

### Access
- **URL:** `<YOUR_COOLIFY_URL>/login`
- **Credentials:** Stored in `.env` (`COOLIFY_EMAIL`, `COOLIFY_PASSWORD`)
- **Auth Method:** Web UI uses session cookies (`coolify_session`, `XSRF-TOKEN`)
- **API Auth:** Requires a dedicated API token generated inside Coolify at **Keys & Tokens > API tokens**. The UI password does not work for API calls.

### Project Details
| Property | Value |
|----------|-------|
| **Project ID** | `<COOLIFY_PROJECT_ID>` |
| **Environment ID** | `<COOLIFY_ENVIRONMENT_ID>` |
| **Application Name** | `<COOLIFY_APPLICATION_NAME>` |
| **Direct Link** | `<YOUR_COOLIFY_URL>/project/<COOLIFY_PROJECT_ID>/environment/<COOLIFY_ENVIRONMENT_ID>` |

### What Coolify Manages
- Building the Docker image from the repo
- Running the container on the `coolify` Docker network
- Attaching Traefik labels for routing and SSL
- Automatic SSL certificate issuance and renewal via Let's Encrypt
- Container restarts, health checks, and log aggregation
- Environment variable injection into the container

### Checking Status via Web UI
1. Log in to `<YOUR_COOLIFY_URL>/login`
2. Navigate to the project link above
3. Click on the `faultend` application tile
4. Review:
   - **Status** (Running / Stopped / Error)
   - **Health** checks
   - **Deployments** tab for build history
   - **Logs** tab for runtime stdout/stderr
   - **Environment** tab for injected env vars

---

## Reverse Proxy (Traefik)

Traefik is provisioned by Coolify and routes traffic based on Docker labels defined in `docker-compose.yml`.

### Key Labels
- **HTTP → HTTPS redirect** on all matching hosts
- **Host rule:** `<YOUR_DOMAIN>` + regex for subdomains (`^[a-z0-9-]+\.<YOUR_DOMAIN>$`)
- **TLS:** Let's Encrypt certificate resolver with wildcard SAN (`*.<YOUR_DOMAIN>`)
- **Entrypoints:** `http` (80) and `https` (443)

This means any valid subdomain (e.g., `app.<YOUR_DOMAIN>`, `myserver.<YOUR_DOMAIN>`) automatically reaches the Faultend container, and the application itself handles subdomain-based routing.

---

## Container & Image

- **Base Image:** `node:20.18.1-alpine`
- **Port:** `3000` (internal, exposed to Traefik)
- **User:** `node` (non-root)
- **Health Check:** HTTP GET `http://localhost:3000/health` every 30s
- **Restart Policy:** `unless-stopped`

See `Dockerfile` and `docker-compose.yml` in the repository root for full configuration.

---

## Network Security

- No direct public ports are exposed by the Faultend container; only Traefik listens on 80/443.
- Wildcard DNS allows arbitrary subdomains but they all route through Traefik to the same container.
- All secrets (Coolify password, Cloudflare token) live in `.env`, which is already in `.gitignore`.
- **Never** commit `.env` or any file containing secrets to the repository.

---

## Useful Commands

```bash
# Verify DNS resolution
dig <YOUR_DOMAIN> A +short
dig app.<YOUR_DOMAIN> A +short

# Verify endpoints are publicly reachable
curl -s -o /dev/null -w "%{http_code}" https://<YOUR_DOMAIN>
curl -s -o /dev/null -w "%{http_code}" https://app.<YOUR_DOMAIN>/api/servers
curl -s -o /dev/null -w "%{http_code}" https://app.<YOUR_DOMAIN>

# Verify Cloudflare token (requires valid token in .env)
# curl -s -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
#   -H "Authorization: Bearer <CLOUDFLARE_API_TOKEN>"
```

---

## Related Docs

- [Deployment Guide](./deployment.md) – How to deploy, restart, and troubleshoot
- [Development Workflow](./development.md) – Local dev, testing, and repo management
- [Repository Index](../agents.md) – Full project context and architecture
