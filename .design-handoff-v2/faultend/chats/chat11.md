# Design Simplification

_Started 2026-05-21 07:19 UTC_

---

## User

Remove the upsteam section and the description of the server creation

## Assistant

_[tool: list_files]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: str_replace_edit]_

Removed the Upstream section (Upstream URL field + "Create a first proxy rule" toggle) and the Description field from the Add server drawer.

_[tool: done]_

Done — the Add server drawer now just has the Identity section with the Server ID field.

## User

The transform javascript block must be just the body of the function, remove the button test on last request, and the title and async of the code block. Also remove in the bottom of the rule edition the api reference link

## Assistant

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: done]_

_[tool: get_webview_logs]_

_[tool: eval_js]_

_[tool: sleep]_

_[tool: eval_js]_

Good — it just took a moment to mount. The edits are clean:

- Removed `transform.js` title and `async` badge from the code editor header (kept the `(req, res) → res` signature).
- Code block now contains just the function body, with the gutter trimmed from 9 lines to 7.
- Removed the **Test on last request** button.
- Removed the **API reference ↗** link from the bottom of the transform section.

## User

from the snippet box remove also the return, the header req,res res. Also rephrase the runs after mock and add "or proxy"

## Assistant

_[tool: str_replace_edit]_

_[tool: done]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: done]_

Swapped the order — Transform now sits between Action and Latency, matching the actual execution flow.

## User

also since in the 04.G` we are showing the mock mode, on the one integrated in the app 04.G we can show the proxy mode

## Assistant

_[tool: grep]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: done]_

Updated:
- **04.G** (in-app) now renders the Create rule drawer in **proxy** mode and the label says so.
- **04.G′** (standalone scrollable) keeps **mock** mode and its label calls that out.

## User

- Rename the title Transform javascript to just transform. And in the latency title add the checkbox to enable disable like in transform

## Assistant

_[tool: str_replace_edit]_

_[tool: done]_

Done — Transform header is now just "Transform", and Latency has a matching toggle on the right.

## User

We dont need a name on the rules, remove that field

## Assistant

_[tool: str_replace_edit]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: str_replace_edit]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: grep]_

_[tool: done]_

Removed rule names everywhere:

- **Create rule drawer** — Name field gone.
- **Rules table** — column is now just `Pattern` (method badge + mono regex).
- **Traffic table** — Rule column is just the action badge (column slimmed from 140px to 84px).
- **Traffic detail · Matched rule** — shows `fault · POST | DELETE · ^/api/.*$` instead of "Read-only mode".
- **Edit rule drawer** — title is now the mono pattern `POST · ^/api/.*$`.
- **Conflict notice** — refers to the overlapping rule by `POST ^/orders$` (priority 140).
- **Mock response body** — dropped the `"rule": "Read-only mode"` line.
- **Transform snippet** — `ruleId: rule.id` instead of `'{{ruleName}}'`.

## User

Remove 04.H page, we dont have read only mode nor conflicts between rules. Remove any mention to conflicts

## Assistant

_[tool: grep]_

_[tool: str_replace_edit]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: read_file]_

_[tool: grep]_

_[tool: str_replace_edit]_

_[tool: done]_

Done — removed:

- **04.H artboard** (Edit rule · with conflict notice) — re-lettered Add server → 04.H, Settings → 04.I, Confirm → 04.J.
- **`DrawerEditRule`** function and its `focus="edit-rule"` route in the dashboard.
- **Conflict toast** in the components artboard → swapped for an "Upstream p95 over 1.2s" warning.
- **"3 conflicts"** sub-stat on the server list → now "across 6 servers".
- **"2 rules conflict"** badge under the payments server → now "elevated error rate".
- Trimmed the saved-rule toast's stale "mock-users" name reference.

