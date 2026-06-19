# Platform Limits (Agent Quick Reference)

Verified limits agents should design around. See official docs for authoritative quotas.

| Area | Limit | Agent guardrail |
|------|-------|-----------------|
| **AppSail request time** | Hosted requests can timeout on cold/heavy work | Move heavy work to build time or background jobs; verify hosted behavior |
| **AppSail env keys** | `CATALYST_*` prefixes reserved / conflict-prone | Use neutral app-specific prefixes |
| **Job functions** | ~15 min scheduled/Console run; API immediate jobs often ~60s | Chunk backfills; prefer scheduled jobs for large drains |
| **ZCQL SELECT** | 300 rows per query; max 20 columns | Paginate with `LIMIT offset, count`; name explicit columns |
| **Data Store Text** | 10,000 characters per Text column | Store large payloads in Stratus or split tables |
| **Development auth users** | 25 users in Development | Plan Production for larger user counts |

When a limit blocks the design, file an issue with repro steps rather than guessing workarounds.
