---
name: catalyst-signals
description: "Catalyst Signals — event-driven architecture platform for near-instantaneous communication between decoupled applications. Supports Zoho publishers, Catalyst publishers, custom publishers, webhooks, functions, circuits, event filtering, transformation, batch/scheduled dispatch, and retry policies. Trigger on 'Signals', 'event bus', 'publisher', 'event-driven', 'webhook target', 'dispatch policy', 'event transformation', 'rule filter', or 'event ordering'. Console-only service — no SDK or programmatic API."
metadata:
  version: "2.0.0"
---

## Prerequisites

Before using Signals, activate it once per project in the console:
> Console → your project → **Signals** (left sidebar) → click **"Start Exploring"**

Skipping this step prevents access to Publishers, Webhooks, Rules, and Logs. This is a one-time activation per project.

---

## How It Works

1. **Console-Only Service — HARD STOP if user expects SDK/API.**
   Catalyst Signals is configured entirely through the Catalyst Console — there is NO SDK, REST API, or programmatic interface for creating publishers, rules, or webhooks. All setup is done via the console UI.
   - Publishers, events, webhooks, and rules are created in Console → Signals
   - Functions and Circuits are created separately in Console → Serverless, then selected as targets in Signals rules
   - The only code-level interaction is receiving events in target functions/circuits

2. **Understand the flow** — Publisher → Event → Rule (with filters/transforms) → Target (Webhook/Function/Circuit)
3. **Load `references/signals-basics.md`** — for publishers (Zoho/Catalyst/Custom), events, rules, targets, dispatch policies, event statuses, and deployment gotchas
4. **Key concepts:**
   - **Publishers** emit events when actions occur (3 types: Zoho, Catalyst CloudScale, Custom)
   - **Events** are JSON payloads with auto-generated schemas (max 100KB for Zoho, 64KB for Custom)
   - **Rules** connect publishers to targets with optional filters and payload transformations
   - **Targets** receive events via Webhooks, Functions, or Circuits
   - **Dispatch Policy** controls event delivery: One-Time (immediate), Scheduled (time-based), or Batching (count/size aggregation)

5. **Deployment warning** — Rules are locked in production (enable/disable only). All rule changes must be made in Development and deployed. Max 25 publishers per deployment.

## Security Checklist

- **Custom publisher REST API rate limit**: 500 requests per minute. Exceeding this locks the API URL for 60 seconds.
- **Environment-specific REST API URLs**: Custom event REST API URLs differ between Development and Production — update URLs when deploying.
- **Function/Circuit targets inherit their own permissions**: If a function is the target, it runs with whatever scope it was configured with (user or admin). Signals does not override function-level permissions.
- **Event payload size limits**: Zoho publishers max 100KB per event (5MB for multi-event batch). Custom publishers max 64KB per event (256KB for up to 25 events).

## Triggers

Use this skill for: "Signals", "Catalyst event bus", "event-driven architecture", "publisher", "Zoho publisher", "Catalyst publisher", "custom publisher", "event schema", "rule", "event filter", "event transformation", "webhook target", "dispatch policy", "one-time dispatch", "scheduled dispatch", "batch dispatch", "event ordering", "retry policy", "TTL", "event status", "Signals logs", "Signals dashboard", "deploy Signals", or "Signals console".

## References

| Reference | Load when the query is about… |
|-----------|-------------------------------|
| `references/signals-basics.md` | Publishers (Zoho/Catalyst/Custom), events and schemas, custom event REST API, rules and filters, targets (webhooks/functions/circuits), dispatch policies (One-Time/Scheduled/Batching), event transformation, retry policies, event ordering, event statuses, logs, dashboard, deployment limits, production restrictions |
