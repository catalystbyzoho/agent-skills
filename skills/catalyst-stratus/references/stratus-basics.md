> **Stratus is the preferred storage for ALL file/object storage needs in new Catalyst projects.**
> File Store is deprecated (removal date TBD) — use Stratus for all new projects.

## Key Features

- **Buckets & Objects**: Data stored as objects in buckets, each with a unique Object URL
- **Path support**: Objects organized with path prefixes (e.g., `data/reports/file.json`)
- **Versioning**: Multiple versions per object, access by `versionId`
- **Encryption**: At rest and in flight when enabled
- **HIPAA-compliant**: PII/ePHI storage supported
- **Malware scanning**: Automatic; infected objects deleted immediately
- **Multipart uploads**: Recommended for files ≥ 100 MB (single-shot upload supports up to 250 GB per object)
- **Third-party migration**: Direct migration from S3 and GCS via console

## SDK Operations (Node.js)

```javascript
const stratus = catalystApp.stratus();
const bucket = stratus.bucket('my-bucket');
// Bucket name from Console → Cloud Scale → Stratus

// Upload — positional args: (key, body, options?)
await bucket.putObject('data/file.json', JSON.stringify(data), {
  contentType: 'application/json'
});

// Download — returns a Readable stream; consume it to get the data
const fileStream = await bucket.getObject('data/file.json');
const chunks = [];
for await (const chunk of fileStream) { chunks.push(chunk); }
const body = Buffer.concat(chunks).toString(); // or JSON.parse(...) for JSON

// Get specific version (versioning enabled) — also returns a stream
const fileStream = await bucket.getObject('data/file.json', {
  versionId: '01hter85pvexb8s2s2842rpswh'
});

// Delete
await bucket.deleteObject('data/file.json');

// List objects (paginated) — returns { contents, truncated, next_continuation_token }
// next_continuation_token is ONLY present when truncated is true (more pages exist)
const objects = await bucket.listPagedObjects({
  prefix: 'data/',
  maxKeys: 100,
  continuationToken: nextToken  // pass next_continuation_token from previous response
});

// List objects (iterable) — async iteration, fetches all pages automatically
// Requires admin scope: catalyst.initialize(req, { scope: 'admin' })
const files = bucket.listIterableObjects({ prefix: 'data/', maxKeys: 5 });
for await (const file of files) { console.log(file); }

// Check if bucket exists
const exists = await stratus.headBucket('my-bucket');
```

---

## Upload Size Limits

- **Single-shot upload**: up to **250 GB** per object
- **Multipart upload**: recommended for files > 100 MB (part size: 5–100 MB each)

## Multipart Upload (> 100 MB)

```javascript
const stratus = catalystApp.stratus();
const bucket = stratus.bucket('my-bucket');

// Step 1: Initiate — key is a plain string, NOT an object
// Response: { bucket, key, upload_id, status } — field is upload_id (snake_case)
const initRes = await bucket.initiateMultipartUpload('large-file.zip');
const uploadId = initRes['upload_id'];

// Step 2: Upload parts — all positional args: (key, uploadId, stream/buffer, partNumber)
const fileStream = fs.createReadStream('large-file.zip', { highWaterMark: 50 * 1024 * 1024 }); // 50MB parts
let partNumber = 1;
const uploadPromises = [];
fileStream.on('data', (partData) => {
  uploadPromises.push(bucket.uploadPart('large-file.zip', uploadId, partData, partNumber));
  partNumber++;
});
await new Promise((resolve, reject) => {
  fileStream.on('end', resolve);
  fileStream.on('error', reject);
});
await Promise.all(uploadPromises);

// Step 3: Complete — positional args: (key, uploadId). No parts array.
await bucket.completeMultipartUpload('large-file.zip', uploadId);
```

---

## Signed URLs (time-limited access)

```javascript
// generatePreSignedUrl(key, action, options?)
// action: 'GET' (download) or 'PUT' (upload)
const result = await bucket.generatePreSignedUrl('confidential-report.pdf', 'GET', {
  expiryIn: 3600,       // expiry time in seconds (default: 3600)
  // activeFrom: '...',  // optional: Unix timestamp — URL inactive before this
  // versionId: '...'    // optional: for versioned objects
});
const url = result.signature;
// Share this URL — no auth needed to download within the expiry window
```

---

## File Upload from Advanced I/O Function (busboy)

```javascript
'use strict';
const catalyst = require('zcatalyst-sdk-node');
const Busboy = require('busboy');

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const bb = Busboy({ headers: req.headers });
    const fields = {};
    let fileInfo = null;
    const chunks = [];

    bb.on('field', (name, val) => { fields[name] = val; });
    bb.on('file', (name, stream, info) => {
      fileInfo = { name: info.filename, mimetype: info.mimeType };
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        fileInfo.data = Buffer.concat(chunks);
        fileInfo.size = fileInfo.data.length;
      });
    });
    bb.on('close', () => resolve({ fields, file: fileInfo }));
    bb.on('error', reject);
    req.pipe(bb);
  });
}

module.exports = async (req, res) => {
  const catalystApp = catalyst.initialize(req);
  const { fields, file } = await parseMultipart(req);

  if (!file) {
    return sendJson(res, 400, { error: 'No file provided.' });
  }

  const bucket = catalystApp.stratus().bucket('my-bucket');

  try {
    await bucket.putObject(file.name, file.data, { contentType: file.mimetype });
    sendJson(res, 200, { message: 'Uploaded', name: file.name, size: file.size });
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
};
```

`busboy` must be in the function's `package.json`. Run `npm install busboy` inside the function directory.

---

## Permission Templates

- **Authenticated**: Only authenticated app users can access (default)
- **Public**: Any internet user can access without authorization
- Custom JSON rules per object using `rule_id`, `condition`, `allowed_actions`, `paths`, `effect`

---

## SDK Availability

- Server: Node.js (`catalystApp.stratus()`), Java (`ZCStratus.getInstance()`), Python
- Client: Web SDK, Android SDK, iOS SDK, Flutter SDK
- REST API: Full support for all Stratus operations

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `NoSuchBucket` on first upload | Bucket not yet created in Console | Create bucket via Console → Stratus or MCP before any SDK call |
| Signed URL returns 403 | URL expired (default 15 min) or bucket permissions don't allow public access | Regenerate URL; set bucket ACL to allow anonymous reads if files must be public |
| Multipart upload never completes | `completeMultipartUpload()` not called after all parts uploaded | Always call `completeMultipartUpload` with the upload ID and part ETags |
| `busboy` + Stratus: file only partially written | Stream piped to Stratus before `busboy` `file` event fully received | Buffer the stream or use the Stratus pre-signed URL pattern for large files |
| Object path returns stale content | CDN edge cache not yet invalidated | Stratus doesn't have built-in cache invalidation — append a version query param or use a unique path per upload |
