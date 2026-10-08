---
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
tags: [datastore]
---

This ZCQL query returns an empty array even though matching rows definitely exist: SELECT title FROM Todos WHERE title LIKE 'A%'. No error is thrown. What's happening?
