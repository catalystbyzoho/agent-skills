> **Pricing data last verified: May 2026.** Always verify current rates at https://catalyst.zoho.com/pricing.html before quoting estimates to clients.

## Overview

- **Pay-per-use** model with generous monthly free tiers.
- **Free trial:** New customers get **$250 USD** in credits valid for 180 days.
- **Minimum billing:** $5/project/month once any free tier limit is exceeded.
- **No upfront commitments.** Subscription option also available.
- Free tier is **account-wide** (shared across all projects).

---

## Pricing Table (USD)

### Serverless
| Component | Unit Price | Unit |
|---|---|---|
| Functions | $0.000016 | per GB-second |
| Circuits | $0.00002 | per state transition |
| AppSail | $0.08 | per GB-hour |

### Data Store
| Operation | Unit Price | Unit |
|---|---|---|
| SELECT | $0.00006 | per request |
| INSERT | $0.0001 | per request |
| UPDATE | $0.00008 | per request |
| DELETE | $0.00008 | per request |
| Storage | $0.02 | per GB/month |

### Cache
| Operation | Unit Price | Unit |
|---|---|---|
| GET | $0.00004 | per request |
| PUT | $0.00006 | per request |
| UPDATE | $0.00006 | per request |

### Stratus (Object Storage)
| Operation | Unit Price | Unit |
|---|---|---|
| Upload | $0.000005 | per request |
| Download | $0.0000004 | per request |
| Storage | $0.02 | per GB/month |

### Other Backend
| Component | Unit Price | Unit |
|---|---|---|
| API Gateway | $0.000001 | per request |
| Web Client Hosting | $0.0000004 | per request |
| Mail | $0.001 | per email |
| Push Notifications | $0.00002 | per notification |
| Search | $0.00004 | per query |

### SmartBrowz
| Operation | Unit Price | Unit |
|---|---|---|
| Headless Browser | $0.1188 | per hour |
| PDF Conversions | $0.0033 | per PDF |
| BrowserLogic | $0.000002 | per invocation |

### DevOps
| Operation | Unit Price | Unit |
|---|---|---|
| APM | $0.00002 | per request |
| Automation Testing | $0.005 | per test case |
| Application Alerts | $0.0005 | per alert |
| Pipeline Build & Deploy | $0.00016 | per GB-second |

### Zia AI/ML APIs
All Zia operations: **$0.001 per request** (OCR, Face Analytics, Image Moderation, Object Recognition, Barcode Scanner, AutoML Prediction, Text Analytics)

### ConvoKraft
Messages: **$0.0006 per message**

### QuickML
| Operation | Unit Price | Unit |
|---|---|---|
| Model Inference (0–25K) | $0.0025 | per API call |
| Model Inference (25K–100K) | $0.002 | per API call |
| Model Inference (>100K) | $0.001 | per API call |
| LLM Input Tokens | $0.2 | per million |
| LLM Output Tokens | $0.4 | per million |

### Slate
| Operation | Unit Price | Unit |
|---|---|---|
| Build & Deploy | $0.00016 | per GB-second |
| Hosting Storage (CDN) | $0.0001 | per MB |
| Requests (CDN & Origin) | $0.000004 | per request |
| ISR Read | $0.0000003 | per request |
| ISR Write | $0.000003 | per request |

---

## Free Tier (Monthly, Account-Wide)

### Serverless
| Component | Free |
|---|---|
| Functions | 25,000 GB-seconds |
| Circuits | 2,000 state transitions |
| AppSail | 15 GB-hours |

### Data Store
| Operation | Free |
|---|---|
| SELECT | 10,000 requests |
| INSERT | 5,000 requests |
| UPDATE | 1,000 requests |
| DELETE | 1,000 requests |
| Storage | 5 GB |

### Cache
| Operation | Free |
|---|---|
| GET | 1,000 requests |
| PUT | 5,000 requests |
| UPDATE | 5,000 requests |

### Other
| Component | Free |
|---|---|
| Stratus Upload | 2,000 requests |
| Stratus Download | 10,000 requests |
| Stratus Storage | 5 GB |
| API Gateway | 100,000 requests |
| Web Client Hosting | 300,000 requests |
| Mail | 100 emails |
| Push Notifications | 500 notifications |
| Search | 1,000 queries |
| SmartBrowz Headless | 5 hours |
| SmartBrowz PDFs | 50 PDFs |
| BrowserLogic | 25,000 GB-seconds |
| Zia APIs (all combined) | 100 calls |
| ConvoKraft Messages | 1,000 messages |
| QuickML Inference | 500 API calls |
| Slate CDN Requests | 300,000 requests |
| Slate Storage | 500 MB |

---

## Billing Rules

1. **Free tier is account-wide** — shared across all projects.
2. **Minimum $5/project/month** once any free tier limit exceeded. If usage = $7 across 2 projects: $7 + $5 = $12.
3. **Billable = Max(0, Usage - Free Tier)**. Cost = Billable × Unit Price.
4. **Free trial credits ($250)** applied against invoices. After 180 days, normal billing begins.

---

## GB-Seconds Calculation

```
GB-seconds = (Memory in MB / 1024) × Execution Time in Seconds × Number of Invocations
```

**Example:** 500 invocations, 512 MB, 2 seconds each:
```
GB-seconds = (512/1024) × 2 × 500 = 500 GB-sec
Cost = (500 - 25,000 free) = 0 billable → $0.00
```

### Cost per invocation at each memory tier (1-second duration)

| Memory (MB) | Cost per invocation | 10K/month | 100K/month |
|-------------|---------------------|-----------|------------|
| 128 | $0.000002 | $0.02 | $0.20 |
| 256 | $0.000004 | $0.04 | $0.40 |
| 512 | $0.000008 | $0.08 | $0.80 |
| 1024 | $0.000016 | $0.16 | $1.60 |

**Key insight:** 128 MB is **8× cheaper per second** than 1024 MB. Choose the smallest memory that doesn't cause failures.

---

## Typical Monthly Costs

| App Type | Range | Primary Drivers |
|---|---|---|
| Simple web app (< 1K users) | $0–$10 | Within or near free tier |
| API backend (10K req/day) | $5–$50 | Data Store, Functions, API Gateway |
| Data processing (1M rows/mo) | $50–$500 | Data Store writes, Job Scheduling |
| Data processing (100M rows/mo) | $2,000–$30,000+ | Data Store writes dominate |
| ML-powered app | $10–$200 | Zia APIs, QuickML, Data Store |
| Chat application | $5–$50 | ConvoKraft, Functions, Cache |

---

## Cost Estimation Pitfalls

1. **Processing multiplier** — one user action triggers multiple ops. E.g., "save record" = 1 INSERT + 2 SELECTs + 1 Cache PUT + 1 event.
2. **DataStore is often the dominant cost** for data-heavy apps. INSERT at $0.0001/request adds up fast.
3. **Cache reduces DataStore costs** — higher cache hit rate = fewer SELECT calls.
4. **APM costs scale with executions** — at millions of executions, $0.00002/req becomes material.
5. **Free tier erodes at scale** — don't over-optimize for free tier savings in large projections.

---

## INR & Regional Pricing

Catalyst invoices in the currency attached to the credit card:
- **US DC** → USD, **IN DC** → INR, **EU DC** → EUR

For INR rates, visit https://catalyst.zoho.com/pricing.html from an India DC account.
All estimates in this skill are in USD. For INR pricing, direct users to the official pricing page.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Cost estimate doesn't match invoice | Free tier resets monthly; partial months billed at full rate | Always calculate based on full month usage; free tier is per calendar month |
| INR pricing differs from USD estimate | Separate regional pricing applies to India DC accounts | Direct India DC users to catalyst.zoho.com/pricing.html for accurate INR rates |
| Unexpected GB-seconds charge | Cold start overhead counted toward execution time | Cold starts add ~100–300 ms; factor this in for high-frequency functions |
| Free tier exhausted earlier than expected | Multiple environments (Development + Production) share the same free tier quota | Each Catalyst project counts as one quota pool across all environments |
