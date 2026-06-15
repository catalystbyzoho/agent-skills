## Overview

API Gateway provides routing, rate limiting, auth enforcement, and CORS at the gateway level for all Advanced I/O functions.

---

## CLI Commands

```bash
catalyst apig:enable    # Enable API Gateway for the project
catalyst apig:status    # Check current status
catalyst apig:disable   # Disable API Gateway
```

---

## Route Configuration

Configure in Console → Cloud Scale → API Gateway:

| Field | Description |
|-------|-------------|
| **Path pattern** | URL path with wildcards (e.g., `/api/users/*`) |
| **Target function** | Which Advanced I/O function handles the route |
| **Authentication** | `required` or `optional` |
| **Rate limit** | Max requests/time window |

### Example Route Table

| Path | Target | Auth | Rate Limit |
|------|--------|------|------------|
| `/api/users/*` | `user_api` | required | 100 req/min |
| `/api/public/*` | `public_api` | optional | 50 req/min |
| `/api/admin/*` | `admin_api` | required | 20 req/min |

---

## Rate Limiting

Two throttle types:
- **General**: Max hits/time for all users combined
- **IP-based**: Max hits/IP/time

Algorithm: **Sliding window** (not fixed-window buckets).

Returns `429 Too Many Requests` when limit exceeded.

**Client-side handling:**
```javascript
async function callWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(url, options);
    if (res.status !== 429) return res;
    // Exponential backoff: 1s, 2s, 4s
    await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
  }
  throw new Error('Rate limit exceeded after retries');
}
```

---

## CORS via API Gateway

Catalyst API Gateway injects `Access-Control-Allow-Origin` for origins configured in:
**Console → Authentication → Whitelisting → Authorized Domains** → enable CORS toggle.

> **Do NOT set CORS headers in your function code for production origins.** Duplicating the header causes browsers to reject the response with a "multiple values" CORS error.

Only set CORS headers in function code for `localhost` (local dev, where no gateway exists):

```javascript
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(204).end();
  }
  next();
});
```

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `429 Too Many Requests` | Client exceeded rate limit | Implement exponential backoff; increase limit in Console → API Gateway config |
| Routes returning `404` for valid function paths | API Gateway disabled, wrong route pattern, or function name mismatch | Run `catalyst apig:status` to confirm enabled; verify route path wildcards; confirm function name in route matches deployed function name exactly |
