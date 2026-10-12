# Using Catalyst Skills with Codex

> Shared installation and project pre-flight steps are in `setup-common.md`. Codex does not require the user to paste an MCP URL: the plugin bundles every supported regional endpoint.

## Skill Activation

Codex loads these skills from the installed Catalyst by Zoho plugin. To verify:

1. Open Codex in your Catalyst project directory.
2. Ask: "What Catalyst skills are available?"
3. Codex should list the Catalyst by Zoho skill index plus the focused Catalyst service skills.

## MCP Setup — Select a Data Center

Catalyst MCP is region-specific for compliance. The plugin bundles disabled definitions for `US`, `EU`, `IN`, `AU`, `CA`, `SA`, `JP`, and `UAE`; it never guesses which region to use.

1. Ask Codex: **"Switch Catalyst MCP to `<DC>`."**
2. Codex loads `catalyst-switch-dc`, shows the exact regional endpoint, and updates only the plugin policy in `~/.codex/config.toml`.
3. Restart Codex. The current session keeps its old tool connection and must not be used for Catalyst MCP operations after a switch.
4. Complete the browser OAuth flow for the selected regional endpoint.
5. Confirm the `ZohoMCP_*` meta-tools (`ZohoMCP_getSchema`, `ZohoMCP_executeTool`, `ZohoMCP_listTools`, `ZohoMCP_getFeatures`) appear.

To inspect the current selection, ask Codex: **"Show my Catalyst MCP DC."**

The `CatalystbyZoho_*` operations are not listed as tools. They are `tool_name` values passed to `ZohoMCP_executeTool`.

## Common Errors (Codex)

See `setup-common.md` for errors common to all clients. Codex-specific:

| Error | Cause | Fix |
|-------|-------|-----|
| Catalyst skills not appearing | Plugin not installed or the task was opened before installation | Install or update the Catalyst by Zoho plugin, then open a new Codex task |
| No Catalyst MCP DC selected | Every bundled regional server is disabled | Ask Codex to switch Catalyst MCP to the explicit account DC, then restart |
| Multiple Catalyst MCP DCs enabled | Conflicting plugin policy | Run `catalyst-switch-dc` again; it disables every region except the selected one |
| Duplicate `ZohoMCP_*` tool sets after upgrading | The former app-backed connection is still connected | Disconnect the legacy Catalyst app/connector in Codex settings, then restart |
| MCP tools not appearing | Codex was not restarted or regional OAuth is incomplete | Restart Codex, complete browser authorization, then verify the `ZohoMCP_*` tools |
