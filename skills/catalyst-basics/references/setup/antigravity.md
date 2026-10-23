# Using Catalyst Skills with Google Antigravity

## Installation

From a clone of this repo (the plugin manifest is `.antigravity-plugin/plugin.json`):

```bash
git clone https://github.com/catalystbyzoho/agent-skills.git
cd agent-skills
agy plugin validate .
agy plugin install .
agy plugin list        # catalyst-by-zoho should show as enabled
```

Restart the Antigravity session after installing. The plugin ships skills, the `catalyst-reviewer` agent, the always-on rules (`rules/AGENTS.md`), two hooks and the Zoho MCP servers.

## Skill Activation

Skills load from `skills/`. To verify, open Antigravity in your Catalyst project and ask: "What Catalyst skills are available?"

## Hooks

| Hook | Event | Purpose |
|------|-------|---------|
| `catalyst-session-start` | `SessionStart` | Reads `.catalystrc`, injects project/environment context and MCP guidance (only in Catalyst projects) |
| `catalyst-guard` | `PreToolUse` (`run_command`) | Asks for confirmation before `catalyst deploy` and `*:delete` / `*:remove` / `*:destroy` commands |

## MCP Setup

The plugin's `mcp_config.json` defines one Zoho MCP server per data center, namespaced `catalyst-by-zoho_catalyst-<dc>` (`in`, `us`, `eu`, `au`, `ca`, `sa`, `jp`, `uae`). **Only `catalyst-in` is enabled by default.**

**Switch data center:** in Antigravity go to **Settings → Customizations → Installed MCP Servers**, disable `catalyst-in` and enable the server for your DC. (Or set `"disabled": true/false` per server in `mcp_config.json` and reinstall.)

**Authorize:** the first MCP call opens a browser to log in with Zoho (one time). Plugin servers don't appear in `agy mcp list`.

**Tool names:** Antigravity exposes the `ZohoMCP_*` meta-tools (`getSchema`, `executeTool`, `listTools`, `getFeatures`). The `CatalystbyZoho_*` names are passed as `tool_name` to `ZohoMCP_executeTool`. Seeing `ZohoMCP_*` means MCP is connected.

## Pre-flight Checklist

- [ ] `catalyst login` has been run in your terminal
- [ ] `catalyst init` has been run in the project directory
- [ ] `.catalystrc` and `catalyst.json` exist at the project root
- [ ] `agy plugin list` shows `catalyst-by-zoho` enabled
- [ ] The MCP server for your DC is enabled and authorized (`ZohoMCP_*` tools appear)

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Agent uses the Catalyst CLI instead of MCP | MCP not authorized or wrong DC enabled | Enable the right DC server, authorize, restart session |
| Region/auth errors from MCP | Account DC differs from the enabled server | Enable the matching `catalyst-<dc>` server only |
| No session context injected | `.catalystrc` missing | Run `catalyst login` then `catalyst init` |
| Hooks not firing | Plugin not reinstalled after edits | Run `agy plugin install .` and restart |
