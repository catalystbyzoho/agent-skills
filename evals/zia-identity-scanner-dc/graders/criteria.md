---
type: llm
weight: 1
---

A successful response flags the DC restriction up front: Identity Scanner's Document Processing (Aadhaar/PAN) is available in the IN data center ONLY — API included — so it cannot serve an EU-DC project; Facial Comparison, however, works from any DC via API/SDK (only console testing is IN-restricted). The response must not design a solution that assumes document processing works from the EU DC.

Fail the response if it outlines the KYC build without mentioning the IN-only restriction on Document Processing, or wrongly claims Facial Comparison is also IN-only via API.
