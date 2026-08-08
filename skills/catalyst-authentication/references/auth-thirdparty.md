# Third-Party Authentication

Catalyst supports three authentication strategies. Native types (Hosted and Embedded) are fully managed by Catalyst. Third-party auth delegates validation to an external service — Catalyst provides the token bridge.

| Type | Who validates the user | Catalyst handles endpoint security? |
|------|----------------------|--------------------------------------|
| **Hosted** | Catalyst | ✅ Yes |
| **Embedded** | Catalyst | ✅ Yes |
| **Third-party** | Your chosen IdP (Okta, Duo, Auth0, etc.) | ❌ No — you are responsible |

> ⚠️ When using third-party authentication, **Catalyst does not secure your application endpoints**. The security of your app depends entirely on the third-party service you choose.

---

## How Third-Party Auth Works (7-Step Flow)

1. User submits credentials → forwarded to the third-party IdP
2. IdP validates and stores user details in its own database
3. Validated user details returned to your Catalyst client app
4. Client calls your Catalyst **authentication function** with those details
5. Function runs `generateCustomToken()` → returns a custom server token
6. Client passes the token to `catalyst.auth.signinWithJwt()` → generates a JWT
7. User is logged in; JWT stored in browser cookie for the session (valid 1 hour)

> ℹ️ The custom server token must be regenerated on **every login** — it is not reusable across sessions.

---

## Prerequisites

1. **Enable Public Signup** — required before third-party auth can be set up. Console → Authentication → Public Signup → Enable.
2. **Complete the third-party IdP setup first** — Catalyst does not handle the external IdP configuration. Set up your app in the IdP's developer console before touching Catalyst.
3. **Complete the Console wizard** — Console → Cloud Scale → Authentication → Third-party → Set Up → follow the wizard → click **Finish**. This is what activates third-party auth in Catalyst's platform state. MCP `Enable_Authentication` with `auth_type: "third_party"` alone may not be sufficient — if `generateCustomToken()` returns `INTERNAL_SERVER_ERROR` after using MCP, complete the Console wizard to finish activation.

---

## Server-Side: Generate Custom Token (Node.js)

> ⚠️ **Use a Catalyst Function (Advanced I/O), not AppSail.** The official tutorial runs `generateCustomToken()` inside an Advanced I/O function. When called from AppSail on an unauthenticated request (no Catalyst session cookie yet), Catalyst may create the user in User Management but return `INTERNAL_SERVER_ERROR` on the token generation step — because AppSail's `catalyst.initialize(req)` on a cookieless request lacks the execution credentials that a function context provides automatically. If you see users appearing in User Management but `generateCustomToken` still returns 500, this is the cause.

Add a dedicated Advanced I/O function that the client calls after the IdP validates the user:

```javascript
// functions/auth_token/index.js — Advanced I/O function
'use strict';
const catalyst = require('zcatalyst-sdk-node');
const express = require('express');
const app = express();
app.use(express.json());

app.post('/gettoken', async (req, res) => {
  try {
    const { email_id, first_name, last_name } = req.body; // from IdP

    const catalystApp = catalyst.initialize(req); // function context — admin by default
    const tokenObj = await catalystApp.userManagement().generateCustomToken({
      type: 'web',
      user_details: {
        email_id,         // required
        first_name,       // required
        last_name,        // required
        org_id: '',       // optional
        phone_number: '', // optional
        country_code: '', // optional
        role_name: ''     // optional — assigns a role on first signup only
      }
    });

    res.status(200).json(tokenObj);
  } catch (error) {
    res.status(500).json({ error: error?.message || String(error) });
  }
});

module.exports = app;
```

> ℹ️ `org_id` and `role_name` are optional. On **first login** (signup), `role_name` assigns the user a role in Catalyst User Management. The token endpoint URL from Slate must be absolute: `https://<project>.catalystserverless.com/server/<fn>/execute`.

---

## Client-Side: Sign In With JWT (Web SDK)

After receiving the custom token from your function, pass it to `signinWithJwt`:

```html
<!-- Load Web SDK — /__catalyst/sdk/init.js works on ALL Catalyst-hosted frontends including Slate -->
<script src="https://static.zohocdn.com/catalyst/sdk/js/4.6.1/catalystWebSDK.js"></script>
<script src="/__catalyst/sdk/init.js"></script>
<script>
  catalyst.auth.signinWithJwt(getCustomTokenCallback);

  function getCustomTokenCallback() {
    // Token endpoint must be a Catalyst Function (Advanced I/O), not AppSail.
    // From Slate, always use the absolute Functions URL:
    return fetch('https://<project>.catalystserverless.com/server/<auth_fn>/execute/gettoken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ /* IdP user details */ })
    })
      .then(resp => resp.json())
      .then(data => {
        return {
          client_id: 'YOUR_CLIENT_ID',
          scopes: 'ZOHOCATALYST.tables.rows.ALL,ZOHOCATALYST.cache.READ',
          jwt_token: data.token
        };
      });
  }
</script>
```

> ⚠️ **Always use absolute URLs from Slate.** Slate (`*.onslate.com`) and Functions (`*.catalystserverless.com`) are on separate domains. Relative URLs (`/server/...`) will 404 from Slate — always use the full absolute URL for the token endpoint.

> ℹ️ `/__catalyst/sdk/init.js` is served by Catalyst's platform on all hosted frontends — it works correctly on both Slate (`*.onslate.com`) and legacy web client hosting.

> ⚠️ The `/__catalyst/sdk/init.js` script must load **before** any `catalyst.auth` calls. If using React/Vue, poll for SDK availability before calling `signinWithJwt` (same pattern as embedded login — see `auth-basics.md`).

---

## Social Logins (Google, Facebook, LinkedIn, Microsoft)

Social logins are supported **within native auth types** (Hosted and Embedded) — configured entirely from the Catalyst Console with no custom code.

> ⚠️ If you are using **Third-party Authentication**, social login Console configuration does not apply — you must implement the OAuth flow yourself using the IdP's SDK.

### Console Setup (for Hosted / Embedded auth types only)

1. Get **Client ID** and **Client Secret** from each social provider's developer console
2. Console → Cloud Scale → Authentication → your auth type → Social Logins
3. Click the provider, enter Client ID + Client Secret, click **Enable**

### Provider-specific setup

| Provider | Where to get credentials |
|----------|--------------------------|
| **Google** | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client IDs → Web application |
| **Facebook** | [Meta for Developers](https://developers.facebook.com) → My Apps → create app |
| **LinkedIn** | [LinkedIn Developer Portal](https://developer.linkedin.com) → My Apps → create app (requires a LinkedIn Company Page) |
| **Microsoft** | [Azure Portal](https://portal.azure.com) → App registrations |

> ⚠️ **Production reconfiguration required.** Social logins configured in Development use your dev domain. After promoting to Production, you must reconfigure each social login with the production app domain — or all social logins will silently fail in production.

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Third-party auth setup blocked | Public Signup not enabled | Console → Authentication → Public Signup → Enable (mandatory prerequisite) |
| `generateCustomToken()` returns `INTERNAL_SERVER_ERROR` even when user IS created in User Management | Called from AppSail on an unauthenticated request — `catalyst.initialize(req)` with no Catalyst session cookie lacks the execution credentials a Function context provides | Move `generateCustomToken()` to a Catalyst Advanced I/O Function; call that function URL from the client instead of an AppSail route |
| `generateCustomToken()` returns `INTERNAL_SERVER_ERROR` and Console wizard not completed | `Enable_Authentication` MCP call alone may not be sufficient — wizard "Finish" is what activates token generation | Complete the Console wizard: Console → Authentication → Third-party → Set Up → click **Finish** |
| `generateCustomToken()` fails with missing field error | `email_id`, `first_name`, or `last_name` missing from `user_details` | All three are required fields; `org_id`, `phone_number`, `country_code`, `role_name` are optional |
| `signinWithJwt` callback gets 404 on function fetch | Relative URL `/server/<fn>/execute` used from Slate — Slate and Functions are on different domains | Use absolute URL: `https://<project>.catalystserverless.com/server/<fn>/execute/gettoken` |
| `signinWithJwt` callback never fires | `/__catalyst/sdk/init.js` not loaded, or called before SDK is ready | Add the init script; for SPA frameworks, poll for `window.catalyst?.auth?.signinWithJwt` before calling |
| User not appearing in User Management after first login | `generateCustomToken()` was not called on first login (signup path skipped) | The token must be generated on every login — first login triggers the signup and adds user to User Management |
| Social logins silently fail after prod deploy | Social login still configured with dev domain | Reconfigure each social login in the Production environment with the production app domain |
| Social login config option not visible | Using Third-party Authentication type — Console social login config only works with Hosted/Embedded | Switch to Hosted or Embedded auth, or implement the social OAuth flow manually |
