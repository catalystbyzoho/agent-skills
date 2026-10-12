---
name: switch-dc
description: Switch the Catalyst by Zoho MCP server to a different data center
argument-hint: <US|EU|IN|AU|CA|SA|JP|UAE>
---
Help the user point the Catalyst by Zoho MCP server at the data center in: $ARGUMENTS

## Preferred path (do this first)

Cursor resolves the MCP URL from the plugin variable `CATALYST_MCP_TLD` (interpolated into `https://catalystbyzoho.zohomcp.${CATALYST_MCP_TLD}/mcp/message`). Guide the user — do **not** edit plugin cache files.

1. Resolve the target DC (valid: US, EU, IN, AU, CA, SA, JP, UAE; case-insensitive).
   If `$ARGUMENTS` is empty or unrecognized, list the table below and ask which DC they want.

| DC | Region | `CATALYST_MCP_TLD` |
|----|--------|--------------------|
| US | United States | `com` |
| EU | Europe | `eu` |
| IN | India | `in` |
| AU | Australia | `com.au` |
| CA | Canada | `ca` |
| SA | Saudi Arabia | `sa` |
| JP | Japan | `jp` |
| UAE | United Arab Emirates | `ae` |

2. Tell the user to set it in the UI:
   - **Cursor Settings → Plugins → Catalyst by Zoho → Configure**
   - Set **Catalyst MCP data center** (`CATALYST_MCP_TLD`) to the TLD for their DC
   - Save, then reload Cursor (**Developer: Reload Window**) if the MCP endpoint does not update

3. After reload, open **Cursor Settings → MCP → catalyst-by-zoho → Connect** and complete browser login for the new DC.

4. Confirm: say which DC/TLD they should select, that re-auth on the new DC is expected, and that the old DC session is unaffected.

## Fallback (only if Configure is unavailable)

If the user cannot access Plugins → Configure (older Cursor / local-only install), write a **project** override at `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "catalyst-by-zoho": {
      "type": "streamable-http",
      "url": "https://catalystbyzoho.zohomcp.<tld>/mcp/message"
    }
  }
}
```

Then reload Cursor and re-Connect. Do **not** patch files under `~/.cursor/plugins/cache/`.

Full reference: `skills/catalyst-zoho-mcp/references/dc-switching.md`
