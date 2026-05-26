# Scaling Strategy for Public Launch

> **Context:** Faultend runs on a single Oracle Cloud free-tier server managed by Coolify, with a single Node.js container and PostgreSQL on the same host. This document is a living guide for how to scale as traffic grows.

---

## Current State Snapshot

| Component | Current Setup | Risk Level |
|-----------|---------------|------------|
| **App runtime** | Single Node.js process (`node src/index.js`) | **HIGH** — one core only |
| **DB** | PostgreSQL on `localhost` (same server) | **HIGH** — resource contention |
| **Rules lookup** | `SELECT * FROM rules WHERE server_id = $1` on **every proxy request** | **HIGH** — unnecessary DB round-trip |
| **Traffic logging** | `INSERT` + `COUNT` + `DELETE` in the request path | **HIGH** — synchronous DB writes block proxy throughput |
| **Connection pool** | Default `pg.Pool()` (10 conns, no explicit tuning) | **MEDIUM** — will saturate under load |
| **Rate limiting** | **Not implemented** (see #99) | **HIGH** — free-tier abuse risk |
| **Static assets** | Served by Express (`express.static`) | **MEDIUM** — wastes Node.js event loop |
| **Sessions** | `connect-pg-simple` (DB-backed) | **MEDIUM** — adds DB load per request |
| **Metrics** | Prometheus counter only (`proxy_requests_total`) | **MEDIUM** — no latency histograms or resource metrics |
| **Reverse proxy** | Traefik (Coolify-managed) | **LOW** — not the bottleneck |

**Server:** Oracle Cloud Always Free tier (exact spec unknown; likely 1–4 ARM cores, 1–24 GB RAM).

---

## Bottleneck Deep-Dive

### 1. Single Node.js Process
Node.js is single-threaded. One process = one CPU core. On a 4-core ARM server, 75 % of CPU capacity is idle while requests queue up.

### 2. DB Writes on the Hot Path
Every proxied request currently triggers:

1. `getServer(serverId)` — `SELECT` from `servers`
2. `findMatchingRule(serverId)` — `SELECT` from `rules`
3. `logTransaction()` — `INSERT` into `traffic` + `COUNT(*)` + potential `DELETE`

Steps 1 and 2 happen synchronously before the response. Step 3 is fire-and-forget (`.catch()`), but it still grabs a DB connection from the pool. Under burst load the pool empties and new requests wait.

### 3. No In-Memory Caching
Rules change maybe once per hour, yet they are fetched from PostgreSQL for **every single request**. The `traffic` table also has a hard cap of 1 000 rows per server (`MAX_LOGS = 1000`), but the `COUNT(*)` to enforce it still runs.

### 4. No Rate Limiting
A single misconfigured client or a motivated abuser can send thousands of requests per minute, exhausting the DB pool and driving CPU to 100 %.

---

## Scaling Phases

We define three phases. Each phase has **clear entry triggers** so you know exactly when to move to the next one.

| Phase | Name | Cost | Goal | When to Start |
|-------|------|------|------|---------------|
| **0** | Pre-Launch Hardening | €0 | Remove single-process and DB hot-path bottlenecks | **Now — before launch** |
| **1** | Vertical Scaling | €0–15/mo | Max out the current server, separate DB, add caching | CPU > 70 % sustained, p95 latency > 500 ms |
| **2** | Horizontal Scaling | €30–80/mo | Multiple app containers, managed DB, CDN | All CPU cores > 80 %, DB pool still saturated after Phase 1 |
| **3** | SaaS-Grade | €100–250/mo | Multi-region, object storage for logs, read replicas | 1 000+ concurrent users, enterprise demand |

---

## Phase 0: Pre-Launch Hardening (Do Before Public Launch)

> **Expected outcome:** You should be able to handle ~200–500 concurrent proxy requests/sec on the current hardware before CPU or DB becomes the limit.

### 0.1 Enable Node.js Cluster Mode

**Problem:** Single process = single core.  
**Fix:** Fork one worker per CPU core using the native `cluster` module.

**Change `src/index.js`:**

```js
const cluster = require('cluster');
const os = require('os');

const PORT = process.env.PORT || 3000;
const numWorkers = process.env.WORKERS || os.cpus().length;

if (cluster.isPrimary) {
  console.log(`[INIT] Primary ${process.pid} spawning ${numWorkers} workers`);
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker) => {
    console.error(`[INIT] Worker ${worker.process.pid} died, restarting...`);
    cluster.fork();
  });
} else {
  // existing start() logic goes here
  start();
}
```

**Coolify note:** If Coolify health checks fail with multiple processes, keep `PORT=3000` and ensure the health endpoint (`/health`) is handled by the Express app before clustering logic.

### 0.2 Tune the PostgreSQL Connection Pool

**Change `src/db/pool.js`:**

```js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/faultend',
  max: 20,                    // default is 10; bump to 20 for bursty proxy loads
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
```

Also add `pgbouncer` (see Phase 1) if you still see pool exhaustion.

### 0.3 Add In-Memory Rule Cache

Rules are read-heavy, write-light. Cache them for 30 seconds per server.

**New file `src/rules/ruleCache.js`:**

```js
const cache = new Map();
const TTL_MS = 30000;

function getCachedRules(serverId, fetcher) {
  const entry = cache.get(serverId);
  if (entry && Date.now() - entry.ts < TTL_MS) {
    return entry.rules;
  }
  // Caller is responsible for awaiting the fetcher
  return null;
}

function setCachedRules(serverId, rules) {
  cache.set(serverId, { rules, ts: Date.now() });
}

function invalidateCache(serverId) {
  cache.delete(serverId);
}

module.exports = { getCachedRules, setCachedRules, invalidateCache };
```

**Wire it into `findMatchingRule` in `src/rules/rulesEngine.js`:**

```js
const { getCachedRules, setCachedRules } = require('./ruleCache');

async function findMatchingRule(serverId, request) {
  let rules = getCachedRules(serverId);
  if (!rules) {
    rules = await getAllRules(serverId);
    setCachedRules(serverId, rules);
  }
  // ... rest of matching logic
}
```

**Invalidate on mutation:** Call `invalidateCache(serverId)` inside `addRule`, `updateRule`, `deleteRule`, `toggleRule`, `reorderRules`, and `importRules` in `src/storage/rules.js`.

### 0.4 Implement Rate Limiting

**Why:** Free tier is capped at 200 req/min (see #99). We need to enforce this before launch or a single user can starve the whole server.

**Short-term (no Redis):** Use an in-memory rate limiter.

```js
// src/middleware/rateLimit.js
const limits = new Map(); // serverId -> { count, resetAt }

function rateLimitWindowMs() { return 60000; }
function rateLimitMaxRequests() { return 200; }

function checkRateLimit(serverId) {
  const now = Date.now();
  const window = rateLimitWindowMs();
  const max = rateLimitMaxRequests();

  let entry = limits.get(serverId);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + window };
    limits.get(serverId);
  }
  entry.count++;

  if (entry.count > max) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true, remaining: max - entry.count };
}

module.exports = { checkRateLimit };
```

**Wire into proxy router:** Before executing a rule, call `checkRateLimit(req.serverId)`. If disallowed, return `429 Too Many Requests`.

> **Caveat:** In-memory limits reset on container restart and do not span multiple processes in cluster mode. For Phase 1+ switch to Redis-backed rate limiting.

### 0.5 Make Traffic Logging Async & Non-Blocking

Current code does `logTransaction(...).catch(...)` which is fine, but the `enforceMaxLogs` call does a `COUNT(*)` + `DELETE` inside the same promise. Under load this hammers the DB.

**Fix:** Move log cleanup to a background interval, not the request path.

**Change `src/storage/traffic.js`:**

```js
// Remove enforceMaxLogs from logTransaction
async function logTransaction(serverId, transactionData) {
  // ... existing INSERT logic, but REMOVE the await enforceMaxLogs() line
}

// Run cleanup every 60 seconds instead of per-request
setInterval(async () => {
  try {
    // You need a list of all server internal IDs; run a single query
    const result = await pool.query('SELECT id FROM servers');
    for (const row of result.rows) {
      await enforceMaxLogs(row.id);
    }
  } catch (e) {
    console.error('[TRAFFIC] Background cleanup error:', e.message);
  }
}, 60000);
```

### 0.6 Enable Cloudflare CDN for Static Assets

**Current:** `app.faultend.com` and `faultend.com` DNS records are **DNS-only** (orange cloud off).  
**Fix:** In Cloudflare, turn on the orange cloud (Proxied) for:

- `faultend.com`
- `*.faultend.com`

**Benefits:**
- Static assets (CSS, JS, images) are cached at Cloudflare edge nodes.
- Reduced bandwidth egress from Oracle Cloud.
- DDoS protection at the edge.

**Caveat:** Ensure `/* /api/*` and `[server].faultend.com` proxy routes are not cached. Create a Cloudflare Page Rule:

- `app.faultend.com/api/*` → Cache Level: Bypass
- `*.faultend.com` (if proxy subdomains) → Cache Level: Bypass

### 0.7 Add Basic Application Metrics

**Prometheus metrics are already scaffolded** (`src/observability/metrics.js`). Expand them:

```js
// In metrics.js, add:
const _proxyLatencyHistogram = new Histogram({
  name: 'proxy_request_duration_seconds',
  help: 'Proxy request latency',
  labelNames: ['server_id', 'rule_action'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [_registry],
});

// In proxyHandler.js / rulesEngine.js, record:
metrics.observeProxyLatency(serverId, action, durationSeconds);
```

**Enable in production:** Set `METRICS_ENABLED=true` in Coolify. Scrape from `https://faultend.com/metrics` (protected by `METRICS_TOKEN`).

---

## Phase 1: Vertical Scaling (Max Out the Current Server)

> **Trigger:** After Phase 0, you still see CPU > 70 % for 5+ minutes, or p95 latency > 500 ms.

### 1.1 Upgrade Oracle Cloud Instance (If on Micro Tier)

Oracle Cloud Always Free has two tracks:

- **VM.Standard.E2.1.Micro:** 1/8 OCPU, 1 GB RAM — will die at launch.
- **VM.Standard.A1.Flex:** Up to 4 OCPUs, 24 GB RAM (Always Free eligible if you claimed it).

**Action:** If you are on Micro, resize to A1.Flex immediately. If already on A1.Flex, allocate all 4 OCPUs and 24 GB RAM.

### 1.2 Separate PostgreSQL into a Dedicated Service

**Current:** PostgreSQL is on the same server as the app, competing for CPU and memory.

**Option A (same server, dedicated container):**
In Coolify, create a **Service** for PostgreSQL. This lets Coolify allocate dedicated memory/CPU limits.

**Option B (managed database — recommended for Phase 2):**
- **Neon** (serverless PostgreSQL, free tier: 0.5 GB storage, good for early growth)
- **Supabase** (free tier: 500 MB)
- **AWS RDS** (overkill and expensive for this stage)

**Decision:** Start with Option A to keep latency low. Move to Option B when you need backups and point-in-time recovery.

### 1.3 Add PgBouncer (Connection Pooler)

Even with 20 connections in the app, PostgreSQL itself can become the bottleneck under hundreds of concurrent requests.

**Fix:** Run PgBouncer as a sidecar container in the `coolify` Docker network. It multiplexes many app connections into a smaller number of actual PostgreSQL backend connections.

```yaml
# Add to docker-compose.yml (or as a Coolify service)
pgbouncer:
  image: pgbouncer/pgbouncer:latest
  environment:
    DATABASES_HOST: postgres
    DATABASES_PORT: 5432
    DATABASES_DATABASE: faultend
    DATABASES_USER: faultend
    POOL_MODE: transaction
    MAX_CLIENT_CONN: 200
    DEFAULT_POOL_SIZE: 25
  networks:
    - coolify
```

Update `DATABASE_URL` to point to `pgbouncer:5432` instead of `localhost:5432`.

### 1.4 Add Redis for Sessions, Rate Limits, and Cache Coherence

**Why:** In cluster mode (Phase 0.1), each Node.js worker has its own in-memory cache and rate-limit counters. A user hitting worker #1 may be rate-limited, but worker #2 has no idea.

**Fix:** Run a Redis container and switch:

- Sessions: `connect-redis` instead of `connect-pg-simple`
- Rate limits: Redis `INCR` with `EXPIRE`
- Rule cache: Use Redis with a TTL so all workers share the same cache

```yaml
# docker-compose.yml
redis:
  image: redis:7-alpine
  restart: unless-stopped
  networks:
    - coolify
```

**Estimated cost:** Redis uses ~50 MB RAM. Negligible on a 24 GB server.

### 1.5 Container Resource Limits in Coolify

In the Coolify UI for the `faultend` application, set:

| Resource | Limit | Reason |
|----------|-------|--------|
| **CPU** | 3 cores (leave 1 for PostgreSQL/Redis/Traefik) | Maximize Node.js throughput |
| **Memory** | 4 GB (adjust if needed) | Buffer proxy bodies, Node.js heap |
| **Health check** | Keep 30s interval | Don't over-check |

---

## Phase 2: Horizontal Scaling (Multiple App Containers)

> **Trigger:** After Phase 1, all CPU cores are > 80 %, or the DB pool is still saturated even with PgBouncer.

### 2.1 Move to a Paid VPS Provider (Recommended)

Oracle Cloud free tier is generous, but paid instances on Hetzner or DigitalOcean are cheaper per core and easier to manage.

| Provider | Spec | Price/mo | Notes |
|----------|------|----------|-------|
| **Hetzner Cloud** | 4 vCPU, 8 GB RAM | ~€6 | Best price/performance |
| **Hetzner Cloud** | 8 vCPU, 16 GB RAM | ~€12 | Plenty for 1 000+ users |
| **DigitalOcean** | 4 vCPU, 8 GB RAM | ~$48 | Managed Kubernetes option |
| **AWS Lightsail** | 4 vCPU, 8 GB RAM | ~$40 | Simple, predictable pricing |

**Recommended path:** Hetzner CPX31 (4 vCPU, 8 GB) at €6/month. Run Coolify on it exactly as you do now, but with more headroom.

### 2.2 Run Multiple Faultend Containers

Coolify can run multiple instances of the same application. You have two options:

**Option A: Multiple ports, Traefik load balancing**

Modify `docker-compose.yml` to define multiple replicas via Coolify's **"Deploy with Docker Swarm"** or simply duplicate the service block with different container names and ports.

Traefik already supports load balancing across multiple backends:

```yaml
labels:
  - "traefik.http.services.faultend.loadbalancer.server.port=3000"
```

If you run two containers (`faultend-1` on 3000, `faultend-2` on 3001`), add both to the same Traefik service:

```yaml
# faultend-1
labels:
  - "traefik.http.services.faultend.loadbalancer.server.port=3000"

# faultend-2
labels:
  - "traefik.http.services.faultend.loadbalancer.server.port=3001"
```

**Option B: Docker Swarm mode**

If Coolify supports Swarm on your server, enable it. Then set `replicas: 3` in the Compose file. Traefik automatically discovers all replicas via Docker labels.

### 2.3 External Managed Database

When PostgreSQL on the same server becomes the bottleneck, move to a managed provider.

| Provider | Plan | Price/mo | Best For |
|----------|------|----------|----------|
| **Neon** | Free tier | €0 | 0.5 GB storage, start here |
| **Neon** | Launch | ~$19 | 10 GB, auto-scaling compute |
| **Supabase** | Free/Pro | $0/$25 | Auth included (could replace custom OAuth) |
| **AWS RDS** | db.t4g.micro | ~$15 | If already in AWS ecosystem |

**Latency consideration:** If your server is in EU-Central (Frankfurt), pick a managed DB in the same region. Cross-region DB latency adds ~20–50 ms per query.

### 2.4 Object Storage for Traffic Logs

PostgreSQL is not ideal for high-volume, time-series log data. At scale, synchronous `INSERT` into Postgres becomes the dominant bottleneck.

**Option A: S3-compatible object storage (MinIO, Contabo, AWS S3)**
- Write traffic logs as JSONL files to S3.
- Query via Athena or a small log-viewer worker.

**Option B: Time-series database**
- **InfluxDB** or **TimescaleDB** (PostgreSQL extension) for fast writes and time-range queries.

**Decision:** Keep Postgres for metadata (users, servers, rules). Move traffic logs to S3/MinIO once you exceed ~10 000 logged requests per minute.

---

## Phase 3: SaaS-Grade Infrastructure

> **Trigger:** 1 000+ concurrent users, enterprise customers, or latency requirements < 100 ms globally.

### 3.1 Multi-Region Deployment

If your users are global, deploy Faultend containers in:

- **EU-Central** (Frankfurt) — primary
- **US-East** (Virginia) — secondary
- **Asia-Pacific** (Singapore) — tertiary

**Traefik + GeoDNS:** Use Cloudflare Load Balancer or AWS Route 53 latency-based routing to route users to the nearest region.

**Shared state:** Managed PostgreSQL (Neon/Supabase) and Redis (Upstash) are replicated across regions.

### 3.2 Read Replicas for PostgreSQL

Offload read-heavy queries (traffic logs, stats, server lists) to read replicas.

**Implementation:**
- Primary DB: writes (rules mutations, user creation)
- Read replica: reads (traffic viewer, stats, server list)

Update `src/db/pool.js` to support a read pool:

```js
const writePool = new Pool({ connectionString: process.env.DATABASE_URL });
const readPool = new Pool({ connectionString: process.env.DATABASE_REPLICA_URL || process.env.DATABASE_URL });
```

### 3.3 Queue-Based Log Ingestion

Instead of `INSERT` on the request path, publish log events to a message queue (Redis Streams, RabbitMQ, or AWS SQS). A background worker batch-inserts them.

**Benefit:** Request path is completely decoupled from log persistence. Proxy latency drops by 5–20 ms.

---

## Decision Matrix: When to Move to the Next Phase

| Signal | Threshold | Action |
|--------|-----------|--------|
| **CPU usage** | > 70 % for 5 min | Phase 1: allocate more cores, tune DB |
| **Memory usage** | > 80 % sustained | Phase 1: add RAM, check for memory leaks |
| **p95 proxy latency** | > 500 ms | Phase 1: PgBouncer, Redis, rule cache |
| **DB connections saturated** | `pool.waitingCount > 5` | Phase 1: PgBouncer; Phase 2: managed DB |
| **All CPU cores > 80 %** | After Phase 1 tuning | Phase 2: second server / more replicas |
| **Static asset bandwidth** | > 50 % of total egress | Phase 0: Cloudflare CDN |
| **Traffic log volume** | > 10 000 inserts/min | Phase 2: object storage for logs |
| **User count** | > 1 000 active | Phase 3: managed DB, read replicas |

---

## Monitoring & Alerting Setup

You cannot scale reactively without knowing your numbers. Set up the following **before launch**.

### Application Metrics (Prometheus)

Already partially implemented. Ensure these are scraped:

| Metric | Source | Alert If |
|--------|--------|----------|
| `proxy_requests_total` | `metrics.js` | N/A (counter) |
| `proxy_request_duration_seconds` | Add to `metrics.js` | p95 > 500 ms |
| `nodejs_active_handles` | `collectDefaultMetrics` | > 500 (event loop starvation) |
| `nodejs_heap_size_used_bytes` | `collectDefaultMetrics` | > 80 % of heap limit |
| `pg_pool_waiting_count` | Add custom metric | > 5 (pool exhaustion) |

### Infrastructure Metrics

| Tool | Setup | What It Shows |
|------|-------|---------------|
| **Coolify Sentinel** | Enable in Coolify UI | CPU, RAM, disk per container |
| **Cloudflare Analytics** | Built-in | Requests, bandwidth, cache hit ratio |
| **Oracle Cloud Monitoring** | Built-in | Server-level CPU, network, disk I/O |

### Simple Alerting (No Complex Stack Needed)

Use a 15-minute cron job on the server that checks `https://faultend.com/metrics` and sends an email or Slack webhook if thresholds are breached.

```bash
#!/bin/bash
# /home/opc/health-check.sh
METRICS=$(curl -s https://faultend.com/metrics -H "Authorization: Bearer $METRICS_TOKEN")
# Parse with simple grep/awk; if p95 latency > 500ms, alert
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Faultend p95 latency > 500ms"}' \
  YOUR_SLACK_WEBHOOK_URL
```

---

## Cost Roadmap

| Phase | Monthly Cost | What You Get |
|-------|--------------|--------------|
| **Now** (Phase 0) | €0 | Oracle Cloud Free Tier |
| **Phase 1** | €0–15 | A1.Flex maxed out, maybe Neon Launch |
| **Phase 2** | €30–80 | Hetzner CPX31 + Neon Pro + Cloudflare Pro |
| **Phase 3** | €100–250 | Multi-region Hetzner + managed DB + S3 |

**Cost-conscious tip:** Hetzner is ~3× cheaper than AWS/DigitalOcean for equivalent compute. Stay on Hetzner until you need managed Kubernetes or specific compliance.

---

## Launch-Day Checklist

Before you announce publicly, verify:

- [ ] `WORKERS` env var set in Coolify (cluster mode enabled)
- [ ] Rule cache is active (`src/rules/ruleCache.js` wired in)
- [ ] Rate limiting returns `429` when exceeded
- [ ] `enforceMaxLogs` runs in a background interval, not per-request
- [ ] `DATABASE_URL` uses a pool size of 20
- [ ] Cloudflare orange cloud is ON for static assets
- [ ] `METRICS_ENABLED=true` and `/metrics` returns data
- [ ] Health check `curl https://faultend.com/health` returns `200`
- [ ] Load test with `k6` or `autocannon` simulating 200 req/min per server

---

## Related Documents

- [Infrastructure & Operations](./infrastructure.md) — Server, DNS, Coolify details
- [Deployment Guide](./deployment.md) — How to deploy changes
- [Architecture](./architecture.md) — Application design decisions
- [Issue #108](https://github.com/dalogax/faultend/issues/108) — Public launch epic
