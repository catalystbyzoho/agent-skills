# AppSail CLI Hang And Environment Ambiguity Packet

## Packet Metadata

- `packet_id`: `appsail-cli-hang-env-ambiguity-2026-06-05`
- `date_observed`: `2026-06-05`
- `observer`: `Tejas Gadhia`
- `source_type`: `project_runbook`
- `related_gotchas`: `CAT-G001`, `CAT-G008`, `CAT-G009`, `CAT-G031`
- `related_evals`: `APPSAIL-E001`, `APPSAIL-E004`
- `privacy_level`: `sanitized`

## Builder Intent

Deploy a Docker-based AppSail app and verify that the hosted runtime is usable.

## Failure Reconstruction

- `step_that_failed`: AppSail deploy and follow-up environment configuration.
- `tool_or_surface`: `Catalyst CLI`, `AppSail runtime`
- `observed_symptom`: CLI paths produced no useful output or appeared to hang; environment updates rejected reserved names; deploy/config behavior made environment state uncertain.
- `error_signature`: Silent CLI hang, reserved environment key rejection, and surprising post-deploy environment state.
- `duration_or_retry_pattern`: Agent risk is waiting indefinitely or retrying the same command without new evidence.
- `first_visible_bad_assumption`: Green deploy output or a quiet CLI path means the AppSail workflow is still progressing safely.

## Wrong Agent Assumption

The agent treats a silent AppSail CLI path as a long-running deploy, retries the same command, then turns uncertain environment behavior into permanent skill guidance.

## Actual Catalyst Behavior

Local AppSail evidence shows agents need two separate responses:

- For CLI hangs, stop after a short bounded timeout, record runtime and CLI context, and switch recovery strategy instead of repeating the same command.
- For AppSail environment behavior, do not hard-code final rules yet. Existing evidence indicates reserved-name and source-of-truth ambiguity that needs product/docs confirmation before becoming permanent first-party skill wording.

## Evidence

Sanitized source summary:

```text
Source: sanitized AppSail deployment evidence packet
Scope: Docker-based AppSail deployment

F01: deploy appsail silent hang, 0% CPU, no stdout
F07: AppSail env update rejected
F08: Env vars disappear after deploy
F11: catalyst deploy or --version hangs again
```

Supporting artifacts:

- [`reports/catalyst-finding-triage.md`](../reports/catalyst-finding-triage.md)

## Triage

- `finding_class`: `cli_sdk_issue`, `docs_ambiguity`
- `owner`: `product`, `docs`
- `mitigation_type`: `temporary_skill_guardrail`, `docs_fix_needed`
- `confidence`: `verified` for CLI hang and reserved-name rejection; `needs_verification` for final AppSail environment source-of-truth behavior.
- `recommended_next_action`: File the AppSail environment clarification issue before landing permanent first-party skill wording. Keep CLI hang guidance temporary and explicitly retire it if CLI behavior improves.

## Proposed Outputs

- Product/docs issue: [`upstream/issues/appsail-env-behavior.md`](../upstream/issues/appsail-env-behavior.md)
- First-party skill patch draft: [`upstream/prs/appsail-troubleshooting.md`](../upstream/prs/appsail-troubleshooting.md)
- Eval cases: [`APPSAIL-E001`, `APPSAIL-E004`](../evals/appsail-agent-success.json)
- Catalyst-team pitch context: [`docs/catalyst-team-offering.md`](../docs/catalyst-team-offering.md)
- Local runbook update: none. Keep source-specific IDs, URLs, and raw transcripts out of this packet.

## Expiration Rule

The CLI hang guardrail should be removed or softened when Catalyst CLI behavior gives agents a bounded failure, clear progress output, or documented non-interactive recovery path.

The environment guardrail should become permanent only after Catalyst confirms AppSail environment variable source-of-truth behavior, merge/replace semantics, and reserved key names.
