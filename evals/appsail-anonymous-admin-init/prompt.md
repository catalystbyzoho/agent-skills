---
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
tags: [appsail]
---

In my AppSail Express app I protect admin routes like this: if catalyst.initialize(req, { scope: 'admin' }) succeeds, the request is treated as authenticated. Is that solid?
