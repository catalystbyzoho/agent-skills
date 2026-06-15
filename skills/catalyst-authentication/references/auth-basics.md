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

```javascript
// Sign up
await catalyst.auth.signUp({
  first_name: firstName,
  last_name: lastName,
  email_id: email,
  platform_type: 'web',
  redirect_url: window.location.origin + '/app/index.html'
});

// Check if logged in
const isLoggedIn = catalyst.auth.isUserAuthenticated();
// Returns user object on success, rejects with 401 on failure

// Logout
catalyst.auth.signOut(window.location.origin);  // Must pass redirect URL
// NOT: catalyst.auth.signOut()  — crashes with "Cannot read properties of undefined"
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
// Correct:
catalyst.auth.signOut(window.location.origin);
// For legacy Web Client:
catalyst.auth.signOut(window.location.origin + '/app/index.html');
```
