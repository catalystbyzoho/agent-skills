# QuickML — Generative AI (Agent Reference)

Practical, directive reference for QuickML's Generative AI module: serving LLMs, grounding
them with RAG over a Knowledge Base, and publishing them as endpoints. 

For **custom trained ML models** access `prediction.md`

## Availability (by data center):
> - **Generative AI** (LLM Serving, RAG) — available and publishable in **US, IN, EU, JP, CA** only; **not available in AU or SA**.

## Pricing
> See "QuickML Pricing" section in SKILL.md for more information

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
    - **WorkDrive** / **Local file upload**: .pdf, .docx, .txt, .md, .html — up to 10 files at a time, max 100 MB per file
    - **Zoho Learn**: Provide the document name in the UI, select Learn Hub → Space → Manual → Article(s), and configure sync frequency (Daily, Weekly, Monthly, Yearly, or Custom)

- **Document Store** - the ground truth for a RAG session; documents are added here from the Knowledge Base and used for context retrieval during a query.
    - If Document Store is empty, retrieval scope expands to the Knowledge Base.

- **Playground** - a chat window to test LLMs and RAG in the Generative AI module of QuickML.
- **Saved Configuration** - saves parameters, prompts, instructions, tools, etc. for LLM Serving and RAG features.
- **Generative AI Endpoints** - Saved Configurations (LLM or RAG) published as authenticated REST API endpoints (+ SDK).

- **Periodic sync** - document sync can be configured using **Sync Frequency** for Knowledge Base documents uploaded via **Zoho WorkDrive** or **Zoho Learn**; not available for the Local file upload connector.


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

- **Local upload** — .pdf / .docx / .txt (max 500 KB per file).
- **Zoho WorkDrive** — import a file from WorkDrive. Supports periodic sync.
- **Zoho Learn** — import an article or a manual. Use **portal URLs only** — team-specific paths won't work.

Supports document level **periodic sync** so the knowledge stays updated.

Each uploaded document gets a unique **Document ID** — copy it from the KB to scope RAG retrieval to specific documents in API calls.

Docs: <https://docs.catalyst.zoho.com/en/quickml/help/generative-ai/knowledge-base/index.md>

## 4. Available models

- **GLM-4.7-Flash**: 30B-A3B MoE text-only model (~3B active params/token). Optimized for coding, reasoning, agent workflows, and long-context tasks (200K input / 128K output tokens). Supports native tool calling. Model key: `crm-di-glm47b_30b_it`.
  <https://docs.catalyst.zoho.com/en/quickml/help/available-models/glm-4.7-flash/index.md>

- **Qwen 3.6 35B Vision Language (VLM)**: 35B-A3B multimodal MoE model (~3B active params/token, 8-bit precision). Handles combined text + image input (up to 3 images, ~9K tokens total) with text-only output. Suited for document/chart understanding and image-based Q&A. Model key: `VL-Qwen3.6-35B-A3B`.
  <https://docs.catalyst.zoho.com/en/quickml/help/available-models/qwen-3.6-35b-vision-language/index.md/>

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

QuickML ships in the Catalyst SDK family: **Node.js, Python, Java**. Two-step pattern in all languages: create a QuickML component instance,
then call the relevant method with the **endpoint key** and input data.

### LLM Serving

#### Java:
```java
ZCQuickML quickMlInstance = ZCQuickML.getInstance();
String endpointKey = "<ENDPOINT_KEY>";
String prompt = "<YOUR_PROMPT>";

// Single-shot
ZCQuickMLDetail result = quickMlInstance.askLlm(endpointKey, prompt);

// Conversation mode — pass "-1" as conversationId for the first request
String conversationId = "<CONVERSATION_ID>";
ZCQuickMLDetail result = quickMlInstance.converseWithLlm(endpointKey, prompt, conversationId);

System.out.println(result.getResponse());
```
#### Python:
```python
quickml = app.quick_ml()
endpoint_key = "<ENDPOINT_KEY>"
prompt = "<YOUR_PROMPT>"

# Single-shot
response = quickml.ask_llm(endpoint_key, prompt)

# Conversation mode — pass "-1" as conversation_id for the first request
conversation_id = "<CONVERSATION_ID>"
response = quickml.converse_with_llm(endpoint_key, prompt, conversation_id)

print(response)
```

#### JavaScript (modular SDK v1):
```javascript
const app = await zcAuth.init(req);
const quickML = new QuickML(app);
const endpointKey = "<ENDPOINT_KEY>";
const prompt = "<YOUR_PROMPT>";

// Single-shot
const response = await quickML.askLlm(endpointKey, prompt);

// Conversation mode — omit conversationId or pass "-1" for the first request
const conversationId = "<CONVERSATION_ID>";
const chatResponse = await quickML.converseWithLlm(endpointKey, prompt, conversationId);

console.log(response, chatResponse);
```

---

### Vision Language Model (VLM)

**Allowed formats:** .jpg, .jpeg, .png — max 500 KB
#### Java:
```java
ZCQuickML quickMlInstance = ZCQuickML.getInstance();
String endpointKey = "<ENDPOINT_KEY>";
File image = new File("<IMAGE_PATH>");
String prompt = "<YOUR_PROMPT>";

ZCQuickMLDetail result = quickMlInstance.analyzeImage(endpointKey, image, prompt);
System.out.println(result.getResponse());
```

#### Python:
```python
quickml = app.quick_ml()
endpoint_key = "<ENDPOINT_KEY>"
image_path = "<IMAGE_PATH>"

with open(image_path, "rb") as image:
    prompt = "<YOUR_PROMPT>"
    response = quickml.analyze_image(endpoint_key, image, prompt)
    print(response)
```


#### JavaScript (modular SDK v1):
```javascript
const quickML = new QuickML(app);
const imageEndpointKey = "<ENDPOINT_KEY>";
const imagePrompt = "<YOUR_PROMPT>";
const image = fs.createReadStream("<IMAGE_PATH>");  // as in the docs sample

const result = await quickML.analyzeImage(imageEndpointKey, image, imagePrompt);
console.log(result);
```
---

### RAG

| RAG mode | Python method | Java method |
|---|---|---|
| Response Generation | `generate_rag_response(endpoint_key, prompt)` | `generateRagResponse(endpointKey, prompt)` |
| Document Search | `search_documents(endpoint_key, query)` | `searchDocuments(endpointKey, query)` |
| Agentic RAG (no history) | `ask_rag_agent(endpoint_key, prompt)` | `askRagAgent(endpointKey, prompt)` |
| Agentic RAG (with history) | `converse_with_rag_agent(endpoint_key, prompt, conversation_id)` | `converseWithRagAgent(endpointKey, prompt, conversationId)` |


#### Java:
```java
ZCQuickML quickMlInstance = ZCQuickML.getInstance();
String endpointKey = "<ENDPOINT_KEY>";

// Response Generation
ZCQuickMLDetail result = quickMlInstance.generateRagResponse(endpointKey, prompt);

// Document Search
ZCQuickMLDetail result = quickMlInstance.searchDocuments(endpointKey, query);

// Agentic RAG (no history)
ZCQuickMLDetail result = quickMlInstance.askRagAgent(endpointKey, prompt);

// Agentic RAG (with history) — pass "-1" as conversationId for the first request
ZCQuickMLDetail result = quickMlInstance.converseWithRagAgent(endpointKey, prompt, conversationId);

System.out.println(result.getResponse());
```

#### Python:
```python
quickml = app.quick_ml()
endpoint_key = "<ENDPOINT_KEY>"

# Response Generation
response = quickml.generate_rag_response(endpoint_key, prompt)

# Document Search
response = quickml.search_documents(endpoint_key, query)

# Agentic RAG (no history)
response = quickml.ask_rag_agent(endpoint_key, prompt)

# Agentic RAG (with history) — pass "-1" as conversation_id for the first request
response = quickml.converse_with_rag_agent(endpoint_key, prompt, conversation_id)

print(response)
```


#### JavaScript
```javascript
const quickML = new QuickML(app);
const endpointKey = "<ENDPOINT_KEY>";

// Response Generation
const r1 = await quickML.generateRagResponse(endpointKey, prompt);

// Document Search
const r2 = await quickML.searchDocuments(endpointKey, query);

// Agentic RAG (no history)
const r3 = await quickML.askRagAgent(endpointKey, prompt);

// Agentic RAG (with history) — omit conversationId or pass "-1" for the first request
const r4 = await quickML.converseWithRagAgent(endpointKey, prompt, conversationId);
```
> For the first `converseWithLlm` / `converseWithRagAgent` call, set `conversationId` to `"-1"`. The response returns a unique ID to pass in subsequent calls.


### SDK docs

SDK docs to fetch for exact code and parameters.

Base URL: `https://docs.catalyst.zoho.com/en/sdk/`. Append the path below to it (each path already ends in `index.md`, the Markdown version). 

> | Feature | Java | Python | JavaScript |
> |---|---|---|---|
> | LLM | `java/v1/quickml/execute-llm-endpoint/index.md` | `python/v1/quickml/execute-llm-endpoint/index.md` | `javascript/v1/quickml/execute-llm-endpoint/index.md` |
> | VLM | `java/v1/quickml/execute-vision-model-endpoint-/index.md` | `python/v1/quickml/execute-vision-model-endpoint/index.md` | `javascript/v1/quickml/execute-vision-model-endpoint/index.md` |
> | RAG | `java/v1/quickml/execute-rag-endpoint/index.md` | `python/v1/quickml/execute-rag-endpoint/index.md` | `javascript/v1/quickml/execute-rag-endpoint/index.md` |

If `index.md` fails, drop it and use the HTML page.

## Tools & automation
> Prefer connected Catalyst MCP tools for any action — see "Using Catalyst MCP tools" in SKILL.md.


##  REST API — parameters

Every published endpoint exposes a REST API.


### Calling GenAI Endpoints (LLM Serving, VLM, RAG)

All GenAI endpoints share the same auth and headers. Pattern: `/genai/endpoints/{target}/{action}`.

- **Method:** POST · **OAuth scope:** `QuickML.deployment.READ`

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
(VLM uses `Content-Type: multipart/form-data` for image upload.)

| Type | Path | Request body |
|---|---|---|
| LLM (text/chat) | `/quickml/v1/project/{project_id}/genai/endpoints/{model_name}/chat` | `{ "prompt": "...", "conversationId": "-1" }` |
| VLM (vision) | `/quickml/v1/project/{project_id}/genai/endpoints/vlm/generate` | `{ "images": ["<base64-encoded-image>"], "prompt": "..." }` |
| RAG | `/quickml/v1/project/{project_id}/genai/endpoints/rag/generate` | `{ "query": "..." }` |

`conversationId: "-1"` = new chat; pass a real ID to continue with history.

**LLM Sample response** — OpenAI-style `chat.completion`:
```json
{
  "object": "chat.completion",
  "created": 1783842800,
  "model": "crm-di-glm47b_30b_it",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "<LLM-Response>",
        "refusal": null,
        "annotations": null,
        "audio": null,
        "function_call": null,
        "tool_calls": [],
        "reasoning": null
      },
      "logprobs": null,
      "finish_reason": "stop",
      "stop_reason": 154827,
      "token_ids": null
    }
  ],
  "usage": {
    "prompt_tokens": 9,
    "total_tokens": 683,
    "completion_tokens": 674,
    "prompt_tokens_details": null
  },
  "prompt_logprobs": null,
  "conversationId": "<conversationId>"
}
```

**VLM Sample response**

```json
{
  "request_id": "<Unique request Id>",
  "model": "<Selected Model name>",
  "response": "<The response from the VLM>",
  "metrics": {
    "input_text_token_length": 23,
    "input_image_token_length": 1760,
    "input_guided_prompt_length": 0,
    "output_text_token_length": 217,
    "queue_wait_time": 0.4194929599761963,
    "processing_time": 5.136228561401367,
    "total_time_taken": 5.5557215213775635
  }
}
```

**RAG Sample response**:
```json
{
  "status": "success",
  "response": {
    "data": [
      {
        "response_type": "answer",
        "output": [
          {
            "type": "answer",
            "content": "<Generated response>"
          }
        ],
        "reasoning": {
          "thoughts": [],
          "queries": []
        },
        "searched_documents": []
      }
    ]
  },
  "metrics": {
    "retrieval_ms": 1051,
    "generation_ms": 352,
    "total_ms": 1404
  },
  "tokens_usage": {
    "total_tokens": 8348,
    "prompt_tokens": 8332,
    "completion_tokens": 16
  }
}
```

**Parameter notes:**

- `endpoint_key` — identifies the published model/GenAI config (from the endpoint's Console
  page).
- `Authorization` — OAuth token (scoped Zoho OAuth) or endpoint auth per Catalyst rules.
- **LLM Serving endpoints** take the model input/query plus generation params (eg: temperature, max tokens);
- **RAG endpoints**  additionally accept the RAG mode, documents added and retrieval params.

---

## Console-only actions (no SDK / REST equivalent)

The following actions can **only** be done in the Catalyst Console — there is no
API, SDK method, or MCP tool for them. Guide the user through the console steps
using exhaustive field-level instructions (see SKILL.md "Console instructions").

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
QuickML provisions a dedicated **REST API**, generates **SDK snippets** (JavaScript, Python, Java), and issues an **endpoint key**. The endpoint is callable immediately — no separate publish step for GenAI endpoints (unlike ML Model endpoints, which require an explicit publish action).
> - **Edit** the endpoint later to modify the parameter configuration as you iterate.
> - **Endpoint config snapshot:** Editing a saved configuration after endpoint creation **does not affect the live endpoint**. The endpoint retains a snapshot of the configuration at the time of creation. To publish the latest paramaters either edit or create a new endpoint.
> - Each endpoint is authenticated (OAuth2) and metered.


 **Endpoint References**
> - **LLM Endpoints**: `https://docs.catalyst.zoho.com/en/quickml/help/endpoints/llm-serving-endpoint/`
> -  **RAG Endpoints**: 
`https://docs.catalyst.zoho.com/en/quickml/help/endpoints/rag-endpoint/`

---


## Tools & automation
> Prefer connected Catalyst MCP tools for these actions — see "Using Catalyst MCP tools" in SKILL.md.



##  Limits & gotchas

- **Knowledge Base** local files are limited to 500 KB — split or use WorkDrive/Learn for
  larger content.
- **401 / Unauthorized** on an endpoint → refresh the OAuth token; confirm scope
  (`QuickML.deployment.READ`) and the endpoint URL.
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