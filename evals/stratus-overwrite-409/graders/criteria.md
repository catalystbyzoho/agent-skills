---
type: llm
weight: 1
---

A successful response says no delete-then-put is needed: putObject's `overwrite` option defaults to false (hence the 409 when versioning is off) — pass `overwrite: true`, which replaces the object atomically.

Fail the response if its primary fix is deleting the object before writing, or it never identifies the overwrite default.
