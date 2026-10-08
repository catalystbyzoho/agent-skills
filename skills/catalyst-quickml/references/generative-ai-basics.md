# QuickML — Generative AI (Agent Reference)

Practical, directive reference for QuickML's Generative AI module: serving LLMs, grounding
them with RAG over a Knowledge Base, and publishing them as endpoints. 

For **custom trained ML models** access `prediction-basics.md`

## Availability (by data center):
> - **Generative AI** (LLM Serving, RAG, Knowledge Base) — available and publishable in **US, IN, EU, JP** only; **not available in AU, SA, or CA**.

## Pricing
> See `quickml-pricing-basics.md` for plans, pay-as-you-go rates, and free-tier limits.

## Core concepts

- **Models** - a set of large language models with configurable parameters to fine tune the responses.
- **LLM tool calling** - tools to interact with external systems, get responses in real time and generate accurate response to the user. **GLM-4.7 Flash only.** Workflow: define tools in JSON Schema format → model identifies when to invoke a tool and returns a structured call → your app executes it and returns the result → model generates final response incorporating the outcome.

- **LLM interaction mode** - 
  - **Single shot mode** - LLM generates response handling each prompt sent as a separate query. Default mode.
  - **Conversation mode** - LLM generates responses while retaining previous interactions as context. **GLM-4.7 Flash only** — not available for Qwen VLM.

- **RAG** - Ground the responses with RAG using Knowledge Base documentation. 
- **RAG Modes** - Three modes are available in QuickML's RAG Builder: 

  - **Response Generation** — a natural-language answer grounded in retrieved content.
  - **Document Search** — returns the most relevant document chunks only (no generation).
  - **Agentic RAG** — an agent layer decomposes complex queries into sub-queries and reasons across multiple steps.

- **Knowledge base** - a storage repository where uploaded documents are intelligently indexed and leveraged as contextual data for relevant information retrieval. Documents can be uploaded via:
    - **Local file upload**: .pdf, .docx, .txt, .md, .html — up to 10 files per import session, max 100 MB per file
    - **Zoho WorkDrive**: up to 10 files per import session, max 250 MB per file
    - **Zoho Learn**: one document per import — provide the document name in the UI, select Learn Hub → Space → Manual → Article, and configure sync frequency (Daily, Weekly, Monthly, Yearly, or Custom)
    - **API upload**: max 100 MB per file, and the files in one upload must total 250 MB or less

- **Document Store** - the ground truth for a RAG session; documents are added here from the Knowledge Base and used for context retrieval during a query.
    - If Document Store is empty, retrieval scope expands to the Knowledge Base.

- **Playground** - a chat window to test LLMs and RAG in the Generative AI module of QuickML.
- **Saved Configuration** - saves parameters, prompts, instructions, tools, etc. for LLM Serving and RAG features.
- **Generative AI Endpoints** - Saved Configurations (LLM or RAG) published as authenticated REST API endpoints (+ SDK).

- **Periodic sync** - document sync can be configured using **Sync Frequency** for Knowledge Base documents uploaded via **Zoho WorkDrive** or **Zoho Learn**; not available for the Local file upload connector.
    - **WorkDrive:** one sync configuration applies to every document in the import session (no per-document setting), and it cannot be changed after upload. To use a different schedule, import those files in a separate session.
    - **Zoho Learn:** sync is configured for the single imported document.


----

## 1. LLM Serving

A chat interface for accessing and testing available LLMs with various parameter combinations.

QuickML does not use your data for model training.

**Steps**
1. **LLM Serving** → **Playground** tab; pick a model and adjust parameters.
2. **Save Configuration**.

Docs: <https://docs.catalyst.zoho.com/en/quickml/help/endpoints/llm-serving-endpoint/index.md>

---

## 2. RAG (Retrieval-Augmented Generation)

Grounds LLM answers in your own documents. Retrieves the most relevant content from the Knowledge Base first, then generates a grounded response.

**Steps**
1. **Upload documents** to Knowledge Base.
2. Access the RAG Builder interface and add the required documents to **Document Store** via Knowledge Base.
3. Configure a RAG setup using available parameters based on the selected RAG mode, then test.
4. **Save Configuration**.

Docs: <https://docs.catalyst.zoho.com/en/quickml/help/endpoints/rag-endpoint/index.md>

---

## 3. Knowledge Base

The document store that powers RAG (documents are chunked and embedded for retrieval).

**Import modes:**

| Mode | Files per import | Max per file | Sync |
|---|---|---|---|
| **Local upload** (.pdf / .docx / .txt / .md / .html) | 10 per session | 100 MB | Not available |
| **Zoho WorkDrive** | 10 per session | 250 MB | One configuration for the whole session; cannot be changed after upload |
| **Zoho Learn** | 1 | — | Configurable for the document |
| **API upload** | — | 100 MB | — (all files in one upload must total ≤ 250 MB) |

- **Zoho Learn** — import an article or a manual. Use **portal URLs only** — team-specific paths won't work.
- These limits come from the QuickML product team. The public Knowledge Base docs page still lists 500 KB per file; that figure is outdated — use the limits above.

Each uploaded document gets a unique **Document ID** — copy it from the KB to scope RAG retrieval to specific documents in API calls.

Docs: <https://docs.catalyst.zoho.com/en/quickml/help/generative-ai/knowledge-base/index.md>

## 4. Available models

- **GLM-4.7-Flash**: 30B-A3B MoE text-only model (~3B active params/token). Optimized for coding, reasoning, agent workflows, and long-context tasks (200K input / 128K output tokens). Supports native tool calling. Model key: `crm-di-glm47b_30b_it`.
  <https://docs.catalyst.zoho.com/en/quickml/help/available-models/glm-4.7-flash/index.md>

- **Qwen 3.6 35B Vision Language (VLM)**: 35B-A3B multimodal MoE model (~3B active params/token, 8-bit precision). Handles combined text + image input (up to 3 images, ~9K tokens total) with text-only output. Suited for document/chart understanding and image-based Q&A. Model key: `VL-Qwen3.6-35B-A3B`.
  <https://docs.catalyst.zoho.com/en/quickml/help/available-models/qwen-3.6-35b-vision-language/index.md>

---

## Programmatic usage

### CLI commands

QuickML pipelines and endpoints are used within Catalyst projects deployed via the Catalyst
CLI. Typical flow:

```bash
catalyst login            # authenticate
catalyst init             # scaffold / link a project (select components)
catalyst serve            # run functions locally that call QuickML endpoints
catalyst deploy           # deploy functions/resources that consume QuickML
```

##  SDKs

There are **no SDK methods for Generative AI endpoints** in the published Catalyst SDKs (checked October 2026): `@zcatalyst/quickml` 1.0.0, `zcatalyst-sdk` (Python) 1.4.0, `zcatalyst-sdk-node` 3.4.0, and the Java SDK 2.4.0 expose only `predict()` on the QuickML class, which is for ML model endpoints. Method names shown on the docs pages (`askLlm`, `converseWithLlm`, `analyzeImage`, `generateRagResponse`, `askRagAgent`, and their Python equivalents) do not exist in these packages — do not generate them.

Call LLM, VLM, and RAG endpoints over REST instead — see "REST API — parameters" below for the verified paths, headers, and response shapes. From a Catalyst function, any HTTP client works: send the endpoint key in `x-quickml-endpoint-key`, an OAuth token in `Authorization`, and the org ID in `CATALYST-ORG`.

## Tools & automation
> Prefer connected Catalyst MCP tools for any action — see step 3 of "How It Works" in SKILL.md.


##  REST API — parameters

Every published endpoint exposes a REST API.


### Calling GenAI Endpoints (LLM Serving, VLM, RAG)

> **Verified live (October 2026)** against a single-shot GLM-4.7 Flash LLM endpoint and a RAG endpoint, using the same request contract the Console's "Endpoint details" panel shows. VLM and conversation-mode LLM endpoints were not tested.

- **Method:** POST · **OAuth scope:** `QuickML.deployment.READ` (as shown in the endpoint's Console "Connection Details").
- **Host:** the Console shows `https://console.catalyst.zoho.com/...`; the SDK transport sends the same path to `https://api.catalyst.zoho.com/...` and both are the same API. Use the data-center-specific domain for non-US accounts.

**Required Headers**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Zoho-oauthtoken <access-token>",
  "Environment": "Development",
  "x-quickml-endpoint-key": "<endpoint-key>",
  "CATALYST-ORG": "<org-id>"
}
```
(VLM uses `Content-Type: multipart/form-data` for image upload — not verified. Allowed image formats: .jpg, .jpeg, .png, max 500 KB.)

| Type | Path | Request body | Status |
|---|---|---|---|
| LLM, single-shot | `/quickml/v1/project/{project_id}/genai/endpoints/{model}/generate` — `{model}` is the model's path name shown in the Console URL, e.g. `glm-flash-47` for GLM-4.7 Flash | `{ "prompt": "..." }` | Verified |
| LLM, conversation mode | Copy the path from the endpoint's Console page | Copy from the Console sample | Not verified |
| VLM | `/quickml/v1/project/{project_id}/genai/endpoints/vlm/generate` | `{ "images": ["<base64-encoded-image>"], "prompt": "..." }` | Not verified |
| RAG | `/quickml/v1/project/{project_id}/genai/endpoints/rag/generate` | `{ "query": "..." }` | Verified |

**What the live tests showed:**
- A single-shot LLM endpoint rejects any extra body key: adding `conversationId` returns `400 EXTRA_KEY_FOUND_IN_JSON`. Send only the keys in the Console sample.
- A single-shot LLM endpoint returns `403 PERMISSION_DENIED` ("This endpoint does not support the requested operation") on `/chat` — use `/generate`.
- RAG requires `query`; sending `prompt` instead returns `400 LESS_THAN_MIN_OCCURANCE`.

**LLM response (single-shot, live):**
```json
{
  "data": [ { "data": "PONG" } ],
  "usage": { "prompt_tokens": 18, "total_tokens": 21, "completion_tokens": 3, "prompt_tokens_details": null },
  "model": "crm-di-glm47b_30b_it",
  "finish_reason": "stop"
}
```
The generated text is at `data[0].data`. This is not an OpenAI `chat.completion` object — there is no `choices` array.

**RAG response (live):**
```json
{
  "status": "success",
  "response": "The QuickML skill validation code word is AMBER-FALCON-17.",
  "model_usage": [ { "total_tokens": 1372, "prompt_tokens": 1352, "completion_tokens": 20, "model": "crm-di-glm47b_30b_it", "image_tokens": 0 } ],
  "tokens_usage": { "total_tokens": 1372, "prompt_tokens": 1352, "completion_tokens": 20 },
  "searched_documents": [
    {
      "content": "# KB format test\nThe QuickML skill validation code word is AMBER-FALCON-17.",
      "document_title": "kb_format_test",
      "document_url": "None",
      "document_id": "1472000000024060",
      "properties": { "created_date": "2026-10-08T12:50:04.288000Z" },
      "document_version_id": "1472000000024059"
    }
  ]
}
```
⚠️ The Console's sample response for RAG shows a different, nested shape (`response.data[].output[].content`, plus `reasoning` and `metrics`), while the live endpoint returned `response` as a plain string with top-level `searched_documents`. The shape may depend on the RAG mode configured on the endpoint. Parse defensively: if `response` is a string use it directly, otherwise read `response.data[0].output[0].content`.

**VLM sample response (from the docs — not verified):**

```json
{
  "request_id": "<Unique request Id>",
  "model": "<Selected Model name>",
  "response": "<The response from the VLM>",
  "metrics": {
    "input_text_token_length": 23,
    "input_image_token_length": 1760,
    "output_text_token_length": 217,
    "total_time_taken": 5.5557215213775635
  }
}
```

**Parameter notes:**

- `x-quickml-endpoint-key` — identifies the published GenAI config; copy it from the endpoint's Console page.
- `CATALYST-ORG` is required (`400 ORGID_HEADER_UNAVAILABLE` without it).
- Model, system prompt, and generation parameters (temperature, max tokens, RAG mode, retrieval settings) are fixed when the endpoint is created — they cannot be overridden in the request body.

---

## Console-only actions (no SDK / REST equivalent)

The following actions can **only** be done in the Catalyst Console — there is no
API, SDK method, or MCP tool for them. Guide the user through the console steps
using exhaustive field-level instructions (see step 5 of "How It Works" in SKILL.md).

| Action | Where in Console |
|---|---|
| Save a new LLM Serving or RAG configuration | LLM Serving / RAG → Playground → Save Configuration |
| Test a model interactively before publishing | LLM Serving / RAG → Playground tab |
| Create an endpoint directly via saved configuration | Saved Configurations → Configuration Details → Create Endpoint |
| Upload / import documents to Knowledge Base | Generative AI → Knowledge Base → Upload |
| Add documents to Document store | Generative AI → RAG → Document Store → Add Documents → Knowledge Base → Select documents → Add |


---
## Create Endpoints — Generative AI
Create endpoints for Generative AI features LLM/RAG in two ways. Applies to both LLM Serving and RAG saved configurations.

1. From the **Endpoints** module, click **Create Endpoint** and provide:
   
    **Steps**
    1. **Endpoint Name** — a name to identify the endpoint.
    2. **Select Endpoint Type**: Select any of the type below as endpoint type.
      - **LLM Configuration** — for LLM Serving / VLM saved configurations
      - **RAG Configuration** — for RAG saved configurations (includes the configured document store)
    3. **LLM/RAG Configuration** — select the specific saved configuration using the dropdown to publish.
    4. Click **Create Endpoint**

2. Via **Saved configurations** tab in LLM Serving/RAG:

    **Steps**
    1. Access the Saved Configuration tab
    2. Select the required **Configuration**
    3. Click **Create Endpoint** 
  
#### Endpoint URL
QuickML provisions a dedicated **REST API** and issues an **endpoint key**. The Console may also show SDK snippets, but the published SDKs have no GenAI methods — use the REST call. The endpoint is callable immediately — no separate publish step for GenAI endpoints (unlike ML Model endpoints, which require an explicit publish action).
> - **Edit** the endpoint later to modify the parameter configuration as you iterate.
> - **Endpoint config snapshot:** Editing a saved configuration after endpoint creation **does not affect the live endpoint**. The endpoint retains a snapshot of the configuration at the time of creation. To publish the latest paramaters either edit or create a new endpoint.
> - Each endpoint is authenticated (OAuth2) and metered.


 **Endpoint References**
> - **LLM Endpoints**: `https://docs.catalyst.zoho.com/en/quickml/help/endpoints/llm-serving-endpoint/`
> -  **RAG Endpoints**: 
`https://docs.catalyst.zoho.com/en/quickml/help/endpoints/rag-endpoint/`

---


## Tools & automation
> Prefer connected Catalyst MCP tools for these actions — see step 3 of "How It Works" in SKILL.md.



##  Limits & gotchas

- **Knowledge Base** upload limits: local files max 100 MB and WorkDrive files max 250 MB each, 10 files per import session; API uploads max 100 MB per file and 250 MB total per upload. Split larger content into several files.
- **WorkDrive sync is fixed per import session** — it cannot be edited after upload, and every document in the session shares it. Import files that need a different schedule in their own session.
- **401 / Unauthorized** on an endpoint → refresh the OAuth token; confirm the endpoint key and URL.
- **400 `ORGID_HEADER_UNAVAILABLE`** → the `CATALYST-ORG` header is missing. Under `catalyst serve`, set `X_ZOHO_CATALYST_ORG_ID=<org-id>` before starting the server.
- **RAG returns weak/empty context** → ensure the Knowledge Base is populated and indexed; adjust retrieval settings.

- **Retrieval scope:** RAG retrieves relevant chunks only from the documents added to the
**document store**. If no documents are added, retrieval falls back to a **global search**
across all documents in the **Knowledge Base** to find relevant chunks for the query.

- **Agentic RAG - reasoning vs Top-K:** When the **Perform Reasoning** parameter is enabled, the
**Top-K** parameter is disabled — document retrieval is instead driven by each sub-query's
requirements.
- **Zoho Learn KB URL:** Use portal URLs only — team-specific paths silently fail.

## Stable platform behaviors (quick reference)

| Behavior | Detail |
|---|---|
| Conversation mode availability | GLM-4.7 Flash only — not available for Qwen VLM |
| Tool calling availability | GLM-4.7 Flash only |
| Tool definition format | JSON Schema (name, description, parameters with type + description) |
| GenAI endpoint activation | Callable by default on creation — **no publish step needed** (unlike ML model endpoints) |
| Endpoint config snapshot | Editing saved config after endpoint creation does NOT affect the live endpoint |
| Document ID | Each KB document has a unique ID — use it in API calls to scope retrieval to specific docs |
| Zoho Learn URL | Portal URLs only — team-specific paths won't work |
| WorkDrive sync config | Shared by all documents in an import session; cannot be modified after upload |

## Dynamic information — fetch from help docs

The following change as the product evolves. **Always fetch the relevant doc page** rather than relying on hardcoded values:

| Topic | Fetch from |
|---|---|
| Available LLM models (names, context window, capabilities) | <https://docs.catalyst.zoho.com/en/quickml/help/generative-ai/llm-serving/index.md> |
| Model parameters per model (Temperature, Top-K, Top-P, Max Tokens ranges, Enable Thinking, etc.) | <https://docs.catalyst.zoho.com/en/quickml/help/generative-ai/llm-serving/index.md> |
| RAG parameters per mode (Tolerance, Strict Mode, Response Type, Query Enrichment, Save Chat History, Do Chit Chat, Agent Name, Top-K) | <https://docs.catalyst.zoho.com/en/quickml/help/endpoints/rag-endpoint/index.md> |
| RAG chat history support/limitations | <https://docs.catalyst.zoho.com/en/quickml/help/generative-ai/rag/index.md> |
| WorkDrive sync frequency options | <https://docs.catalyst.zoho.com/en/quickml/help/generative-ai/knowledge-base/index.md> |
| Zoho Learn import types (article vs manual) | <https://docs.catalyst.zoho.com/en/quickml/help/generative-ai/knowledge-base/index.md> |

## Where to go deeper

**Guides**
- LLM Serving: <https://docs.catalyst.zoho.com/en/quickml/help/generative-ai/llm-serving/index.md>
- RAG: <https://docs.catalyst.zoho.com/en/quickml/help/generative-ai/rag/index.md>
- Knowledge Base: <https://docs.catalyst.zoho.com/en/quickml/help/generative-ai/knowledge-base/index.md>

**Endpoints**
- LLM Serving endpoint: <https://docs.catalyst.zoho.com/en/quickml/help/endpoints/llm-serving-endpoint/index.md>
  - Section 1: LLM interaction modes (single-shot vs conversation)
  - Section 2: LLM tool calling
  - Section 3: LLM Endpoints
- RAG endpoint: <https://docs.catalyst.zoho.com/en/quickml/help/endpoints/rag-endpoint/index.md>
  - Section 1: RAG modes

**Available models**
- GLM 4.7 Flash: <https://docs.catalyst.zoho.com/en/quickml/help/available-models/glm-4.7-flash/index.md>
- Qwen 3.6 35B Vision Language (VLM): <https://docs.catalyst.zoho.com/en/quickml/help/available-models/qwen-3.6-35b-vision-language/index.md>