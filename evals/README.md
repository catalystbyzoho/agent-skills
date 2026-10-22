# Catalyst Agent Skill Evals

Runnable eval cases for checking whether skill changes improve **agent behavior** (not just documentation completeness). Cases run with `claude plugin eval`, which scores each case with an LLM grader and can compare runs **with vs. without** the plugin loaded.

## Layout

Each case is a directory:

```
evals/
├── <skill>-<case-name>/
│   ├── prompt.md            ← frontmatter (max_turns, allowed_tools, tags) + the user prompt
│   └── graders/
│       └── criteria.md      ← frontmatter (type: llm, weight) + pass/fail criteria
└── results/                 ← run reports (gitignored)
```

Case directories are prefixed with the skill they exercise (`appsail-`, `job-scheduling-`, …) and carry a matching `tags:` entry so one skill's suite can be run alone.

## Running

```bash
# Pilot a single case cheaply (1 run instead of the default 3)
claude plugin eval . --case 'appsail-*' --runs 1

# One skill's suite by tag
claude plugin eval . --tag appsail --runs 1

# Full run with the with/without-plugin comparison (measures the skill's real effect)
claude plugin eval . --ablation with-without
```

Each agent run costs real tokens (typically $0.3–0.8/run). Pilot with `--runs 1` before a full run. The report (scores, prompts, grader verdicts) is written to `evals/results/<timestamp>/report.html`.

## Writing good cases

- **First-person, realistic prompts** — write what a user would actually type, and never hint at the expected recovery path.
- **Target skill-only knowledge** — facts that are runtime-verified, counterintuitive, or absent from public docs. If the base model already answers correctly without the skill (ablation delta = 0), the case tests the model, not the skill — rewrite or drop it.
- **Graders state both directions** — one paragraph describing what a successful response contains, and an explicit "Fail the response if …" paragraph naming the failure behaviors.
- Prefer deploy/debug scenarios — they produce the highest agent time-loss when wrong.

## Linking to skill PRs

Reference case names (e.g. `appsail-env-vars-wiped-on-deploy`) in PR descriptions when claiming a change improves agent outcomes, and include the eval scores.
