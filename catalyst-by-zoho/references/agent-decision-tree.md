# Agent Decision Tree

Load this when an agent is **deploying, debugging, or stuck** on Catalyst. Pick a branch, then load the matching service skill reference.

```
Catalyst work mentioned
│
├─ DEPLOYING?
│   ├─ Verify org, project ID, DC, environment
│   ├─ Repo has deploy script? → use it before raw catalyst deploy
│   ├─ After deploy → verify every expected component in CLI output
│   └─ AppSail? → jump to APPSAIL branch
│
├─ JOB FUNCTION? (Python Job, cron, ETL)
│   ├─ Mental model: USER-cred SDK hangs → use admin scope / ZCQL / Bulk Read
│   ├─ Must call close_with_success / close_with_failure
│   ├─ 15 min hard cap — chunk work; API immediate jobs are much shorter
│   └─ DataStore write in Job? → prefer ZCQL UPDATE over table PUT if calls hang
│
├─ APPSAIL?
│   ├─ Build artifacts exist locally?
│   ├─ Bind port from X_ZOHO_CATALYST_LISTEN_PORT
│   ├─ OAuth on same domain as app, or host auth inside AppSail
│   ├─ Do not store durable state on container filesystem
│   └─ Debug crashes → Console AppSail logs (MCP may not show container output)
│
├─ DATA STORE / ZCQL?
│   ├─ In Job function? → admin scope model first
│   ├─ Paginate — 300 row SELECT cap
│   ├─ Wide SELECT? → max 20 columns
│   └─ Large read in Job? → Bulk Read API
│
├─ OAUTH / AUTH?
│   ├─ Same domain for session cookie? (Functions vs AppSail vs Slate)
│   ├─ Advanced I/O app secret? → custom header, not Authorization Bearer
│   └─ ZAID differs Dev vs Prod
│
├─ STRATUS?
│   └─ Deterministic keys may need explicit overwrite semantics (confirm in docs/issues)
│
├─ DEBUGGING / MCP?
│   ├─ Logs empty? → try Console before concluding no activity
│   └─ COUNT(*) quirks → try COUNT(ROWID)
│
└─ NEW PROJECT ARCHITECTURE?
    ├─ Vector-heavy? → confirm Catalyst fit before defaulting to Data Store
    ├─ High write volume doc sync? → estimate Data Store / Stratus fit
    └─ Deprecations: Stratus not File Store; Signals not Event Listeners; Job Scheduling not Cron
```

After picking a branch: load `agent-mental-models.md` for that area, then `agent-workflow-checklists.md`, then the specific service reference file.
