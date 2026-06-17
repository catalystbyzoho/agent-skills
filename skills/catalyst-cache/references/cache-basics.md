## Overview

In-memory cache organized in segments. Ephemeral data only — not persisted to disk.

- **Max value size**: 5 MB
- **Max TTL**: 48 hours (pass `48` — the TTL parameter is in **hours**)
- Values are **strings only** — serialize/deserialize JSON yourself

## SDK Operations (Node.js)

```javascript
const cache = catalystApp.cache();
const segment = cache.segment(SEGMENT_ID);
// Segment ID from Console → Cloud Scale → Cache → segment list

// Put (TTL in hours, max 48)
await segment.put('user:123', JSON.stringify({ name: 'Alice' }), 1); // 1 hour

// getValue() — returns the stored string directly
const value = await segment.getValue('user:123');
const parsed = value ? JSON.parse(value) : null;

// get() — returns the full cache entry object (includes metadata like cache_name, cache_value, expiry_in_hours)
const entry = await segment.get('user:123');
// entry.cache_value, entry.expiry_in_hours, etc.

// Update
await segment.update('user:123', JSON.stringify({ name: 'Alice Updated' }));

// Delete
await segment.delete('user:123');
```

## `getValue()` vs `get()` Comparison

| | `segment.getValue(key)` | `segment.get(key)` |
|---|---|---|
| **Returns** | `string \| null` — the raw value only | Full object (JSON) with metadata |
| **Response shape** | `"Alice"` | `{ cache_name: "user:123", cache_value: "Alice", expires_in: "<datetime>", expiry_in_hours: 24, ttl_in_milliseconds: 86400000, project_details: {...}, segment_details: {...} }` |
| **Use when** | You need the stored value (most cases) | You need TTL/expiry metadata |
| **After `delete()`** | Returns `null` | Returns object with `cache_value: null` |

> Use `getValue()` by default. Only use `get()` if you need to inspect the remaining TTL or expiry hours.

## Critical Gotchas

### `segment.delete()` does NOT remove the key

`segment.delete(key)` sets `cache_value = null` but the key continues to exist. A subsequent `getValue()` returns HTTP 200 with `cache_value: null` — it does NOT raise an exception.

```javascript
// WRONG — checking for exception won't work:
try {
  const val = await segment.getValue(key);
} catch (e) { /* never throws for deleted keys */ }

// CORRECT — check the value itself:
const val = await segment.getValue(key);
if (val) {
  // key is live
}
```

### `segment.update()` without expiry resets TTL to 48 hours

`segment.update(key, value)` without an expiry argument **resets the TTL to 48 hours**, regardless of the TTL the key was originally created with. If you created a key with a 1-hour TTL and update it without passing expiry, the key now lives for 48 hours.

```javascript
// WRONG — silently resets TTL to 48 hours:
await segment.update(key, value);

// CORRECT — always pass the TTL explicitly to preserve intended expiry (in hours):
await segment.update(key, value, 1);  // 1-hour TTL in hours, matching initial put(key, value, 1)
```

## Cache Pattern for Session/Temp Data

```javascript
// Store session
await segment.put(`session:${userId}`, JSON.stringify({ 
  userId, role: 'admin', loginTime: Date.now() 
}), 24); // 24 hours

// Retrieve session
const sessionStr = await segment.getValue(`session:${userId}`);
const session = sessionStr ? JSON.parse(sessionStr) : null;

if (!session) {
  // Session expired or doesn't exist
}
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `segment.get()` returns `null` unexpectedly | Key expired (default 48-hour TTL) or was never set | Check TTL on `put()` call; catch null and re-fetch from source |
| `segment.update()` silently resets TTL | Calling `update()` without a TTL argument resets the expiry to 48 hours | Always pass the TTL explicitly in hours: `segment.update(key, value, ttlHours)` |
| `segment.delete()` key returns `null` on next get | Deleted keys persist as null entries briefly | Treat `null` as a cache miss and re-populate from the source store |
| Cache segment not found | Segment name doesn't match what was created in Console | Segment names are case-sensitive; verify in Console → Cache |
