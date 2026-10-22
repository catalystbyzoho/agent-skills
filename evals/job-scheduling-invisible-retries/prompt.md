---
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
tags: [job-scheduling]
---

I submitted a job with number_of_retries: 3. It failed, and I've been polling Get_Job_By_Id on my job id for 10 minutes: status stays FAILURE and retried_count stays 0. Retries clearly aren't firing — is retry broken?
