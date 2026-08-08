## Slate + AppSail Cross-Origin Issue

Slate and AppSail run on **separate domains** — Slate on `*.onslate.com`, AppSail on `*.catalystappsail.com`. Browsers enforce the same-origin policy by default, blocking cross-domain API calls and causing `"Unable to Fetch"` errors.

The fix requires **two steps in order** — both are required:

### Step 1 — Register the Slate domain via MCP

Use the `CatalystbyZoho_Create_CORS_Domain` MCP tool:

```json
{
  "domain": "your-app.onslate.com",
  "cors": true,
  "iframe": false
}
```

> ⚠️ **Pass the bare domain only — no `https://` prefix.** The API returns `INVALID_INPUT — "Invalid domain name or https:// found"` if you include the protocol.

Verify it was registered with `CatalystbyZoho_List_All_CORS_Domains` — confirm `cors: true` in the response.

### Step 2 — Remove any CORS middleware from your AppSail code

Once Catalyst is managing CORS via Authorized Domains, it automatically injects the `Access-Control-Allow-Origin` header into every response. If your AppSail code **also** sets this header (e.g. via the `cors` npm package), the browser receives the header twice and rejects the request.

Remove the `cors` middleware entirely:

```diff
- const cors = require('cors');
- app.use(cors({ origin: '*' }));
```

Remove it from `package.json` too, then redeploy AppSail. **Do not set `Access-Control-Allow-Origin` manually in AppSail code** when using Catalyst Authorized Domains — the platform handles it.

---

## Custom Domain SSL

Free SSL certificates are provisioned and renewed automatically via Zoho's Certificate Authority.
Configure via Console → Domain Mapping.

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `The 'Access-Control-Allow-Origin' header contains multiple values` | `cors` npm middleware in AppSail code conflicts with Catalyst's platform-level CORS header — both inject the same header, browser rejects duplicate values | Remove `cors` package and `app.use(cors(...))` from AppSail entirely. Catalyst injects the header automatically once the domain is in Authorized Domains — do not set it in code |
| `INVALID_INPUT — "Invalid domain name or https:// found"` | Domain passed to `CatalystbyZoho_Create_CORS_Domain` includes `https://` prefix | Pass the bare domain only: `your-app.onslate.com` not `https://your-app.onslate.com` |
| Custom auth broken / requests intercepted unexpectedly | `catalyst_auth: true` in `app-config.json` — Catalyst's own SSO layer wraps the service and intercepts unauthenticated requests | Set `catalyst_auth: false` (or remove the key) when using custom OAuth or any non-Catalyst auth |
