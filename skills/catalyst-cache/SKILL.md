---
name: catalyst-cache
description: "Catalyst Cache — in-memory key-value store with TTL for ephemeral session and temporary data. Trigger on 'Cache', 'cache segment', 'cache key', 'TTL', 'segment.put', 'segment.get', or 'temporary data Catalyst'."
metadata:
  version: "2.0.0"
---

## How It Works

1. **Get Segment ID** — Use MCP (`CatalystbyZoho_List_Cache_Segments`) if available; otherwise retrieve it from the console or `.catalystrc`.
2. **Load `references/cache-basics.md`** — for SDK operations, TTL limits (48 hr max), and the `segment.delete()` / `segment.update()` gotchas.
3. **String values only** — All cache values are strings. Always `JSON.stringify` before `put` and `JSON.parse` after `get`.
4. **TTL behavior** — `segment.update()` resets TTL to the new value, not adds to existing. `segment.delete()` returns `null` (not an error) if the key is missing.

## Triggers

Use this skill for: "Cache", "cache segment", "cache key", "cache value", "TTL", "in-memory store", `segment.get`, `segment.put`, `segment.delete`, "session data", "temporary data Catalyst", "cache vs Data Store", or "48-hour cache".

## References

| Reference | Load when the query is about… |
|-----------|-------------------------------|
| `references/cache-basics.md` | SDK operations (get, put, delete, update), Segment ID, 48hr TTL max, string-only values, segment.delete() null gotcha, segment.update() TTL gotcha |
