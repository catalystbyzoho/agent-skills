---
name: catalyst-datastore
description: "Catalyst Data Store — relational cloud database with ZCQL, CRUD operations, table permissions, and result pagination. Trigger on 'Data Store', 'ZCQL', 'create table', 'executeZCQLQuery', 'table permissions', or 'ROWID'. You MUST load this skill whenever writing code that reads or writes Data Store data — ZCQL result wrapping and App User permissions are non-obvious and cause silent bugs if skipped."
metadata:
  version: "2.0.0"
---

## How It Works

1. **MCP check** — If `CatalystbyZoho_*` tools are available, use `CatalystbyZoho_List_All_Tables` to get table IDs. Never ask the user to copy table IDs.
2. **Load `references/datastore-basics.md`** — for CRUD operations, ZCQL syntax, result unwrapping, and permissions setup.
3. **Unwrap ZCQL results** — Always remind: `rows.map(r => r.TableName)`. Raw ZCQL results are wrapped; accessing without unwrapping is the #1 Data Store bug.
4. **Permissions** — App User permissions are OFF by default. If the query involves a logged-in user reading data, check Console → Table → Scopes & Permissions.
5. **Pagination** — ZCQL max 300 rows per query. Use `LIMIT offset, count` for larger datasets.

## Security Checklist

- **App User write permissions are off by default.** The App User role has SELECT enabled by default, but INSERT, UPDATE, and DELETE must be manually enabled per table. Go to Console → Table → Scopes and Permissions → App User role → check Insert/Update/Delete for any table your authenticated users need to write.
- **App Administrator has all permissions by default.** Never assign the App Administrator role to regular end-users — it grants full read/write/delete access to all tables.

## Triggers

Use this skill for: "Data Store", "ZCQL", "catalyst table", "create table", "query data", `executeZCQLQuery`, "table permissions", "App User permissions", "ROWID", "CREATEDTIME", "Data Store CRUD", "JOIN in ZCQL", "pagination ZCQL", "data store column types", "insert row", "update row", "delete row", or "relational data on Catalyst".

## References

| Reference | Load when the query is about… |
|-----------|-------------------------------|
| `references/datastore-basics.md` | CRUD, ZCQL queries, result unwrapping, pagination, column types, App User permissions setup, CREATEDTIME timezone gotcha, emoji limitation |
