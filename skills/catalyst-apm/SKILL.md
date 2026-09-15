---
name: catalyst-apm
description: "Catalyst Application Performance Monitoring (APM) — enable function performance tracking and diagnose slow calls, response times, errors, and component traces. Use for 'APM dashboard empty', 'Python function missing from APM', 'slow Catalyst function', 'Top 100 Slowest Calls', or 'missing component trace'."
metadata:
  version: "2.0.0"
---

## How It Works

1. **Check coverage** — Establish the project, environment, data center, function type/runtime, and incident time before recommending APM or instrumentation.
2. **Load the reference** — Read `references/apm-basics.md` for supported functions, enablement, retention, and trace interpretation. Use its Logs link when APM cannot observe the workload.
3. **Check collection and filters** — Verify whether APM was enabled during the incident. Select the matching function/type and time window; missing data from disabled periods cannot be backfilled by re-enabling it.
4. **Inspect the slow execution** — Move from the dashboard to a specific execution, then its component trace. Distinguish SDK component calls from operations that APM does not trace.
5. **Verify an improvement** — Change code based on observed evidence and compare equivalent executions after the fix. Report measured durations and coverage gaps; do not claim that an empty trace proves no work occurred.

## Triggers

Use this skill for: "Catalyst APM", "Application Performance Monitoring", "APM dashboard empty", "Python function missing from APM", "slow Catalyst function", "Top 100 Slowest Calls", "response time", "component usage", or "missing component trace".

## References

| Reference | Load when the query is about… |
|-----------|-------------------------------|
| `references/apm-basics.md` | Runtime/DC coverage, collection gaps, dashboards, execution filtering, and SDK component traces |
