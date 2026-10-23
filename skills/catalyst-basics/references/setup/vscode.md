# Using Catalyst Skills with VS Code + GitHub Copilot Chat

> Shared steps — Installation, MCP authorization, and the pre-flight checklist — are in `setup-common.md`. This file covers VS Code-specific verification and troubleshooting.

## Skill Activation

The Catalyst by Zoho GitHub Copilot plugin registers its bundled skills automatically. To verify:

1. Open VS Code in your Catalyst project directory
2. Open **GitHub Copilot Chat** (Ctrl+Alt+I / Cmd+Alt+I) and switch to **Agent** mode
3. Ask: "What Catalyst skills are available?"

You should see routing from `catalyst-by-zoho` and the specialized service skills.

## MCP Setup — Confirm the plugin server

The plugin contributes the MCP server automatically via `.mcp.json` — you normally do **not** need a project-level MCP file.

Optional project override — create `.vscode/mcp.json` in your workspace only if you need a different DC URL or a personal Zoho MCP URL. See `../../catalyst-zoho-mcp/references/dc-switching.md`.

Confirm MCP is active: open GitHub Copilot Chat in agent mode and check that `ZohoMCP_*` meta-tools appear in the available tools list, or run **Command Palette** (Ctrl+Shift+P / Cmd+Shift+P) → **MCP: List Servers** and verify `catalyst-by-zoho` shows as connected.

## Common Errors (VS Code)

See `setup-common.md` for errors common to setup. VS Code-specific:

| Error | Cause | Fix |
|-------|-------|-----|
| MCP not connecting | Plugin not installed or OAuth incomplete | Install the plugin, then Command Palette → **MCP: List Servers** → `catalyst-by-zoho` → Connect |
| MCP shows needs authentication | Token expired or DC mismatch | Re-authorize via Command Palette → **MCP: List Servers** → Connect; if region errors persist, update the URL in `.vscode/mcp.json` (see `../../catalyst-zoho-mcp/references/dc-switching.md`) |
| Skills not listed | Plugin not loaded | Confirm the plugin is installed and enabled; reload VS Code window (Command Palette → **Developer: Reload Window**) |
| No `ZohoMCP_*` tools visible | Copilot Chat not in Agent mode | Switch GitHub Copilot Chat to **Agent** mode — skills and MCP tools are only available in agent mode |
