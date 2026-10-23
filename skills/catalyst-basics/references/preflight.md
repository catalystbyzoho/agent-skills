# Workspace Readiness Gate (Pre-flight)

> **Single source of truth.** This is the ONE authoritative readiness sequence for working on a
> Catalyst project. Every skill and reference links here instead of restating the steps — if the
> logic changes, change it *here only*. Do not duplicate these steps elsewhere.
>
> **Lives in `catalyst-basics`** because readiness is a foundational, cross-cutting concern — it
> spans the CLI (`.catalystrc`), the MCP connection, and the active environment. MCP, DataStore,
> Functions, etc. are *consumers* of this gate, not its owner.

**Purpose:** before doing real work, establish a **known-good, reconciled development context** —

1. the active **org** and **project** are resolved,
2. the local **CLI** (`.catalystrc`) and the **MCP** connection are pointed at the *same* org/project, and
3. the active **environment** (Development vs Production) is identified so operations carry the right level of caution.

A mismatch — MCP authorized against org A while `.catalystrc` targets org B — silently sends
operations to the wrong place; this gate catches it up front.

> **🔒 GOLDEN RULE — NEVER ASSUME THE ORG OR PROJECT.** The org and project must always be
> *resolved from an authoritative source* (`.catalystrc`, or an MCP list the user has confirmed) —
> never guessed, never inferred from the directory name, a previous session, a similarly named
> project, or "the only one that showed up." **A single org or a single project in the MCP list is
> not permission to auto-select it** — confirm it with the user first. If the org/project cannot be
> resolved *and confirmed*, **STOP and ask the user which project (and org) to work in** before
> running any CLI command, calling any MCP resource tool, scaffolding, or deploying. When in doubt,
> ask — silently picking the wrong project sends real operations to the wrong place. This rule
> overrides the general "prefer MCP over asking" default: that default applies to *resource* IDs
> (table IDs, ZAIDs, bucket names), never to the choice of org/project itself.

> **Run this once per session, not before every operation.** The gate establishes a known-good
> context; once it passes, trust it for the rest of the session and operate freely. Re-run it only
> if the context could have changed — the user switches org/project/DC, `.catalystrc` changes, or an
> MCP call returns a context error (e.g. `PERMISSION_NEEDED`). Re-verifying before every call wastes
> tokens: each `Get_Project_By_Id` request and its response persist in the context window and are
> re-processed on every following turn.

---

## Step 0 — MCP connectivity

Confirm the `ZohoMCP_*` **meta-tools** are present in the tool list — `ZohoMCP_getSchema`,
`ZohoMCP_executeTool`, `ZohoMCP_listTools`, `ZohoMCP_getFeatures`. Their presence is the "MCP is
connected" signal. (The `CatalystbyZoho_*` names are **not** shown as tools — they are `tool_name`
values you pass to `ZohoMCP_executeTool`; see `../../catalyst-zoho-mcp/references/zoho-mcp.md` →
"How to Call Tools Correctly".) If the `ZohoMCP_*` meta-tools are absent → **STOP**, do not
scaffold code or run CLI commands. Guide the user through MCP setup (see
`../../catalyst-zoho-mcp/references/zoho-mcp.md`) and resume only once they appear.

> **Confirm the data center (DC) once — before the first MCP call.** Data centers are isolated: a
> session connected to the wrong DC sees a *different* set of orgs/projects and silently operates on
> the wrong account. So before your first `CatalystbyZoho_*` operation, **ask the user to confirm the
> DC** their Zoho account lives in (US, EU, IN, AU, CA, SA, JP, or UAE) and that the MCP server is
> connected to that DC. Ask this only **once per session**; once confirmed, trust it for the rest of
> the session and do not re-ask before every call. If the user says the connected DC is wrong, do not
> proceed — switch it first (see `../../catalyst-zoho-mcp/references/dc-switching.md`), then resume.

---

## Step 1 — Establish + verify org / project

### If `.catalystrc` is present (CLI-initialized workspace)

`.catalystrc` is CLI-generated and holds the authoritative local context. Read the **active**
entries (use `actives.project` / `actives.env` — 1-based `idx` — falling back to the first entry):

| Value | Path in `.catalystrc` |
|-------|-----------------------|
| **Org ID** | `projects[].env[].id` |
| **Project ID** | `projects[].id` |
| **Environment** | `projects[].env[].name` (and `type`) |
| **Domain** | `projects[].domain.name` |

**Then reconcile with MCP** — call the get-project-by-id tool (`CatalystbyZoho_Get_Project_By_Id`)
with the project ID and org read from `.catalystrc`:

- ✅ **Returns the project** → the CLI and the MCP account agree. Context is ready; use this
  org/project as the baseline for the whole session. Do **not** additionally run
  `List_All_Organizations` / `List_All_Projects` just to establish context.
- ❌ **Not found / `PERMISSION_NEEDED`** → the MCP-connected account cannot see the org/project the
  CLI is configured for. **STOP and surface it to the user** — state the org ID and project ID from
  `.catalystrc` and explain the MCP connection is on a different org/account/DC. Ask them to either
  reconnect MCP to the matching org (see `../../catalyst-zoho-mcp/references/dc-switching.md`) or
  re-init the CLI against the MCP's org. Do **not** silently fall back to `List_All_Projects` and
  operate on a different project.

> If the exact tool name/arguments differ in the connected server, discover them first with
> `ZohoMCP_getSchema` (see `../../catalyst-zoho-mcp/references/zoho-mcp.md` → "always getSchema
> before executeTool"), then call it.

### If `.catalystrc` is absent

There is no local context to reconcile — the workspace is **not yet initialized against a project**.
Resolve org/project from MCP, but **resolve is not the same as assume** (see the Golden Rule above):

1. `CatalystbyZoho_List_All_Organizations` → list the orgs.
   - **0 orgs** → the connected account has no org. **STOP** and tell the user; do not proceed.
   - **1 org** → state it and use it (a lone org is unambiguous, so this is resolution, not
     assumption). Still surface which org you're using so the user can correct it.
   - **2+ orgs** → **ask the user which org**. Never pick one yourself.
2. `CatalystbyZoho_List_All_Projects` (with the chosen org) → list the projects.
   - **0 projects** → there is nothing to work in. **STOP and ask the user** to name the project to
     create/target (NI-mode `catalyst init` can only *link an existing* project — if none exists,
     the user must create one in the console first, then come back). **Do not scaffold, deploy, or
     `catalyst init` against a made-up or assumed project.**
   - **1 project** → **do NOT auto-select it.** State the project you found and ask the user to
     confirm it's the one to work in before proceeding.
   - **2+ projects** → **ask the user which project.** Never pick one yourself.
3. Only after the org and project are resolved **and confirmed with the user** may you run
   `catalyst init --org <orgId> -p <projectId> -ni` (get the IDs from the confirmed MCP result,
   never hand-authored) and begin work.

> The bar is deliberately higher here than in the `.catalystrc`-present branch: with `.catalystrc`
> the user has *already* committed to a project, so it is authoritative. With no `.catalystrc` there
> is no committed choice — so the choice is the user's to make, not yours to assume.

---

## Step 2 — Environment awareness

Catalyst has three environments — **Local** (the dev machine), **Development** (remote sandbox),
and **Production** (remote, live). Note the active *remote* environment from Step 1 (`.catalystrc`
records Development or Production — never Local) and carry it through the session:

- **Local** — your machine, via `catalyst serve`. Runs Functions/AppSail/Slate locally; managed-service
  calls (Data Store, Stratus, etc.) proxy to **Development**, so local reads/writes hit Development data.
  Serve + test here before any deploy (local-first loop: `project-basics.md` → **Environments**).
- **Development** — the normal remote sandbox; safe for iteration. `catalyst deploy` targets it by default.
- **Production** — writes, deletes, and schema changes hit **live** resources, may be irreversible,
  and may incur billing. Reached only by migrating validated Development changes up — resources are not
  created directly here. Before any destructive or write operation in Production, **explicitly
  confirm with the user**, name the exact resource and environment, and warn that the change is live.

---

## Step 3 — Verify resource access, then operate

Before write operations, confirm access to the specific resource type (e.g.
`CatalystbyZoho_List_All_Tables` before any DataStore create/update), then proceed with
create/update/query operations, passing the confirmed org and project context.

---

## How this pairs with the SessionStart context hook

The hook (`hooks/catalyst-context.js`) and this gate are two layers of the same readiness concern,
and they hand off cleanly:

| | **SessionStart hook** | **Readiness gate (this file)** |
|---|---|---|
| When | Once, at session start | Once per session, before the first MCP operation (re-run only if context changes) |
| Cost | Zero tool calls, no network | Makes MCP calls |
| Can it verify? | **No** — hooks cannot call MCP; it only *reads* `.catalystrc` | **Yes** — runs the `Get_Project_By_Id` reconciliation |
| Delivers | The org/project/env **facts** + a live-resource / Production **safety banner** | The **verification** + fallback resolution |

- The hook **primes**: it reads `.catalystrc` and injects the org/project/environment up front (so
  this gate does not re-derive them) and raises the Production warning immediately. Its injected
  text points the model here to complete the reconciliation before mutating.
- This gate **verifies**: it performs the `Get_Project_By_Id` parity check the hook cannot, and
  resolves context from MCP when `.catalystrc` is absent.
- **The gate does not depend on the hook.** When the hook is disabled, this gate still reads
  `.catalystrc` itself — the hook only makes the facts and the risk banner appear instantly and
  deterministically rather than relying on the model to fetch them.

---

## Why there is no separate AI-managed cache

`.catalystrc` **is** the cache of org/project context, and it is owned by the CLI: it is written by
`catalyst init … -ni` and refreshed by `catalyst init --force -ni`, `catalyst project:use … -ni`, and org/env
switches. Because the CLI regenerates it, there is nothing for the AI to invalidate — and no risk of
a stale hand-maintained copy drifting after an org switch, project deletion, credential change, or DC
change. Step 1's `Get_Project_By_Id` reconciliation is the per-session freshness check: if
`.catalystrc` points at something the MCP account can no longer reach, that call fails and forces
reconciliation. Do **not** introduce a separate cache file (e.g. `.catalyst-ai.json`) — it would
reintroduce exactly the invalidation problem that using `.catalystrc` avoids.
