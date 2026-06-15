## Setup

```html
<script src="https://static.zohocdn.com/catalyst/sdk/js/4.6.1/catalystWebSDK.js"></script>
<script src="/__catalyst/sdk/init.js"></script>
```

Load `init.js` **after** `catalystWebSDK.js`. `init.js` auto-initializes the SDK.

### client-package.json

| Framework | Location |
|-----------|---------|
| Vite / React / Vue | `public/client-package.json` |
| Next.js | `public/client-package.json` |
| Angular | `src/assets/client-package.json` |
| Legacy Web Client | `client/client-package.json` |

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "homepage": "/",
  "login_redirect": "/"
}
```

> ⚠️ Do NOT place in project root — it won't be copied to build output.
> Use `/` for Slate apps; `/app/index.html` is for legacy Web Client Hosting only.

### Version Compatibility

| Feature | Min SDK |
|---------|---------|
| Core SDK | v4.0.0 |
| `changePassword()` | v4.3.0 |
| `isUserAuthenticated()` | v4.5.0 |
| `generateAuthToken()` | v4.6.1 |

---

## Authentication

### Type 1: Hosted Login (Redirect-Based)

**Prerequisite:** Console → Authentication → Login → enable Hosted Authentication

```javascript
// Check auth + get user details
catalyst.auth.isUserAuthenticated()
  .then(result => {
    // result.content = full user object
    console.log(result.content.email_id, result.content.first_name);
    showApp(result.content);
  })
  .catch(() => {
    // SDK does NOT auto-redirect — you must do this
    window.location.href = '/__catalyst/auth/login';
  });
```

> ⚠️ `catalyst.auth.getCurrentUser()` does NOT exist. Use `isUserAuthenticated()`.

### Type 2: Embedded Login (iFrame)

```javascript
catalyst.auth.signIn("login-div", { login_redirect: "/" });
catalyst.auth.signUp("signup-div");
catalyst.auth.forgotPassword("forgot-div");
catalyst.auth.changePassword("change-pwd-div");  // v4.3.0+
```

### isUserAuthenticated() (v4.5.0+)

```javascript
try {
  const result = await catalyst.auth.isUserAuthenticated();
  // ⚠️ Returns full USER OBJECT on success (not a boolean)
  console.log(result.content.email_id);   // "user@example.com"
  console.log(result.content.user_id);    // "10103000000115057"
  console.log(result.content.first_name); // "John"
} catch (err) {
  // Rejects with 401 when NOT authenticated
  window.location.href = '/__catalyst/auth/login';
}
```

### Sign Out

```javascript
// ⚠️ REQUIRED: pass redirect URL — crashing without it
catalyst.auth.signOut(window.location.origin);
// For legacy Web Client:
// catalyst.auth.signOut(window.location.origin + '/app/index.html');

// ⚠️ Does NOT return a promise — do NOT await it
// ⚠️ constructSignOutUrl() does NOT exist
```

### generateAuthToken() (v4.6.1+)

For cross-domain calls (Slate → Functions or AppSail):

```javascript
const tokenResponse = await catalyst.auth.generateAuthToken();
const token = tokenResponse.access_token;
// ⚠️ Token is at tokenResponse.access_token — NOT tokenResponse.content.token
```

---

## Calling Functions from Slate (Cross-Domain)

> Slate (`*.onslate.com`) and Functions (`*.catalystserverless.com`) are different domains.
> **Relative paths DO NOT work from Slate.** `/server/func/execute` resolves to Slate's domain.

```javascript
const FUNCTION_URL = 'https://{project-domain}.development.catalystserverless.com/server/{func_name}/execute';

async function callFunction(path, method = 'GET', body = null) {
  const tokenRes = await window.catalyst.auth.generateAuthToken();
  const token = tokenRes.access_token;  // NOT .content.token

  const options = {
    method,
    headers: {
      'Authorization': token,  // Raw token, no prefix
      'Content-Type': 'application/json'
    }
  };
  if (body && method !== 'GET') options.body = JSON.stringify(body);

  const url = path.startsWith('http') ? path : `${FUNCTION_URL}${path}`;
  const res = await fetch(url, options);
  return res.json();
}
```

**Required setup:** Console → Authentication → Whitelisting → Authorized Domains → add your Slate domain → enable CORS toggle.

> ⚠️ Do NOT add CORS headers in function code for production origins — the Catalyst gateway injects them automatically. Adding both causes duplicate headers which browsers reject.

**CORS for localhost only (in Express function):**
```javascript
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(204).end();
  }
  next();
});
```

---

## Data Store

```javascript
const table = catalyst.table.tableId('TableName');

const allRows = await table.getAll();
const pagedRows = await table.getPagedRows({ nextToken: null, maxRows: 100 });
const columns = await table.getColumns();

const newRow = await table.addRow({ column1: 'value1', column2: 'value2' });
const updated = await table.updateRow({ ROWID: '12345', column1: 'new_value' });
await table.delete('12345');
await table.deleteRows(['12345', '12346']);
```

---

## ZCQL

```javascript
const zcql = catalyst.ZCatalystQL;
const result = await zcql.executeQuery("SELECT * FROM Users WHERE age > 25");
console.log(result.content);

// V2 features
catalyst.ZCatalystQL.setCatalystEnv("V2");
```

---

## Stratus

```javascript
const bucket = catalyst.stratus.bucket("bucket-name");

const head = await bucket.headObject("path/to/file.txt");
const obj = await bucket.getObject("path/to/file.txt", { signedUrl: true });

const file = document.getElementById("file-input").files[0];
await bucket.putObject("path/to/file.txt", file);
await bucket.uploadObject("path/large.zip", file, { partSize: 5 * 1024 * 1024 });
await bucket.deleteObject("path/to/file.txt");
```

---

> **⚠️ Deprecated — migration reference only.** File Store is not available to accounts created after August 27, 2025. For new projects, use **Stratus** (see the Stratus section above). The code below is retained only to help migrate existing integrations.

## File Store (Deprecated)

```javascript
const fileStore = catalyst.file;
const folders = await fileStore.getAllFolder();
const folder = fileStore.folderId("folderId");

const fileInput = document.getElementById("file-input");
const uploaded = await folder.uploadFile(fileInput.files[0]);
const downloadLink = await folder.getDownloadLink("fileId");
await folder.delete("fileId");
```

---

## Search

```javascript
const results = await catalyst.search.executeSearchQuery("search term");
console.log(results.content);
```

---

## Push Notifications

```javascript
await catalyst.push.sendNotification({
  message: "Hello!",
  recipients: ["user@example.com"]
});
```

---

## Functions

```javascript
const result = await catalyst.function.execute("functionName", {
  key1: "value1", key2: "value2"
});
console.log(result.content);
```

---

## Environment Variables

```javascript
const value = await catalyst.env.getValue("MY_ENV_VAR");
const allVars = await catalyst.env.getAll();
```

---

## Common Errors

| Symptom | Cause | Fix |
|---------|-------|-----|
| `api_domain` is empty | `init.js` not loaded or wrong order | Load `catalystWebSDK.js` first, then `init.js` |
| `isUserAuthenticated` always fails locally | SDK < v4.5.0 | Upgrade SDK |
| `generateAuthToken is not a function` | SDK < v4.6.1 | Upgrade to v4.6.1+ |
| Duplicate CORS headers / preflight fails | Express `cors()` + Authorized Domains both set header | Remove Express CORS for prod origins; only set for localhost |
| `signOut()` crashes | Called without redirect URL | `catalyst.auth.signOut(window.location.origin)` |
| `getCurrentUser is not a function` | Method doesn't exist | Use `catalyst.auth.isUserAuthenticated()` |
| Embedded iFrame won't load | Div ID mismatch or CSP | Verify div id, check CSP allows Zoho iFrame origins |
| `/__catalyst/auth/login` returns 404 | Hosted Auth not enabled | Console → Authentication → Login → enable Hosted Auth |
| `isUserAuthenticated` rejects but nothing happens | SDK doesn't auto-redirect | Add `window.location.href = '/__catalyst/auth/login'` in catch |
| `Unexpected token '<'` in fetch response | Relative path used from Slate | Use full URL with `generateAuthToken()` |
