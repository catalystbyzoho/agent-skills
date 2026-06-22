> **Zoho MCP** lets AI assistants (Claude, GitHub Copilot, Cursor, etc.) manage Catalyst infrastructure
> by calling `CatalystbyZoho_*` tools directly. No console clicks or REST API calls needed.

---

## Setup — Global MCP Server

**Step 1 — Choose your Data Center (DC) URL:**

The Catalyst global MCP endpoint changes by data center. Use the URL that matches your Zoho account's DC.

| DC | Region | Global MCP base URL |
|------|------|------|
| US | United States | `https://catalyst.zohomcp.com` |
| EU | Europe | `https://catalyst.zohomcp.eu` |
| IN | India | `https://catalyst.zohomcp.in` |
| AU | Australia | `https://catalyst.zohomcp.com.au` |
| CA | Canada | `https://catalyst.zohomcp.ca` |
| SA | Saudi Arabia | `https://catalyst.zohomcp.sa` |
| JP | Japan | `https://catalyst.zohomcp.jp` |
| UAE | United Arab Emirates | `https://catalyst.zohomcp.ae` |

For MCP client configs, append `/mcp/message` to the base URL.

**Step 2 — Add your DC-specific URL to your AI client:**

Replace `<dc-base-url>` with your DC base URL from the table above.

**For Claude Desktop** — edit `claude_desktop_config.json`
(macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
Windows: `%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "catalyst-by-zoho": {
      "type": "streamable-http",
      "url": "<dc-base-url>/mcp/message"
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
      "url": "<dc-base-url>/mcp/message"
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
      "url": "<dc-base-url>/mcp/message"
    }
  }
}
```

**Step 3 — Authorize:**
Restart your AI client. It will open a browser window and prompt you to log in to your Zoho account and grant access. This happens once — the token is stored automatically by the client.

**Step 4 — Verify:**
Look for `CatalystbyZoho_*` tools in your client's tool list. Done.

---

## Pre-flight Sequence

Always run these calls before any other MCP operation to set project context:

1. `CatalystbyZoho_List_All_Organizations` → get your org ID
2. `CatalystbyZoho_List_All_Projects` (with org ID) → get your project ID
3. `CatalystbyZoho_List_All_Tables` *(DataStore operations only)* → verify access and get table names

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
| `CatalystbyZoho_List_All_Jobpools` | List all Job Scheduling pools in the project |
| `CatalystbyZoho_Create_Job_Pool` | Create a new Job Scheduling pool |

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

### Submit an immediate job

> "Run ProcessOrderFunction now as a job"

**Required pre-flight — always do this before calling `CatalystbyZoho_Create_Immediate_Job`:**
1. Call `CatalystbyZoho_List_All_Jobpools` to get existing pools and their IDs.
2. If no pools exist, call `CatalystbyZoho_Create_Job_Pool` first (type `"Function"`, memory e.g. `"256"`).
3. Pass the `jobpool_id` from step 1 or 2 to `CatalystbyZoho_Create_Immediate_Job`.

`jobpool_id` is a required field — there is no default or fallback. Job submission fails immediately if it is omitted.

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
| `INVALID_INPUT: job_name must contain only alphanumeric and underscore` on `CatalystbyZoho_Create_Immediate_Job` | `job_name` contains hyphens or spaces | Use underscores only — `doc_audit_run_1` not `doc-audit-run-1` |
| Job submission fails with missing field error | `jobpool_id` not provided to `CatalystbyZoho_Create_Immediate_Job` | Call `CatalystbyZoho_List_All_Jobpools` first; if none exist, call `CatalystbyZoho_Create_Job_Pool` then use the returned ID |
