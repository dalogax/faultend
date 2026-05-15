# Design System Brief for Claude Design

This document is a briefing for Claude Design to build a formal design system for Faultend. It summarizes the current state, lists all component needs, and describes the design intent.

---

## What is Faultend?

Faultend is a developer tool — a lightweight HTTP proxy that lets developers test application resilience by intercepting requests and injecting faults (mock errors, latency, wrong responses). The target users are software engineers and QA teams.

The UI is an internal-facing web app, not a consumer product. It should feel like a professional developer tool — precise, dense, fast, no marketing fluff.

---

## Current Design Language

The existing design language is minimalist and intentional:

- **Monochrome base** — black and white with a single gray scale
- **Zero border radius** — all sharp edges, geometric and grid-aligned
- **Light font weight** — Inter 300 throughout, hierarchy via size not weight
- **Pastel badge accents** — the only color in the UI comes from HTTP method/status badges
- **High information density** — tables pack a lot of data; the UI is for power users not novices

This should be preserved and refined, not replaced.

---

## Foundations to Define

### 1. Color
- Formalize the current monochrome + pastel palette
- Define semantic color roles: surface, border, text-primary, text-secondary, text-muted, interactive, danger
- Define the full badge color set (7 method colors + 4 status colors + 2 action colors)
- Consider: does the system need a dark mode? (Not currently implemented)

### 2. Typography
- Inter 300 is the only weight used — consider whether 400 is needed for accessibility
- 3-size scale (14/16/24px) is tight — consider whether intermediate sizes are needed
- Monospace font for code/paths/IDs — formalize when to use it

### 3. Spacing
- Current 5-level scale (4/8/16/32/64px) — clean and geometric
- Formalize as a spacing grid

### 4. Borders
- All `border-radius: 0` — define all border styles as tokens (1px black, 2px black, 1px gray-light)

### 5. Elevation
- No shadows. Define "elevation" via borders + background color contrast only.

---

## Components to Design

These components exist and need formal design specs. Similar components should be unified into shared patterns.

### Atomic
- [ ] **Button** — 3 variants (primary/secondary/danger) + icon-only
- [ ] **Badge** — method (7 variants) + status (4 variants) + action (2 variants)
- [ ] **Toggle Switch** — enabled/disabled for rules
- [ ] **Loading Spinner** — animated ring
- [ ] **Toast** — success and error notifications (same visual, text distinguishes)

### Form Controls
- [ ] **Text Input** — single line
- [ ] **Textarea** — multiline, monospace for JSON
- [ ] **Select / Dropdown**
- [ ] **Radio Group** — used for action type (proxy/mock) and latency type
- [ ] **Checkbox** — used for "Enabled" field
- [ ] **Form Layout** — label + input + hint + error stacked pattern
- [ ] **Form Row** — 2-column side-by-side fields
- [ ] **Form Section** — grouped fields with heading and bottom border
- [ ] **Conditional Fields** — indented box for context-dependent inputs

### Navigation
- [ ] **Top Bar** — fixed header with left/center/right zones
- [ ] **Tab Bar** — underline-style tabs (used in drawer forms and column navigation)
- [ ] **Nav Links** — filled-on-active inline navigation links

### Overlay Patterns
- [ ] **Drawer** — right-side slide panel, 600px wide, scrollable body
  - Used for: traffic detail, create/edit rule, create server, settings
  - Header + scrollable body + optional footer pattern
- [ ] **Confirmation Dialog** — centered modal, scale-in animation, destructive confirm pattern
- [ ] **Login Overlay** — full-screen cover page

### Data Display
- [ ] **Table** — with sticky header, hover rows, sorted priority
  - Traffic Table variant
  - Rules Table variant (with toggle + action buttons)
  - Server Table variant
- [ ] **Empty State** — large (400px min-height) and small inline variants
- [ ] **Code Block** — pre/code display with optional error variant
- [ ] **Detail Row** — `label: value` layout for traffic detail view

### Layout
- [ ] **Two-Column Layout** — equal split, responsive to single column at 1024px
- [ ] **View Header** — title + action button row
- [ ] **Settings Section** — heading + content group

---

## Key Interaction Patterns

1. **Row → Drawer**: Clicking a table row slides open the drawer with detail. Used in traffic and server list.
2. **Button → Drawer**: Buttons like "Create Rule" and "Create Server" open the same drawer with a form.
3. **Toggle in Row**: Rule enable/disable happens inline via the toggle switch without opening a drawer.
4. **Destructive with Confirmation**: Delete and clear actions always show a centered dialog before proceeding.
5. **Tab Switching**: Within the Create Server drawer, tabs switch between Manual and Import without re-opening the drawer.
6. **Inline Filtering**: Traffic table has live filters (method, status, path) that update the table in place.
7. **Auto-Polling**: Traffic table auto-refreshes every 2 seconds; last-update timestamp shown above.

---

## What Good Looks Like

The design system should feel like:
- VS Code's workbench UI — dense, precise, monochrome, with color only as signal
- Linear's data tables — clean rows, smooth interactions, professional
- Stripe's developer dashboard — technical clarity, not decorative

It should **not** feel like a consumer SaaS product with rounded cards, colorful icons, and marketing copy.

---

## File References

| File | Purpose |
|------|---------|
| `public/css/variables.css` | All design tokens |
| `public/css/components.css` | All component styles |
| `public/css/layout.css` | Page layout |
| `public/css/drawer.css` | Drawer styles |
| `public/css/app.css` | App-specific overrides + utilities |
| `public/css/reset.css` | CSS reset |
| `public/js/components.js` | Toast, Spinner, ConfirmDialog JS |
| `public/js/drawer.js` | Drawer controller JS |
| `public/js/views/traffic.js` | Traffic table + detail view |
| `public/js/views/rules.js` | Rules table + form |
| `public/js/app.js` | Server list + create server form |
