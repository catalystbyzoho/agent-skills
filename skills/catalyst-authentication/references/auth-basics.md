## Authentication Overview

Catalyst provides built-in auth and user management. Auth types: Catalyst built-in, Zoho accounts, custom SSO.

---

## SDK Patterns

```javascript
const userMgmt = catalystApp.userManagement();

// Get current user (user-scoped SDK)
const currentUser = await userMgmt.getCurrentUser();
// Returns null for collaborators/admins — only works for registered app users

// Get all users (admin-scoped)
const users = await userMgmt.getAllUsers();

// Get a specific user
const user = await userMgmt.getUserDetails(USER_ID);

// Delete a user
await userMgmt.deleteUser(USER_ID);

// Register a new user (sends invite email)
const signupConfig = {
  platform_type: 'web',
  zaid: 'YOUR_ZAID'
};
const userConfig = {
  email_id: 'newuser@example.com',
  first_name: 'New',
  last_name: 'User'
};
const newUser = await userMgmt.registerUser(signupConfig, userConfig);
```

---

## Initialization Scopes

| Scope | Init call | Use for |
|-------|-----------|---------|
| **User** (default) | `catalyst.initialize(req)` | `getCurrentUser()`, user-identity |
| **Admin** | `catalyst.initialize(req, { scope: 'admin' })` | DataStore CRUD, Stratus, ZCQL, Cache |

**Pattern for apps needing both auth and data:**
```javascript
// User-scope for identity
const userApp = catalyst.initialize(req);
const currentUser = await userApp.userManagement().getCurrentUser();

// Admin-scope for data
const adminApp = catalyst.initialize(req, { scope: 'admin' });
const dataStore = adminApp.datastore();
```

---

## Web SDK Auth (Client-Side)

### For Legacy Web Client Hosting

```javascript
// Sign up
await catalyst.auth.signUp({
  first_name: firstName,
  last_name: lastName,
  email_id: email,
  platform_type: 'web',
  redirect_url: window.location.origin + '/app/index.html'  // Legacy path
});

// Logout
catalyst.auth.signOut(window.location.origin + '/app/index.html');
```

### For Slate (Modern Frontend Hosting)

```javascript
// Sign up
await catalyst.auth.signUp({
  first_name: firstName,
  last_name: lastName,
  email_id: email,
  platform_type: 'web',
  redirect_url: window.location.origin + '/'  // Root path for Slate
});

// redirect_url must be "/" for Slate (root path)
catalyst.auth.signIn('login-container', {
  redirect_url: '/'
});

// Logout
catalyst.auth.signOut(window.location.origin);

// ⚠️ Slate two-origin limitation:
// signOut() only clears the frontend cookie. The Catalyst backend session
// may persist because Slate and the backend run on different origins.
// The SDK provides no cross-domain logout API. Workaround: use a
// sessionStorage flag to return the UI to the login screen, and add an
// honest comment in your code that the backend session is not invalidated.

// Example workaround:
catalyst.auth.signOut(window.location.origin);
sessionStorage.setItem('signed_out', 'true');
// NOTE: backend session persists — no SDK API exists for cross-domain invalidation
```

**IMPORTANT:** Do NOT use `/app/` paths with Slate. Slate serves from root `/`, not `/app/`.

### Check if logged in

```javascript
try {
  const result = await catalyst.auth.isUserAuthenticated();
  // ⚠️ User is nested under result.content — NOT result directly
  // result.content.email_id, result.content.user_id, result.content.first_name
  // logged in
} catch (err) {
  // not logged in (401)
}
```

**Embedded sign-in widget has no built-in signup flow.** `catalyst.auth.signIn("divId", config)` renders a login iframe only — there is no sign-up button inside it. For signup, build a custom form and call `catalyst.auth.signUp()`.

> ⚠️ **`public_signup` is OFF by default.** After enabling auth via MCP or console, `public_signup` is `false`. Any call to `catalyst.auth.signUp()` will silently fail for new users until you enable it: Console → Authentication → Settings → enable **Allow Public Signup**. There is no MCP tool to change this — must be done in the console.

---

## Finding ZAID Locally

While `catalyst serve` is running, ZAID is readable from the local init script:

```bash
curl http://localhost:3000/__catalyst/sdk/init.js | grep -o 'zaid:"[^"]*"'
```

This only works during local development — use the console for production ZAID: Console → Authentication → App Settings → Application ID.

---

## `credentials: 'include'` for fetch calls

When calling Catalyst functions from a web client, always add `credentials: 'include'`:

```javascript
const res = await fetch('/server/my_api/execute', {
  method: 'POST',
  credentials: 'include',   // ← Required — without this, auth cookies are NOT forwarded
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'value' })
});
```

`catalyst.server.callAdvancedIO()` handles this automatically.

---

## DataStore App User Permissions

By default, App Users have **Read-only** access. For Insert/Update/Delete:

1. **Console (recommended):** Data Store → {Table} → Permissions → App User → enable all operations
2. **SDK:** Use `catalyst.initialize(req, { scope: 'admin' })` for data operations

---

## First App User — Create One Before Testing Auth

**Every new Catalyst project has zero app users.** The console admin account is a project collaborator, not an app user. `getCurrentUser()` returns `null` for collaborators — auth will appear broken until at least one app user exists.

### Step 1 — Get the App User role_id

Call `CatalystbyZoho_List_All_Roles`. Every project has exactly two auto-created roles. Find the entry with `"is_default": true` — that is the App User role. Copy its `role_id` (it is project-specific and differs per project).

### Step 2 — Add the first app user via MCP

Call `CatalystbyZoho_Add_User` with:
- `platform_type`: `"web"`
- `redirect_url`: your Slate URL (e.g. `https://your-app.onslate.com/`)
- `user_details.email_id`, `user_details.first_name`, `user_details.last_name`
- `user_details.role_id`: value from Step 1 — **required**, omitting it is a validation error

> The user receives an invite email and must click the confirmation link before `isUserAuthenticated()` will return a valid session. Pending-confirmation accounts are rejected at login.

---

## Common Errors

### `getCurrentUser()` returns `null` — collaborator vs app user

Collaborators/project admins are NOT registered app users. `getCurrentUser()` returns `null` for them.

```javascript
const currentUser = await userApp.userManagement().getCurrentUser();
if (!currentUser || !currentUser.user_id) {
  // Collaborator/admin — fall back to admin-scope lookup
}
```

### `Authorization` header is `undefined`

The Catalyst gateway strips the `Authorization` header after validation and injects `x-zc-*` internal headers. Do not read `req.headers['authorization']` — it will be `undefined`. The SDK reads `x-zc-*` headers automatically via `catalyst.initialize(req)`.

### Session cookies don't cross Catalyst service domains

Functions (`*.catalystserverless.com`), AppSail (`*.catalystappsail.com`), and Slate (`*.onslate.com`) live on separate domains — a session cookie set by a login function will not authenticate requests to an AppSail or Slate app. Host the auth flow on the same origin as the app, use domain mapping to unify domains, or use server-side token exchange. (See the catalyst-appsail skill for the full domain table.)

### Development environment user limit

The Development environment allows a **maximum of 25 app users**. Plan Production deployment for anything beyond that — after deploying to production, there is no user-count restriction.

### Custom session setup gotchas

- If multiple functions share a session cookie, the signing secret (e.g. `SESSION_SECRET`) must be **identical** across all of them — a mismatched secret in one function invalidates sessions it didn't create.
- For external/portal auth flows, the accounts portal base URL is configured via SDK initialization options (`accountsPortalBaseURL` / `setAccountsPortalBaseURL('https://accounts.zohoportal.com')`) — configure it there rather than relying on ambient environment variables.

### `Authorization: Bearer` intercepted before handler

Catalyst validates `Authorization: Bearer <token>` at the gateway level — even for `authentication: optional` endpoints. Don't use `Authorization: Bearer` for custom app-level secrets.

```
# Use a non-standard header for custom auth:
X-My-App-Token: <secret>
```

### `signOut()` crashes

`catalyst.auth.signOut()` requires a redirect URL argument.

```javascript
// Correct for Slate:
catalyst.auth.signOut(window.location.origin);

// Correct for legacy Web Client:
catalyst.auth.signOut(window.location.origin + '/app/index.html');
```

### `signOut()` appears to work but user can still access protected routes

Slate two-origin: `signOut()` clears frontend cookie only; backend session persists. Use a sessionStorage flag + redirect for UI-side logout. No full cross-domain logout is available in the current SDK.

---

## Embedded Auth on Slate (Non-Legacy Hosting)

### Redirect URL Patterns

For **Slate apps**, authentication redirects must NOT include `/app/` path:

```javascript
// ✅ CORRECT for Slate
// ZAID: Console → Authentication → App Settings → Application ID (no MCP tool returns it)
await catalyst.auth.signUp({
  first_name: firstName,
  last_name: lastName,
  email_id: email,
  platform_type: 'web',
  // zaid: optional in Slate embedded flow (injected via /__catalyst/sdk/init.js)
  // required if you are running outside of catalyst serve or in a legacy setup
  zaid: 'YOUR_ZAID',
  redirect_url: window.location.origin + '/'  // Root path
});

// redirect_url must be "/" for Slate (root path)
catalyst.auth.signIn('login-container', {
  redirect_url: '/'
});
/* Required CSS — Catalyst injects an iframe with no default height; it renders invisible without this */
/* #login-container iframe { width: 100% !important; height: 500px !important; border: none !important; } */
```

```javascript
// ❌ INCORRECT for Slate (legacy pattern)
redirect_url: window.location.origin + '/app/index.html'  // 404 on Slate
```

### SDK Initialization Order (Critical)

Two scripts are required, in this exact order:

```html
<!-- 1. Main Catalyst CDN bundle — MUST come first; init.js depends on globals it sets -->
<script src="https://static.zohocdn.com/catalyst/sdk/js/4.6.1/catalystWebSDK.js"></script>
<!-- 2. Project-specific init -->
<script src="/__catalyst/sdk/init.js"></script>
```

Without `catalystWebSDK.js`, `init.js` crashes immediately with `Uncaught ReferenceError: I18N is not defined` and `window.catalyst` is never set.

The `/__catalyst/sdk/init.js` script must load BEFORE your app calls `catalyst.auth` methods. Poll for SDK availability:

```javascript
useEffect(() => {
  const checkSDK = setInterval(() => {
    const sdk = (window as any).catalyst;
    if (sdk?.auth?.signIn) {
      clearInterval(checkSDK);
      sdk.auth.signIn('login-container', {
        redirect_url: '/'
      });
    }
  }, 100);

  return () => clearInterval(checkSDK);
}, []);
```

### Common Error: PATTERN_NOT_MATCHED

If you see this error after authentication, the SDK is redirecting to a path that doesn't exist in your router. Common causes:

1. **SDK redirecting to `/app/`** → Add `/app/*` catch-all route (see catalyst-slate skill)
2. **`client-package.json` has `redirect_url` without leading `/`** → Change to `"/"`
3. **Console Authentication Type still set to Hosted** → Change to Embedded
