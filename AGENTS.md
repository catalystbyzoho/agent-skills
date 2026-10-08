# Contributing to catalyst-skills

This guide explains how to create, extend, and maintain agent skills for Catalyst by Zoho. Read this before submitting a PR.

---

## Repository layout

```
skills/
  SKILL.md                          ← routing layer (do not add technical content here)
  {catalyst-service}/
    SKILL.md                        ← thin entry point: frontmatter + workflow + triggers + references table
    references/
      {topic}.md                    ← detailed technical content loaded on demand
```

The routing `skills/catalyst-by-zoho/SKILL.md` routes queries to service-level skills. Service skills route to reference files. **Never inline detailed technical content in a SKILL.md** — it gets loaded on every match and bloats the context window.

---

## How Skills Load (3-Tier Model)

Every agent interaction with skills goes through three loading stages:

| Tier | What loads | When |
|------|-----------|------|
| **1 — Metadata** | YAML frontmatter only (`name`, `description`, `metadata`) | Always — for every skill in the registry, on every request |
| **2 — Body** | Full SKILL.md markdown (How It Works, Triggers, Security Checklist, References table) | Only when the skill's `description` matches the user query |
| **3 — References** | Individual `references/*.md` files | Only when a step in How It Works explicitly loads one |

**Critical implication:** The `description` field is the ONLY content available at routing time. Every product name, symptom phrase, error term, and common entry point that should trigger this skill MUST appear in the description. The `## Triggers` section in the body is the fallback for agents that read the full SKILL.md, but it does not help with initial routing.

**Do not put trigger context only in the body.** If a user asks about `busboy` and `busboy` is not in the description, the skill won't trigger — even if it's in `## Triggers`.

---

## SKILL.md format

Every `skills/{service}/SKILL.md` must follow this structure exactly:

```markdown
---
name: catalyst-{service}
description: "One or two sentences. Include quoted trigger phrases like 'deploy my app', 'create a table', 'upload a file'."
metadata:
  version: "2.0.0"
---

## How It Works

1. Numbered step — what the agent checks or decides first.
2. Numbered step — which reference file to load and why.
3. Numbered step — key rule or gotcha to apply.
(3–5 steps total)

## Triggers

Use this skill for: "trigger phrase one", "trigger phrase two", `code-term`, or "another phrase".

## References

| Reference | Load when the query is about… |
|-----------|-------------------------------|
| `references/{file}.md` | What this file covers |
```

### Rules

- **`description`** — 1–3 sentences. Must contain the service name AND maximize coverage: every major product name, common symptom phrase, SDK method name, and error term that should trigger this skill. Agents use this field for routing — it is the only content loaded at selection time. Aim for 250–500 chars. Do NOT rely on `## Triggers` in the body for routing coverage.
- **`metadata.version`** — semver, one bump per skill per PR. See [Versioning](#versioning) for which level applies.
- **`## How It Works`** — 3–5 numbered steps. Describes the agent's decision flow, not the service documentation. Focus on: what to check first, which file to load, what gotcha to apply.
- **`## Triggers`** — exhaustive list of phrases that should route here. Use backticks for code terms, quotes for natural-language phrases.
- **`## References`** — table only. One row per reference file. Load files lazily — only when the relevant step in How It Works is reached.
- **500-line limit** — keep `SKILL.md` under 500 lines total. If you're going over, move content to a reference file.

---

## Reference file format

Reference files in `references/` contain the actual technical content. No YAML frontmatter. Use plain Markdown.

### Required sections (in order)

```markdown
# {Topic Title}

Brief one-line intro.

## {Main Content Section}

...SDK examples, API signatures, config options...

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `ErrorName` | Why it happens | How to fix it |
```

- **`## Common Errors`** — every reference file must end with this section. Use a table for structured error/fix pairs. This is the standardized heading — do not use "Troubleshooting", "Gotchas", or "Known Issues".
- Code examples must be complete and runnable — no `// TODO` or `...` placeholders.
- Include both Node.js and Python examples where the SDK supports both platforms.

---

## Naming conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Skill directory | `catalyst-{service}` | `catalyst-datastore` |
| SKILL.md `name` field | matches directory | `catalyst-datastore` |
| Reference files | `{topic}-basics.md` or `{topic}-advanced.md` | `datastore-basics.md` |
| New service additions | lowercase, hyphenated | `catalyst-circuits` |

---

## Adding a new service skill

1. Create `skills/catalyst-{service}/SKILL.md` following the format above.
2. Create `skills/catalyst-{service}/references/{service}-basics.md` with the core technical content.
3. Add a row to the routing table in `skills/catalyst-by-zoho/SKILL.md`.
4. Set `metadata.version: "2.0.0"` (the repo major version — see [Versioning](#versioning)).
5. Update `README.md` to list the new skill.

---

## Versioning

Every skill carries its own semver in `metadata.version` (`MAJOR.MINOR.PATCH`). Versions are per skill: a change to one skill never bumps another skill unless that skill's files also changed.

### Rules

1. **Compare against `main`, not your last commit.** The version on `main` is the baseline. A PR bumps each changed skill **once**, at the highest level that applies across all of its changes in that PR. Adding more commits to an open PR does not add another bump unless the level goes up (then recompute from `main`).
2. **Every changed skill gets a bump.** If any file under `skills/{skill}/` changes, that skill's `SKILL.md` version must change in the same PR.
3. **Versions only go up.** A revert is a new change: bump forward (usually PATCH), never back to the old number.
4. **New skills start at the repo major**, `X.0.0`, where `X` is the major version in `.claude-plugin/plugin.json` (currently `2.0.0`). Never `0.x` or `1.x`.
5. **Skill majors are independent of the repo major.** A skill at `3.0.0` does not change the starting version for new skills; that only changes when the plugin itself goes to a new major.

### Which level

| Level | When | Examples |
|-------|------|----------|
| **PATCH** `2.0.x` | Content is corrected or clarified; what the skill covers and how it routes stays the same | Wrong SDK method fixed, outdated limit updated, broken link fixed, typo, wording, extra synonym added to `description` |
| **MINOR** `2.x.0` | The skill gains coverage or its internal structure changes, but every query that routed here before still routes here | New reference file, new section in `SKILL.md`, reference file renamed or split (with the `## References` table updated), new topic added to `description` / `## Triggers` |
| **MAJOR** `x.0.0` | A query that used to be answered by this skill no longer is, or the skill's identity changes | Skill renamed or removed, a topic or reference moved out to another skill, triggers removed, reference deleted with no replacement |

### Cases

| Case | What to do |
|------|------------|
| Topic split out into a **new** skill | New skill starts at `X.0.0`. Source skill gets MAJOR (it lost coverage). Router gets MINOR (new row). |
| Topic moved into an **existing** skill | Source skill MAJOR, destination skill MINOR. |
| Two skills merged | Surviving skill MAJOR. Removed skill's row deleted from the router; router MAJOR. |
| Router (`skills/catalyst-by-zoho/SKILL.md`) | PATCH for content, MINOR when a skill row is added, MAJOR when a skill is removed or renamed. |
| Same fix applied across many skills | Bump each affected skill separately (usually PATCH each). |
| Two open PRs touch the same skill | Each bumps from `main`. The one that merges second rebases and bumps again from the new `main` value — a conflict on the `version:` line is expected; resolve it by re-bumping, never by keeping either side as-is. |
| Changes only outside `skills/` | No skill bump: evals, `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, CI, plugin manifests. |
| Plugin manifests (`.claude-plugin/plugin.json`, `.cursor-plugin/plugin.json`, `gemini-extension.json`) | Bumped by the maintainer at release time, all three to the same value: PATCH if only skill PATCHes shipped, MINOR if any skill was added or got MINOR/MAJOR, MAJOR only for a breaking plugin-level change (install layout, skill removed or renamed). |

### Check before opening a PR

```bash
scripts/check-versions.sh catalystbyzoho/main   # or origin/main when origin is the upstream repo
```

It lists every changed skill with its old and new version and fails if a changed skill was not bumped, a version went down, or a new skill does not start at `X.0.0`.

---

## What not to do

- Do not add technical content (code, API signatures, config options) directly to `SKILL.md`. Put it in a reference file.
- Do not create reference files that duplicate content already in another service's references. Cross-link instead.
- Do not use the headings "Troubleshooting", "Gotchas", or "Known Issues" — use `## Common Errors`.
- Do not skip the `## How It Works` section. Agents rely on it for decision flow.
- Do not set `version: "1.0.0"` on new skills — inherit the current repo version (`2.0.0`).
- Do not use decorative emoji in headings or prose. Only two uses are allowed: `⚠️` for inline warning callouts, and `✅`/`❌` as Yes/No cells in availability tables. Literal CLI output quoted in a code block is left verbatim.

---

## Source of truth

- Public docs: https://docs.catalyst.zoho.com/en/llms.txt (markdown index of every docs page; append `index.md` to any page URL to fetch it as markdown)
- This repo: https://github.com/catalystbyzoho/agent-skills
