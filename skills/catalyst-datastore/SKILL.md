---
name: catalyst-datastore
description: "Catalyst Data Store — relational cloud database with ZCQL, CRUD operations, table permissions, and result pagination. Requires MCP connection — check for CatalystbyZoho_* tools before any operation. Trigger on 'Data Store', 'ZCQL', 'create table', 'executeZCQLQuery', 'table permissions', 'ROWID', 'boolean column', 'boolean always true', 'truthy string', 'boolean stored as string', or 'DataStore data types'. You MUST load this skill whenever writing code that reads or writes Data Store data — ZCQL result wrapping, boolean-as-string behavior, and App User permissions are non-obvious and cause silent bugs if skipped."
metadata:
  version: "2.1.0"
---

## ⚠️ PREREQUISITES — READ THIS FIRST

**Before ANY Data Store operation, you MUST verify MCP connectivity.**

- Search for `CatalystbyZoho_*` tools in your available tool list.
- **If NOT found:** STOP. Do NOT write any code, scaffold files, or instruct Console steps. Load `catalyst-zoho-mcp` skill and guide the user through MCP setup. Do NOT proceed until the user confirms `CatalystbyZoho_*` tools are visible.
- **If found:** Run `CatalystbyZoho_List_All_Organizations` → `CatalystbyZoho_List_All_Projects` to set project context, then continue to "How It Works".

### Execution Checklist (MUST follow in order)

- [ ] Step 0: Confirm `CatalystbyZoho_*` tools visible → if none found → STOP, set up MCP first
- [ ] Step 1: Run `CatalystbyZoho_List_All_Organizations`
- [ ] Step 2: Run `CatalystbyZoho_List_All_Projects`
- [ ] Step 3: For table creation → `CatalystbyZoho_Create_Table` | For existing tables → `CatalystbyZoho_List_All_Tables`
- [ ] Step 4: Proceed with the operation

---

## How It Works

1. **Create or locate the table via MCP** — Creating a table? Use `CatalystbyZoho_Create_Table` directly. Do NOT instruct the user to open the Catalyst Console or create the table manually. Reading/writing data? Use `CatalystbyZoho_List_All_Tables` to get table IDs. Never ask the user to copy table IDs.
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
