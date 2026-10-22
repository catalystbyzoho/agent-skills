---
type: llm
weight: 1
---

A successful response knows the CLI's label is wrong: that list contains PROJECT names and IDs, not orgs — the listed IDs should be passed as the `-p` (project) value while keeping the original org ID in --org.

Fail the response if it takes the label at face value and tells the user to use those IDs as --org values, or invents other org-discovery steps without correcting the mislabel.
