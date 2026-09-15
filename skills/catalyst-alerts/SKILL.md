---
name: catalyst-alerts
description: "Catalyst Application Alerts — configure and debug email notifications from Logs queries and supported component events. Use for 'email me when a function fails', 'alert not received', 'Logs Query Generator', alert thresholds/frequency, or legacy Cron/Event Listener alerts; distinguish these from Signals and Job Scheduling."
metadata:
  version: "2.0.0"
---

## How It Works

1. **Identify the signal** — Establish the project/environment, observed log or component event, intended threshold/window, and recipients. Distinguish Application Alerts from a service's own alert dashboard.
2. **Load the reference** — Read `references/alerts-basics.md` for supported sources, Logs Query Generator, comparator semantics, and delivery checks. Follow the Logs link if the source records are missing.
3. **Verify source matches** — Reproduce a Logs query with the exact type/resource/keyword/severity before creating an alert. Check legacy component availability rather than assuming renamed Signals or Job Scheduling events use the same configuration.
4. **Configure the alert** — Use the console workflow or an available tool's verified schema. Set the comparator, threshold, frequency, and intended recipients; review the displayed interpretation before saving.
5. **Verify evaluation and delivery** — Check enabled status and the completed evaluation window against matching records. Report saved configuration, threshold satisfaction, and observed email delivery as separate outcomes.

## Triggers

Use this skill for: "Catalyst Application Alerts", "email me when a function fails", "alert not received", "Logs Query Generator", "alert threshold", "alert frequency", "email notification", "Cron alerts", or "Event Listener alerts".

## References

| Reference | Load when the query is about… |
|-----------|-------------------------------|
| `references/alerts-basics.md` | Alert sources, generated log queries, threshold/window interpretation, recipients, and missing notifications |
