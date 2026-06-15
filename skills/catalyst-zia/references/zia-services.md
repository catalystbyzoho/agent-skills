## Overview

Catalyst Zia provides pre-trained AI/ML models as serverless APIs. No model training required — call the SDK methods and get results.

Pricing: Pay-per-call. Free tier included for each service.

---

## Text Analytics

```javascript
const zia = catalystApp.zia();
const textAnalytics = zia.textAnalytics();

// Sentiment Analysis
const sentimentResult = await textAnalytics.analyzeSentiment('I love this product!');
// { sentiment: 'positive', score: 0.98 }

// Keyword Extraction
const keywords = await textAnalytics.extractKeywords('Catalyst is a cloud backend platform.');
// { keywords: ['Catalyst', 'cloud backend platform'] }

// Entity Extraction (Named Entity Recognition)
const entities = await textAnalytics.extractEntities('John works at Zoho in Chennai');
// { entities: [{ value: 'John', type: 'Person' }, { value: 'Zoho', type: 'Organization' }, ...] }

// Language Detection
const lang = await textAnalytics.detectLanguage('Bonjour le monde');
// { language: 'French', code: 'fr', confidence: 0.99 }

// Keyword Prediction
const predicted = await textAnalytics.predictKeywords('Machine learning is transforming AI');
```

Pricing: $0.002 per API call. Free tier: 500 calls/month per service.

---

## OCR (Optical Character Recognition)

```javascript
const ocr = zia.OCR();

// From file buffer
const result = await ocr.extractText(imageBuffer);
// { result: 'Extracted text content...', pages: [...] }

// From URL
const resultFromUrl = await ocr.extractTextFromURL('https://example.com/invoice.pdf');
```

Supported formats: JPG, PNG, BMP, GIF, PDF (multi-page)
Pricing: $0.004 per call. Free tier: 500 calls/month.

---

## Face Analytics

```javascript
const faceAnalytics = zia.faceAnalytics();

// Face detection with attributes
const faceResult = await faceAnalytics.detectFace(imageBuffer);
// Returns: age range, gender prediction, emotion, smile probability, landmarks

// Face comparison (2 images)
const compareResult = await faceAnalytics.compareFace(imageBuffer1, imageBuffer2);
// { match: true, confidence: 0.95 }
```

Pricing: $0.003 per face in image. Free tier: 500 faces/month.

---

## Object Detection

```javascript
const objectDetection = zia.objectDetection();

const detections = await objectDetection.detectObjects(imageBuffer);
// [{ label: 'car', confidence: 0.94, bounding_box: { x, y, width, height } }]
```

Pricing: $0.003 per image. Free tier: 500 calls/month.

---

## Barcode Reader

```javascript
const barcodeReader = zia.barcodeReader();

const barcodes = await barcodeReader.readBarcode(imageBuffer);
// [{ type: 'QR_CODE', value: 'https://example.com' }]
```

Supported formats: QR Code, Code 128, EAN, UPC, Data Matrix, PDF417, and more.
Pricing: $0.002 per call. Free tier: 500 calls/month.

---

## Moderation

```javascript
const moderation = zia.moderation();

const result = await moderation.moderateImage(imageBuffer);
// { explicit: false, categories: { adult: 0.01, violence: 0.00 }, safe: true }
```

---

## Common Patterns

### OCR → Data Store pipeline

```javascript
module.exports = async (context, basicIO) => {
  const { image_row_id } = basicIO.getArguments();
  
  // Get image from Stratus
  const fileContent = await catalystApp.stratus().getFileContent(bucketName, imagePath);
  
  // Run OCR
  const zia = catalystApp.zia();
  const ocrResult = await zia.OCR().extractText(fileContent);
  
  // Store extracted text
  await catalystApp.datastore().table('OCRResults').insertRow({
    SourceRowID: image_row_id,
    ExtractedText: ocrResult.result,
    ProcessedAt: new Date().toISOString()
  });
  
  basicIO.setOutput({ status: 'success', chars: ocrResult.result.length });
  context.closeWithSuccess();
};
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| OCR returns empty string | Image resolution too low or file format not supported | Use JPG/PNG at ≥ 150 DPI; avoid scanned PDFs without embedded text |
| `API limit exceeded` on Zia call | Free tier Zia API call quota exhausted | Upgrade plan; cache Zia results for identical inputs to reduce repeat calls |
| `Invalid file format` on image analysis | Unsupported MIME type sent | Supported formats: JPG, PNG, BMP, GIF; convert before sending |
| Zia response latency > 5s | Large image or complex document sent synchronously | For bulk processing, use a Job function + async dispatch rather than a Basic I/O function |
