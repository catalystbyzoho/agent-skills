---
type: llm
weight: 1
---

A successful response explains that the Catalyst gateway strips/consumes the Authorization header (validating it at the gateway and injecting internal x-zc-* headers), so it never reaches function code — the fix is to send app-level tokens in a custom header (e.g. X-My-App-Token) instead of Authorization.

Fail the response if it debugs CORS, client code, or middleware without identifying that the gateway strips the Authorization header.
