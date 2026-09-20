---
type: llm
weight: 1
---

A successful response recognizes that no job pool exists yet, states that a job pool must be created (or verified) before a job can be submitted, and either creates a Function-type job pool sized by `memory` MB or explicitly instructs the user to do so before submitting the job.

Fail the response if it jumps straight to submitting the immediate job (e.g. `jobScheduling().job().submitJob()` or `Create_Immediate_Job`) without first addressing job pool existence, or if it assumes a default job pool exists.
