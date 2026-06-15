> **⚠️ PRE-FLIGHT CHECK:** Before writing any function code, confirm `.catalystrc` and `catalyst.json`
> exist. If not, STOP and tell the user to run `catalyst init` first.

---

## Function Types Overview

| Type | Invocation | Handler Args (Node.js) | SDK Init |
|------|-----------|----------------------|----------|
| Basic I/O | HTTP GET | `(context, basicIO)` | `catalyst.initialize(context)` |
| Advanced I/O | HTTP any method | `(req, res)` | `catalyst.initialize(req)` |
| Event | Signals/Event Listeners | `(event, context)` | `catalyst.initialize(context)` |
| Cron | Scheduled | `(cronDetails, context)` | `catalyst.initialize(context)` |
| Integration | Zoho service triggers | `(event, context)` | `catalyst.initialize(context)` |
| Job | Job Scheduling | `(jobData, context)` | `catalyst.initialize(context, { scope: 'admin' })` |
| Browser Logic | SmartBrowz | `(catalystApp, context, browserData)` | Pre-initialized |

**Critical:** never copy code between function types. Each type has a different handler signature and initialization pattern. Always start from the correct template.

---

## Execution Limits

| Function Type | Timeout | Behavior |
|---------------|---------|----------|
| Basic I/O | 30 seconds | Returns 504 |
| Advanced I/O | 30 seconds | Returns 504 |
| Event | 15 minutes | Silently terminated |
| Cron | 15 minutes | Marked as failed |
| Integration | 30 seconds | Error to calling Zoho service |
| Job | 15 minutes | Marked as failed |
| Browser Logic | 30 seconds | Browser instance terminated |

For tasks exceeding 30s, use Event/Job/Cron (15-min limit).
For tasks exceeding 15 min, use AppSail (no timeout).

---

## Basic I/O Function Template (Node.js)

```javascript
// functions/my_basic_io/index.js
'use strict';
const catalyst = require('zcatalyst-sdk-node');

module.exports = (context, basicIO) => {
  try {
    const catalystApp = catalyst.initialize(context);
    const inputData = context.getArgument();
    const result = `Processed: ${inputData}`;
    basicIO.write(result);  // Can only call write() ONCE
  } catch (error) {
    console.error('Error:', error);
    basicIO.write(JSON.stringify({ error: error.message }));
  }
};
```

Invocation: `GET /server/my_basic_io/execute?args=<input_string>`

Limitations:
- Returns **STRING only** — use Advanced I/O for JSON responses.
- `basicIO.write()` can only be called **once** per execution.
- Does NOT support HTTP headers or status codes.

---

## Advanced I/O Function Template (Node.js)

> **Raw-http template (default).** `req` is raw `http.IncomingMessage`, `res` is raw `http.ServerResponse`.
> Use `res.writeHead()`/`res.end()` — NOT Express methods like `res.status()` or `res.json()`.
> If you want Express-style API (`req.body`, `res.json()`, middleware), select the **Express template** at function creation time.

```javascript
// functions/my_api/index.js
'use strict';
const catalyst = require('zcatalyst-sdk-node');

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function getBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    if (req.body && typeof req.body === 'string') {
      try { return resolve(JSON.parse(req.body)); } catch (e) { return resolve({}); }
    }
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { resolve({}); }
    });
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  try {
    const catalystApp = catalyst.initialize(req);
    const method = req.method;
    const parsedUrl = new URL(req.url, `https://${req.headers.host}`);
    const query = Object.fromEntries(parsedUrl.searchParams);

    if (method === 'GET') {
      sendJson(res, 200, { message: 'GET request', id: query.id });
    } else if (method === 'POST') {
      const body = await getBody(req);
      sendJson(res, 201, { message: 'Created', data: body });
    } else if (method === 'PUT') {
      const body = await getBody(req);
      sendJson(res, 200, { message: 'Updated', data: body });
    } else if (method === 'DELETE') {
      sendJson(res, 200, { message: 'Deleted' });
    } else {
      sendJson(res, 405, { error: 'Method not allowed' });
    }
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
};
```

> **Legacy projects (node14/16/18)** use 4-parameter signature:
> `module.exports = (catalystApp, context, req, res) => { ... }`
> New CLI-initialized projects (node20+) use the 2-parameter format shown above.

### User-scope vs admin-scope

```javascript
// USER SCOPE — for resolving user identity only
const userApp = catalyst.initialize(req);
const currentUser = await userApp.userManagement().getCurrentUser();
// Only works for registered app users, NOT collaborators/admins.

// ADMIN SCOPE — for all data operations
const adminApp = catalyst.initialize(req, { scope: 'admin' });
const dataStore = adminApp.datastore();
const zcql = adminApp.zcql();
```

**Never use admin-scope for `getCurrentUser()`** — it throws "no user credentials present".

### CORS for Slate → Function cross-domain

**Do NOT set CORS headers in your function for production origins.** The Catalyst gateway injects
them automatically (if Slate domain is in Authorized Domains → CORS toggle enabled).

Only set CORS headers for `localhost` (local dev):

```javascript
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  }
  next();
});
```

### HTTP payload limits
- Request body: **250 MB**
- Response body: **250 MB**

---

## Event Function Template

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

```javascript
'use strict';
const catalyst = require('zcatalyst-sdk-node');

module.exports = async (jobData, context) => {
  try {
    // ALWAYS use admin scope — Job functions have no USER token.
    // Using user scope (or omitting scope) for DataStore operations will
    // silently hang with unauthenticated requests until the 15-min timeout.
    const catalystApp = catalyst.initialize(context, { scope: 'admin' });
    const jobDetails = jobData.getAllJobParams();
    const maxMs = context.getMaxExecutionTimeMs(); // 15 minutes

    // DataStore operations — safe with admin scope
    const zcql = catalystApp.zcql();
    const rows = await zcql.executeZCQLQuery('SELECT * FROM MyTable LIMIT 0, 300');

    context.closeWithSuccess();
  } catch (error) {
    context.closeWithFailure();
  }
};
```

> ⚠️ **DataStore SDK in Job functions (Node.js):** Initialize with `{ scope: 'admin' }`. Without it, `zcql()` and `datastore()` methods make unauthenticated requests that silently hang for up to 60 s per attempt and burn toward the 15-minute timeout. The 15-minute limit is the same whether the job is scheduled, triggered from the Console, or submitted via the API.

---

## Integration Function Template

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

## SDK Setup

```bash
npm install zcatalyst-sdk-node
```

```javascript
// All components via catalystApp:
const dataStore = catalystApp.datastore();
const table = dataStore.table('TableName');
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

---

## Security Rules

- **`optional`** — Anyone can invoke the function (public access). This is the default.
- **`required`** — Only authenticated users can invoke.

⚠️ Values like `no_auth`, `user_auth`, `admin_auth` do NOT exist.

Security Rules are binary (public vs authenticated). For admin-only or per-route control, use API Gateway instead.

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

Design background function handlers to be **idempotent** (safe to run multiple times).

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

| Mistake | Fix |
|---------|-----|
| `res.status()` / `res.json()` in node20 | Use `res.writeHead()` + `res.end()` |
| `req.body` undefined | Manually parse with `getBody()` helper |
| `req.query` undefined | Use `new URL(req.url, ...).searchParams` |
| `basicIO.write()` called twice | Can only be called once per execution |
| Admin-scope for `getCurrentUser()` | Use user-scope: `catalyst.initialize(req)` |
| `req.headers['authorization']` is undefined | Gateway strips it; use `catalyst.initialize(req)` |
| Using `cors()` middleware with Slate | Gateway owns CORS for production origins |
| `new Date(row.CREATEDTIME)` wrong timezone | Append timezone offset before parsing |
| Inserting emoji into Data Store | Store a string key instead |
| Not paginating ZCQL | Max 300 rows per query; use `LIMIT offset, count` |
| `is_deployed: false` in API responses | Not a reliable deployment indicator — all functions return this value regardless of whether they are live; verify status in the Console instead |
| DataStore/ZCQL silently hangs in Job/Event/Cron functions | `catalyst.initialize(context)` without `scope: 'admin'` makes unauthenticated requests that stall 60 s each | Add `{ scope: 'admin' }`: `catalyst.initialize(context, { scope: 'admin' })` |
| Need to read >300 rows in a Job function | ZCQL cap is 300 rows; paginating inside a 15-min limit is risky for large tables | Use the Bulk Read REST API (async CSV job) for large-volume reads outside the function |
