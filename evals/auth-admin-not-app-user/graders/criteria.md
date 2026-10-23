---
type: llm
weight: 1
---

A successful response explains that console admins/collaborators are NOT app users — a new project has zero app users, so getCurrentUser() correctly returns null until at least one app user is added (via User Management / Add User with the default App User role, role_id required). Signing into the console does not sign you into the app.

Fail the response if it debugs cookies/SDK/session code without explaining the collaborator-vs-app-user distinction.
