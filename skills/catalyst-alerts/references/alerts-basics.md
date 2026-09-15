# Application Alerts Basics

Turn a verified log search or supported component event into an email alert.

## Select a supported source

Application Alerts documents **Logs**, legacy **Cron**, and legacy **Event Listener** sources. It sends email notifications and permits up to **5 alerts in Development** and **20 in Production**. [Overview](https://docs.catalyst.zoho.com/en/devops/help/application-alerts/introduction/).

Do not create a legacy Cron or Event Listener just to enable notifications for a new project. Those services have been replaced by Job Scheduling and Signals; consult the [service migration guidance](../../catalyst-basics/references/architecture.md). Their replacements are not documented as interchangeable alert-source names. Check the project's actual options, or use a Logs alert for a target function whose matching records are available.

For Signals delivery/retry diagnosis, load [Signals](../../catalyst-signals/references/signals-basics.md). Browser Grid's resource alerts belong to [SmartBrowz](../../catalyst-smartbrowz/references/smartbrowz-basics.md), not this email-alert configuration.

## Configure a Logs alert

Open **DevOps → Application Alerts → Create Alert**, select **Logs**, and name the alert. Open **Logs Query Generator** and select the log type, function(s), keyword, and, for Application logs, severity. Apply the selection to generate the query string. Set the comparator, threshold, frequency, and **1–10 recipient email addresses**. Review the console's interpretation before saving. [Creation workflow](https://docs.catalyst.zoho.com/en/devops/help/application-alerts/implementation/).

Use the generated syntax; do not invent SQL, ZCQL, `app.alerts()` methods, or MCP tool names. If a suitable tool exists, inspect its schema first. Before creation, reproduce the intended search in [Logs](../../catalyst-logs/references/logs-basics.md) and confirm that it returns the relevant failures.

Example configuration for an existing Node.js Advanced I/O function `checkout`:

| Setting | Value |
|---------|-------|
| Source / view | Logs / Application |
| Function | `checkout` |
| Keyword / severity | `payment_failed` / Error |
| Criteria | Greater than 5 |
| Frequency | Every 1 hour |
| Recipients | The user's designated project contacts |

This is a console recipe; replace the function and event with observed project values. No recipients or messages should be invented while preparing the configuration.

## Interpret thresholds and time windows

A Logs alert evaluates the matching search count in the configured frequency window. **Greater than 5** needs at least **6** matches; exactly 5 does not qualify. Where the UI offers **greater than or equal to**, a threshold of 5 includes 5. A one-hour alert is evaluated on its schedule, not on every matching log arrival.

For supported legacy component alerts, selected Failure/Code Exception/Timeout conditions are counted collectively. A single alert belongs to one component, even if it includes multiple entities. [Criteria and frequency](https://docs.catalyst.zoho.com/en/devops/help/application-alerts/key-concepts/).

## Diagnose missing notifications

Inspect enabled status, selected environment, exact generated query, completed evaluation interval, threshold comparator, and recipient addresses. Changing frequency restarts scheduling from the modification time; repeatedly editing an alert can change the window being tested. [Managing alerts](https://docs.catalyst.zoho.com/en/devops/help/application-alerts/implementation/).

Distinguish a saved alert from a matching evaluation and from an email actually received. Check the recipient's available mailbox evidence or reported receipt; do not claim delivery from configuration alone. When testing is authorized, use the intended development recipients and a controlled matching event, then allow the configured evaluation interval. If source logs are absent, diagnose those first.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| No email for exactly 5 matches with `> 5` | Strict comparator excludes equality | Use the intended comparator, or wait for a sixth match |
| No immediate email after an error | Alert evaluates on a schedule | Check the completed frequency window |
| Query has no matches | Wrong view, resource, keyword, or severity | Reproduce and correct the search in Logs |
| Signals/Job Scheduling absent from source list | Legacy alert sources assumed to cover replacement services | Inspect available sources and actual target-function logs |
| Alert cannot be created | Environment alert limit or recipient constraint | Inspect existing alerts and keep recipients within 1–10 |
