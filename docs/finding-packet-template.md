# Catalyst Finding Packet Template

Use this template to turn a messy agent session into a privacy-safe finding. Do not paste raw transcripts, project IDs, tokens, hosted URLs, or private customer data.

## Packet Metadata

- `packet_id`:
- `date_observed`:
- `observer`:
- `source_type`: `agent_session` | `project_runbook` | `terminal_log` | `manual_repro` | `meeting_notes`
- `related_gotchas`:
- `privacy_level`: `sanitized` | `internal_only` | `private_source_only`

## Builder Intent

What was the agent or human trying to do?

```text
Example: Deploy a Docker-based AppSail app and verify the hosted endpoint.
```

## Failure Reconstruction

- `step_that_failed`:
- `tool_or_surface`: `Catalyst CLI` | `Catalyst MCP` | `SDK` | `Console` | `AppSail runtime` | `Data Store` | `Stratus` | `Slate`
- `observed_symptom`:
- `error_signature`:
- `duration_or_retry_pattern`:
- `first_visible_bad_assumption`:

## Wrong Agent Assumption

Describe the model behavior that made the failure worse.

```text
Example: The agent treated a silent CLI hang as a long-running deploy and retried the same command.
```

## Actual Catalyst Behavior

Describe the observed platform behavior without overgeneralizing beyond the evidence.

```text
Example: In this environment, AppSail CLI paths hung under the active Node/CLI pairing until the agent switched strategy.
```

## Evidence

Use the smallest privacy-safe evidence excerpt possible.

```text
Sanitized command or symptom excerpt here. Replace project IDs, org names, tokens, URLs, and private paths with placeholders.
```

## Triage

- `finding_class`: `product_bug` | `docs_ambiguity` | `cli_sdk_issue` | `product_limitation` | `skill_gap` | `workflow_trap` | `skill_drift` | `project_local`
- `owner`: `product` | `docs` | `first_party_skill` | `local_runbook` | `unknown`
- `mitigation_type`: `temporary_skill_guardrail` | `permanent_skill_guidance` | `product_fix_needed` | `docs_fix_needed` | `local_only`
- `confidence`: `verified` | `verified_project_skill` | `verified_local_skill` | `architecture_note_evidence` | `needs_verification`
- `recommended_next_action`:

## Proposed Outputs

- Product issue:
- Docs issue:
- First-party skill patch:
- Eval case:
- Local runbook update:

## Expiration Rule

If this is a temporary skill guardrail, describe what product/docs/CLI/SDK change would make the guardrail removable.
