## Deployment

### Understanding the two deploy modes

The key distinction is **whether the app is initialized (linked) in `catalyst.json`**, not whether `app-config.json` exists:

| Mode | What it means | Deploy command |
|------|--------------|----------------|
| **Initialized / Linked** | `catalyst appsail:add` was run → app entry exists in `catalyst.json` + `app-config.json` created | See Path A below |
| **Standalone** | No prior `appsail:add` — `catalyst.json` has no AppSail entry | See Path C below |

> ⚠️ Having `app-config.json` present in the build path does **not** make an app "CLI-managed". If the app is not in `catalyst.json`, `app-config.json` is ignored during deploy — config is fetched interactively.

### Path A — Linked managed runtime (already initialized via `appsail:add`)

> ℹ️ **Path A is only reliably non-interactive when `app-config.json` is fully populated.** If the CLI prompts unexpectedly after `appsail:add`, fall back to Path C which is always non-interactive.

```bash
# Deploy the entire project (includes AppSail)
catalyst deploy

# Deploy only this AppSail service
catalyst deploy appsail --name <service-name>

catalyst deploy --except appsail                    # Deploy everything EXCEPT AppSail
catalyst deploy --only appsail:<service-name> -ni   # ✅ Recommended: deploy one AppSail service, non-interactive
```

> ⚠️ **Always include `--name <service-name>` when running `catalyst deploy appsail`.** If `--name` is omitted, the CLI defaults the service name to `AppSail`, which can cause unexpected behavior if your actual service has a different name.

```bash
# Example: link app first, then deploy
catalyst appsail:add --name <service-name> --source /abs/path/to/appsail --stack node20 --build ./
catalyst deploy appsail --name <service-name>
```

> ⚠️ **Always pass `--build ./` in `catalyst appsail:add`.** Even with `--name`, `--source`, and `--stack` provided, the CLI still prompts interactively for the build path if `--build` is omitted.

### Path B — Non-interactive standalone Docker deploy (agent/CI-safe)

Run from the project root (directory containing `catalyst.json`). No prior `appsail:add` required.

```bash
# Docker Image (from local registry — image must be tagged and built locally)
catalyst deploy appsail --name <service-name> --source docker://<image>:<tag>

# Docker Archive (from a .tar file — generated with: docker save <image> > image.tar)
catalyst deploy appsail --name <service-name> --source docker-archive://./image.tar

# With optional overrides (--port sets the AppSail listening port)
catalyst deploy appsail --name <service-name> --source docker://<image>:<tag> \
  --command "node server.js" --port 8080
```

### Path C — Recommended for agents: standalone managed runtime deploy (always non-interactive)

Run from the Catalyst project root (directory containing `catalyst.json`). No prior `appsail:add` required. **Use this path when building autonomously — it never prompts.**

```bash
# --build-path MUST be an absolute path — relative paths fail silently at runtime
catalyst deploy appsail \
  --name <service-name> \
  --build-path /absolute/path/to/appsail \
  --stack node20 \
  --command "node app.js"
```

> ⚠️ **`--build-path` must be an absolute path.** Relative paths are accepted by the CLI (no error) but the deployed app fails to start at runtime.

> ⚠️ **`--port` flag is only for custom (Docker) runtimes.** Do not use it for managed runtimes — the port is always controlled via `X_ZOHO_CATALYST_LISTEN_PORT`.

> ⚠️ **OCI-only:** Catalyst only accepts Linux AMD64 (x86-64) OCI-compliant images. ARM64 or non-OCI images will be rejected.

> ⚠️ **`catalyst.json` prerequisite:** `catalyst init` alone does NOT create `catalyst.json` — it only writes `.catalystrc`. `catalyst.json` is created by the first service command (`catalyst appsail:add`, `catalyst functions:add`, `catalyst slate:create`, etc.). Run `catalyst init` first, then add a service.

**Agent boundary — what requires the user:**
- `catalyst appsail:add` is interactive (menu-driven) and cannot be driven fully autonomously; use the flags above to minimise prompts
- If the CLI stalls, route the user to Console → AppSail → Deploy from Console → Docker Image (requires image on a container registry: Docker Hub, AWS ECR, or GCP Artifact Registry)

> ℹ️ **If the frontend is on Slate:** configure CORS before the first test — Slate (`*.onslate.com`) and AppSail (`*.catalystappsail.com`) are on separate domains. Load `references/appsail-crossorigin.md` for the 2-step fix.

---

## Environment Variables

### Source of Truth Rules (Runtime-Confirmed)

**Initialized (linked) apps** — app is registered in `catalyst.json` and has `app-config.json`:
- `app-config.json` is the **single source of truth** on every `catalyst deploy appsail`
- On deploy: the runtime applies exactly what is in `env_variables` — Console-set vars are **replaced**
- **With any variables defined** in `env_variables`: Console-set vars not in the file are **wiped completely**
- **With `"env_variables": {}`** (empty): Console UI still shows vars, but they are **not applied to the runtime**
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

> ⚠️ **Avoid `CATALYST` in user-defined env var key names.** The AppSail runtime injects its own `CATALYST_*` system vars. User-defined keys with `CATALYST` in the name may conflict or be rejected — use `ZOHO_` prefix or a plain name. Runtime-confirmed system vars injected automatically: `X_ZOHO_CATALYST_LISTEN_PORT`, `X_ZOHO_CATALYST_ENVIRONMENT`, `X_ZOHO_CATALYST_RESOURCE_ID`, `X_ZOHO_CATALYST_RUNTIME_MEMORY`, `X_ZOHO_CATALYST_ACCOUNTS_URL`, `X_ZOHO_CATALYST_CONSOLE_URL`, `CATALYST_PROJECT_ID`, `CATALYST_MAX_TIMEOUT`, `CATALYST_USER_ENVIRONMENT`, `CATALYST_PROJECT_TIMEZONE`.

---

## Health Checks & Autoscaling

- Configure health check path: Console → AppSail → service → Configuration → Health Check
- Instances scale from 1 (min) to 5 (max)
- Scale-up at **80%** utilization threshold
- App must start listening on the port **within 10 seconds** of instance creation

---

## AppSail URL Pattern

```
Development: https://<service-name>-<ZAID>.development.catalystappsail.com
Production:  https://<service-name>-<ZAID>.catalystappsail.com
```

- **`<service-name>`**: the name you provided during init or deploy
- **`<ZAID>`**: the project's unique auth identifier (project-specific numeric value)

Example: `https://demoservice-<ZAID>.development.catalystappsail.com`

> ℹ️ AppSail always gets its own `catalystappsail.com` subdomain — separate from `*.catalystserverless.com` / `*.zohocatalyst.com`. This is why Slate frontends need CORS configured to call AppSail APIs (see `appsail-crossorigin.md`).

---

## AppSail Configurations

- **Instances**: 1–5 for auto-scaling
- **Memory**: 256–2048 MB per instance
- **Stacks**: `node24`, `node22`, `node20`, `node18`, `node16`, `node14`, `node12`, `java25`, `java21`, `java17`, `java11`, `java8`, `python_3_13`, `python_3_12`, `python_3_11`, `python_3_10` (managed runtimes only — Docker/container apps use `catalyst.json`, no `stack` field)

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `catalyst deploy appsail` stalls or prompts | No `--source` flag for Docker deploy, or `--build` omitted in `appsail:add` | For Docker: use `--name` and `--source docker://...`. For `appsail:add`: always include `--build ./` |
| `catalyst deploy appsail` ignores code changes | Ran without `--source` flag and no prior init — CLI prompted for config | Use standalone flags `--name`/`--source`, or run `catalyst appsail:add` interactively first |
| Managed runtime initialized instead of Docker Image | Selected wrong option in `catalyst appsail:add` interactive menu | Delete the AppSail entry from `catalyst.json`, then re-run `catalyst appsail:add` and select **Docker Image** |
| Runtime env var missing after CLI deploy (var was set in Console) | `app-config.json` redeploy replaces runtime env vars with exactly what's in `env_variables` — Console-set vars not in the file are wiped | Add ALL required vars to `app-config.json`; never rely on Console-only vars for linked services |
| Console UI shows env vars but runtime can't see them | `"env_variables": {}` is empty — Console UI preserves display values but does NOT apply them to the runtime | Add the vars to `env_variables` in `app-config.json` and redeploy |
| Env var key conflicts with system var | AppSail runtime injects its own `CATALYST_*` and `X_ZOHO_CATALYST_*` vars; user-defined keys with same name are overwritten | Avoid `CATALYST` in user-defined key names; use `ZOHO_` prefix or plain names |
| `catalyst.json` not found / deploy fails immediately | `catalyst init` does not create `catalyst.json` — only `.catalystrc` | Run a service command first: `catalyst appsail:add`, `catalyst functions:add`, or `catalyst slate:create` |
