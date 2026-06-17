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
    context.closeWithSuccess();
  } catch (error) {
    context.closeWithFailure();
  }
};
```

---

## Job Function Template

Triggered via Job Scheduling. **Always use `{ scope: 'admin' }`** — Job functions have no user token, so any DataStore or ZCQL call without admin scope will silently hang until the 15-minute timeout.

```javascript
'use strict';
const catalyst = require('zcatalyst-sdk-node');

module.exports = async (jobData, context) => {
  try {
    const catalystApp = catalyst.initialize(context, { scope: 'admin' });
    const jobDetails = jobData.getAllJobParams();
    const maxMs = context.getMaxExecutionTimeMs(); // 15 minutes

    const zcql = catalystApp.zcql();
    const rows = await zcql.executeZCQLQuery('SELECT * FROM MyTable LIMIT 0, 300');

    context.closeWithSuccess();
  } catch (error) {
    context.closeWithFailure();
  }
};
```

> ⚠️ `catalyst.initialize(context)` without `{ scope: 'admin' }` in Job/Cron/Event functions makes unauthenticated DataStore requests that stall 60 s each and burn toward the 15-minute timeout.

> **Using Zoho MCP to submit a job?** Always call `CatalystbyZoho_List_All_Jobpools` before `CatalystbyZoho_Create_Immediate_Job`. `jobpool_id` is required — there is no default. If no pools exist, call `CatalystbyZoho_Create_Job_Pool` (type `"Function"`, memory e.g. `"256"`) first.

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

| Function Type | Auto-retry on failure? |
|---------------|----------------------|
| Basic I/O | No |
| Advanced I/O | No |
| Event | Yes |
| Cron | Yes |
| Job | Yes |
| Integration | No |
| Browser Logic | No |

Design Event/Cron/Job handlers to be **idempotent** (safe to run multiple times).

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
| DataStore/ZCQL silently hangs in Job/Event/Cron | `catalyst.initialize(context)` without `scope: 'admin'` makes unauthenticated requests | Add `{ scope: 'admin' }`: `catalyst.initialize(context, { scope: 'admin' })` |
| Need to read >300 rows in a Job function | ZCQL cap is 300 rows; paginating inside 15-min limit is risky | Use the Bulk Read REST API for large-volume reads |
| `INVALID_INPUT: job_name must contain only alphanumeric and underscore` | `job_name` contains hyphens or spaces | Use underscores only — `doc_audit_run_1` not `doc-audit-run-1` |
| `busboy` never emits `finish` event | Pipe not set up before response end | Ensure `req.pipe(bb)` and `finish` listener registered before piping |
| File upload silently truncated | Function memory limit exceeded mid-stream | Use pre-signed Stratus URL for files > 50 MB |
| Chained function call times out | Inner function cold start exceeds outer timeout | Use `invokeType: 'async'` for fire-and-forget; Job functions for long pipelines |
| `Cannot read properties of undefined (reading 'files')` | `express-fileupload` not added as middleware before route | Add `app.use(fileUpload())` before route definitions |
