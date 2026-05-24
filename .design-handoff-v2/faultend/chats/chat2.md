# Landing Page Restyle

_Started 2026-05-17 20:16 UTC_

---

## User

In the design is missing my landing page faultend.com check it and include it with the restyle

## User

faultend.com

## User

faultend.com

## Assistant

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: web_fetch]_

_[tool: read_file]_

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: write_file]_

I've got enough context. Let me build the landing page screen using the Faultend design system, then wire it into the canvas.

_[tool: str_replace_edit]_

Now wire it into the canvas:

_[tool: run_script]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Added the missing **faultend.com landing page** as a new section in the design canvas, restyled to match the rest of the system.

**03 · Marketing site**
- **03.A** Landing page · full scroll (1320 × 3500, light)
- **03.B** Landing page · dark theme

The restyle pulls the marketing copy from faultend.com but rebuilds it inside the same chassis the app uses:

- **Hero** — large headline with amber underline on the word "breaking", a live proxy preview card on the right showing the actual request log + status bar from the dashboard, and a curl/fault response in a real `.ft-code` block. Same vocabulary the user sees in the app.
- **Logos strip** — mono treatment instead of greyed-out PNGs.
- **Why Faultend** — six numbered cells in a hairline grid (01-06), each with a working mini-demo built from the existing badges (METHOD, MOCK, FAULT, latency bars, etc.) rather than illustrated icons.
- **How it works** — five rows, each pairing copy with a real code block + a status badge (PROXY · transparent → REC · 1,284 req → FAULT · armed → PASS · resilient).
- **Plans** — three-column priced grid; the middle tier flips to the ink-12 inverted style, RECOMMENDED amber badge.
- **CTA** — full-bleed dark slab with the faint mark watermark; mirrors the login screen's left panel.
- **Footer** — four nav columns + mono build stamp.

Next steps if you want them: tweakable hero copy/headline variants, an animated request-log demo, or a mobile breakpoint.Landing page is live in the canvas at section **03 · Marketing site** (light + dark variants).

