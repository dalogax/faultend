# Layout System

Faultend is a single-page application with hash-based routing. Layout is managed via CSS defined in `/public/css/layout.css` and `/public/css/app.css`.

---

## Global Layout

```
┌─────────────────────────────────────────────┐
│  TOP BAR  (fixed, 60px, z-index: 1000)      │
│  [Logo] [Brand] | [Server name + URL] | [User + Settings]
├─────────────────────────────────────────────┤
│                                             │
│           MAIN CONTENT                      │
│           (margin-top: 60px)                │
│           max-width: 1920px                 │
│           padding: 16px                     │
│                                             │
└─────────────────────────────────────────────┘
```

### Top Bar (`.top-bar`)
- Fixed, full width, 60px height
- `background: white`, `border-bottom: 1px solid black`
- Three sections:
  - `.top-bar-left`: Logo + brand name
  - `.top-bar-center`: Server name + proxy URL + copy button (hidden on server list)
  - `.top-bar-right`: User name + Logout button + Settings button

### Main Content (`.main-content`)
- `margin-top: 60px` to clear the fixed top bar
- `padding: 16px`
- `max-width: 1920px`, centered

---

## Views

Each view is a `.view` div that is shown/hidden via `.active` class (`display: block`).

```html
<div id="serverListView" class="view active">...</div>
<div id="serverManagementView" class="view">...</div>
```

### Server List View

A full-width table of servers with a header row containing title and "Create Server" button.

```
┌─ VIEW HEADER ─────────────────────────────┐
│  Servers                    [Create Server]│
├───────────────────────────────────────────┤
│  Server ID │ URL │ Created │ Traffic │ Rules│
├────────────┼─────┼─────────┼─────────┼──── ┤
│  prod-api  │ ... │  2h ago │  15     │  5  │
│  staging   │ ... │  3d ago │  42     │  3  │
└───────────────────────────────────────────┘
```

### Server Management View (Two-Column Layout)

```
┌─ LEFT COLUMN ──────────┬─ RIGHT COLUMN ─────────┐
│                        │                        │
│  Traffic               │  Rules                 │
│  ─────────────────     │  ─────────────────     │
│  [Refresh] [Clear]     │  [Create Rule]         │
│  Filters...            │                        │
│  ┌──────────────────┐  │  ┌──────────────────┐  │
│  │ Traffic Table    │  │  │ Rules Table      │  │
│  └──────────────────┘  │  └──────────────────┘  │
└────────────────────────┴────────────────────────┘
```

Class: `.two-column-layout` — `display: grid; grid-template-columns: 1fr 1fr; gap: 16px`

**Responsive breakpoint:** At `≤1024px`, columns stack vertically to `1fr`.

---

## Drawer Layer

Rendered on top of all content, slides in from the right.

```
┌─ MAIN CONTENT (dimmed) ─────┬── DRAWER ──────────┐
│                             │                    │
│                             │  HEADER            │
│                             │  ─────────────     │
│          (overlay:          │  BODY              │
│     rgba(0,0,0,0.3))        │  (scrollable)      │
│                             │                    │
│                             │  FOOTER (optional) │
└─────────────────────────────┴────────────────────┘
```

- Width: 600px (desktop), full viewport height
- `border-left: 1px solid black`
- Overlay: `rgba(0,0,0,0.3)`, dismisses drawer on click

---

## Login Overlay

Full-screen centered login screen, displayed before authentication.

```
┌─────────────────────────────────────────────┐
│                                             │
│              [Logo 80px]                    │
│               faultend                      │
│                                             │
│      Sign in to manage your fault servers   │
│                                             │
│         [Sign in with Google]               │
│                                             │
│         dev login (local only)              │
│                                             │
└─────────────────────────────────────────────┘
```

`position: fixed; top: 0; width: 100%; height: 100%; background: white; z-index: 1000`

---

## Navigation Patterns

### Server URL Display (Top Bar Center)

When viewing a server, the top bar center shows:
```
[server-name]  [http://production-api.localhost:3000 📋]
```

The URL uses `.font-mono`, `14px`, on a `#fafafa` background chip.

### Hash-Based Routing

| Hash | View Shown |
|------|-----------|
| `(empty)` | Server List |
| `#server/{id}` | Server Management (Traffic + Rules) |
| `#invite/{token}` | Invite Acceptance |

---

## Responsive Behavior

| Breakpoint | Change |
|-----------|--------|
| `≤1024px` | Two-column layout stacks to single column |

No other breakpoints are defined. The top bar does not collapse on mobile — it remains horizontal. On narrow screens, the center section may overflow.

---

## Utility Classes

From `/public/css/app.css`:

```css
.flex           { display: flex; }
.flex-col       { flex-direction: column; }
.gap-sm         { gap: 8px; }
.gap-md         { gap: 16px; }
.gap-lg         { gap: 32px; }
.items-center   { align-items: center; }
.justify-between{ justify-content: space-between; }
.justify-center { justify-content: center; }
.mt-sm / .mb-sm { margin: 8px }
.mt-md / .mb-md { margin: 16px }
.mt-lg / .mb-lg { margin: 32px }
.text-sm        { font-size: 14px; }
.text-base      { font-size: 16px; }
.text-lg        { font-size: 24px; }
.text-black     { color: #000000; }
.text-gray      { color: #666666; }
```
