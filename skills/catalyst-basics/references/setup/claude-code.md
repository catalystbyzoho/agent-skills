# Using Catalyst Skills with Claude Code

## Installation

Add the catalyst-skills repo to your Claude Code workspace:

```bash
# From your project directory
git clone https://github.com/catalystbyzoho/agent-skills.git .catalyst-skills
```

Or install via the skills CLI if available:

```bash
npx skills add catalystbyzoho/agent-skills
```

## Skill Activation

Claude Code picks up skills automatically from the `skills/` directory. To verify:

1. Open Claude Code in your Catalyst project directory
2. Ask: "What Catalyst skills are available?"
3. Claude will list the active skills from `skills/SKILL.md`

## MCP Setup (Recommended)

Connect Zoho MCP so Claude can manage Catalyst infrastructure directly (create tables, list projects, etc.) without you copying IDs from the console.

**Step 1 — Get your Zoho MCP URL:**
1. Go to [mcp.zoho.com](https://mcp.zoho.com) and create or open an MCP server
2. Under **Tools → Config Tools**, search for **"Catalyst by Zoho"** and add it
3. Under **Connections**, set authorization to **"On Demand"**
4. Click **Connect** → copy your server URL (format: `https://<server-name>-<org-id>.zohomcp.com/mcp/<auth-token>/message`)

**Step 2 — Add to Claude Desktop config:**

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "catalyst-by-zoho": {
      "type": "streamable-http",
      "url": "https://<server-name>-<org-id>.zohomcp.com/mcp/<auth-token>/message"
    }
  }
}
```

Alternatively, copy the `.mcp.json` file from this repo into your project root and replace the `<YOUR_ZOHO_MCP_URL>` placeholder.

After saving, restart Claude. Confirm MCP is connected by looking for `CatalystbyZoho_*` in the tool list.

## Pre-flight Checklist

Before asking Claude to write Catalyst code, ensure:

- [ ] `catalyst login` has been run in your terminal
- [ ] `catalyst init` has been run in the project directory
- [ ] `.catalystrc` and `catalyst.json` exist at the project root
- [ ] (Optional) Zoho MCP is connected and `CatalystbyZoho_*` tools appear in Claude

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Claude writes files without a project | `.catalystrc` or `catalyst.json` missing | Run `catalyst login` then `catalyst init` |
| MCP tools not appearing | MCP config not saved or Claude not restarted | Save config and fully restart Claude |
| Wrong project context | Multiple projects in `.catalystrc` | Run `catalyst project:use <project-name>` first |
