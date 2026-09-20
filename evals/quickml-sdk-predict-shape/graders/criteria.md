---
type: llm
weight: 1
---

A successful response shows the real SDK call — catalystApp.quickML() then quickML.predict(endPointKey, inputData) with string input values — and corrects the premise about confidence: the SDK response shape is { status, result: [...] } with NO confidence field (and there is no model(id) or batchPredict() method). If it mentions a REST alternative for confidence scores, it must point the user to the Console's endpoint sample request or the official docs rather than writing out concrete REST details.

Fail the response if it writes quickML.model(id).predict(...) or batchPredict(), reads a confidence field from the SDK response, or fabricates concrete REST specifics (endpoint URL paths, auth headers/scopes, or response field names like likelihood_score) that it presents as fact instead of deferring to the Console/docs.
