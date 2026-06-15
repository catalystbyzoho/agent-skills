# Using Catalyst Skills with GitHub Copilot (VS Code)

## Installation

Add the catalyst-skills repo to your VS Code workspace:

```bash
# From your project directory
git clone https://github.com/catalystbyzoho/agent-skills.git .catalyst-skills
```

Or install via the skills CLI if available:

```bash
npx skills add catalystbyzoho/agent-skills
```

## Skill Activation

GitHub Copilot in VS Code picks up skills from the `skills/` directory. To verify:

1. Open the Copilot Chat panel (Ctrl+Shift+I / Cmd+Shift+I)
2. Ask: "What Catalyst skills are available?"

## MCP Setup (Recommended)

Connect Zoho MCP so Copilot can manage Catalyst infrastructure directly (no console copy-pasting).

**Step 1 — Get your Zoho MCP URL:**
1. Go to [mcp.zoho.com](https://mcp.zoho.com) and create or open an MCP server
2. Under **Tools → Config Tools**, search for **"Catalyst by Zoho"** and add it
3. Under **Connections**, set authorization to **"On Demand"**
4. Click **Connect** → copy your server URL (format: `https://<server-name>-<org-id>.zohomcp.com/mcp/<auth-token>/message`)

**Step 2 — Add to VS Code MCP config:**

Create `.vscode/mcp.json` in your workspace root:

```json
{
  "servers": {
    "catalyst-by-zoho": {
      "type": "http",
      "url": "https://<server-name>-<org-id>.zohomcp.com/mcp/<auth-token>/message"
    }
  }
}
```

Alternatively, configure globally via **VS Code Settings → MCP** (search "MCP" in Settings UI).

After saving, VS Code will prompt you to start the MCP server. Accept. Confirm it's running via **View → Output → MCP Server: catalyst-by-zoho**.

## Pre-flight Checklist

Before asking Copilot to write Catalyst code, ensure:

- [ ] `catalyst login` has been run in your terminal
- [ ] `catalyst init` has been run in the project directory
- [ ] `.catalystrc` and `catalyst.json` exist at the project root
- [ ] (Optional) MCP Output channel shows `catalyst` server running

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Copilot writes files without a project | `.catalystrc` or `catalyst.json` missing | Run `catalyst login` then `catalyst init` |
| MCP server not starting | URL in `.vscode/mcp.json` is a placeholder | Replace `<YOUR_ZOHO_MCP_URL>` with your actual URL from mcp.zoho.com |
| `CatalystbyZoho_*` tools not appearing in Copilot | `.vscode/mcp.json` not detected or URL invalid | Check the MCP Output channel for errors; verify the URL is your actual Zoho MCP URL from mcp.zoho.com |
| Wrong environment targeted | Zoho MCP defaults to Development | The MCP server targets Development by default — switch explicitly in the Zoho MCP console if needed |
