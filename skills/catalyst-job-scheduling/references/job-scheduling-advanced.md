# Job Scheduling Advanced

Retry internals, firing behaviors, dynamic scheduling from function code, webhook targets, and observability traps. All runtime-confirmed on a live project (Aug 2026) unless marked otherwise.

## Retry semantics (runtime-proven)

Configured per job via `job_config: { number_of_retries: 0–10, retry_interval: 60–86400 /* SECONDS */ }`.

- `context.closeWithFailure()` (or an HTTP non-2xx for Webhook targets) marks the job `FAILURE` and triggers the chain.
- **Each retry is a NEW job record** with its own `job_id`, sharing the same `job_meta_details.id`, linked by `parent_job_id` = the original job's id. Observed timeline with `retry_interval: 60`: fail at T, retry at T+61s, retry at T+122s — wall-clock-accurate seconds.
- **Polling the ORIGINAL job id never shows retries** — it stays `FAILURE` with `retried_count: 0`. Discover retries via the console job list or your own telemetry keyed on business ids.
- Total executions = 1 + `number_of_retries`; the chain stops early on the first success.
- Inside the handler, `X-ZC-Request-Uuid` (in job details headers) = the CURRENT execution's job id; `retried_count` is unreliable (`null`) at runtime.
- Crons themselves don't retry; retries apply to the JOBS a cron submits (put `job_config` in the cron's `job_meta`). Design job handlers to be idempotent.

## Firing behaviors (all runtime-confirmed)

| Behavior | Detail |
|----------|--------|
| Periodic (`every`) fires immediately | On CREATE **and** on every UPDATE, then every interval anchored to that moment (small drift of seconds/cycle observed) |
| CronExpression fires on wall-clock boundaries | `*/5 * * * *` → :00/:05/:10… in the cron's timezone |
| OneTime with PAST timestamp | Accepted without validation, fires ~35s later |
| OneTime after firing | Auto-disables (`cron_status` → `false`); record remains |
| OneTime with ms timestamp | Scheduled for year ~58,000 — never fires, zero warnings |
| Disabled crons | Skip their schedule, but `Submit_Cron_Job` / `runCron()` still work manually |

## Dynamic scheduling from inside a function

A job function can create crons and submit jobs at runtime (per-entity schedules — trial expiries, per-invoice retries). Runtime-confirmed pattern:

```javascript
const js = app.jobScheduling();
for (const sub of expiringTrials) {
  await js.cron().createCron({
    cron_name: 'trial_expiry_' + sub.ROWID,          // cron_name is not 20-char-limited (30 chars OK)
    cron_status: true,
    cron_type: 'OneTime',
    cron_detail: {
      time_of_execution: String(Math.floor(trialEndMs / 1000)),  // SECONDS
      timezone: 'Asia/Kolkata'
    },
    job_meta: {
      job_name: 'trial_' + String(sub.ROWID).slice(-6),          // ≤ 20 chars
      target_type: 'Function',
      target_name: 'billing_engine',
      jobpool_name: 'BillingPool',
      params: { action: 'expire_trial', sub_id: String(sub.ROWID) }
    }
  });
}
```

- These crons get `cron_execution_type: "dynamic"` and are **invisible to `List_All_Crons`** (which returns only `pre-defined` crons) — persist the returned `cron.id` in your Data Store if you'll ever need to pause/delete them.
- Mark the source row (e.g. `status: 'trial_scheduled'`) so re-runs don't double-schedule — cron_name uniqueness is NOT enforced as a dedupe mechanism.
- SDK error objects: use `err.message` / `err.code` (`String(err)` prints `[object Object]`).

## Webhook-target jobs

Webhook pools dispatch plain HTTP requests — `url` + `request_method` required; `headers`, `request_body` (≤5000 chars), `params` optional.

- `params` are appended as the **query string** (`POST /hook?channel=webhook`); `request_body` and custom headers are delivered verbatim.
- Success = 2xx → `response_code: "Success"`; non-2xx → `job_status: FAILURE`, `response_code: "500"` (the actual HTTP status as string) → retries per `job_config`.
- The target URL MAY be your own project's function URL. Such calls arrive with live Catalyst credential headers (`X-ZC-PROJECT-SECRET-KEY`, admin/user cred tokens) — an Advanced I/O receiver can `catalyst.initialize(req, { scope: 'admin' })`, but treat its logs as sensitive.
- `notify_url` (completion callback, separate from the webhook target) must be an EXTERNAL URL — pointing it at the project's own catalystserverless.com domain fails the whole submission with a bare `INTERNAL_SERVER_ERROR`. Callback payload shape: unverified.

## Monitoring & observability

- Job record fields (`Get_Job_By_Id` / `getJob`): `job_status` (`PENDING/RUNNING/SUCCESS/FAILURE` — uppercase), `response_code`, `execution_time` (ms), **`dispatch_delay`** (ms, queue wait — undocumented but present), `parent_job_id`, `start_time`/`end_time`/`submitted_on` (objects with `timeWithGivenTimezone` etc., NOT strings).
- **Cron `success_count` / `failure_count` stayed 0 across all cron types despite many successful fires — do not build monitoring on them.** Write your own audit rows from the handler instead.
- `Delete_Job` removes a finished job's record (history cleanup). `Delete_Job_Pool` requires deleting the pool's crons first (`OPERATION_NOT_ALLOWED` otherwise).
- Immediate and scheduled jobs share the 15-min cap: `getMaxExecutionTimeMs()` → `"900000"` (STRING; `parseInt` it), `getRemainingExecutionTimeMs()` → number, ~500ms consumed before the handler starts.

## Scope & security in job runtimes

- The job runtime has **no user token**. `catalyst.initialize(context, { scope: 'user' })` throws at initialize: `auth/invalid_credential — no user credentials present…`. Use `{ scope: 'admin' }` (Node's default init also carries admin privileges in non-HTTP functions).
- Never log `jobRequest.getJobDetails()` / `getJobMetaDetails()` wholesale — their `headers` carry the project secret key and admin cred tokens.
- Job params arrive as `Record<string, string>` — parse and validate before use; the handler runs with admin data access.

## CLI corner

- **The CLI cannot create, list, or manage crons, jobs, or job pools** — v1.27.0 (2026-07-15) has no `cron:*`/`job:*`/`pool` commands, and updating the CLI does not add them. Its Job Scheduling involvement is only: scaffolding (`functions:add --type job`), deploying, local emulation (`functions:execute`), and sample payloads (`event:generate:job <jobpool_id>`). Manage scheduling via Console, REST, Zoho MCP tools, or the SDK.
- `catalyst event:generate:job <jobpool_id>` prints a sample job payload matching the real runtime shape (without the id it needs an interactive TTY).
- `catalyst functions:execute <job_fn>` emulates locally but requires the function's EXACT stack binary (node22 function + only node24 installed → "Required NodeJS version v22 is not present…"; fix with `catalyst config:set node22.bin=<path>`). Deploying has no such requirement.
- `functions:execute` proves handler logic only — not pool behavior, schedules, or deployed env vars.
- Stale edits in emulation? `rm -rf functions/<name>/.build`.

## Not yet verified (do not present as fact)

- 50-consecutive-failure auto-disable for third-party-URL crons (claimed in functions-templates.md; impractical to reproduce).
- Circuit / AppSail target payload behavior (schema-documented only: Circuit takes `test_cases`; AppSail takes path-only `url`, `request_method`, ...).
- `notify_url` callback body shape; cron `end_time` semantics; Calendar `monthly`/`yearly` shapes (`days`, `weeks_of_month`, `week_day`, `months`).

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Retries "not happening" when polling the job | Watching the original `job_id` — it stays `FAILURE`; retries are NEW jobs | Track `parent_job_id` linkage or use your own telemetry |
| Periodic cron ran the moment it was created/updated | By design — `repetition_type: "every"` fires immediately on create AND update | Create disabled (`cron_status: false`) and enable at the right moment, or tolerate the first run |
| Dynamic cron "disappeared" | `List_All_Crons` shows only pre-defined crons | `Get_Cron_Job_By_Id` with the stored id — persist ids at creation |
| `success_count` stays 0 despite successful runs | Counters do not increment in practice | Use job records / your own audit table for monitoring |
| `auth/invalid_credential: no user credentials present…` | `{ scope: 'user' }` in a job/cron runtime | Use `{ scope: 'admin' }` — there is no user in background runtimes |
| `OPERATION_NOT_ALLOWED: Delete all associated Pre-defined Crons before deleting Job Pool` | Pool still referenced by crons | Delete/re-point the crons, then delete the pool |
| Webhook job marked FAILURE with `response_code: "500"` | Target returned non-2xx | Fix the receiver or accept retries; non-2xx = failure |
| `INTERNAL_SERVER_ERROR` submitting with `notify_url` | notify_url on the project's own domain | External URL only |
| `getRemainingExecutionCount is not a function` etc. in a job fn | Copied cron-function template into a job function | Job: `(jobRequest, context)`; Cron: `(cronDetails, context)` — different APIs |
