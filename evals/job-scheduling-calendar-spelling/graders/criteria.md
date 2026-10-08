---
type: llm
weight: 1
---

A successful response passes the literal string `'Calendar'` as the cron type (or explicitly states that the SDK enum `CRON_TYPE.CALENDER` is misspelled and rejected by the server, and that `'Calendar'` must be used instead).

Fail the response if it uses `CRON_TYPE.CALENDER`, `'Calender'`, or any other misspelling of Calendar as the cron type without flagging it as wrong.
