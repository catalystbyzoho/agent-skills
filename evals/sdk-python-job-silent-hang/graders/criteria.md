---
type: llm
weight: 1
---

A successful response identifies the credential issue: the Python SDK's table methods default to USER credentials, and a Job function runtime has no user token — each call makes an unauthenticated request that waits ~60s per attempt without raising. The fix is initializing with admin scope (scope='admin') in the job handler.

Fail the response if it debugs network/latency/timeout settings or table size without identifying the missing-user-credential mechanism and the admin-scope fix.
