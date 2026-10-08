---
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
tags: [stratus]
---

My function updates a config file in Stratus with bucket.putObject(key, newContent) — the first write worked, but updates now fail with 409 key_already_exists. Should I delete the object first and then put?
