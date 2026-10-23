---
type: llm
weight: 1
---

A successful response states this is NOT an MCP bug — INVALID_URL_PATTERN means Slate isn't activated for the project yet; the fix is one-time activation in the Console (open the Slate service), and it explicitly advises AGAINST falling back to legacy Web Client.

Fail the response if it declares the MCP broken, or endorses switching to the legacy Web Client because of this error.
