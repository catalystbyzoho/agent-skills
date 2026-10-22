---
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
tags: [functions]
---

In my Advanced I/O function I route manually with `if (pathname === '/users')`, but every request to https://.../server/api/execute/users returns my 404 branch. Logging shows the handler IS invoked. Why does no route match?
