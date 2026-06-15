# Catalyst Architecture — Service Selection Guide

Use this file when a user asks "which Catalyst service should I use for X?" or is starting a new project and needs to pick the right components. Load it before writing any service-specific code for a new project.

---

## Service Selection Matrix

### Compute

| If you need… | Use | Do NOT use |
|---|---|---|
| Stateless HTTP endpoints, event-driven logic, scheduled jobs, or Zoho service integrations | **Functions** | AppSail |
| A persistent server process, WebSockets, long-running background workers, or a custom Docker container | **AppSail** | Functions |
| Visual workflow orchestration across multiple functions (parallel/sequential) | **Circuits** | Manual function chaining in code — *check DC restriction first* |

**Rule:** Default to Functions. Reach for AppSail only when the process genuinely cannot be stateless. Functions bill per invocation; AppSail bills per instance uptime.

---

### Data Storage

| If you need… | Use | Do NOT use |
|---|---|---|
| Relational data, SQL-style queries (ZCQL), joins, fixed schema, ACID compliance | **Data Store** | NoSQL |
| Flexible/schemaless document data, JSON-heavy payloads, no predefined structure, high write throughput | **NoSQL** | Data Store |
| File/binary storage: images, PDFs, CSVs, uploads | **Stratus** | Data Store, NoSQL |
| Ephemeral key-value data, session tokens, short-lived state (max 48-hour TTL) | **Cache** | Data Store |

---

### Frontend Hosting

| If you need… | Use |
|---|---|
| Static sites or SPAs (React, Next.js, Vue, Angular, Svelte, Astro) | **Slate** |
| Server-rendered or full-stack frameworks with backend | **AppSail** |

---

### Authentication & Identity

| If you need… | Use |
|---|---|
| End-user login/signup for your application | **Authentication** (Catalyst built-in) |
| OAuth tokens for external APIs (Zoho CRM, Zoho Mail, etc.) | **Connections** (part of `catalyst-authentication` skill) |
| Row-level data access control tied to the logged-in user | **Security Rules** + Data Store permissions |

---

### AI / ML

| If you need… | Use | DC restriction |
|---|---|---|
| OCR, face detection, text analytics, object detection, barcode scanning, content moderation | **Zia Services** | US DC only for AutoML; see Never Use table |
| Train a custom ML model on your own data | **QuickML (AutoML)** | Not available in EU, AU, IN, JP, SA, CA |
| Browser automation, web scraping, PDF generation | **SmartBrowz / Browser Logic** | No DC restriction |

---

### Events & Scheduling

| If you need… | Use | Do NOT use |
|---|---|---|
| Trigger logic when data changes in Catalyst services | **Signals** | ~~Event Listeners~~ (deprecated) |
| Run a function on a schedule (cron-style) | **Job Scheduling** | ~~Cron~~ (deprecated) |
| Zoho service integration (Cliq, etc.) | **Integration Functions** | *Check DC restriction first* |

---

## Typical Stack Patterns

### Simple REST API + database
```
Functions (Basic I/O or Advanced I/O)
  + Data Store (relational data)
  + Authentication (if user login needed)
  + API Gateway (rate limiting, routing)
```
**Cost signal:** Within free tier for < ~1K daily active users.

---

### Full-stack web app
```
Slate (React/Next.js frontend)
  + Functions (API backend)
  + Data Store (structured data)
  + Stratus (file uploads)
  + Authentication (user login)
```
**Cost signal:** Free tier covers most hobby projects. DataStore write volume is usually the first paid item.

---

### Persistent Node.js/Python/Java server (Express, FastAPI, Spring Boot)
```
AppSail (managed runtime or Docker)
  + Data Store / NoSQL (data)
  + Stratus (files)
```
**Cost signal:** AppSail bills per GB-hour of instance uptime ($0.08/GB-hour). A 512 MB instance running 24/7 = ~$0.04/day.

---

### File processing pipeline
```
Functions (trigger on upload event via Signals)
  + Stratus (source files + processed output)
  + Data Store (processing metadata/status)
  + Job Scheduling (retry / batch jobs)
```

---

### ML-powered app
```
Functions (API layer)
  + Zia Services (OCR/text analytics/image)  — or —  QuickML (custom model)
  + Data Store (results/metadata)
  + Cache (cache frequent predictions)
```
**Cost signal:** Zia APIs are $0.001/request. 100 calls/month free. QuickML inference starts at $0.0025/call after 500 free.

---

## DC Availability Quick Reference

Before recommending Circuits, Integration Functions, AutoML, Push Notifications, or Mobile Device Management — confirm the user's DC:

| Service | US | EU | IN | AU | JP | SA | CA |
|---------|----|----|----|----|----|----|-----|
| Circuits | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Integration Functions | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| AutoML (QuickML) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Push Notifications | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Identity Scanner (Zia) | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| All other services | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Source: https://docs.catalyst.zoho.com/en/

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Circuits not visible in console | User is on EU/AU/IN/JP/SA/CA DC | Use function chaining or Job Scheduling instead |
| Integration Functions grayed out | User is on EU/AU/IN/JP/SA/CA DC | Use a Basic I/O function with the Zoho API directly via Connections |
| AutoML not available | User is on EU/AU/IN/JP/SA/CA DC | Use Zia's pre-built ML services (OCR, Text Analytics) which have no DC restriction |
| "File Store not found" error | Deprecated service accessed by pre-Aug 2025 account trying new feature | Migrate to Stratus |
