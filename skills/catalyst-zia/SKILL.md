---
name: catalyst-zia
description: "Catalyst Zia Services and QuickML — OCR, Face Analytics, Text Analytics, Object Detection, Barcode Reader, Content Moderation, and QuickML full ML workspace (pipelines, AutoML, datasets, models, endpoints, and Generative AI: LLM Serving, RAG, Knowledge Base). Trigger on 'Zia', 'QuickML', 'OCR', 'face detection', 'text analytics', 'AutoML', 'ML model', 'RAG', 'LLM serving', 'knowledge base', 'train a model on Catalyst', or 'QuickML endpoint'. DC restrictions: Identity Scanner Document Processing is IN DC only (API included); Facial Comparison works via API from any DC (console testing is IN DC only); AutoML/QuickML is not available in JP, SA, CA data centers."
metadata:
  version: "2.1.0"
---

## How It Works

1. **Identify the capability** — OCR, Face Analytics, Text Analytics, Object Detection, Barcode Reader, Content Moderation (Zia Services), or QuickML ML workspace / Generative AI (pipelines, AutoML, models, endpoints, LLM Serving, RAG, Knowledge Base).
2. **Load `references/zia-services.md`** — for all stateless Zia API calls with Node.js and Python examples.
3. **Load `references/quickml.md`** — for the full QuickML workspace: datasets, pipelines (all 7 types incl. AutoML), models, endpoints, Generative AI (LLM Serving, RAG, Knowledge Base), limits, and SDK prediction calls.
4. **Show accurate SDK examples** — Zia reference includes Node.js and Python. For QuickML predictions, use the endpoint-key based `quickml.predict("{endpoint_key}", input_data)` pattern.

## Triggers

Use this skill for: "Zia", "QuickML", "OCR", "face detection", "text analytics", "object detection", "barcode reader", "content moderation", "AutoML", "ML model", "ML pipeline", "predict", "Zia Services", "image recognition", "sentiment analysis", "train a model on Catalyst", "Zia API", "RAG", "knowledge base", "LLM serving", or "QuickML endpoint".

## References

| Reference | Load when the query is about… |
|-----------|-------------------------------|
| `references/zia-services.md` | All Zia APIs — Text Analytics, OCR, Face Analytics, Object Detection, Barcode Reader, Moderation — SDK examples in Node.js and Python |
| `references/quickml.md` | Full QuickML workspace: 7 pipeline types, AutoML mode, Datasets hub & connectors, Models, Endpoints, Generative AI (LLM Serving, RAG, Knowledge Base), SDK prediction (`predict()`), limitations |
