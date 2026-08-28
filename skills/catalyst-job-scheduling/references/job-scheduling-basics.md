# Job Scheduling Basics

Job pools, immediate jobs, and the four cron types — with runtime-verified payloads for the Zoho MCP tools and the Node.js SDK. All facts marked runtime-confirmed were verified on a live project (Aug 2026).

## Concepts

| Piece | What it is | Key rule |
|-------|-----------|----------|
| **Job pool** | Capacity container jobs run in | Must exist first — fresh projects have NO default pool |
| **Job** | One execution (immediate, or submitted by a cron) | Targets: Function (job-type only), Webhook, Circuit, AppSail |
| **Cron** | Scheduler that submits jobs | Types: `Periodic`, `OneTime`, `Calendar`, `CronExpression` |

- Pool capacity: Function pools → `{"memory": "512"}` (MB: 128/256/512/1024); Webhook/Circuit/Appsail pools → `{"number": "5"}` (max concurrent, 1–10). Sent as strings, echoed back as numbers.
- The job runs at the **function's** configured memory; the pool memory is a ceiling. Function memory > pool memory ⇒ every submission rejected: `INVALID_INPUT: The memory allocated for the Job Function is higher than the memory allocated for its associated Job Pool.` (runtime-confirmed — it is a hard error, not a "dispatch delay").
- `job_name`: 1–20 chars, alphanumeric + underscore only (both limits runtime-confirmed).
- Job statuses (REST, uppercase): `PENDING → RUNNING → SUCCESS | FAILURE`. The SDK's enum spellings (`Submitted/Successful/…`) do NOT match the live API.

## Job function (the target)

Scaffold and deploy with the CLI — job functions are the ONLY function type Job Scheduling can invoke (cron/basicio/advancedio targets are rejected with `The given function is not a job function.`):

```bash
catalyst functions:add --name billing_engine --type job --stack node22 -ni
catalyst deploy --only functions:billing_engine -ni
```

Handler (Node.js):

```javascript
'use strict';
const catalyst = require('zcatalyst-sdk-node');

module.exports = async (jobRequest, context) => {
  // Job runtime has NO user token — admin scope is required for data access.
  const app = catalyst.initialize(context, { scope: 'admin' });
  try {
    const params = jobRequest.getAllJobParams(); // Record<string, string> — ALL values are strings
    const batch = parseInt(params.batch || '10', 10);

    const maxMs = parseInt(context.getMaxExecutionTimeMs(), 10); // "900000" STRING (15 min)
    const remMs = context.getRemainingExecutionTimeMs();         // number (~899500 at start)

    const rows = await app.zcql().executeZCQLQuery(
      `SELECT ROWID FROM Invoices WHERE status = 'unpaid' LIMIT 0, ${batch}`
    );
    // ... process rows ...

    context.closeWithSuccess();   // ALWAYS close — this reports SUCCESS
  } catch (e) {
    console.log('job failed', e.message, e.code);
    context.closeWithFailure();   // reports FAILURE and triggers the retry chain (if configured)
  }
};
```

Other `jobRequest` methods: `getJobDetails()`, `getJobMetaDetails()`, `getJobCapacityAttributes()` (→ `{"memory":"256"}` strings at runtime), `getJobParam(key)`. ⚠️ `getJobDetails()`/`getJobMetaDetails()` include live credential headers — never log them wholesale.

## Zoho MCP workflow (runtime-confirmed payloads)

All calls need `headers: {"Catalyst-org": <orgId>, "Environment": "Development"|"Production"}` and `path_variables: {"projectId": "..."}`.

**1. Pre-flight — always:** `CatalystbyZoho_List_All_Jobpools`. If empty, `CatalystbyZoho_Create_Job_Pool`:

```json
{ "name": "BillingPool", "type": "Function", "capacity": { "memory": "512" } }
```

**2. Immediate job:** `CatalystbyZoho_Create_Immediate_Job` (requires `job_name`, `target_type`, `target_id`, `jobpool_id`):

```json
{
  "job_name": "invoice_run",
  "target_type": "Function",
  "target_id": "<functionId>",
  "jobpool_id": "<poolId>",
  "params": { "action": "generate_invoices" },
  "job_config": { "number_of_retries": "2", "retry_interval": "60" }
}
```

`retry_interval` is **SECONDS, 60–86400** (`retry interval should be within 60s (1 minute) to 86400s (24 hours)` otherwise). Get the function id from `CatalystbyZoho_List_All_Functions`.

**3. Cron:** `CatalystbyZoho_Create_Cron_Job`. Body requires `cron_name`, `cron_type`, `cron_status`, `cron_execution_type: "pre-defined"`, `job_detail`, `job_meta` (which requires `job_name`, `target_type`, `source_type: "Cron"`, `target_id`, `jobpool_id`).

The four cron types (all runtime-confirmed, including `Calendar`, which is MISSING from the MCP tool schema enum but accepted by the live API):

```jsonc
// Periodic — every N h/m/s. FIRES IMMEDIATELY on create and on every update, then every interval.
"cron_type": "Periodic",
"job_detail": { "hour": "0", "minute": "15", "second": "0", "repetition_type": "every", "timezone": "Asia/Kolkata" }

// OneTime — fires once at time_of_execution — UNIX SECONDS, not ms!
// A past timestamp fires immediately (~35s). A ms timestamp = year ~58000 = never fires, silently.
"cron_type": "OneTime",
"job_detail": { "time_of_execution": 1787900689, "timezone": "Asia/Kolkata" }

// Calendar — fixed clock time; repetition_type daily | monthly | yearly
"cron_type": "Calendar",
"job_detail": { "hour": "9", "minute": "0", "second": "0", "repetition_type": "daily", "timezone": "Asia/Kolkata" }

// CronExpression — cron_expression goes at the BODY TOP LEVEL, not inside job_detail
"cron_type": "CronExpression",
"cron_expression": "*/5 * * * *",
"job_detail": { "timezone": "Asia/Kolkata" }
```

**4. Operate:** `Submit_Cron_Job` (manual trigger — works even on DISABLED crons; uses the cron's stored job_meta, params in the request body are ignored), `Update_Cron_Job_Status` (enable/disable — requires the FULL cron body, not just the flag), `Update_Cron_Job`, `Get_Cron_Job_By_Id`, `Delete_Cron_Job`, `Get_Job_By_Id`, `Delete_Job` (removes a finished job's record), `Delete_Job_Pool` (fails with `OPERATION_NOT_ALLOWED` until every cron referencing the pool is deleted first).

> ⚠️ **Get/list responses echo stored secrets:** `Get_Job_By_Id`, `Get_Cron_Job_By_Id`, and `List_All_Crons` return the job_meta's stored `headers` and `params` in plaintext (runtime-confirmed — custom webhook headers are echoed verbatim). Never place auth tokens or API keys in a job's `headers`/`params` expecting privacy — anyone with read access to these tools can retrieve them. Never echo a raw cron/job dump into chat, issues, or logs; surface only non-secret fields (`cron_name`, `id`, url path, schedule, `cron_status`). (This is separate from the runtime `getJobDetails()` platform-credential leak covered in `job-scheduling-advanced.md`.)

## Node SDK (zcatalyst-sdk-node)

```javascript
const js = app.jobScheduling();

// Immediate job
const job = await js.job().submitJob({
  job_name: 'dun_012345',                    // ≤ 20 chars!
  target_type: 'Function',
  target_name: 'dunning_processor',          // or target_id
  jobpool_name: 'BillingPool',               // or jobpool_id
  params: { invoice_id: '123456000000012345' },
  job_config: { number_of_retries: 2, retry_interval: 60 }   // SECONDS
});
// job.job_id, job.job_status ("PENDING"), job.execution_time, job.dispatch_delay

// Cron — OneTime, time_of_execution in UNIX SECONDS as a string
await js.cron().createCron({
  cron_name: 'trial_expiry_52381',
  cron_status: true,
  cron_type: 'OneTime',
  cron_detail: { time_of_execution: String(Math.floor(Date.now() / 1000) + 3600), timezone: 'Asia/Kolkata' },
  job_meta: {
    job_name: 'trial_52381',
    target_type: 'Function',
    target_name: 'billing_engine',
    jobpool_name: 'BillingPool',
    params: { action: 'generate_invoices' }
  }
});

// Lifecycle (id or name accepted) — all runtime-confirmed from inside a deployed job function
await js.cron().pauseCron(cronId);
await js.cron().resumeCron(cronId);
await js.cron().runCron(cronId);      // manual trigger; returns the submitted job's details
await js.cron().getCron(cronId);
await js.cron().deleteCron(cronId);
await js.job().getJob(jobId);
await js.getAllJobpool();             // pools are read-only in the SDK — no create/update
```

SDK-created crons get `cron_execution_type: "dynamic"` (console/REST-created ones are `"pre-defined"`). ⚠️ Dynamic crons DO NOT appear in `List_All_Crons` / console cron lists — retrieve them by id and track ids yourself.

There is no `pool(id).createCron(...)` shape in the Node SDK — that shape appears in older docs and does not exist.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `job_name must contain only alphanumeric and underscore` | Hyphen/space/dot in `job_name` | Use underscores: `doc_run_1` not `doc-run-1` |
| `job_name should be within 1-20 char length` | Name too long (ROWID suffixes overflow instantly) | Truncate: `'dun_' + rowid.slice(-6)` |
| `The given function is not a job function.` | Cron/BasicIO/AdvancedIO function used as Function target | Create a `--type job` function; cron-TYPE functions are legacy-Cron-only |
| `retry interval should be within 60s (1 minute) to 86400s (24 hours)` | `retry_interval` sent in ms or < 60 | Use SECONDS in [60, 86400] |
| Job submission fails: missing `jobpool_id` | No pool exists / not passed | `List_All_Jobpools` first; create a pool if empty — there is no default |
| `The memory allocated for the Job Function is higher than the memory allocated for its associated Job Pool.` | Function memory > pool memory | Raise pool memory or lower function memory (`catalyst functions:config`) |
| `Mandatory parameter cron expression is missing.` | `cron_expression` nested inside `job_detail` | Put `cron_expression` at the body top level |
| `Mandatory parameter cron_type is missing` (SDK) | Used SDK enum `CRON_TYPE.CALENDER` ("Calender") | The enum is misspelled and rejected — pass the string `'Calendar'` |
| OneTime cron never fires, no error anywhere | `time_of_execution` given in milliseconds | Use UNIX SECONDS (`Math.floor(Date.now()/1000)`) |
| `INTERNAL_SERVER_ERROR` on job submit with `notify_url` | `notify_url` points at the project's own catalystserverless.com domain | Use an external URL, or drop notify_url (self-domain is blocked; the error message doesn't say so) |
