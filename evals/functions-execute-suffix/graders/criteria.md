---
type: llm
weight: 1
---

A successful response identifies that the URL printed by the deploy output is missing the `/execute` suffix for Advanced I/O functions — appending `/execute` to the printed URL is the fix.

Fail the response if it suggests redeploying, checking function code, or auth debugging without ever mentioning the missing /execute suffix.
