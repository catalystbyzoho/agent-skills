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

Created automatically when you run `catalyst appsail:init` or `catalyst appsail:add`. Not created for standalone deploys or custom runtimes.

```json
{
  "command": "node app.js",
  "stack": "node20",
  "memory": 512,
  "env_variables": {
    "DB_HOST": "db.example.com",
    "API_KEY": "your-key-here"
  }
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `command` | Yes | Startup command for the app |
| `stack` | Yes | `node20`, `node18`, `java17`, `java11`, `python39`, or `docker` |
| `memory` | No | Default 512 MB; range 256–2048 MB |
| `env_variables` | No | Applied at deploy time; merged into Console config |

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
EXPOSE 9000
CMD ["node", "app.js"]
```

---

## Deployment

### Path A — Regular deploy (interactive init first)

Run `catalyst appsail:add` (interactive — CLI will prompt for runtime type, protocol, image, name).
For Docker Image, select **Docker Image** → **Docker Image protocol** or **Docker Archive protocol** → provide image tag or archive path → name the service.
After init, `catalyst.json` is updated. `app-config.json` is NOT created for Docker apps.

```bash
catalyst appsail:add            # interactive — agent cannot drive this autonomously
catalyst deploy appsail         # deploys after init
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
  --command "node server.js" --port 8080
```

> ⚠️ **OCI-only:** Catalyst only accepts Linux AMD64 (x86-64) OCI-compliant images. ARM64 or non-OCI images will be rejected.

> ⚠️ **Prerequisite:** `catalyst.json` must exist in the working directory. Run `catalyst init` first if starting from scratch.

**Agent boundary — what requires the user:**
- `catalyst appsail:add` is interactive (menu-driven) and cannot be driven autonomously
- `catalyst deploy appsail` without `--name`/`--source` flags will also prompt interactively
- If the CLI stalls or prompts unexpectedly, stop and route the user to the Console: AppSail → Deploy from Console → Docker Image (requires image on a container registry: Docker Hub, AWS ECR, or GCP Artifact Registry)

---

## Environment Variables

Two paths depending on how the app was deployed:

**CLI-initialized apps** (`catalyst appsail:init` or `catalyst appsail:add`):
- Set `env_variables` in `app-config.json` — values are applied at deploy time and reflected in Console
- Console edits made post-deploy are also applied immediately
- On the next `catalyst deploy appsail`, values in `app-config.json` push to Console again

**Standalone deploys** (no init/add, or console-deployed apps):
- No `app-config.json` is created; configure env vars in the Console only
- Console → AppSail → \<service\> → Configuration → Environment Variables

> ⚠️ **Verify env vars after every deploy.** Console values are overwritten by `app-config.json` on each deploy. Any secret you set manually in the Console may be silently replaced.

> ⚠️ **Do not use `CATALYST` in env var key names.** Keys containing `CATALYST` (e.g. `MY_CATALYST_KEY`) are rejected by the AppSail runtime. Use `ZOHO_` or a non-prefixed name instead. This restriction is not documented by Zoho but is consistently observed in production deployments.

---

## Health Checks & Autoscaling

- Configure health check path: Console → AppSail → service → Configuration → Health Check
- Instances scale from 1 (min) to 5 (max)
- Scale-up at **80%** utilization threshold
- App must start listening on the port **within 10 seconds** of instance creation

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
- **Stacks**: `node20`, `node18`, `java17`, `java11`, `python39`, `docker`

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Env var missing after deploy | `app-config.json` was redeployed with a different or empty `env_variables` block, overwriting Console-set values | Keep all env vars in `app-config.json`; treat Console as read-only verification |
| Env var key rejected (`CATALYST` in name) | Keys containing `CATALYST` are rejected by the AppSail runtime (undocumented restriction) | Rename the key — use `ZOHO_` prefix or a plain name without `CATALYST` |
| App fails to start — port not listening | App bound to a hardcoded port instead of `X_ZOHO_CATALYST_LISTEN_PORT` | Use `process.env.X_ZOHO_CATALYST_LISTEN_PORT \|\| 9000` as the port |
| `catalyst deploy appsail` stalls or prompts | No `--source` flag provided — CLI defaults to interactive managed runtime menus | Use `--name` and `--source docker://...` flags for non-interactive Docker deploy |
| Managed runtime initialized instead of Docker Image | Selected wrong option in `catalyst appsail:add` interactive menu | Delete the AppSail entry from `catalyst.json`, then re-run `catalyst appsail:add` and select **Docker Image** |
| `catalyst deploy appsail` ignores code changes | Ran without `--source` flag and no prior init — CLI prompted for config | Use standalone flags `--name`/`--source`, or run `catalyst appsail:add` interactively first |
| Console shows old env values after deploy | Deploy applied `app-config.json` values, overwriting Console edits | Update `app-config.json` to reflect intended values before deploying |
