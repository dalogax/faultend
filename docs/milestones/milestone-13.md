# Milestone 13: Design System Restyle — Landing & Application

**Status:** In Progress
**Target Branch:** `feature/design-restyle`
**Last Updated:** May 21, 2026

---

## Main Goal

Restyle the **landing page** and the **application** to a new in-house design system,
and update user-facing copy to match. The new system keeps the existing DNA —
monochrome, zero border-radius, light typography — but formalizes it: an 11-step
ink scale, a single **signal-amber** accent (used only as a fault signal), a
**JetBrains Mono** telemetry face, a denser layout, and a VS-Code-style status bar.

This is a **restyle + copy update**, not a feature rewrite. Where the design implies
a capability the product does not have, the gap is evaluated: trivial gaps are
adapted inline; complex gaps (new features, new backend data) become GitHub issues
("side quests" below).

---

## Source Files

The design was handed off from Claude Design as an HTML/CSS/JS prototype bundle,
temporarily extracted to `.design-handoff/` (removed before merge).

| File | Role |
|------|------|
| `.design-handoff/project/tokens.css` | Canonical design tokens (ink scale, signal, badges, components) |
| `.design-handoff/project/atoms.jsx` | Logo, icons, Badge, Toggle, Btn, LatBar primitives |
| `.design-handoff/project/components.jsx` | Buttons, forms, badges, tables, overlays |
| `.design-handoff/project/screens-chrome.jsx` | Top bar, status bar |
| `.design-handoff/project/screens-auth-list.jsx` | Login (two-panel), Server list |
| `.design-handoff/project/screens-dashboard.jsx` | Two-column traffic + rules dashboard |
| `.design-handoff/project/screens-drawers.jsx` | Traffic detail, create rule, create server, settings, confirm |
| `.design-handoff/project/screens-landing.jsx` | Marketing landing page |
| `.design-handoff/chats/*.md` | 13 design-iteration transcripts — capture intent |

---

## Side Quests (GitHub issues for gaps that are NOT trivial)

The design shows several things the product does not implement. These are filed as
issues rather than faked in the restyle:

1. **Dark theme** — design ships a full `.ft-theme-dark` token set + dark screen
   variants, but there is no in-app theme toggle and no dark mode today.
2. **Server health status** — design shows per-server status dots (live / idle /
   warn / off); no health/heartbeat data exists.
3. **Server list summary metrics** — design shows "Requests · 24h" and "p95 latency";
   no time-windowed aggregation or latency percentiles exist.
4. **Live status-bar metrics** — design's status bar shows throughput, p50/p95,
   error rate; only host + total request count are available today.
5. **Rules table: hit counts + drag-to-reorder** — design shows a per-rule "Hits"
   column and drag handles; rules have no hit counter and reorder is via the
   priority field.
6. **Server "Behaviour" settings** — design's settings drawer has Recording toggle,
   Default latency, and server-level Preserve-headers; none are server settings today.
7. **Create-server "Clone existing" tab** — design adds a third tab to clone an
   existing server's config.
8. **Typed-confirmation on destructive dialogs** — design's Delete-server dialog
   requires typing the server id to confirm.

---

## General Flow

1. **Tokens** — replace `variables.css` with the new token system; load fonts.
2. **Components CSS** — restyle every shared class (`.btn`, `.badge`, `.input`,
   `.toggle-switch`, tables, `.code-block`, `.empty-state`, `.toast`, forms, tabs,
   confirm dialog) against the new tokens. Class names are kept to limit JS churn.
3. **Layout & chrome** — restyle top bar, add the bottom status bar, restyle drawer.
4. **App shell (`app.html`)** — new two-panel login, minimal top bar, status bar.
5. **View JS** — update generated markup for: server list (stat strip, sharing
   cell, status column), traffic (time + latency-bar columns, filter bar),
   rules (restyled table, SVG icons), drawers (eyebrow headers), rule form
   (segmented Action / Latency controls), settings, confirm dialog.
6. **Landing** — rewrite `landing.html` to the new marketing design.
7. **Copy** — update headings, labels, and marketing text to the design's wording.
8. **Verify** — run the app, screenshot every screen, attach to the PR.

---

## Task Checklist

### Foundations
- [ ] Rewrite `variables.css` with the new token system (ink scale, signal, badges)
- [ ] Load Inter (300/400/500) + JetBrains Mono fonts
- [ ] Restyle buttons (`.btn`, `.btn-secondary`, `.btn-danger`, `.btn-icon`)
- [ ] Restyle badges (method, status, action) + add latency bar
- [ ] Restyle form atoms (input, textarea, select, toggle, radio, checkbox)
- [ ] Restyle tables, code blocks, empty states, toasts, spinner

### App chrome
- [ ] Restyle the top bar (minimal, logo + url chip + Settings/Logout)
- [ ] Add the bottom status bar to server pages
- [ ] Restyle the right-side drawer (520px, eyebrow header, ghost close)

### Login
- [ ] Rebuild the login as a two-panel split (brand panel + sign-in panel)
- [ ] Google + GitHub buttons with proper provider marks

### Server list
- [ ] Add the summary stat strip
- [ ] Restyle the table; merge Role + Shared into one Sharing cell
- [ ] Restyle the view header / "New server" action

### Dashboard
- [ ] Restyle the two-column layout + column headers
- [ ] Restyle the traffic filter bar
- [ ] Traffic table: add Time + Duration (latency bar) columns, SVG row affordances
- [ ] Rules table: restyle, SVG edit/delete icons

### Drawers
- [ ] Traffic detail drawer — restyle to eyebrow + sectioned layout
- [ ] Create/Edit rule drawer — segmented Action + Latency, restyle Transform
- [ ] Create server drawer — restyle tabs + `.faultend.com` suffix field
- [ ] Settings drawer — restyle Identity / Sharing / Export+Delete
- [ ] Confirm dialog — restyle

### Landing
- [ ] Rewrite `landing.html`: hero, why grid, how-it-works, CTA, footer
- [ ] Update marketing copy to the new wording

### Wrap-up
- [ ] File the 8 side-quest GitHub issues
- [ ] Run the app and screenshot every screen
- [ ] Open the PR with screenshots attached
