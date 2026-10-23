## DC Switching — Catalyst Zoho MCP

Use this reference when the user wants to switch the Catalyst MCP server to a different data center.

---

## DC URL Map

| DC | Region | Server name | MCP URL |
|----|--------|-------------|---------|
| US | United States | `catalyst-us` | `https://catalyst.zohomcp.com/mcp/message` |
| EU | Europe | `catalyst-eu` | `https://catalyst.zohomcp.eu/mcp/message` |
| IN | India | `catalyst-in` | `https://catalyst.zohomcp.in/mcp/message` |
| AU | Australia | `catalyst-au` | `https://catalyst.zohomcp.com.au/mcp/message` |
| CA | Canada | `catalyst-ca` | `https://catalyst.zohomcp.ca/mcp/message` |
| SA | Saudi Arabia | `catalyst-sa` | `https://catalyst.zohomcp.sa/mcp/message` |
| JP | Japan | `catalyst-jp` | `https://catalyst.zohomcp.jp/mcp/message` |
| UAE | United Arab Emirates | `catalyst-uae` | `https://catalyst.zohomcp.ae/mcp/message` |

---

## How Switching Works

The plugin ships one MCP server per data center, all defined in the shared root `.mcp.json` and named `catalyst-<dc>` (`catalyst-in`, `catalyst-us`, and so on). **IN is the default.** Switching means turning on the server for the user's DC and turning off the others. Never edit files under the client's plugin cache, because plugin updates overwrite them.

1. Resolve the DC. Valid values: US, EU, IN, AU, CA, SA, JP, UAE (case-insensitive). If the user did not name one, ask; never infer it from location or a previous session. Reject unsupported values.
2. State the server name and URL from the table above.
3. Apply the client-specific step below.
4. Tell the user to complete the browser login for the new DC (see the last section).
5. Make no `ZohoMCP_*` calls until the new DC's meta-tools are available.

---

## Claude Code

Run `/mcp`, turn on the `catalyst-<dc>` server from the catalyst-by-zoho plugin, and turn off the other `catalyst-*` servers. Select the server and authenticate when prompted. Restart Claude Code if the tool list does not refresh.

---

## Cursor

Open **Cursor Settings → MCP** (or **Customize → Catalyst By Zoho → MCPs**). Turn on `catalyst-<dc>`, turn off the other `catalyst-*` servers, then click **Connect** on the enabled one.

---

## GitHub Copilot (VS Code)

Run **MCP: List Servers**, start `catalyst-<dc>`, and stop the other `catalyst-*` servers. Reload the window (**Developer: Reload Window**) if the tools do not refresh, then complete OAuth for the new DC.

---

## Codex

Load the `catalyst-switch-dc` skill. It enables exactly one regional server through plugin-scoped policy in `~/.codex/config.toml`. Do not edit the plugin's `.mcp.json`. Restart Codex afterwards so the tool list is rebuilt.

---

## Clients Without Plugin Support (Claude Desktop, Gemini CLI, manual setup)

Add a single `catalyst-by-zoho` server with the DC's URL in the client's own MCP config, or change its `url` to the new DC's URL, then restart the client:

- Claude Desktop: `claude_desktop_config.json` under `mcpServers`
- Gemini CLI: `gemini-extension.json` or the user's Gemini settings under `mcpServers`
- Cursor project override: `.cursor/mcp.json` under `mcpServers`
- VS Code project override: `.vscode/mcp.json` under `servers`

---

## What to Tell the User After Switching

- The active DC is now `<new-dc>` (server `catalyst-<dc>`).
- You'll be prompted to log in to your Zoho account for the new DC. This is expected.
- Your session on the old DC is not affected.
- Until authentication completes, only `authenticate` and `complete_authentication` tools will be visible.

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Empty org list or wrong org after switching | More than one `catalyst-*` server is enabled, or the wrong DC is enabled | Enable only the server for the account's DC and disable the rest |
| Only `authenticate` tool visible after switch | Not yet authorized on the new DC | Complete the browser login flow for that server |
| Switch has no effect | Client has not refreshed its tool list | Restart or reload the client |
