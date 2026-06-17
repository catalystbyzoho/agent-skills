# Catalyst Quick Start

Catalyst is Zoho's serverless application platform. You write backend logic as
Node.js/Java/Python functions, store data in Data Store or NoSQL, serve frontends
via Slate, and ship without managing servers.

## The 5 core services

| Service | What it does | When to use |
|---------|-------------|-------------|
| **Functions** | Run Node.js/Java/Python code on HTTP triggers or events | Any backend logic, APIs, file processing |
| **Data Store** | Managed relational DB — CRUD via SDK + ZCQL queries | Structured, tabular data with fixed schema |
| **Stratus** | Object storage (files, images, blobs up to 250 GB each) | File uploads, static assets, large data |
| **Slate** | Git-based frontend hosting (React, Next.js, Vue, Angular, …) | Serving your web UI |
| **Cache** | In-memory key-value store with TTL (max 48 h) | Sessions, rate-limit counters, ephemeral data |

---

## From zero to deployed — the walkthrough

### Step 1 — Install CLI and log in

```bash
npm install -g zcatalyst-cli
catalyst login          # opens browser auth, stores credentials locally
catalyst whoami         # confirm logged-in user
```

### Step 2 — Find your Org ID

Open the Catalyst Console at `https://console.catalyst.zoho.com/baas/index`. Your Org ID appears in the URL once you're inside an org:
`https://console.catalyst.zoho.com/baas/{OrgID}/index`

Copy that number — you'll need it when prompted during `catalyst init`.

> **First time?** If you haven't created a Catalyst project yet, go to the console → **Create Project** first. Then return here. `catalyst init` only links to existing projects — it cannot create them.

### Step 3 — Initialize the project

```bash
mkdir my-app && cd my-app
catalyst init
# Follow the prompts:
#
# 1. "Select a default Catalyst organization for this directory:"
#    Pick your organization from the list (arrow keys + Enter)
#
# 2. "Select a default Catalyst project for this directory:"
#    Pick an existing project, OR select:
#      [import a existing project] — link to a project by ID
#      [create a new project]      — create one from the console first, then re-run
#
# 3. "Which are the features you want to setup for this folder?"
#    (This step is optional — press Enter to skip)
#    Space to select, Enter to confirm. Options:
#      ◯ Functions: Configure and deploy http/non-http functions
#      ◯ Client:    Configure and deploy client files
#      ◯ AppSail:   Configure and deploy AppSails
#      ◯ Slate:     Configure and deploy slate apps
#
# 4. If Functions selected:
#    a) "Which type of function do you like to create?" (arrow keys)
#         BasicIO       — simple request/response (use for most HTTP APIs)
#         AdvancedIO    — raw HTTP control (req/res), full Express-style access
#         Event         — triggered by Catalyst events (e.g. Data Store row insert)
#         Cron          — runs on a schedule (cron expression)
#         Browser Logic — Puppeteer-based headless browser automation
#         Job           — long-running background job
#         Integration   — triggered by Zoho service events (CRM, Desk, etc.)
#
#    b) "Which runtime do you prefer to write your function?" (arrow keys)
#         ----Java----
#           Java 25 / Java 21 / Java 17 / Java 11 / Java 8
#         ---NodeJS---
#           NodeJS 24 / NodeJS 22 / NodeJS 20 / NodeJS 18
#         ---Python---
#           Python 3.10 / Python 3.9
#
#    c) npm-init style questions (press Enter to accept defaults):
#         package name:    (defaults to your project name)
#         version:         (1.0.0)
#         description:
#         entry point:     (index.js)
#         test command:
#         git repository:
#         keywords:
#         author:
#         license:         (ISC)
#         Is this OK?      → press Enter (yes)
#
#    d) "Install all dependencies now?" → Yes (recommended)
#
# 5. If Slate selected:
#      Select a framework → React + Vite (or your preference)
#      App name → e.g. my-ui
#      Modify default configurations? → No
#      Development command → press Enter to accept default
```

This creates:
- `catalyst.json` — project metadata (do not edit manually)
- `.catalystrc` — org/env config (do not edit manually)

### Step 4 — Find your Project ID

After `catalyst init`, open the Catalyst Console and navigate to your project. Your Project ID appears in the URL:
`https://console.catalyst.zoho.com/baas/<ORG_ID>/project/<PROJECT_ID>/`

### Step 5 — Add a function

```bash
catalyst functions:add
# Prompts (in order):
#   1. Which type of function do you like to create?
#        BasicIO / AdvancedIO / Event / Cron / Browser Logic / Job / Integration
#   2. Which runtime do you prefer to write your function?
#        Java: 25 / 21 / 17 / 11 / 8
#        NodeJS: 24 / 22 / 20 / 18
#        Python: 3.10 / 3.9
#   3. npm-init style questions (package name, version, description,
#      entry point, test command, git repository, keywords, author,
#      license, Is this OK?)
#   4. Install all dependencies now? → Yes
```

This creates `functions/<your_function>/index.js` (for Node.js).

A minimal Advanced I/O function (raw-http template):

```javascript
// functions/my_api/index.js
'use strict';
const catalyst = require('zcatalyst-sdk-node');

module.exports = async (catalystApp, context, req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Hello from Catalyst' }));
};
```

### Step 6 — Serve locally

```bash
catalyst serve
# Runs functions at: http://localhost:3000/server/<function_name>/execute
```

Test it:
```bash
curl http://localhost:3000/server/my_api/execute
```

### Step 7 — Deploy

```bash
catalyst deploy
# or deploy only functions:
catalyst deploy --only functions
```

Your function is live at:
`https://<project_domain>.catalystserverless.com/server/<function_name>/execute`

---

## Create a Data Store table

1. Open Console → your project → **Data Store**
2. Click **Add Table** → enter a table name (e.g., `Tasks`)
3. Click **Add Column** for each field:
   - Column name (e.g., `Title`)
   - Type: `Text`, `Number`, `Boolean`, `Date/DateTime`, `Email`
4. Save the table

Your table now has a `ROWID` column automatically (Catalyst's primary key).

### Set row-level permissions

1. Console → Data Store → your table → **Scopes and Permissions**
2. Enable **App User** row (required for SDK operations from authenticated users)
3. Check **Insert**, **Update**, **Delete** as needed
4. Save

---

## Configure CORS / Authorized Domains

If your Slate frontend calls a function and you get a CORS error in production:

1. Console → your project → **Settings** → **Authorized Domains**
2. Click **Add Domain** → enter your Slate domain (e.g., `https://myapp-12345.catalystapps.com`)
3. Enable the **CORS** toggle for that domain
4. Save

> The Catalyst gateway injects the CORS headers automatically — you do NOT need CORS code in your function for production origins. CORS code in functions is only for local dev (`localhost`).

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `catalyst: command not found` | CLI not installed globally | Run `npm install -g zcatalyst-cli` |
| `catalyst.json` is `{}` after init | No project linked yet | Run `catalyst project:use <project-name>` in the project directory |
| Function 401 in browser but works with curl | Authentication required in Security Rules | Add `"authentication": "open"` to `catalyst-config.json` for public endpoints |
| CORS error in production frontend | Domain not in Authorized Domains | Add the Slate/frontend domain in Console → Settings → Authorized Domains and enable CORS toggle |
