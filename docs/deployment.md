# Deployment Guide

This document explains how Faultend is deployed to production, how to trigger redeployments, and how to troubleshoot issues.

---

## Architecture

Faultend runs as a single Docker container managed by **Coolify**. Traffic flows like this:

```
Internet → Cloudflare DNS → Server IP → Traefik (80/443) → Faultend Container (3000)
```

- **Traefik** handles HTTPS termination, certificate renewal, and subdomain routing.
- **Coolify** builds the image, starts the container, and monitors health.
- **Cloudflare** provides DNS for `faultend.com` and `*.faultend.com`.

---

## Deployment Trigger

Coolify is configured to deploy from the Git repository. The typical flow is:

1. Merge changes into the `main` branch on GitHub.
2. Coolify detects the push (via webhook or polling) and starts a new deployment.
3. Coolify builds the Docker image using `Dockerfile`.
4. The old container is replaced with the new one (rolling update).
5. Traefik continues routing traffic once the health check passes.

### Manual Redeploy (via Coolify UI)
1. Log in to `<YOUR_COOLIFY_URL>/login` (credentials in `.env`).
2. Navigate to the project: `Project > Environment > faultend`
3. Click the **Redeploy** or **Restart** button on the application tile.
4. Watch the **Deployments** tab for build logs.

### Manual Redeploy (via API)
If an API token has been generated inside Coolify (see [Infrastructure](./infrastructure.md)), you can trigger deployments programmatically:

```bash
# Example: restart application by UUID
curl -X GET "<YOUR_COOLIFY_URL>/api/v1/applications/{uuid}/restart" \
  -H "Authorization: Bearer <COOLIFY_API_TOKEN>"
```

> The UI password cannot be used for API calls. Generate a dedicated token at **Keys & Tokens > API tokens** inside Coolify.

---

## Environment Variables in Production

Coolify injects environment variables into the running container. The production container currently expects at minimum:

| Variable | Production Value | Purpose |
|----------|------------------|---------|
| `ROOT_DOMAIN` | `<YOUR_DOMAIN>` | Subdomain routing base domain |
| `PORT` | `3000` | Internal listening port |
| `SAMPLE_DATA` | `false` | Do not populate sample data in prod |

These should be configured in the Coolify UI under the application's **Environment** tab, or they can be defined in the `.env` file that Coolify reads during deployment.

**Never** set secrets or production credentials in the repository's committed `.env` file; use Coolify's secret environment variable feature instead.

---

## Docker Compose Reference

The `docker-compose.yml` in the repo root is used by Coolify for deployment. Key points:

- **Network:** `coolify` (external, created by Coolify)
- **No published ports:** The container is only reachable through Traefik labels
- **Restart:** `unless-stopped`
- **Traefik labels** define:
  - HTTP → HTTPS redirect
  - Host matching for `<YOUR_DOMAIN>` and any subdomain
  - Let's Encrypt wildcard certificate (`*.<YOUR_DOMAIN>`)

If you modify `docker-compose.yml`, commit and push to `main`, then redeploy via Coolify.

---

## SSL / Certificates

- **Provider:** Let's Encrypt (via Traefik's ACME integration)
- **Wildcard:** Enabled for `*.<YOUR_DOMAIN>`
- **Auto-renewal:** Handled automatically by Traefik; no manual intervention required
- **Validation:** HTTP-01 challenge (standard)

If certificate issues occur:
1. Check Traefik logs in Coolify's **Server > Proxy** section.
2. Verify DNS A records point to the server IP (`<YOUR_SERVER_IP>`).
3. Ensure port 443 is open on the server firewall.

---

## Logs & Monitoring

### Application Logs
1. Open Coolify UI → Project → Environment → `faultend`
2. Click the **Logs** tab
3. View real-time stdout/stderr from the container

### Traefik / Proxy Logs
1. In Coolify, go to **Server > Proxy**
2. Review Traefik access and error logs

### Health Checks
The container exposes a health endpoint at `GET /health`. Traefik uses this to determine if the container is ready to receive traffic. If health checks fail, Traefik stops routing requests and Coolify may restart the container.

---

## Rollback

If a deployment breaks the application:

1. Go to Coolify → `faultend` → **Deployments** tab.
2. Find the last successful deployment.
3. Click **Rollback** (or **Redeploy** the previous stable commit).
4. Alternatively, revert the commit on GitHub and push to `main`; Coolify will redeploy automatically.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `502 Bad Gateway` | Container not running or health check failing | Check Coolify logs; verify `PORT=3000` and app starts |
| `404` on subdomains | Traefik labels misconfigured | Verify `docker-compose.yml` host rules match domain |
| Certificate warning | Let's Encrypt challenge failed | Verify DNS A records; check Traefik proxy logs |
| Build failure | Dependency or Dockerfile error | Read deployment logs in Coolify; test build locally with `docker build .` |
| Slow response | Resource limits or network latency | Check server CPU/memory in Coolify server dashboard |

---

## Useful Commands

```bash
# Build locally to verify Dockerfile
 docker build -t faultend:test .
 docker run -p 3000:3000 --env-file .env faultend:test

# Check running containers on the server (if you have SSH access)
 docker ps --filter name=faultend
 docker logs --tail 100 <container_id>

# Check Traefik routes (if Traefik dashboard is enabled)
 curl -s http://localhost:8080/api/http/routers | jq .
```

---

## Related Docs

- [Infrastructure & Operations](./infrastructure.md) – Server, DNS, and networking details
- [Development Workflow](./development.md) – Local development and testing before deploying
- [Repository Index](../agents.md) – Full project context and architecture
