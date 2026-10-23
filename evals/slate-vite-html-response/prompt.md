---
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
tags: [slate]
---

Running `catalyst serve` locally, my React app's fetch('/server/api/execute/items') returns status 200 but response.json() throws "Unexpected token '<'" — the body is my index.html. The same endpoint works with curl on port 3000. Why?
