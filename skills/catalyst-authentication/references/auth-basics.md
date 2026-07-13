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
  zaid: 'YOUR_ZAID'  // Get from Settings → Environments
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

// Embedded login widget
catalyst.auth.signIn('login-container', {
  login_redirect: window.location.origin + '/'  // Root path for Slate
});

// Logout
catalyst.auth.signOut(window.location.origin);
```

**IMPORTANT:** Do NOT use `/app/` paths with Slate. Slate serves from root `/`, not `/app/`.

### Check if logged in

```javascript
const isLoggedIn = catalyst.auth.isUserAuthenticated();
// Returns user object on success, rejects with 401 on failure
```

**Embedded sign-in widget has no built-in signup flow.** `catalyst.auth.signIn("divId", config)` renders a login iframe only — there is no sign-up button inside it. For signup, build a custom form and call `catalyst.auth.signUp()`.

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

## ZAID (Zoho Application ID)

- **Different in Development and Production** — the #1 source of auth issues on prod deploy
- **Where:** Console → Settings → Environments → General tab
- **Always pass as a string** (JavaScript loses precision on large integers)
- Reconfigure social logins and redirect URIs with the **Production ZAID** after deployment

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

### ZAID mismatch between environments

Production ZAID differs from Development ZAID. This is the #1 cause of auth failures after prod deploy. Always use environment variables for ZAIDs.

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

---

## Embedded Auth on Slate (Non-Legacy Hosting)

### Redirect URL Patterns

For **Slate apps**, authentication redirects must NOT include `/app/` path:

```javascript
// ✅ CORRECT for Slate
await catalyst.auth.signUp({
  first_name: firstName,
  last_name: lastName,
  email_id: email,
  platform_type: 'web',
  zaid: ZAID,
  redirect_url: window.location.origin + '/'  // Root path
});

// Embedded login widget
catalyst.auth.signIn('login-container', {
  login_redirect: window.location.origin + '/'  // Root path
});
```

```javascript
// ❌ INCORRECT for Slate (legacy pattern)
redirect_url: window.location.origin + '/app/index.html'  // 404 on Slate
```

### SDK Initialization Order (Critical)

The `/__catalyst/sdk/init.js` script must load BEFORE your app calls `catalyst.auth` methods. Poll for SDK availability:

```javascript
useEffect(() => {
  const checkSDK = setInterval(() => {
    const sdk = (window as any).catalyst;
    if (sdk?.auth?.signIn) {
      clearInterval(checkSDK);
      sdk.auth.signIn('login-container', {
        login_redirect: window.location.origin + '/'
      });
    }
  }, 100);

  return () => clearInterval(checkSDK);
}, []);
```

### ZAID Environment Differences

**Critical:** ZAID differs between Development and Production. For Slate apps, set ZAID as build-time environment variable:

```bash
# .env.development
VITE_CATALYST_ZAID=dev_zaid_value

# .env.production  
VITE_CATALYST_ZAID=prod_zaid_value
```

Rebuild when promoting to production: `npm run build && catalyst deploy slate`

### Common Error: PATTERN_NOT_MATCHED

If you see this error after authentication, the SDK is redirecting to a path that doesn't exist in your router. Common causes:

1. **SDK redirecting to `/app/`** → Add `/app/*` catch-all route (see catalyst-slate skill)
2. **`client-package.json` has `login_redirect` without leading `/`** → Change to `"/"`
3. **Console Authentication Type still set to Hosted** → Change to Embedded
