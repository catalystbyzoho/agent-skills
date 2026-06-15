---
name: catalyst-pricing
description: "Catalyst pricing — free tier limits, pay-as-you-go rates, GB-seconds calculation, and cost estimation for functions, storage, and other services. Trigger on 'pricing', 'cost', 'free tier', 'how much does Catalyst cost', 'GB-seconds', 'billing', or 'will this be free'."
metadata:
  version: "2.0.0"
---

## How It Works

1. **Load `references/pricing-basics.md`** — for free tier limits, pay-as-you-go rates, and the GB-seconds formula.
2. **Free tier first** — Always present free tier limits before pay-as-you-go rates. Most hobby projects stay within free tier.
3. **GB-seconds calculation** — `(memory in GB) × (execution time in seconds) × (invocation count)`. Present as a worked example with the user's expected usage.
4. **Estimate honestly** — Flag that serverless cost depends on real traffic patterns; give a range rather than a single number.

## Triggers

Use this skill for: "pricing", "cost", "free tier", "how much does Catalyst cost", "GB-seconds", "billing", "pay-as-you-go", "subscription model", "trial credits", "$250 credits", "function cost", "storage cost", "will this be free", "Catalyst pricing plans", or "DataStore pricing".

## References

| Reference | Load when the query is about… |
|-----------|-------------------------------|
| `references/pricing-basics.md` | Free tier limits, pay-as-you-go rates per service, GB-seconds formula, $250 trial credits, subscription vs PAYG |
