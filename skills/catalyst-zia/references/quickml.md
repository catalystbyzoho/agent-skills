# QuickML — Full Reference

## Overview

QuickML is Catalyst's no-code/low-code ML pipeline builder: import a
dataset, build a pipeline (manually or via AutoML), train and evaluate
models, deploy the best one as an endpoint, and call it via SDK/API. It
also hosts Catalyst's Generative AI surface (LLM Serving, RAG, Knowledge
Base) and links out to Zia's Trained NLP Models.

Not available in the CA (Canada), JP (Japan), or SA (Saudi Arabia) data
centers.

Console sections (left nav, under a project's QuickML service):
`Home`, `Datasets`, `Pipelines`, `Models`, `Endpoints`, then a
**Generative AI** group (`LLM Serving`, `RAG`, `Knowledge Base`), then a
**Zia** group (`Trained NLP Models`).

---

## Datasets

Import via **Import Dataset**, choosing a source:

- **Zoho Apps** — Zoho Analytics, Zoho Creator, Zoho CRM, Zoho Recruit,
  Zoho Bigin, Catalyst Data Store, Vertical Studio
- **Object storage** — Amazon S3, Azure, Google Cloud, OneDrive, Dropbox
- **Databases** — MySQL, PostgreSQL, SQL Server, Amazon Redshift, Amazon
  Aurora, Amazon RDS
- **Files** — direct file upload

Steps: Data Source → Data Source Details → Name and Sync Configuration →
Status. Sources can be configured for **periodic sync** (daily, weekly,
monthly, yearly, or a custom interval from every 6 hours up to 23:59),
optionally triggering pipeline re-run and model retraining after each
sync.

On import, QuickML profiles the dataset automatically: record/column
counts, per-column stats (min, max, mean, median, std dev, percentiles),
data type detection, missing-value counts, duplicate/unique detection, a
correlation heatmap, and a quality score. Datasets are versioned, and the
dataset list view shows Name, Status, Source, Record count, Size, Created
On/By, Last Updated On/By.

---

## Pipelines

A pipeline is "the sequence of tasks / workflows configured to have
machine learning models achieving the desired output for the ML needs."
**Create Pipeline** offers a pipeline-type picker:

| Type | Purpose |
|---|---|
| Data Transformation | General data processing: cleaning, extraction, transformation (no model) |
| Prediction | Classification or Regression models from historic data |
| Text Analytics | Process text data and build text classification models |
| Recommendation | Recommender systems for personalized suggestions |
| Forecasting | Time-series models built on historical data |
| Clustering | Unsupervised pattern/structure discovery, no predefined labels |
| Anomaly Detection | Identify data points that deviate significantly from the norm; choose Timeseries or Non-Timeseries dataset mode |

**AutoML** is a mode, not a separate pipeline type: check "Create an
Auto-generated pipeline using AutoML" on the Create Pipeline screen (or
pick the dedicated AutoML card) and QuickML handles preprocessing,
algorithm selection, and hyperparameter tuning for you, while still
letting you edit the generated pipeline afterward for a custom build.

### Pipeline stage categories

- **Data cleaning** — select/drop columns, missing-value handling,
  duplicate removal, data-type detection
- **Data transformation** — type conversion, ordinal encoding, feature
  scaling, column merge/split, custom transformation
- **Data extraction** — statistical aggregation, pattern recognition
- **ML transformation** — feature engineering, missing-value imputation,
  feature encoding, normalization, custom ML transformation
- **Algorithms** — built-in ML algorithms, or a custom algorithm; class
  imbalance handling via SMOTE, RandomOverSampler, BorderlineSMOTE,
  ADASYN, RandomUnderSampler, TomekLinksUnderSampler,
  EditedNNUnderSampler, NearMissUnderSampler

**Custom code** (early access) lets you supply your own `transform()`
(data/ML transformation) or `fit`/`predict`/`get_evaluation_metrics()`
(custom algorithm) implementations. Supported libraries: numpy, scipy,
pandas, xgboost, catboost, lightgbm, sklearn, tld, patsy, tensorflow,
statsmodels, tldextract, huggingface_hub, sentence_transformers,
imbalanced_learn, hyperopt, shap, lime, transformers, pmdarima, lightfm,
LibRecommender, subseq.

Editing an upstream stage triggers **impact detection**: QuickML flags
downstream stages affected and offers to ignore/reset, reconfigure now,
or discard — supported for most pipeline types (not Forecasting or
Anomaly Detection in Smart mode).

### Zia text analytics integration

Text Analytics pipelines can draw on Zoho's own NLP: sentiment
(positive/negative/neutral), keyword extraction, language detection,
emotion detection (Happy, Enthusiasm, Discontentment, Frustration, Trust,
Confusion, Gratitude, Neutral), intent extraction (complaints, requests,
purchases, queries), activity extraction (event/call/task), and
commitment classification (due dates, promises).

---

## Models

"Models are depicters which produce output based on the algorithms
trained with the given data" — the trained artifacts a pipeline produces,
listed separately from the pipeline that built them. Each model version
exposes:

- Cross-validation metrics and a model explanation chart (SHAP-based),
  with feature importance for the top 20 features (remainder grouped as
  "Others")
- A model tester for ad-hoc accuracy verification
- Metrics scoped to the pipeline's problem type:
  - **Classification** — confusion matrix (TP/TN/FP/FN), accuracy,
    precision, recall, F1 (macro/micro/weighted/samples), ROC AUC
    (OVR/OVO/weighted), balanced accuracy, average precision
  - **Regression** — negative MSE, negative MSLE, negative RMSE,
    negative MAE, negative median AE, negative mean Poisson deviance,
    negative mean gamma deviance, R²
  - **Recommendation** — coverage, NDCG@K, accuracy, ROC AUC, precision,
    recall, recurrence rate, MAE, MSE
  - **Time series** — ADF test and KPSS test (stationarity)

---

## Endpoints

Deployed, callable targets — up to **10 per account**. The Endpoints list
shows Endpoint Name, Type (e.g. `LLM`, `RAG`, or a classic prediction
endpoint), the backing Model(s), and Created/Updated by & on. Endpoint
features: REST API exposure, in-console live testing, SHAP-based
explanation on results, and OAuth2/internal auth.

---

## Generative AI

### LLM Serving

Browse and use hosted foundation models (e.g. `GLM-4.7-Flash`,
`Qwen 3.6 - 35B Vision Language`). Three tabs: **Models** (catalog),
**Playground** (interactive prompt testing against a chosen model), and
**Saved Configurations** (reusable model + parameter presets). A
configuration or playground session can be deployed as an `LLM`-typed
endpoint.

### RAG

Two tabs: **RAG Builder** and **Saved Configurations**. The RAG
Playground lets you pick a base **Model**, a **RAG Mode** (e.g. Response
Generation), then configure:

- **Model Setup** — RAG Mode
- **Response Generation** — Response Type (e.g. Chat), **Tolerance**
  (0.0–1.0: 0 allows more hallucination/low similarity required, 1
  requires high similarity/strictest grounding), **Strict Mode** toggle
- **Document Search** — **Top K**, number of top documents to retrieve
  (range 1–100)

Side tabs on the builder: **Parameters**, **Document Store**, **Model
Details**. Configurations are saved via **Save Configuration** and can be
deployed as a `RAG`-typed endpoint (seen in the Endpoints list, e.g. a
"policy-agent" style endpoint backed by a chat model).

### Knowledge Base

The document store backing RAG — where source documents are uploaded and
managed for retrieval.

---

## Zia — Trained NLP Models

A separate nav item alongside QuickML's own sections, for NLP models
trained/managed in this ML workspace. Distinct from the stateless Zia
REST APIs (OCR, face analytics, etc.) covered in `zia-services.md` —
cross-reference rather than duplicate.

---

## SDK — Prediction (Node.js SDK v2)

The Node.js SDK v2 QuickML surface is being deprecated in favor of the JS
SDK; prefer that where available. Current v2 shape:

```javascript
const quickml = app.quickML();

// Call a published endpoint by its endpoint key (from the console)
const result = await quickml.predict("{endpoint_key}", {
  column_name1: "value1",
  column_name2: "value2",
  column_name3: "value3"
});
// => { status: 'success', result: [ ... ] }
```

Requirements before calling `predict()`: the pipeline must be published
with a deployed endpoint, and the input keys must match the training
dataset's column names exactly (case-sensitive).

There is no documented `batchPredict()` in the current SDK reference —
verify against the latest SDK docs before recommending batch calls.

---

## Limitations

| Area | Limit |
|---|---|
| Datasets per account | 25 |
| Pipelines per account | 25 |
| Endpoints per account | 10 |
| Columns configurable per stage | 25 |
| Dataset preview | 50 columns × 250 records |
| Visualizations per dataset version | 5 |
| Chart preview / full chart records | 2,000 / 25,000 |
| Line chart series | 100 max |
| Correlation heatmap columns | 25 max |
| Zoho Apps import | 200K records |
| Periodic CRM/Bigin/Recruit import | 1M records |
| Cloud storage import | 1GB |
| Database import | 100K records |
| File upload | 1GB |
| Feature/column names | Cannot contain `[`, `]`, `<`, `>` |
| Regional availability | Not available in CA, JP, SA data centers |

---

## Sources

- Live console inspection: QuickML under a Catalyst project (People),
  Development environment — Home, Datasets (+ Import Dataset source
  list), Pipelines (+ Create Pipeline type picker and an Anomaly
  Detection config screen), Models, Endpoints, LLM Serving, RAG
  (Playground + Parameters panel) — 14‑Sep‑2026.
- `docs.catalyst.zoho.com/en/quickml/getting-started/introduction/`
- `docs.catalyst.zoho.com/en/quickml/help/quickml-limitations/`
- `docs.catalyst.zoho.com/en/quickml/help/create-automl-pipeline/`
- `docs.catalyst.zoho.com/en/quickml/llms-full.md`
- `docs.catalyst.zoho.com/en/sdk/nodejs/v2/quickml/execute-quickml-endpoints`
