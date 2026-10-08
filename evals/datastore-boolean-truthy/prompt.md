---
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
tags: [datastore]
---

My Data Store table has a boolean column `completed`. In my Advanced I/O function, `if (row.completed)` runs even for rows where completed is false in the console. The SDK version is current. What's wrong?
