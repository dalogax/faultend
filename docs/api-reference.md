# API Reference

This document describes the HTTP API endpoints, data models, template functions, and export format used by Faultend.

---

## API Endpoints

All endpoints are on the `app.*` subdomain. All except `/api/auth/*` and `GET /api/invite/:token` require a valid session cookie.

### Auth API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/api/auth/google`          | — | Initiate Google OAuth (accepts `?redirectTo=`) |
| `GET`  | `/api/auth/google/callback` | — | Google OAuth callback |
| `GET`  | `/api/auth/github`          | — | Initiate GitHub OAuth (accepts `?redirectTo=`) |
| `GET`  | `/api/auth/github/callback` | — | GitHub OAuth callback |
| `GET`  | `/api/auth/me`              | — | Current user info (401 if not logged in) |
| `POST` | `/api/auth/logout`          | session | Destroy session |
| `GET`  | `/api/auth/dev-login`       | — | Dev login (only when `MOCK_AUTH_ENABLED=true`) |

### Servers API

| Method   | Path                  | Auth   | Description |
|----------|-----------------------|--------|-------------|
| `GET`    | `/api/servers`        | session | List owned + shared servers |
| `POST`   | `/api/servers`        | session | Create fault server |
| `GET`    | `/api/servers/:id`    | owner  | Get server detail |
| `DELETE` | `/api/servers/:id`    | owner  | Delete server |

### Rules API

| Method   | Path                                        | Auth   | Description |
|----------|---------------------------------------------|--------|-------------|
| `GET`    | `/api/servers/:serverId/rules`              | access | List rules |
| `POST`   | `/api/servers/:serverId/rules`              | access | Create rule |
| `GET`    | `/api/servers/:serverId/rules/:id`          | access | Get rule |
| `PUT`    | `/api/servers/:serverId/rules/:id`          | access | Update rule |
| `DELETE` | `/api/servers/:serverId/rules/:id`          | access | Delete rule |
| `PATCH`  | `/api/servers/:serverId/rules/:id/toggle`   | access | Toggle rule on/off |
| `POST`   | `/api/servers/:serverId/rules/export`       | access | Export rules as JSON |
| `POST`   | `/api/servers/:serverId/rules/import`       | access | Import rules from JSON |

### Traffic API

| Method   | Path                                       | Auth   | Description |
|----------|--------------------------------------------|--------|-------------|
| `GET`    | `/api/servers/:serverId/traffic`           | access | Get traffic logs (filterable) |
| `GET`    | `/api/servers/:serverId/traffic/:id`       | access | Get specific log entry |
| `GET`    | `/api/servers/:serverId/traffic/stats`     | access | Aggregate statistics |
| `DELETE` | `/api/servers/:serverId/traffic`           | access | Clear all logs |

### Collaboration API

| Method   | Path                                                       | Auth        | Description |
|----------|------------------------------------------------------------|-------------|-------------|
| `POST`   | `/api/servers/:serverId/invite`                            | owner/admin | Generate invite link |
| `DELETE` | `/api/servers/:serverId/invite`                            | owner/admin | Revoke invite link |
| `GET`    | `/api/servers/:serverId/invite/collaborators`              | access      | List collaborators (with roles) |
| `DELETE` | `/api/servers/:serverId/invite/collaborators/:userId`      | owner/admin | Remove collaborator |
| `PUT`    | `/api/servers/:serverId/invite/collaborators/:userId/admin`| owner       | Promote to admin |
| `DELETE` | `/api/servers/:serverId/invite/collaborators/:userId/admin`| owner       | Demote to collaborator |
| `POST`   | `/api/servers/:serverId/invite/transfer-ownership/:userId` | owner       | Transfer ownership |
| `GET`    | `/api/invite/:token`                                       | session     | Preview invite (server name, owner) |
| `POST`   | `/api/invite/:token`                                       | session     | Accept invite (become collaborator) |

Auth column legend: `access` = owner or any collaborator; `owner/admin` = owner or admin collaborator; `owner` = owner only.

---

## Traffic API Examples

```bash
# Get all traffic logs
curl http://localhost:3000/api/servers/:serverId/traffic

# Filter by method
curl http://localhost:3000/api/servers/:serverId/traffic?method=POST

# Filter by status code
curl http://localhost:3000/api/servers/:serverId/traffic?statusCode=200

# Filter by path substring
curl http://localhost:3000/api/servers/:serverId/traffic?path=users

# Filter by regex pattern
curl http://localhost:3000/api/servers/:serverId/traffic?regex=posts

# Filter by timestamp range
curl http://localhost:3000/api/servers/:serverId/traffic?sinceTimestamp=2025-11-29T10:00:00Z

# Filter by error presence
curl http://localhost:3000/api/servers/:serverId/traffic?hasError=true

# Get statistics
curl http://localhost:3000/api/servers/:serverId/traffic/stats

# Clear all logs
curl -X DELETE http://localhost:3000/api/servers/:serverId/traffic
```

---

## Data Models

### Transaction

```javascript
{
  id: "1764414722814-fdpza1d0n",
  timestamp: "2025-11-29T17:12:02.814Z",
  request: { /* ... */ },
  response: { /* ... */ },
  duration: 293,
  target: "https://api.example.com",  // or "MOCK" for mocked responses
  matchedRule: {
    id: "rule-1732627800000-abc123",
    name: "Test Mock Rule",
    action: "mock",
    priority: 100
  },
  error: null
}
```

### Rule

```javascript
{
  id: "rule-1732627800000-abc123",
  priority: 100,              // Higher = evaluated first
  enabled: true,
  name: "Default API Proxy",
  method: "*",                // "GET"|"POST"|"PUT"|"PATCH"|"DELETE"|"*"
  pathRegex: ".*",            // Regex matched against request path

  action: "proxy",            // "mock" or "proxy"

  // Proxy action fields
  target: "https://api.example.com",
  latency: {                  // Optional — applies before forwarding
    type: "fixed",            // "fixed" | "range"
    value: 200                // ms (fixed), or use min/max (range)
  },
  requestHeaders: {           // Optional header modifications
    add: { "X-Env": "staging" },
    set: { "Authorization": "Bearer token" },
    remove: ["X-Internal-Id"]
  },

  // Mock action fields
  mockResponse: {
    statusCode: 200,
    body: { message: "Mocked" },
    headers: {},
    latency: { type: "range", min: 100, max: 500 }
  },

  // Shared optional fields
  conditions: [               // All must match for rule to apply
    { type: "header", key: "x-env", operator: "equals", value: "staging" }
  ],
  transform: "res.body.injected = true;"  // JS snippet; receives res = {status, headers, body}
}
```

Condition operators: `equals`, `notEquals`, `contains`, `startsWith`, `endsWith`, `exists`, `notExists`, `matches` (regex).

---

## Template Functions

Template functions can be used inside mock response bodies to generate dynamic data.

| Function | Description | Example |
|----------|-------------|---------|
| `timestamp()` | Current ISO timestamp | `2025-11-29T12:34:56.789Z` |
| `timestampMs()` | Unix timestamp (ms) | `1732887296789` |
| `uuid()` | Random UUID v4 | `550e8400-e29b...` |
| `random(min, max)` | Random integer | `{{random(1, 100)}}` |
| `randomFloat(min, max, decimals)` | Random float | `{{randomFloat(0, 1, 2)}}` |
| `randomString(length)` | Alphanumeric string | `{{randomString(8)}}` |
| `randomEmail()` | Random email | `user-xyz@example.com` |

---

## Export Data Format

```json
{
  "version": "1.0",
  "exportedAt": "2025-12-02T12:00:00.000Z",
  "server": {
    "id": "dev-api",
    "name": "Development API",
    "description": "Test instance"
  },
  "rules": [...],
  "metadata": {
    "rulesCount": 7,
    "exportSource": "faultend-ui"
  }
}
```

---

## Related Docs

- [Features](./features.md) – What these APIs enable
- [Architecture](./architecture.md) – How the backend is structured
