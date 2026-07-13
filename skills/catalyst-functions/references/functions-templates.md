# Function Templates — Event, Cron, Job, Integration

Handler templates for background and scheduled function types. Load this file when the query is about Event, Cron, Job, or Integration functions — NOT Basic I/O or Advanced I/O (those are in `functions-basics.md`).

## `catalyst-config.json` — `type` Field Values

The `type` field is set by the CLI when a function is created. **Do not change it manually.**

| Function Type | `"type"` value |
|---------------|----------------|
| Basic I/O | `"basicio"` |
| Advanced I/O | `"advancedio"` |
| Cron | `"cron"` |
| Job | `"job"` |
| Event | `"event"` |
| Integration | `"integration"` |
| Browser Logic | `"browserlogic"` |

> `"browserlogic"` for Browser Logic — NOT `"browselogic"`. Basic I/O is `"basicio"` — NOT `"basiccron"`.

---

## Event Function Template

Triggered by Catalyst Signals or Event Listeners.

```javascript
'use strict';
const catalyst = require('zcatalyst-sdk-node');

module.exports = (event, context) => {
  try {
    const catalystApp = catalyst.initialize(context);
    const eventData = JSON.parse(event.getArgument());
    console.log('Event received:', eventData);
    context.close();
  } catch (error) {
    console.error('Event processing error:', error);
    context.close();
  }
};
```

---

## Cron Function Template

Triggered on a schedule. Always call `closeWithSuccess()` or `closeWithFailure()` — never leave the context open.

```javascript
'use strict';
const catalyst = require('zcatalyst-sdk-node');

module.exports = async (cronDetails, context) => {
  try {
    const catalystApp = catalyst.initialize(context);
    const maxMs = context.getMaxExecutionTimeMs(); // "900000" (STRING) = 15 minutes
    
    // Your scheduled task logic here
    
    context.closeWithSuccess();
  } catch (error) {
    context.closeWithFailure();
  }
};
```

---

## Job Function Template

Triggered via Job Scheduling. Use `{ scope: 'admin' }` for system-level DataStore/ZCQL operations that don't need a specific user context.

```javascript
'use strict';
const catalyst = require('zcatalyst-sdk-node');

module.exports = async (jobData, context) => {
  try {
    const catalystApp = catalyst.initialize(context, { scope: 'admin' });
    const jobDetails = jobData.getAllJobParams();
    const maxMs = context.getMaxExecutionTimeMs(); // "900000" (STRING) = 15 minutes

    const zcql = catalystApp.zcql();
    const rows = await zcql.executeZCQLQuery('SELECT * FROM MyTable LIMIT 0, 300');

    context.closeWithSuccess();
  } catch (error) {
    context.closeWithFailure();
  }
};
```

> **Using Zoho MCP to submit a job?** Always call `CatalystbyZoho_List_All_Jobpools` before `CatalystbyZoho_Create_Immediate_Job`. `jobpool_id` is required — there is no default. If no pools exist, call `CatalystbyZoho_Create_Job_Pool` (type `"Function"`, memory e.g. `"256"`) first.

### Python Job Function Template

```python
import logging
import zcatalyst_sdk

def handler(job_request, context):
    logger = logging.getLogger()
    try:
        # catalyst.initialize(context) defaults to Admin scope in non-HTTP functions
        app = zcatalyst_sdk.initialize(req=context)

        max_ms = context.get_max_execution_time_ms()        # "900000" (STRING) = 15 minutes
        remaining_ms = context.get_remaining_execution_time_ms()  # decrements as function runs

        all_params = job_request.get_all_job_params()
        job_details = job_request.get_job_details()

        zcql = app.zcql()
        rows = zcql.execute_query('SELECT * FROM MyTable LIMIT 0, 300')
        logger.info(f'Fetched {len(rows)} rows')

        context.close_with_success()
    except Exception as e:
        logger.error(f'Job failed: {e}')
        context.close_with_failure()
```

**Python context API (Job and Cron):**
- `context.get_max_execution_time_ms()` — returns `"900000"` (STRING, 15 min)
- `context.get_remaining_execution_time_ms()` — decrements live
- `context.close_with_success()` — mark job succeeded
- `context.close_with_failure()` — mark job failed

---

## Integration Function Template

Triggered by events from other Zoho services (e.g., Zoho CRM, Zoho Books).

```javascript
'use strict';
const catalyst = require('zcatalyst-sdk-node');

module.exports = (event, context) => {
  try {
    const catalystApp = catalyst.initialize(context);
    const integrationData = JSON.parse(event.getArgument());
    context.close();
  } catch (error) {
    context.close();
  }
};
```

> Integration functions are NOT available in EU, AU, IN, JP, SA, or CA data centers.

---

## SDK Component Reference

```bash
npm install zcatalyst-sdk-node
```

```javascript
const dataStore = catalystApp.datastore();
const table = dataStore.table('TableName');

const inserted = await table.insertRow({ ColumnName: value });
const insertedRows = await table.insertRows([{ ColumnName: value1 }, { ColumnName: value2 }]);
const updated = await table.updateRow({ ROWID: rowId, ColumnName: value });
await table.deleteRow(rowId);

const row = result.TableName; // unwrap ZCQL table wrapper, e.g. result.Orders

const zcql = catalystApp.zcql();
const cache = catalystApp.cache();
const stratus = catalystApp.stratus();
const email = catalystApp.email();
const userManagement = catalystApp.userManagement();
const pushNotification = catalystApp.pushNotification();
const search = catalystApp.search();
const nosql = catalystApp.nosql();
const connection = catalystApp.connection();
```

> Data Store tables must exist before SDK operations target them. Functions cannot create tables programmatically — use Zoho MCP for table creation and schema updates.

---

## Retry Behavior

| Function Type | Auto-retry on failure? | Notes |
|---------------|----------------------|-------|
| Basic I/O | No | |
| Advanced I/O | No | |
| Event | Yes | Platform retries automatically |
| Cron | **No** | Failures trigger Application Alerts only — no automatic retry. Manual review and rerun required. |
| Job | Configurable | Retry is set in `job_config.number_of_retries` when submitting the job (0–10 retries, min 1-min interval) |
| Integration | No | |
| Browser Logic | No | |

> **Cron failure handling**: Configure Application Alerts (Console → Cloud Scale → Cron → Alerts) to receive email notifications when a cron fails, times out, or throws an exception. Review execution history from the console to debug and rerun.
>
> **50-consecutive-failures auto-disable** applies ONLY to crons associated with a **third-party URL** target — NOT to function-based crons. Function-based crons never auto-disable regardless of repeated failures.

Design **Event** and **Job** handlers to be **idempotent** (safe to run multiple times). Cron handlers should also be idempotent to safely support manual reruns.

---

## Cold Starts

| Runtime | Cold start | Warm invocation |
|---------|-----------|-----------------|
| Node.js | 500ms–2s | 50–200ms |
| Java | 2–8s | 50–200ms |
| Python | 500ms–2s | 50–200ms |

**Mitigation:** Keep packages small, avoid heavy initialization outside the handler, use Job Scheduling to ping critical functions warm.

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `res.status()` / `res.json()` in node20 | Raw-http template — no Express methods | Use `res.writeHead()` + `res.end()` |
| `req.body` undefined | Raw-http template — no body parser | Manually parse with `getBody()` helper |
| `req.query` undefined | Raw-http template — no query parser | Use `new URL(req.url, ...).searchParams` |
| `basicIO.write()` called twice | Can only be called once per execution | Call `basicIO.write()` exactly once |
| Admin-scope for `getCurrentUser()` | Admin scope has no user token | Use user-scope: `catalyst.initialize(req)` |
| `req.headers['authorization']` undefined | Gateway strips it before function receives it | Use `catalyst.initialize(req)` to identify the user |
| Using `cors()` middleware with Slate | Gateway owns CORS for production origins | Only set CORS headers for `localhost` |
| `new Date(row.CREATEDTIME)` wrong timezone | Stored timestamp lacks timezone offset | Append timezone offset before parsing |
| Inserting emoji into Data Store | Unsupported character in column type | Store a string key instead |
| Not paginating ZCQL | Max 300 rows per query | Use `LIMIT offset, count` |
| `is_deployed: false` in API responses | All functions return this value regardless of live status | Verify deployment status in the Console |
| Need to read >300 rows in a Job function | ZCQL cap is 300 rows; paginating inside 15-min limit is risky | Use the Bulk Read REST API for large-volume reads |
| `INVALID_INPUT: job_name must contain only alphanumeric and underscore` | `job_name` contains hyphens or spaces | Use underscores only — `doc_audit_run_1` not `doc-audit-run-1` |
| `busboy` never emits `finish` event | Pipe not set up before response end | Ensure `req.pipe(bb)` and `finish` listener registered before piping |
| File upload silently truncated | Function memory limit exceeded mid-stream | Use pre-signed Stratus URL for files > 50 MB |
| Chained function call times out | Inner function cold start exceeds outer timeout | Use `invokeType: 'async'` for fire-and-forget; Job functions for long pipelines |
| `Cannot read properties of undefined (reading 'files')` | `express-fileupload` not added as middleware before route | Add `app.use(fileUpload())` before route definitions |
| Timeout math fails in Cron/Job | `context.getMaxExecutionTimeMs()` returns STRING | Use `parseInt(context.getMaxExecutionTimeMs())` for calculations |
