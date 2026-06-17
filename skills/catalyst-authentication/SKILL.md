---
name: catalyst-authentication
description: "Catalyst Authentication — user login/signup, ZAID, Web SDK auth flows, and OAuth token management via Connections. Trigger on 'authentication', 'login', 'signup', 'getCurrentUser', 'ZAID', 'isUserAuthenticated', 'signOut', 'Connections', or 'getAccessToken'. You MUST load this skill whenever implementing user login or protecting data — ZAID differs between Development and Production and is the #1 cause of auth failures after environment promotion. For Security Rules (function invocation control), route to catalyst-functions."
metadata:
  version: "2.0.0"
---

## How It Works

1. **Identify flow type** — Hosted login (redirect to Catalyst login page), embedded login (custom UI), or backend `getCurrentUser` check.
2. **Load `references/auth-basics.md`** — for signup/login flows, ZAID gotcha, hosted vs embedded login, and common auth errors.
3. **ZAID warning** — ZAID differs between Development and Production. This is the #1 auth issue in production. Always verify the environment.
4. **Security Rules** — If the query involves controlling who can invoke a function, route to `catalyst-functions` skill and its `references/functions-basics.md` Security Rules section. Security Rules has two parameters: (a) **`methods`** — which HTTP methods (GET/POST/PUT/DELETE/PATCH) are enabled for the function (removing a method blocks that verb entirely), and (b) **`authentication`** — a single binary flag (`optional` = public, `required` = authenticated users only) applied **function-wide, not per-method**. For role-based data access control, route to DataStore Scopes and Permissions (Console → Table → Scopes and Permissions).
5. **OAuth / Connections** — Load `references/connections.md` for external API OAuth token management (Zoho or third-party).

## Security Checklist

- **ZAID is environment-specific.** The Development ZAID is different from the Production ZAID. Social logins (Google, Facebook, LinkedIn, Microsoft) configured in Development MUST be reconfigured with the Production ZAID and production app domain before going live — using the wrong ZAID causes all social logins to silently fail in production.
- **DataStore permissions are separate from function-level auth.** Requiring authentication in Security Rules only controls who can call the function. App User table permissions (Console → Table → Scopes and Permissions) separately control which DataStore operations authenticated users can perform.

## Triggers

Use this skill for: "authentication", "user management", "login", "signup", `getCurrentUser`, "ZAID", `registerUser`, `isUserAuthenticated`, `signOut`, "hosted login", "embedded login", "Connections", "OAuth token", `getConnector`, `getAccessToken`, "Security Rules", "App User", "credentials include", or "auth redirect".

## References

| Reference | Load when the query is about… |
|-----------|-------------------------------|
| `references/auth-basics.md` | User signup/login, getCurrentUser, Web SDK auth flows, ZAID gotcha, hosted vs embedded login, common auth errors |
| `catalyst-functions` skill | Security Rules — function invocation control (`methods`, `authentication: optional/required`) |
| `references/connections.md` | OAuth token management for external APIs — getConnector, getAccessToken, Zoho and third-party service connections |
