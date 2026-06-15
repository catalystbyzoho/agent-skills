# Using Catalyst Skills with Cursor

## Installation

Add the catalyst-skills repo to your Cursor workspace:

```bash
# From your project directory
git clone https://github.com/catalystbyzoho/agent-skills.git .catalyst-skills
```

Or install via the skills CLI if available:

```bash
npx skills add catalystbyzoho/agent-skills
```

## Skill Activation

Cursor reads skills from the `skills/` directory in your workspace. To verify:

1. Open Cursor in your Catalyst project directory
2. Open the Composer (Cmd+I / Ctrl+I)
3. Ask: "What Catalyst skills are available?"

## MCP Setup (Recommended)

Connect Zoho MCP so Cursor's AI can manage Catalyst infrastructure directly.

**Step 1 — Get your Zoho MCP URL:**
1. Go to [mcp.zoho.com](https://mcp.zoho.com) and create or open an MCP server
2. Under **Tools → Config Tools**, search for **"Catalyst by Zoho"** and add it
3. Under **Connections**, set authorization to **"On Demand"**
4. Click **Connect** → copy your server URL (format: `https://<server-name>-<org-id>.zohomcp.com/mcp/<auth-token>/message`)

**Step 2 — Add to Cursor MCP config:**

Create or edit `.cursor/mcp.json` in your project root:

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

Alternatively, configure globally via **Cursor Settings → MCP → Add Server** and paste the URL.

After saving, restart Cursor. Confirm MCP is active by checking **Cursor Settings → MCP** for a green status indicator next to `catalyst-by-zoho`.

## Pre-flight Checklist

Before asking Cursor to write Catalyst code, ensure:

- [ ] `catalyst login` has been run in your terminal
- [ ] `catalyst init` has been run in the project directory
- [ ] `.catalystrc` and `catalyst.json` exist at the project root
- [ ] (Optional) Zoho MCP server shows connected in Cursor MCP settings

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Cursor writes files without a project | `.catalystrc` or `catalyst.json` missing | Run `catalyst login` then `catalyst init` |
| MCP not connecting | Config path wrong or URL placeholder not replaced | Verify the URL in `.cursor/mcp.json` is your actual Zoho MCP URL from mcp.zoho.com |
| MCP shows red/error status | Invalid or expired URL | Regenerate the URL at mcp.zoho.com and update the config |
