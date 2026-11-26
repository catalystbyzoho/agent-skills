---
type: llm
weight: 1
---

A successful response says not to rely on the API key: in the Development environment the API key is shared across all projects in the org, so anyone in the org who has it can call the function. It recommends Catalyst Authentication instead — set Security Rules `"authentication": "required"` for the function, or put it behind API Gateway with Catalyst Authentication (noting that enabling API Gateway disables Security Rules) — and OAuth for mobile clients.

Fail the response if it recommends API key authentication as the way to protect the function, or does not mention that functions are publicly callable by default (authentication optional).
