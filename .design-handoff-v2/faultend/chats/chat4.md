# Header bar removal

_Started 2026-05-17 20:41 UTC_

---

## User

On the app server pages there is some redundant info from the top header bar and the bottom status bar, i like the bottom one so remove the top one so we can save space and keep it minimal.

## Assistant

_[tool: list_files]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: str_replace_edit]_

The Dashboard's TopBar center shows `servers / production-api` + a url chip — and the bottom status bar already shows the proxy address + status. I'll hide the TopBar's center block on the dashboard so it matches the minimal style used on the Server List screen.

_[tool: done]_

Removed the breadcrumb + URL chip from the dashboard's top bar — the server identity and address now live solely in the bottom status bar, leaving just the logo, search, and account controls up top.

## User

I mean also the second top bar where it says the status, requests, etc. is both on top and in the bottom, keep only the bottom

## Assistant

_[tool: str_replace_edit]_

_[tool: done]_

Removed the ProxyToolbar from the dashboard — its metrics (status, requests, throughput, error rate, p50/p95, active rules) all live in the bottom status bar already, so the screen now drops straight from the top bar into the traffic + rules columns.

## User

in the app we have duplicated search buttons in many pages, and is a feature we dont currently have. i think we can remove it on the top and the servers page. we just need filters in the traffic

## Assistant

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: done]_

Removed the ⌘K Search from the top bar across all app screens, and dropped the Search + Filter buttons from the Servers list header — only the "New server" CTA remains there. The traffic filter bar on the dashboard is untouched, so filtering still lives where it actually does something.

## User

In the create rule i want to separate the action in 3 parts: first proxy or mock. Then delay will be apart, cuz it can apply to both options. Then also i want to offer the possibility to modify the response using javascript code.

## Assistant

_[tool: read_file]_

_[tool: str_replace_edit]_

Restructuring the Create Rule action section into three clear parts: (1) Proxy vs Mock toggle, (2) Latency as its own optional section, (3) a new "Transform" section for JS code that runs on the response.

_[tool: done]_

_[tool: fork_verifier_agent]_

Restructured the Create Rule drawer's action area into 3 clear sections:

1. **Action** — segmented toggle, now just Proxy / Mock (dropped Fault and Delay-only since fault is just Mock with an error status, and standalone delay is covered by the Latency section).
2. **Latency** — its own section labeled "applies to proxy & mock" so it reads as independent of the action choice.
3. **Transform · JavaScript** — new section with an enable toggle and a code-editor panel showing an `async function transform(req, res)` example, plus chrome (line numbers, signature hint, "Test on last request" / Snippets buttons, sandbox note).

## User

Verifier agent check completed

## Assistant

All three sections verified in place. Ready for the next change whenever you are.

## User

it doesnt fit in the screen the full side drawer, can we put the full vertical scroll in a separate fragment?

## Assistant

_[tool: grep]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: str_replace_edit]_

I'll add a dedicated artboard that shows the Create Rule drawer at its full natural height, so all 3 sections are visible without the dashboard's clipping.

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: done]_

_[tool: fork_verifier_agent]_

Added a separate full-height artboard ("04.G′ · Create rule · full drawer (scrollable)" at 520×1400) that renders the Create Rule drawer on its own — so the entire form (Match → Action → Latency → Transform → footer) is visible at once without the dashboard's 860px clip.

## User

Verifier agent check completed

## Assistant

All sections fit cleanly in the new full-height artboard with no internal scroll. Ready for the next change.

## User

Can we remove all the shortcuts ? i rather have standard buttons using our foundations

## Assistant

_[tool: grep]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: read_file]_

_[tool: run_script]_

_[tool: grep]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: done]_

Removed every `<Kbd>` keyboard hint across the app: Save / New rule / New server / Cancel / Close / Save rule buttons, the server-list footer navigation hints, Sign in with Google CTAs, and the design-system "Keyboard" row. Buttons now read as plain labels using the standard Btn foundation.

