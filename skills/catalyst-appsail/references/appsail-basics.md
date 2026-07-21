## AppSail vs Functions

- **Functions**: Stateless, event-driven, auto-scaling, pay-per-execution. Best for APIs, webhooks, scheduled tasks.
- **AppSail**: Persistent server process with managed runtimes or custom Docker. Best for full web apps, long-running processes, WebSockets.

---

## Managed Runtimes

Pre-configured environments:
- **Node.js**: Express, Hapi, Koa, Fastify, Restify
- **Java**: Embedded Jetty, Spring MVC, Spring Boot
- **Python**: Flask, Django, Bottle, CherryPy, Tornado

## Custom Runtimes (Docker)

Deploy any language as OCI container images: Go, Kotlin, Dart, Ruby, PHP, Deno, Bun, Rust — anything with a Dockerfile.

---

## Project Structure

```
appsail/
├── app.js
├── package.json
├── app-config.json    # AppSail configuration (created by CLI init/add)
└── node_modules/
```

## app-config.json

Created automatically when you run `catalyst appsail:add`. Not created for standalone deploys or custom runtimes.

> ⚠️ There is no `catalyst appsail:init` command. Only `catalyst appsail:add` exists (it links an existing AppSail to the project or creates a new one interactively).

```json
{
  "command": "node app.js",
  "build_path": "./build",
  "stack": "node20",
  "memory": 512,
  "env_variables": {
    "DB_HOST": "db.example.com",
    "API_KEY": "your-key-here"
  },
  "platform": "javase",
  "scripts": {
    "preserve": "npm run build",
    "predeploy": "npm run build",
    "postserve": "npm run clean",
    "postdeploy": "npm run clean"
  },
  "catalyst_auth": false,
  "login_redirect": "/index.html"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `command` | Yes | Startup command for the app |
| `build_path` | Yes (for linked deploys) | Path to the directory containing deployable build files. **Do NOT use `"/"` as the value** — it resolves to filesystem root and will attempt to zip the entire disk (`EACCES` errors). Use `"./build"`, `"./target"`, or an absolute path. |
| `stack` | Yes | `node24`, `node22`, `node20`, `node18`, `node16`, `node14`, `node12`, `java25`, `java21`, `java17`, `java11`, `java8`, `python_3_13`, `python_3_12`, `python_3_11`, `python_3_10` (managed runtimes only — Docker/container apps do NOT use `app-config.json`) |
| `memory` | No | Default 512 MB; range 256–2048 MB |
| `env_variables` | No | Applied at deploy time; replaces Console-set vars on redeploy |
| `platform` | No | Java only: `"javase"` or `"javawar"` |
| `scripts` | No | Lifecycle hooks: `preserve` (before serve), `predeploy` (before deploy), `postserve` (after serve), `postdeploy` (after deploy) |
| `catalyst_auth` | No | **Security-sensitive.** `true` = Catalyst's own auth layer wraps the AppSail service (users must log in via Catalyst SSO). `false` (default) = service is publicly accessible / uses your own auth. **Set to `false` for apps with custom OAuth** — `true` silently intercepts requests and breaks custom auth flows. |
| `login_redirect` | No | Post-authentication redirect path. Only meaningful when `catalyst_auth: true`. Example: `"/index.html"`. |

---

## Node.js + Express Template

```javascript
// appsail/app.js
const express = require('express');
const catalyst = require('zcatalyst-sdk-node');

const app = express();
app.use(express.json());

// ALWAYS use this env variable for the port
const PORT = process.env.X_ZOHO_CATALYST_LISTEN_PORT || 9000;

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from AppSail!' });
});

app.get('/api/users', async (req, res) => {
  try {
    // Use admin scope for data operations in AppSail
    const catalystApp = catalyst.initialize(req, { scope: 'admin' });
    const zcql = catalystApp.zcql();
    const users = await zcql.executeZCQLQuery('SELECT * FROM Users LIMIT 50');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint (required)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => process.exit(0));
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## Docker Template

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
# EXPOSE is Docker documentation only — it does NOT configure the AppSail listening port.
# Catalyst uses X_ZOHO_CATALYST_LISTEN_PORT (default 9000) to determine the port to check.
EXPOSE 9000
CMD ["node", "app.js"]
```

> **Docker apps do NOT use `app-config.json`** — all specifications are stored in `catalyst.json`.

---

## Deployment

### Understanding the two deploy modes

The key distinction is **whether the app is initialized (linked) in `catalyst.json`**, not whether `app-config.json` exists:

| Mode | What it means | Deploy command |
|------|--------------|----------------|
| **Initialized / Linked** | `catalyst appsail:add` was run → app entry exists in `catalyst.json` + `app-config.json` created | See Path A below |
| **Standalone** | No prior `appsail:add` — `catalyst.json` has no AppSail entry | See Path C below |

> ⚠️ Having `app-config.json` present in the build path does **not** make an app "CLI-managed". If the app is not in `catalyst.json`, `app-config.json` is ignored during deploy — config is fetched interactively.

### Path A — Linked managed runtime (already initialized via `appsail:add`)

If the app is already registered in `catalyst.json`, use one of these:

```bash
# Deploy the entire project (includes AppSail)
catalyst deploy

# Deploy only this AppSail service (non-interactive, agent-safe)
catalyst deploy appsail
```

> ⚠️ **`catalyst deploy appsail` on a linked app is safe and non-interactive** — it deploys using `app-config.json` from the source directory. This is the correct path for linked apps; the "already exists" error only occurs if you run `catalyst appsail:add` again on an app that is already registered.

> ⚠️ **Always include `--name <service-name>` when running `catalyst deploy appsail`.** If `--name` is omitted, the CLI defaults the service name to `AppSail`, which can cause unexpected behavior if your actual service has a different name.

```bash
catalyst deploy --except appsail                    # Deploy everything EXCEPT AppSail
catalyst deploy appsail --name <service-name>       # Deploy ONLY this AppSail service
catalyst deploy --only appsail:<service-name>       # Alternative: deploy specific AppSail by name
```

```bash
# Example: link app first (interactive), then deploy
catalyst appsail:add                                        # interactive — agent cannot drive this autonomously
catalyst deploy appsail --name <service-name>               # non-interactive deploy using app-config.json
```

### Path B — Non-interactive standalone Docker deploy (agent/CI-safe)

Run from the project root (directory containing `catalyst.json`). No prior `appsail:add` required.

```bash
# Docker Image (from local registry — image must be tagged and built locally)
catalyst deploy appsail --name <service-name> --source docker://<image>:<tag>

# Docker Archive (from a .tar file — generated with: docker save <image> > image.tar)
catalyst deploy appsail --name <service-name> --source docker-archive://./image.tar

# Optional overrides
catalyst deploy appsail --name <service-name> --source docker://<image>:<tag> \
# --port sets the AppSail listening port (equivalent to X_ZOHO_CATALYST_LISTEN_PORT).
# Catalyst verifies the process is bound to this port within 10 seconds — if not, the instance is killed.
catalyst deploy appsail --name <service-name> --source docker://<image>:<tag> \
  --command "node server.js" --port 8080
```

### Path C — Non-interactive standalone managed runtime deploy (agent/CI-safe)

Run from the Catalyst project root (directory containing `catalyst.json`).

```bash
# --build-path MUST be an absolute path — relative paths (e.g. ./appsail) fail silently at runtime
catalyst deploy appsail \
  --name <service-name> \
  --build-path /absolute/path/to/appsail \
  --stack node20 \
  --command "node app.js"
```

> ⚠️ **`--build-path` must be an absolute path.** Relative paths are accepted by the CLI (no error) but the deployed app fails to start at runtime with "Execution failed. Please check the startup command or port." This is confirmed by runtime testing.

> ⚠️ **`--port` flag is only for custom (Docker) runtimes.** Do not use it for managed runtimes — the port is always controlled via `X_ZOHO_CATALYST_LISTEN_PORT`.

> ⚠️ **OCI-only:** Catalyst only accepts Linux AMD64 (x86-64) OCI-compliant images. ARM64 or non-OCI images will be rejected.

> ⚠️ **Prerequisite:** `catalyst.json` must exist in the working directory. Run `catalyst init` first if starting from scratch.

**Agent boundary — what requires the user:**
- `catalyst appsail:add` is interactive (menu-driven) and cannot be driven autonomously
- `catalyst deploy appsail` without `--name`/`--source` flags will also prompt interactively
- If the CLI stalls or prompts unexpectedly, stop and route the user to the Console: AppSail → Deploy from Console → Docker Image (requires image on a container registry: Docker Hub, AWS ECR, or GCP Artifact Registry)

---

## Environment Variables

### Source of Truth Rules (Runtime-Confirmed)

**Initialized (linked) apps** — app is registered in `catalyst.json` and has `app-config.json`:
- `app-config.json` is the **single source of truth** on every `catalyst deploy appsail`
- On deploy: the runtime applies exactly what is in `env_variables` — Console-set vars are **replaced**
- **With any variables defined** in `env_variables`: Console-set vars not in the file are **wiped completely**
- **With `"env_variables": {}`** (empty): Console UI still shows vars, but they are **not applied to the runtime** — the service cannot see them
- **Rule:** For linked services, define ALL env vars in `app-config.json`. Never rely on Console-set vars surviving a redeploy.

```json
{
  "command": "node server.js",
  "stack": "node24",
  "memory": 256,
  "env_variables": {
    "API_KEY": "your_value",
    "DATABASE_URL": "your_value"
  }
}
```

**Standalone / Console-deployed apps** (no app entry in `catalyst.json`):
- Console is the only source of truth; configure via Console → AppSail → \<service\> → Configuration → Environment Variables
- These vars survive redeploys done from the Console but will be overwritten if a CLI deploy on a linked app (with `app-config.json`) is ever run

> ⚠️ **Avoid `CATALYST` in user-defined env var key names.** The AppSail runtime injects its own `CATALYST_*` system vars (`CATALYST_PROJECT_ID`, `CATALYST_MAX_TIMEOUT`, `CATALYST_USER_ENVIRONMENT`, `CATALYST_PROJECT_TIMEZONE`). User-defined keys with `CATALYST` in the name may conflict or be rejected — use `ZOHO_` prefix or a plain name without `CATALYST` to be safe. Runtime-confirmed system vars injected automatically: `X_ZOHO_CATALYST_LISTEN_PORT`, `X_ZOHO_CATALYST_ENVIRONMENT`, `X_ZOHO_CATALYST_RESOURCE_ID`, `X_ZOHO_CATALYST_RUNTIME_MEMORY`, `X_ZOHO_CATALYST_ACCOUNTS_URL`, `X_ZOHO_CATALYST_CONSOLE_URL`, `CATALYST_PROJECT_ID`, `CATALYST_MAX_TIMEOUT`, `CATALYST_USER_ENVIRONMENT`, `CATALYST_PROJECT_TIMEZONE`.

---

## Health Checks & Autoscaling

- Configure health check path: Console → AppSail → service → Configuration → Health Check
- Instances scale from 1 (min) to 5 (max)
- Scale-up at **80%** utilization threshold
- App must start listening on the port **within 10 seconds** of instance creation

---

## AppSail URL Pattern

After deploying, Catalyst generates a unique URL for your AppSail service:

```
Development: https://<service-name>-<ZAID>.development.catalystappsail.com
Production:  https://<service-name>-<ZAID>.catalystappsail.com
```

- **`<service-name>`**: the name you provided during init or deploy
- **`<ZAID>`**: the project's unique auth identifier (e.g. `1011034735`)

Example: `https://demoservice-1011034735.development.catalystappsail.com`

> ℹ️ This is a **separate domain** from your Catalyst serverless/web-hosting domain (`*.catalystserverless.com` / `*.zohocatalyst.com`). AppSail always gets its own `catalystappsail.com` subdomain — this is the root cause of same-origin issues when a Slate frontend tries to call an AppSail API.

---

## Slate + AppSail Cross-Origin Issue

Slate-hosted frontends calling AppSail APIs may get `"Unable to Fetch"` errors due to Catalyst's auth layer.

**Solution — serve the frontend from AppSail itself (same-origin):**

```javascript
const path = require('path');

// API routes first
app.get('/api/data', async (req, res) => { /* ... */ });

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
```

Copy your frontend build into `public/` inside the AppSail directory. Use relative URLs in frontend (`const API_BASE = ''`).

---

## Custom Domain SSL

Free SSL certificates are provisioned and renewed automatically via Zoho's Certificate Authority.
Configure via Console → Domain Mapping.

---

## AppSail Configurations

- **Instances**: 1–5 for auto-scaling
- **Memory**: 256–2048 MB per instance
- **Stacks**: `node24`, `node22`, `node20`, `node18`, `node16`, `node14`, `node12`, `java25`, `java21`, `java17`, `java11`, `java8`, `python_3_13`, `python_3_12`, `python_3_11`, `python_3_10` (managed runtimes); Docker/container apps use `catalyst.json` — no `stack` field

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Invalid Build Path: "undefined"` | `build_path` key missing from `app-config.json` | Add `"build_path": "./your-build-dir"` to `app-config.json`. This field is required for linked managed-runtime deploys. |
| `EACCES` errors during deploy / CLI attempts to zip entire disk | `build_path` (or `--build-path`) set to `"/"` (filesystem root) | Set `build_path` to the actual build directory (e.g. `"./build"` or an absolute path to the build folder), never `"/"` |
| Runtime env var missing after CLI deploy (var was set in Console) | `app-config.json` redeploy replaces runtime env vars with exactly what's in `env_variables` — Console-set vars not in the file are wiped from the runtime | Add ALL required vars to `app-config.json`; never rely on Console-only vars for linked services |
| Console UI shows env vars but runtime can't see them | `"env_variables": {}` is empty — Console UI preserves display values but does NOT apply them to the runtime on deploy | Add the vars to `env_variables` in `app-config.json` and redeploy |
| Env var key conflicts with system var | AppSail runtime injects its own `CATALYST_*` and `X_ZOHO_CATALYST_*` vars; user-defined keys with same name are overwritten | Avoid `CATALYST` in user-defined key names; use `ZOHO_` prefix or plain names |
| App fails to start — port not listening | App bound to a hardcoded port instead of `X_ZOHO_CATALYST_LISTEN_PORT`, OR `--build-path` was a relative path | Use `process.env.X_ZOHO_CATALYST_LISTEN_PORT \|\| 9000` as the port; always use an **absolute path** for `--build-path` |
| `catalyst deploy appsail` stalls or prompts | No `--source` flag provided — CLI defaults to interactive managed runtime menus | Use `--name` and `--source docker://...` flags for non-interactive Docker deploy |
| Managed runtime initialized instead of Docker Image | Selected wrong option in `catalyst appsail:add` interactive menu | Delete the AppSail entry from `catalyst.json`, then re-run `catalyst appsail:add` and select **Docker Image** |
| `catalyst deploy appsail` ignores code changes | Ran without `--source` flag and no prior init — CLI prompted for config | Use standalone flags `--name`/`--source`, or run `catalyst appsail:add` interactively first |
| Custom auth broken / requests intercepted unexpectedly | `catalyst_auth: true` in `app-config.json` — Catalyst's own SSO layer wraps the service | Set `catalyst_auth: false` (or remove the key) when using custom OAuth or any non-Catalyst auth |
