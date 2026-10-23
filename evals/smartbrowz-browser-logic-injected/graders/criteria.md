---
type: llm
weight: 1
---

A successful response uses the injected `page` object that SmartBrowz provides to Browser Logic handlers — it does NOT launch or connect Puppeteer manually inside the function.

Fail the response if it calls puppeteer.launch()/puppeteer.connect() inside the Browser Logic handler, or writes it in Python (Browser Logic supports Node.js and Java only).
