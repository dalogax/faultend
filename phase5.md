# Phase 5: Backend - Rules Management API

**Status:** In Progress  
**Last Updated:** November 29, 2025

---

## Overview

Phase 5 implements a complete REST API for managing rules. This enables programmatic creation, modification, and deletion of routing rules through HTTP endpoints. It also adds export/import functionality to save and load complete rule configurations as JSON files.

**Prerequisites:**
- Phase 4 complete (rules engine implemented)
- `src/rules/rulesEngine.js` has core rule matching and execution logic

**Deliverables:**
- `src/api/rules.js` - Rules management API router
- Enhanced `src/rules/rulesEngine.js` - Add update, delete, toggle functions
- Integration in `src/server.js` - Mount rules API router
- Comprehensive integration tests

---

## Objectives

1. **CRUD Operations**: Create, read, update, delete rules via HTTP API
2. **Rule Management**: Enable/disable rules without deleting them
3. **Export/Import**: Save and load complete rule configurations as JSON
4. **Validation**: Ensure all rule operations validate data before applying changes
5. **Atomic Updates**: Validate before persisting to prevent invalid states

---

## API Specification

### Base Path
All endpoints are under `/api/rules`

### Endpoints

#### 1. List All Rules
```
GET /api/rules
```

**Response:**
```json
{
  "rules": [
    {
      "id": "rule-1732627800000-abc123",
      "priority": 100,
      "enabled": true,
      "name": "Default API Proxy",
      "method": "*",
      "pathRegex": ".*",
      "action": "proxy",
      "target": "https://api.example.com"
    }
  ],
  "count": 1
}
```

---

#### 2. Get Rule by ID
```
GET /api/rules/:id
```

**Response (200 OK):**
```json
{
  "id": "rule-1732627800000-abc123",
  "priority": 100,
  "enabled": true,
  "name": "Default API Proxy",
  "method": "*",
  "pathRegex": ".*",
  "action": "proxy",
  "target": "https://api.example.com"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Not Found",
  "message": "Rule with ID 'xyz' not found"
}
```

---

#### 3. Create New Rule
```
POST /api/rules
Content-Type: application/json

{
  "priority": 100,
  "name": "Mock User 123",
  "method": "GET",
  "pathRegex": "^/users/123$",
  "action": "mock",
  "mockResponse": {
    "statusCode": 200,
    "body": { "id": 123, "name": "Test User" },
    "latency": 500
  }
}
```

**Response (201 Created):**
```json
{
  "id": "rule-1732628000000-xyz789",
  "priority": 100,
  "enabled": true,
  "name": "Mock User 123",
  "method": "GET",
  "pathRegex": "^/users/123$",
  "action": "mock",
  "mockResponse": {
    "statusCode": 200,
    "body": { "id": 123, "name": "Test User" },
    "headers": {},
    "latency": 500
  }
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Validation Error",
  "message": "Rule validation failed:\n- pathRegex is not a valid regular expression: Unterminated group"
}
```

---

#### 4. Update Existing Rule
```
PUT /api/rules/:id
Content-Type: application/json

{
  "priority": 90,
  "name": "Updated Mock User 123",
  "method": "GET",
  "pathRegex": "^/users/123$",
  "action": "mock",
  "enabled": true,
  "mockResponse": {
    "statusCode": 404,
    "body": { "error": "Not Found" },
    "latency": 0
  }
}
```

**Response (200 OK):**
```json
{
  "id": "rule-1732628000000-xyz789",
  "priority": 90,
  "enabled": true,
  "name": "Updated Mock User 123",
  "method": "GET",
  "pathRegex": "^/users/123$",
  "action": "mock",
  "mockResponse": {
    "statusCode": 404,
    "body": { "error": "Not Found" },
    "headers": {},
    "latency": 0
  }
}
```

**Response (404 Not Found):**
```json
{
  "error": "Not Found",
  "message": "Rule with ID 'xyz' not found"
}
```

---

#### 5. Delete Rule
```
DELETE /api/rules/:id
```

**Response (200 OK):**
```json
{
  "message": "Rule deleted successfully",
  "id": "rule-1732628000000-xyz789"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Not Found",
  "message": "Rule with ID 'xyz' not found"
}
```

---

#### 6. Toggle Rule (Enable/Disable)
```
PATCH /api/rules/:id/toggle
```

**Response (200 OK):**
```json
{
  "id": "rule-1732628000000-xyz789",
  "enabled": false,
  "message": "Rule disabled successfully"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Not Found",
  "message": "Rule with ID 'xyz' not found"
}
```

---

#### 7. Export All Rules
```
POST /api/rules/export
```

**Response (200 OK):**
```json
{
  "version": "1.0",
  "exportedAt": "2025-11-29T12:00:00.000Z",
  "rules": [
    {
      "id": "rule-1732627800000-abc123",
      "priority": 100,
      "enabled": true,
      "name": "Default API Proxy",
      "method": "*",
      "pathRegex": ".*",
      "action": "proxy",
      "target": "https://api.example.com"
    }
  ],
  "count": 1
}
```

**Note:** Frontend can save this as `fault-end-config.json` file.

---

#### 8. Import Rules
```
POST /api/rules/import
Content-Type: application/json

{
  "mode": "merge",
  "rules": [
    {
      "priority": 100,
      "name": "Imported Mock",
      "method": "GET",
      "pathRegex": "^/test$",
      "action": "mock",
      "mockResponse": {
        "statusCode": 200,
        "body": { "test": true }
      }
    }
  ]
}
```

**Parameters:**
- `mode` (optional): `"merge"` (default) or `"replace"`
  - `merge`: Add imported rules to existing rules
  - `replace`: Clear all existing rules and replace with imported rules

**Response (200 OK):**
```json
{
  "message": "Rules imported successfully",
  "mode": "merge",
  "imported": 1,
  "total": 2,
  "rules": [
    {
      "id": "rule-1732628100000-new123",
      "priority": 100,
      "enabled": true,
      "name": "Imported Mock",
      "method": "GET",
      "pathRegex": "^/test$",
      "action": "mock",
      "mockResponse": {
        "statusCode": 200,
        "body": { "test": true },
        "headers": {},
        "latency": 0
      }
    }
  ]
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Validation Error",
  "message": "Invalid import data: rules array is required"
}
```

---

## Implementation Details

### 1. Enhance `src/rules/rulesEngine.js`

Add the following functions:

```javascript
/**
 * Update an existing rule
 * @param {String} id - Rule ID
 * @param {Object} updates - Updated rule data
 * @returns {Object} - Updated rule
 * @throws {Error} - If rule not found or validation fails
 */
function updateRule(id, updates) {
  const index = rules.findIndex(r => r.id === id);
  if (index === -1) {
    throw new Error(`Rule with ID '${id}' not found`);
  }

  // Merge updates with existing rule
  const updatedRule = { ...rules[index], ...updates, id };

  // Validate updated rule
  validateRule(updatedRule);

  // Update in array
  rules[index] = updatedRule;

  // Re-sort by priority
  rules.sort((a, b) => b.priority - a.priority);

  return updatedRule;
}

/**
 * Delete a rule
 * @param {String} id - Rule ID
 * @returns {Boolean} - True if deleted
 * @throws {Error} - If rule not found
 */
function deleteRule(id) {
  const index = rules.findIndex(r => r.id === id);
  if (index === -1) {
    throw new Error(`Rule with ID '${id}' not found`);
  }

  rules.splice(index, 1);
  return true;
}

/**
 * Toggle rule enabled state
 * @param {String} id - Rule ID
 * @returns {Object} - Updated rule
 * @throws {Error} - If rule not found
 */
function toggleRule(id) {
  const rule = getRuleById(id);
  if (!rule) {
    throw new Error(`Rule with ID '${id}' not found`);
  }

  rule.enabled = !rule.enabled;
  return rule;
}

/**
 * Import rules from array
 * @param {Array} rulesArray - Array of rule definitions
 * @param {String} mode - "merge" or "replace"
 * @returns {Array} - Imported rules with generated IDs
 */
function importRules(rulesArray, mode = 'merge') {
  if (!Array.isArray(rulesArray)) {
    throw new Error('Invalid import data: rules array is required');
  }

  // Validate all rules first
  rulesArray.forEach((rule, index) => {
    try {
      validateRule(rule);
    } catch (error) {
      throw new Error(`Validation failed for rule at index ${index}: ${error.message}`);
    }
  });

  // Clear existing rules if replace mode
  if (mode === 'replace') {
    rules = [];
  }

  // Import rules
  const importedRules = rulesArray.map(ruleData => addRule(ruleData));

  return importedRules;
}

/**
 * Export all rules
 * @returns {Object} - Export data with metadata
 */
function exportRules() {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    rules: getAllRules(),
    count: rules.length
  };
}
```

Export new functions:
```javascript
module.exports = {
  addRule,
  updateRule,
  deleteRule,
  toggleRule,
  getAllRules,
  getRuleById,
  clearRules,
  findMatchingRule,
  executeRule,
  getDefaultProxyRule,
  validateRule,
  importRules,
  exportRules
};
```

---

### 2. Create `src/api/rules.js`

```javascript
const express = require('express');
const router = express.Router();
const {
  addRule,
  updateRule,
  deleteRule,
  toggleRule,
  getAllRules,
  getRuleById,
  importRules,
  exportRules
} = require('../rules/rulesEngine');

// Parse JSON bodies for all rules endpoints
router.use(express.json());

// GET /api/rules - List all rules
router.get('/', (req, res) => {
  const rules = getAllRules();
  res.json({ rules, count: rules.length });
});

// GET /api/rules/:id - Get specific rule
router.get('/:id', (req, res) => {
  const rule = getRuleById(req.params.id);
  if (!rule) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Rule with ID '${req.params.id}' not found`
    });
  }
  res.json(rule);
});

// POST /api/rules - Create new rule
router.post('/', (req, res) => {
  try {
    const rule = addRule(req.body);
    res.status(201).json(rule);
  } catch (error) {
    res.status(400).json({
      error: 'Validation Error',
      message: error.message
    });
  }
});

// PUT /api/rules/:id - Update rule
router.put('/:id', (req, res) => {
  try {
    const rule = updateRule(req.params.id, req.body);
    res.json(rule);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    res.status(400).json({
      error: 'Validation Error',
      message: error.message
    });
  }
});

// DELETE /api/rules/:id - Delete rule
router.delete('/:id', (req, res) => {
  try {
    deleteRule(req.params.id);
    res.json({
      message: 'Rule deleted successfully',
      id: req.params.id
    });
  } catch (error) {
    res.status(404).json({
      error: 'Not Found',
      message: error.message
    });
  }
});

// PATCH /api/rules/:id/toggle - Toggle rule enabled state
router.patch('/:id/toggle', (req, res) => {
  try {
    const rule = toggleRule(req.params.id);
    res.json({
      id: rule.id,
      enabled: rule.enabled,
      message: `Rule ${rule.enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    res.status(404).json({
      error: 'Not Found',
      message: error.message
    });
  }
});

// POST /api/rules/export - Export all rules
router.post('/export', (req, res) => {
  const exportData = exportRules();
  res.json(exportData);
});

// POST /api/rules/import - Import rules
router.post('/import', (req, res) => {
  try {
    const { mode = 'merge', rules: rulesArray } = req.body;

    if (!rulesArray) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid import data: rules array is required'
      });
    }

    const importedRules = importRules(rulesArray, mode);
    const allRules = getAllRules();

    res.json({
      message: 'Rules imported successfully',
      mode,
      imported: importedRules.length,
      total: allRules.length,
      rules: importedRules
    });
  } catch (error) {
    res.status(400).json({
      error: 'Validation Error',
      message: error.message
    });
  }
});

module.exports = router;
```

---

### 3. Update `src/server.js`

Add rules API router:

```javascript
const rulesRouter = require('./api/rules');

// ... existing code ...

// API endpoints
app.use('/api/traffic', trafficRouter);
app.use('/api/rules', rulesRouter);  // ADD THIS LINE

// ... rest of server setup ...
```

---

## Testing Strategy

Create comprehensive integration tests in `test/integration.test.js`:

1. **Rules CRUD Tests:**
   - Create proxy rule
   - Create mock rule
   - List all rules
   - Get rule by ID
   - Update rule
   - Delete rule
   - Toggle rule enable/disable

2. **Export/Import Tests:**
   - Export rules to JSON
   - Import rules in merge mode
   - Import rules in replace mode
   - Import with invalid data (should fail)

3. **End-to-End Tests:**
   - Create mock rule → test proxied request returns mock
   - Create proxy rule → test proxied request forwards to backend
   - Disable rule → test rule is skipped
   - Update rule priority → test evaluation order changes

4. **Validation Tests:**
   - Invalid regex pattern (should fail)
   - Missing required fields (should fail)
   - Invalid action type (should fail)
   - Mock without mockResponse (should fail)
   - Proxy without target (should fail)

---

## Validation Checklist

Phase 5 is complete when:

- ✅ All 8 API endpoints implemented and working
- ✅ Rules can be created, read, updated, deleted via HTTP
- ✅ Rules can be enabled/disabled without deletion
- ✅ Export produces valid JSON with metadata
- ✅ Import works in both merge and replace modes
- ✅ All validation errors return proper HTTP status codes
- ✅ Integration tests cover all endpoints
- ✅ All tests pass successfully
- ✅ Documentation updated

---

## Expected Console Output

When server starts:
```
[INIT] Rules engine initialized with 1 rule(s)
[INIT]   - "Default Catch-All Proxy" (priority: 0, action: proxy → https://jsonplaceholder.typicode.com)
[SERVER] Fault-end started on http://localhost:3000
[SERVER] Available routes:
[SERVER]   - GET  /health              - Health check
[SERVER]   - GET  /api/traffic         - List traffic logs
[SERVER]   - GET  /api/traffic/stats   - Traffic statistics
[SERVER]   - GET  /api/rules           - List all rules
[SERVER]   - POST /api/rules           - Create new rule
[SERVER]   - GET  /api/rules/:id       - Get rule by ID
[SERVER]   - PUT  /api/rules/:id       - Update rule
[SERVER]   - DELETE /api/rules/:id     - Delete rule
[SERVER]   - PATCH /api/rules/:id/toggle - Toggle rule
[SERVER]   - POST /api/rules/export    - Export rules
[SERVER]   - POST /api/rules/import    - Import rules
[SERVER]   - ALL  /proxy/*             - Proxy with rules
```

---

## Known Limitations

- No persistent storage yet (Phase 11) - rules lost on restart
- No authentication/authorization on API endpoints
- No rate limiting on rule creation
- No conflict detection for identical path patterns
- Import doesn't preserve original rule IDs (generates new ones)

---

## Next Phase Preview

**Phase 6: Backend - Response Customization**
- Request condition matching (query params, headers)
- Template variables in mock responses
- Partial response modification
- Advanced header manipulation
