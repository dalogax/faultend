# UI Components

All components are CSS classes defined in `/public/css/components.css` and `/public/css/app.css`, rendered via vanilla JS. No framework — components are constructed with template literals and inserted via `innerHTML`.

---

## Button

A unified button system with three variants and one icon-only mode.

### Variants

| Class | Background | Border | Text | Hover |
|-------|-----------|--------|------|-------|
| `.btn` | `black` | `1px black` | white | inverts to white bg, black text |
| `.btn-secondary` | white | `1px black` | black | inverts to black bg, white text |
| `.btn-danger` | white | `1px red` | red | inverts to red bg, white text |
| `.btn-icon` | none | none | gray-dark | color → black |

All buttons use `font-weight: 300`, `font-size: 1rem`, `padding: 8px 16px`, `border-radius: 0`, `cursor: pointer`.

**Disabled state** (`.btn:disabled`): gray-light bg, gray-mid text, not-allowed cursor.

### Usage Patterns
- `.btn` — primary CTA (Create Server, Save Rule, Sign In)
- `.btn-secondary` — secondary actions (Cancel, Logout, Refresh, Clear)
- `.btn-danger` — destructive confirmation (Delete, Remove)
- `.btn-icon` — compact icon-only actions in table rows (edit ✎, delete ✕, copy 📋)

---

## Badge

Small inline labels, 14px, `padding: 2px 8px`, sharp edges.

### HTTP Method Badges

```html
<span class="badge badge-get">GET</span>
<span class="badge badge-post">POST</span>
<span class="badge badge-put">PUT</span>
<span class="badge badge-patch">PATCH</span>
<span class="badge badge-delete">DELETE</span>
<span class="badge badge-options">OPTIONS</span>
<span class="badge badge-head">HEAD</span>
```

### HTTP Status Badges

```html
<span class="badge badge-status-2xx">200</span>
<span class="badge badge-status-3xx">301</span>
<span class="badge badge-status-4xx">404</span>
<span class="badge badge-status-5xx">500</span>
```

### Rule Action Badges

```html
<span class="badge badge-action-mock">mock</span>
<span class="badge badge-action-proxy">proxy</span>
```

---

## Toggle Switch

Custom styled checkbox used for enabling/disabling rules.

```html
<label class="toggle-switch">
  <input type="checkbox" checked>
  <span class="toggle-slider"></span>
</label>
```

- **Off state**: gray-light background, black knob
- **On state**: black background, white knob
- Width: 40px, Height: 20px, knob: 14×14px

---

## Form

### Input Fields

All text inputs, textareas, and selects share `.input`:
- `1px solid black` border
- `padding: 8px 16px`
- `width: 100%`
- Focus: border becomes 2px, no outline

Textarea (`.input` + `textarea`): monospace font, `min-height: 100px`, resizable vertically.

### Form Layout Classes

| Class | Purpose |
|-------|---------|
| `.form-group` | Generic field wrapper with bottom margin |
| `.form-field` | Labeled field unit |
| `.form-label` | Block label, 14px, gray-dark |
| `.form-hint` | 14px muted helper text below input |
| `.form-error` | 14px red error text below input |
| `.form-row` | 2-column grid layout (`grid-template-columns: 1fr 1fr`) |
| `.form-section` | Grouped section with heading and bottom border divider |
| `.form-actions` | Right-aligned button row at bottom of form |
| `.conditional-fields` | Indented box shown/hidden based on radio selection |

### Radio Group

```html
<div class="radio-group">
  <label class="radio-label">
    <input type="radio" name="action" value="proxy">
    <span>Proxy to backend</span>
  </label>
  <label class="radio-label">
    <input type="radio" name="action" value="mock">
    <span>Mock response</span>
  </label>
</div>
```

### Checkbox Label

```html
<label class="checkbox-label">
  <input type="checkbox" checked>
  <span>Enabled</span>
</label>
```

---

## Drawer

A right-side slide-in panel (600px wide on desktop) used for all forms and detail views. Only one drawer exists in the DOM at a time; content is swapped dynamically.

```html
<div class="drawer-overlay"></div>  <!-- dimmed background, z-index 2000 -->
<div class="drawer">               <!-- slide panel, z-index 2001 -->
  <div class="drawer-header">
    <h2 class="drawer-title">Title</h2>
  </div>
  <div class="drawer-body">
    <!-- scrollable content -->
  </div>
  <div class="drawer-footer">      <!-- optional, for primary actions -->
    <button class="btn">Save</button>
  </div>
</div>
```

**Animation:** `transform: translateX(100%)` → `translateX(0)` over `300ms ease-out`.

**Triggered by:** `.active` class on both `.drawer` and `.drawer-overlay`.

### Drawer Instances

The same `.drawer` component serves all these use cases:

| Content | Trigger |
|---------|---------|
| Traffic request detail | Click any traffic row |
| Create Rule form | "Create Rule" button |
| Edit Rule form | Edit icon (✎) on rule row |
| Create Server form | "Create Server" button |
| Server Settings | "Settings" button in top bar |

---

## Confirmation Dialog

A centered modal used for destructive confirmations. Distinct from the Drawer.

```html
<div class="confirm-overlay"></div>  <!-- full-screen dim, z-index 2000 -->
<div class="confirm-dialog">         <!-- centered dialog, z-index 2001 -->
  <div class="confirm-header">
    <h3>Delete Rule</h3>
  </div>
  <div class="confirm-body">
    <p>Delete rule "Mock User"? This cannot be undone.</p>
  </div>
  <div class="confirm-actions">
    <button class="btn-secondary">Cancel</button>
    <button class="btn-danger">Delete</button>
  </div>
</div>
```

**Animation:** Scale `0.9 → 1.0` + fade in over `300ms ease-out`.

**Used for:** Delete rule, delete server, clear all traffic.

---

## Toast Notification

Non-blocking feedback banners, top-right corner, stacked vertically.

```html
<div class="toast-container">
  <div class="toast">Server created successfully</div>
  <div class="toast">Failed to load rules</div>
</div>
```

- Black background, white text
- Slides in from right (`slideIn` keyframe)
- `min-width: 300px`
- `z-index: 10000` (above everything)
- Programmatic: `Toast.error('message')` / `Toast.success('message')`

---

## Spinner (Loading Indicator)

```html
<span class="spinner">
  <span class="spinner-element"></span>
</span>
```

20×20px, rotating border (top border transparent), `1s linear infinite`.

---

## Tabs

Used in the "Create Server" drawer to switch between Manual/Import modes.

```html
<div class="tabs">
  <button class="tab active">Manual</button>
  <button class="tab">Import from File</button>
</div>
```

Active tab: `border-bottom: 2px solid black`. Inactive: gray-mid text.

Also exists as `.column-tabs` / `.column-tab` with identical styling, used for per-column tab navigation inside the server management view.

---

## Table

Three table variants — all share similar structure with collapsed borders, sticky headers, and row hover states.

### Traffic Table (`.traffic-table`)

Columns: Method | Path | Status | Duration | Rule matched

Special cells:
- `.path-cell`: truncates at 50 chars, full path on hover via `title`
- `.duration-cell`: monospace font, right-aligned
- `.rule-indicator`: centered `✓` or `−`

### Rules Table (`.rules-table`)

Columns: Priority | Method | Path Pattern | Action | Enabled | Actions

Special cells:
- `.priority-cell`: monospace
- `.path-cell`: truncates at 40 chars
- `.actions-cell`: right-aligned, contains `.btn-icon` buttons

### Server Table (`.server-table`)

Columns: Server ID | URL | Created | Last Activity | Traffic | Rules

---

## Empty State

Used when tables have no data.

```html
<div class="empty-state">
  No rules configured yet. Create a rule to start routing traffic.
</div>
```

Large (`.empty-state`): 400px min-height, centered, 24px, gray-mid.
Small (`.empty-state-small`): inline, 14px, gray-mid, for sub-sections.

---

## Code Block

Used for displaying headers and JSON bodies in traffic detail.

```html
<div class="code-block">
  <h4>Headers</h4>
  <pre>{ "content-type": "application/json" }</pre>
</div>
```

- Monospace font, 14px
- `#fafafa` background, `1px gray-light` border
- Horizontally scrollable
- `.error-block` variant: `#fff3f3` background, `#f8d7da` border
