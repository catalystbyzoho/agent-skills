---
type: llm
weight: 1
---

A successful response sets `retry_interval: 900` (15 minutes expressed in seconds, since `retry_interval` is in seconds and must be within the 60-86400 range) and `number_of_retries: 3`.

Fail the response if it computes `retry_interval` in milliseconds (e.g. `15 * 60 * 1000` / `900000`) or otherwise treats the field as anything other than seconds.
