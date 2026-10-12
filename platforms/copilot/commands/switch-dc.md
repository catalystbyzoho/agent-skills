---
description: Switch the Catalyst by Zoho MCP server to another data center
argument-hint: "[US|EU|IN|AU|CA|SA|JP|UAE]"
disable-model-invocation: true
---

Switch the Catalyst by Zoho MCP server to the data center specified in `$ARGUMENTS`.

Follow `skills/catalyst-zoho-mcp/references/dc-switching.md` as the canonical procedure.

1. Normalize the requested data center to `US`, `EU`, `IN`, `AU`, `CA`, `SA`, `JP`, or `UAE`. If no data center was supplied, ask the user to choose one. Reject unsupported values instead of guessing.
2. Use the reference's DC map to resolve the exact MCP URL.
3. Inspect the workspace's existing MCP configuration before editing it. Preserve unrelated servers and settings.
4. Apply the reference's recommended workspace configuration. Use structured JSON editing and the `servers` key expected by VS Code.
5. Report the selected data center, resolved URL, and changed file.
6. Tell the user to run **Developer: Reload Window**, reconnect `catalyst-by-zoho` through **MCP: List Servers**, and complete OAuth for the new data center.
7. Do not make Catalyst resource calls until the `ZohoMCP_*` meta-tools are available again.