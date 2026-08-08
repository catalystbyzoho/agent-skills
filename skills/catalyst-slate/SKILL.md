---
name: catalyst-slate
description: "Catalyst Slate — Git-based frontend hosting for React, Next.js, Vue, Angular, Svelte, Astro, SolidJS, Preact and other frameworks with preview deploys. Trigger on 'Slate', 'frontend hosting', 'slate-config.toml', 'deploy React app', or 'cross-domain Slate to function'. Do NOT use for backend APIs or server-side logic — use catalyst-appsail or catalyst-functions instead."
metadata:
  version: "2.0.1"
---

> **⚠️ PRE-FLIGHT CHECK — Slate activation (one-time, per project):**
> Before any Slate command, confirm Slate is activated in the console.
> Open the Catalyst console → your project → **Slate** (left sidebar) → click **Start Exploring**.
> This is a one-time step. Skipping it means `catalyst deploy slate` fails with `HTTP 400` even though `slate:create` succeeds locally.

## How It Works

1. **Check if Slate is activated** — Use MCP: call `CatalystbyZoho_List_All_Slate_Apps` with the project ID.
   - **If it returns apps or an empty list** → Slate is activated. Proceed.
   - **If it returns `INVALID_URL_PATTERN`** → Slate is not yet activated. This is NOT an MCP bug — it means the service needs a one-time console activation. Tell the user:
     > "Please open the Catalyst console, go to your project → Slate (left sidebar) → click **Start Exploring**. This is a one-time step that takes 5 seconds. Let me know when done and I'll continue."
     Wait for confirmation, then proceed.
   - **Never fall back to Web Client (legacy) because Slate isn't activated yet.** Web Client is deprecated — Slate is always the right choice for frontend hosting. The one-time activation is not a reason to change the approach.
   > If Slate was not selected during `catalyst init`, run `catalyst slate:create --name <name> --framework <framework> --default` immediately after init. This command updates `catalyst.json` and prompts for the source directory automatically — it is faster than manual setup and should be the default recommendation.
2. **Check if Slate app exists** — If no app exists yet, run `catalyst slate:create --name <name> --framework <framework> -ni` to scaffold one. If Slate was not selected during `catalyst init`, run this immediately after init.
3. **Load `references/slate-basics.md`** — for framework setup, `slate-config.toml` format, and baseUrl configuration.
4. **Cross-domain calls** — If the query involves calling functions from a Slate app, apply the full URL + `generateAuthToken()` + CORS whitelist pattern.
   > ⚠️ **Migrating from basic client hosting?** Relative paths like `/server/fn/execute` that worked in basic client **silently break on Slate** — Slate is served from `*.onslate.com` while functions are on `*.catalystserverless.com`. Every function call must become an absolute URL. Find and replace all relative `/server/...` paths with the full `https://<project>.catalystserverless.com/server/...` URL and add `generateAuthToken()` headers.
5. **Deploy** — Before deploying, confirm Slate is activated in the console (Console → Slate). `slate:create` runs locally and succeeds without activation — the first backend call happens at deploy time, which fails with `HTTP 400: Please access the Slate service in your project's console before deploying` if not activated. Once confirmed: `catalyst deploy slate <name> -ni` deploys to the current environment. Preview URLs are available after the build completes.

## Triggers

Use this skill for: "Slate", "frontend hosting", `catalyst slate`, `slate-config.toml`, "deploy React app", "Slate framework", `slate:create`, `slate deploy`, "frontend on Catalyst", "Slate vs Vercel", "cross-domain Slate to function", "Slate baseUrl", "Next.js on Catalyst", or "static frontend on Catalyst".

## References

| Reference | Load when the query is about… |
|-----------|-------------------------------|
| `references/slate-basics.md` | Framework setup, `slate-config.toml` gotchas, baseUrl config, CORS for Slate→function calls, Git deploy, CLI commands |
