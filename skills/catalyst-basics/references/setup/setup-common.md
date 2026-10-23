# Catalyst Skills — Common Setup Steps

Shared across all IDEs (Claude Code, Cursor, GitHub Copilot). Your IDE-specific setup file links here for these steps and adds only what differs (skill activation, MCP client config path/dialect, and IDE-specific troubleshooting).

## Installation

Add the catalyst-skills repo to your IDE workspace:

```bash
# From your project directory
git clone https://github.com/catalystbyzoho/agent-skills.git .catalyst-skills
```

Or install via the skills CLI if available:

```bash
npx skills add catalystbyzoho/agent-skills
```

## MCP Setup — Step 1: Get your Zoho MCP URL

Connect Zoho MCP so your AI assistant can manage Catalyst infrastructure directly (create tables, list projects, etc.) without you copying IDs from the console.

1. Go to [mcp.zoho.com](https://mcp.zoho.com) and create or open an MCP server
2. Under **Tools → Config Tools**, search for **"Catalyst by Zoho"** and add it
3. Under **Connections**, set authorization to **"On Demand"**
4. Click **Connect** → copy your server URL (format: `https://<server-name>-<org-id>.zohomcp.com/mcp/<auth-token>/message`)

Then add the URL to your IDE's MCP config — see **Step 2** in your IDE-specific setup file (`claude-code.md`, `cursor.md`, or `github-copilot.md`). The config path and JSON dialect differ per IDE.

## Pre-flight Checklist

Before asking your AI assistant to write Catalyst code, ensure:

- [ ] `catalyst login --dc <dc> -ni` has been run in your terminal
- [ ] `catalyst init --org <orgId> -p <projectId> -ni` has been run in the project directory
- [ ] `.catalystrc` and `catalyst.json` exist at the project root
- [ ] (Optional) Zoho MCP is connected and the `ZohoMCP_*` meta-tools appear in your assistant (the `CatalystbyZoho_*` operations are invoked via `ZohoMCP_executeTool`, not shown as tools)

## Common Errors (all IDEs)

| Error | Cause | Fix |
|-------|-------|-----|
| AI writes files without a project | `.catalystrc` or `catalyst.json` missing | Run `catalyst login --dc <dc> -ni` then `catalyst init --org <orgId> -p <projectId> -ni` |
| Wrong project context | Multiple projects in `.catalystrc` | Run `catalyst project:use <project-name> -ni` first |

Your IDE-specific setup file lists errors unique to that client.
