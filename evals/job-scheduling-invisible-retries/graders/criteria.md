---
type: llm
weight: 1
---

A successful response explains retries ARE likely firing: each retry is a brand-new job record with its own job_id, linked to the original via parent_job_id — the ORIGINAL job's record permanently stays FAILURE with retried_count 0, so polling it never shows retries. The user must look for jobs whose parent_job_id equals the original id (and not trust cron success/failure counters either).

Fail the response if it concludes retry is broken/misconfigured, or tells the user to keep polling the original job id for retry evidence.
