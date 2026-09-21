---
type: llm
weight: 1
---

A successful response computes an estimate from documented rates BUT explicitly hedges for a client-facing quote: it states when the pricing data was last verified and directs the user to confirm current rates at catalyst.zoho.com/pricing.html before quoting a client, and accounts for the free tier being account-wide (plus the $5/account monthly minimum once the free tier is exceeded).

Fail the response if it presents computed numbers as authoritative current pricing with no verification pointer for the client proposal.
