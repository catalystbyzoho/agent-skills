---
type: llm
weight: 1
---

A successful response explains that `req.url` inside the function still contains the `/execute` prefix (the request arrives as `/execute/users`), so routes must strip it first (e.g. `req.url.replace(/^\/execute/, '')`) before matching.

Fail the response if it debugs the gateway, CORS, or route registration without identifying the /execute prefix in req.url.
