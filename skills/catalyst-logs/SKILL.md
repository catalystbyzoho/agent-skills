---
name: catalyst-logs
description: "Catalyst Logs — inspect Access Logs and Application Logs, instrument Node.js/Python functions, and diagnose missing logs or empty Get_Logs results. Use for 'function logs missing', 'find an execution', 'log level', 'log retention', 'AppSail logs', context.log, console.warn, or CatalystbyZoho_Get_Logs."
metadata:
  version: "2.0.0"
---

## How It Works

1. **Locate the execution** — Establish the project, environment, function or AppSail service, invocation time/time zone, runtime, and available execution ID.
2. **Load the reference** — Read `references/logs-basics.md` for view selection, filters, retention, and runtime logging. Follow its AppSail link only for AppSail-specific diagnosis.
3. **Query the right layer** — Choose Access for request/response metadata or Application for code output. Inspect the actual MCP schema before using `CatalystbyZoho_Get_Logs`; do not guess its filter shape.
4. **Resolve missing evidence** — Check resource, time range, severity, retention, and indexing delay before concluding that nothing ran. If instrumentation is needed, add small structured messages using the runtime's supported logger.
5. **Verify and report** — Correlate the observed log with the intended invocation and behavior. Report the filters used and what the logs establish; route performance traces to APM and recurring notifications to Alerts.

## Triggers

Use this skill for: "Catalyst Logs", "Access Logs", "Application Logs", "function logs missing", "empty Get_Logs results", "find an execution", "log retention", "log level", "AppSail logs", `context.log`, `console.warn`, or `CatalystbyZoho_Get_Logs`.

## References

| Reference | Load when the query is about… |
|-----------|-------------------------------|
| `references/logs-basics.md` | Log views, filters, retention/indexing, Node.js/Python instrumentation, and empty results |
