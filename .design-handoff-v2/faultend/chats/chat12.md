# Server Sharing Column

_Started 2026-05-21 07:50 UTC_

---

## User

Add in the server list page a column in the table to show  if is shared and with how many people, in the same column

## Assistant

_[tool: list_files]_

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: done]_

_[tool: str_replace_edit]_

_[tool: done]_

The Sharing column now shows three states:

- **Private** — you own it, not shared
- **Shared · N** — you own it, shared with N teammates
- **Shared with me · @owner** — someone else's server you have access to

## User

Remove the none option in latency, that would be disabling the checkbox already in its header

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: str_replace_edit]_

_[tool: done]_

Removed the "None" pill — the section header's toggle already handles enable/disable, so the picker is now just Fixed / Range.

