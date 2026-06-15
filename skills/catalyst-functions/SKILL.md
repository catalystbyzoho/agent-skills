---
name: catalyst-functions
description: "Catalyst serverless functions — all 7 types (Basic I/O, Advanced I/O, Event, Cron, Job, Integration, Browser Logic), handler signatures, catalyst-config.json, Security Rules, API Gateway routing, file uploads, busboy, Express middleware, environment variables, function URL, and function testing. Trigger on 'write a function', 'catalyst function', 'API Gateway', 'Security Rules', 'function not found', 'function returns 401', 'busboy', 'middleware', 'function URL', 'environment variable in function', or any function type question. Do NOT use for persistent servers, long-running processes, WebSockets, or Docker deployments — use catalyst-appsail instead."
compatibility: "Requires Catalyst CLI (`npm install -g zcatalyst-cli`) and Node.js v20 (recommended; v14–v18 also supported). Java functions also require JDK 8, 11, or 17. Python functions require Python 3.9."
metadata:
  version: "2.0.0"
---

## How It Works

1. **Identify the function type** — Basic I/O for simple request/response, Advanced I/O for raw HTTP control, Event for trigger-based, Cron/Job for scheduled, Integration for Zoho service events, Browser Logic for Puppeteer.
2. **Load `references/functions-basics.md`** — for the matching handler signature, `catalyst-config.json` keys, SDK init pattern, and CORS setup.
3. **Load `references/functions-advanced.md`** — for file uploads (busboy), streaming responses, error handling, or chaining functions.
4. **Load `references/api-gateway.md`** — for routing rules, rate limiting, or gateway-level CORS.
5. **Validate config** — Confirm `catalyst-config.json` uses `deployment` + `execution` keys only. Never use `function` or `entry_point`.

## Security Checklist

- **Functions are publicly accessible by default.** Security Rules sets `authentication` to `optional` when a function is created — its URL is globally accessible to everyone with no restrictions. Set `"authentication": "required"` in the Security Rules JSON for any function that reads or writes user data or sensitive resources.
- **API Gateway replaces Security Rules — do not use both.** Enabling API Gateway automatically disables Security Rules. Pick one auth/routing layer per function.

## Triggers

Use this skill for: "write a function", "catalyst function", "Basic I/O", "Advanced I/O", "Event function", "Cron function", "Browser Logic", `catalyst-config.json`, "function handler", "API Gateway", "rate limiting", "busboy", "file upload in function", `catalyst deploy functions`, `catalyst functions:add`, "function CORS", or any function type or function configuration question.

## References

| Reference | Load when the query is about… |
|-----------|-------------------------------|
| `references/functions-basics.md` | Function types, handler signatures, `catalyst-config.json`, SDK init, CORS, Security Rules |
| `references/functions-advanced.md` | File uploads (busboy), streaming, error handling, local testing, function chaining |
| `references/api-gateway.md` | API Gateway enable/disable, routing rules, rate limiting, CORS via gateway |
