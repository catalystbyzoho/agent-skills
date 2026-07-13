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
// ⚠️ Default overwrite is false — if the key already exists and versioning is OFF,
// putObject will throw 409 (key_already_exists). Pass overwrite: true to replace it.
// Overwrite is atomic — no delete-then-put needed; the replacement happens in a single operation.
await bucket.putObject('data/file.json', newData, { overwrite: true });

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

## SDK Operations (Python)

```python
import zcatalyst_sdk

app = zcatalyst_sdk.initialize()
stratus = app.stratus()
bucket = stratus.bucket('my-bucket')

# Upload as stream
file = open('file_path', 'rb')
res = bucket.put_object('sam/out/sample.txt', file)

# Upload as string
res = bucket.put_object('sam/out/sample.txt', 'content of the file')

# Upload with options — overwrite is only for non-versioned buckets; default is false
options = {
    'overwrite': 'true',   # replaces existing object; omit or set 'false' to raise 409
    'ttl': '300',          # time-to-live in seconds (min: 60)
    'meta_data': {'author': 'John'},
    'content_type': 'application/json'
}
file = open('file_path', 'rb')
res = bucket.put_object('sam/out/sample.txt', file, options)

# Download
obj = bucket.get_object('sam/out/sample.txt')

# Delete
bucket.delete_object('sam/out/sample.txt')
```

---

## SDK Operations (Java)

```java
import com.zc.component.stratus.ZCStratus;
import com.zc.component.stratus.ZCBucket;
import com.zc.component.stratus.beans.ZCPutObjectOptions;
import java.io.InputStream;
import java.io.FileInputStream;

ZCStratus stratus = ZCStratus.getInstance();
ZCBucket bucket = stratus.bucketInstance("my-bucket");

// Upload as stream
InputStream file = new FileInputStream("filePath");
Boolean res = bucket.putObject("sam/out/sample.txt", file);

// Upload as string
Boolean res = bucket.putObject("sam/out/sample.txt", "content of the file");

// Upload with options — setOverwrite() is only for non-versioned buckets; default is false
ZCPutObjectOptions options = ZCPutObjectOptions.getInstance();
options.setOverwrite("true");   // replaces existing object; omit to raise 409
options.setTTL("1000");         // time-to-live in seconds (min: 60)
Map<String, String> metaData = new HashMap<>();
metaData.put("author", "John");
options.setMetaData(metaData);
InputStream file = new FileInputStream("filePath");
Boolean res = bucket.putObject("sam/out/sample.txt", file, options);
```

---

## REST API — PUT Object (Upload)

```
PUT https://{bucket_name}.zohostratus.com/{key}
```

> Development environment: `https://{bucket_name}-development.zohostratus.com/{key}`

**Required header:**
- `Authorization: Zoho-oauthtoken {oauth_token}`

**Optional headers:**

| Header | Description |
|--------|-------------|
| `overwrite` | Set to `true` to replace an existing object. Only works on **non-versioned** buckets. Omit (default) to get `409 key_already_exists` if key exists. The replacement is atomic — no delete-then-put pattern is needed. |
| `content-type` | MIME type of the object (e.g., `application/json`) |
| `content-length` | Raw length of the object in bytes |
| `compress` | Whether to compress while storing (compression is on by default) |
| `cache-control` | Browser caching policy |
| `expires-after` | TTL in seconds (min: 60) — object is auto-deleted after this duration |
| `x-user-meta:{key}={value};...` | Object metadata; max 2047 characters total |

**OAuth scope required:** `Stratus.fileop.CREATE`

**Example:**
```bash
curl -X PUT https://{bucket_name}.zohostratus.com/{key} \
  -H "Authorization: Zoho-oauthtoken {oauth_token}" \
  -H "overwrite: true" \
  -H "content-type: application/json" \
  --data-binary @file.json
```

**Via signed PUT URL** — pass `overwrite` as a regular HTTP header in the PUT request:
```javascript
await axios.put(signedUrl, fileStream, {
  headers: { 'overwrite': 'true' }
});
```

**Failure responses:**

| Status | Code | Meaning |
|--------|------|---------|
| `409` | `key_already_exists` | Object with same key exists and `overwrite` header not set |
| `404` | `bucket_not_found` | Bucket does not exist |
| `403` | `access_forbidden` | Missing required permissions |
| `400` | `key_name_invalid` | Key contains unsupported characters |

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

**When to use signed URLs vs SDK directly:**

| Use case | Approach |
|----------|----------|
| Share a download link with a browser, mobile app, or external user | Signed URL (`'GET'`) |
| Accept a file upload directly from a client without routing through your function | Signed URL (`'PUT'`) |
| Read or write an object inside a Catalyst function | SDK directly (`getObject()` / `putObject()`) |
| Process, transform, or pipeline objects server-side | SDK directly |

Signed URLs are for **client-facing access** — giving unauthenticated users temporary, scoped access to a specific object. For any operation happening *within* a function, use the SDK directly; it is simpler, avoids an extra network round-trip, and does not require admin scope.

> **Requires admin scope** to generate. `'GET'` action = **download-only** (recipient uses HTTP GET). `'PUT'` action = **upload-only** (recipient uses HTTP PUT).
> A GET-signed URL cannot be used for upload and vice versa — wrong method returns 403.

**Direction / action summary:**

| Direction | SDK action value | HTTP method to consume | OAuth scope to generate | `versionId` supported? |
|-----------|-----------------|----------------------|------------------------|------------------------|
| Download  | `'GET'` / `URL_ACTION.GET` | `GET` | `ZohoCatalyst.buckets.objects.READ` | Yes (GET only) |
| Upload    | `'PUT'` / `URL_ACTION.PUT` | `PUT` | `ZohoCatalyst.buckets.objects.CREATE` | No |

**Options (all SDKs):**
- `expiry` / `expiryIn` / `expiry_in_sec` — URL validity in seconds. Default: 3600, min: 30, max: 7 days.
- `activeFrom` / `active_from` — Unix timestamp (ms) from when the URL becomes active. Default: active immediately.
- `versionId` / `version_id` — Download a specific version (GET only).

---

### Node.js SDK

```javascript
const catalystApp = catalyst.initialize(req, { scope: 'admin' });
const bucket = catalystApp.stratus().bucket('my-bucket');

// Generate a DOWNLOAD URL
const downloadRes = await bucket.generatePreSignedUrl('report.pdf', 'GET', {
  expiryIn: 3600,
  // activeFrom: '1716382375000',  // optional: Unix timestamp ms
  // versionId: '746398diij94839'  // optional: GET only
});
const downloadUrl = downloadRes.signature;
// Recipient: axios.get(downloadUrl, { responseType: 'stream' })

// Generate an UPLOAD URL
const uploadRes = await bucket.generatePreSignedUrl('incoming/file.pdf', 'PUT', {
  expiryIn: 300,
});
const uploadUrl = uploadRes.signature;
// Recipient: axios.put(uploadUrl, fileStream, { headers: { 'overwrite': 'true' } })
```

---

### Python SDK

```python
from zcatalyst_sdk import catalyst

app = catalyst.initialize()
bucket = app.stratus().bucket('my-bucket')

# Generate a DOWNLOAD URL
download_res = bucket.generate_presigned_url(
    'report.pdf',
    url_action='GET',
    expiry_in_sec='3600',
    active_from='1023453725828',  # optional
    version_id='jdery748tfge78'   # optional, GET only
)
download_url = download_res['signature']
# Recipient: requests.get(download_url, stream=True)

# Generate an UPLOAD URL
upload_res = bucket.generate_presigned_url(
    'incoming/file.pdf',
    url_action='PUT',
    expiry_in_sec='300'
)
upload_url = upload_res['signature']
# Recipient: requests.put(upload_url, data=open('file', 'rb'))
```

---

### Java SDK

```java
import com.zc.component.stratus.enums.URL_ACTION;
import org.json.simple.JSONObject;

// Generate a DOWNLOAD URL
JSONObject downloadRes = bucket.generatePreSignedUrl("report.pdf", URL_ACTION.GET);
String downloadUrl = (String) downloadRes.get("signature");
// With expiry and activeFrom:
// JSONObject downloadRes = bucket.generatePreSignedUrl("report.pdf", URL_ACTION.GET, "3600", "1716382375000");

// Generate an UPLOAD URL
JSONObject uploadRes = bucket.generatePreSignedUrl("incoming/file.pdf", URL_ACTION.PUT);
String uploadUrl = (String) uploadRes.get("signature");
// Recipient: OkHttpClient PUT request to uploadUrl
```

---

### REST API — Generate Signed URL

The same endpoint is used for both directions; the HTTP method of the *generation request* determines the direction:

```
# Generate a DOWNLOAD URL (GET method on the signing endpoint)
GET {api-domain}/baas/v1/project/{project_id}/bucket/object/signed-url
  ?bucket_name=myBucketName&object_key=report.pdf&expiry_in_seconds=3600
  &active_from=1716382375000&version_id=bs22sb2923ey2hds929
  -H "Authorization: Zoho-oauthtoken {token}"

# Generate an UPLOAD URL (PUT method on the signing endpoint)
PUT {api-domain}/baas/v1/project/{project_id}/bucket/object/signed-url
  ?bucket_name=myBucketName&object_key=incoming/file.pdf&expiry_in_seconds=300
  -H "Authorization: Zoho-oauthtoken {token}"
```

Response for both:
```json
{
  "status": "success",
  "data": {
    "signature": "https://{bucket}.zohostratus.com/_signed/{key}?...",
    "expires_in_seconds": 300,
    "active_from": 1716382487000
  }
}
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
| `409 key_already_exists` | `putObject` called on an existing key with versioning OFF and `overwrite` not set (default `false`) | Pass `{ overwrite: true }` in options: `bucket.putObject(key, body, { overwrite: true })` |
| Signed URL returns 403 | URL expired, wrong HTTP method used (GET URL used for PUT or vice versa), or bucket permissions too restrictive | Regenerate URL; ensure GET URL is used with HTTP GET and PUT URL with HTTP PUT |
| `generatePreSignedUrl` fails with auth error | Not initialized with admin scope | Use `catalyst.initialize(req, { scope: 'admin' })` before calling `generatePreSignedUrl` |
| Multipart upload never completes | `completeMultipartUpload()` not called after all parts uploaded | Always call `completeMultipartUpload(key, uploadId)` after all parts are done |
| `busboy` + Stratus: file only partially written | Stream piped to Stratus before `busboy` `file` event fully received | Buffer the stream or use the Stratus pre-signed URL pattern for large files |
| Object path returns stale content | CDN edge cache not yet invalidated | Stratus doesn't have built-in cache invalidation — append a version query param or use a unique path per upload |
