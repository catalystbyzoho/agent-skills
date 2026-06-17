## Template Types: Express vs Raw-http

Advanced I/O functions support two templates. **The template is chosen at function creation
and determines the handler API surface.**

| | **Express template** | **Raw-http template** |
|---|---|---|
| Request | `req.query`, `req.params`, `req.body` (Express) | `new URL(req.url, base).searchParams` |
| Response | `res.status(200).json({})` | `res.writeHead(200); res.end(...)` |
| Middleware | `app.use(...)` works | No middleware — plain `http.IncomingMessage` |
| Use when | Familiar Express API | Minimal footprint, raw stream control |

> The examples in this file are labelled with their template type.

---

## File Upload via Advanced I/O Function (busboy)

<!-- Express template -->
Parse `multipart/form-data` file uploads using `busboy`. Install: `npm install busboy`.

```javascript
// Express template
const Busboy = require('busboy');
const catalyst = require('zcatalyst-sdk-node');

module.exports = async (catalystApp, context, req, res) => {
  const busboy = Busboy({ headers: req.headers });
  const chunks = [];
  let fileName = '';
  let mimeType = '';

  await new Promise((resolve, reject) => {
    busboy.on('file', (fieldname, file, info) => {
      fileName = info.filename;
      mimeType = info.mimeType;
      file.on('data', chunk => chunks.push(chunk));
      file.on('end', resolve);
      file.on('error', reject);
    });
    busboy.on('error', reject);
    req.pipe(busboy);
  });

  const fileBuffer = Buffer.concat(chunks);

  // Upload to Stratus
  const { Readable } = require('stream');
  const stream = Readable.from(fileBuffer);
  await catalystApp.stratus().bucket('myapp-files-70699')
    .putObject(`uploads/${fileName}`, stream);

  res.status(200).json({ status: 'uploaded', fileName });
};
```

> Use `"advancedio"` (lowercase, no space) as the `type` value in `catalyst-config.json`.

```json
{
  "deployment": {
    "name": "file_upload",
    "type": "advancedio",
    "stack": "node20",
    "env_variables": {}
  },
  "execution": {
    "main": "index.js"
  }
}
```

> `authentication`, `memory`, and `max_time` are **not** `catalyst-config.json` fields — configure them in the Catalyst console under Functions → Security Rules / Configuration.

---

## Stream a File from Stratus to Response

```javascript
// Express template
module.exports = async (catalystApp, context, req, res) => {
  const key = req.query.file;
  if (!key) return res.status(400).json({ error: 'file param required' });

  const bucket = catalystApp.stratus().bucket('myapp-files-70699');

  // HEAD check first
  const head = await bucket.headObject(key, { throwErr: false });
  if (!head) return res.status(404).json({ error: 'File not found' });

  res.setHeader('Content-Type', head.content_type || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${key.split('/').pop()}"`);

  const stream = await bucket.getObject(key);
  stream.pipe(res);
};
```

---

## Error Handling Pattern

Standard error response pattern for Advanced I/O functions:

```javascript
// Express template
module.exports = async (catalystApp, context, req, res) => {
  try {
    // ... your logic
    const result = await someOperation();
    res.status(200).json({ data: result });
  } catch (err) {
    console.error(JSON.stringify({
      action: 'myFunction',
      error: err.message,
      stack: err.stack
    }));

    // Classify error type
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    if (err.status === 404 || err.message?.includes('not found')) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};
```

---

## CORS for Local Dev

**This pattern is for the Express template only.**

**Do NOT add CORS headers in function code for production origins** — the Catalyst gateway handles this.
Only set CORS for `localhost` (local dev where no gateway exists):

```javascript
// Express template
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(204).end();
  }
  next();
});
```

---

## Testing Functions Locally (Mock Pattern)

Mock `http.ServerResponse` for unit testing Basic I/O functions:

```javascript
// test/myFunction.test.js
const handler = require('../functions/my_function/index.js');

async function runTest() {
  // Mock context (getArgument() lives on context, not basicIO)
  const context = {
    closeWithSuccess: () => console.log('SUCCESS'),
    closeWithFailure: (msg) => console.error('FAILURE:', msg),
    getArgument: () => JSON.stringify({ userId: '12345', action: 'test' })
  };

  // Mock basicIO (write() — not setOutput())
  const basicIO = {
    write: (result) => console.log('OUTPUT:', result)
  };

  await handler(context, basicIO);
}

runTest().catch(console.error);
```

For Advanced I/O (Express template), test against the actual local dev server:
```bash
catalyst serve
curl -X POST http://localhost:3000/server/my_function/execute \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

---

## Chaining Functions (Call One Function from Another)

**Anti-pattern:** Never call Advanced I/O functions via HTTP from other functions in production.

**Preferred patterns:**
1. **Shared module**: Extract common logic into `functions/utils/` and import it
2. **Circuits**: For multi-step orchestration
3. **Job Scheduling**: For async fan-out

```javascript
// functions/utils/dataHelper.js
async function getUserById(catalystApp, userId) {
  const rows = await catalystApp.zcql().executeZCQLQuery(
    `SELECT * FROM Users WHERE ROWID = '${userId}'`
  );
  return rows[0]?.Users || null;
}

module.exports = { getUserById };
```

```javascript
// functions/my_function/index.js
const { getUserById } = require('../utils/dataHelper');

module.exports = async (catalystApp, context, req, res) => {
  const user = await getUserById(catalystApp, req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
};
```

---

## Result Unwrapping (ZCQL)

ZCQL result rows are wrapped — always unwrap before accessing column values:

```javascript
const rows = await catalystApp.zcql().executeZCQLQuery('SELECT * FROM Tasks');

// Each row is: { Tasks: { ROWID: '...', Title: '...', ... } }
const tasks = rows.map(row => row.Tasks);  // ← Unwrap the table name wrapper

// For JOINs
const joinRows = await catalystApp.zcql().executeZCQLQuery(
  'SELECT * FROM Tasks JOIN Users ON Tasks.UserId = Users.ROWID'
);
const items = joinRows.map(row => ({ task: row.Tasks, user: row.Users }));
```

---

## HTTP Payload Limits

| Function Type | Max Request Body | Max Response Body |
|--------------|-----------------|------------------|
| Advanced I/O | 250 MB | 250 MB |
| Basic I/O | 250 MB | 250 MB |
| AppSail | No explicit limit (configurable) | No explicit limit |

For large uploads, consider using pre-signed Stratus URLs for direct browser → Stratus upload (bypasses the function entirely).

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `busboy` never emits `finish` event | Pipe not set up before response end | Ensure `req.pipe(bb)` and `finish` listener registered before piping |
| File upload silently truncated | Function memory limit exceeded mid-stream | Use pre-signed Stratus URL for files > 50 MB |
| Chained function call times out | Inner function cold start exceeds outer timeout | Use `invokeType: 'async'` for fire-and-forget; Job functions for long pipelines |
| `Cannot read properties of undefined (reading 'files')` | `express-fileupload` not added as middleware before route | Add `app.use(fileUpload())` before route definitions |

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

    const zcql = catalystApp.zcql();
    const rows = await zcql.executeZCQLQuery('SELECT * FROM MyTable LIMIT 0, 300');

    context.closeWithSuccess();
  } catch (error) {
    context.closeWithFailure();
  }
};
```

> ⚠️ **DataStore SDK in Job functions (Node.js):** Initialize with `{ scope: 'admin' }`. Without it, `zcql()` and `datastore()` methods make unauthenticated requests that silently hang for up to 60 s per attempt and burn toward the 15-minute timeout.

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
| `busboy` never emits `finish` event | Pipe not set up before response end or `req` not passed correctly | Ensure `req.pipe(bb)` and `finish` listener registered before piping |
| File upload silently truncated | Function memory limit exceeded mid-stream | Use pre-signed Stratus URL for files > 50 MB |
| Chained function call times out | Inner function cold start adds latency beyond outer timeout | Use `invokeType: 'async'` for fire-and-forget; Job functions for long pipelines |
| `Cannot read properties of undefined (reading 'files')` | `express-fileupload` not added as middleware before route | Add `app.use(fileUpload())` before route definitions |
