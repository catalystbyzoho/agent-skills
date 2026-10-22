---
type: llm
weight: 1
---

A successful response states that ZCQL `LIKE` wildcards (%) are not functional — the query is accepted but silently returns no rows — and offers a working alternative (e.g. fetch rows and filter in code, or restructure the query with supported operators).

Fail the response if it treats LIKE as working and debugs quoting/syntax/case, or claims the empty result means the data doesn't match.
