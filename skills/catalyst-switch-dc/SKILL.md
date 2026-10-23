---
name: catalyst-switch-dc
description: "Select or change the regional Catalyst Zoho MCP endpoint (data center). Codex runs the bundled helper; other clients follow dc-switching.md. Trigger on 'switch Catalyst DC', 'change MCP region', 'connect to IN DC', 'use EU data center', or 'configure Catalyst MCP region'."
metadata:
  version: "1.0.1"
---

# Switch the Catalyst MCP Data Center

Use this skill when a user needs to select or change the regional Catalyst MCP endpoint.

## Client Check (Do This First)

The procedure below is **Codex only**. It runs `codex plugin list` and edits `~/.codex/config.toml`.

- **Not in Codex** (Claude Code, Cursor, GitHub Copilot, Gemini): do **not** run any `codex` command or touch `~/.codex/`. Load `../catalyst-zoho-mcp/references/dc-switching.md` and follow its steps and the section for the current client. The plugin ships one `catalyst-<dc>` server per data center in `.mcp.json`; the user enables the one for their DC and disables the others. Prefer the client's `switch-dc` command when it has one.
- **In Codex**: continue with the Safety Rules and Procedure below.

## Safety Rules

- Catalyst MCP endpoints are region-specific for compliance. Never infer a DC from the user's location, project name, previous session, or available account data.
- Require the user to explicitly choose one of: `US`, `EU`, `IN`, `AU`, `CA`, `SA`, `JP`, `UAE`.
- Show the exact endpoint before applying the change.
- Do not edit the installed plugin's `.mcp.json`; it is managed plugin content.
- Do not edit OAuth credentials.
- After changing the configuration, make no further `ZohoMCP_*` calls in the current session. The old connection remains active until Codex restarts.

## Procedure

1. If the user did not specify a supported DC, ask them to choose one. Do not select a default.
2. State the matching endpoint from this table and ask for confirmation if the user's request did not already explicitly authorize the switch:

   | DC | Endpoint |
   |----|----------|
   | US | `https://catalyst.zohomcp.com/mcp/message` |
   | EU | `https://catalyst.zohomcp.eu/mcp/message` |
   | IN | `https://catalyst.zohomcp.in/mcp/message` |
   | AU | `https://catalyst.zohomcp.com.au/mcp/message` |
   | CA | `https://catalyst.zohomcp.ca/mcp/message` |
   | SA | `https://catalyst.zohomcp.sa/mcp/message` |
   | JP | `https://catalyst.zohomcp.jp/mcp/message` |
   | UAE | `https://catalyst.zohomcp.ae/mcp/message` |

3. Run `codex plugin list --json` and find the enabled entry whose `name` is `catalyst-by-zoho`. Use its `source.path` as `<installed-plugin-path>`. If more than one enabled entry matches, ask which installation to configure.
4. Run the bundled helper with permission to update the user-level Codex configuration:

   ```bash
   node "<installed-plugin-path>/platforms/codex/scripts/switch-dc.js" <DC>
   ```

   The helper:
   - discovers the installed plugin ID using `codex plugin list --json`;
   - updates only `plugins.<plugin-id>.mcp_servers.<regional-server>.enabled` in `~/.codex/config.toml`;
   - disables every other Catalyst regional server;
   - preserves unrelated settings and creates `config.toml.catalyst-dc.bak`;
   - writes the result atomically.

5. If multiple enabled Catalyst plugin installations are reported, ask the user which installation to configure, then rerun:

   ```bash
   node "<installed-plugin-path>/platforms/codex/scripts/switch-dc.js" <DC> --plugin-id "<plugin-id>"
   ```

6. Report the selected DC and endpoint. Tell the user to restart Codex and complete the browser OAuth flow for that regional endpoint.
7. Stop. Do not perform any Catalyst MCP operation until a new session confirms that exactly one regional server is enabled and the `ZohoMCP_*` meta-tools are available.

## Check Current Selection

```bash
node "<installed-plugin-path>/platforms/codex/scripts/switch-dc.js" --status
```

The status command exits successfully only when exactly one Catalyst regional server is enabled.
