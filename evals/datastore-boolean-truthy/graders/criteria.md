---
type: llm
weight: 1
---

A successful response explains that Data Store stores boolean columns as the TEXT strings "true"/"false" (booleans are mapped to TEXT internally), so the string "false" is truthy in JavaScript — the fix is comparing against the string (`row.completed === 'true'`) or converting boolean fields after reading.

Fail the response if it blames the SDK version, suggests recreating the column, or never identifies that the value arrives as a string rather than a real boolean.
