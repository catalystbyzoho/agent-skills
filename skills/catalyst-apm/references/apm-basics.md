# APM Basics

Use function performance evidence to isolate a slow operation and verify its improvement.

## Check whether APM can observe the workload

The APM introduction documents **Java and Node.js** Basic I/O, Advanced I/O, Event, legacy Cron, and Browser Logic functions. **Python is unsupported**, and APM is unavailable in the **CA data center**. Do not promise coverage for AppSail, Integration, or Job functions based on this list; verify current support for an unlisted workload. [Coverage](https://docs.catalyst.zoho.com/en/devops/help/apm/introduction/).

For Python or other uncovered operations, use [Logs and timing helpers](../../catalyst-logs/references/logs-basics.md). Adding a fictional Catalyst APM package or wrapping code in an undocumented `app.apm()` API will not enable native collection.

## Enable collection and account for gaps

Open **DevOps → APM → Enable Now** for the intended project when enablement is requested. Collection occurs only while APM is enabled. Reports cover at most **30 days**; after re-enabling, periods when collection was disabled remain missing. Preserve existing monitoring when diagnosing an empty dashboard instead of toggling it repeatedly. [Enable/disable behavior](https://docs.catalyst.zoho.com/en/devops/help/apm/enable-disable/).

For a blank dashboard, check project/environment, runtime/type, enablement at the invocation time, retention, and filter selection. When permitted, invoke a supported development function and verify a new report. Separate “collection is now enabled” from “the incident has performance evidence”.

## Navigate from aggregate to execution

1. In **Dashboard**, select a function type, function, and time window. Compare invocation/error counts with average response time to locate the affected interval.
2. Inspect **Top 100 Slowest Calls** carefully: it covers the selected **type and time window**, not just the selected function. The individual-function filter applies to the graphs.
3. For one function, use **Executed Functions** and filter its name, execution interval, and response-time threshold in milliseconds. Open the relevant execution.

Sources: [Dashboard](https://docs.catalyst.zoho.com/en/devops/help/apm/dashboard/), [Executed Functions](https://docs.catalyst.zoho.com/en/devops/help/apm/executed-functions/).

For example, selecting `checkout` in the graphs can still leave another Advanced I/O function in the slowest-calls table. That does not establish that `checkout` invoked the other function. Inspect a specific `checkout` execution before drawing that conclusion.

## Interpret component traces

The execution's **Summary** and **Trace** show Catalyst component operations made through **Catalyst SDKs**. Direct REST API calls to those components are not included. Inspect the start/end time and duration of individual calls, and correlate untraced work with application timing logs. [Function details](https://docs.catalyst.zoho.com/en/devops/help/apm/function-details/).

Do not add concurrent component durations and label the sum total request latency: their time intervals may overlap. Treat usage percentages as call-count proportions, not time percentages. A long request with no component entries may be doing CPU work, waiting on external I/O, or making direct REST calls; investigate those possibilities with measured logs.

## Verify a performance fix

Record the same function, input scenario, environment, and comparison window before and after a change. Compare successful executions as well as latency so that a fast failure is not reported as an improvement. Keep request-level timing separate from SDK-component timing and identify any remaining unobserved operations.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Python function has no APM entry | Unsupported runtime | Use logging and explicit timing |
| APM absent in CA | Data-center restriction | Use available logs; do not keep reinstalling SDKs |
| Yesterday's data missing after enabling today | APM was disabled during those executions | Investigate retained logs; measure new runs |
| Slowest table includes another function | Table is scoped by type/time, unlike graphs | Filter Executed Functions by the intended name |
| REST call missing from component trace | Direct API calls are not recorded as SDK component calls | Correlate explicit timing logs |
