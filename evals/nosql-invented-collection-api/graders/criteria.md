---
type: llm
weight: 1
---

A successful response states NO version has it — there is no collection() or insertDocument() in the Catalyst NoSQL API. The correct API is nosql.table(name) plus table.insertItems({ item: new NoSQLItem().addString(...) }) with the typed builder (items are not plain JSON).

Fail the response if it suggests upgrading/downgrading the SDK to get collection(), or rewrites the code with other invented Mongo-style methods.
