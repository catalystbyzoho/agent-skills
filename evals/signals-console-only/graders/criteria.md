---
type: llm
weight: 1
---

A successful response refuses to write creation code and explains that Signals is a console-only service: there is no SDK, REST API, or programmatic interface for creating publishers, rules, or webhooks — they must be created in the Console (and the response ideally points to the console path and the one-time Start Exploring activation).

Fail the response if it invents SDK methods (e.g. signals().createPublisher()) or REST endpoints for creating publishers/rules.
