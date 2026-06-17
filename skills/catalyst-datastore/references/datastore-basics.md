> **⚠️ PRE-FLIGHT CHECK:** Confirm `.catalystrc` and `catalyst.json` exist before writing any code.

## System Columns (auto-managed, in every table)

- `ROWID` — unique row identifier (bigint, auto-increment)
- `CREATORID` — user ID of the creator
- `CREATEDTIME` — timestamp of creation (project timezone, no UTC offset)
- `MODIFIEDTIME` — timestamp of last modification

**Never create these columns** — Catalyst adds them automatically.

---

## CRUD Operations (Node.js SDK)

```javascript
const table = catalystApp.datastore().table('Employees');
// or by ID: catalystApp.datastore().table(TABLE_ID)
// TABLE_ID from Console → Cloud Scale → Data Store → click table

// INSERT
const row = await table.insertRow({
  Name: 'Alice',
  Email: 'alice@example.com',
  Department: 'Engineering',
  Salary: 85000
});
console.log('Inserted ROWID:', row.ROWID);

// GET by ROWID
const row = await table.getRow(ROWID);

// GET all rows (paginated) — use getPagedRows(), NOT getAllRows() which is deprecated
// Default page size: 200 rows. maxRows is optional.
// Response shape: { data, next_token, more_records }
// data rows are already flat — NO table-name wrapper (unlike ZCQL results)
function fetchAllRows(nextToken = undefined) {
  table.getPagedRows({ nextToken, maxRows: 200 })
    .then(({ data, next_token, more_records }) => {
      console.log('rows:', data);
      // data: [{ ROWID, CREATORID, CREATEDTIME, Name, ... }, ...]
      if (more_records) fetchAllRows(next_token);
    });
}

// UPDATE (must include ROWID)
const updated = await table.updateRow({ ROWID: '12345', Salary: 90000 });

// DELETE
await table.deleteRow(ROWID);

// BULK INSERT (up to 200 rows)
const rows = await table.insertRows([
  { Name: 'Bob', Email: 'bob@example.com' },
  { Name: 'Carol', Email: 'carol@example.com' }
]);

// BULK UPDATE (each must have ROWID)
await table.updateRows([
  { ROWID: '123', Name: 'Robert' },
  { ROWID: '456', Name: 'Caroline' }
]);

// BULK DELETE
await table.deleteRows([ROWID_1, ROWID_2]);
```

---

## ZCQL

Catalyst's SQL-like query language.

```javascript
const zcql = catalystApp.zcql();

// SELECT
const result = await zcql.executeZCQLQuery(
  "SELECT * FROM Employees WHERE Department = 'Engineering'"
);

// INSERT
await zcql.executeZCQLQuery(
  "INSERT INTO Employees (Name, Email) VALUES ('Dave', 'dave@example.com')"
);

// UPDATE
await zcql.executeZCQLQuery(
  "UPDATE Employees SET Salary = 95000 WHERE ROWID = 12345"
);

// DELETE
await zcql.executeZCQLQuery(
  "DELETE FROM Employees WHERE Department = 'Obsolete'"
);

// Aggregate
const result = await zcql.executeZCQLQuery(
  "SELECT COUNT(ROWID) AS total, AVG(Salary) AS avg_salary FROM Employees"
);
```

### Result Unwrapping

`executeZCQLQuery` wraps results under the table name key:

```javascript
const result = await zcql.executeZCQLQuery("SELECT * FROM Employees");
// Raw: [{ Employees: { ROWID: "123", Name: "Alice" } }, ...]

// Unwrap:
const rows = result.map(r => r.Employees).filter(Boolean);

// Generic helper:
function unwrapZcql(result, tableName) {
  return result.map(r => r[tableName]).filter(Boolean);
}
```

The table name key is **case-sensitive** and must match the console exactly.

### ZCQL Differences from SQL

- Table/column names are **case-sensitive**
- String values use **single quotes only**
- No multi-statement transactions (no BEGIN/COMMIT/ROLLBACK)
- Maximum **300 rows** per query — paginate with `LIMIT offset, count`
- Maximum **20 columns** per SELECT — use explicit column names on tables with > 20 columns
- Supported: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, `LIKE`, `IN`, `NOT IN`, `BETWEEN`, `ORDER BY`, `GROUP BY`, `HAVING`, `COALESCE`, `DISTINCT`
- INNER JOIN and LEFT JOIN supported (same Data Store only)

### Pagination

```javascript
// Offset-based (preferred)
const PAGE_SIZE = 300;
let offset = 0;
let allResults = [];

while (true) {
  const batch = await zcql.executeZCQLQuery(
    `SELECT * FROM Employees ORDER BY ROWID LIMIT ${offset}, ${PAGE_SIZE}`
  );
  const rows = batch.map(r => r.Employees).filter(Boolean);
  if (rows.length === 0) break;
  allResults = allResults.concat(rows);
  if (rows.length < PAGE_SIZE) break;
  offset += PAGE_SIZE;
}
```

### JOINs

```sql
-- INNER JOIN
SELECT E.Name, D.DeptName
FROM Employees E
INNER JOIN Departments D ON E.DeptId = D.ROWID

-- LEFT JOIN
SELECT E.Name, D.DeptName
FROM Employees E
LEFT JOIN Departments D ON E.DeptId = D.ROWID
```

JOINs are subject to the same 300-row result limit.

---

## Column Types

- `varchar` — requires `max_length` (e.g., 255)
- `text` — large text, auto max 10,000 chars
- `int`, `bigint`, `double`, `decimal`
- `boolean`, `date`, `datetime`
- `foreign key` — requires `parent_table`, `parent_column`, `constraint_type`
- `encrypted text` — for sensitive data; `search_index_enabled` NOT allowed
- `text area` — for large text

---

## Data Store Permissions

By default, the App User role has **Read-only** access. Insert, Update, Delete operations return `"No privileges to perform this action"`.

**Fix Option 1 (console):**
Console → Data Store → {Table} → Permissions → App User → check Select, Insert, Update, Delete.

**Fix Option 2 (admin-scope SDK):**
```javascript
const adminApp = catalyst.initialize(req, { scope: 'admin' });
const dataStore = adminApp.datastore();
```

---

## CREATEDTIME Timezone Behavior

Catalyst stores `CREATEDTIME` in the **project's configured timezone** without a UTC offset marker. `new Date(row.CREATEDTIME)` treats it as UTC — causing off-by-hours errors.

```javascript
// WRONG:
const created = new Date(row.CREATEDTIME);

// CORRECT:
function parseCatalystTime(catalystTimestamp, tzOffsetMinutes) {
  // tzOffsetMinutes: positive = ahead of UTC. IST = +330
  const utcDate = new Date(catalystTimestamp.replace(' ', 'T').replace(/:(\d{3})$/, '.$1') + 'Z');
  return new Date(utcDate.getTime() - tzOffsetMinutes * 60 * 1000);
}
// For IST (UTC+5:30):
const created = parseCatalystTime(row.CREATEDTIME, 330);
```

---

## Emoji / 4-byte UTF-8

Data Store does NOT support emoji or 4-byte UTF-8 characters. They are silently stored as `?`.

```javascript
// Strip before inserting
function stripEmoji(str) {
  return str.replace(/[\u{10000}-\u{10FFFF}]/gu, '');
}
const safeName = stripEmoji(userInput);
await table.insertRow({ Name: safeName });
```

---

## Transactions

Data Store does NOT support multi-statement transactions.

**Workarounds:**
- Use single ZCQL statements for bulk operations
- Use optimistic concurrency: read `MODIFIEDTIME`, verify before writing
- Use Circuits for multi-step workflows with saga patterns — **US DC only**; Circuits is not available in EU, AU, IN, JP, SA, or CA data centers

> ⚠️ **DC restriction:** Circuits is **not available** in EU, AU, IN, JP, SA, or CA data centers.
> Before recommending Circuits, confirm the user's data center. For restricted DCs, use single ZCQL statements or optimistic concurrency instead.

---

## Concurrency Limits

- Default: **10 concurrent executions** per function per environment
- HTTP 429 returned when queue is full
- Contact Catalyst support to increase the limit

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `HTTP 429 Too Many Requests` on bulk write | Bulk write queue is full | Reduce batch size; implement exponential backoff; contact Catalyst support to increase limit |
| ZCQL returns fewer rows than expected | ZCQL SELECT hard limit is **300 rows** per query (not 200) | Paginate with `LIMIT offset, 300` — e.g., `LIMIT 0, 300`, then `LIMIT 300, 300`; for full-table scans use `getPagedRows()` (default: 200 rows per page; returns `{ data, next_token, more_records }`) |
| ZCQL silently hangs in Job/Cron/Event function | `catalyst.initialize(context)` without `scope: 'admin'` makes unauthenticated requests | Use `catalyst.initialize(context, { scope: 'admin' })` in non-HTTP function types |
| `Column not found` on insert | Column name case mismatch or column not yet created | Column names are case-sensitive; verify in Console → Data Store |
| `ZCQL query exceeds 20-column SELECT limit` | ZCQL limits SELECT to 20 columns per query | Split into multiple queries or use `SELECT *` (counts as 1) |
