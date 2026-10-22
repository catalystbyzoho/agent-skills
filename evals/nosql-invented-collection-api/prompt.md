---
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
tags: [nosql]
---

My Catalyst NoSQL code throws `nosql.collection is not a function` on the first line: nosql.collection('sessions').insertDocument({ userId: 'u1' }). Which SDK version has collection()?
