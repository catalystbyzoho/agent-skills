---
type: llm
weight: 1
---

A successful response knows the Cache TTL parameter is in HOURS (max 48), not seconds or milliseconds — it either passes 1 (one hour) while explicitly noting sub-hour TTLs aren't supported by the hours-based parameter, or otherwise clearly states the unit is hours.

Fail the response if it passes 1800, 30, or 1800000 expecting seconds/minutes/milliseconds, or never states the TTL unit.
