## Overview

Catalyst Zia provides pre-trained AI/ML models as serverless APIs. No model training required — call the SDK methods and get results.

Pricing: Pay-per-call. Refer to the `catalyst-pricing` skill for current rates and free tier details.

> **All Zia methods are called directly on the `zia` object** — there are no sub-objects like `textAnalytics()`, `OCR()`, or `faceAnalytics()`.

---

## DC Restrictions

| Service | Availability |
|---------|-------------|
| Identity Scanner (Facial Comparison / Aadhaar) | **IN DC only** |
| AutoML / QuickML | **Not available** in EU, AU, IN, JP, SA, CA |
| All other Zia services | All data centers |

---

## Text Analytics

```javascript
const zia = catalystApp.zia();

// Sentiment Analysis
const sentimentResult = await zia.getSentimentAnalysis(
  ['I love this product!'],  // array of text strings
  ['optional', 'keywords']   // optional keyword hints
);

// Named Entity Recognition (NER)
const nerResult = await zia.getNERPrediction([
  'John works at Zoho in Chennai'
]);

// Keyword Extraction
const keywordsResult = await zia.getKeywordExtraction([
  'Catalyst is a cloud backend platform.'
]);

// All Text Analytics combined
const allResult = await zia.getTextAnalytics(
  ['Zoho Corporation is a multinational technology company.'],
  ['Zoho']  // optional keywords
);
```

---

## OCR (Optical Character Recognition)

```javascript
const zia = catalystApp.zia();

// Basic OCR
const result = await zia.extractOpticalCharacters(
  fs.createReadStream('./invoice.png')
);

// With options (model type, language)
const panResult = await zia.extractOpticalCharacters(
  fs.createReadStream('./pan.webp'),
  { modelType: 'PAN' }
);
```

Supported formats: JPG, PNG, WEBP

---

## Face Analytics

```javascript
const zia = catalystApp.zia();

// Face detection with attributes (age, gender, emotion, smile)
const faceResult = await zia.analyseFace(
  fs.createReadStream('./face.png')
);

// Facial Comparison / E-KYC (⚠️ IN DC only — part of Identity Scanner)
const compareResult = await zia.compareFace(sourceImageStream, queryImageStream);
// { match: true/false, confidence: 0–1 }
```

---

## Object Detection

```javascript
const zia = catalystApp.zia();

const detections = await zia.detectObject(
  fs.createReadStream('./sample.webp')
);
// [{ label: 'car', confidence: 0.94, ... }]
```

---

## Barcode Scanner

```javascript
const zia = catalystApp.zia();

const barcodes = await zia.scanBarcode(
  fs.createReadStream('./barcode.png'),
  { format: 'code39' }  // optional; use 'ALL' for auto-detect
);
```

Supported formats: QR Code, Code 128, EAN, UPC, Data Matrix, PDF417, and more.

---

## Moderation

```javascript
const zia = catalystApp.zia();

const result = await zia.moderateImage(
  fs.createReadStream('./image.png'),
  { mode: 'moderate' }  // 'basic', 'moderate', or 'advanced' (default)
);
```

---

## Common Patterns

### OCR → Data Store pipeline

```javascript
module.exports = async (context, basicIO) => {
  const { image_row_id } = basicIO.getArgument();  // singular, not getArguments()
  
  // Get image from Stratus
  const bucket = catalystApp.stratus().bucket('myapp-files');
  const imageStream = await bucket.getObject('images/doc.png');
  
  // Run OCR
  const zia = catalystApp.zia();
  const ocrResult = await zia.extractOpticalCharacters(imageStream);
  
  // Store extracted text
  await catalystApp.datastore().table('OCRResults').insertRow({
    SourceRowID: image_row_id,
    ExtractedText: JSON.stringify(ocrResult),
    ProcessedAt: new Date().toISOString()
  });
  
  basicIO.write({ status: 'success' });  // write(), not setOutput()
  context.closeWithSuccess();
};
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| OCR returns empty string | Image resolution too low or file format not supported | Use JPG/PNG/WEBP at ≥ 150 DPI; avoid scanned PDFs without embedded text |
| `API limit exceeded` on Zia call | Free tier Zia API call quota exhausted | Upgrade plan; cache Zia results for identical inputs to reduce repeat calls |
| `Invalid file format` on image analysis | Unsupported MIME type sent | Supported formats: JPG, PNG, WEBP; convert before sending |
| Zia response latency > 5s | Large image or complex document sent synchronously | For bulk processing, use a Job function + async dispatch rather than a Basic I/O function |
| Identity Scanner or AutoML not available | DC restriction | Identity Scanner: IN DC only. AutoML/QuickML: not available in EU, AU, IN, JP, SA, CA |
