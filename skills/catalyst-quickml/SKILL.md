---
name: catalyst-quickml
description: "Catalyst QuickML — no/low-code ML, Generative AI, and ready-to-use AI platform. Covers (1) Prediction: ML pipelines, classification/regression, text analytics, recommendation, forecasting, clustering, anomaly detection, AutoML, prediction endpoints; (2) Generative AI: LLM Serving (chat, VLM), RAG, Knowledge Base, GenAI endpoints; (3) Zia Model Library: pre-built no-training models. Trigger on 'QuickML', 'AutoML', 'ML pipeline', 'train a model', 'model endpoint', 'LLM Serving', 'RAG', 'Knowledge Base', 'no-code ML', 'MLOps'. DC availability: Prediction models all DCs; Generative AI NOT in AU or SA; Zia Model Library IN only."
metadata:
  version: "1.0.0"
---

# Catalyst QuickML

## Triggers
"QuickML", "Catalyst QuickML", "a QuickML endpoint", "training/predicting with a Catalyst model", "no-code ML", "no-code machine learning", "deploy a model", "model endpoint", "MLOps", "AutoML", "ML pipeline", "LLM Serving", "RAG", "pre-built model / Zia model", "OCR / face / image / text model"

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

## When to use — routing

Match the task/use case to **one** reference and load only that.

1. **Load `references/prediction.md`** when building, training or serving a trained **ML model** is required.

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

3. **Load the `catalyst-zia` skill** (`skills/catalyst-zia/references/zia-services.md`) when a pre-built model can do the job with **no dataset or training** — just call an endpoint.
- Use cases: OCR, Face Analytics, Identity Scanner (KYC), Image Moderation, Object Recognition, Barcode Scanner, pre-built Text Analytics (sentiment, NER, keywords).
- Note: the **Zia Model Library inside the QuickML console** is IN DC only; the standalone **Zia Services APIs** (covered by `catalyst-zia`) have their own, different DC rules.

Load only what you need — a prediction task shouldn't pull in the Generative AI or Zia references.

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

> - **Python**: `docs.catalyst.zoho.com/en/sdk/python/v1/quickml/execute-quickml-endpoints/`
> - **Java LLM**: `docs.catalyst.zoho.com/en/sdk/java/v1/quickml/execute-llm-endpoint/`
> - **Java VLM**: `docs.catalyst.zoho.com/en/sdk/java/v1/quickml/execute-vision-model-endpoint-/`
> - **Java RAG**: `docs.catalyst.zoho.com/en/sdk/java/v1/quickml/execute-rag-endpoint/`
> - **JavaScript GenAI**: `https://docs.catalyst.zoho.com/en/sdk/javascript/v1/quickml/create-quickml-instance/`

## Edge cases and pricing

- For anything not covered in the reference files, fetch the specific page under
  <https://docs.catalyst.zoho.com/en/quickml/> or <https://docs.catalyst.zoho.com/en/zia-services/>
  (each page is also available as Markdown at `<page-url>/index.md`).
- **Pricing** is not in the documentation; see <https://catalyst.zoho.com/pricing.html>.
