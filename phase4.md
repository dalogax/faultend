# Phase 4: Backend - Rules Engine with Proxy-as-Rule

**Status:** In Progress  
**Goal:** Remove hardcoded backend URL configuration and implement rules-based routing where both mocking and proxying are configured through prioritized rules.

---

## Objectives

1. **Eliminate hardcoded backend URLs** - No `BACKEND_URL` environment variable, no default target
2. **Implement dual-action rules** - Each rule specifies either `mock` or `proxy` action
3. **Priority-based evaluation** - Rules evaluated in priority order (higher first)
4. **Path regex matching** - Support flexible path patterns with regex
5. **Multi-backend support** - Different proxy rules can target different backends
6. **Default catch-all rule** - Create initial proxy rule on first startup
7. **Unmatched request handling** - Return 502 when no rule matches

---

## Rule Data Model

```javascript
{
  id: "rule-1732627800000-abc123",           // Unique identifier (timestamp-random)
  priority: 100,                              // Higher = evaluated first
  enabled: true,                              // Can be toggled on/off
  name: "Default API Proxy",                  // Human-readable name
  method: "*",                                // HTTP method or "*" for all
  pathRegex: ".*",                            // Regex pattern for path matching
  
  action: "proxy",                            // "mock" or "proxy"
  
  // For proxy action (required when action="proxy")
  target: "https://api.example.com",
  
  // For mock action (required when action="mock")
  mockResponse: {
    statusCode: 200,
    body: { message: "Mocked response" },
    headers: {},                              // Optional custom headers
    latency: 0                                // Artificial delay in ms (optional)
  }
}
```

### Rule Validation Rules

- `id`: Auto-generated, unique
- `priority`: Integer, higher evaluated first, can have duplicates (first wins)
- `enabled`: Boolean, disabled rules are skipped
- `name`: String, required, max 100 chars
- `method`: One of `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `*` (any method)
- `pathRegex`: Valid regex string, required
- `action`: Either `"mock"` or `"proxy"`, required
- `target`: Required and non-empty when `action="proxy"`
- `mockResponse`: Required when `action="mock"`, must have `statusCode` and `body`
- `mockResponse.latency`: Optional, non-negative integer

---

## Implementation Tasks

### 1. Create Rules Engine (`src/rules/rulesEngine.js`)

Implement the core matching and evaluation logic:

```javascript
/**
 * Find the first matching rule for a request
 * @param {Object} request - { method, path }
 * @returns {Object|null} - Matching rule or null
 */
function findMatchingRule(request)

/**
 * Execute a rule - either mock or proxy
 * @param {Object} rule - The matched rule
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
function executeRule(rule, req, res, next)

/**
 * Get all rules sorted by priority (high to low)
 * @returns {Array} - Sorted rules array
 */
function getAllRules()

/**
 * Add a new rule
 * @param {Object} ruleData - Rule definition
 * @returns {Object} - Created rule
 */
function addRule(ruleData)

/**
 * Get default catch-all proxy rule
 * @param {String} target - Target backend URL
 * @returns {Object} - Default rule
 */
function getDefaultProxyRule(target)
```

**Implementation Details:**

- Store rules in memory as array (sorted by priority)
- Regex matching: `new RegExp(rule.pathRegex).test(request.path)`
- Method matching: `rule.method === '*' || rule.method === request.method`
- Find first enabled rule that matches both method and path
- For mock action: Apply latency, return custom response
- For proxy action: Forward to dynamic proxy handler
- Log all rule evaluations for debugging

### 2. Update Proxy Router (`src/proxy/router.js`)

Replace hardcoded backend logic with rules engine:

```javascript
const { findMatchingRule, executeRule } = require('../rules/rulesEngine');

router.use('/', (req, res, next) => {
  // Extract method and path
  const request = {
    method: req.method,
    path: req.path
  };
  
  // Find matching rule
  const rule = findMatchingRule(request);
  
  if (!rule) {
    console.log(`[ROUTER] No matching rule for ${req.method} ${req.path}`);
    return res.status(502).json({
      error: 'No matching rule',
      message: 'No proxy or mock rule configured for this request'
    });
  }
  
  console.log(`[ROUTER] Matched rule: ${rule.name} (priority: ${rule.priority}, action: ${rule.action})`);
  
  // Execute the rule
  executeRule(rule, req, res, next);
});
```

**Key Changes:**

- Remove `X-Fault-End-Target` header check
- Remove `config.defaultTarget` usage
- All routing through rules engine
- 502 error for unmatched requests

### 3. Remove Hardcoded Backend Config (`src/proxy/config.js`)

Remove the `defaultTarget` field:

```javascript
module.exports = {
  // Proxy options
  changeOrigin: true,
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Timeout settings (in milliseconds)
  timeout: 30000,
  proxyTimeout: 30000,
  
  // Request size limits
  bodyParserLimit: '10mb'
};
```

### 4. Initialize Default Rule on Startup (`src/server.js`)

Add startup logic to ensure at least one rule exists:

```javascript
const { getAllRules, addRule, getDefaultProxyRule } = require('./rules/rulesEngine');

// After all middleware setup, before server.listen()
function initializeRules() {
  const rules = getAllRules();
  
  if (rules.length === 0) {
    console.log('[INIT] No rules found, creating default catch-all proxy rule...');
    
    // Get default target from env or use placeholder
    const defaultTarget = process.env.BACKEND_URL || 'https://jsonplaceholder.typicode.com';
    const defaultRule = getDefaultProxyRule(defaultTarget);
    
    addRule(defaultRule);
    console.log(`[INIT] Created default rule: ${defaultRule.name} → ${defaultRule.target}`);
  } else {
    console.log(`[INIT] Loaded ${rules.length} rule(s)`);
  }
}

// Call before server starts
initializeRules();
```

### 5. Update Proxy Handler for Dynamic Targets (`src/proxy/proxyHandler.js`)

Modify to accept target URL per-request instead of at creation time:

```javascript
/**
 * Execute proxy for a specific target
 * @param {String} targetUrl - Backend URL to proxy to
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next
 */
function executeProxy(targetUrl, req, res, next) {
  const proxyMiddleware = createFaultendProxy(targetUrl);
  proxyMiddleware(req, res, next);
}

module.exports = {
  createFaultendProxy,
  executeProxy
};
```

**Note:** This allows rules engine to call `executeProxy(rule.target, req, res, next)` dynamically.

---

## Testing Strategy

Create comprehensive tests in `test/phase4.test.js`:

### Test Cases

1. **Rules Engine - Basic Matching**
   - Match rule by exact method and path regex
   - Wildcard method matching (`*`)
   - Regex pattern matching (`.*/users/.*`, `^/api/v1/.*`)

2. **Priority Ordering**
   - Higher priority rule evaluated first
   - Multiple matching rules - first by priority wins
   - Disabled rules are skipped

3. **Mock Action**
   - Return custom status code and JSON body
   - Apply artificial latency
   - Custom response headers
   - Log mocked transactions

4. **Proxy Action**
   - Forward request to specified target
   - Different rules proxy to different backends
   - Proxy preserves method, headers, body
   - Log proxied transactions

5. **Unmatched Requests**
   - Return 502 when no rule matches
   - Log unmatched request attempt

6. **Rule Management**
   - Add new rule
   - Get all rules (sorted by priority)
   - Validate rule data (required fields, regex syntax)

### Test File Structure

```javascript
// test/phase4.test.js
const assert = require('assert');
const { 
  addRule, 
  getAllRules, 
  findMatchingRule, 
  clearRules 
} = require('../src/rules/rulesEngine');

// Test: Priority ordering
// Test: Method matching
// Test: Path regex matching
// Test: Mock execution
// Test: Proxy target selection
// Test: Unmatched requests

// Integration tests via HTTP
// Test: Mock rule returns custom response
// Test: Proxy rule forwards to target
// Test: Multiple backends support
// Test: 502 for unmatched requests
```

---

## API Changes

No new endpoints in this phase, but behavior changes:

### Changed Behaviors

**Proxy Endpoint:** `/proxy/*`
- **Before:** Always proxies to `BACKEND_URL` or `X-Fault-End-Target`
- **After:** Evaluates rules, proxies OR mocks based on matched rule
- **No match:** Returns 502 instead of proxying to default

**Traffic Logging:** `/api/traffic`
- Now includes `matchedRule` field in transaction logs
- Shows which rule was applied (id, name, action)

---

## Migration from Phase 3

### Breaking Changes

1. **No more `BACKEND_URL` fallback** - Must configure proxy rules
2. **No more `X-Fault-End-Target` header** - Routing via rules only
3. **Unmatched requests fail** - Forces explicit routing configuration

### Upgrade Path

On first startup after upgrade:
1. Check for existing `BACKEND_URL` environment variable
2. If set, create default proxy rule with that target
3. If not set, create rule pointing to placeholder (jsonplaceholder.typicode.com)
4. Log warning: "Default rule created - configure your rules via API"

---

## Success Criteria

Phase 4 is complete when:

- ✅ No hardcoded backend URLs in codebase (no `defaultTarget` in config)
- ✅ Rules engine evaluates requests and finds matching rules
- ✅ Mock rules return custom responses with optional latency
- ✅ Proxy rules forward to rule-specified targets
- ✅ Multiple proxy rules can target different backends
- ✅ Priority ordering works correctly
- ✅ Unmatched requests return 502
- ✅ Default rule created on first startup
- ✅ Tests pass covering all scenarios
- ✅ Traffic logs include matched rule information

---

## Example Usage After Phase 4

```bash
# Start server - creates default proxy rule
npm start
# Output: [INIT] Created default rule: Default Catch-All → https://jsonplaceholder.typicode.com

# Request matches default rule - proxies
curl http://localhost:3000/proxy/posts/1
# Output: Proxied to jsonplaceholder.typicode.com, returns real data

# Add a mock rule (via future API in Phase 5)
# For now, rules can be added programmatically or in startup code

# Add mock rule for /users/123 endpoint
addRule({
  priority: 200,
  name: "Mock User 123",
  method: "GET",
  pathRegex: "^/users/123$",
  action: "mock",
  mockResponse: {
    statusCode: 200,
    body: { id: 123, name: "Test User" },
    latency: 500
  }
});

# Request now matches mock rule
curl http://localhost:3000/proxy/users/123
# Output: Returns { id: 123, name: "Test User" } after 500ms delay

# Add proxy rule for auth service
addRule({
  priority: 150,
  name: "Auth Service",
  method: "*",
  pathRegex: "^/auth/.*",
  action: "proxy",
  target: "https://auth.myapp.com"
});

# Auth requests go to different backend
curl http://localhost:3000/proxy/auth/login
# Output: Proxied to auth.myapp.com

# Unmatched request (no rule for /admin)
curl http://localhost:3000/proxy/admin/stats
# Output: 502 No matching rule
```

---

## Next Steps

After Phase 4 completion:
- **Phase 5:** Build Rules Management API (CRUD endpoints, export/import)
- **Phase 6:** Enhanced mock features (request condition matching, templates)
- **Phase 7-10:** Frontend UI for rule management
- **Phase 11:** Data persistence (save rules to JSON file)
