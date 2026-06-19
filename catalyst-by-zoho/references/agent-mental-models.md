# Agent Mental Models

How Catalyst is actually shaped. Read the relevant section **before** debugging or deploying.

Most agent failures come from applying the wrong mental model (treating AppSail like a Function, Job like Advanced I/O, etc.).

---

## 1. Execution Contexts Are Different Animals

| Context | Credential model | Completion signal | Typical hangs |
|---------|-------------------|---------------------|---------------|
| **Advanced I/O** | USER context common | Return HTTP response | Gateway intercepts `Authorization: Bearer` for app secrets |
| **Job function** | ADMIN in practice | `close_with_success()` required | USER-cred SDK calls hang silently |
| **AppSail** | Container env | Process stays up | Wrong port; wrong node_modules shipped |
| **Cron/Event** | Varies | `closeWithSuccess()` / `context.close()` | Missing close signal |

**Rule:** Identify which context you are in first. Job DataStore code is not interchangeable with Advanced I/O DataStore code.

---

## 2. Domain Model — Where Code Lives vs Where Cookies Work

| Host pattern | Typical use |
|--------------|-------------|
| `*.catalystserverless.in` | Functions, OAuth callbacks on function domain |
| `*.catalystappsail.in` | AppSail apps |
| `*.onslate.in` | Slate-hosted frontends |

OAuth on serverless.in will not authenticate requests to appsail.in. Slate on onslate.in will not read Functions OAuth cookies.

**Decision:** Where does auth live?
- Same domain → cookie auth can work
- Split domains → OAuth in AppSail, domain mapping, or server-side proxy

---

## 3. Deploy Model — What Gets Replaced, What Gets Shipped

| Action | What happens |
|--------|--------------|
| `catalyst deploy` (functions) | Replaces env var set from `catalyst-config.json` |
| Function packaging | Flat zip per function — shared files must be copied |
| AppSail deploy | Ships build-machine artifacts including node_modules |
| Missing `functions` in deploy output | Partial deploy — success exit but no functions updated |

**Rule:** Deploy success ≠ correct deploy. Read deploy output for component names.

---

## 4. Job Pool vs Function Memory

Job pool memory and function memory are separate knobs. Raising pool size alone does not raise function execution memory.

---

## 5. SDK Credential Model in Jobs

High-level SDK DataStore/Stratus methods default to USER credentials. Job functions lack USER context — calls **hang silently**.

**ADMIN-safe patterns:**
- DataStore: `scope='admin'`, Bulk Read, ZCQL UPDATE (when PUT stalls)
- Stratus: admin-scoped SDK initialization in Job context

---

## 6. Environment Model

Confirm which Catalyst environments are provisioned on the account (Development vs Production) before deploy flags or Console navigation. Do not assume Production exists.

---

## 7. Storage Choices

| Need | Use | Avoid |
|------|-----|-------|
| Structured app data | Data Store | AppSail filesystem for production state |
| Files/objects | Stratus | File Store (deprecated) |
| Vector search | External vector DB / confirm architecture | Data Store as default vector home |
| High-volume doc sync | Stratus / external + batching | Data Store without write estimate |

---

## 8. Observability Model

| Surface | Sees what |
|---------|-----------|
| Catalyst Console logs | Functions + AppSail (UI) |
| Logs API / MCP Get_Logs | Functions (sometimes empty) — **not** AppSail container stdout |

When debugging AppSail crashes, MCP logs may mislead you — check Console AppSail logs.
