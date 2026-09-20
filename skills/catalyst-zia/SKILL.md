---
name: catalyst-zia
description: "Catalyst Zia Services — OCR, Face Analytics, Text Analytics, Object Detection, Barcode Reader, and Content Moderation via pre-trained AI APIs. Trigger on 'Zia', 'OCR', 'face detection', 'text analytics', 'object detection', 'barcode', 'content moderation', or 'image recognition'. DC restrictions: Identity Scanner Document Processing is IN DC only (API included); Facial Comparison works via API from any DC (console testing is IN DC only). For QuickML (AutoML, ML pipelines, LLM Serving, RAG) load catalyst-quickml instead."
metadata:
  version: "2.1.0"
---

## How It Works

1. **Identify the capability** — OCR, Face Analytics, Text Analytics, Object Detection, Barcode Reader, Content Moderation (Zia Services). For custom-trained models, AutoML, ML pipelines, or Generative AI (LLM Serving, RAG), STOP and load the **`catalyst-quickml`** skill instead.
2. **Load `references/zia-services.md`** — for all Zia API calls with Node.js and Python examples.
3. **Show both SDK examples** — Zia reference includes Node.js and Python; provide both or ask the user which platform they're using.

## Triggers

Use this skill for: "Zia", "OCR", "face detection", "text analytics", "object detection", "barcode reader", "content moderation", "sentiment analysis", "image recognition", "Zia Services", or "Zia API".

Route to **`catalyst-quickml`** for: "QuickML", "AutoML", "ML model", "train a model on Catalyst", "ML pipeline", "LLM Serving", "RAG", "predict" (with a custom model).

## References

| Reference | Load when the query is about… |
|-----------|-------------------------------|
| `references/zia-services.md` | All Zia APIs — Text Analytics, OCR, Face Analytics, Object Detection, Barcode Reader, Moderation — SDK examples in Node.js and Python |
| `../catalyst-quickml/SKILL.md` | AutoML, ML pipelines, model training/prediction endpoints, LLM Serving, RAG, Knowledge Base |
