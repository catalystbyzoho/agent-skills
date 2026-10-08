---
type: llm
weight: 1
---

A successful response identifies the parameter-location trap: ZohoMCP_getSchema takes its arguments in `query_params`, not `body` — the error fires because the tool ignores body. (ZohoMCP_executeTool, by contrast, takes body: { tool_name, arguments: { path_variables, headers, body } }.)

Fail the response if it declares the server broken, retries the same shape, or invents other argument formats without naming query_params.
