---
description: Switch the Catalyst by Zoho MCP server to a specified data center
argument-hint: <US|EU|IN|AU|CA|SA|JP|UAE>
---
Switch the Catalyst by Zoho MCP server to the data center specified in: $ARGUMENTS

Follow these steps exactly:

## Step 1 — Resolve the target DC

Valid values: US, EU, IN, AU, CA, SA, JP, UAE (case-insensitive).
If $ARGUMENTS is empty or unrecognized, ask the user which DC they want before proceeding.

Map the DC to its MCP URL:
- US  → `https://catalyst.zohomcp.com/mcp/message`
- EU  → `https://catalyst.zohomcp.eu/mcp/message`
- IN  → `https://catalyst.zohomcp.in/mcp/message`
- AU  → `https://catalyst.zohomcp.com.au/mcp/message`
- CA  → `https://catalyst.zohomcp.ca/mcp/message`
- SA  → `https://catalyst.zohomcp.sa/mcp/message`
- JP  → `https://catalyst.zohomcp.jp/mcp/message`
- UAE → `https://catalyst.zohomcp.ae/mcp/message`

## Step 2 — Find all config files to update

The plugin URL is cached in multiple locations. Find them all:

1. **Plugin source** — read `~/.claude/settings.json`, get the path at
   `extraKnownMarketplaces.catalyst-by-zoho.source.path`, then open `.mcp.json` at that path.

2. **Marketplace cache:**
   `~/.claude/plugins/marketplaces/catalyst-by-zoho/.mcp.json`

3. **Version cache** — run:
   `find ~/.claude/plugins/cache/catalyst-by-zoho -name ".mcp.json"`
   and update every file returned.

## Step 3 — Update the URL in every file

In each file, set the `url` field to the new DC's MCP URL. Do not modify any other fields.

## Step 4 — Confirm and instruct the user

Tell the user:
- Which files were updated and what URL was set.
- To restart Claude Code for the change to take effect.
- That after restart, the new DC will prompt for a browser login — this is expected and required.
- That their existing session on the old DC is not affected.
