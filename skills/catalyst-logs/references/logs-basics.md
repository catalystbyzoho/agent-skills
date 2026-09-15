# Logs Basics

Find evidence of a specific execution and add useful runtime logging when needed.

## Select the layer before searching

Open **DevOps → Logs** in the intended project and environment.

| View | Use it for |
|------|------------|
| Access | Invocation URL/method, caller, response status, and response time |
| Application | Messages emitted by function code and runtime severity |

The views are separate. Event and legacy Cron executions appear in Application logs, not Access logs. Access supports Basic I/O, Advanced I/O, Integration, and Browser Logic functions. Select the resource and time range/time zone, then add a keyword; Access indexing can occasionally take up to five minutes. [Access Logs](https://docs.catalyst.zoho.com/en/devops/help/logs/access-logs/).

Application filters also include severity and an execution ID for Event/Cron executions. Clear an overly restrictive severity filter before deciding that the function emitted nothing. [Application Logs](https://docs.catalyst.zoho.com/en/devops/help/logs/application-logs/).

Function logs are retained for **7 days in Development** and **14 days in Production**. A missing historical log outside that window cannot be recovered by changing the query or enabling APM. [Retention](https://docs.catalyst.zoho.com/en/devops/help/logs/introduction/).

## Query through available tools

If `CatalystbyZoho_Get_Logs` is exposed, discover its current argument schema through the [MCP workflow](../../catalyst-zoho-mcp/references/zoho-mcp.md). Populate its explicit log-type/resource/time filters from that schema. Do not copy an invented Logs API request or infer absence of executions from one empty response.

For AppSail, follow the [AppSail log diagnosis](../../catalyst-appsail/references/appsail-basics.md) and cross-check the service's console logs. Do not apply the function-type matrix above to an AppSail container.

## Emit bounded, structured messages

Catalyst documents a 1,500-character log-message limit. Log an event name, a short operation label, duration, and a correlation identifier when available. Avoid full request bodies, tokens, cookies, and user conversations. Node.js supports `console.log/info/warn/error/debug`; Basic I/O also exposes `context.log`. Python supports standard `logging` methods; use the existing function logger configuration. [Catalyst logging](https://docs.catalyst.zoho.com/en/devops/help/logs/pushing-to-logs/).

The documentation contains a `console.warning()` typo and a Java-style line under Python. Use Node's `console.warn()` and Python's `logger.warning()` instead. [Node.js console](https://nodejs.org/api/console.html#consolewarndata-args), [Python logging](https://docs.python.org/3/library/logging.html).

These reusable helpers fit inside an existing function's handler; preserve that handler's response and lifecycle from the [Functions reference](../../catalyst-functions/references/functions-basics.md). Pass a short, non-sensitive step name and a zero-argument operation. The Node.js helper accepts an async operation; the Python helper below measures a synchronous operation.

Node.js, `measure.cjs`:

```javascript
'use strict';

async function measureStep(step, operation) {
  const start = process.hrtime.bigint();
  const record = (event) => JSON.stringify({
    event,
    step: String(step).slice(0,80),
    duration_ms: Number(process.hrtime.bigint() - start) / 1e6
  });
  try {
    const result = await operation();
    console.info(record('step_completed'));
    return result;
  } catch (error) {
    console.error(record('step_failed'));
    throw error;
  }
}

module.exports = { measureStep };
```

Python, `measure.py`:

```python
import json
import logging
import time

logger = logging.getLogger(__name__)


def measure_step(step, operation):
    start = time.perf_counter()

    def record(event):
        return json.dumps({
            'event': event,
            'step': str(step)[:80],
            'duration_ms': (time.perf_counter() - start) * 1000,
        })

    try:
        result = operation()
    except Exception:
        logger.error(record('step_failed'))
        raise
    logger.info(record('step_completed'))
    return result
```

Use a development invocation to check that the configured severity admits the message. A handled exception still needs to propagate or become the handler's correct failure response; logging it alone does not change the business outcome.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| HTTP access record exists but no custom messages | Wrong log layer or severity | Search Application logs for that function/time |
| Event execution absent from Access | Internal execution does not traverse the access layer | Use Application logs and its execution ID |
| `Get_Logs` returned nothing | Wrong filters, environment, expired logs, or indexing delay | Inspect tool schema, broaden filters, and compare the console |
| `console.warning is not a function` | Unsupported Node.js method | Use `console.warn` |
| Python INFO messages missing | Logger/handler threshold excludes INFO | Inspect existing logger levels and Application filters |
| A log says completed but request failed | One step completed, or an exception was swallowed elsewhere | Correlate the final response and remaining steps |
