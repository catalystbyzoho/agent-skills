---
name: catalyst-functions
description: "Catalyst serverless functions — all 7 types (Basic I/O, Advanced I/O, Event, Cron, Job, Integration, Browser Logic), handler signatures, catalyst-config.json, Security Rules, API Gateway routing, file uploads, busboy, Express middleware, environment variables, function URL, and function testing. Trigger on 'write a function', 'catalyst function', 'API Gateway', 'Security Rules', 'function not found', 'function returns 401', 'busboy', 'middleware', 'function URL', 'environment variable in function', or any function type question. Do NOT use for persistent servers, long-running processes, WebSockets, or Docker deployments — use catalyst-appsail instead."
compatibility: "Requires Catalyst CLI (`npm install -g zcatalyst-cli`) and Node.js v20 (recommended; v14–v18 also supported). Java functions also require JDK 8, 11, or 17. Python functions require Python 3.9."
metadata:
   version: "2.0.1"
---

## How It Works

1. **Establish MCP connection first — HARD STOP if not connected.**
   Check whether `CatalystbyZoho_*` tools are available in the current tool list.
   - **If available:** Run `CatalystbyZoho_List_All_Organizations` → `CatalystbyZoho_List_All_Projects` to set project context, then proceed to step 2.
   - **If NOT available:** Do NOT write any code, scaffold any files, or run any CLI commands. Route setup to `catalyst-zoho-mcp` and wait for the user to confirm `CatalystbyZoho_*` tools are visible before continuing.

   ---

   **To use Catalyst via AI, connect Zoho MCP first.**
   Load `skills/catalyst-zoho-mcp/SKILL.md` and follow its setup flow.
   - Option A: Global MCP Server (DC-specific endpoint)
   - Option B: Personal MCP Server (mcp.zoho.com)

   Use `skills/catalyst-zoho-mcp/references/zoho-mcp.md` for exact client config and verification steps.

   ---

2. **Check local scaffold — never run interactive CLI commands.**
   Verify `.catalystrc` and `catalyst.json` exist. If missing, do NOT run `catalyst init` yourself — the CLI uses interactive arrow-key menus that cannot be reliably controlled from a terminal session. Instead, ask the user to run it:
   > Please run `catalyst init` in your terminal, select your project and choose **"Configure and deploy http/non-http functions"** when asked which features to set up. Come back once done.
   Wait for confirmation before continuing.

3. **Identify the function type** — Basic I/O for simple request/response, Advanced I/O for raw HTTP control, Event for trigger-based, Cron/Job for scheduled, Integration for Zoho service events, Browser Logic for Puppeteer.
4. **Load `references/functions-basics.md`** — for the matching handler signature, `catalyst-config.json` keys, SDK init pattern, and CORS setup.
5. **Load `references/functions-advanced.md`** — for file uploads (busboy), streaming responses, error handling, or chaining functions.
6. **Load `references/api-gateway.md`** — for routing rules, rate limiting, or gateway-level CORS.
7. **Validate config** — Confirm `catalyst-config.json` uses `deployment` + `execution` keys only. Never use `function` or `entry_point`.

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
