---
name: catalyst-nosql
description: "Catalyst NoSQL — key-value table store with typed items built via NoSQLItem builder. Partition key required. Trigger on 'NoSQL', 'nosql.table', 'insertItems', 'fetchItem', 'updateItems', 'deleteItems', 'queryTable', 'NoSQLItem', 'document storage', 'flexible schema', or 'Catalyst document database'. Do NOT use when you need SQL joins, ZCQL queries, or a fixed relational schema — use catalyst-datastore instead."
metadata:
  version: "2.1.0"
---

## How It Works

1. **NoSQL vs Data Store** — If the user is undecided, apply this matrix:

   | | Catalyst Data Store | Catalyst NoSQL |
   |---|---|---|
   | Schema | Fixed, defined upfront | Flexible, per-item (no uniform structure required) |
   | Query | ZCQL (SQL-like joins and filters) | Partition key + optional sort key |
   | Data type | Structured, relational rows | Unstructured/semi-structured, JSON-format |
   | Priority | ACID compliance, complex queries | High scalability, high write throughput |

   **Rule:** If the user says "ZCQL", "join", "relational", or "fixed schema" — stop and load `catalyst-datastore` instead.
2. **Load `references/nosql-basics.md`** — for SDK operations (`insertItems`, `fetchItem`, `updateItems`, `deleteItems`, `queryTable`) and the `NoSQLItem` builder.
3. **Answer** — Provide the SDK method call with the correct table name, partition-key attribute, and `NoSQLItem` construction.

## Triggers

Use this skill for: "NoSQL", "document storage", `nosql.table`, `insertItems`, `fetchItem`, `updateItems`, `deleteItems`, `queryTable`, `NoSQLItem`, "NoSQL vs Data Store", "flexible schema", "Catalyst document database", "schemaless data on Catalyst", or "nested objects in Catalyst".

## References

| Reference | Load when the query is about… |
|-----------|-------------------------------|
| `references/nosql-basics.md` | SDK operations (`insertItems`, `fetchItem`, `updateItems`, `deleteItems`, `queryTable`), `NoSQLItem` builder, partition-key model, NoSQL vs Data Store decision table |
