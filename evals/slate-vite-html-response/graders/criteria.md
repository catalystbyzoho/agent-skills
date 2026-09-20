---
type: llm
weight: 1
---

A successful response explains the three-port local setup: the browser page runs on the Vite dev port (4800), where relative /server/... paths hit Vite's SPA fallback — which returns index.html with status 200 instead of an error. The fix is targeting the catalyst serve origin (port 3000, the stable port) for API calls, noting the Vite port can increment and must not be hardcoded.

Fail the response if it debugs CORS, the function code, or JSON parsing without identifying the SPA-fallback-returns-200-HTML mechanism, or if it recommends hardcoding port 4800.
