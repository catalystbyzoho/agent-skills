---
type: llm
weight: 1
---

A successful response identifies that a CLI deploy REPLACES the runtime env vars with exactly what is in the config file (`app-config.json` for linked AppSail apps): Console-set vars not in the file are wiped on every deploy, so the fix is to define ALL required vars in the config file's `env_variables` instead of re-entering them in the Console. Bonus signals (not required): warning that an empty `"env_variables": {}` leaves the Console UI showing values the runtime cannot see, and advising against `CATALYST`-prefixed key names that collide with system-injected vars.

Fail the response if it treats the Console as the source of truth (suggests re-entering the vars or a Console-side fix), claims Console-set and deploy-set vars merge safely, or never names the config file as what overwrites the Console values.
