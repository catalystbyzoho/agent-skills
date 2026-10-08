---
type: llm
weight: 1
---

A successful response knows the delivered payload is Signals' wrapper — { rule_id, target_id, version, attempt, account: {...}, events: [...] } — where `events` is ALWAYS an array (even for Instant dispatch it can contain multiple events), each event carrying the publisher data under its `data` field; iterating the events array is required. Mentioning that attempt > 1 indicates a retry is a bonus.

Fail the response if the handler treats the raw publisher payload as the top-level body or reads a single event object without handling the events array.
