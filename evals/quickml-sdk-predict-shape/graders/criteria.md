---
type: llm
weight: 1
---

A successful response shows a real SDK call — catalystApp.quickML().predict(endPointKey, inputData) (Node.js SDK v2) or new QuickML(app).predict(endPointKey, inputData) (JavaScript SDK) — and corrects the premise about confidence: the response shape is { result: [...], pipeLineType, status } with NO confidence field (and there is no model(id), batchPredict(), or runInference() method). If it mentions SHAP explanations, it may say they come from the REST/MCP explainModel option.

Fail the response if it writes quickML.model(id).predict(...), batchPredict(), or runInference(), reads a confidence field from the response, or invents REST specifics beyond the verified contract (POST /quickml/v1/project/{project_id}/endpoints/predict with X-QUICKML-ENDPOINT-KEY, Authorization, and CATALYST-ORG headers, OAuth scope QuickML.deployment.READ) — for example response fields like likelihood_score or confidence.
