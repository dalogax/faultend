# API Reference

This document describes the HTTP API endpoints, data models, template functions, and export format used by Faultend.

---

## API Endpoints

### Servers API (`app.*` subdomain)

| Method | Path | Description |
|--------|------|-------------|
| `GET`    | `/api/servers`           | List all fault servers |
| `POST`   | `/api/servers`           | Create fault server |
| `GET`    | `/api/servers/:id`       | Get specific server |
| `DELETE` | `/api/servers/:id`       | Delete server |

### Rules API (`app.*` subdomain)

| Method | Path | Description |
|--------|------|-------------|
| `GET`    | `/api/servers/:serverId/rules`              | List rules |
| `POST`   | `/api/servers/:serverId/rules`              | Create rule |
| `GET`    | `/api/servers/:serverId/rules/:id`          | Get rule |
| `PUT`    | `/api/servers/:serverId/rules/:id`          | Update rule |
| `DELETE` | `/api/servers/:serverId/rules/:id`          | Delete rule |
| `PATCH`  | `/api/servers/:serverId/rules/:id/toggle`   | Toggle rule |
| `POST`   | `/api/servers/:serverId/rules/export`       | Export rules |
| `POST`   | `/api/servers/:serverId/rules/import`       | Import rules |

### Traffic API (`app.*` subdomain)

| Method | Path | Description |
|--------|------|-------------|
| `GET`    | `/api/servers/:serverId/traffic`       | Get traffic logs |
| `GET`    | `/api/servers/:serverId/traffic/:id`   | Get specific log |
| `GET`    | `/api/servers/:serverId/traffic/stats` | Get statistics |
| `DELETE` | `/api/servers/:serverId/traffic`       | Clear logs |

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
  priority: 100,                    // Higher = evaluated first
  enabled: true,                    // Can be toggled on/off
  name: "Default API Proxy",        // Human-readable name
  method: "*",                      // HTTP method or "*" for all
  pathRegex: ".*",                  // Regex pattern for path matching
  
  action: "proxy",                  // "mock" or "proxy"
  
  // For proxy action
  target: "https://api.example.com",
  
  // For mock action
  mockResponse: {
    statusCode: 200,
    body: { message: "Mocked response" },
    headers: {},                    // Optional custom headers
    latency: 0                      // Artificial delay in ms
  }
}
```

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
