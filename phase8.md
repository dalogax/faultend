# Phase 8: Frontend - Real-time Traffic Viewer

**Status:** Planning  
**Last Updated:** December 1, 2025  
**Prerequisites:** Phase 7 Complete (Frontend UI Framework)

---

## Overview

Phase 8 implements the real-time traffic viewer in the left column of the server management view. This is the primary feature that allows users to inspect all proxied requests and responses in real-time, providing the foundation for the one-click rule creation workflow (Phase 9).

---

## Objectives

1. **Display traffic logs** in a table/list format showing key request information
2. **Auto-refresh** traffic data via polling (every 2 seconds when active)
3. **Request/response detail view** in the right-side drawer
4. **Filtering capabilities** by method, status code, path pattern
5. **Empty state handling** when no traffic exists
6. **Loading states** during data fetches
7. **Performance optimization** for large traffic logs (up to 1000 items)

---

## User Stories

**As a user, I want to:**

1. See all requests passing through my fault server in real-time
2. Click on any request to view full details (headers, body, timing)
3. Filter traffic by HTTP method (GET, POST, etc.)
4. Filter traffic by status code (2xx, 4xx, 5xx, etc.)
5. Search traffic by path pattern
6. See which rule matched each request (if any)
7. Clear all traffic logs with one click
8. See when the last update occurred

---

## Design Specifications

### Traffic Table Layout

```
+--------------------------------------------------+
| Traffic                         [Clear] [Refresh]|
| Last updated: 2 seconds ago                      |
+--------------------------------------------------+
| [Method Filter] [Status Filter] [Path Search   ]|
+--------------------------------------------------+
| Method | Path              | Status | Time | Rule|
+--------------------------------------------------+
| GET    | /users/123        | 200    | 45ms | ✓   |
| POST   | /posts            | 201    | 123ms| ✓   |
| GET    | /invalid          | 502    | 2ms  | -   |
| DELETE | /posts/5          | 204    | 67ms | ✓   |
+--------------------------------------------------+
```

**Column Specifications:**
- **Method Badge:** Pastel colored badge (see Phase 7 colors)
- **Path:** Truncated to 30 characters with `...` if longer
- **Status Badge:** Color-coded by status family (2xx green, 4xx yellow, 5xx red)
- **Duration:** Milliseconds, right-aligned
- **Rule:** Checkmark (✓) if rule matched, dash (-) if no match

### Detail View (Right Drawer)

When a traffic row is clicked, the right-side drawer opens showing:

```
+--------------------------------+
| Request Details         [Close]|
+--------------------------------+
| GET /users/123                 |
| Status: 200 OK                 |
| Duration: 45ms                 |
| Timestamp: 2025-12-01 14:23:45 |
+--------------------------------+
| Matched Rule                   |
| Name: User API Proxy           |
| Priority: 100                  |
| Action: proxy                  |
+--------------------------------+
| Request                        |
| Headers:                       |
|   host: server1.localhost:3000 |
|   user-agent: curl/7.68.0      |
| Query: (none)                  |
| Body: (none)                   |
+--------------------------------+
| Response                       |
| Status: 200 OK                 |
| Headers:                       |
|   content-type: application/...|
|   content-length: 156          |
| Body:                          |
| {                              |
|   "id": 123,                   |
|   "name": "John Doe",          |
|   "email": "john@example.com"  |
| }                              |
+--------------------------------+
| [Create Rule from Request]     |
+--------------------------------+
```

**Drawer Sections:**
1. **Overview:** Method, path, status, duration, timestamp
2. **Matched Rule:** Rule details if a rule was matched
3. **Request Details:** Headers, query params, body (formatted JSON)
4. **Response Details:** Status, headers, body (formatted JSON)
5. **Actions:** "Create Rule from Request" button (Phase 9)

### Filters Component

```html
<div class="traffic-filters">
  <div class="filter-group">
    <label>Method</label>
    <select id="methodFilter">
      <option value="">All</option>
      <option value="GET">GET</option>
      <option value="POST">POST</option>
      <option value="PUT">PUT</option>
      <option value="PATCH">PATCH</option>
      <option value="DELETE">DELETE</option>
    </select>
  </div>
  
  <div class="filter-group">
    <label>Status</label>
    <select id="statusFilter">
      <option value="">All</option>
      <option value="2xx">2xx Success</option>
      <option value="3xx">3xx Redirect</option>
      <option value="4xx">4xx Client Error</option>
      <option value="5xx">5xx Server Error</option>
    </select>
  </div>
  
  <div class="filter-group">
    <label>Path</label>
    <input type="text" id="pathSearch" placeholder="Search path...">
  </div>
</div>
```

---

## API Integration

### Fetch Traffic

```javascript
// GET /servers/:serverId/traffic
const traffic = await fetchTraffic(serverId);

// Response structure:
{
  logs: [
    {
      id: "1764414722814-fdpza1d0n",
      timestamp: "2025-11-29T11:12:02.814Z",
      request: {
        method: "POST",
        url: "/posts",
        path: "/posts",
        headers: { ... },
        query: {},
        body: { title: "Test", body: "Content", userId: 1 },
        bodySize: 56,
        contentType: "application/json"
      },
      response: {
        statusCode: 201,
        statusMessage: "Created",
        headers: { ... },
        body: { title: "Test", body: "Content", userId: 1, id: 101 },
        bodySize: 82,
        contentType: "application/json; charset=utf-8"
      },
      duration: 293,
      target: "https://jsonplaceholder.typicode.com",
      matchedRule: {
        id: "rule-123",
        name: "API Proxy",
        action: "proxy",
        priority: 100
      },
      error: null
    }
  ],
  count: 1
}
```

### Fetch with Filters

```javascript
// Apply filters via query parameters
const traffic = await fetchTraffic(serverId, {
  method: 'POST',           // Filter by method
  statusCode: 201,          // Filter by exact status code
  path: 'users'             // Substring match on path
});
```

### Clear Traffic

```javascript
// DELETE /servers/:serverId/traffic
await clearTraffic(serverId);
```

---

## Component Architecture

### 1. TrafficTable Component

**File:** `public/js/views/traffic.js`

```javascript
class TrafficTable {
  constructor(containerId, serverId) {
    this.container = document.getElementById(containerId);
    this.serverId = serverId;
    this.logs = [];
    this.filters = {
      method: '',
      status: '',
      path: ''
    };
    this.pollInterval = null;
    this.lastUpdate = null;
  }

  async load() {
    try {
      const response = await fetchTraffic(this.serverId, this.getAPIFilters());
      this.logs = response.logs || [];
      this.lastUpdate = new Date();
      this.render();
    } catch (error) {
      console.error('Failed to load traffic:', error);
      Toast.error('Failed to load traffic');
    }
  }

  startPolling() {
    this.pollInterval = setInterval(() => this.load(), 2000);
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  getAPIFilters() {
    const filters = {};
    if (this.filters.method) filters.method = this.filters.method;
    if (this.filters.status) {
      // Convert "2xx" to statusCode filter
      // Note: Backend doesn't support family filtering, so we skip this
      // or implement client-side filtering
    }
    if (this.filters.path) filters.path = this.filters.path;
    return filters;
  }

  render() {
    // Render table, filters, buttons
  }

  openDetail(logId) {
    // Open drawer with log details
  }

  async clearAll() {
    if (!confirm('Clear all traffic logs?')) return;
    
    try {
      await clearTraffic(this.serverId);
      this.logs = [];
      this.render();
      Toast.success('Traffic cleared');
    } catch (error) {
      Toast.error('Failed to clear traffic');
    }
  }
}
```

### 2. TrafficDetail Component

**File:** `public/js/views/traffic.js`

```javascript
class TrafficDetail {
  constructor(log) {
    this.log = log;
  }

  render() {
    // Return HTML string for drawer content
    return `
      <div class="traffic-detail">
        <div class="detail-section">
          <h3>Overview</h3>
          <div class="detail-row">
            <span class="label">Method:</span>
            <span class="badge badge-${this.log.request.method.toLowerCase()}">${this.log.request.method}</span>
          </div>
          <div class="detail-row">
            <span class="label">Path:</span>
            <span>${this.log.request.path}</span>
          </div>
          <!-- More fields... -->
        </div>
        
        ${this.renderMatchedRule()}
        ${this.renderRequest()}
        ${this.renderResponse()}
        
        <div class="detail-actions">
          <button class="btn btn-primary" onclick="createRuleFromLog('${this.log.id}')">
            Create Rule from Request
          </button>
        </div>
      </div>
    `;
  }

  renderMatchedRule() {
    if (!this.log.matchedRule) {
      return '<div class="detail-section"><p class="empty-state">No rule matched</p></div>';
    }
    
    return `
      <div class="detail-section">
        <h3>Matched Rule</h3>
        <div class="detail-row">
          <span class="label">Name:</span>
          <span>${this.log.matchedRule.name}</span>
        </div>
        <div class="detail-row">
          <span class="label">Priority:</span>
          <span>${this.log.matchedRule.priority}</span>
        </div>
        <div class="detail-row">
          <span class="label">Action:</span>
          <span class="badge">${this.log.matchedRule.action}</span>
        </div>
      </div>
    `;
  }

  renderRequest() {
    return `
      <div class="detail-section">
        <h3>Request</h3>
        <div class="code-block">
          <h4>Headers</h4>
          <pre>${JSON.stringify(this.log.request.headers, null, 2)}</pre>
        </div>
        ${this.log.request.body ? `
          <div class="code-block">
            <h4>Body</h4>
            <pre>${JSON.stringify(this.log.request.body, null, 2)}</pre>
          </div>
        ` : '<p class="empty-state">No request body</p>'}
      </div>
    `;
  }

  renderResponse() {
    return `
      <div class="detail-section">
        <h3>Response</h3>
        <div class="detail-row">
          <span class="label">Status:</span>
          <span class="badge badge-status-${Math.floor(this.log.response.statusCode / 100)}xx">
            ${this.log.response.statusCode} ${this.log.response.statusMessage}
          </span>
        </div>
        <div class="code-block">
          <h4>Headers</h4>
          <pre>${JSON.stringify(this.log.response.headers, null, 2)}</pre>
        </div>
        ${this.log.response.body ? `
          <div class="code-block">
            <h4>Body</h4>
            <pre>${JSON.stringify(this.log.response.body, null, 2)}</pre>
          </div>
        ` : '<p class="empty-state">No response body</p>'}
      </div>
    `;
  }
}
```

---

## Implementation Steps

### Step 1: Update Traffic API Client
- ✅ Already implemented in `public/js/api.js` (Phase 7)
- No changes needed

### Step 2: Implement TrafficTable Component
- [ ] Create `TrafficTable` class in `public/js/views/traffic.js`
- [ ] Implement `load()` method to fetch traffic
- [ ] Implement `render()` method to display table
- [ ] Implement filter controls (method, status, path)
- [ ] Implement clear and refresh buttons
- [ ] Implement auto-polling (start/stop on view show/hide)
- [ ] Handle empty state when no traffic exists

### Step 3: Implement TrafficDetail Component
- [ ] Create `TrafficDetail` class in `public/js/views/traffic.js`
- [ ] Implement `render()` method for drawer content
- [ ] Render overview section (method, path, status, duration, timestamp)
- [ ] Render matched rule section (if applicable)
- [ ] Render request details (headers, query, body)
- [ ] Render response details (status, headers, body)
- [ ] Format JSON bodies with syntax highlighting (use `<pre>` for now)
- [ ] Add "Create Rule" button placeholder (implemented in Phase 9)

### Step 4: Wire Up View Integration
- [ ] Update `initTrafficView()` to create `TrafficTable` instance
- [ ] Update `loadTrafficData()` to call `table.load()`
- [ ] Start polling when traffic view is active
- [ ] Stop polling when navigating away
- [ ] Handle view lifecycle events

### Step 5: Add Styling
- [ ] Add table styles to `public/css/components.css`
- [ ] Add filter controls styles
- [ ] Add detail view styles for drawer
- [ ] Add code block styles for JSON display
- [ ] Ensure all elements follow Phase 7 design (sharp edges, black/white, pastel badges)

### Step 6: Performance Optimization
- [ ] Implement virtual scrolling if traffic count > 100 (optional)
- [ ] Debounce path search input (300ms)
- [ ] Cache rendered rows to avoid re-rendering unchanged data
- [ ] Use DocumentFragment for batch DOM updates

### Step 7: Testing
- [ ] Update frontend tests in `tests/frontend.spec.js`
- [ ] Test traffic table rendering
- [ ] Test filters (method, status, path)
- [ ] Test detail view drawer
- [ ] Test auto-refresh/polling
- [ ] Test clear traffic functionality
- [ ] Test empty states
- [ ] Test with large datasets (900+ logs)

---

## CSS Additions

### Traffic Table Styles

```css
/* public/css/components.css */

.traffic-table-container {
  width: 100%;
  overflow-x: auto;
}

.traffic-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.traffic-table thead {
  border-bottom: 2px solid var(--color-black);
}

.traffic-table th {
  text-align: left;
  padding: var(--space-sm) var(--space-md);
  font-weight: var(--font-weight);
  font-size: var(--text-sm);
}

.traffic-table tbody tr {
  border-bottom: 1px solid var(--color-gray-light);
  cursor: pointer;
}

.traffic-table tbody tr:hover {
  background: var(--color-background);
}

.traffic-table td {
  padding: var(--space-sm) var(--space-md);
}

.traffic-table .path-cell {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.traffic-table .duration-cell {
  text-align: right;
  font-family: var(--font-mono);
}

.traffic-table .rule-indicator {
  text-align: center;
}

.traffic-filters {
  display: flex;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
  padding: var(--space-md);
  border-bottom: 1px solid var(--color-gray-light);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.filter-group label {
  font-size: var(--text-sm);
  color: var(--color-gray-dark);
}

.filter-group select,
.filter-group input {
  padding: var(--space-sm);
  border: 1px solid var(--color-black);
  background: var(--color-white);
  font-size: var(--text-sm);
  font-family: var(--font-primary);
  font-weight: var(--font-weight);
}

.filter-group input[type="text"] {
  min-width: 200px;
}

.traffic-actions {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.last-update {
  font-size: var(--text-sm);
  color: var(--color-gray-mid);
  margin-bottom: var(--space-md);
}
```

### Detail View Styles

```css
/* public/css/components.css */

.traffic-detail {
  padding: var(--space-md);
}

.detail-section {
  margin-bottom: var(--space-lg);
}

.detail-section h3 {
  font-size: var(--text-base);
  font-weight: var(--font-weight);
  margin-bottom: var(--space-md);
  border-bottom: 1px solid var(--color-black);
  padding-bottom: var(--space-sm);
}

.detail-row {
  display: flex;
  gap: var(--space-md);
  margin-bottom: var(--space-sm);
}

.detail-row .label {
  font-size: var(--text-sm);
  color: var(--color-gray-dark);
  min-width: 100px;
}

.code-block {
  margin-top: var(--space-md);
}

.code-block h4 {
  font-size: var(--text-sm);
  font-weight: var(--font-weight);
  margin-bottom: var(--space-sm);
}

.code-block pre {
  background: var(--color-background);
  border: 1px solid var(--color-gray-light);
  padding: var(--space-md);
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: var(--line-height-normal);
}

.detail-actions {
  margin-top: var(--space-lg);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-gray-light);
}
```

---

## Data Flow

```
User Opens Traffic View
    ↓
TrafficTable.load()
    ↓
fetchTraffic(serverId) → API Call
    ↓
Response: { logs: [...], count: n }
    ↓
TrafficTable.render()
    ↓
Display table with filters
    ↓
Start polling (every 2s)
    ↓
Auto-refresh → load() → render()

---

User Clicks Traffic Row
    ↓
TrafficTable.openDetail(logId)
    ↓
Create TrafficDetail instance
    ↓
TrafficDetail.render() → HTML
    ↓
DrawerController.open(html)
    ↓
Display detail view in drawer

---

User Changes Filter
    ↓
Update filters object
    ↓
TrafficTable.load() with new filters
    ↓
Re-render table with filtered data

---

User Clicks Clear
    ↓
Confirm dialog
    ↓
clearTraffic(serverId) → API Call
    ↓
Clear local logs array
    ↓
Re-render (empty state)
```

---

## Polling Strategy

**Start Polling:**
- When traffic view becomes active
- Poll every 2 seconds

**Stop Polling:**
- When navigating away from traffic view
- When switching to different server
- On page unload

**Implementation:**
```javascript
// In router.js or app.js
window.addEventListener('viewload', (e) => {
  if (e.detail.view === 'traffic') {
    trafficTable.startPolling();
  } else {
    trafficTable.stopPolling();
  }
});
```

---

## Error Handling

### API Errors
- Show toast notification with error message
- Don't stop polling on transient errors
- Display last successful update time

### Empty States
- No traffic: "No traffic logged yet. Send requests through your fault server to see them here."
- Filtered results empty: "No traffic matches your filters. Try adjusting the filters."

### Loading States
- Show spinner while initial load
- Show subtle indicator during polling refresh
- Don't block UI during background refreshes

---

## Accessibility

- Use semantic HTML (`<table>`, `<thead>`, `<tbody>`)
- Add ARIA labels to filter controls
- Keyboard navigation for table rows (arrow keys)
- Focus management when opening drawer
- Screen reader announcements for updates

---

## Testing Plan

### Unit Tests (Manual)
- TrafficTable renders correctly with mock data
- Filters work correctly (method, status, path)
- Detail view displays all fields correctly
- JSON formatting in code blocks is correct
- Empty states display appropriately

### Integration Tests (Playwright)

Add to `tests/frontend.spec.js`:

```javascript
test('traffic view displays logs', async ({ page }) => {
  // Navigate to server with traffic
  // Check table renders
  // Verify columns exist
  // Check data is displayed
});

test('traffic filters work', async ({ page }) => {
  // Apply method filter
  // Verify filtered results
  // Apply status filter
  // Apply path search
});

test('clicking traffic row opens detail drawer', async ({ page }) => {
  // Click row
  // Verify drawer opens
  // Check detail sections exist
});

test('clear traffic works', async ({ page }) => {
  // Click clear button
  // Confirm dialog
  // Verify traffic cleared
  // Check empty state displays
});

test('traffic auto-refreshes', async ({ page }) => {
  // Wait for auto-refresh (2s)
  // Verify new data appears
  // Check last update time changes
});
```

### Performance Tests
- Load 1000 traffic logs
- Verify render time < 500ms
- Verify polling doesn't cause memory leaks
- Verify smooth scrolling

---

## Success Criteria

Phase 8 is complete when:

1. ✅ Traffic table displays all logged requests correctly
2. ✅ Method badges use correct pastel colors (from Phase 7)
3. ✅ Status badges use correct color families
4. ✅ Path is truncated if > 30 characters
5. ✅ Duration displays in milliseconds
6. ✅ Rule indicator shows checkmark or dash
7. ✅ Filters work correctly (method, status, path)
8. ✅ Clear traffic button works and shows confirmation
9. ✅ Refresh button manually updates data
10. ✅ Auto-polling updates every 2 seconds
11. ✅ Last update time displays and updates
12. ✅ Clicking row opens detail drawer
13. ✅ Detail view shows all request/response data
14. ✅ JSON formatting is readable in code blocks
15. ✅ Matched rule section displays when applicable
16. ✅ Empty state displays when no traffic
17. ✅ Loading states work correctly
18. ✅ No console errors
19. ✅ Polling stops when navigating away
20. ✅ Design follows Phase 7 guidelines (sharp edges, black/white, pastel badges)
21. ✅ All frontend tests pass (existing + new)
22. ✅ Performance is acceptable with 1000 logs
23. ✅ Code is clean and maintainable
24. ✅ Ready for Phase 9 (Rules Editor)

---

## Notes for Implementation

1. **Auto-Refresh Strategy:** Use `setInterval` for simplicity. Consider WebSocket in future for true real-time updates.

2. **Performance:** With 1000 log limit (backend), rendering should be fast. If needed, implement pagination or virtual scrolling.

3. **Filter Logic:** Status family filtering ("2xx", "4xx") should be done client-side since backend only supports exact status code filtering.

4. **JSON Formatting:** Use `JSON.stringify(obj, null, 2)` for readable formatting. Consider syntax highlighting library in future phases if needed.

5. **Drawer Integration:** Use existing `DrawerController` from Phase 7. Just provide HTML content to render.

6. **Path Truncation:** Use CSS `text-overflow: ellipsis` for truncation. Full path visible in detail view.

7. **Rule Indicator:** Simple checkmark (✓) or dash (-) character. No complex icons needed.

8. **Timestamp Display:** Use `toLocaleString()` for user-friendly timestamps in detail view.

9. **Error Bodies:** If request/response has error field, display it prominently in detail view.

10. **Create Rule Button:** Add button to detail view but make it inactive/placeholder. Full implementation in Phase 9.

---

## Future Enhancements (Post Phase 8)

- WebSocket for real-time updates (no polling)
- Export traffic logs as HAR file
- Request replay functionality
- Request/response diff viewer
- Syntax highlighting for JSON
- Copy to clipboard buttons
- Filter by date/time range
- Advanced search with regex patterns
- Saved filter presets
- Traffic statistics dashboard

---

**Next Phase:** Phase 9 - Frontend - Rules Editor

