---
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
tags: [zoho-mcp]
---

Calling ZohoMCP_getSchema with body: { tool_name: 'CatalystbyZoho_Create_Table' } keeps returning the error 'tool_name is required' even though I'm clearly passing it. Is the MCP server broken?
