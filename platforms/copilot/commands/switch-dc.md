---
description: Switch the Catalyst by Zoho MCP server to another data center
argument-hint: "[US|EU|IN|AU|CA|SA|JP|UAE]"
disable-model-invocation: true
---

Switch the Catalyst by Zoho MCP server to the data center specified in `$ARGUMENTS`.

Follow `skills/catalyst-zoho-mcp/references/dc-switching.md` as the canonical procedure (DC table, shared steps, and the GitHub Copilot (VS Code) section).

1. Normalize the requested data center to `US`, `EU`, `IN`, `AU`, `CA`, `SA`, `JP`, or `UAE`. If none was supplied, ask the user to choose; never guess. Reject unsupported values.
2. Resolve the server name `catalyst-<dc>` and URL from the reference's DC table.
3. Guide the user through the GitHub Copilot (VS Code) step in the reference. The plugin ships one server per data center in `.mcp.json`; switching means enabling the matching server and disabling the others. Do not edit files under the client's plugin cache.
4. Report the selected data center, server name and URL.
5. Tell the user to complete the browser login for the new data center. Do not call `ZohoMCP_*` tools until they are available again.
