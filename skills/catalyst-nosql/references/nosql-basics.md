## Overview

Catalyst NoSQL is a key-value store organized into **tables**. Each table requires a
**partition key** (and optionally a sort key) defined at creation time. Items are typed
attribute maps built with the `NoSQLItem` builder — not plain JSON objects.

> **Pre-requisite:** Create the table in the console (Console → Cloud Scale → NoSQL)
before writing SDK code. The table name and partition-key column name must be known.

## Data model

| Concept | Catalyst NoSQL |
|---------|----------------|
| Container | Table (not "collection") |
| Row | Item — typed attribute map |
| Primary key | Partition key (required) + optional sort key |
| Schema | Per-item flexible — any extra attributes allowed |
| Query | Partition-key equality condition (required) + optional filter |

## SDK Operations (Node.js)

```javascript
const { NoSQLItem, NoSQLMarshall, NoSQLEnum } = require('zcatalyst-sdk-node/lib/no-sql');
const { NoSQLOperator, NoSQLUpdateOperationType } = NoSQLEnum;

const nosql = catalystApp.nosql();
// nosql.table(name) returns an instance without an API call
const table = nosql.table('UserProfiles');
// Table name from Console → Cloud Scale → NoSQL

// --- INSERT ---
// insertItems(...items) — spread one or more INoSQLInsertItem objects
await table.insertItems({
  item: new NoSQLItem()
    .addString('userId', 'u123')        // partition key
    .addString('name', 'Alice')
    .addNumber('age', 30)
    .addBoolean('active', true)
});

// --- FETCH by key ---
// fetchItem({ keys }) — keys can be a single NoSQLItem or an array for batch fetch
const result = await table.fetchItem({
  keys: new NoSQLItem().addString('userId', 'u123')
});
// result.toJSON() → INoSQLResponse with result.create/get/update/delete arrays

// --- UPDATE ---
// updateItems(...updates) — keys identifies the item; update_attributes describes what to change
await table.updateItems({
  keys: new NoSQLItem().addString('userId', 'u123'),
  update_attributes: [
    {
      operation_type: NoSQLUpdateOperationType.PUT,
      attribute_path: ['name'],
      update_value: NoSQLMarshall.makeString('Alice Smith')
    }
  ]
});

// --- DELETE ---
// deleteItems(...deletes) — keys must include the partition key (and sort key if table has one)
await table.deleteItems({
  keys: new NoSQLItem().addString('userId', 'u123')
});

// --- QUERY ---
// queryTable({ key_condition, limit? }) — must include partition-key equality as condition
const queryResult = await table.queryTable({
  key_condition: {
    attribute: ['userId'],
    operator: NoSQLOperator.EQUALS,
    value: NoSQLMarshall.makeString('u123')
  },
  limit: 50
});
```

## NoSQLItem builder cheat-sheet

| Method | DynamoDB type | Example |
|--------|--------------|----------|
| `.addString(name, val)` | S | `.addString('city', 'NYC')` |
| `.addNumber(name, val)` | N | `.addNumber('score', 42)` |
| `.addBoolean(name, val)` | BOOL | `.addBoolean('active', true)` |
| `.addNull(name)` | NULL | `.addNull('deletedAt')` |
| `.addList(name, arr)` | L | `.addList('tags', [NoSQLMarshall.makeString('beta')])` |
| `.addMap(name, obj)` | M | `.addMap('meta', { src: NoSQLMarshall.makeString('web') })` |
| `NoSQLItem.from(obj)` | auto-marshall | `NoSQLItem.from({ userId: 'u1' })` |

## When to Use NoSQL vs Data Store

| Use NoSQL | Use Data Store |
|-----------|---------------|
| Flexible / evolving per-item attributes | Fixed schema with uniform columns |
| Nested maps or arrays in items | Flat tabular data |
| No complex joins needed | Joins or ZCQL queries required |
| High write throughput, key-value access | ACID compliance, relational access |

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `nosql.collection is not a function` | Using the old (wrong) API | Replace with `nosql.table(name)` — there is no `collection()` method |
| `table.insertDocument is not a function` | Using the old (wrong) API | Replace with `table.insertItems({ item: new NoSQLItem()... })` |
| Table not found / 404 | Table doesn't exist yet or name is wrong | Create via Console → NoSQL before running SDK code; names are case-sensitive |
| Insert returns 400 | Partition key attribute missing from `NoSQLItem` | Ensure the NoSQLItem includes the partition-key column defined in the Console |
| `queryTable` returns empty despite data existing | `key_condition.attribute` path wrong | Use the exact column name (case-sensitive) defined as the partition key in the Console |
