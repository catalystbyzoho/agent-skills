---
type: llm
weight: 1
---

A successful response avoids all four Web SDK traps: there is NO catalyst.auth.getCurrentUser() in the Web SDK (user info comes from isUserAuthenticated(), whose result nests the user object); signOut() is NOT a promise (must not be awaited); and signOut() REQUIRES a redirect URL argument (it fails without one).

Fail the response if it calls catalyst.auth.getCurrentUser(), awaits signOut(), or calls signOut() with no redirect URL.
