# QuickML Pricing

Subscription plans, pay-as-you-go rates, free tier, trial, and the rules an agent must follow when answering QuickML pricing questions.

**Currency:** INR (₹) - India region pricing. Other regions vary | **Mn** = Million
QuickML is priced as part of Zoho Catalyst. Two models are available: fixed monthly subscription plans and usage-based pay-as-you-go.

## Subscription Plans

| Plan | Price/month | Data storage (incl. model training) | Compute (vCPU-hours) | Memory (GB-hours) | Prediction API calls |
|---|---|---|---|---|---|
| Catalyst Lite | ₹600 | Up to 150 GB | 2.4+ | 9.5+ | 1,400 |
| Basic | ₹1,500 | Up to 450 GB | 7+ | 28+ | 4,000 |
| Standard | ₹3,000 | Up to 800 GB | 13+ | 50+ | 7,000 |
| Premium | ₹4,500 | Up to 1,100 GB | 18+ | 75+ | 10,000 |
| Elite | ₹6,000 | Up to 1,500 GB | 24+ | 95+ | 14,000 |
| Enterprise | Custom | Custom | Custom | Custom | Custom |

**Positioning**
- Catalyst Lite: Simple apps and hobby projects
- Basic to Elite: Perfect for small and medium business owners
- Enterprise: For scale beyond Elite. Contact sales for a custom plan.

**Free trial availability**
- Available: Catalyst Lite, Basic, Standard, Premium
- Not available: Elite

**Notes**
- The limits above already include the monthly free-tier credits.
- Usage per component assumes the entire plan value goes to that single component. Actual limits vary when multiple Catalyst components are used.

## Subscription Rules
- Exceeding the tier: move to the next tier. Alerts are sent at 50% and 80% of quota.
- If you don't upgrade, application calls fail for the rest of the month.
- Usage resets monthly. Unused amounts do not roll over.
- You can revert to pay-as-you-go from the next billing cycle.
- The per-project minimum fee for pay-as-you-go does not apply to subscription plans.

## Add-ons (Subscription Plans)

| Type | Billing | Purpose |
|---|---|---|
| One time | Single month | Extends the current tier for one month (for example, a usage spike) |
| Recurring (Custom Plan) | Ongoing | Creates a custom tier for as long as needed |

- Minimum add-on: $5 (the pricing page shows this in USD; an INR figure is not published).
- Unused add-on credits do not carry forward.
- Add-ons apply to the current plan and are managed from the Billing dashboard.

## Pay-as-you-go

| Operation type | Unit price | Monthly free tier |
|---|---|---|
| Data storage | ₹0.0018/GB-hour | 1 GB |
| Single prediction | ₹0.03/call | 500 prediction calls |
| LLM input tokens | ₹12.0/Mn tokens | 1,000,000 tokens |
| LLM output tokens | ₹24.0/Mn tokens | 500,000 tokens |
| VLM input tokens | ₹48.0/Mn tokens | 250,000 tokens |
| VLM output tokens | ₹72.0/Mn tokens | 175,000 tokens |
| Model training: CPU | ₹0.024/vCPU-second | 1,800 CPU-seconds |

**Rules**
- The free tier applies at account level, across all projects, and resets monthly.
- You pay only for usage above the free tier. If you don't use Catalyst in a month, you pay nothing.
- Excess usage is charged at the unit prices above.
- Minimum billing: once a project exceeds the free tier, a minimum billing of ₹300 (US$5) per project applies. Deleting unused projects avoids it. It does not apply to subscription plans.

## Free Trial
- Duration: 6 months or until trial credits (worth ₹15,000 / US$250) are consumed, whichever comes first.
- If credits run out early, invoicing starts the next month, only for the amount beyond the credits.
- Unused credits expire after 6 months.
- If usage exceeds the free tier during the trial, the invoice value is deducted from the trial wallet credits.
- Card requirement: not needed at signup or to use the trial. Card details are required only after the free trial is exhausted.

## Billing and Controls
- Invoices are issued in the currency of the card on file.
- You can switch plans at any time. The new plan applies from the next billing cycle.
- Budget alerts let you either cut off the app or continue serving it on pay-per-use.
- A free consultation is available for cost estimation.

## Source
Zoho Catalyst pricing: https://catalyst.zoho.com/pricing.md

## Assistant Rules

When answering QuickML pricing questions:

- The prices in this file are in INR (₹) and apply to India-region
accounts. Pricing for other regions (US, EU, AU, JP, CA, SA) is shown in local currency on the pricing page and may differ. Do not convert INR prices to another currency. For non-India users, direct them to catalyst.zoho.com/pricing.html for their regional pricing.

- Treat the Catalyst pricing page as the authoritative source.
- Clearly distinguish Catalyst subscription pricing from Pay-as-you-go pricing.
- Do not describe Catalyst Lite, Basic, Standard, Premium, or Elite as standalone QuickML subscriptions.
- Describe them as Catalyst plans that include QuickML usage.
- When comparing plans, compare the monthly price together with QuickML storage, compute, memory, and prediction limits.
- If multiple Catalyst components are being used, do not assume that the entire plan allowance is available to QuickML.
- Do not claim unused QuickML usage rolls over.
- Do not invent overage rates, discounts, annual pricing, or enterprise pricing.
- For current pricing, verify against the latest official Catalyst pricing information.
- For any pricing detail not in this file (for example the INR minimum add-on), do not invent a value — tell the user it is not confirmed and direct them to the pricing page.
- If the pricing page is unreachable, use the embedded pricing data in this file but note that it may not reflect the most current values.

