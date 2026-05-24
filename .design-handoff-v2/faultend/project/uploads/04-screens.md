# Screens & Screenshot Index

This document maps each screenshot to its corresponding UI state. All screenshots are in `docs/design_system/prev/`.

Screenshots were captured at:
- **Desktop:** 1440×900 viewport, 2× device pixel ratio
- **Mobile:** 390×844 viewport (iPhone 14 size), 3× device pixel ratio

---

## Desktop Screenshots

### 01. Login Screen
**File:** `desktop-01-login.png`

The initial state of the app when no user is authenticated. Full-screen white overlay with centered modal:
- Faultend SVG logo (80px)
- "faultend" heading
- Description text (gray)
- "Sign in with Google" primary button
- "Dev Login (local only)" text link (visible on localhost)

---

### 02. Server List (Empty → with one server)
**File:** `desktop-02-server-list.png`

The main server list view after login. Shows:
- Top bar with logo, brand name, user name, logout button
- "Servers" heading + "Create Server" button
- Server table: Server ID | URL | Created | Last Activity | Traffic | Rules

---

### 03–04. Server Dashboard & Traffic View
**Files:** `desktop-03-server-dashboard.png`, `desktop-04-traffic-view.png`

Two-column layout showing Traffic (left) + Rules (right) for a selected server.

Traffic column shows:
- Section header: "Traffic" + Refresh/Clear buttons
- "Last updated: just now" timestamp
- Filters bar: Method dropdown | Status dropdown | Path search
- Traffic table: Method badge | Path | Status badge | Duration (ms) | Rule matched (✓/−)

---

### 05. Traffic Detail Drawer
**File:** `desktop-05-traffic-detail-drawer.png`

Right-side drawer open with traffic detail for a clicked row:
- Drawer header: "Request Details"
- Overview section: Method, Path, Status, Duration, Timestamp, Target
- Matched Rule section: Name, Priority, Action badge
- Request section: Headers (JSON code block), Query params, Body
- Response section: Headers, Body, Error (if any)
- "Create Rule" primary button at bottom

---

### 06. Traffic View with Filters
**File:** `desktop-06-traffic-filtered.png`

Same as traffic view but with Method filter active (GET selected). Shows only GET requests in the table.

---

### 07–08. Two-Column Layout & Rules View
**Files:** `desktop-07-two-column-layout.png`, `desktop-08-rules-view.png`

Full view showing both columns. Rules column shows:
- "Rules" heading + "Create Rule" button
- Rules table: Priority | Method badge | Path Pattern | Action badge | Enabled toggle | Actions (edit ✎, delete ✕)

---

### 09. Create Rule Drawer (Proxy mode)
**File:** `desktop-09-create-rule-drawer.png`

Drawer open with blank Create Rule form in proxy mode:
- "Basic Information" section: Priority (number) + Method (select) in form-row, Path Pattern (text), Enabled (checkbox)
- "Action" section: Proxy / Mock radio buttons, Target URL input in conditional-fields box

---

### 10. Create Rule Drawer (Mock mode)
**File:** `desktop-10-rule-form-mock.png`

Same form with Mock radio selected. Shows:
- Status Code input
- Response Body textarea (monospace)
- Latency radio group: None / Fixed / Range

---

### 11. Rule Form with Latency Range
**File:** `desktop-11-rule-form-latency.png`

Mock mode with Range latency selected, showing Min (ms) + Max (ms) inputs in a form-row layout.

---

### 12. Edit Rule Drawer
**File:** `desktop-12-edit-rule-drawer.png`

Drawer with an existing rule pre-populated. Same form as Create Rule but with title "Edit Rule" and values filled in.

---

### 13. Create Server Drawer (Manual Tab)
**File:** `desktop-13-create-server-drawer.png`

Drawer with "Create New Server" form:
- Tabs: Manual | Import from File
- Manual tab: Server ID input with validation hint, Cancel + Create buttons

---

### 14. Create Server Drawer (Import Tab)
**File:** `desktop-14-import-server-tab.png`

Import tab showing:
- Description text
- "Choose File" button (hidden file input)
- Preview area (shown after file selected)
- Form actions (Cancel + Create Server)

---

### 15. Server List (Full)
**File:** `desktop-15-server-list-full.png`

Server list with multiple servers populated. Shows all columns including traffic/rules counts.

---

### 16. Settings Drawer
**File:** `desktop-16-settings-drawer.png`

Settings drawer for the current server. Content includes server configuration, sharing/collaborators, and export options in `.settings-section` groups.

---

### 17. Confirmation Dialog
**File:** `desktop-17-confirm-dialog.png`

Centered modal confirmation dialog (triggered by "Clear" button):
- Semi-transparent overlay
- Dialog box with header ("Clear All Traffic"), body text, Cancel + Confirm buttons
- Confirm button in danger style (red)

---

## Mobile Screenshots (390px width)

### 01. Mobile Login
**File:** `mobile-01-login.png`

Same login screen as desktop, stacks well on mobile. Logo, heading, description, and button centered.

---

### 02. Mobile Server List
**File:** `mobile-02-server-list.png`

Server list on mobile. The server table is inside `.server-table-container` with `overflow-x: auto`, allowing horizontal scroll. Top bar remains horizontal.

---

### 03. Mobile Server Dashboard
**File:** `mobile-03-server-dashboard.png`

At 390px, the two-column layout (`≤1024px` breakpoint) stacks to a single column. Traffic appears first, then Rules below.

---

### 04. Mobile Traffic View
**File:** `mobile-04-traffic-view.png`

Traffic section on mobile showing the filter bar (compresses horizontally) and the traffic table. The table scrolls horizontally.

---

### 05. Mobile Traffic Detail Drawer
**File:** `mobile-05-traffic-detail-drawer.png`

Drawer open on mobile. The drawer is 600px wide but the viewport is 390px, so the drawer effectively takes full width on mobile. Shows request details with code blocks.

---

### 06. Mobile Rules View
**File:** `mobile-06-rules-view.png`

Rules table on mobile. Rules table scrolls horizontally within `.rules-table-container`.

---

### 07. Mobile Create Rule Drawer
**File:** `mobile-07-create-rule-drawer.png`

Create Rule form inside drawer on mobile. Form fields stack naturally. The drawer occupies the full screen width.
