# QuickML — Custom ML Pipelines and Models (Agent Reference)

Practical, directive reference for building and serving **trained** ML models in Catalyst
QuickML. `SKILL.md` covers what QuickML is and when to reach for it; this file covers which
pipeline to pick and how to use it. 

For **Generative AI** features like LLMs, RAG, Knowledge base see `generative-ai-basics.md`.

## Availability (by data center):
> - **Prediction models** — build & publish in **US, IN, EU, AU, JP, SA, CA** (all regions).

## Pricing
> See `quickml-pricing-basics.md` for plans, pay-as-you-go rates, and free-tier limits.

## Core concepts
- **Data Connectors** — a list of connectors available in QuickMl to import data from. Currently, the list of connectors available are:
  - **Zoho apps** (Zoho Analytics, Zoho CRM, Zoho Bigin, Zoho Creator, Zoho Recruit, Catalyst Data Store , Vertical Studio)
  - **Cloud storage** (Amazon S3, Azure Blob, Google Cloud, OneDrive, Dropbox)
  - **External databases** (MySQL,
PostgreSQL, SQL Server, Amazon Redshift, Amazon Aurora, Amazon RDS)
  - **Local file** (CSV, JSON, ORC, Parquet, text, XLS/XLSX/XLSM of max size - 1GB). 

- **Data transformation pipeline** - a sequence of data cleaning, data extraction and data transformation stages connected end-to-end pipeline to result in a optimised dataset version. 

  **Note**:
    - Available set of stages in this pipeline are: Custom code, Data cleaning, Data extraction, Data transformation, Zia features
    - No Ml stages or Algorithms are available in this pipeline. Do not recommend them.

- **ML Pipeline** — a sequence of stages that helps to optimise the dataset by performing data preprocesing, feature engineering and ml stages and then using an ml algorithm to train a machine learning model.  Types of pipelines that can be created are: 
  - To generate Classification & Regression models, create a prediction pipeline. 
  - Text analytics pipelines
  - Recommendation
  - Clustering
  - Forecasting: Univariate & Multivariate Forecasting, 
  - Anomaly detection:Time series and Non-time series dataset.
 
- **ML Model** — a custom trained machine learning model generated upon successful execution of ML pipeline. 

- **AutoML** — an automated pipeline that builds prediction models for you: you select the **target column** and the **algorithm type (Classification or Regression)**, and AutoML handles preprocessing, model selection, tuning, and training — no hand-assembling stages or picking an algorithm. Supports prediction (Classification/Regression) models only.

- **Stage** — a building block from the builder's left operations panel (a data, ML, custom-code, or algorithm stage) that you drag and drop onto the builder canvas.
- **Custom Code** - a set of custom code stages to introduce specific business logic requirements using custom algorithm, custom data transformation or custom ML transformation.
- **Class Imbalance** - occurs when the number of samples in one class (called the majority class) significantly outnumbers those in another class (called the minority class) in classification problems (e.g., detecting fraud or diagnosing rare diseases). Available techniques to address it: Oversampling (SMOTE, RandomOverSampler, BorderlineSMOTE, ADASYN) or Undersampling (RandomUnderSampler, TomekLinksUnderSampler, EditedNNUnderSampler, NearMissUnderSampler)
- **Classic Mode pipeline builder** — A default end-to-end pipeline builder with drag-and-drop interface where all the data and ml stages available; you assemble preprocessing, feature engineering, and ML stages into an end-to-end pipeline. Available for **data, prediction, text analytics, clustering, anomaly detection and recommendation** pipelines.
- **Smart mode pipeline builder** — a prebuilt template with fixed preprocessing, feature extraction, and
  algorithm steps to reduce complexity. Available for **text analytics and forecasting** pipelines.
- **Periodic sync** - dataset sync can be configured using **Sync Frequency** during the dataset upload or after the import, with various periodic interval options includes daily, weekly, monthly, yearly, and custom frequencies set in hours and minutes, with a minimum of 6 hours to a maximum of 23:59 hour intervals. Available for data connectors like **Zoho Apps, Cloud Data storages like Object Storages, Databases** but not for Local file upload connector.
- **Retrain pipeline** - while creating the any of the ML pipeline for a periodic sync-enabled dataset, kindly make sure to **enable the Retrain model when the dataset is updated** option. This ensures that the model is automatically retrained whenever the dataset is updated.  But if the columns used in the existing pipeline are not present in the updated dataset, the pipeline execution may fail.
- **Feature Importance** — a chart that ranks the input features by how much they influence the model's predictions; use it to understand which variables drive the model.
- **Generate Model Explainer** - for each feature in the dataset, the effect on prediction is quantified by SHAP (SHapley Additive exPlanations) values, which explains the decision/outcome/inference of the machine learning model. These values help to understand and interpret the models decisions and increase transparency. The distribution of values on the x-axis indicates whether the respective feature has a positive or negative impact on the prediction, along with its score. Available only for classification and regression algorithms.
- **Endpoint** — a published model version exposed as an authenticated REST API (+SDK).
- **Zia Features** - the set of text analytics stages available in the both data and ml pipeline builders in classic modes. Stages available are Sentiment Analysis, Keyword extraction, Language detection, Emotion detection, Intent Extraction, Activity Extraction, Commitment Classification. These can be used for a wide variety of tasks that involve understanding and processing text datasets. 

---

## Choose the right pipeline for the required model 

| Goal | Pipeline type | Pipeline Builder mode |
|---|---|---|
| Predict a category (spam, churn, fraud) | Prediction pipeline → **Classification & Ensemble Algorithms** | Classic (Default) |
| Predict a number (price, sales, demand) | Prediction pipeline → **Regression & Ensemble Algorithms** | Classic (Default) |
| Forecast a value over time | **Forecasting pipeline** (univariate = one variable; multivariate = many) | Smart |
| Group unlabeled records (segmentation) | **Clustering pipeline** | Classic (Default) |
| Flag outliers / fraud / rare events | **Anomaly Detection pipeline** (time-series or non-time-series) | Classic (Default) |
| Understand text (sentiment, intent, topic) | **Text Analytics pipeline** (trainable NLP pipeline) | Smart or Classic |
| Recommend items to users | **Recommendation pipeline** | Classic (Default) |
| Only clean / transform data | **Data Transformation** | Classic (Default) |
| Don't know which algorithm to use | **AutoML** (auto-selects & tunes; scope to Classification / Regression) | — |
| Quick Text analytics tasks like sentiment analysis, keywords, language, emotion, intent, activity, commitment | Data Transformation pipeline->Use **Zia features** stages | Classic (Default) |

>QuickML exposes ready-made **Zia features** text-analytics stages in the data Transformation pipeline builder — no training required.
> - Need a result with **no training** (read text from an image, detect faces, moderate images.

---

## End-to-end ML pipeline building flow (how to)

### Step 1 — Import data
Import dataset single or multiple as required from the available data connectors spanning across **Zoho apps**, **Cloud Storages**, **External databases**, **Local file upload**.  
 - Configure the necessary **Periodic Sync** requirements for the dataset.
 - The **Data Profiler** triggers backend automatically once dataset is successfully uploaded. It generates record/unique/missing counts, stats, correlation heatmap, quality score with a preview sample for 250 records for every dataset import by default.

### Step 2 — Create a pipeline
When creating the pipeline, set the required column mapping for that pipeline type (see table) — for supervised pipelines this includes the target column.
### Required column mapping (by pipeline type)

Set this when creating the pipeline. Supervised pipelines need a target; unsupervised ones don't.

| Pipeline type | Target column? | Required column mapping |
|---|---|---|
| **Data (Transformation)** | No | None — operates on the source dataset; no label |
| **Prediction (Classification / Regression)** | Yes | **Target column** (label to predict); remaining columns = features |
| **Text Analytics** | Yes | **Text/input column** + **target (label/category) column** |
| **Recommendation** | No single target | **User column** + **Item column** + **interaction column** |
| **Forecasting (Time Series)** | Yes (value) | **Date/time column** + **target (value) column**; *multivariate* adds extra feature columns |
| **Clustering** | No | Feature columns only (unsupervised) |
| **Anomaly Detection** | No | *Non-time-series:* feature columns. *Time-series:* **date/time column** + **value column** |
| **AutoML** | Yes | **Target column** + choose algorithm type (Classification / Regression) |

> Confirm the exact field labels in the Create-Pipeline window; mapping options vary slightly by pipeline type.

### AutoML pipeline

To auto-build a prediction model, create an **AutoML pipeline** → select
the **target column** → choose **algorithm type (Classification or Regression)** → **Create**. 
AutoML handles preprocessing, model selection, tuning, and training, so you **skip the manual pipeline
building in Step 3**. Continue with evaluate → publish → inference (Steps 5–8). AutoML supports
prediction (Classification/Regression) models only.

### Step 3 — Build the pipeline
At the source stage, the selected dataset from the above step 2 is already loaded with a profile for sample dataset for 250 record sample and whole dataset.  Drag-and-drop required stages in the pipeline builder, connect them to build an end-to-end pipeline. Connect data and ML stages as needed in the sequence for data preprocessing and feature engineering to be done on the dataset.

- Clean and optimise the dataset with data preprocessing stages like **Data Cleaning, Data Transformation, Data
  Extraction**  
- Perform feature engineering using machine learning stages like **Encoding, Imputers (missing values), Normalization,
  Transformer, Feature Engineering**.
- Handle **class imbalance** using available techniques like **Oversampling or Under sampling**.
- Use **Custom Code** stages to introduce specific code level requirements in data, ml or algorithm stages.
- Choose the best **algorithm** suitable for the business need from the available list of algorithm stages in the respective pipeline type.
- Finally connect the algorithm stage, **enable Generate Model Explainer** check box to generate the SHAP values during the model inferences.

**Edit pipeline** again for fine tuning the model using hyperparameters or add or remove any stage in between in the pipeline. Learn more about it in stage reconfiguration. https://docs.catalyst.zoho.com/en/quickml/help/stage-reconfiguration/index.md

> Use only the stages/algorithms listed in '**Pipeline stages**' and '**ML Algorithms**' below.

### Step 4 — Train the model

Execute the built pipeline to train the model. On successful execution, QuickML generates
a **versioned ML model** with its **evaluation metrics auto-generated** (based on the pipeline/
model type). If execution fails, fix the flagged stage/column issue and re-execute. 
- **Model Generation**: Only upon each successful pipeline execution produces a new model version with updated evaluation metrics.

### Step 5 - Evaluate the model

- **Model Evaluation**: Review the model-type-specific metrics on the Model Details page; if they are not as expected, iterate on stages/hyperparameters and retrain.
    - **Classification Model**: confusion matrix, accuracy, precision, recall, F1
   - **Regression** : R², MAE, MSE, RMSE
   - **Text analytics**: accuracy, precision, f1 score, Log-Loss score, AUC-ROC, 
   - **Recommendation**: Algorithm specific metrics available. Metrics are Coverage, NDCG at K, Accuracy, ROC AUC, Precision, Recall, Recurrence rate, MAE, MSE
   - **Forecasting**: MAPE, Symmetric MAPE, MSE, RMSE, MSLE, Root MSLE
   - **Clustering** : Silhouette Score, Calinski-Harabasz Score, Davies-Bouldin Score, Number of clusters
   - **Anomaly detection** : MAPE, SMAPE, MSE, RMSE, MSLE, RMSLE, Number of Anomalies 
   - **Cross-validation**. K-Fold
   - **Feature Importance chart** : a data visualization chart to see the input features influence on the model's predictions. Review it on the Model Details page (see Core concepts).

> - **Compare metrics across model versions**; the best-performing version is the one you publish.

### Step 6 — Create the endpoint
- Pick the best-performing **model version** → **Create endpoint**.
- QuickML supports **three endpoint types**, each built from a saved configuration and generating its own REST API + SDK: **ML model** (this file), **LLM Serving**, and **RAG** (both → `generative-ai-basics.md`). For an ml model, create an **ML model endpoint**.
- On creation, QuickML provisions a **REST API** and generates the **endpoint key** and **SDK snippets** (JavaScript, Python, Java).

### Step 7 — Understand and publish
- **Review the endpoint details** before going live: endpoint URL, HTTP method, OAuth scope, required headers, and the sample request/response.
- **Test with the Model Tester** — Push the sample input in the console to confirm the endpoint behaves as expected. What you test is what gets deployed.
- **Publish** the endpoint to make it callable. 
- **Manage versions:** point the endpoint at a newer model version as you retrain, or roll back to a previous version.
- **Auth:** OAuth2 (or internal auth for Catalyst-internal calls).

### Step 8 — Predict / inference
- **Call the endpoint** via REST (POST with OAuth token) or the Catalyst SDK.
- **Feature keys must match the training column names exactly (case-sensitive)** — mismatches are the most common cause of null/empty predictions.
- **Model Explanation (SHAP):** per-feature attributions are returned only when the prediction call asks for them (`explainModel=true` on REST/MCP) — a plain prediction returns just `result`. The model must have the explainer enabled (shown as `model_explainer` when the endpoint is published).

## Programmatic usage

###  CLI commands

QuickML pipelines and endpoints are used within Catalyst projects deployed via the Catalyst
CLI. Typical flow:

```bash
catalyst login            # authenticate
catalyst init             # scaffold / link a project (select components)
catalyst serve            # run functions locally that call QuickML endpoints
catalyst deploy           # deploy functions/resources that consume QuickML
```

###  Supported frameworks
Frameworks commonly used: **scikit-learn,
pandas, NumPy**, and gradient-boosting libraries (XGBoost, LightGBM, CatBoost).

###  SDKs

QuickML ships in the Catalyst SDK family: **JavaScript, Python, Java** (plus the deprecated Node.js SDK v2). Two-step pattern in all languages: create a QuickML component instance, then call **`predict(endpointKey, inputData)`**.

> **Verified live (October 2026)** against a published endpoint with `@zcatalyst/quickml` 1.0.0, `zcatalyst-sdk` (Python) 1.4.0, and `zcatalyst-sdk-node` 3.4.0: each SDK's QuickML class has exactly one call method, `predict` (the Java SDK 2.4.0 `ZCQuickML` class was checked by signature and matches). The docs pages show `runInference` / `run_inference` — **those methods do not exist in the published SDKs** and fail at runtime. There is no `model(id)`, no `batchPredict()`, and no `confidence` field in the response.

All SDKs return the same shape:

```json
{ "result": ["yes"], "pipeLineType": "prediction", "status": "success" }
```

Input values may be strings or numbers — both were accepted in testing.

#### JavaScript SDK (`@zcatalyst/quickml` — current, use for new code):

```javascript
const { zcAuth } = require('@zcatalyst/auth');
const { QuickML } = require('@zcatalyst/quickml');

// Pass the Advanced I/O request (req) or the Basic I/O context.
const app = await zcAuth.init(req);
const quickML = new QuickML(app);
// ML endpoint key copied from the Catalyst console.
const endpointKey = "<ENDPOINT_KEY>";
// Keys must match the model's training column names exactly (case-sensitive).
const inputData = {
  "<FEATURE_1>": "<VALUE_1>",
  "<FEATURE_2>": "<VALUE_2>"
};

const predictionResponse = await quickML.predict(endpointKey, inputData);
console.log(predictionResponse.result);
```

#### Python (`zcatalyst-sdk`):

```python
import zcatalyst_sdk

def handler(context, basicio):
    app = zcatalyst_sdk.initialize(req=context)
    quickml = app.quick_ml()

    # Replace with your endpoint key copied from the Catalyst console.
    endpoint_key = "<ENDPOINT_KEY>"
    # Keys must match the model's training column names exactly (case-sensitive).
    input_data = {
        "<FEATURE_1>": "<VALUE_1>",
        "<FEATURE_2>": "<VALUE_2>"
    }

    response = quickml.predict(endpoint_key, input_data)
    basicio.write(str(response["result"]))
    context.close()
```

#### Node.js SDK v2 (`zcatalyst-sdk-node` — deprecated; the docs say migrate to the JavaScript SDK):

Use only when the project already depends on `zcatalyst-sdk-node`.

```javascript
const catalyst = require('zcatalyst-sdk-node');

const catalystApp = catalyst.initialize(req);
const quickML = catalystApp.quickML();
// predict(endPointKey, inputData) — endpoint key from Console → QuickML endpoint
const result = await quickML.predict('YOUR_ENDPOINT_KEY', { feature1: 'value1', feature2: 42 });
// result: { result: ["..."], pipeLineType: "prediction", status: "success" }
```

The JavaScript SDK and Node.js SDK v2 differ only in how the instance is created: `new QuickML(app)` (JavaScript SDK) vs `catalystApp.quickML()` (Node.js SDK v2). Both call `predict()`.

#### Java:

```java
HashMap<String, String> input_data = new HashMap<>();
input_data.put("<FEATURE_1>", "<VALUE_1>");
input_data.put("<FEATURE_2>", "<VALUE_2>");
ZCQuickML quickMlInstance = ZCQuickML.getInstance();
String endpointKey = "<ENDPOINT_KEY>";
ZCQuickMLDetail result = quickMlInstance.predict(endpointKey, input_data);
String status = result.getStatus();
ArrayList<String> predictions = result.getResult();
```

Verified against the Java SDK 2.4.0 class signatures (the jar `catalyst functions:add --stack java17` downloads): `ZCQuickML` has `getInstance()`, `getInstance(ZCProject)`, and `predict(String, HashMap<String, String>)` only — no `runInference`. Java input values are typed as strings.

#### Local testing gotcha

Under `catalyst serve`, every SDK `predict()` call fails with `ORGID_HEADER_UNAVAILABLE` (HTTP 400) unless the `X_ZOHO_CATALYST_ORG_ID` environment variable is set — the SDKs send the `CATALYST-ORG` header only from that variable. Start the local server with it: `X_ZOHO_CATALYST_ORG_ID=<org-id> catalyst serve`.

There is no confidence/probability score in any SDK response. If the user needs one, say so — do not invent a field. SHAP explanations are available through the REST/MCP `explainModel` option (see below).

### SDK docs 
**Base URL**: `https://docs.catalyst.zoho.com/en/sdk/`. Append the path below to it (each path already ends in `index.md`, the Markdown version). If `index.md` fails, drop it and use the HTML page.


> | Feature | Java | Python | JavaScript |
> |---|---|---|---|
> | Prediction (custom ML endpoint) | `java/v1/quickml/execute-custom-ml-endpoint/index.md` | `python/v1/quickml/execute-custom-ml-endpoint/index.md` | `javascript/v1/quickml/execute-custom-ml-endpoint/index.md` |


## Tools & automation
> Prefer connected Catalyst MCP tools for any action — see step 3 of "How It Works" in SKILL.md.


##  REST API — parameters

### Prediction endpoint

`POST https://<catalyst-api-host>/quickml/v1/project/{project_id}/endpoints/predict`

- **Host** is data-center-specific (e.g. `api.catalyst.zoho.com`, `api.catalyst.zoho.in`).
- This is the path all three SDKs call (read from the SDK source and exercised by the live SDK tests above).

**Headers**
```json
{
  "X-QUICKML-ENDPOINT-KEY": "<endpoint-key>",
  "Authorization": "Zoho-oauthtoken <access-token>",
  "CATALYST-ORG": "<org-id>",
  "Environment": "Development"
}
```

**Request** — features wrapped in `data`
```json
{ "data": { "<FEATURE_1>": "<value>", "<FEATURE_2>": 42 } }
```

**Response**
```json
{ "result": ["<predicted-result>"], "pipeLineType": "prediction", "status": "success" }
```

With the `explainModel=true` query parameter, the response also carries an `explanation` object (per-feature SHAP-style attributions), for example:
```json
{ "result": ["yes"], "explanation": { "data": [["support_tickets", 0.875, 0.9925]], "baseValue": 0 }, "pipeLineType": "prediction", "status": "success" }
```

**Parameter notes:**
- **Endpoint key** goes in the `X-QUICKML-ENDPOINT-KEY` header (not the URL path); copy it from the endpoint's Console page.
- **`CATALYST-ORG` is required** — without it the API returns `400 ORGID_HEADER_UNAVAILABLE`.
- **Body / feature keys** — must match the ML model's training column names **exactly (case-sensitive)**; wrap them inside `data`. String and numeric values are both accepted.
- **No probability field** — the response has no `likelihood_score` or `confidence`. Do not generate one.
- **OAuth scope:** `QuickML.deployment.READ` — the scope the Console's endpoint "Connection Details" panel lists for QuickML endpoints. Confirm on the endpoint's page.
- The Catalyst MCP tool `CatalystbyZoho_Predict_With_QuickML_Endpoint` accepts `data` as an **array** of records (several predictions in one call) and exposes `explainModel` as a query option.



---
## Pipeline stages

**Rule — stages.**
- Use ONLY the exact stage names listed below (they match the QuickML builder). Do NOT invent or
  paraphrase names.
- The **bold category labels** (Data Cleaning, Data Transformation, Encoding, Imputers,
  Normalization, Transformers, Feature Engineering, Class Imbalance, and their sub-labels) are
  groupings/action names — **not draggable**. Never guide/tell the user to drag a category; always name the specific stage.
- **Normalization** has two forms: a **generic Normalization** stage (under Data Transformation;
  usable in both Data Transformation and ML pipelines) and **technique-specific** stages
  (Min-Max, Unit, Mean, Mean-Std, Robust; ML pipelines only). Use the specific stage when a method
  is required — e.g. drag **Robust Normalization**, not "Normalization".
- If you need a stage not listed here, fetch the relevant docs page and use the exact name found
  there — **never a plausible-sounding substitute**. 
  
Docs are JS-rendered, so fetch the `/index.md` variant.


### Data preprocessing

- **Data Cleaning:** Fill Columns · Filter (Single Output Filter, Double Output Filter) · Remove Duplicates · Select or Drop

- **Data Transformation:** Date Time Transformation · Email Transformation · Extract Data · Format · Group By · Hash Generator · Join · Merge Column · Normalization · Outlier Handler · Sort · Split Column · String Transformation · Type Conversion · URL Transformation · Union · Windowing · Fill Columns · Rename · Custom Expression

- **Data Extraction:** Add Dataset · Split Dataset (Row Based Split, Column Based Split)


### Stages
- **Encoding:** Ordinal Encoder · One-Hot Encoding · JamesStein Encoder · Label Encoding · LeaveOneOut Encoder · Target Encoding · Count Encoder · Backward Difference Encoding · Helmert Encoding · CatBoost Encoding
- **Imputers:** KNN Imputation · MissForest Imputation · Mean Imputation · Median Imputation · Mode Imputation · Group-By Imputation
- **Normalization:** Min-Max Normalization · Unit Normalization · Mean Normalization · Mean-Std Normalization · Robust Normalization
- **Transformers:** Square Transform · Cube Transform · Inverse Transform · Root Transform · Log Transform
- **Feature Engineering:**
  - **Feature Generation**: Operations, Autolearn, ExploreKit
  - **Feature Selection** Embedded, Filter, Redundancy Elimination, Backward Feature Elimination, Exhaustive Feature Engineering, Forward Selection
  - **Feature Reduction** PCA, FA, NMF, ICA, LDA

- **Class Imbalance:**
  - **Oversampling** SMOTE · RandomOverSampler · BorderlineSMOTE · ADASYN
  - **Undersampling** RandomUnderSampler · TomekLinksUnderSampler · EditedNNUnderSampler · NearMissUnderSampler

### Algorithm stages
Choose the algorithm from the **ML Algorithms** catalog below — use exact names; if unsure, fetch the algorithms `/index.md`.


##  ML Algorithms (quick reference)

Available list of algorithms below - full hyperparameters list are available on the linked docs pages.

- **Classification** — AdaBoost, CatBoost, Decision Tree, Gradient Boosting, KNN, LightGBM,
  Logistic Regression, Naive Bayes, Random Forest, SVM, XGBoost.
  <https://docs.catalyst.zoho.com/en/quickml/help/ml-algorithms/classification-algorithms/>
- **Regression** — Linear, Ridge, Lasso, ElasticNet, Decision Tree, Random Forest, Gradient
  Boosting, AdaBoost, KNN, Kernel, SVM, LightGBM, CatBoost, XGBoost.
  <https://docs.catalyst.zoho.com/en/quickml/help/ml-algorithms/regression-algorithms/>
- **Ensemble** — Classification/Regression ensembling and Stacking.
  <https://docs.catalyst.zoho.com/en/quickml/help/ml-algorithms/ensemble/>
- **Recommendation** — SubSequence, LightFM, Pixie, Recurrence Finder.
  <https://docs.catalyst.zoho.com/en/quickml/help/ml-algorithms/recommendation/>
- **Forecasting** — MA, AR, ARMA, ARIMA / Auto ARIMA, SARIMA, Exponential Smoothing,
  Holt-Winters, VAR.
  <https://docs.catalyst.zoho.com/en/quickml/help/ml-algorithms/time-series/>
- **Text Analytics** — Naive Bayes, SVM (plus preprocessing/feature-extraction stages).
  <https://docs.catalyst.zoho.com/en/quickml/help/ml-algorithms/text-analytics/>
- **Clustering** — KMeans, MiniBatchKMeans, Fuzzy CMeans, KMedians, KModes, KMedoids, KPrototypes, Affinity Propagation, BIRCH, MeanShift, DBSCAN, CLARA, CLARANS, GMM.
  <https://docs.catalyst.zoho.com/en/quickml/help/ml-algorithms/clustering/>
- **Anomaly Detection** —
  - **Non-time series data**: One-Class SVM, Isolation Forest, LOF and
  - **Time-series data**: Auto Regressor, MA, ARIMA/Auto ARIMA, ARMA, SARIMA, Exponential Smoothing, Holt-Winters.
  <https://docs.catalyst.zoho.com/en/quickml/help/ml-algorithms/anomaly-detection/>

Need custom logic? Use **Custom Code** stages (Python): Custom Data transformation, Custom ML transformation, or a Custom Algorithm.
<https://docs.catalyst.zoho.com/en/quickml/help/custom-code/>

---

## Limits & common gotchas

- **Entity limits (verify current values in docs):** ~25 datasets, ~25 pipelines,
  ~10 endpoints per project; ~25 columns per stage; data preview samples 250 records.
- **Data-source row/size limits (verify):** Zoho apps ~200K rows (periodic sync for
  CRM/Bigin/Recruit up to ~1M), object storage ~1 GB, databases ~100K rows, file upload ~1 GB.
- **Prediction returns null/empty** → Feature keys in the
request must match the training column names exactly.
- **`Model not deployed`** → publish the model version as an endpoint before calling it.
- **401 / Unauthorized** → refresh the OAuth token; confirm the endpoint key/URL.
- **400 `ORGID_HEADER_UNAVAILABLE`** → the `CATALYST-ORG` header is missing. Under `catalyst serve`, set `X_ZOHO_CATALYST_ORG_ID=<org-id>` before starting the server.
- **`runInference is not a function` / `AttributeError: run_inference`** → the docs' method name does not exist in the published SDKs; call `predict()`.
- **AutoML pipelines train on creation** — creating an AutoML pipeline (console or the `CatalystbyZoho_Create_AutoML_Pipeline` MCP tool) immediately trains model V1. Calling execute right after returns `CANNOT_EXECUTE_PIPELINE`; check the model's versions instead and create the endpoint from V1.
- Full limits: <https://docs.catalyst.zoho.com/en/quickml/help/quickml-limitations/>




## Where to go deeper

> **Fetching docs:** every link below is the Markdown (`/index.md`) version — fetch as-is. For
> any other page, append `/index.md` to the page URL (the plain URL is JS-rendered and returns
> no content). If a **section landing** page comes back empty, or you need a page not listed
> here, use the docs index that lists every fetchable page:
> <https://docs.catalyst.zoho.com/en/quickml/llms.txt>

- Getting started: <https://docs.catalyst.zoho.com/en/quickml/getting-started/introduction/index.md>
- Data connectors: <https://docs.catalyst.zoho.com/en/quickml/help/data-connectors/zoho-apps/index.md>
- Data transformation: <https://docs.catalyst.zoho.com/en/quickml/help/data-preprocessing/data-transformation/index.md>
- Data cleaning: <https://docs.catalyst.zoho.com/en/quickml/help/data-preprocessing/data-cleaning/index.md>
- Data extraction: <https://docs.catalyst.zoho.com/en/quickml/help/data-preprocessing/data-extraction/index.md>
- Data visualization: <https://docs.catalyst.zoho.com/en/quickml/help/data-visualization/overview/index.md>
- ML operations: <https://docs.catalyst.zoho.com/en/quickml/help/operations-in-quickml/encoding/index.md>  *(carries the operations overview; siblings: feature-engineering, imputers, normalization, transformer)*
- ML algorithms: <https://docs.catalyst.zoho.com/en/quickml/help/ml-algorithms/classification-algorithms/index.md>  *(carries the algorithms overview; siblings: regression-algorithms, ensemble, recommendation, time-series, text-analytics, clustering, anomaly-detection)*
- Model details & metrics: <https://docs.catalyst.zoho.com/en/quickml/help/models-details/index.md>
- ML Model endpoints: <https://docs.catalyst.zoho.com/en/quickml/help/pipeline-endpoints/index.md>
- Learning Center: <https://docs.catalyst.zoho.com/en/quickml/help/learning-center/recommendation/index.md>  *(siblings: time-series, text-analytics, anomaly-detection, automl, clustering)*
- Stage reconfiguration: https://docs.catalyst.zoho.com/en/quickml/help/stage-reconfiguration/index.md
- Pricing (marketing page, not docs — no `/index.md`): <https://catalyst.zoho.com/pricing.html>


**Related references:** `generative-ai-basics.md` (LLM Serving, RAG, Knowledge Base).
