# Mock rule labels

_Started 2026-05-23 18:50 UTC_

---

## User

The mocks list have a cool tags identifying mock, delay, fault, proxy, pass,.. but the example doesnt make much sense. First a rule can have multiple labels: either mock or proxy, then optional extra delay and optional extra transform. No fault or pass exist. So adapt the examples to ilustrate that. Put some variation, some with a single label and others with up to 3

## Assistant

_[tool: list_files]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

Now I have the full picture. Plan:

1. Add `a-transform` token (light + dark) + CSS rule
2. Drop `fault` and `pass`; rules now have a `labels` array: `[mock|proxy, …delay?, …transform?]` (1–3 labels)
3. Update SAMPLE_RULES with variation, render multi-label Action column
4. Update SAMPLE_TRAFFIC to use new labels
5. Update components.jsx Badge demo + SampleRow + drawer
6. Update drawer trafic-detail's `a-fault` badge

Let me apply edits.

_[tool: str_replace_edit]_

Now update `screens-dashboard.jsx` — new label model + multi-badge rendering:

_[tool: str_replace_edit]_

_[tool: read_file]_

_[tool: str_replace_edit]_

Now update the rendering — Traffic Rule column and Rules Action column, and the column widths.

_[tool: str_replace_edit]_

Now update components.jsx — the badge demo and the sample traffic row.

_[tool: read_file]_

_[tool: str_replace_edit]_

Now update the SampleRow examples (around lines 270-280) and the drawer mock (line 354).

_[tool: read_file]_

_[tool: str_replace_edit]_

Now update the create-rule drawer (uses `a-fault`) and the traffic-detail drawer in screens-drawers.jsx:

_[tool: read_file]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Done. Reworked the action-label model:

- **No more `fault` / `pass`** — rules now carry a `labels` array: required base (`mock` **or** `proxy`) plus optional `delay` and/or `transform`. 1–3 labels per rule.
- **Variation across rules** — single (Mock orders → `mock`), double (Flaky writes → `proxy delay`, Strip prices → `proxy transform`), triple (Sync stub → `mock delay transform`).
- **New `a-transform` token** added (light + dark) in a violet to stand apart from blue/green/tan.
- Traffic rows, the dashboard Rules column, the desktop + mobile matched-rule drawers, and the Components Action demo all render the multi-badge stack. Components page now has an **atoms** row (4 chips) and a **combinations** row showing 1/2/2/3-label groupings.
- Legacy `a-fault`/`a-pass` CSS tokens left in tokens.css (kept for compatibility) but no longer used in samples.

## User

Verifier agent check completed

## Assistant

_[tool: grep]_

_[tool: str_replace_edit]_

_[tool: grep]_

Clean. Let me verify.

_[tool: done]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: grep]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Fixed the straggler `r: 'a-proxy'` row that was still using the old string shape. Mobile + desktop traffic now both iterate over the labels array. Verifier kicked off.

## User

Verifier agent check completed

## Assistant

All clear.

