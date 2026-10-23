---
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
tags: [cache]
---

I call segment.delete(key) and later try to detect deleted keys by wrapping segment.getValue(key) in try/catch, expecting it to throw. The catch never fires. How do I detect deleted keys?
