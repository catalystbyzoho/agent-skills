# Catalyst Signals — Event Bus Basics

Catalyst Signals is a serverless event bus for building **event-driven architectures (EDA)**. It enables near-instantaneous communication between decoupled applications without custom integration code. All configuration is done through the **Catalyst Console** — there is no SDK or programmatic API for creating publishers, rules, or webhooks.

---

## What is Catalyst Signals?

Signals acts as a message broker between publishers (event sources) and targets (event consumers):

```
Publisher (Zoho CRM) → Event (lead_created) → Rule (filter: status=hot) → Target (Webhook/Function/Circuit)
```

**Key benefits:**
- **Serverless** — no infrastructure to manage
- **No-code** — visual rule builder in Console
- **Scalable & resilient** — automatic event retries and dead-letter queues
- **Multi-target** — one event can trigger multiple targets simultaneously
- **Modernization** — integrate legacy systems without modifying source code
- **Ad-hoc integrations** — connect any two applications via custom publishers

**Use cases:**
1. Lead qualification workflow (Zoho CRM → Catalyst Function → Slack notification)
2. Inventory synchronization (Zoho Inventory → Catalog service)
3. User provisioning (Catalyst Authentication signup → onboarding email)
4. Real-time analytics (Zoho Commerce order → data warehouse)
5. Audit trails (Catalyst DataStore changes → logging service)
6. Microservices orchestration (Order service → Payment service → Shipping service)
7. SaaS integrations (Custom Publisher → third-party API → Zoho service)

---

## Ecosystem Elements

1. **Events** — JSON payloads representing state changes
2. **Publishers** — sources that emit events (Zoho products, Catalyst services, custom apps)
3. **Rules** — routing logic connecting publishers to targets with filters and transformations
4. **Targets** — destinations receiving events (webhooks, functions, circuits)
5. **Webhooks** — HTTPS endpoints for external systems

---

## Publishers

Publishers are event sources. Signals supports three types:

### 1. Zoho Publishers

Pre-integrated Zoho products with auto-configured authorization and schema:

- Zoho Bigin, Billing, Books, Commerce, CRM, Expense, Inventory, Invoice, Meeting, Survey
- Zoho Assist, Campaigns, Marketing Automation, Sprints, Backstage, Desk, SalesIQ

**Max Zoho publishers:** 100 (soft limit, contact support to increase)

**Event size limit:** 100 KB per event, 5 MB for multi-event payload (no upper limit on event count)

**Creating a Zoho Publisher:**
1. Console → Signals → Publishers → **Add Publisher** → select Zoho service
2. Provide **API Name** (no spaces, max 50 chars, alphanumeric + underscore, no leading digit)
3. Select **Organization** (lists orgs where you're a member with same email)
4. Enable **Event Ordering** (optional) to ensure sequential delivery
5. Click **Save** → **Authorize** to grant Catalyst access to the Zoho service

**Authorization:** Internal OAuth — no manual scope configuration. You must be an admin in the Zoho publisher service to deploy to production.

**Event examples:**
- Zoho CRM: `lead_created`, `lead_updated`, `deal_approved`, `contact_deleted`
- Zoho Inventory: `item_created`, `sales_order_updated`, `invoice_deleted`
- Zoho Desk: `ticket_created`, `ticket_status_changed`, `contact_updated`

### 2. Catalyst Publishers

Catalyst CloudScale services in the same project:

- Authentication (user_signedup, user_confirmed, user_deleted)
- Cache (cache_item_created, cache_item_updated)
- Data Store (row_inserted, row_updated, row_deleted)
- File Store (filestore_file_uploaded)
- Stratus (stratus_object_uploaded, stratus_object_downloaded, stratus_object_updated, stratus_object_deleted)

**Restrictions:** Only services in the **same project and organization** can be used. The service must be active (e.g., you must have at least one Data Store table to use Data Store events).

**Creating a Catalyst Publisher:**
1. Console → Signals → Publishers → **Add Publisher** → select Catalyst service
2. Provide **API Name**
3. Project and Organization fields auto-populate (no choice)
4. Enable **Event Ordering** (optional)
5. Click **Save**

**No authorization required** — Catalyst services auto-integrate within the same project.

### 3. Custom Publishers

For third-party services or legacy apps. You provide the REST API URL where events will be posted.

**Max custom publishers:** 25 (soft limit, contact support to increase)

**Event size limit:** 64 KB per event, 256 KB for array of up to 25 events

**REST API rate limit:** 500 requests per minute. Exceeding this locks the URL for 60 seconds.

**Creating a Custom Publisher:**
1. Console → Signals → Publishers → **Create Your Own Publisher**
2. Provide **API Name** and **Description**
3. Enable **Event Ordering** (optional)
4. Click **Save**
5. Click **Add Event** → provide **Event API Name** and **Description**
6. Click **Add Schema** → choose **Manual** (paste JSON payload) or **Live** (capture real API call)

**Live schema capture:**
- Console generates a temporary URL (valid 15 minutes)
- Configure your publisher system to POST events to this URL
- Signals captures the payload and auto-generates the schema
- Select the captured payload and click **Save**

**Manual schema:**
- Paste a sample JSON payload from your publisher
- Signals auto-generates the schema from the JSON structure

**Environment-specific URLs:**
- The REST API URL generated in **Development** differs from **Production**
- You must update the publisher system's URL when deploying to production

---

## Events

Events are JSON payloads with a unique ID, timestamp, and publisher-specific data.

**Event Statuses (overall):**
- **Received** — event arrived in Signals
- **Success** — delivered to all targets successfully
- **Failed** — at least one target failed (highest priority)
- **Dropped** — target or rule disabled/deleted (second highest priority)
- **Unmatched** — no rule matched the event
- **Unprocessed** — event was not processed (rare, indicates system issue)

**Priority order for display:** Failed > Dropped > Success

**Event Execution Statuses (per target):**
- **In Queue** — waiting for dispatch
- **In Progress** — currently being delivered
- **Success** — target responded successfully
- **Failed** — target did not respond or responded with error
- **Dropped** — rule/target was deleted or disabled after event was received
- **Batching** — event is part of a batch waiting for dispatch trigger
- **Scheduled** — event scheduled for future delivery
- **Retry Scheduled** — failed event scheduled for retry

**Event Ordering:**
Enable **Event Ordering** when creating a publisher to guarantee events are delivered in the same order they were received. This applies across all publisher types (Zoho, Catalyst, Custom).

**How ordering works:**
- Events are delivered sequentially
- If an event fails and enters Dropped status, it will be retried according to the retry policy
- Subsequent events continue in order as long as each one succeeds on first attempt

**Schemas:**
- **Zoho and Catalyst publishers**: schemas are pre-generated for all supported events
- **Custom publishers**: schema is auto-generated from the event payload (manual or live capture)
- Schemas define the structure and data types of event payloads, used for validation and transformation

---

## Rules

Rules connect publishers to targets with optional filters and payload transformations.

**Creating a Rule:**
1. Console → Signals → Rules → **Create Rule**
2. **Select Publisher** and **Event** (e.g., Zoho CRM → lead_created)
3. **Add Filters** (optional):
   - Use JSON path notation to filter events based on payload data
   - Example: `$.lead_status == "Hot"` (only deliver events where lead status is "Hot")
   - Supports operators: `==`, `!=`, `>`, `<`, `>=`, `<=`, `contains`, `startsWith`, `endsWith`
4. **Add Target** (Webhook, Function, or Circuit):
   - **Webhook**: Select from previously created webhooks
   - **Function**: Select from Serverless Functions in the same project
   - **Circuit**: Select from Serverless Circuits in the same project
5. **Transform Event Payload** (optional):
   - Map event fields to target-specific structure using JSON path transformations
   - Add custom static fields
   - Rename fields
6. **Configure Dispatch Policy**:
   - **Instant** (default): deliver immediately as events occur
   - **Batch**: aggregate events before delivery (subtypes: By Count, By Size, By Interval, By Schedule)
7. **Configure Retry Policy**:
   - **Auto**: exponential backoff — 1 min, 2 min, 4 min, 8 min, then 10 min max per retry
   - **Manual**: fixed interval between 1 minute and 1 hour
   - Max retry attempts: **20**
8. **Set TTL** (Time To Live): how long to retain the event before dropping (default: 24 hours, configurable in hours/minutes for Instant policy)
9. Click **Save**

**Rule Status:**
- **Active** — rule processes events
- **Inactive** — rule does not process events
- In production, you can only toggle Active/Inactive. You cannot edit, create, or delete rules in production.

**Filters:**
Rules support complex filters using JSON path (up to 25 filter conditions per rule):
```json
{
  "lead_status": "Hot",
  "lead_score": 85
}
```
Filter: `$.lead_status == "Hot" AND $.lead_score > 80`

**Multiple Targets:**
One rule can deliver the same event to **up to 5 targets**. Each target can have its own transformation and dispatch policy.

---

## Targets

Targets receive events from rules. Three types supported:

### 1. Webhooks

HTTPS endpoints for external systems.

**Creating a Webhook:**
1. Console → Signals → Webhooks → **Create Webhook**
2. Provide **API Name** and **Webhook URL** (must be HTTPS)
3. **Authorization** (optional):
   - None
   - Basic Auth (username/password)
   - Bearer Token
   - OAuth (use Catalyst Connections for token management)
4. **Custom Headers** (optional)
5. **Verification** — Signals sends a test request to validate the URL
6. Click **Save**

**Webhook requirements:**
- Must respond with HTTP 2xx status within timeout (default: 30 seconds)
- Must be HTTPS (HTTP not supported)
- Should handle retries idempotently (Signals may deliver the same event multiple times on failure)

**OAuth with Connections:**
If your webhook requires OAuth tokens:
1. Create a Connection in Console → Serverless → Connections
2. Select the connection in webhook authorization settings
3. Signals automatically manages token refresh

### 2. Functions

Serverless Functions in the same project.

**Creating a Function Target:**
- Select a function from the dropdown in the rule creation flow
- Function receives the event payload as the request body. The actual structure delivered:
  ```json
  {
    "rule_id": "123456789",
    "target_id": "98765432",
    "version": 1,
    "attempt": 1,
    "account": {
      "org_id": "87359421",
      "project": { "environment": "DEVELOPMENT", "name": "my-project", "id": "..." }
    },
    "events": [
      {
        "id": "b05f449e-7eb0-4e7f-a40f-662820729d20",
        "time_in_ms": 1721312979144,
        "source": "publisher_id:.../service:zohocrm/account:...",
        "event_config": { "api_name": "Lead Created", "id": "..." },
        "data": { /* actual event data from the publisher */ }
      }
    ]
  }
  ```
- `attempt` > 1 means this is a retry
- `events` is always an array — even for Instant delivery, it may contain multiple events

**Function must respond within timeout** (default: 30 seconds). If function takes too long, use **Kill Function** in Signals Logs to terminate it (moves event to Dropped status).

**Function Logs:**
Click the **Logs** icon next to a function target in Signals Logs to view function execution logs in Console → DevOps.

### 3. Circuits

Serverless Circuits in the same project.

**Creating a Circuit Target:**
- Select a circuit from the dropdown in the rule creation flow
- Circuit receives event payload in the first circuit node
- Circuit Execution History is accessible via the **Logs** icon in Signals Logs

---

## Dispatch Policies

Controls when and how events are delivered to targets. **Max delivery payload size: 1024 KB (1 MB).**

### 1. Instant

**Default mode.** Events are delivered to the target immediately after they occur in the publisher.

- TTL is customizable (up to 24 hours / 1440 minutes)
- When events arrive in bulk, they are batched by default. Enable **Send as Single Event** to force individual delivery
- **Use when:** real-time processing is required (e.g., send notification immediately on signup)

### 2. Batch

Events are collected and delivered collectively. **TTL is fixed at 24 hours and cannot be changed.**

Four subtypes:

| Subtype | Trigger | Limits |
|---------|---------|--------|
| **By Count** | Deliver when N events collected | Min: 2, Max: 100 events |
| **By Size** | Deliver when combined size reaches threshold | Max configurable size: 100 KB |
| **By Interval** | Deliver at regular intervals | Min: 2 hours, Max: 12 hours |
| **By Schedule** | Deliver daily at a configured time | Configurable timezone |

> If batch conditions are not met within the 24-hour TTL, events are dispatched via **One-Time Dispatch** (a fallback that clears pending batch events at TTL end — no retries apply).

**Use when:** bulk processing is more efficient (e.g., batch insert to database hourly instead of per-event).

**Batch payload structure:**
```json
{
  "rule_id": "123456789",
  "target_id": "98765432",
  "events": [
    { "id": "...", "data": { ... }, "time_in_ms": 1721312979144, "event_config": { ... } },
    { "id": "...", "data": { ... }, "time_in_ms": 1721312979200, "event_config": { ... } }
  ]
}
```

---

## Event Transformation

Transform event payloads before delivery to targets. Useful when target expects different structure than publisher emits.

**Transformation options:**
1. **Map fields** — use JSON path to extract specific fields
   - Example: Map `$.lead.email` to `$.customer_email`
2. **Add static fields** — inject constant values
   - Example: Add `source: "Zoho CRM"` to every event
3. **Rename fields** — change field names
   - Example: Rename `lead_status` to `status`
4. **Combine fields** — merge multiple fields into one
   - Example: Combine `first_name` and `last_name` into `full_name`

**Example transformation:**
**Original payload:**
```json
{
  "lead_id": "123",
  "lead_name": "John Doe",
  "lead_email": "john@example.com",
  "lead_status": "Hot"
}
```

**After transformation:**
```json
{
  "customer_id": "123",
  "name": "John Doe",
  "email": "john@example.com",
  "priority": "high",
  "source": "CRM"
}
```

---

## Retry Policy & TTL

**Retry Policy:**
- If a target fails (HTTP 4xx/5xx, timeout, circuit failure), Signals retries delivery automatically
- **Max retry attempts: 20**
- Two retry frequency modes:
  - **Auto**: exponential backoff — 1st retry at 1 min, then 2 min, 4 min, 8 min, capped at 10 min per interval
  - **Manual**: fixed interval, configurable between **1 minute and 1 hour**
- Retry count and frequency are configured per target in the rule

**TTL (Time To Live):**
- **Instant policy**: default 24 hours, customizable up to 24 hours / 1440 minutes
- **Batch policy**: fixed at 24 hours, cannot be changed
- When TTL expires before delivery, event moves to **Dropped** status
- Retry attempts that exceed the TTL period are also dropped

**When to increase TTL:**
- Target system has scheduled maintenance windows
- Target system is intermittently unavailable
- Events are critical and cannot be lost

**When to disable retries:**
- Event is time-sensitive and stale data is worse than no data
- Target system is idempotent and can handle duplicate deliveries

---

## Logs & Dashboard

### Logs

**Console → Signals → Logs**

View all processed events with:
- Event ID, timestamp, publisher, event name, status
- **Details View**: drill into a specific event to see:
  - Delivery status per target (In Queue, In Progress, Success, Failed, Dropped)
  - Retry attempts and failure messages
  - Event payload (click to expand)
  - Execution history across all rules and targets

**Filters:**
- By **Target** (webhook/function/circuit)
- By **Status** (Success, Failed, Dropped, etc.)
- By **Rule**
- By **Event** (select publisher → event)
- By **Unique ID** (search for specific event)

**Debugging:**
- Hover over **Failed** status to see error message
- Click **Logs** icon next to Function/Circuit target to view execution logs
- Use **Kill Function** icon to terminate long-running functions (moves event to Dropped)

### Dashboard

**Console → Signals → Dashboard**

Analytical view of event processing:

**Top 5 Widgets:**
- **Most Active Targets**: targets receiving the most events
- **Most Active Publishers**: publishers emitting the most events
- **Most Failures**: top 5 targets with failed events (includes consumer type and name)
- **Event Status Breakdown**: pie chart of Success/Failed/Dropped
- **Event Volume Over Time**: line graph showing event throughput

**Use dashboard to:**
- Identify bottlenecks (targets with high failure rate)
- Monitor event throughput
- Assess publisher activity
- Plan capacity (scale targets handling high volumes)

---

## Deployment

### Development → Production

**Before deploying:**
1. **Test all rules in Development** using real events or test payloads
2. **Verify webhook URLs** are production-ready (not localhost or dev domains)
3. **Update custom publisher REST API URLs** (Development URLs differ from Production URLs)
4. **Ensure dependent components are deployed**:
   - If rules use Functions → deploy functions
   - If rules use Circuits → deploy circuits
   - If rules use Connections → deploy connections
   - Deploy all Catalyst publishers (DataStore, Cache, etc.) used in rules

### Deployment Restrictions

**Max publishers per deployment:** 25 (regardless of type: Zoho/Catalyst/Custom)

**Rules are locked in production:**
- Cannot create new rules in production
- Cannot edit existing rules in production
- Cannot delete rules in production
- **Can only enable/disable rules** in production

All structural changes must be made in Development and deployed.

**Zoho CRM Publisher:**
- In Development, you select a Sandbox organization
- During deployment, you can switch to the corresponding Production organization
- This is the only rule-level modification allowed during deployment

**Custom modules and fields:**
Ensure all custom modules and custom fields referenced in rule filters exist in the production organization. Signals does not create them automatically.

### Deployment Permissions

**User deploying must be an admin in Zoho publisher services.**

Example: If you use Zoho CRM as a publisher, you must be a CRM admin in the target organization. This ensures proper authorization between Catalyst Signals and Zoho publishers.

---

## Common Patterns

### 1. Lead Qualification Workflow

**Goal:** When a hot lead is created in Zoho CRM, send notification to Slack and create task in project management tool.

**Setup:**
1. Create **Zoho CRM Publisher** (event: `lead_created`)
2. Create **Rule 1**: Filter `$.lead_status == "Hot"` → Webhook (Slack API) → transform to Slack message format
3. Create **Rule 2**: Filter `$.lead_status == "Hot"` → Webhook (Project tool API) → transform to task format

### 2. Inventory Sync Across Systems

**Goal:** When product stock is updated in Zoho Inventory, sync to e-commerce platform.

**Setup:**
1. Create **Zoho Inventory Publisher** (event: `item_updated`)
2. Create **Webhook** for e-commerce platform API
3. Create **Rule**: Filter `$.item_type == "Product"` → Webhook → transform to e-commerce product format

### 3. User Onboarding Flow

**Goal:** When user signs up via Catalyst Authentication, send welcome email and provision account.

**Setup:**
1. Create **Catalyst Authentication Publisher** (event: `user_signedup`)
2. Create **Function** to send welcome email (uses Catalyst Email integration)
3. Create **Function** to provision account (creates DataStore rows for user profile)
4. Create **Rule**: `user_signedup` → Function 1 (email)
5. Create **Rule**: `user_signedup` → Function 2 (provision)

### 4. Real-Time Analytics Pipeline

**Goal:** Aggregate Zoho Commerce orders and send batches to data warehouse hourly.

**Setup:**
1. Create **Zoho Commerce Publisher** (event: `sales_order_created`)
2. Create **Webhook** for data warehouse API
3. Create **Rule** with **Batch — By Schedule** (every hour) → Webhook → transform to data warehouse format

### 5. Audit Trail for Data Changes

**Goal:** Log all Data Store row updates to external audit service.

**Setup:**
1. Create **Catalyst Data Store Publisher** (event: `row_updated`)
2. Create **Webhook** for audit service
3. Create **Rule**: `row_updated` → Webhook → transform to audit log format

---

## No SDK / No Programmatic API

**CRITICAL:** Catalyst Signals does not provide an SDK or REST API for creating or managing:
- Publishers
- Events
- Webhooks
- Rules

All Signals configuration is done through the **Catalyst Console**. The only programmatic interaction is:
1. **Custom publishers** POST events to the REST API URL generated by Signals
2. **Target functions** receive events in the function handler code

If a user asks "How do I create a publisher in Node.js?" or "What's the SDK method for creating a rule?", the answer is:
> Signals is a console-only service. Publishers, events, webhooks, and rules are created in Console → Signals. There is no SDK or API for this. However, your target **functions** receive events programmatically and can process them with code.

---

## Related Skills

- **catalyst-functions** — for implementing target functions that process events
- **catalyst-datastore** — if using Data Store as a publisher
- **catalyst-authentication** — if using Authentication as a publisher
- **catalyst-cache** — if using Cache as a publisher
- **catalyst-stratus** — if using Stratus as a publisher

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Publisher not found" | Publisher was deleted or disabled | Re-create publisher or enable it |
| "Event schema validation failed" | Custom publisher sent invalid payload | Check event payload structure matches schema |
| "Webhook timeout" | Target webhook did not respond within 30s | Optimize webhook processing time or increase timeout in rule settings |
| "Function terminated" | Function exceeded execution time | Optimize function code or increase function timeout in catalyst-config.json |
| "Event dropped — rule disabled" | Rule was disabled after event was received | Enable rule or accept that event won't be redelivered |
| "Event unmatched" | No rule matched the event | Create a rule for this publisher/event combination |
| "Custom publisher API locked" | Exceeded 500 req/min rate limit | Wait 60 seconds or reduce event emission rate |
| "Authorization failed" | Zoho publisher authorization expired or revoked | Re-authorize publisher in Console → Signals → Publishers |
| "Catalyst publisher unavailable" | Referenced Catalyst service (DataStore, Cache, etc.) is not active | Activate the Catalyst service in Console (e.g., create at least one DataStore table) |
| "Target not found" | Function/Circuit/Webhook was deleted | Re-create target or remove rule |