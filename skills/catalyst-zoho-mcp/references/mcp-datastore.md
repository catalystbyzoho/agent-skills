# DataStore Operations via MCP

Use `CatalystbyZoho_*` tools to create and manage DataStore tables and columns without writing SDK code.

## Pre-flight

Always run the org → project → tables sequence before any DataStore MCP operation:

1. `CatalystbyZoho_List_All_Organizations` → get org ID
2. `CatalystbyZoho_List_All_Projects` (with org ID) → get project ID
3. `CatalystbyZoho_List_All_Tables` → verify access and get table IDs

## CatalystbyZoho_Create_Column

Creates one or more columns in an existing DataStore table. Supports batch creation (array of column objects).

**Required path variables:**
- `projectId`: Catalyst project ID
- `id`: Table ID — note this is `id`, NOT `tableId`

**Column type examples:**

```json
// Text column — max_length supported; search_index_enabled NOT supported
{ "column_name": "description", "data_type": "text", "is_mandatory": "false", "max_length": 1000, "audit_consent": "false" }

// Bigint column — requires is_unique; supports search_index_enabled
{ "column_name": "count", "data_type": "bigint", "default_value": "0", "is_mandatory": "false", "is_unique": "false", "search_index_enabled": "false", "audit_consent": "false" }

// Email column
{ "column_name": "email", "data_type": "email", "is_mandatory": "true", "is_unique": "true", "search_index_enabled": "false", "audit_consent": "false" }
```

**All boolean-like fields take string values:** `"true"` / `"false"` — not JSON booleans.

**Batch creation payload shape:**

```json
{
  "body": [
    { "column_name": "name", "data_type": "text", "is_mandatory": "true", "max_length": 255, "audit_consent": "false" },
    { "column_name": "email", "data_type": "email", "is_mandatory": "true", "is_unique": "true", "audit_consent": "false" }
  ],
  "headers": { "Catalyst-org": 928993403, "Environment": "Development" },
  "path_variables": { "projectId": "85698000000014039", "id": "85698000000018006" }
}
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Text column cannot be search indexed` | `search_index_enabled` passed for a text column | Omit `search_index_enabled` for `text` data type |
| `Missing required field is_unique` | `bigint` type requires `is_unique` | Add `"is_unique": "false"` (or `"true"`) to the column object |
| `Invalid max_length for bigint` | `max_length` only applies to text/email types | Remove `max_length` from non-text column objects |
| Column path variable wrong | Passing `tableId` instead of `id` in path_variables | Use `"id"` as the key name, not `"tableId"` |
