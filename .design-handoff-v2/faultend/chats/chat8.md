# Request caching logic

_Started 2026-05-18 21:35 UTC_

---

## User

remove // faultend keeps the last 10,000 requests per server in memory

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: str_replace_edit]_

Removed.

## User

Remove Export from the Rules page, export must be on the server settings only

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: str_replace_edit]_

Done. Export is gone from the Rules header — it remains in the server settings drawer.

## User

On the server page we need in the topbar centered the host of the server

## Assistant

_[tool: read_file]_

_[tool: grep]_

## Assistant

_[tool: read_file]_

_[tool: str_replace_edit]_

## Assistant

Done. The server page topbar now shows the breadcrumb + host URL chip centered.

## User

only the server name, remove the breadcrumb

## Assistant

_[tool: str_replace_edit]_

Done. Just the host URL chip is centered now.

## User

export server is missing from the server settings drawer

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: str_replace_edit]_

Removed.

## User

remove persist rules setting, also remove upstream url setting, thats a rule not a setting

## Assistant

_[tool: str_replace_edit]_

Done. Both removed.

## User

On the server pages we need a settings link next to the logout. Also remove the "Developer" name from there

## Assistant

_[tool: str_replace_edit]_

Done. "Developer" is gone; Settings is now a text link next to Logout.

## User

Change the Confirm Clear traffic to Delete Server confirm page, since clear traffic wont need confirmation.

## Assistant

_[tool: str_replace_edit]_

Done. Confirm dialog is now Delete Server.

## User

Remove the Seed rules from the add server drawer

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: str_replace_edit]_

Removed.

## User

Change default behaviour for an optional First proxy rule automatically created from the add server page. Also move the preserve headers from the server creation to the server settings.
On the server settings remove the copy cli snippet and add the Delete server button.

## Assistant

_[tool: read_file]_

_[tool: read_file]_

_[tool: str_replace_edit]_

Done:
- Add server: "Default behaviour" replaced with an optional **Create a first proxy rule** toggle next to the upstream URL.
- Preserve headers moved into the server settings (Identity section).
- Settings export section: CLI snippet button + code block removed. Danger zone Delete button now reads **Delete server**.

## User

move the preserve headers to the behaviour block.
Put the export and delete button simpler way as "delete" and "export", remove the settings section "export"

## Assistant

_[tool: str_replace_edit]_

Done. Preserve headers is now in Behaviour. Export and Delete are a simple right-aligned button row at the bottom of settings — no Export section, no Danger zone box.

## User

Remove in the bottom bar of the server pages the "1 rule paused"

## Assistant

## Assistant

## Assistant

## User

Remove the upsteam section and the description of the server creation

## Assistant

## Assistant

## Assistant

## Assistant

