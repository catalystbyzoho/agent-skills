## Android SDK (Kotlin) v3

### Setup (Gradle)

```groovy
// project-level build.gradle
allprojects {
    repositories {
        maven { url "https://maven.zohodl.com" }
    }
}

// app-level build.gradle
dependencies {
    implementation 'com.zoho.catalyst:catalyst-android-sdk:3.+'
}
```

**AndroidManifest.xml:**
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

**strings.xml:**
```xml
<string name="url_scheme">zc-YOUR_PROJECT_ID</string>
```

Place `AppConfigurationData.plist` (downloaded from console) in `app/src/main/assets/`.

### Init & Auth

```kotlin
ZCatalystApp.init(context, ZCatalystEnvironment.DEVELOPMENT)

val app = ZCatalystApp.getInstance()

// Sign Up
app.signup(firstName, lastName, email, object : ZCatalystCallback<Void> {
    override fun onSuccess(result: Void?) { }
    override fun onFailure(exception: ZCatalystException) { }
})

// Login
app.login(activity, object : ZCatalystCallback<Void> {
    override fun onSuccess(result: Void?) { }
    override fun onFailure(exception: ZCatalystException) { }
})

// Logout
app.logout(object : ZCatalystCallback<Void> { ... })

// Get Current User
app.getCurrentUser(object : ZCatalystCallback<ZCatalystUser> {
    override fun onSuccess(user: ZCatalystUser) {
        val email = user.emailId
        val name = user.firstName
    }
    override fun onFailure(exception: ZCatalystException) { }
})

val signedIn = app.isUserSignedIn()
```

### Data Store

```kotlin
val dataStore = ZCatalystApp.getInstance().getDataStoreInstance()
val table = dataStore.getTableInstance("Users")

// Create rows
val row = ZCatalystRow()
row.setColumnValue("Name", "Alice")
table.createRows(listOf(row), object : ZCatalystCallback<List<ZCatalystRow>> {
    override fun onSuccess(rows: List<ZCatalystRow>) { }
    override fun onFailure(exception: ZCatalystException) { }
})

// Get rows
table.getRows(object : ZCatalystCallback<List<ZCatalystRow>> {
    override fun onSuccess(rows: List<ZCatalystRow>) {
        for (row in rows) { val name = row.getColumnValue("Name") }
    }
    override fun onFailure(exception: ZCatalystException) { }
})

// Update rows
row.setColumnValue("ROWID", "12345")
row.setColumnValue("Age", 31)
table.updateRows(listOf(row), object : ZCatalystCallback<List<ZCatalystRow>> { ... })

// Delete row
table.deleteRow("12345", object : ZCatalystCallback<Void> { ... })
```

---

## iOS SDK (Swift) v2

### Setup (CocoaPods)

```ruby
pod 'ZCatalyst', :git => 'https://github.com/nicetomeetyou/ZCatalyst.git', :tag => '2.2.2'
```

**Info.plist:**
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array><string>zc-YOUR_PROJECT_ID</string></array>
    </dict>
</array>
```

### Init & Handle Redirects

```swift
import ZCatalyst

// AppDelegate
func application(_ application: UIApplication, didFinishLaunchingWithOptions ...) -> Bool {
    ZCatalystApp.shared.initSDK()
    return true
}

// Handle login redirects (AppDelegate)
func application(_ app: UIApplication, open url: URL, options: ...) -> Bool {
    return ZCatalystApp.shared.handleLoginRedirection(for: url)
}

// SceneDelegate (iOS 13+)
func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    if let url = URLContexts.first?.url {
        ZCatalystApp.shared.handleLoginRedirection(for: url)
    }
}
```

### Auth

```swift
// Sign Up
ZCatalystApp.shared.signup(firstName: "Alice", lastName: "Smith", email: "alice@example.com") { result in
    switch result {
    case .success: print("Signup successful")
    case .failure(let error): print("Error: \(error)")
    }
}

// Login
ZCatalystApp.shared.login(presentingViewController: self) { result in ... }

// Logout
ZCatalystApp.shared.logout { result in ... }

// Get Current User
ZCatalystApp.shared.getCurrentUser { result in
    switch result {
    case .success(let user): print(user.emailId, user.firstName)
    case .failure(let error): print("Error: \(error)")
    }
}

let signedIn = ZCatalystApp.shared.isUserSignedIn()
```

### Data Store

```swift
let table = ZCatalystApp.shared.getDataStoreInstance().getTableInstance(name: "Users")

// Get rows
table.getRows { result in
    switch result {
    case .success(let rows):
        for row in rows { let name = row.getValue(forColumn: "Name") }
    case .failure(let error): print("Error: \(error)")
    }
}

// Create row
var row = ZCatalystRow()
row.setColumnValue("Name", forColumn: "Name")
table.createRow(row) { result in ... }

// Delete row
table.deleteRow(id: "12345") { result in ... }
```

---

## Flutter SDK (Dart) v2

### Setup

```yaml
dependencies:
  zcatalyst_sdk: ^2.2.1
```

```dart
import 'package:zcatalyst_sdk/zcatalyst_sdk.dart';

await ZCatalystApp.init();
// Or with custom config:
await ZCatalystApp.init(
  config: SDKConfigs(
    projectId: "YOUR_PROJECT_ID",
    environment: Environment.development,
  ),
);
```

### Auth

```dart
final app = ZCatalystApp.getInstance();

// Sign Up
final (success, error) = await app.signup(
  firstName: "Alice", lastName: "Smith", email: "alice@example.com",
);

await app.login();
await app.logout();

final isLoggedIn = await app.isUserLoggedIn();
final user = await app.getCurrentUser();
print(user.emailId, user.firstName);
```

### Data Store

```dart
final table = ZCatalystApp.getInstance().getDataStoreInstance().getTableInstance("Users");

final rows = await table.getRows();
final row = await table.getRow("12345");
final newRow = await table.createRow({"Name": "Alice", "Age": 30});
final newRows = await table.createRows([{"Name": "Alice"}, {"Name": "Bob"}]);
final updatedRow = await table.updateRow({"ROWID": "12345", "Age": 31});
await table.deleteRow("12345");
```

### ZCQL Query Builder (Flutter)

```dart
final zcql = ZCatalystApp.getInstance().getZCQLInstance();

// Simple query
final results = await zcql.executeQuery("SELECT * FROM Users");

// Type-safe Query Builder
final query = ZCatalystQueryBuilder()
    .select(["Name", "Age", "Email"])
    .from("Users")
    .where("Age", ">", 25)
    .and("Name", "LIKE", "%Alice%")
    .orderBy("Name", ascending: true)
    .limit(50)
    .build();

final results = await zcql.executeQuery(query);

// JOIN query
final joinQuery = ZCatalystQueryBuilder()
    .select(["Users.Name", "Orders.Total"])
    .from("Users")
    .innerJoin("Orders", "Users.ROWID", "Orders.UserId")
    .build();
```

### Functions (Flutter)

```dart
final functions = ZCatalystApp.getInstance().getFunctionsInstance();

final getResult = await functions.executeGET("functionName", queryParams: {"key": "value"});
final postResult = await functions.executePOST("functionName", body: {"key": "value"});
final putResult = await functions.executePUT("functionName", body: {"key": "value"});
final deleteResult = await functions.executeDELETE("functionName", queryParams: {"id": "123"});
```

### File Store (Deprecated) & Stratus (Flutter)

> **⚠️ File Store is deprecated.** Not available for accounts created after August 27, 2025. Use Stratus for new projects.

```dart
// File Store — migration reference only, do not use for new projects
final folder = ZCatalystApp.getInstance().getFileStoreInstance().getFolderInstance("folderId");
final uploadedFile = await folder.uploadFile(file);
await folder.downloadFile("fileId", savePath: "/path/file.txt", onProgress: (received, total) { });
await folder.deleteFile("fileId");

// Stratus
final bucket = ZCatalystApp.getInstance().getStratusInstance().bucket("bucket-name");
final obj = await bucket.getObject("path/to/file.txt");
await bucket.uploadObject("path/to/file.txt", file);
await bucket.deleteObjects(["file1.txt", "file2.txt"]);
await bucket.deletePath("path/to/folder/");
```

### Error Handling (Flutter)

```dart
try {
  final rows = await table.getRows();
} on ZCatalystException catch (e) {
  print("Error code: ${e.code}");
  print("Error message: ${e.message}");
  print("HTTP status: ${e.httpStatusCode}");
}
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Login screen not returning to app (Android) | OAuth redirect URI not registered | Add the Catalyst redirect URI to your Android manifest `<intent-filter>` |
| `ZCatalystException: Unauthorized` on DataStore | SDK initialized without admin scope in background task | Use admin-scoped init for WorkManager / background jobs |
| iOS `openURL` not called after login | Missing `application(_:open:options:)` implementation | Implement the URL handler in `AppDelegate` to complete the OAuth callback |
| Flutter `ZCatalystApp.getInstance()` returns null | `await ZCatalystApp.initializeApp(...)` not awaited before use | Ensure `initializeApp` completes before any SDK call (use `await` in `main()`) |
| Row update silently fails on Android | Row ID passed as `String` instead of `Long` | Cast row ID to `Long` before passing to `updateRow()` |
