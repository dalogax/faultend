# Foundations & Design Tokens

Faultend uses a minimal, token-based CSS system defined in `/public/css/variables.css`. All values are CSS custom properties (`--variable-name`). The visual language is deliberately stark: monochrome base with pastel accents, sharp edges, light weight typography.

---

## Color Palette

### Base (Monochrome)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-black` | `#000000` | Primary text, borders, button fills |
| `--color-white` | `#ffffff` | Page background (interactive), drawer backgrounds |
| `--color-red` | `#DC2626` | Danger actions (delete, destructive) |
| `--color-gray-dark` | `#333333` | Secondary text, form labels |
| `--color-gray-mid` | `#666666` | Placeholder text, muted labels, empty states |
| `--color-gray-light` | `#cccccc` | Borders (low-emphasis), dividers, disabled state |
| `--color-background` | `#fafafa` | Page/app background, code blocks, filter areas |

### HTTP Method Badges (Pastel)

These colors are used **only** for HTTP method badges — nowhere else in the UI.

| Token | Value | Method |
|-------|-------|--------|
| `--color-get` | `#b8d4f1` | GET (blue) |
| `--color-post` | `#b8e6d5` | POST (green) |
| `--color-put` | `#f5d5b8` | PUT (orange) |
| `--color-patch` | `#d5e8e6` | PATCH (teal) |
| `--color-delete` | `#f5c2c2` | DELETE (red) |
| `--color-options` | `#e8d5f5` | OPTIONS (purple) |
| `--color-head` | `#f5f5d5` | HEAD (yellow) |

### HTTP Status Code Badges (Pastel)

| Token | Value | Family |
|-------|-------|--------|
| `--color-status-2xx` | `#d4edda` | 2xx Success (green) |
| `--color-status-3xx` | `#d1ecf1` | 3xx Redirect (cyan) |
| `--color-status-4xx` | `#fff3cd` | 4xx Client Error (amber) |
| `--color-status-5xx` | `#f8d7da` | 5xx Server Error (pink-red) |

### Action Badges

| Class | Value | Usage |
|-------|-------|-------|
| `.badge-action-mock` | `#E0E7FF` | Mock action on rule rows |
| `.badge-action-proxy` | `#D1FAE5` | Proxy action on rule rows |

---

## Typography

| Token | Value | Notes |
|-------|-------|-------|
| `--font-primary` | `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` | Body, UI text |
| `--font-mono` | `"SF Mono", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace` | Code blocks, paths, IDs, durations |
| `--font-weight` | `300` | Single weight throughout — all text is light |
| `--text-sm` | `0.875rem` (14px) | Small labels, hints, table cells, badges |
| `--text-base` | `1rem` (16px) | Default body text, buttons, inputs |
| `--text-lg` | `1.5rem` (24px) | Page headings, drawer titles, brand name |
| `--line-height-tight` | `1.2` | Headings |
| `--line-height-normal` | `1.6` | Body text |

> **Design principle:** A single font weight (300) is used across the entire app. Visual hierarchy comes from size, color, and layout — not weight.

---

## Spacing

The spacing scale has 5 levels. All layout gaps, paddings, and margins should use these tokens.

| Token | Value | Pixels | Use |
|-------|-------|--------|-----|
| `--space-xs` | `0.25rem` | 4px | Micro gaps (icon padding, badge vertical padding) |
| `--space-sm` | `0.5rem` | 8px | Tight padding (button padding, form field gaps) |
| `--space-md` | `1rem` | 16px | Standard padding (cards, form groups, table cells) |
| `--space-lg` | `2rem` | 32px | Section spacing, drawer padding, column gaps |
| `--space-xl` | `4rem` | 64px | Full-page padding (login modal) |

---

## Borders & Radius

| Token | Value | Meaning |
|-------|-------|---------|
| `--radius` | `0` | All edges are sharp — no border radius anywhere |

Key border styles:
- `1px solid var(--color-black)` — standard UI border (inputs, buttons, drawers, dialogs)
- `2px solid var(--color-black)` — section dividers, table headers
- `1px solid var(--color-gray-light)` — low-emphasis borders (table rows, form sections, filter boxes)
- `border-bottom: 1px solid var(--color-black)` — top bar separator

---

## Transitions & Animation

| Token | Value | Use |
|-------|-------|-----|
| `--transition-fast` | `150ms ease-out` | Hover states (button color, opacity) |
| `--transition-normal` | `300ms ease-out` | Drawer slide-in, dialog scale, overlay fade |

### Keyframes

| Name | Effect | Used By |
|------|--------|---------|
| `spin` | 360deg rotation, 1s linear infinite | Loading spinner |
| `slideIn` | `translateX(100%) → 0` + fade in | Toast notifications |

---

## Z-Index Scale

| Value | Element |
|-------|---------|
| `1000` | Top bar (fixed header) |
| `2000` | Drawer overlay / Confirm overlay |
| `2001` | Drawer panel / Confirm dialog |
| `10000` | Toast notifications |

---

## Elevation / Depth

No box shadows are used. Depth is conveyed through:
- Solid `1px` black borders (highest emphasis)
- Light gray borders (lower emphasis)
- Background color contrast (`#ffffff` surface vs `#fafafa` background)
