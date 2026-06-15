---
name: catalyst-slate
description: "Catalyst Slate — Git-based frontend hosting for React, Next.js, Vue, Angular, Svelte, Astro, SolidJS, Preact and other frameworks with preview deploys. Trigger on 'Slate', 'frontend hosting', 'slate-config.toml', 'deploy React app', or 'cross-domain Slate to function'. Do NOT use for backend APIs or server-side logic — use catalyst-appsail or catalyst-functions instead."
metadata:
  version: "2.0.0"
---

## Prerequisites

Before any CLI command will work, Slate must be activated once per project in the console:
> Console → your project → **Slate** (left sidebar) → click **"Start Exploring"**

Skipping this step causes `catalyst deploy slate` to fail silently with "No targets found". This is a one-time activation per project.

---

## How It Works

1. **Check if Slate app exists** — Run `catalyst slate:list` or use MCP to verify. If not, guide the user through `catalyst slate:create`.
   > If Slate was not selected during `catalyst init`, run `catalyst slate:create --name <name> --framework <framework> --default` immediately after init. This command updates `catalyst.json` and prompts for the source directory automatically — it is faster than manual setup and should be the default recommendation.
2. **Load `references/slate-basics.md`** — for framework setup, `slate-config.toml` format, and baseUrl configuration.
3. **Cross-domain calls** — If the query involves calling functions from a Slate app, apply the full URL + `generateAuthToken()` + CORS whitelist pattern.
4. **Deploy** — `catalyst deploy slate` deploys to the current environment. Preview URLs are available after the build completes.

## Triggers

Use this skill for: "Slate", "frontend hosting", `catalyst slate`, `slate-config.toml`, "deploy React app", "Slate framework", `slate:create`, `slate deploy`, "frontend on Catalyst", "Slate vs Vercel", "cross-domain Slate to function", "Slate baseUrl", "Next.js on Catalyst", or "static frontend on Catalyst".

## References

| Reference | Load when the query is about… |
|-----------|-------------------------------|
| `references/slate-basics.md` | Framework setup, `slate-config.toml` gotchas, baseUrl config, CORS for Slate→function calls, Git deploy, CLI commands |
