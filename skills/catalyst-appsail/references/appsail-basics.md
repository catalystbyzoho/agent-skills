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
├── app-config.json    # AppSail configuration (created by CLI appsail:add)
└── node_modules/
```

## app-config.json

Created automatically when you run `catalyst appsail:add`. Not created for standalone deploys or custom runtimes.

> ⚠️ There is no `catalyst appsail:init` command. Only `catalyst appsail:add` exists.

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
const catalyst = require('zcatalyst-sdk-node'); // use ^2.5.0 or later

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
    // error.message may be undefined on non-standard SDK error objects — always stringify as fallback
    res.status(500).json({ error: error?.message || String(error) });
  }
});

// Health check endpoint (required)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

> ⚠️ **Always use `zcatalyst-sdk-node` at `^2.5.0` or later.** All earlier versions (including v1.x) are deprecated — DataStore operations return HTTP 500 with no useful error message on old SDK versions.

---

## Docker Template

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
# EXPOSE is documentation only — it does NOT configure the AppSail listening port.
# Catalyst uses X_ZOHO_CATALYST_LISTEN_PORT (default 9000).
EXPOSE 9000
CMD ["node", "app.js"]
```

> **Docker apps do NOT use `app-config.json`** — all specifications are stored in `catalyst.json`.

---

## Security — Gateway Always Injects Admin Credentials

> ⚠️ **The Catalyst gateway injects admin-scope `x-zc-*` headers on every request to AppSail — including unauthenticated ones.** This means:
> - `catalyst.initialize(req)` **always succeeds**, even with no auth cookie
> - `catalyst.initialize(req, { scope: 'admin' })` gives full DataStore/Stratus access to anonymous requests
> - `getCurrentUser()` returns `null` (the injected identity is the project admin, not an app user) — use this as your auth check, not whether `initialize()` succeeds
>
> **Pattern for AppSail auth guard:**
> ```javascript
> const user = await catalyst.initialize(req).userManagement().getCurrentUser();
> if (!user) return res.status(401).json({ error: 'Unauthorized' });
> ```

## Session Cookies and Cross-Domain Auth

Catalyst services run on different host patterns, and **session cookies do not cross these domains** (DC-specific TLD variants — `.com`, `.in`, `.eu`, `.au`, `.jp`, `.sa`, `.ca` — follow the same split):

| Host pattern | Typical use |
|--------------|-------------|
| `*.catalystserverless.com` | Functions, OAuth callbacks on the function domain |
| `*.catalystappsail.com` | AppSail apps |
| `*.onslate.com` | Slate-hosted frontends |

An OAuth/login function on `catalystserverless.com` that sets a session cookie will **not** authenticate requests to an AppSail app on `catalystappsail.com`. Options:

- Host the OAuth flow inside the AppSail app (same origin)
- Use Catalyst domain mapping so auth and app share one custom domain
- Use server-side token exchange instead of cross-domain cookies

---

## Deployment, Environment Variables, Health Checks, URL Pattern

Covered in **`appsail-deploy.md`** — load that file for deploy commands (Paths A/B/C), the env-var source-of-truth rules, health checks/autoscaling, and the AppSail URL pattern. Key rule to carry: deployment behavior depends on whether the app is **linked in `catalyst.json`** (via `catalyst appsail:add`), not on whether `app-config.json` exists.

---

## Filesystem Durability

The AppSail container filesystem is **not durable storage**. Files written at runtime can disappear on restart, redeploy, or scale events. Use Stratus (files/objects) or Data Store (structured data) for anything that must survive; treat the local filesystem as scratch space only.

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

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Invalid Build Path: "undefined"` | `build_path` key missing from `app-config.json` | Add `"build_path": "./your-build-dir"` to `app-config.json`. This field is required for linked managed-runtime deploys. |
| `EACCES` errors during deploy / CLI attempts to zip entire disk | `build_path` (or `--build-path`) set to `"/"` (filesystem root) | Set `build_path` to the actual build directory (e.g. `"./build"` or an absolute path to the build folder), never `"/"` |
| Runtime env var missing after CLI deploy (var was set in Console) | `app-config.json` redeploy replaces runtime env vars with exactly what's in `env_variables` — Console-set vars not in the file are wiped from the runtime | Add ALL required vars to `app-config.json`; never rely on Console-only vars for linked services |
| Console UI shows env vars but runtime can't see them | `"env_variables": {}` is empty — Console UI preserves display values but does NOT apply them to the runtime on deploy | Add the vars to `env_variables` in `app-config.json` and redeploy |
| Env var key conflicts with system var | AppSail runtime injects its own `CATALYST_*` and `X_ZOHO_CATALYST_*` vars; user-defined keys with same name are overwritten | Avoid `CATALYST` in user-defined key names; use `ZOHO_` prefix or plain names |
| App fails to start — port not listening | App bound to a hardcoded port instead of `X_ZOHO_CATALYST_LISTEN_PORT`, OR `--build-path` was a relative path | Use `process.env.X_ZOHO_CATALYST_LISTEN_PORT \|\| 9000` as the port; always use an **absolute path** for `--build-path` |
| DataStore operations return HTTP 500 with empty error `{}` | `zcatalyst-sdk-node` version is v1.x (deprecated) — old SDK gives no useful error message | Change to `"zcatalyst-sdk-node": "^2.5.0"` in `package.json` and redeploy |
| `catalyst deploy appsail` stalls or prompts | No `--source` flag provided — CLI defaults to interactive managed runtime menus | Use `--name` and `--source docker://...` flags for non-interactive Docker deploy |
| Managed runtime initialized instead of Docker Image | Selected wrong option in `catalyst appsail:add` interactive menu | Delete the AppSail entry from `catalyst.json`, then re-run `catalyst appsail:add` and select **Docker Image** |
| `catalyst deploy appsail` ignores code changes | Ran without `--source` flag and no prior init — CLI prompted for config | Use standalone flags `--name`/`--source`, or run `catalyst appsail:add` interactively first |
| Custom auth broken / requests intercepted unexpectedly | `catalyst_auth: true` in `app-config.json` — Catalyst's own SSO layer wraps the service | Set `catalyst_auth: false` (or remove the key) when using custom OAuth or any non-Catalyst auth |
| Logs query returns empty via Logs API / MCP `Get_Logs` | **Access** and **Application** logs are separate views — you cannot see both combined, and the API requires an explicit `logType` and `resource_list` filter | Query with `logType: "application"` for app output (stdout/console) and `logType: "access"` for requests; verify the resource filter matches your service name. Cross-check Console → Logs (which covers Functions and AppSail) before concluding the app produced no output |
