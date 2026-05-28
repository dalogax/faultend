# Faultend · Design System Reference

> **Read this document before touching any UI element** — HTML, CSS, or JS that renders visible UI.

The source of truth for design tokens lives in [`docs/design_system/tokens.css`](design_system/tokens.css).
Component examples and artboards live in [`docs/design_system/foundations.jsx`](design_system/foundations.jsx) and [`docs/design_system/components.jsx`](design_system/components.jsx).
The production CSS layer implementing all of this is in [`public/css/variables.css`](../public/css/variables.css) (tokens) and [`public/css/components.css`](../public/css/components.css) (components).

---

## 1 · Design Language

Faultend is **a monochrome, sharp-edged developer tool**. Every decision comes from these three principles:

1. **Color only as signal — never decoration.** The only chroma allowed is amber (fault indicators) and red (danger). Everything else is ink-scale grey.
2. **Radius = 0. Always.** Sharp edges are the brand. No `border-radius` anywhere — not on buttons, badges, inputs, cards, dialogs, or progress bars.
3. **No shadows.** Depth comes from 1px borders and surface contrast only. Never use `box-shadow` for elevation.

Violating any of these three is a brand regression, not a style preference.

---

## 2 · Design Tokens

All values come from CSS custom properties. **Never hardcode a hex value in any production CSS file.** Always use a `--ft-*` variable.

### 2.1 · Ink scale (neutrals)

| Token | Light value | Role |
|-------|-------------|------|
| `--ft-ink-0` | `#ffffff` | Surface — interactive |
| `--ft-ink-1` | `#fafafa` | Canvas — main background |
| `--ft-ink-2` | `#f4f4f3` | Alt surface — code, filter chrome |
| `--ft-ink-3` | `#ebebe9` | Hairline divider |
| `--ft-ink-4` | `#dedcd8` | Subtle border |
| `--ft-ink-5` | `#c4c2bd` | Strong border (ghost button frame) |
| `--ft-ink-7` | `#8a8884` | Placeholder / disabled text |
| `--ft-ink-9` | `#5a5854` | Muted text |
| `--ft-ink-10` | `#3a3936` | Secondary text / primary button fill |
| `--ft-ink-11` | `#1c1c1a` | Primary text |
| `--ft-ink-12` | `#0a0a09` | Strong fg — button border, section lines, fill |

> **Note:** There is no `--ft-ink-6` or `--ft-ink-8`. Skip values do not exist; never use them.

### 2.2 · Semantic roles (use these in components, not raw ink tokens)

```
--ft-bg              /* page background */
--ft-surface         /* card / panel background (ink-0) */
--ft-surface-2       /* code blocks, alt surfaces (ink-2) */
--ft-hairline        /* row separators (ink-3) */
--ft-border          /* default border (ink-4) */
--ft-border-strong   /* section lines, inputs, button borders (ink-12 light / ink-5 dark) */
--ft-fg              /* body text (ink-11) */
--ft-fg-strong       /* headings, bold values (ink-12) */
--ft-fg-muted        /* labels, secondary text (ink-9) */
--ft-fg-faint        /* placeholders, meta (ink-7) */
--ft-fg-on-fill      /* text on dark button fill (ink-0) */
```

### 2.3 · Signal — Amber (fault indicators only)

```
--ft-amber-bg    /* amber badge background */
--ft-amber-line  /* amber badge border */
--ft-amber-ink   /* amber badge text */
--ft-amber-pure  /* amber accent — icons, progress bars, warning states */
```

Use amber **only** for fault/signal indicators: admin badges, warning states, quota fill > 80%. Never for generic decorative colour.

### 2.4 · Danger — Red (destructive actions / 5xx only)

```
--ft-red        /* danger text / border */
--ft-red-bg     /* danger badge background */
--ft-red-ink    /* danger badge text */
```

### 2.5 · Badge colour families

Method badges use `--ft-m-{method}-bg` / `--ft-m-{method}-fg`.
Status badges use `--ft-s-{family}-bg` / `--ft-s-{family}-fg`.
Action badges use `--ft-a-{action}-bg` / `--ft-a-{action}-fg`.

Available action tokens: `mock`, `proxy`, `delay`, `transform`. No other action colours exist.

---

## 3 · Typography

| Role | Font | Size | Weight | Notes |
|------|------|------|--------|-------|
| Display | Inter | 36px | 400 | Landing / hero titles only |
| Title | Inter | 26px | 500 | Page section titles |
| Subtitle | Inter | 20px | 500 | Panel headings |
| Body (default) | Inter | 13px | 400 | All running text |
| Body large | Inter | 16px | 400 | Prominent descriptions |
| Caption | Inter | 12px | 400 | Metadata, timestamps |
| Eyebrow/label | Inter | 11px | 500 | Section headers — UPPERCASE, `letter-spacing: 0.12em` |
| Telemetry (mono) | JetBrains Mono | 12–14px | 400 | Paths, IDs, durations, numbers |
| Meta (mono) | JetBrains Mono | 11px | 400 | Timestamps, token IDs |

### Rules

- **Never use `font-weight: 600` or 700 anywhere in the UI.** Maximum is 500.
- Hierarchy comes from **size and colour** — not from bold text.
- Use `font-family: var(--ft-mono)` for any machine-originated value: paths, durations, IDs, status codes, quota numbers.
- Numbers in tables and status displays must use tabular figures: `font-feature-settings: 'tnum', 'zero'` (the `.ft-mono` class in tokens.css handles this).

---

## 4 · Spacing

The spacing scale uses a 2px base with these named steps:

| Token | Value | Use |
|-------|-------|-----|
| `--ft-sp-1` | 2px | Hairline / icon tweak |
| `--ft-sp-2` | 4px | Badge padding, gaps |
| `--ft-sp-3` | 8px | Button padding, tight stack |
| `--ft-sp-4` | 12px | Default gap, table cell padding |
| `--ft-sp-5` | 16px | Section padding |
| `--ft-sp-6` | 24px | Drawer body gap |
| `--ft-sp-7` | 32px | Page padding |
| `--ft-sp-8` | 48px | Large hero gap |
| `--ft-sp-9` | 64px | Full-page padding |

No magic numbers. All gaps, paddings, and margins must use the spacing scale.

---

## 5 · Buttons

Four variants. All share: height 32px, `border: 2px solid`, `border-radius: 0`, `font-size: 13px`, `font-weight: 500`.

| Class | Use | Fill | Border |
|-------|-----|------|--------|
| `.btn` or `.btn-primary` | Single CTA per surface | `ink-10` (hover: `ink-9`) | `ink-12` |
| `.btn-secondary` | Cancel / secondary action | `ink-0` (hover: `ink-2`) | `ink-12` |
| `.btn-ghost` | Toolbar repeatable actions (Refresh, Filter…) | `ink-0` (hover: `ink-2`) | `ink-5` |
| `.btn-danger` | Destructive actions — never the primary CTA | `ink-0` (hover: `red-bg`) | `red` |

Sizes: default 32px, `.btn-sm` 24px, `.btn-icon` 28px square.

**Rules:**
- `.btn-danger` is never the primary CTA; it lives only inside confirmation flows.
- Do not use `btn btn-danger` together — `.btn-danger` is self-contained.
- No `color-mix()`, `!important`, or opacity tricks on buttons. If a style isn't achievable with the four variants, use the design system drawer footer pattern instead.
- For destructive confirmation, use the **arm-then-fire** pattern: first click adds `.armed` class (fill turns red), second click fires. Auto-disarm after 3s. No centered modal dialogs.

---

## 6 · Badges

One shape, three families. All badges share:
- `height: 18px` (large: 22px with `.badge-lg`)
- `padding: 0 6px` (large: `0 8px`)
- `font-family: var(--ft-mono)`
- `font-size: 11px` (large: 12px)
- `font-weight: 400`
- `border: 1px solid transparent`
- `border-radius: 0`
- `letter-spacing: 0.04em`

CSS classes in `components.css`:

```css
/* Method  */    .badge-get  .badge-post  .badge-put  .badge-patch  .badge-delete  .badge-options  .badge-head  .badge-any
/* Status  */    .badge-status-2xx  .badge-status-3xx  .badge-status-4xx  .badge-status-5xx
/* Action  */    .badge-action-mock  .badge-action-proxy  .badge-action-delay  .badge-action-transform
/* Role    */    .badge-outline  .badge-owner  .badge-admin  .badge-shared
/* Server  */    .role-badge  .role-badge.role-owner  .role-badge.role-admin
```

**Rules:**
- Never add `border-radius` to badges.
- Never use `font-weight: 600` on badges.
- Use `.badge-outline` for neutral meta labels (json, regex, local, etc.).
- Custom badge colours must use existing `--ft-a-*` or `--ft-s-*` token pairs. No new hardcoded hex colours.
- To signal "admin" / "elevated", use the amber family (`--ft-amber-bg`, `--ft-amber-line`, `--ft-amber-ink`) — that is what it is for.

---

## 7 · Form Inputs

Use the `.input` class for all form inputs, textareas, and selects. It handles: height, padding, border, focus ring, placeholder colour, and border-radius (0).

```html
<input class="input" type="text" />
<input class="input input-mono" type="text" />   <!-- monospace variant -->
<select class="input">…</select>                 <!-- arrow injected via CSS -->
<textarea class="input">…</textarea>             <!-- auto-height, mono font -->
```

**Focus state** (from `.input:focus`):
```css
border-color: var(--ft-ink-12);
box-shadow: inset 0 0 0 1px var(--ft-ink-12);
```

**Error state**: add `.input-error`.

Field wrappers use `.form-field` (margin-bottom sp-4) with `.form-field label` (12px, fg-muted). Required indicators use `<span class="req">*</span>` coloured `--ft-amber-pure`.

Do **not** create custom input classes with non-standard border values (`--ft-border` instead of `--ft-border-strong`) or custom focus states. Always compose from `.input`.

---

## 8 · Tables

Use the existing table classes: `.traffic-table`, `.rules-table`, `.server-table`, or the admin table. All share:

- Headers: `font-weight: 400`, `font-size: 11px`, `letter-spacing: 0.08em`, `text-transform: uppercase`, `color: var(--ft-fg-faint)`, `border-bottom: 1px solid var(--ft-border)`
- Cells: `padding: 8px 12px`, `border-bottom: 1px solid var(--ft-hairline)`, `vertical-align: middle`
- Row hover: `background: var(--ft-ink-2)`
- Numeric cells: `font-family: var(--ft-mono)`, `font-size: 12px`
- Muted cells: `color: var(--ft-fg-faint)`

**Never use `font-weight: 600` on table headers.**

---

## 9 · Section Headers

The standard section header pattern:

```css
font-size: 11px;
font-weight: 500;
letter-spacing: 0.12em;
text-transform: uppercase;
color: var(--ft-fg-muted);
border-bottom: 1px solid var(--ft-border-strong);
padding-bottom: var(--ft-sp-3);
margin-bottom: var(--ft-sp-4);
```

Implemented as `.form-section h3` in `components.css`. Match this exactly in new panels.

---

## 10 · Cards and Surfaces

```css
.ft-card { background: var(--ft-surface); border: 1px solid var(--ft-border); }
```

**Never add `border-radius`, `box-shadow`, or `padding > 24px` to cards.** Standard padding is `16px 20px`.

---

## 11 · Drawers

Right-side panel. Chrome:

```
.ft-drawer-header — 16px 20px padding, border-bottom, title uppercase 11px / fg-faint
.ft-drawer-body   — 20px padding, overflow-y auto, flex column, gap 24px
.ft-drawer-footer — 14px 20px padding, border-top, flex justify-end, gap 8px, surface-2 bg
```

Drawer title style: `font-size: 14px; font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ft-fg-faint)`.

---

## 12 · Toasts

Top-right fixed stack. Three tones: neutral (dark fill), warning (amber dot), error (red fill).
Use `Toast.success()`, `Toast.error()` from `public/js/components.js`.

---

## 13 · Progress / Quota Bars

```css
.quota-track {
  height: 3px;
  background: var(--ft-ink-3);
  /* NO border-radius */
}
.quota-fill {
  height: 100%;
  background: var(--ft-ink-10);      /* normal */
  /* NO border-radius */
}
.quota-fill.quota-fill-warn { background: var(--ft-amber-pure); }  /* ≥80% */
.quota-fill.quota-fill-full { background: var(--ft-red); }         /* 100% */
```

Never use `--ft-yellow`, `--ft-ink-8`, or any undefined token. The amber token for warning is always `--ft-amber-pure`.

---

## 14 · Top Bar

44px fixed bar, `background: var(--ft-surface)`, `border-bottom: 1px solid var(--ft-border-strong)`. Contains: logo, nav items, right-side controls. All implemented in `.top-bar` + `.top-bar-right` from `layout.css`.

---

## 15 · Dark Mode

CSS variables flip automatically when `[data-theme="dark"]` is set on `<html>`. All `--ft-*` tokens have dark counterparts in `variables.css`. Components built entirely from `--ft-*` tokens **get dark mode for free** — no extra `[data-theme="dark"]` overrides needed.

Only add dark-mode overrides when using hardcoded values that are unavoidable (e.g. CodeMirror syntax tokens). If you find yourself writing a `[data-theme="dark"]` override for a badge or button, you're using hardcoded hex instead of design tokens — fix that instead.

---

## 16 · What NOT to Do

| ❌ Never | ✅ Instead |
|---------|-----------|
| `border-radius: Npx` | Remove — 0 is always the value |
| `box-shadow` for depth | Use `border: 1px solid var(--ft-border)` |
| `font-weight: 600` or `700` | Use 400 (body) or 500 (labels/headings) |
| Hardcoded hex: `#e8d5f5` | Use `--ft-a-transform-bg` or the relevant token |
| `--ft-ink-6`, `--ft-ink-8` | These tokens don't exist; use ink-5 or ink-9/10 |
| `--ft-fg-normal` | Use `--ft-fg` |
| `--ft-yellow` | Use `--ft-amber-pure` for warnings |
| `color-mix()` on existing variants | Use `.btn-danger` which already has the hover state |
| Custom input class with `--ft-border` | Use `.input` (which uses `--ft-border-strong`) |
| `!important` on component overrides | Restructure selectors instead |
| `btn btn-danger` combined | Use `.btn-danger` alone — it's self-contained |
| Custom purple/green/blue badge colours | Use amber (signal), red (danger), or outline (neutral) |
