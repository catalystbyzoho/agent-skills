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

segment.put("my_key", "my_value", expiry=3600000)  # expiry in ms
value = segment.get("my_key")
segment.update("my_key", "new_value", expiry=7200000)
segment.delete("my_key")  # sets to null, doesn't truly delete
```

---

## Stratus

```python
stratus_service = catalyst_app.stratus()
bucket = stratus_service.bucket(bucket_name)

buckets = stratus_service.list_buckets()
details = bucket.get_details()
objects = bucket.list_objects(prefix="folder/", max_keys=100)

with open("/path/to/file.txt", "rb") as f:
    bucket.upload_object("folder/file.txt", f, content_type="text/plain")

content = bucket.download_object("folder/file.txt")
bucket.delete_object("folder/file.txt")
bucket.rename_object("folder/old_name.txt", "folder/new_name.txt")
```

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
table = nosql_service.table("NoSQLTableName")

table.insertItems([{"pk": "partition1", "sk": "sort1", "data": "value1"}])
items = table.fetchItems([{"pk": "partition1", "sk": "sort1"}])
results = table.queryTable({"pk": "partition1", "query": {"condition": "sk BEGINS_WITH 'sort'", "limit": 10}})
table.updateItems([{"pk": "partition1", "sk": "sort1", "update_expression": "SET data = :val", "expression_values": {":val": "updated"}}])
table.deleteItems([{"pk": "partition1", "sk": "sort1"}])
```

---

## Job Scheduling

```python
pool = catalyst_app.job_scheduling().pool(pool_id)

cron = pool.create_cron({
    "cron_name": "daily_report",
    "target_function": "generate_report",
    "cron_type": "calendar",
    "cron_expression": "0 9 * * *",
    "params": {"report_type": "daily_summary"}
})
```

---

## Push Notifications

```python
push_service = catalyst_app.pushnotification()

push_service.sendNotification({
    "subject": "New Update",
    "message": "A new feature has been released.",
    "recipients": ["user_id_1", "user_id_2"]
})
```

---

## Zia Services

```python
zia_service = catalyst_app.zia()

with open("document.png", "rb") as f:
    ocr_result = zia_service.extractOpticalCharacters(f, {"language": "eng", "model_type": "OCR"})

sentiment = zia_service.getSentimentAnalysis(["I love this!", "Terrible experience."])
entities = zia_service.getNamedEntityRecognition(["Zoho Corporation is in Chennai, India."])
keywords = zia_service.getKeywordExtraction(["Catalyst is a serverless platform."])
analytics = zia_service.getAllTextAnalytics(["Zoho Catalyst makes development easy."])

with open("image.jpg", "rb") as f:
    moderation = zia_service.moderateImage(f)
    faces = zia_service.detectFaces(f)
    objects = zia_service.recognizeObjects(f)

with open("barcode.png", "rb") as f:
    barcode = zia_service.scanBarcode(f)
```

---

## SmartBrowz

```python
smart_browz = catalyst_app.smart_browz()

pdf = smart_browz.convert_to_pdf({
    "url": "https://example.com",
    "pdf_options": {"format": "A4", "print_background": True},
    "navigation_options": {"wait_until": "networkidle0", "timeout": 30000}
})

screenshot = smart_browz.take_screenshot({
    "url": "https://example.com",
    "screenshot_options": {"full_page": True, "type": "png"},
    "navigation_options": {"wait_until": "networkidle2", "timeout": 60000}
})

output = smart_browz.generate_output_from_template({
    "template_id": template_id,
    "template_data": {"name": "Alice", "amount": "$100"},
    "output_type": "pdf"
})
```

> ⚠️ APM (Application Performance Monitoring) is NOT available for Python functions. Use logs only for Python performance monitoring.

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| DataStore methods hang silently in Job functions | `zcatalyst_sdk` Table methods (`get_paged_rows`, `delete_rows`, `insert_rows`, etc.) use `CredentialUser.USER` internally. Job functions have no USER token — every call makes an unauthenticated request, waits 60 s per attempt, raises no exception, and silently burns toward the 15-minute timeout | Initialize with `scope='admin'`: `zcatalyst_sdk.initialize(req=context, scope='admin')` |
