Install: `pip install zcatalyst-sdk`

Requires **Python 3.9+**.

---

## Initialization

```python
import zcatalyst_sdk

# Advanced I/O (Flask)
catalyst_app = zcatalyst_sdk.initialize(req=request)

# Basic I/O
catalyst_app = zcatalyst_sdk.initialize(req=context)

# Event / Cron functions
catalyst_app = zcatalyst_sdk.initialize(req=context)

# Job functions — MUST use admin scope; USER token is absent in the Job runtime
catalyst_app = zcatalyst_sdk.initialize(req=context, scope='admin')

# Admin scope (any function type)
admin_app = zcatalyst_sdk.initialize(req=request, scope='admin')
```

---

## Data Store

```python
table = catalyst_app.datastore().table("TableName")

# Insert single row
row = table.insert_row({"Name": "Alice", "Email": "alice@example.com"})

# Insert multiple rows
rows = table.insert_rows([
    {"Name": "Bob", "Email": "bob@example.com"},
    {"Name": "Carol", "Email": "carol@example.com"}
])

# Get single row by ROWID
row = table.get_row(row_id)

# Get paged rows
result = table.get_paged_rows(next_token="token", max_rows=200)
rows = result["data"]
has_more = result["more_records"]
next_token = result["next_token"]

# Update row (ROWID required)
updated_row = table.update_row({"ROWID": "123456000000012345", "Name": "Alice Updated"})

# Delete row
table.delete_row(row_id)
```

---

## ZCQL

```python
zcql_service = catalyst_app.zcql()

rows = zcql_service.execute_query("SELECT * FROM TableName WHERE Name = 'Alice'")
result = zcql_service.execute_olap_query("SELECT COUNT(ROWID) FROM TableName GROUP BY Status")
```

---

## Cache

```python
segment = catalyst_app.cache().segment(segment_id)

segment.put("my_key", "my_value", expiry=1)  # expiry in HOURS (max 48; defaults to 48 if omitted)
value = segment.get_value("my_key")  # raw string; get() returns the full entry with metadata
segment.update("my_key", "new_value", expiry=2)  # expiry in HOURS — omitting it resets TTL to 48h
segment.delete("my_key")  # sets to null, doesn't truly delete
```

---

## Stratus

```python
stratus_service = catalyst_app.stratus()
bucket = stratus_service.bucket(bucket_name)

buckets = stratus_service.list_buckets()
details = bucket.get_details()
objects = bucket.list_paged_objects(prefix="folder/", max_keys=100)  # or list_iterable_objects() for a generator

with open("/path/to/file.txt", "rb") as f:
    bucket.put_object("folder/file.txt", f, {"content_type": "text/plain"})

content = bucket.get_object("folder/file.txt")
bucket.delete_object("folder/file.txt")
bucket.rename_object("folder/old_name.txt", "folder/new_name.txt")
```

Full upload options (`overwrite`, `ttl`, `meta_data`, …) and multipart flows: see `catalyst-stratus/references/stratus-basics.md`.

---

## Auth

```python
auth_service = catalyst_app.authentication()

# Register user
result = auth_service.register_user(
    {"platform_type": "web", "zaid": "your_zaid"},
    {"first_name": "Alice", "last_name": "Smith", "email_id": "alice@example.com"}
)

# Get current user details
user = auth_service.get_user_details()

# Delete user
auth_service.delete_user(user_id)
```

---

## Email

```python
catalyst_app.email().send_mail({
    "from_email": "noreply@yourdomain.com",
    "to_email": ["recipient@example.com"],
    "cc": ["cc@example.com"],
    "subject": "Hello from Catalyst",
    "content": "<h1>Welcome!</h1>",
    "html_mode": True
})
```

---

## Search

```python
result = catalyst_app.search().execute_search_query(
    "search term",
    search_config={"search_table_columns": {"TableName": ["Col1", "Col2"]}}
)
```

---

## Connections

```python
credentials = catalyst_app.connections().get_connection_credentials({
    "connection_name": "my_connection"
})
# credentials["access_token"] = OAuth token
```

---

## Circuits

```python
result = catalyst_app.circuit().execute(circuit_id, {"key1": "value1"})
```

---

## NoSQL

```python
nosql_service = catalyst_app.nosql()
table = nosql_service.get_table("NoSQLTableName")  # table name or table ID

# Attribute values use typed notation: {"S": str}, {"N": "num-as-string"}, {"BOOL": bool}, {"L": [...]}, {"M": {...}}
table.insert_items({
    "item": {
        "fruitName": {"S": "Banana"},    # partition key — mandatory
        "location": {"S": "Indonesia"}   # sort key, if configured
    },
    "return": "NEW"  # returned item version: NEW | OLD | NULL
})

result = table.fetch_item({
    "keys": [{"fruitName": {"S": "Banana"}, "location": {"S": "Indonesia"}}]
})

result = table.query_table({
    "key_condition": {"attribute": "fruitName", "operator": "equals", "value": {"S": "Banana"}},
    "limit": 10
})

table.update_items({
    "keys": {"fruitName": {"S": "Banana"}, "location": {"S": "Indonesia"}},
    "update_attributes": [{"operation_type": "PUT", "color": {"S": "Yellow"}, "attribute_path": "fruitProperties"}]
})

table.delete_items({
    "keys": {"fruitName": {"S": "Banana"}, "location": {"S": "Indonesia"}}
})
```

`insert_items` / `update_items` / `delete_items` accept multiple request dicts as varargs (max 25 items per call). Condition and operator shapes: see the `catalyst-nosql` skill.

---

## Job Scheduling

> ⚠️ An earlier version of this section showed `job_scheduling().pool(pool_id).create_cron({target_function, cron_expression, ...})` — that shape does NOT exist (the equivalent Node SDK has no `pool()` accessor either; its `Jobpool` class only exposes `getJob`/`submitJob`/`deleteJob`). Do not generate it. The Python job-scheduling module's exact method names are unverified — prefer the REST API / Zoho MCP tools (`CatalystbyZoho_Create_Immediate_Job`, `CatalystbyZoho_Create_Cron_Job`), whose payloads are runtime-confirmed in `skills/catalyst-job-scheduling/references/job-scheduling-basics.md`.

Server-side semantics that apply regardless of language (all runtime-confirmed):

- `job_name`: 1–20 chars, alphanumeric + underscore.
- Function targets must be **job-type** functions.
- `time_of_execution` (OneTime crons): UNIX **seconds** — ms values silently schedule for year ~58000 and never fire.
- `job_config.retry_interval`: **seconds**, 60–86400; `number_of_retries`: 0–10.
- Cron types: `Periodic`, `OneTime`, `Calendar` (capital C), `CronExpression` (with top-level `cron_expression`).

---

## Push Notifications

```python
# Web push
web_push = catalyst_app.push_notification().web()
web_push.send_notification("A new feature has been released.", ["user1@example.com", "user2@example.com"])

# Mobile push lives under .mobile(app_id): notify / send_android_notification / send_ios_notification
```

---

## Zia Services

```python
zia_service = catalyst_app.zia()

with open("document.png", "rb") as f:
    ocr_result = zia_service.extract_optical_characters(f, {"language": "eng", "model_type": "OCR"})

sentiment = zia_service.get_sentiment_analysis(["I love this!", "Terrible experience."])
entities = zia_service.get_NER_prediction(["Zoho Corporation is in Chennai, India."])
keywords = zia_service.get_keyword_extraction(["Catalyst is a serverless platform."])
analytics = zia_service.get_text_analytics(["Zoho Catalyst makes development easy."])

# Open the file fresh per call — a consumed stream sends an empty body
with open("image.jpg", "rb") as f:
    moderation = zia_service.moderate_image(f)
with open("face.jpg", "rb") as f:
    face = zia_service.analyse_face(f)
with open("objects.jpg", "rb") as f:
    objects = zia_service.detect_object(f)

with open("barcode.png", "rb") as f:
    barcode = zia_service.scan_barcode(f)
```

---

## SmartBrowz

```python
smart_browz = catalyst_app.smart_browz()

pdf = smart_browz.convert_to_pdf(
    "https://example.com",  # source: URL or raw HTML string — first positional arg, NOT a dict
    pdf_options={"format": "A4", "print_background": True},
    navigation_options={"wait_until": "networkidle0", "timeout": 30000}
)

screenshot = smart_browz.take_screenshot(
    "https://example.com",
    screenshot_options={"full_page": True, "type": "png"},
    navigation_options={"wait_until": "networkidle2", "timeout": 60000}
)
```

> ⚠️ SDK bug (zcatalyst-sdk ≤ 1.4.0): the internal URL check never matches, so a URL source is sent as `html` — the URL string gets RENDERED AS TEXT instead of the page being fetched. Workaround: pass the URL explicitly as a kwarg, e.g. `convert_to_pdf(url_str, url=url_str, html=None, pdf_options=...)` — kwargs merge into the request body last and take precedence.

```python
output = smart_browz.generate_from_template(
    "153000000009001",  # template_id
    template_data={"name": "Alice", "amount": "$100"},
    output_options={"output_type": "pdf"}
)
```

> ⚠️ APM (Application Performance Monitoring) is NOT available for Python functions. Use logs only for Python performance monitoring.

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| DataStore methods hang silently in Job functions | `zcatalyst_sdk` Table methods (`get_paged_rows`, `delete_rows`, `insert_rows`, etc.) use `CredentialUser.USER` internally. Job functions have no USER token — every call makes an unauthenticated request, waits 60 s per attempt, raises no exception, and silently burns toward the 15-minute timeout | Initialize with `scope='admin'`: `zcatalyst_sdk.initialize(req=context, scope='admin')` |
