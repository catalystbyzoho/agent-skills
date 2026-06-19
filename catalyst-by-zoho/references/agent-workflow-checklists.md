# Agent Workflow Checklists

Procedure, not surprise. Follow these before escalating to issue filing.

---

## Universal Preflight (every Catalyst session)

- [ ] Confirm project ID, org ID, DC, environment name with user
- [ ] If repo has deploy wrapper → use it, not raw `catalyst deploy`
- [ ] After any deploy → read output for every expected component name
- [ ] Timeout silent CLI after ~60s; close stdin with `</dev/null` if non-interactive

---

## Deploy Functions

- [ ] `catalyst.json` has `functions` section with correct targets
- [ ] Each function dir has required manifests (`package.json` for Node even if zero deps)
- [ ] Complete env in `catalyst-config.json` — Console secrets may be wiped on deploy
- [ ] Shared files copied/synced to every function package
- [ ] Pin Python SDK to stack-compatible version
- [ ] New function? Cloud-register via `functions:add` before editing targets
- [ ] Never `functions:add --overwrite` without backup and explicit approval

---

## Job Function Development

- [ ] Call `close_with_success()` / `close_with_failure()` in all paths
- [ ] Python Job: `_ = dir(context)` before `initialize()` if headers empty
- [ ] DataStore: admin scope / ZCQL — not USER table methods
- [ ] Updates in Job? → ZCQL UPDATE if PUT hangs
- [ ] Large reads? → Bulk Read, not 300-row loops inside 15 min
- [ ] Chunk work under 15 min; avoid API immediate jobs for long drains
- [ ] Local test? → `rm -rf .build` before `functions:execute`
- [ ] Verify scheduled/remote run, not only local execute

---

## AppSail Deploy

- [ ] Run frontend/build step — dist/public must exist
- [ ] Bind port from `X_ZOHO_CATALYST_LISTEN_PORT`
- [ ] OAuth on same domain as app, or inside AppSail
- [ ] Debug crashes → Console AppSail logs, not MCP alone
- [ ] Docker on Mac? → check Colima socket (`ZC_DOCKER_SOCK_PATH`)
- [ ] Post-deploy: hit hosted URL + one real route before declaring success

---

## Data Store / ZCQL

- [ ] Paginate anything that could exceed 300 rows per SELECT
- [ ] SELECT explicit columns — max 20 per ZCQL query
- [ ] Text columns ≤ 10,000 characters
- [ ] Smoke-test single-row CRUD before bulk seed/reset

---

## OAuth Setup

- [ ] Callback URL identical in env, auth URL, and Console
- [ ] SESSION_SECRET identical across functions sharing cookies
- [ ] DC env vars set before SDK import when required
- [ ] `initialize(req)` in handlers; explicit app init outside handlers
- [ ] ZAID from correct environment (Dev ≠ Prod)

---

## Advanced I/O with App Secrets

- [ ] Do not use `Authorization: Bearer` for app-level auth
- [ ] Use custom header e.g. `X-App-Token`
