# Catalyst Agent Skill Evals

Lightweight eval cases for checking whether skill changes improve **agent behavior** (not just documentation completeness).

## Running a spot check

1. Load the updated Catalyst skill in your agent (Cursor, Claude Code, Codex, etc.).
2. Pick a case from `appsail-agent-success.json`.
3. Send the case `prompt` without hinting at the expected recovery path.
4. Compare agent behavior to `expected_behavior` vs `failure_behavior`.
5. Pass when the agent matches `pass_signal`.

## Adding cases

Add JSON cases with:

- a realistic user prompt,
- explicit expected and failure behavior lists,
- a one-line `pass_signal` for quick review.

Prefer AppSail and deploy/debug scenarios first — they produce the highest agent time-loss when wrong.

## Linking to skill PRs

Reference eval case IDs (e.g. `APPSAIL-E001`) in PR descriptions when claiming a guardrail improves agent outcomes.
