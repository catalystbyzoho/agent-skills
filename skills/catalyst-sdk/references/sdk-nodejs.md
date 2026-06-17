Install: `npm install zcatalyst-sdk-node`

> Use version 2.5.0 or later. All earlier versions are deprecated.

---

## Initialization

```javascript
const catalyst = require('zcatalyst-sdk-node');

// Advanced I/O (Express)
app.post('/api/action', async (req, res) => {
  const catalystApp = catalyst.initialize(req);
});

// Basic I/O
module.exports = async (context, basicIO) => {
  const catalystApp = catalyst.initialize(context);
  basicIO.write(JSON.stringify({ status: 'ok' }));
  context.close();
};

// Event function
module.exports = async (event, context) => {
  const catalystApp = catalyst.initialize(context);
  // event.data = event payload
  context.close();
};

// Cron function
module.exports = async (cronDetails, context) => {
  const catalystApp = catalyst.initialize(context);
  context.close();
};

// Job function — MUST use admin scope; USER token is absent in the Job runtime
module.exports = async (jobData, context) => {
  const catalystApp = catalyst.initialize(context, { scope: 'admin' });
  context.closeWithSuccess();
};

// Admin scope (bypass row-level permissions)
const adminApp = catalyst.initialize(req, { scope: 'admin' });

// User scope
const userApp = catalyst.initialize(req, { scope: 'user' });
```

---

## Data Store

```javascript
const table = catalystApp.datastore().table('Shipments');

// Insert single row
const row = await table.insertRow({ Name: 'Alice', Email: 'alice@example.com' });
// row.ROWID is the auto-generated unique identifier

// Insert multiple rows
const rows = await table.insertRows([
  { Name: 'Bob', Email: 'bob@example.com' },
  { Name: 'Carol', Email: 'carol@example.com' }
]);

// Get single row by ROWID
const singleRow = await table.getRow('123456000000012345');

// Paginated rows (max 200 per page)
const result = await table.getPagedRows({ nextToken: null, maxRows: 100 });
const data = result.data;
const hasMore = result.more_records;
const nextToken = result.next_token;

// Update row (ROWID required)
const updated = await table.updateRow({ ROWID: '123456000000012345', Name: 'Alice Updated' });

// Delete row
await table.deleteRow('123456000000012345');

// Bulk delete (max 200 per call)
await table.deleteRows(['123456000000012345', '123456000000012346']);
```

---

## ZCQL

```javascript
const zcql = catalystApp.zcql();

const rows = await zcql.executeZCQLQuery("SELECT * FROM Shipments WHERE Status = 'Active'");

// INSERT/UPDATE/DELETE via ZCQL
await zcql.executeZCQLQuery("INSERT INTO Shipments (Name, Status) VALUES ('Package A', 'Pending')");
await zcql.executeZCQLQuery("UPDATE Shipments SET Status = 'Shipped' WHERE ROWID = '12345'");
await zcql.executeZCQLQuery("DELETE FROM Shipments WHERE ROWID = '12345'");

// OLAP (aggregations)
const stats = await zcql.executeOLAPQuery('SELECT Status, COUNT(ROWID) AS cnt FROM Shipments GROUP BY Status');
```

---

## Cache

```javascript
const segment = catalystApp.cache().segment(segmentId);

await segment.put('key', 'value');                        // default 48h TTL
await segment.put('key', 'value', 3600000);               // 1 hour TTL (ms)
const value = await segment.getValue('key');               // string value
const item = await segment.get('key');                     // full cache item
await segment.update('key', 'newValue');
await segment.delete('key');                               // sets to null, doesn't remove key
```

---

## Stratus (Object Storage)

```javascript
const bucket = catalystApp.stratus().bucket('myapp-files-70699');

// ⚠️ Bucket names are globally unique across ALL Catalyst projects

// List objects
const pagedResult = await bucket.listPagedObjects({ prefix: 'uploads/', maxKeys: 100 });
for await (const obj of bucket.listIterableObjects({ prefix: 'uploads/' })) { ... }

// HEAD (check if exists) — returns true/false boolean
const exists = await bucket.headObject('uploads/file.pdf');
const existsSafe = await bucket.headObject('uploads/file.pdf', { throwErr: false }); // false if missing, true if exists

// Download
const stream = await bucket.getObject('uploads/file.pdf');
stream.pipe(res);

// Upload
const fs = require('fs');
await bucket.putObject('uploads/file.pdf', fs.createReadStream('/path/to/file.pdf'));
await bucket.putObject('uploads/file.pdf', fs.createReadStream('/path'), {
  overwrite: true, ttl: 86400,
  metaData: { uploadedBy: 'automation' }
});

// Multipart (for files >= 100 MB) — methods are directly on bucket, no .multipart() wrapper
const initRes = await bucket.initiateMultipartUpload('uploads/huge.mp4');
const uploadId = initRes['upload_id'];  // snake_case, not uploadId
await bucket.uploadPart('uploads/huge.mp4', uploadId, fs.createReadStream('/path/part1'), 1);
await bucket.completeMultipartUpload('uploads/huge.mp4', uploadId);  // no parts array needed

// Pre-signed URLs — positional: (key, action, options?); returns { signature: url }
const getResult = await bucket.generatePreSignedUrl('uploads/file.pdf', 'GET', { expiryIn: 3600 });
const getUrl = getResult.signature;
const putResult = await bucket.generatePreSignedUrl('uploads/new.pdf', 'PUT', { expiryIn: 3600 });
const putUrl = putResult.signature;

// Delete
await bucket.deleteObject('uploads/file.pdf');
await bucket.deleteObjects([{ key: 'file1.pdf' }, { key: 'file2.pdf' }]);
await bucket.deletePath('uploads/temp/');

// Rename / move
await bucket.renameObject('uploads/old-name.pdf', 'uploads/new-name.pdf');
```

---

## Auth / User Management

```javascript
const userManagement = catalystApp.userManagement();

const currentUser = await userManagement.getCurrentUser();  // null for collaborators
const user = await userManagement.getUserDetails(userId);
const allUsers = await userManagement.getAllUsers();
await userManagement.deleteUser(userId);

const newUser = await userManagement.registerUser({
  first_name: 'John', last_name: 'Doe',
  email_id: 'john@example.com',
  role_id: '123456000000007003'
});
```

---

## Email

```javascript
await catalystApp.email().sendMail({
  from_email: 'noreply@yourdomain.com',
  to_email: ['recipient@example.com'],
  cc: ['cc@example.com'],
  subject: 'Order Confirmation',
  content: '<h1>Thank you!</h1>',
  attachments: [{ name: 'invoice.pdf', content: fs.createReadStream('/path/invoice.pdf') }]
});
```

---

## NoSQL

```javascript
const nosql = catalystApp.nosql();
const { NoSQLItem } = require('zcatalyst-sdk-node/lib/no-sql');
const table = nosql.table('SessionStore');

// Build item with typed builder methods — no item.put(); no plain JSON
const item = new NoSQLItem()
  .addString('userId', 'user_001')   // partition key
  .addNumber('loginTime', Date.now());

// insertItems takes an object { item }, NOT an array
await table.insertItems({ item });

// fetchItem (singular) — keys is a NoSQLItem identifying the record
const fetched = await table.fetchItem({
  keys: [new NoSQLItem().addString('userId', 'user_001')]
});

const queryResult = await table.queryTable({
  partitionKey: { name: 'userId', value: 'user_001' },
  sortKey: { name: 'loginTime', operator: 'GREATERTHAN', value: 1700000000000 },
  limit: 50, ascending: true
});
// Operators: EQUALS, BETWEEN, GREATERTHAN, LESSERTHAN, GREATERTHANOREQUALTO, LESSERTHANOREQUALTO

await table.updateItems([item]);
await table.deleteItems([{ partitionKey: 'user_001', sortKey: 1700000000001 }]);
```

---

## Job Scheduling

```javascript
const jobScheduling = catalystApp.jobScheduling();
const cron = jobScheduling.cron();

// Create crons
const oneTimeCron = await cron.createCron({
  cron_name: 'one-time-report', jobpool_name: 'ReportPool',
  cron_type: 'OneTime', schedule: { time: '2025-12-31T23:59:00Z' }
});

const periodicCron = await cron.createCron({
  cron_name: 'health-check', jobpool_name: 'MonitorPool',
  cron_type: 'Periodic', schedule: { every: 15, unit: 'minutes' }
});

const dailyCron = await cron.createCron({
  cron_name: 'daily-digest', jobpool_name: 'EmailPool',
  cron_type: 'Calendar',
  schedule: { time: '09:00', timezone: 'Asia/Kolkata', days_of_week: ['MON','TUE','WED','THU','FRI'] }
});

const exprCron = await cron.createCron({
  cron_name: 'custom', jobpool_name: 'CustomPool',
  cron_type: 'CronExpression', schedule: { cron_expression: '0 */6 * * *' }
});

// Cron management
await cron.pauseCron(cronId);
await cron.resumeCron(cronId);
await cron.runCron(cronId);     // manual trigger
await cron.deleteCron(cronId);

// Submit an immediate job
// Step 1: get a jobpool instance by name — you must do this first, there is no default.
// job_name: alphanumeric and underscores only — hyphens are rejected.
const jobpool = await jobScheduling.getJobpool({ name: 'OrderPool' });
const job = await jobpool.submitJob({
  job_name: 'process_orders',       // alphanumeric + underscores only
  target_type: 'Function',
  target_name: 'ProcessOrderFunction', // or use target_id
  params: { batchSize: 50 },
  job_config: { number_of_retries: 2, retry_interval: String(15 * 60 * 1000) }
});
```

---

## Circuits

```javascript
const circuit = catalystApp.circuit();
const result = await circuit.execute(circuitId, { key1: 'value1' });
```

---

## Connections

```javascript
const credentials = await catalystApp.connections().getConnectionCredentials('ZohoCRM');
// credentials.access_token = OAuth access token
```

---

## Search

```javascript
const results = await catalystApp.search().executeSearchQuery({
  search: 'shipping delayed',
  search_table_columns: { Shipments: ['TrackingNotes'], Orders: ['CustomerName'] }
});
```

---

## Push Notifications

```javascript
const webNotif = catalystApp.pushNotification().web();
await webNotif.sendNotification({ message: 'Your order shipped!', recipients: [userId1] });

const mobileNotif = catalystApp.pushNotification().mobile(appId);
await mobileNotif.sendAndroidNotification({ message: 'Update available', recipients: [userId] });
await mobileNotif.sendIOSNotification({ message: 'Update available', recipients: [userId], badge_count: 1 });
```

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| DataStore/ZCQL silently hangs in Job functions | `catalyst.initialize(context)` without `scope: 'admin'` makes unauthenticated requests that stall 60 s each, silently burning toward the 15-minute timeout | Use `catalyst.initialize(context, { scope: 'admin' })` in all Job/Event/Cron functions that access DataStore or ZCQL |
| `getCurrentUser()` throws in admin scope | `getCurrentUser()` requires user credentials; admin scope has none | Switch to user scope: `catalyst.initialize(req)` before calling `getCurrentUser()` |
```
