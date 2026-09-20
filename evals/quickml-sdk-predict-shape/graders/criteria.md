---
type: llm
weight: 1
---

A successful response uses the real API — catalystApp.quickML() then quickML.predict(endPointKey, inputData) with string input values — and corrects the premise about confidence: the response shape is { status, result: [...] } with NO confidence field, and there is no model(id) or batchPredict() method.

Fail the response if it writes quickML.model(id).predict(...), batchPredict(), or reads a confidence field from the response.
