# Catalyst Console UI Guide

Step-by-step navigation for the most common console tasks.

> **Coverage note:** This guide documents the most commonly needed console flows. The following areas are **not yet documented here** and require consulting the [official Catalyst docs](https://docs.catalyst.zoho.com):
> - Hosted Authentication (ZAID configuration, OAuth providers, custom login pages)
> - Billing activation and plan upgrades
> - Cache segment creation (Cloud Scale → Cache → New Segment)
> - NoSQL collection and table creation (Cloud Scale → NoSQL)
> - Stratus bucket creation and IAM policy setup (Cloud Scale → Stratus)
> - Connections configuration (Connections → New Connection → OAuth provider setup)
> - Signals and Job Scheduling setup

---

## Finding Project ID, ZAID, and Table ID

### Project ID
1. Open [console.catalyst.zoho.com](https://console.catalyst.zoho.com/baas/index) and click your project
2. Look at the browser URL: `https://console.catalyst.zoho.com/baas/<ORG_ID>/project/<PROJECT_ID>/`
3. `PROJECT_ID` is the numeric segment after `/project/`

### ZAID (Zoho Application ID)
1. Console → your project → **Settings** → **App Settings**
2. `ZAID` is listed under **Application ID**

> **Critical:** ZAID differs between Development and Production environments.
> Always copy the ZAID for the environment you are configuring.

### Table ID
1. Console → your project → **Data Store** → click your table
2. Look at the browser URL: `.../datastore/<TABLE_ID>/table`
3. `TABLE_ID` is the numeric segment after `/datastore/`

---

## Creating a Data Store Table with Columns

1. Console → your project → **Data Store**
2. Click **Add Table** (top-right)
3. Enter a **table name** (e.g., `Tasks`) — names are case-sensitive in ZCQL
4. Click **Add Column** for each field you need:

   | Column type | SDK type | Notes |
   |------------|----------|-------|
   | `Text` | string | Default for most string fields |
   | `Number` | number | Integer or decimal |
   | `Boolean` | boolean | `true`/`false` |
   | `Date` | date | Date only (no time) |
   | `DateTime` | datetime | Full timestamp |
   | `Email` | string | Validated email format |
   | `File` | file reference | Link to Stratus/File Store object |

5. Save the table
6. `ROWID` is auto-created as the primary key — you cannot remove it

---

## Enabling App User Insert / Update / Delete (Scopes and Permissions)

By default, App Users (logged-in users) cannot write to Data Store tables. You must enable it explicitly.

1. Console → your project → **Data Store** → click your table
2. Click **Scopes and Permissions** (gear icon or tab, depending on UI version)
3. You'll see a matrix of roles vs operations:

   | Row | What it controls |
   |-----|-----------------|
   | **App User** | Operations available to authenticated end users via Web/Mobile SDK |
   | **App Administrator** | Operations available to admin users |

4. Check **Insert**, **Update**, **Delete** checkboxes in the **App User** row as needed
5. Click **Save**

> If you don't enable Insert and try to call `row.insert()` from the Web SDK, you get a 403 error.

---

## Authorized Domains + CORS Toggle

This controls which frontend origins are allowed to call your Catalyst functions via the API gateway.

1. Console → your project → **Settings** (gear icon in sidebar)
2. Click **Authorized Domains**
3. Click **Add Domain**
4. Enter the full origin with protocol: `https://myapp-12345.catalystapps.com`
   - Include `https://` — bare domains are rejected
   - For local dev, add `http://localhost:3000` separately
5. Toggle **CORS** to **ON** for the domain
6. Click **Save**

> Once a domain is in the Authorized Domains list with CORS enabled, the Catalyst gateway automatically
> injects the correct `Access-Control-Allow-Origin` headers. **You do NOT need CORS code in your functions
> for these production domains.**

---

## Connecting the Catalyst CLI to Your Project

After creating a project in the console, link it to a local directory:

```bash
cd my-app-folder
catalyst init
# or if project already exists:
catalyst project:use "My Project Name"
```

Verify the link:
```bash
cat catalyst.json        # should contain project_id and project_key
catalyst whoami          # shows logged-in user
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Can't find ZAID in Settings | Wrong environment or viewing the wrong project | Confirm you are in the correct project AND environment (Dev vs Prod) |
| Table ID not visible in URL | Some console versions show it differently | Use MCP tool `CatalystbyZoho_GetTableID` or run `catalyst datastore:list` |
| CORS error despite domain being in Authorized Domains | CORS toggle is OFF, or protocol mismatch (`http` vs `https`) | Ensure toggle is ON; domain must include exact protocol |
| App User Insert returns 403 | Insert not enabled in Scopes and Permissions | Enable Insert for App User in Data Store → table → Scopes and Permissions |
