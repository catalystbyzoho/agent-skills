## Overview

QuickML is Catalyst's no-code AutoML platform. Upload a dataset, configure the problem type, train a model, and call it via SDK/API. No ML expertise required.

---

## Workflow

1. **Import Dataset** — CSV/Excel from Stratus, Data Store export, or direct upload
2. **Configure Training** — Select target column, problem type, algorithm
3. **Train** — QuickML runs feature engineering, model selection, cross-validation
4. **Deploy** — Deploy the best model as an endpoint
5. **Predict** — Call predictions from functions or external services

---

## Problem Types

| Type | Use Case | Example |
|------|----------|---------|
| `classification` | Classify into categories | Spam/Not Spam, Churn/No Churn |
| `regression` | Predict numerical values | Price prediction, Sales forecasting |
| `multi_label` | Multiple simultaneous labels | Tag assignment, Multi-category |

---

## SDK — Prediction

Verified against `zcatalyst-sdk-node` v3.4.0 type definitions. The QuickML class exposes exactly ONE method — there is no `model(id)`, no `batchPredict()`, and the response has no `confidence` field. Do not generate those shapes.

```javascript
const quickML = catalystApp.quickML();

// predict(endPointKey, inputData) — endpoint key from Console → QuickML deployment;
// all input values are strings
const result = await quickML.predict('YOUR_ENDPOINT_KEY', {
  feature1: 'value1',
  feature2: '42'
});
// Response shape: { status: string, result: Array<string> }
```

For batch prediction, loop `predict()` calls — there is no batch method in the SDK.

---

## Pricing

QuickML pricing is NOT documented here — rates changed between doc versions and must not be quoted from memory. Load `catalyst-pricing` (`references/pricing-basics.md`, QuickML section) and verify at https://catalyst.zoho.com/pricing.html before giving any estimate.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Model training stuck in `PROCESSING` | Dataset too small (< 50 rows) or all rows have the same target value | Add more varied data; QuickML requires at least 50 rows with distribution across classes |
| Prediction returns `null` | Feature columns in prediction request don't match training column names exactly | Match feature names case-sensitively to training dataset headers |
| `Model not deployed` error on predict | Model trained but deployment step skipped | Explicitly deploy model from Console → QuickML → Deploy before calling prediction API |
| Free tier prediction limit hit | Monthly free-tier prediction quota exhausted (check current quota on the pricing page) | Upgrade plan or wait for next calendar month reset |
