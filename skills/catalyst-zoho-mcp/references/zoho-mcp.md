> **Zoho MCP** lets AI assistants (Claude, GitHub Copilot, Cursor, etc.) manage Catalyst infrastructure
> by calling `CatalystbyZoho_*` tools directly. No console clicks or REST API calls needed.

---

## Setup — Choose Your Path

Before showing setup steps, ask the user:

> There are two ways to connect Zoho MCP. Which do you prefer?
>
> **Option A — Global MCP Server** *(recommended, new)*
> One URL, no console setup. Your AI client opens a browser login once and you're done.
> Best for: anyone getting started, or who doesn't want to manage their own server.
>
> **Option B — Personal MCP Server** *(existing flow)*
> Create your own server at mcp.zoho.com, configure tools, get a custom URL with a token embedded.
> Best for: teams needing a shared/org-level server, or custom tool selection.

---

### Option A — Global MCP Server *(recommended)*

**Step 1 — Add this single URL to your AI client:**

**For Claude Desktop** — edit `claude_desktop_config.json`
(macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
Windows: `%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "catalyst-by-zoho": {
      "type": "streamable-http",
      "url": "https://catalyst.zohomcp.com/mcp/message"
    }
  }
}
```

**For Cursor** — create or edit `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "catalyst-by-zoho": {
      "type": "streamable-http",
      "url": "https://catalyst.zohomcp.com/mcp/message"
    }
  }
}
```

**For GitHub Copilot (VS Code)** — create `.vscode/mcp.json` in your workspace root:

```json
{
  "servers": {
    "catalyst-by-zoho": {
      "type": "http",
      "url": "https://catalyst.zohomcp.com/mcp/message"
    }
  }
}
```

**Step 2 — Authorize:**
Restart your AI client. It will open a browser window and prompt you to log in to your Zoho account and grant access. This happens once — the token is stored automatically by the client.

**Step 3 — Verify:**
Look for `CatalystbyZoho_*` tools in your client's tool list. Done.

---

### Option B — Personal MCP Server *(existing flow)*

**Step 1 — Create your server:**
1. Go to [mcp.zoho.com](https://mcp.zoho.com) and create or open an MCP server
2. Under **Tools → Config Tools**, search for **"Catalyst by Zoho"** and add all Catalyst tools
3. Under **Connections**, set authorization to **"On Demand"**
4. Click **Connect** → copy your server URL
   - Format: `https://<server-name>-<org-id>.zohomcp.com/mcp/<auth-token>/message`

**Step 2 — Configure your AI client** using your copied URL:

**For Claude Desktop:**
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

**For Cursor:**
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

**For GitHub Copilot (VS Code):**
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

> You can also copy the `.mcp.json` file from this repo into your project root and replace the `<YOUR_ZOHO_MCP_URL>` placeholder with your URL.

**Step 3 — Verify:**
After restarting your AI client, look for tools prefixed with `CatalystbyZoho_` in the tool list. If they appear, the MCP server is connected.

---

## Pre-flight Sequence

Always run these two calls before any other MCP operation to set project context:

1. `CatalystbyZoho_List_All_Organizations` → get your org ID
2. `CatalystbyZoho_List_All_Projects` (with org ID) → get your project ID
3. `CatalystbyZoho_List_All_Tables` → verify access and get table names

If there is more than one org or project, ask the user which one to use before proceeding.

---

## Available Tools

The tools available depend on which Catalyst tools are configured in your Zoho MCP server. Confirmed tool names:

| Tool | Description |
|------|-------------|
| `CatalystbyZoho_List_All_Organizations` | List all Zoho organizations the account has access to |
| `CatalystbyZoho_List_All_Projects` | List all Catalyst projects in the organization |
| `CatalystbyZoho_List_All_Tables` | List all Data Store tables in the project |
| `CatalystbyZoho_List_Cache_Segments` | List all Cache segments in the project |

For the full catalog of available tools, check your AI client's tool list after connecting — all tools shown with the `CatalystbyZoho_` prefix are available to use.

---

## Common Patterns

### Create a table from schema description

> "Create a Tasks table with columns: Title (text, required), DueDate (date), Status (text), Priority (integer)"

The AI will call the appropriate `CatalystbyZoho_*` create-table tool with column specifications.

### Query data

> "Show me all rows in the Tasks table where Status is 'In Progress'"

The AI calls the query tool with a ZCQL query against the correct table ID.

### Schema exploration

> "What tables do I have and what are their columns?"

The AI calls `CatalystbyZoho_List_All_Tables` then describes the schema.

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `CatalystbyZoho_*` tools not showing | MCP server not connected or URL wrong | Verify URL in client config; restart client after saving |
| `PERMISSION_NEEDED` on table operations | Project context not set | Run `CatalystbyZoho_List_All_Organizations` → `List_All_Projects` first |
| Operations applying to wrong project | Skipped pre-flight | Always run the org → project → verify sequence before any operation |
| MCP server shows red/error *(Option B)* | Token expired or URL invalid | Regenerate the authenticated URL at mcp.zoho.com |
| Browser auth loop not completing *(Option A)* | AI client doesn't support OAuth 2.0 browser flow | Check client version supports MCP 2025-03; try a different supported client |
| MCP targets wrong environment | Zoho MCP defaults to Development | Switch environment explicitly in the Zoho MCP console if production is needed (use caution) |
