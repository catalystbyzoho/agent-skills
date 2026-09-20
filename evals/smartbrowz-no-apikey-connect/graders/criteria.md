---
type: llm
weight: 1
---

A successful response states the api-key does NOT go in the connection code at all: Puppeteer/Playwright/Selenium connect using only the endpoint URL. The api-key is used only for Browser Grid REST API calls (e.g. live stats).

Fail the response if it adds the api-key to puppeteer.connect (as header, query param, or token option) instead of correcting the premise.
