---
type: llm
weight: 1
---

A successful response explains signed URLs are direction-specific: a GET-signed URL only permits download and cannot be used for upload — a separate PUT-signed URL must be generated (which requires admin scope and the upload-side OAuth scope). The wrong HTTP method on a signed URL returns 403 by design.

Fail the response if it debugs bucket permissions/ACLs generically or suggests the URL expired, without identifying the GET-vs-PUT one-way semantics.
