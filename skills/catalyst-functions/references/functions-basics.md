> **⚠️ PRE-FLIGHT CHECK (in order):**
>
> **Step 1 — MCP connection (MUST come first).**
> Check that `CatalystbyZoho_*` tools are available. If they are NOT, STOP immediately.
> Do NOT check for `.catalystrc`, do NOT run any CLI commands, do NOT scaffold any files.
> Guide the user to set up Zoho MCP first (see the SKILL.md setup instructions). Resume only after the user confirms MCP tools are visible.
>
> **Step 2 — Project context.**
> Run `CatalystbyZoho_List_All_Organizations` → `CatalystbyZoho_List_All_Projects` to confirm which project you are working in.
>
> **Step 3 — Local scaffold check.**
> Check whether `.catalystrc` and `catalyst.json` exist in the current directory.
> - **If they exist:** proceed.
> - **If they do NOT exist:** Do NOT run `catalyst init` yourself. The CLI uses interactive prompts (arrow-key menus, multi-select checkboxes) that cannot be reliably controlled from a terminal session. Instead, tell the user:
>
>   > Your project is not initialised yet. Please run the following command in your terminal and complete the prompts yourself, then come back:
>   > ```
>   > catalyst init
>   > ```
>   > When asked which features to set up, select **"Configure and deploy http/non-http functions"**. Once done, confirm here and I'll continue.
>
>   Wait for the user to confirm before proceeding.

## `catalyst-config.json` — `type` Field Values

The `type` field is set by the CLI when a function is created. **Do not change it manually** — it determines how Catalyst invokes the function.

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

Required `catalyst.json` schema for a functions project:

```json
{
  "functions": {
    "folder_path": "functions",
    "targets": ["<function-folder-name>"]
  }
}
```

- `folder_path` is the directory containing all function folders.
- `targets` lists each function folder name to be deployed.
- Add every new function folder to `targets` before running deploy.
- `catalyst.json` is project structure metadata; `catalyst-config.json` is per-function runtime/deployment configuration.

### Deployment Command Note

- Use `catalyst deploy --only functions:<function-name>` to deploy one function.
- `functions:<name>` targets a specific function by its folder name.
- Use `catalyst deploy --only functions` to deploy all functions at once.

---

## Function Types Overview

| Type | Invocation | Handler Args (Node.js) | SDK Init |
|------|-----------|----------------------|----------|
| Basic I/O | HTTP GET | `(context, basicIO)` | Optional (only if using Catalyst services) |
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
    // catalyst.initialize(context) — optional, only needed if using Catalyst services (DataStore, ZIA, etc.)
    const inputData = basicIO.getArgument('input');  // key name matches query param in URL
    const result = `Processed: ${inputData}`;
    basicIO.write(result);  // Can only call write() ONCE
  } catch (error) {
    console.error('Error:', error);
    basicIO.write(JSON.stringify({ error: error.message }));
  }
  context.close();  // REQUIRED — without this, Catalyst waits until timeout (408)
};
```

Invocation: `GET /server/my_basic_io/execute?input=<value>`

> The query param key (`input` here) must match the string you pass to `basicIO.getArgument()`. There is no special `args` key.

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
// Raw-http template — no app.use() or next() here. Add directly in your handler:
module.exports = async (req, res) => {
  const origin = req.headers.origin || '';
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  }
  // ... rest of your handler
};
```

> For Express template, use `app.use((req, res, next) => { ... next(); })` — see `functions-advanced.md`.

### HTTP payload limits
- Request body: **250 MB**
- Response body: **250 MB**

---

## Security Rules

- **`optional`** — Anyone can invoke the function (public access). This is the default.
- **`required`** — Only authenticated users can invoke.

⚠️ Values like `no_auth`, `user_auth`, `admin_auth` do NOT exist.

Security Rules are binary (public vs authenticated). For admin-only or per-route control, use API Gateway instead.
