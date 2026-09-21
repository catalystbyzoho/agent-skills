---
name: catalyst-quickml
description: "Catalyst QuickML — no/low-code ML, Generative AI, and ready-to-use AI platform. Covers (1) Prediction: ML pipelines, classification/regression, text analytics, recommendation, forecasting, clustering, anomaly detection, AutoML, prediction endpoints; (2) Generative AI: LLM Serving (chat, VLM), RAG, Knowledge Base, GenAI endpoints; (3) Zia Model Library: pre-built no-training models; (4) QuickML pricing — subscription plans and pay-as-you-go rates. Trigger on 'QuickML', 'AutoML', 'ML pipeline', 'train a model', 'model endpoint', 'LLM Serving', 'RAG', 'Knowledge Base', 'no-code ML', 'MLOps', or QuickML pricing/cost/billing/plan questions. DC availability: Prediction models all DCs; Generative AI NOT in AU or SA; Zia Model Library IN only."
metadata:
  version: "1.1.0"
---

# Catalyst QuickML

## Triggers
"QuickML", "Catalyst QuickML", "a QuickML endpoint", "training/predicting with a Catalyst model", "no-code ML", "no-code machine learning", "deploy a model", "model endpoint", "MLOps", "AutoML", "ML pipeline", "LLM Serving", "RAG", "pre-built model / Zia model", "OCR / face / image / text model", "QuickML pricing", "QuickML cost", "how much" (for QuickML usage), "billing", "subscription plan", "pay-as-you-go", "Catalyst plan".

## Prerequisites
Before using QuickML, activate it once per project in the console:

Console → your project → QuickML (left sidebar) → click "Start Exploring"

Skipping this step prevents access to Data connectors, Pipelines, Models, Endpoints, LLM Serving, RAG, Knowledge Base. This is a one-time activation per project.

## What is QuickML?

QuickML is a fully no/low-code ML platform in the Zoho Catalyst development platform. It spans three
capability areas:
(1) **ML models** built and trained with a drag-and-drop pipeline builder;
(2) **Generative AI** features — LLM Serving, RAG, and Knowledge Base; and
(3) **Zia Model Library** — pre-trained models (OCR, face, image, text). ML models and GenAI configs are published as authenticated endpoints (REST + SDK). Accessed from the integrated Catalyst console.

> **Availability (by data center):**
> - **ML models** — build & publish in **US, IN, EU, AU, JP, SA, CA** (all regions).
> - **Generative AI** (LLM Serving, RAG) — available and publishable in **US, IN, EU, JP, CA** only; **not available in AU or SA**.
> - **Zia Model Library** — available in **IN** only.
> If a feature has regional restrictions and the user's data center is unknown, ask before confirming availability.

## When to use — routing
Match the task/use case to the most relevant reference. If the query spans a single domain, load only that one reference. If the query spans multiple domains, load all relevant references.

1. **Load `references/prediction.md`** when building/training or serving a trained **ML model**.

- Use cases this reference handles:

| Pipeline / Model | Use cases covered |
|---|---|
| **Prediction pipeline (Classification)** | Churn, lead scoring, spam/fraud flagging |
| **Prediction pipeline (Regression)** | Price / sales / demand prediction |
| **Text Analytics pipeline** (trainable; Smart or Classic) | Sentiment, intent, topic tagging |
| **Recommendation pipeline** | Product / content recommendations |
| **Forecasting pipeline** | Sales / inventory forecasting (univariate or multivariate) |
| **Clustering pipeline** | Customer / product segmentation |
| **Anomaly Detection pipeline** | Fraud / outlier / operational-issue detection (time-series or non-time-series) |
| **Data Transformation pipeline** | Reusable data cleaning / prep |
| **AutoML — Classification** | Hand off model selection & tuning for a categorical target |
| **AutoML — Regression** | Hand off model selection & tuning for a numeric target |

**Topics covered**
Pipeline concepts; data connectors, pre-processing, visualization, operations (encoding, imputers, normalization, feature engineering); building pipelines, algorithm summaries (+ links); class imbalance, periodic sync, dataset profile generation, model details, metrics, cross-validation, feature importance, SHAP values, endpoints, limitations.

2. **Load `references/generative-ai.md`** for LLMs, chat/VLM, and retrieval or agentic AI.
- Use cases this reference handles:

| Model / Feature | Use cases covered |
|---|---|
| **LLM Serving** | LLM assistant / chatbot — text chat with an LLM |
| **LLM Serving (VLM)** | Vision + text — image captioning, document/visual Q&A |
| **RAG + Knowledge Base** | Grounded assistant — accurate answers from your own documents |

**Topics covered**
LLM Serving (Qwen/GLM models; params — Temperature, Top-K/P, Max Tokens, Instructions; 128k context; interaction modes; tool calling); RAG (modes, parameters, retrieval scope, agentic reasoning); Knowledge Base (upload / WorkDrive / Zoho Learn import); GenAI endpoints + REST/SDK

3. **Load the `catalyst-zia` skill** (`../catalyst-zia/references/zia-services.md`) when a pre-built model can do the job with **no dataset or training** — just call an endpoint.
- Use cases: OCR, Face Analytics, Identity Scanner (KYC), Image Moderation, Object Recognition, Barcode Scanner, pre-built Text Analytics (sentiment, NER, keywords).
- Note: the **Zia Model Library inside the QuickML console** is IN DC only; the standalone **Zia Services APIs** (covered by `catalyst-zia`) have their own, different DC rules.

## Using Catalyst MCP tools

**Tool-first for every QuickML action and lookup** (pipelines, endpoints, datasets, metrics, configs, LLM/RAG, etc.). If a connected Catalyst MCP tool fits, use it.

- Discover tools at runtime; match by name/description — don't hardcode names.
- Read the tool's schema before calling.
- No tool fits → SDK/REST → console UI. Agent can't see the UI, so ask the user for UI-only values; never fabricate.

## Console instructions — be exhaustive
When telling a user how to do something in the console, specify **every** configuration option for each step — the exact field, the dropdown/condition to select, the value to enter, and any checkbox — not just the value. Generic steps cause silent misconfiguration (e.g. a Fill Columns rule needs its **condition** set to "missing values", not only a fill value).

## SDK docs
QuickML ships in the Catalyst SDK family: **Node.js, Python, Java**. Two-step pattern in all languages: create a QuickML component instance,
then call the relevant method with the **endpoint key** and input data.

Node.js prediction call — verified against `zcatalyst-sdk-node` v3.4.0 type definitions (the QuickML class exposes exactly ONE method; there is no `model(id)`, no `batchPredict()`, and the response has no `confidence` field — do not generate those shapes):

```javascript
const quickML = catalystApp.quickML();
// predict(endPointKey, inputData) — endpoint key from Console → QuickML deployment;
// all input values are strings
const result = await quickML.predict('YOUR_ENDPOINT_KEY', { feature1: 'value1', feature2: '42' });
// Response shape: { status: string, result: Array<string> }
```

There is no confidence/probability score in the SDK response. If the user needs one, say so — do NOT invent a REST alternative: QuickML REST endpoint URLs, auth headers, request body shape, and response fields are NOT documented in this skill, and each deployed endpoint's exact sample request is shown in the Console (QuickML → Endpoints). Point the user there or fetch the official docs page; never fabricate an endpoint URL, OAuth scope, or response field (e.g. `likelihood_score`).

> - **Python**: `docs.catalyst.zoho.com/en/sdk/python/v1/quickml/execute-quickml-endpoints/`
> - **Java LLM**: `docs.catalyst.zoho.com/en/sdk/java/v1/quickml/execute-llm-endpoint/`
> - **Java VLM**: `docs.catalyst.zoho.com/en/sdk/java/v1/quickml/execute-vision-model-endpoint-/`
> - **Java RAG**: `docs.catalyst.zoho.com/en/sdk/java/v1/quickml/execute-rag-endpoint/`
> - **JavaScript GenAI**: `https://docs.catalyst.zoho.com/en/sdk/javascript/v1/quickml/create-quickml-instance/`

# QuickML Pricing

**Currency:** INR (₹) - India region pricing. Other regions vary | **Mn** = Million
QuickML is priced as part of Zoho Catalyst. Two models are available: fixed monthly subscription plans and usage-based pay-as-you-go.

## 1. Subscription Plans

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

## 2. Subscription Rules
- Exceeding the tier: move to the next tier. Alerts are sent at 50% and 80% of quota.
- If you don't upgrade, application calls fail for the rest of the month.
- Usage resets monthly. Unused amounts do not roll over.
- You can revert to pay-as-you-go from the next billing cycle.
- The per-project minimum fee for pay-as-you-go does not apply to subscription plans.

## 3. Add-ons (Subscription Plans)

| Type | Billing | Purpose |
|---|---|---|
| One time | Single month | Extends the current tier for one month (for example, a usage spike) |
| Recurring (Custom Plan) | Ongoing | Creates a custom tier for as long as needed |

- Minimum add-on: [TBD]
- Unused add-on credits do not carry forward.
- Add-ons apply to the current plan and are managed from the Billing dashboard.

## 4. Pay-as-you-go

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
- Minimum billing: once the free tier is exceeded, a minimum billing of [TBD] per project applies. Deleting unused projects avoids it.

## 5. Free Trial
- Duration: 6 months or until trial credits (worth [TBD]) are consumed, whichever comes first.
- If credits run out early, invoicing starts the next month, only for the amount beyond the credits.
- Unused credits expire after 6 months.
- If usage exceeds the free tier during the trial, the invoice value is deducted from the trial wallet credits.
- Card requirement: [TBD, to be confirmed]

## 6. Billing and Controls
- Invoices are issued in the currency of the card on file.
- You can switch plans at any time. The new plan applies from the next billing cycle.
- Budget alerts let you either cut off the app or continue serving it on pay-per-use.
- A free consultation is available for cost estimation.

## 7. Source
Zoho Catalyst pricing: https://catalyst.zoho.com/pricing.md

## 8. Assistant Rules

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
- For any pricing field marked [TBD], do not invent a value — tell the user this detail is not confirmed and direct them to the pricing page.
- If the pricing page is unreachable, use the embedded pricing data in this file but note that it may not reflect the most current values.

# Edge cases

For anything not covered in the reference files, fetch the specific page under
  <https://docs.catalyst.zoho.com/en/quickml/> or <https://docs.catalyst.zoho.com/en/zia-services/>
  each page is also available as Markdown at `<page-url>/index.md`. If the fetch fails or returns no content, tell the user you couldn't retrieve the information and provide the direct documentation URL for them to check.
