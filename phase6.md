# Phase 6: Backend - Response Customization

**Status:** Planning  
**Last Updated:** November 29, 2025  
**Prerequisites:** Phase 5 Complete (Rules Management API)

---

## ⚠️ CRITICAL QUESTIONS TO RESOLVE

Before implementation, the following design decisions need clarification:

### 1. Request Condition Matching - Scope Clarification

**Current State:** Rules match on HTTP method + path regex only.

**Question:** Should request condition matching be:

- **Option A: Enhanced Rule Matching**
  - Add `conditions` field to rule definition
  - Rule only matches if ALL conditions are met
  - Example: `{ "conditions": { "query.test": "true", "headers.x-user-type": "admin" } }`
  - Use case: Different mock responses for same path based on headers/query params

- **Option B: Conditional Response Logic**
  - Single rule can return different responses based on request properties
  - Example: `{ "responseRules": [{ "if": "headers.x-user-type == admin", "then": {...} }] }`
  - Use case: Complex conditional mocking within a single rule

- **Option C: Both A and B**
  - Maximum flexibility, but increased complexity

**Recommendation:** Option A (Enhanced Rule Matching) - cleaner, easier to understand and manage in UI.

### 2. Template Variables - Implementation Depth

**Question:** What level of templating should we support in mock responses?

- **Option A: Simple Placeholders**
  ```json
  {
    "body": {
      "requestedPath": "{{request.path}}",
      "userId": "{{request.headers.x-user-id}}"
    }
  }
  ```
  - Pros: Simple, safe, easy to implement
  - Cons: Limited flexibility

- **Option B: JavaScript Expressions**
  ```json
  {
    "body": {
      "timestamp": "${new Date().toISOString()}",
      "randomId": "${Math.floor(Math.random() * 10000)}"
    }
  }
  ```
  - Pros: Very flexible
  - Cons: Security risk, harder to validate

- **Option C: Predefined Functions**
  ```json
  {
    "body": {
      "timestamp": "{{timestamp()}}",
      "randomId": "{{random(1000, 9999)}}",
      "uuid": "{{uuid()}}",
      "path": "{{request.path}}"
    }
  }
  ```
  - Pros: Safe, flexible enough for most use cases
  - Cons: Need to define and maintain function library

**Recommendation:** Option C (Predefined Functions) - balance of safety and flexibility.

### 3. Partial Response Modification - Architecture Conflict

**Current Architecture:** Rules engine evaluates BEFORE action execution:
```
Request → Find Matching Rule → Execute Action (Mock OR Proxy)
```

**Problem:** "Partial response mocking" implies:
```
Request → Proxy to Backend → Intercept Response → Modify Fields → Return
```

This is a NEW action type: `transform` (or `proxy-transform`)

**Question:** Should we:

- **Option A: Add New Action Type `transform`**
  ```json
  {
    "action": "transform",
    "target": "https://api.example.com",
    "transformations": [
      { "path": "user.email", "value": "{{randomEmail()}}" },
      { "path": "user.id", "operation": "multiply", "factor": 2 }
    ]
  }
  ```
  - Proxy to backend, modify response, return modified version
  - Use case: Test frontend with real backend data but modified values

- **Option B: Skip This Feature**
  - Keep clean separation: mock OR proxy
  - Partial modifications can be achieved with full mocks
  - Simpler architecture

**Recommendation:** Option B (Skip) - adds significant complexity, can be added in later phase if needed.

### 4. Advanced Header Manipulation - What's Missing?

**Current State:**
- Mock rules support `mockResponse.headers` (custom response headers)
- Proxy rules forward headers as-is

**Question:** What header features are needed?

- **Option A: Request Header Manipulation (Proxy Rules)**
  ```json
  {
    "action": "proxy",
    "target": "https://api.example.com",
    "modifyRequestHeaders": {
      "add": { "X-Custom-Header": "value" },
      "remove": ["X-Forwarded-For"],
      "set": { "Authorization": "Bearer fake-token" }
    }
  }
  ```

- **Option B: Enhanced Response Headers (Both Mock and Proxy)**
  ```json
  {
    "responseHeaders": {
      "add": { "X-Cache": "HIT" },
      "remove": ["Set-Cookie"],
      "set": { "Access-Control-Allow-Origin": "*" }
    }
  }
  ```

- **Option C: Conditional Headers**
  ```json
  {
    "conditionalHeaders": [
      { "if": "request.path.startsWith('/api')", "then": { "X-API-Version": "2.0" } }
    ]
  }
  ```

**Recommendation:** Option A (Request Header Manipulation) - most useful for testing auth, API versions, etc.

---

## PROPOSED IMPLEMENTATION PLAN

Based on recommendations above, Phase 6 will implement:

1. ✅ **Enhanced Latency Control** (already done, but can improve)
2. ✅ **Template Variables in Mock Responses** (Option C: Predefined Functions)
3. ✅ **Request Condition Matching** (Option A: Enhanced Rule Matching)
4. ✅ **Request Header Manipulation for Proxy Rules** (Option A)
5. ❌ **Partial Response Modification** (Skip - too complex for now)

---

## 1. Enhanced Latency Control

**Current State:** Single `latency` value in milliseconds.

**Enhancement:** Support range-based random latency to simulate variable network conditions.

### Rule Schema Addition

```javascript
// Current
{
  "mockResponse": {
    "latency": 1000  // Fixed 1 second
  }
}

// Enhanced
{
  "mockResponse": {
    "latency": {
      "type": "fixed",     // or "range"
      "value": 1000        // for fixed
    }
  }
}

// OR
{
  "mockResponse": {
    "latency": {
      "type": "range",
      "min": 500,
      "max": 2000
    }
  }
}

// Backward compatible: number still works
{
  "mockResponse": {
    "latency": 1000  // Treated as fixed
  }
}
```

### Implementation

**File:** `src/rules/rulesEngine.js`

- Update `validateRule()` to accept both number and object for latency
- Update `executeMockRule()` to calculate latency based on type
- Maintain backward compatibility with simple number

---

## 2. Template Variables in Mock Responses

**Goal:** Allow dynamic values in mock response bodies using predefined safe functions.

### Supported Functions

| Function | Description | Example Output |
|----------|-------------|----------------|
| `{{timestamp()}}` | Current ISO timestamp | `2025-11-29T12:34:56.789Z` |
| `{{timestampMs()}}` | Current Unix timestamp (ms) | `1732887296789` |
| `{{uuid()}}` | Random UUID v4 | `550e8400-e29b-41d4-a716-446655440000` |
| `{{random(min, max)}}` | Random integer | `{{random(1, 100)}` → `42` |
| `{{randomFloat(min, max, decimals)}}` | Random float | `{{randomFloat(0, 1, 2)}}` → `0.73` |
| `{{randomString(length)}}` | Random alphanumeric | `{{randomString(8)}}` → `aB3xK9pQ` |
| `{{randomEmail()}}` | Random email | `user-xyz@example.com` |
| `{{request.path}}` | Request path | `/users/123` |
| `{{request.method}}` | Request method | `GET` |
| `{{request.query.PARAM}}` | Query parameter | `{{request.query.id}}` → `123` |
| `{{request.header.NAME}}` | Request header (lowercase) | `{{request.header.authorization}}` |
| `{{request.body.FIELD}}` | Request body field | `{{request.body.userId}}` |

### Example Rule

```json
{
  "priority": 100,
  "name": "Dynamic User Mock",
  "method": "GET",
  "pathRegex": "^/users/[0-9]+$",
  "action": "mock",
  "mockResponse": {
    "statusCode": 200,
    "body": {
      "id": "{{request.path.split('/').pop()}}",
      "email": "{{randomEmail()}}",
      "createdAt": "{{timestamp()}}",
      "sessionId": "{{uuid()}}",
      "score": "{{random(0, 100)}}"
    },
    "latency": 100
  }
}
```

**Rendered Response:**
```json
{
  "id": "123",
  "email": "user-k3x9@example.com",
  "createdAt": "2025-11-29T12:34:56.789Z",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "score": 42
}
```

### Implementation

**New File:** `src/rules/templateEngine.js`

```javascript
/**
 * Template Engine for Mock Responses
 * Replaces template variables with dynamic values
 */

function renderTemplate(template, context) {
  // template: mock response body (object or string)
  // context: { request: { path, method, query, headers, body } }
  
  // Deep clone and recursively process template
  // Find patterns: {{functionName(args)}} or {{request.path.to.value}}
  // Replace with actual values
}

// Template functions
const templateFunctions = {
  timestamp: () => new Date().toISOString(),
  timestampMs: () => Date.now(),
  uuid: () => generateUUID(),
  random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  // ... etc
};
```

**Update:** `src/rules/rulesEngine.js`

- Modify `executeMockRule()` to call template engine before sending response
- Pass request context to template engine

---

## 3. Request Condition Matching

**Goal:** Allow rules to match only when specific request properties meet conditions.

### Rule Schema Addition

```javascript
{
  "priority": 100,
  "name": "Admin Users Only",
  "method": "GET",
  "pathRegex": "^/admin/.*",
  "action": "mock",
  
  // NEW: Optional conditions array
  "conditions": [
    {
      "type": "header",
      "key": "x-user-role",
      "operator": "equals",
      "value": "admin"
    },
    {
      "type": "query",
      "key": "debug",
      "operator": "exists"
    }
  ],
  
  "mockResponse": { /* ... */ }
}
```

### Supported Condition Types

| Type | Description | Keys |
|------|-------------|------|
| `header` | Match request header | `key`, `operator`, `value` |
| `query` | Match query parameter | `key`, `operator`, `value` |
| `body` | Match request body field | `path`, `operator`, `value` |
| `cookie` | Match cookie value | `key`, `operator`, `value` |

### Supported Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `equals` | Exact match | `"admin"` |
| `notEquals` | Not equal | `"guest"` |
| `contains` | Substring match | `"admin"` in `"super-admin"` |
| `startsWith` | Prefix match | `"Bearer "` |
| `endsWith` | Suffix match | `".com"` |
| `exists` | Key exists (any value) | - |
| `notExists` | Key does not exist | - |
| `matches` | Regex match | `"^[0-9]+$"` |

### Condition Evaluation

- All conditions must match (AND logic)
- Conditions evaluated AFTER method and path match
- Missing condition field = condition fails
- Empty `conditions` array or undefined = always match (backward compatible)

### Implementation

**Update:** `src/rules/rulesEngine.js`

```javascript
function findMatchingRule(request) {
  for (const rule of rules) {
    if (!rule.enabled) continue;
    
    // Method and path matching (existing)
    if (!matchesMethodAndPath(rule, request)) continue;
    
    // NEW: Condition matching
    if (rule.conditions && !matchesConditions(rule.conditions, request)) {
      console.log(`[RULES ENGINE] Rule ${rule.name} matched path but failed conditions`);
      continue;
    }
    
    return rule;
  }
  
  return null;
}

function matchesConditions(conditions, request) {
  // Validate all conditions
  // Return true if ALL match (AND logic)
}
```

**Update:** `validateRule()` to validate conditions schema

---

## 4. Request Header Manipulation for Proxy Rules

**Goal:** Allow proxy rules to modify request headers before forwarding to backend.

### Rule Schema Addition

```javascript
{
  "action": "proxy",
  "target": "https://api.example.com",
  
  // NEW: Optional header modifications
  "modifyRequestHeaders": {
    "add": {
      "X-Forwarded-By": "fault-end",
      "X-Test-Mode": "true"
    },
    "remove": [
      "Cookie",
      "Authorization"
    ],
    "set": {
      "Authorization": "Bearer test-token-12345",
      "X-API-Version": "2.0"
    }
  }
}
```

### Operations

| Operation | Description | Use Case |
|-----------|-------------|----------|
| `add` | Add header if not exists | Add custom headers |
| `set` | Set/overwrite header | Replace auth tokens |
| `remove` | Remove header | Strip cookies, auth |

**Execution Order:** `remove` → `set` → `add`

### Implementation

**Update:** `src/proxy/proxyHandler.js`

Modify `onProxyReq` callback to apply header modifications:

```javascript
onProxyReq: (proxyReq, req, res) => {
  // Existing request capture code...
  
  // NEW: Apply header modifications from rule
  if (req.matchedRule && req.matchedRule.modifyRequestHeaders) {
    applyHeaderModifications(proxyReq, req.matchedRule.modifyRequestHeaders);
  }
  
  // Existing body handling...
}

function applyHeaderModifications(proxyReq, modifications) {
  // Remove headers
  if (modifications.remove) {
    modifications.remove.forEach(header => {
      proxyReq.removeHeader(header);
    });
  }
  
  // Set headers (overwrite)
  if (modifications.set) {
    Object.entries(modifications.set).forEach(([key, value]) => {
      proxyReq.setHeader(key, value);
    });
  }
  
  // Add headers (only if not exists)
  if (modifications.add) {
    Object.entries(modifications.add).forEach(([key, value]) => {
      if (!proxyReq.getHeader(key)) {
        proxyReq.setHeader(key, value);
      }
    });
  }
}
```

**Update:** `src/rules/rulesEngine.js`

- Update `validateRule()` to validate `modifyRequestHeaders` schema
- Ensure it's only allowed for proxy rules

---

## Updated Rule Data Model (Phase 6)

```javascript
{
  id: "rule-1732627800000-abc123",
  priority: 100,
  enabled: true,
  name: "Enhanced Mock Rule",
  method: "GET",
  pathRegex: "^/users/[0-9]+$",
  
  // NEW: Optional conditions
  conditions: [
    {
      type: "header",
      key: "x-user-role",
      operator: "equals",
      value: "admin"
    }
  ],
  
  action: "mock",
  
  // For mock action
  mockResponse: {
    statusCode: 200,
    body: {
      id: "{{request.path.split('/').pop()}}",  // NEW: Template variables
      email: "{{randomEmail()}}",
      timestamp: "{{timestamp()}}"
    },
    headers: {},
    latency: {                                   // NEW: Enhanced latency
      type: "range",
      min: 100,
      max: 500
    }
  }
}

// OR for proxy action

{
  id: "rule-1732627800001-def456",
  priority: 90,
  enabled: true,
  name: "Auth Service Proxy",
  method: "*",
  pathRegex: "^/auth/.*",
  
  conditions: [],  // Optional
  
  action: "proxy",
  target: "https://auth.example.com",
  
  // NEW: Header modifications
  modifyRequestHeaders: {
    add: { "X-Forwarded-By": "fault-end" },
    remove: ["Cookie"],
    set: { "Authorization": "Bearer test-token" }
  }
}
```

---

## Implementation Tasks - Detailed Breakdown

### Task 1: Enhanced Latency Control
**Files:** `src/rules/rulesEngine.js`

1. Update `validateRule()`:
   - Accept `latency` as number OR object
   - If object: validate `type`, `value`/`min`/`max` fields
   - Backward compatibility: number treated as `{ type: "fixed", value: N }`

2. Update `executeMockRule()`:
   - Calculate actual latency based on type
   - If `range`: generate random between min and max
   - Apply delay with `setTimeout`

**Tests:** Validate latency objects, test random range generation

---

### Task 2: Template Engine
**Files:** `src/rules/templateEngine.js` (new), `src/rules/rulesEngine.js`

1. Create `src/rules/templateEngine.js`:
   ```javascript
   module.exports = {
     renderTemplate,
     templateFunctions
   };
   ```

2. Implement template parser:
   - Regex to find `{{...}}` patterns
   - Parse function calls: `{{functionName(arg1, arg2)}}`
   - Parse request accessors: `{{request.path}}`
   - Support nested object paths: `{{request.body.user.id}}`

3. Implement template functions:
   - `timestamp()`, `uuid()`, `random()`, etc.
   - Request accessors: path, method, query, headers, body

4. Update `executeMockRule()`:
   - Build request context from `req`
   - Call `renderTemplate(rule.mockResponse.body, context)`
   - Use rendered body in response

**Tests:** Template parsing, function execution, request data access

---

### Task 3: Request Condition Matching
**Files:** `src/rules/rulesEngine.js`

1. Update rule validation:
   - Validate `conditions` array schema
   - Validate each condition: type, key, operator, value
   - Ensure operators are valid for condition type

2. Implement `matchesConditions()`:
   - Extract value from request based on condition type
   - Apply operator logic
   - Return true only if ALL conditions match

3. Update `findMatchingRule()`:
   - Call `matchesConditions()` after path/method match
   - Log condition failures for debugging

**Tests:** All operators, all condition types, AND logic, edge cases

---

### Task 4: Request Header Manipulation
**Files:** `src/proxy/proxyHandler.js`, `src/rules/rulesEngine.js`

1. Update rule validation:
   - Validate `modifyRequestHeaders` schema
   - Ensure only present on proxy rules
   - Validate add/set/remove structure

2. Implement `applyHeaderModifications()` in proxyHandler:
   - Remove, set, add in correct order
   - Handle case-insensitive header names
   - Log header modifications

3. Update `executeProxyRule()`:
   - Pass full rule object to proxy handler (not just target)
   - Store in `req.matchedRule` for header access

**Tests:** Add/set/remove operations, execution order, case handling

---

## Test Plan

### Unit Tests

Create `test/phase6.test.js`:

```javascript
// Latency tests
- Fixed latency validation
- Range latency validation
- Backward compatibility (number)
- Invalid latency objects

// Template tests
- Timestamp functions
- UUID generation
- Random number generation
- Request data access (path, query, headers, body)
- Nested object paths
- Invalid templates

// Condition tests
- Header conditions (all operators)
- Query conditions (all operators)
- Body conditions (all operators)
- Multiple conditions (AND logic)
- Missing condition values

// Header manipulation tests
- Add headers
- Set headers (overwrite)
- Remove headers
- Execution order
- Proxy rules only
```

### Integration Tests

Update `test/integration.test.js`:

```javascript
// End-to-end scenarios
- Create mock rule with template variables
- Verify rendered response contains dynamic values
- Create rule with conditions, verify matching
- Create rule with conditions, verify non-matching returns 502
- Create proxy rule with header modifications
- Verify headers are modified in proxied request
- Create mock rule with range latency
- Verify latency is within range
```

### Manual Testing Scenarios

```bash
# 1. Template variables
curl -X POST http://localhost:3000/api/rules -H "Content-Type: application/json" -d '{
  "priority": 100,
  "name": "Dynamic User",
  "method": "GET",
  "pathRegex": "^/users/[0-9]+$",
  "action": "mock",
  "mockResponse": {
    "statusCode": 200,
    "body": {
      "id": "{{request.path}}",
      "timestamp": "{{timestamp()}}",
      "randomId": "{{uuid()}}"
    }
  }
}'

curl http://localhost:3000/proxy/users/123

# 2. Conditions
curl -X POST http://localhost:3000/api/rules -H "Content-Type: application/json" -d '{
  "priority": 100,
  "name": "Admin Only",
  "method": "GET",
  "pathRegex": "^/admin$",
  "action": "mock",
  "conditions": [
    {
      "type": "header",
      "key": "x-role",
      "operator": "equals",
      "value": "admin"
    }
  ],
  "mockResponse": {
    "statusCode": 200,
    "body": {"access": "granted"}
  }
}'

curl http://localhost:3000/proxy/admin -H "X-Role: admin"    # Should return mock
curl http://localhost:3000/proxy/admin -H "X-Role: user"     # Should return 502

# 3. Header manipulation
curl -X POST http://localhost:3000/api/rules -H "Content-Type: application/json" -d '{
  "priority": 100,
  "name": "Test Proxy",
  "method": "*",
  "pathRegex": ".*",
  "action": "proxy",
  "target": "https://jsonplaceholder.typicode.com",
  "modifyRequestHeaders": {
    "add": {"X-Custom": "added"},
    "set": {"User-Agent": "Fault-end/1.0"}
  }
}'
```

---

## Backward Compatibility

All Phase 6 enhancements are **backward compatible**:

1. ✅ **Latency:** Number still works (treated as fixed latency)
2. ✅ **Templates:** Plain JSON bodies without `{{...}}` work as-is
3. ✅ **Conditions:** Undefined or empty array = always match
4. ✅ **Headers:** Undefined `modifyRequestHeaders` = no modifications

Existing rules from Phase 5 will continue to work without changes.

---

## Files to Create/Modify

### New Files
- ✅ `src/rules/templateEngine.js` - Template parsing and rendering
- ✅ `test/phase6.test.js` - Unit tests

### Modified Files
- ✅ `src/rules/rulesEngine.js` - Enhanced validation, condition matching, template integration
- ✅ `src/proxy/proxyHandler.js` - Header manipulation
- ✅ `test/integration.test.js` - Additional integration tests

---

## Success Criteria

Phase 6 is complete when:

1. ✅ Enhanced latency (fixed/range) works in mock rules
2. ✅ Template variables render dynamic values in mock responses
3. ✅ All predefined template functions work correctly
4. ✅ Request data accessible via templates (path, query, headers, body)
5. ✅ Condition matching works for all types and operators
6. ✅ Rules with conditions only match when conditions are met
7. ✅ Header manipulation works for proxy rules (add/set/remove)
8. ✅ All unit tests pass (>20 tests)
9. ✅ All integration tests pass (>35 tests)
10. ✅ Backward compatibility maintained with Phase 5 rules
11. ✅ Documentation updated (`agents.md`, `README.md`)

---

## Estimated Effort

- Template Engine: 3-4 hours
- Condition Matching: 2-3 hours
- Enhanced Latency: 1 hour
- Header Manipulation: 2 hours
- Testing: 3-4 hours
- Documentation: 1 hour

**Total: ~12-15 hours**

---

## Next Steps After Phase 6

- **Phase 7:** Frontend - Project Setup and UI Framework
- **Phase 8:** Frontend - Real-time Traffic Viewer
- **Phase 9:** Frontend - Rule Creator Interface
- **Phase 10:** Frontend - Rules Management Interface
- **Phase 11:** Data Persistence and Storage
