---
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
tags: [authentication]
---

My client sends `Authorization: Bearer <my-token>` to my Catalyst function, but req.headers['authorization'] is always undefined server-side. The client definitely sends it — I can see it in the network tab.
