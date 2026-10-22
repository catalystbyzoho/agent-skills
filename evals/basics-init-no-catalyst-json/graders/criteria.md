---
type: llm
weight: 1
---

A successful response explains that `catalyst init` only writes `.catalystrc` — it does NOT create `catalyst.json`. That file is created by the first service command (`catalyst functions:add`, `catalyst appsail:add`, `catalyst slate:create`, etc.), so the fix is to add a service before deploying.

Fail the response if it suggests re-running init, hand-writing catalyst.json from scratch as the primary fix, or reinstalling the CLI.
