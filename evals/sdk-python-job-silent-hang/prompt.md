---
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
tags: [sdk]
---

My Python Job function makes three Data Store calls. Each call mysteriously takes about 60 seconds, nothing raises, and the job dies at the 15-minute timeout. The same code works in a Basic I/O function. What's wrong?
