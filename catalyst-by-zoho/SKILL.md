---
name: catalyst-by-zoho
description: "Expert coding assistant for Catalyst by Zoho — Zoho's full-stack serverless cloud platform. Use for any question about Catalyst services, CLI, SDKs, architecture, pricing, or Zoho MCP tool-based infrastructure management."
metadata:
  version: "2.0.1"
---

# Catalyst by Zoho — Skill Index

This is the routing layer. Load the most specific matching skill — do not answer from this file alone.

---

## Philosophy

- **Prefer MCP over asking.** If `CatalystbyZoho_*` tools are available, use them. Never ask the user to copy IDs from the console.
- **Default to Development.** Always target the Development environment unless the user explicitly says "production" or "deploy to prod".
- **"Build an app" means Slate + Function by default.** When a user says "build an app", "create an app", or "make a simple app" without specifying backend-only, the default output is a **Slate frontend + Advanced I/O function backend**. Do NOT build only a function and call it an app. If the user's intent is clearly backend-only (e.g. "build an API", "write a function"), skip Slate.
- **Prefer Functions over AppSail for simple HTTP.** Functions are cheaper (per-invocation billing), simpler to deploy, and require no infrastructure management. Reach for AppSail only when the use case genuinely requires a persistent process, or a custom runtime.
- **Show cost before building.** For any new infrastructure (functions, AppSail, Stratus buckets), load `catalyst-pricing` and give a brief estimate before writing code. Most small projects stay within free tier — say so when true.
- **Recommend the current service, not the deprecated one.** File Store → Stratus. Event Listeners → Signals. Cron → Job Scheduling. Never mention the deprecated name in generated code or config.
- **Warn before the region bites.** Circuits and Integration Functions do not work in most data centers. Check the user's DC before suggesting them.

---

## How It Works

1. **Pre-flight** — Check that `.catalystrc` and `catalyst.json` exist. If missing, use MCP to get org/project IDs and run `catalyst init --org <orgId> -p <projectId> -ni`. Never use interactive `catalyst init`.
2. **MCP check** — Look for `CatalystbyZoho_*` tools. If available, use MCP to fetch org/project IDs instead of asking the user.
3. **Route** — Match the query to the most specific service in the routing table below.
4. **Load lazily** — Read ONLY the single reference file needed for the current step. Do NOT preload multiple skills upfront. For "build an app" requests: (a) assume **Slate frontend + AIO function** unless the user says backend-only, (b) sketch the architecture briefly and confirm with the user before building, (c) then load one reference file per service as you write each part — `catalyst-slate` for the frontend, `catalyst-functions` for the backend.
5. **Cost check** — Only load `catalyst-pricing` if the user specifically asks about cost, or if the plan includes AppSail, Stratus, or other paid-tier services. Skip for basic Functions + DataStore projects (likely free tier).
6. **Answer** — Provide code examples using the user's platform (Node.js, Python, Java, Web, or Mobile).

## Triggers

Use this skill for queries containing: Catalyst, zcatalyst, AppSail, Data Store, ZCQL, Cache, Stratus, Slate, NoSQL, Zia Services, QuickML, API Gateway, Connections, Zoho MCP, CatalystbyZoho, `catalyst init`, `catalyst deploy`, `catalyst serve`, `zcatalyst-sdk-node`, `catalyst-config.json`, Catalyst pricing, "build on Zoho's platform", or "deploy to Catalyst". Do NOT use for generic Zoho CRM questions unless Catalyst is the target.

---

## 🛑 Pre-flight gate (project-mutating tasks only)

**Step 1 — MCP check (do this before anything else for infrastructure tasks):**
Look for `CatalystbyZoho_*` tools in your tool list.
- **If present** — use MCP to fetch org/project IDs. Never ask the user to copy IDs from the console.
  **How to call MCP tools correctly:**
  1. `ZohoMCP_getSchema` takes `query_params`, NOT `body`:
     ```
     ZohoMCP_getSchema({ query_params: { tool_name: "CatalystbyZoho_List_All_Projects" } })
     ```
  2. Always call `ZohoMCP_getSchema` first for any `CatalystbyZoho_*` tool — never guess the argument shape. Many tools require `path_variables` (e.g. `project_id`) that are invisible without the schema.
  3. `ZohoMCP_executeTool` takes a `body` with this shape:
     ```
     ZohoMCP_executeTool({ body: {
       tool_name: "CatalystbyZoho_List_All_Functions",
       arguments: {
         path_variables: { project_id: "31594000000127002" },
         headers: {},
         body: {}
       }
     }})
     ```
  4. Tools with no required path variables (e.g. `List_All_Organizations`, `List_All_Projects`) can be called with `arguments: {}`.
- **If NOT present and the task creates resources, writes files, deploys, or reads project IDs** — **HARD STOP.** Do NOT write any code or create any files. Tell the user:
  > "Zoho MCP needs to be connected before I can work with your Catalyst project. Load the `catalyst-zoho-mcp` skill to set it up — it takes under a minute."
  Do not proceed until `CatalystbyZoho_*` tools are visible.

**This gate applies only when the task writes Catalyst project files, deploys, reads project/environment IDs, or performs MCP project operations.** Skip it for informational questions (pricing, architecture advice, service selection, "what is Catalyst?", install help, SDK usage, or any question that doesn't require an initialized project).

**For project-mutating tasks: verify `.catalystrc` and `catalyst.json` exist in the working directory.**
- If missing → use MCP tools to get the org ID and project ID, then run:
  ```bash
  catalyst init --org <orgId> -p <projectId> -ni
  ```
  **Never ask the user to run `catalyst init` interactively. Never create `.catalystrc` or `catalyst.json` yourself — they must be generated by the CLI.**
  **Note:** NI mode can only link an existing project. If no project exists yet, tell the user to create one in the Catalyst console, then come back — you'll link it with `catalyst init -ni`.

---

## Catalyst at a Glance

New to Catalyst? Here's what each service does in one line:

| Service | What it is |
|---------|-----------|
| **Functions** | Serverless functions — Basic I/O (HTTP), Advanced I/O, Event, Cron, Integration, Email Parser, Push Notification. Per-invocation billing. |
| **AppSail** | PaaS for long-running web apps — Node.js, Java, Python managed runtimes, or any Docker container. |
| **Data Store** | Relational tables (rows + columns, foreign keys). Queried via ZCQL (SQL-like) or SDK. |
| **Stratus** | Object/file storage (like S3). Buckets, folders, objects. Up to 250 GB per object. |
| **Slate** | Frontend hosting (like Vercel). Deploys React, Next.js, Vue, Angular, Svelte, Preact, Astro, SolidJS, static HTML. |
| **Cache** | In-memory key-value store. Divided into segments. TTL in hours, max 48 h. |
| **NoSQL** | Document storage with flexible schema (no fixed columns). For unstructured/polymorphic data. |
| **Authentication** | Built-in user sign-up/login (ZAID). OAuth Connections for third-party APIs. |
| **SmartBrowz** | Headless browser automation, PDF/screenshot generation, Browser Logic functions, Browser Grid (parallel browsers), and Dataverse (web scraping). |
| **Zia Services** | Pre-trained AI/ML: OCR, Face Analytics, Text Analytics, Object Detection, Barcode, Moderation. |
| **QuickML** | AutoML — train models on your own data without writing ML code. *(Not in EU/AU/IN/JP/SA/CA)* |
| **Circuits** | Serverless workflow orchestration (step functions). *(Not in EU/AU/IN/JP/SA/CA)* |
| **Signals** | Event-driven triggers / pub-sub (replaces legacy Event Listeners). |
| **Job Scheduling** | Recurring/scheduled function execution (replaces legacy Cron). |
| **Zoho MCP** | AI tool integration — lets AI agents manage Catalyst infrastructure via `CatalystbyZoho_*` tools. |
| **ZCQL** | SQL-like query language for Data Store. `SELECT`, `INSERT`, `UPDATE`, `DELETE`. Max 300 rows per SELECT. |
| **ZAID** | Zoho Account ID — the built-in auth identity layer. Used with Web SDK for user auth flows. |

---

## Skill Routing Table

| When the query is about… | Load this skill |
|--------------------------|-----------------|
| **Which service to use, architecture decisions, DC restrictions** | `catalyst-basics` (load `skills/catalyst-basics/references/architecture.md`) |
| Project setup, `.catalystrc`, environments, orgs, IDs, CLI commands | `catalyst-basics` |
| Functions — types, signatures, `catalyst-config.json`, API Gateway, file uploads | `catalyst-functions` |
| AppSail — backend PaaS, Docker, managed runtimes, PORT variable | `catalyst-appsail` |
| Slate — frontend hosting, frameworks, `slate-config.toml`, Git deploy | `catalyst-slate` |
| Data Store — CRUD, ZCQL queries, permissions, column types | `catalyst-datastore` |
| Stratus — object storage, upload/download, signed URLs, multipart | `catalyst-stratus` |
| NoSQL — document storage, flexible schema, collections | `catalyst-nosql` |
| Authentication — user login/signup, ZAID, Web SDK auth, Connections/OAuth | `catalyst-authentication` |
| Cache — in-memory key-value, TTL, segment operations | `catalyst-cache` |
| Pricing — free tier, pay-as-you-go, GB-seconds, cost estimation | `catalyst-pricing` |
| SDKs — Node.js, Web, Python, Java, Android, iOS, Flutter | `catalyst-sdk` |
| Zia Services, QuickML — OCR, ML predictions, AutoML | `catalyst-zia` |
| Signals — event-driven triggers, publish/subscribe, event listeners, custom publisher, webhook target, dispatch policy | `catalyst-signals` |
| SmartBrowz — headless browser, Puppeteer, Playwright, Selenium, Browser Logic, PDF generation, screenshot, Browser Grid, Dataverse | `catalyst-smartbrowz` |
| Job Scheduling — cron/scheduled execution, recurring jobs | `catalyst-basics` (load `skills/catalyst-basics/references/architecture.md` — no dedicated skill yet) |
| Zoho MCP — MCP setup, `CatalystbyZoho_*` tools, infra-as-conversation | `catalyst-zoho-mcp` |
| Skill gave wrong or outdated guidance — user reporting an error | load `catalyst-by-zoho/references/skill-feedback.md` |

---

## ⛔ Never Use (deprecated + regionally restricted)

### Deprecated services — do not use for new projects

Users who signed up **after August 27, 2025** cannot access these components at all.

| Do not use | Use this instead |
|------------|------------------|
| ~~File Store~~ | **Stratus** (object storage) |
| ~~Event Listeners~~ | **Signals** (event-driven architecture) |
| ~~Cron~~ | **Job Scheduling** (scheduled execution) |

### Regionally restricted services — check DC before recommending

These services are **unavailable** in the listed data centers. Building with them for users in those regions results in runtime failures.

| Service | Not available in |
|---------|------------------|
| **Circuits** | EU, AU, IN, JP, SA, CA |
| **Integration Functions** | EU, AU, IN, JP, SA, CA |
| **Push Notifications** | EU, AU, IN, CA |
| **AutoML (QuickML)** | EU, AU, IN, JP, SA, CA |
| **Identity Scanner (Zia)** | Available in IN DC only (not EU, AU, US, JP, SA, CA) |
| **Mobile Device Management** | EU, AU, IN, JP, SA, CA |

**How to check:** Ask the user which data center their Catalyst account uses, or look for the DC code in their console URL (e.g., `catalyst.zoho.in` → IN, `catalyst.zoho.eu` → EU).

---

## Non-Interactive Mode

CLI v1.27.0+ supports non-interactive (NI) mode — the CLI takes all answers from flags and sensible defaults instead of prompting.

**Enable:** Add `-ni` (or `--non-interactive`) to any supported command, or set `ZCATALYST_NON_INTERACTIVE=1` in the environment.

**Disabled commands:** `functions:setup` → use `functions:add -ni`; `functions:shell` → use `functions:execute`

**Blocked options:** `--remote` on `functions:delete` and `client:delete` is not allowed in NI mode.

**Tip:** `catalyst <command> -ni --help` shows the NI-specific help for that command.

---

## `.catalystrc` — Reading org and project context

After `catalyst init`, a `.catalystrc` file is written to the project root. Read it at the start of any session to identify the active project without asking the user.

**Actual format:**
```json
{
  "defaults": { "project": 1, "env": 1 },
  "actives":  { "project": 1, "env": 1 },
  "projects": [
    {
      "idx": 1,
      "id": "<projectId>",
      "name": "<projectName>",
      "domain": { "id": "<domainId>", "name": "<projectName>-<orgId>.development" },
      "env": [{ "idx": 1, "id": "<orgId>", "name": "Development", "type": 3 }]
    }
  ]
}
```

**How to read the active project ID and org ID:**
1. Read `defaults.project` → this is the active project's `idx` value
2. Find the entry in `projects` where `idx` matches → get its `id` → this is the **project ID** to use with `-p`
3. From the same entry, read `env[0].id` → this is the **org ID** to use with `--org`

---

## Quick-reference: Top gotchas

- **TERMINOLOGY: always say "organization" or "org", NEVER "portal"** — the `catalyst init` CLI prompt says "Select a default Catalyst portal" but this is the CLI's legacy wording; the correct term is organization
- **`.catalystrc` / `catalyst.json` missing** → run `catalyst init --org <orgId> -p <projectId> -ni` (get IDs from MCP); never create these files manually, never use interactive `catalyst init`
- **All Catalyst CLI commands default to non-interactive** (CLI v1.27.0+) — always use `-ni` with `--org`, `-p`, `--name`, `--type`, `--stack` flags; never fall back to interactive/arrow-key menus in agent context
- **`catalyst functions:add` non-interactive** — `catalyst functions:add --name <n> --type <type> --stack <stack> -ni`
- **ZCQL result rows are wrapped** → `rows.map(r => r.TableName)` to unwrap
- **ZCQL max 300 rows/query** → use `LIMIT offset, count` for pagination
- **ZAID differs between Dev and Prod** → #1 auth issue in production
- **AppSail PORT** → `process.env.X_ZOHO_CATALYST_LISTEN_PORT` (not `PORT`)
- **Cache values are strings only** → serialize/deserialize JSON yourself
- **Stratus bucket names are globally unique** → use `{app-name}-{project-id-prefix}`
- **Slate → function calls are cross-domain** → use full URL + `generateAuthToken()` + CORS whitelist
- **DataStore App User permissions OFF by default** → enable in Console → Table → Scopes & Permissions
- **`catalyst-config.json` format** → `deployment` + `execution` keys only; NOT `function` or `entry_point`
- **Advanced I/O node20 `req`** → raw `http.IncomingMessage`; use `sendJson(res, ...)` helper, not `res.json()`
- **`signOut()` requires a redirect URL** → `catalyst.auth.signOut(redirectURL)`

---

## Documentation

- Main docs: https://docs.catalyst.zoho.com/en/
- Node.js SDK: https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/overview/
- Web SDK: https://docs.catalyst.zoho.com/en/sdk/web/v4/overview/
- CLI reference: https://docs.catalyst.zoho.com/en/cli/v1/cli-command-reference/
- Pricing: https://catalyst.zoho.com/pricing.html
