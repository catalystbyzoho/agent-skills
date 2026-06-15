> **Supported Java versions:** 8, 11, 17
> **Docs:** https://docs.catalyst.zoho.com/en/sdk/java/v1/overview/

## Maven Setup

```xml
<!-- Repository -->
<repository>
  <id>zoho-dl</id>
  <url>https://maven.zohodl.com</url>
</repository>

<!-- Dependency -->
<dependency>
  <groupId>com.zc</groupId>
  <artifactId>zcatalyst-sdk</artifactId>
  <version>1.15.0</version>
</dependency>
```

---

## Initialization

```java
// Default (uses request context)
ZCProject.initProject();

// Admin scope
ZCProject adminProject = ZCProject.initProject("admin", ZCUserScope.ADMIN);

// User scope
ZCProject userProject = ZCProject.initProject("user", ZCUserScope.USER);
```

---

## Data Store

```java
ZCObject object = ZCObject.getInstance();
ZCTable table = object.getTable("TableName");

// Insert single row
ZCRowObject row = ZCRowObject.getInstance();
row.set("column_name", "value");
row.set("numeric_column", 123);
ZCRowObject insertedRow = table.insertRow(row);
long rowId = insertedRow.getRowId();

// Insert multiple rows
List<ZCRowObject> rows = new ArrayList<>();
ZCRowObject row1 = ZCRowObject.getInstance();
row1.set("Name", "Alice");
rows.add(row1);
List<ZCRowObject> insertedRows = table.insertRows(rows);

// Get single row
ZCRowObject row = table.getRow(rowId);
String value = row.get("column_name").toString();

// Get all rows (paginated)
List<ZCRowObject> allRows = table.getRows();
ZCRowPagedResponse pagedResponse = table.getPagedRows();
List<ZCRowObject> currentPage = pagedResponse.getCurrentPageData();
boolean hasNext = pagedResponse.hasNextPage();
ZCRowPagedResponse nextPage = pagedResponse.getNextPage();

// Update row (ROWID required)
ZCRowObject updateRow = ZCRowObject.getInstance();
updateRow.set("ROWID", rowId);
updateRow.set("column_name", "updated_value");
ZCRowObject updatedRow = table.updateRow(updateRow);

// Delete row
table.deleteRow(rowId);
```

---

## ZCQL

```java
ZCQL zcql = ZCQL.getInstance();

// Basic query
List<ZCRowObject> results = zcql.executeQuery("SELECT * FROM TableName WHERE column = 'value'");

// V2 query
List<ZCRowObject> results = zcql.executeQuery("SELECT * FROM TableName", true);

// OLAP query
List<ZCRowObject> stats = zcql.executeQuery("SELECT COUNT(*) FROM TableName", true, true);
```

---

## Cache

```java
ZCCache cache = ZCCache.getInstance();
ZCSegment segment = cache.getSegment(segmentId);

// Put with expiry (milliseconds)
ZCCacheObject cacheObject = segment.put("cacheKey", "cacheValue", 3600000L);

// Get
ZCCacheObject cacheObject = segment.get("cacheKey");
String value = cacheObject.getValue();

// Update
ZCCacheObject updated = segment.update("cacheKey", "newValue", 7200000L);

// Delete
segment.delete("cacheKey");
```

---

## Logging in Java Functions

```java
import java.util.logging.Logger;
private static final Logger LOGGER = Logger.getLogger(MyFunction.class.getName());

LOGGER.info("Processing request");          // INFO
LOGGER.warning("Potential issue");          // WARNING
LOGGER.severe("Critical error");            // ERROR
LOGGER.fine("Debug details");               // DEBUG

// Structured logging
LOGGER.info("{\"action\":\"createUser\",\"userId\":\"12345\"}");
```

---

## SmartBrowz — Headless Browser (Selenium / Java)

```java
SmartBrowz smartBrowz = catalystApp.smartBrowz();
JSONObject browserDetails = smartBrowz.open();

ChromeOptions options = new ChromeOptions();
WebDriver driver = new RemoteWebDriver(
    new URL(browserDetails.getString("browser_http_url")),
    options
);

driver.get("https://example.com");
String title = driver.getTitle();
driver.quit();
```

### Browser Logic Function (Java — Selenium pre-initialized)

```java
public class BrowserLogicFunction implements ZCBrowserFunction {
    public void runner(CatalystApp catalystApp, Context context, BrowserData browserData) throws Exception {
        String input = browserData.getArgument();
        WebDriver driver = browserData.getDriver();  // Pre-initialized

        driver.get("https://example.com");
        String title = driver.getTitle();

        context.close(new JSONObject().put("title", title));
    }
}
```

### PDF Generation (Java)

```java
JSONObject pdfOptions = new JSONObject();
pdfOptions.put("format", "A4");
pdfOptions.put("print_background", true);

JSONObject navigationOptions = new JSONObject();
navigationOptions.put("wait_until", "networkidle0");
navigationOptions.put("timeout", 30000);

byte[] pdfBytes = smartBrowz.generatePdf("https://example.com", pdfOptions, navigationOptions);

// Screenshot from HTML
byte[] imageBytes = smartBrowz.captureScreenshot(
    "<html><body><h1>Hello</h1></body></html>",
    new JSONObject().put("full_page", true).put("type", "png")
);
```

---

## APM — Application Performance Monitoring

APM is available for Java functions (and Node.js). Python is NOT supported.

**What it shows:**
- Invocation count, success/failure breakdown
- P50/P95/P99 response times
- Top 100 slowest executions with full traces
- Breakdown of SDK calls (DataStore, Cache, etc.)

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `NullPointerException` on `ZCatalystApp.getInstance()` | SDK not initialized before use | Call `ZCatalystApp.initializeApp(context)` in `Application.onCreate()` before any SDK call |
| `UnauthorizedException` in Job/Cron function | SDK initialized without admin scope | Use `ZCatalystApp.initializeApp(context, ZCatalystApp.RequestScope.ADMIN)` for background functions |
| `ClassNotFoundException` for Catalyst classes | Dependency not included in `pom.xml` / `build.gradle` | Add `zcatalyst-sdk-java` dependency; ensure JAR is in the function's `lib/` directory for deployed functions |
| DataStore query returns empty result set | Table name or column name case mismatch | Table and column names in ZCQL are case-sensitive; verify in Console → Data Store |
