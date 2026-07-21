---
name: catalyst-functions
description: "Catalyst serverless functions — all 7 types (Basic I/O, Advanced I/O, Event, Cron, Job, Integration, Browser Logic), handler signatures, catalyst-config.json, Security Rules, API Gateway routing, file uploads, busboy, Express middleware, environment variables, function URL, and function testing. Requires MCP connection — check for CatalystbyZoho_* tools before any operation. Trigger on 'write a function', 'catalyst function', 'API Gateway', 'Security Rules', 'function not found', 'function returns 401', 'busboy', 'middleware', 'function URL', 'environment variable in function', 'duplicate CORS headers', 'CORS error in browser', 'Access-Control-Allow-Origin multiple values', 'function URL 404', 'execute suffix', 'function timeout', 'function hangs', or any function type question. Do NOT use for persistent servers, long-running processes, or Docker deployments — use catalyst-appsail instead."
compatibility: "Requires Catalyst CLI (`npm install -g zcatalyst-cli`) and Node.js v20 (recommended; v14–v18 also supported). Java functions also require JDK 8, 11, or 17. Python functions require Python 3.9."
metadata:
   version: "2.0.1"
---

## How It Works

1. **Verify local scaffold — both `catalyst init` and `functions:add` support non-interactive mode (CLI v1.27.0+).**
   Check whether `.catalystrc` and `catalyst.json` exist. If missing, use MCP tools to get the org ID and project ID, then run:
   ```bash
   catalyst init --org <orgId> -p <projectId> -ni
   ```
   Never ask the user to run `catalyst init` interactively. NI mode can only link an existing project — if none exists, tell the user to create one in the console first. Once initialized, add functions non-interactively:
   ```bash
   catalyst functions:add --name <name> --type <type> --stack <stack> -ni
   # e.g. catalyst functions:add --name api --type aio --stack node20 -ni
   ```

2. **Identify the function type** — Basic I/O for simple request/response, Advanced I/O for raw HTTP control, Event for trigger-based, Cron/Job for scheduled, Integration for Zoho service events, Browser Logic for Puppeteer.
3. **Load `references/functions-basics.md`** — for the matching handler signature, `catalyst-config.json` keys, SDK init pattern, and CORS setup.
4. **Load `references/functions-advanced.md`** — for file uploads (busboy), streaming responses, error handling, or chaining functions.
5. **Load `references/api-gateway.md`** — for routing rules, rate limiting, or gateway-level CORS.
6. **Validate config** — Confirm `catalyst-config.json` uses `deployment` + `execution` keys only. Never use `function` or `entry_point`.

## Security Checklist

- **Functions are publicly accessible by default.** Security Rules sets `authentication` to `optional` when a function is created — its URL is globally accessible to everyone with no restrictions. Set `"authentication": "required"` in the Security Rules JSON for any function that reads or writes user data or sensitive resources.
- **API Gateway replaces Security Rules — do not use both.** Enabling API Gateway automatically disables Security Rules. Pick one auth/routing layer per function.

## Triggers

Use this skill for: "write a function", "catalyst function", "Basic I/O", "Advanced I/O", "Event function", "Cron function", "Browser Logic", `catalyst-config.json`, "function handler", "API Gateway", "rate limiting", "busboy", "file upload in function", `catalyst deploy --only functions:<function-name>`, `catalyst functions:add`, "function CORS", or any function type or function configuration question.

Deployment command note:
- Use `catalyst deploy --only functions:<function-name>` to deploy one function (where `functions:<name>` targets the function by its folder name).
- Use `catalyst deploy --only functions` to deploy all functions at once.

## References

| Reference | Load when the query is about… |
|-----------|-------------------------------|
| `references/functions-basics.md` | **Start here for any function question.** Function type selection, Basic I/O and Advanced I/O handler signatures, `catalyst-config.json`, user-scope vs admin-scope, CORS, Security Rules, execution limits |
| `references/functions-advanced.md` | **Advanced I/O patterns only.** Express vs raw-http template differences, file uploads (busboy), streaming files from Stratus, error handling patterns, CORS for local dev, local testing, function chaining, ZCQL result unwrapping, HTTP payload limits |
| `references/functions-templates.md` | **Event, Cron, Job, or Integration functions.** Handler templates for all background/scheduled types, SDK component reference, retry behavior, cold start data, and the full common errors table |
| `references/api-gateway.md` | **API Gateway config only.** Enable/disable gateway, routing rules, rate limiting, CORS via gateway |
