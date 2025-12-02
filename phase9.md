# Phase 9: Frontend - Rule Creator Interface

## Overview

Implement the rule creation interface that allows users to convert logged traffic requests into mock or proxy rules with a single click. This phase focuses on building the form UI, validation, and integration with the Rules API.

## Objectives

1. Build a comprehensive rule creation/editing form
2. Implement one-click rule creation from traffic logs
3. Add form validation and error handling
4. Support both mock and proxy rule types
5. Handle advanced features (conditions, latency, headers, templates)
6. Integrate with existing drawer system
7. Display rules in the right column of management view

## Implementation Details

### 1. Rule Form Component (`public/js/views/rules.js`)

**RuleForm Class:**
- Render complete form with all rule fields
- Support create and edit modes
- Validate inputs before submission
- Handle conditional fields (mock vs proxy)
- Pre-fill from traffic log data
- Support template variables in mock responses
- Manage conditions and header manipulation

**Form Fields:**
- **Basic Fields:**
  - Name (text input, required)
  - Priority (number input, required, suggest next available)
  - Method (dropdown: GET, POST, PUT, PATCH, DELETE, *)
  - Path Regex (text input, required, with validation)
  - Enabled (checkbox, default true)

- **Action Selection:**
  - Radio buttons: Mock / Proxy
  - Conditional field visibility based on selection

- **Mock Action Fields (when action = "mock"):**
  - Status Code (number input, default 200)
  - Response Body (textarea, JSON editor)
  - Latency Type (radio: None, Fixed, Range)
  - Latency Value(s) (number inputs, conditional on type)
  - Custom Headers (key-value pairs, optional)

- **Proxy Action Fields (when action = "proxy"):**
  - Target URL (text input, required, URL validation)
  - Header Manipulation (optional section)
    - Add Headers (key-value pairs)
    - Set Headers (key-value pairs)
    - Remove Headers (list of header names)

- **Advanced Options (collapsible section):**
  - Conditions (list of conditions)
    - Type: header, query, body, cookie
    - Key (text input)
    - Operator: equals, notEquals, contains, startsWith, endsWith, exists, notExists, matches
    - Value (text input, conditional on operator)

**Pre-fill Logic:**
When creating from traffic log:
- Method: from `log.request.method`
- Path Regex: convert `log.request.path` to regex pattern (escape special chars, suggest exact match or pattern)
- Action: Default to "mock" with response pre-filled
- Mock Response Body: from `log.response.body`
- Mock Status Code: from `log.response.statusCode`
- Target (for proxy): from `log.target` if available

### 2. Rules List Component

**RulesList Class:**
- Display all rules in table format
- Show rule details: name, method, path pattern, action, priority, enabled status
- Support inline enable/disable toggle
- Click row to open edit form in drawer
- Empty state when no rules exist
- Auto-refresh after creating/updating/deleting rules

**Table Columns:**
- Priority (sortable)
- Name
- Method (badge)
- Path Pattern (truncated)
- Action (badge: mock/proxy)
- Enabled (toggle switch)
- Actions (edit/delete buttons)

### 3. Integration with Traffic Detail View

**Update TrafficDetail class:**
- Replace placeholder "Create Rule" button with functional implementation
- Button click opens rule form in drawer
- Form pre-filled with traffic log data
- Success callback refreshes rules list

### 4. Form Validation

**Client-side Validation:**
- Required fields: name, priority, method, pathRegex, action
- Regex syntax validation (try `new RegExp(pattern)`)
- For mock: validate JSON in response body
- For proxy: validate URL format in target
- Priority must be a positive integer
- Latency values must be non-negative numbers
- Condition operators require value except for exists/notExists
- Header manipulation key/value validation

**Server-side Validation:**
- Backend already validates via rulesEngine
- Display API error messages in toast notifications
- Highlight invalid fields in form

### 5. Form State Management

**FormState:**
- Track current values for all fields
- Track validation errors
- Track dirty state (unsaved changes)
- Warn before closing with unsaved changes

### 6. CSS Additions

Add to `components.css`:
- `.rule-form` - Form container styles
- `.form-section` - Section grouping styles
- `.form-field` - Individual field wrapper
- `.form-label` - Label styles
- `.form-error` - Error message styles
- `.radio-group` - Radio button group styles
- `.checkbox-group` - Checkbox styles
- `.field-array` - Dynamic field arrays (conditions, headers)
- `.field-array-item` - Individual array item
- `.field-array-actions` - Add/remove buttons
- `.collapsible-section` - Collapsible advanced options
- `.rules-table` - Rules list table
- `.rule-row` - Individual rule row
- `.toggle-switch` - Enable/disable toggle

### 7. API Integration

**Use existing API functions from `api.js`:**
- `fetchRules(serverId)` - Load rules list
- `createRule(serverId, ruleData)` - Create new rule
- `updateRule(serverId, ruleId, ruleData)` - Update existing rule
- `deleteRule(serverId, ruleId)` - Delete rule
- `toggleRule(serverId, ruleId)` - Toggle enabled state

### 8. Workflow Implementation

**Create Rule from Traffic:**
1. User clicks traffic row → detail view opens in drawer
2. User clicks "Create Rule" button
3. Drawer content switches to rule form
4. Form pre-filled with traffic log data
5. User edits fields as needed
6. User clicks "Save"
7. Form validates inputs
8. API call to create rule
9. On success: close drawer, refresh rules list, show toast
10. On error: display errors, keep form open

**Edit Existing Rule:**
1. User views rules list in right column
2. User clicks rule row or edit button
3. Drawer opens with rule form
4. Form pre-filled with rule data
5. User edits fields
6. User clicks "Save"
7. Form validates inputs
8. API call to update rule
9. On success: close drawer, refresh rules list, show toast
10. On error: display errors, keep form open

**Delete Rule:**
1. User clicks delete button on rule row
2. Confirmation dialog appears
3. User confirms deletion
4. API call to delete rule
5. On success: refresh rules list, show toast
6. On error: show error toast

**Toggle Rule:**
1. User clicks toggle switch on rule row
2. API call to toggle enabled state
3. On success: update UI, show toast
4. On error: revert toggle, show error toast

## Data Structures

### Rule Form Data
```javascript
{
  name: "Mock User Response",
  priority: 100,
  enabled: true,
  method: "GET",
  pathRegex: "^/users/[0-9]+$",
  action: "mock", // or "proxy"
  
  // For mock action
  mockResponse: {
    statusCode: 200,
    body: { id: 123, name: "Test User" },
    headers: { "X-Custom": "value" },
    latency: {
      type: "fixed", // or "range" or null
      value: 500,    // for fixed
      min: 100,      // for range
      max: 500       // for range
    }
  },
  
  // For proxy action
  target: "https://api.example.com",
  requestHeaders: {
    add: { "X-Custom": "value" },
    set: { "Authorization": "Bearer token" },
    remove: ["X-Old-Header"]
  },
  
  // Optional conditions
  conditions: [
    {
      type: "header",
      key: "x-api-version",
      operator: "equals",
      value: "2.0"
    }
  ]
}
```

## Testing Strategy

Update `tests/frontend.spec.js`:

**New Test Cases:**
1. Rules view displays in right column
2. Rules list loads and displays correctly
3. Empty state shown when no rules exist
4. Click "Create Rule" from traffic detail opens form
5. Form pre-filled with traffic data
6. Form validates required fields
7. Form validates regex pattern
8. Form validates JSON in mock response body
9. Form validates URL in proxy target
10. Form switches fields when changing action type
11. Form saves successfully and refreshes rules list
12. Edit rule opens pre-filled form
13. Delete rule shows confirmation and removes rule
14. Toggle rule updates enabled state
15. Form shows validation errors
16. Form warns before closing with unsaved changes
17. Advanced options expand/collapse correctly
18. Conditions can be added and removed
19. Header manipulation fields work correctly
20. Latency type switching works correctly

**Modify Existing Tests:**
- Update traffic detail test to verify functional "Create Rule" button
- Ensure drawer can switch between traffic detail and rule form

## Files to Create/Modify

### New Files:
None (all functionality in existing files)

### Modified Files:
1. **`public/js/views/rules.js`** - Complete implementation of rule form and rules list
2. **`public/css/components.css`** - Add form and rules list styles
3. **`tests/frontend.spec.js`** - Update/add tests for Phase 9 functionality

## Success Criteria

✅ Rules list displays in right column of management view  
✅ Rules list shows all rules with proper formatting  
✅ Click traffic row → detail view → "Create Rule" button opens form  
✅ Form pre-fills with traffic data correctly  
✅ Form supports both mock and proxy actions  
✅ Form validates all inputs before submission  
✅ Form can create new rules via API  
✅ Form can edit existing rules via API  
✅ Delete rule with confirmation works  
✅ Toggle rule enabled state works  
✅ Advanced options (conditions, headers, latency) work  
✅ Form shows validation errors clearly  
✅ Success/error toasts display appropriately  
✅ All frontend tests pass (including new Phase 9 tests)  
✅ No console errors in browser  

## Implementation Notes

### Priority Suggestion Algorithm
```javascript
function suggestNextPriority(existingRules) {
  if (existingRules.length === 0) return 100;
  const priorities = existingRules.map(r => r.priority).sort((a, b) => b - a);
  const highestPriority = priorities[0];
  
  // Suggest 10 less than highest (so new rule evaluated after existing)
  // But don't go below 1
  return Math.max(1, highestPriority - 10);
}
```

### Path Regex Conversion from Traffic Path
```javascript
function convertPathToRegex(path) {
  // Escape special regex characters
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Suggest exact match by default
  return `^${escaped}$`;
  
  // Could also suggest pattern for IDs: /users/123 → ^/users/[0-9]+$
  // But start simple with exact match
}
```

### JSON Validation
```javascript
function validateJSON(str) {
  try {
    JSON.parse(str);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}
```

### URL Validation
```javascript
function validateURL(str) {
  try {
    new URL(str);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}
```

## UI/UX Considerations

1. **Form Layout:** Use vertical layout with clear sections
2. **Conditional Fields:** Hide/show fields based on action type selection
3. **Validation Feedback:** Show errors inline below fields with red text
4. **Loading States:** Disable form and show spinner during API calls
5. **Success Feedback:** Close drawer and show toast on successful save
6. **Error Handling:** Keep drawer open and show errors on failure
7. **Unsaved Changes:** Warn user before closing drawer with unsaved changes
8. **Auto-focus:** Focus first input when form opens
9. **Template Help:** Show hint text about template variables for mock responses
10. **Regex Help:** Show hint text about regex patterns with examples

## Sample Data Enhancement

Add sample rules to test servers in `src/index.js` when `SAMPLE_DATA=true`:

**For "dev-api" server:**
1. **Proxy Rule (Priority 100):** Catch-all proxy to jsonplaceholder.typicode.com
2. **Mock Rule (Priority 110):** Mock `/users/1` with custom response and 500ms latency
3. **Mock Rule (Priority 90):** Mock 404 for `/not-found`

**For "staging" server:**
1. **Proxy Rule (Priority 100):** Catch-all proxy to jsonplaceholder.typicode.com
2. **Mock Rule (Priority 120):** Mock `/posts` with template variables
3. **Conditional Rule (Priority 105):** Mock `/users/123` only when header `x-api-version: 2.0`

**For "mobile-api" server:**
1. **Proxy Rule (Priority 100):** Catch-all proxy to jsonplaceholder.typicode.com

### Sample Rules Code

Add to `src/index.js` after creating sample servers:

```javascript
// Add sample rules to dev-api server
addRule('dev-api', {
  priority: 100,
  name: 'Default API Proxy',
  method: '*',
  pathRegex: '.*',
  action: 'proxy',
  target: 'https://jsonplaceholder.typicode.com'
});

addRule('dev-api', {
  priority: 110,
  name: 'Mock User 1',
  method: 'GET',
  pathRegex: '^/users/1$',
  action: 'mock',
  mockResponse: {
    statusCode: 200,
    body: {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser'
    },
    latency: { type: 'fixed', value: 500 }
  }
});

addRule('dev-api', {
  priority: 90,
  name: 'Mock 404',
  method: '*',
  pathRegex: '^/not-found$',
  action: 'mock',
  enabled: false, // Disabled by default for testing toggle
  mockResponse: {
    statusCode: 404,
    body: { error: 'Not Found', message: 'Resource does not exist' }
  }
});

// Add sample rules to staging server
addRule('staging', {
  priority: 100,
  name: 'API Proxy',
  method: '*',
  pathRegex: '.*',
  action: 'proxy',
  target: 'https://jsonplaceholder.typicode.com'
});

addRule('staging', {
  priority: 120,
  name: 'Dynamic Posts Response',
  method: 'GET',
  pathRegex: '^/posts$',
  action: 'mock',
  mockResponse: {
    statusCode: 200,
    body: {
      posts: [],
      count: 0,
      timestamp: '{{timestamp()}}',
      requestId: '{{uuid()}}'
    },
    latency: { type: 'range', min: 100, max: 300 }
  }
});

addRule('staging', {
  priority: 105,
  name: 'Conditional User Mock',
  method: 'GET',
  pathRegex: '^/users/123$',
  conditions: [
    {
      type: 'header',
      key: 'x-api-version',
      operator: 'equals',
      value: '2.0'
    }
  ],
  action: 'mock',
  mockResponse: {
    statusCode: 200,
    body: {
      id: 123,
      name: 'API v2 User',
      version: '2.0',
      createdAt: '{{timestamp()}}'
    }
  }
});

// Add sample rule to mobile-api server
addRule('mobile-api', {
  priority: 100,
  name: 'Mobile API Proxy',
  method: '*',
  pathRegex: '.*',
  action: 'proxy',
  target: 'https://jsonplaceholder.typicode.com'
});
```

This provides:
- Mix of mock and proxy rules
- Different priority values
- Examples of latency (fixed and range)
- Examples of conditions
- Examples of template variables
- One disabled rule for testing toggle functionality
- Ready-to-test scenarios for all form features

## Phase Completion Checklist

- [ ] Add sample rules to test servers in `src/index.js`
- [ ] Implement RuleForm class with full functionality
- [ ] Implement RulesList class
- [ ] Update TrafficDetail "Create Rule" button
- [ ] Add form validation logic
- [ ] Add CSS styles for form and rules list
- [ ] Implement priority suggestion algorithm
- [ ] Implement path-to-regex conversion
- [ ] Add JSON and URL validation
- [ ] Handle conditional field visibility
- [ ] Implement conditions UI
- [ ] Implement header manipulation UI
- [ ] Implement latency configuration UI
- [ ] Add confirmation dialogs
- [ ] Add success/error toasts
- [ ] Update frontend tests
- [ ] Manual testing of all workflows
- [ ] Update agents.md with Phase 9 completion status

---

**Estimated Implementation Time:** 4-6 hours  
**Dependencies:** Phase 8 (Traffic Viewer) complete  
**Next Phase:** Phase 10 (Enhanced Rules Management)
