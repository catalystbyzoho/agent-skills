---
name: catalyst-sdk
description: "Catalyst SDKs — initialization patterns, service access, and method reference for Node.js, Web (browser), Python, Java, Android, iOS, and Flutter. Trigger on 'SDK', 'zcatalyst-sdk-node', 'Node.js SDK', 'Web SDK', 'Python SDK', 'Java SDK', 'Android SDK', 'iOS SDK', 'Flutter SDK', or 'initialize SDK'."
metadata:
  version: "2.0.0"
---

## How It Works

1. **Identify the platform** — Node.js, Web (browser), Python, Java, Android, iOS, or Flutter.
2. **Load the matching reference file** — Each platform has its own SDK reference with initialization pattern and service methods.
3. **Initialization first** — Always show the SDK init call before any service-specific code.
4. **Platform quirks** — Web SDK uses browser auth (no service account); Node.js SDK uses server-side init; Mobile SDKs require the Catalyst project ID in the config.

## Triggers

Use this skill for: "SDK", `zcatalyst-sdk-node`, `zcatalyst-sdk`, "Node.js SDK", "Web SDK", "Python SDK", "Java SDK", "Android SDK", "iOS SDK", "Flutter SDK", `sdk-web`, `sdk-mobile`, `catalyst.initialize`, `catalystApp`, "initialize SDK", or any platform-specific SDK question.

## References

| Reference | Load when the query is about… |
|-----------|-------------------------------|
| `references/sdk-nodejs.md` | Node.js SDK — DataStore, ZCQL, Cache, Stratus (multipart, signed URLs), Auth, Email, NoSQL, Job Scheduling, Circuits, Connections, Search, Push Notifications |
| `references/sdk-web.md` | Web SDK v4 — browser-side auth (hosted/embedded login), generateAuthToken, isUserAuthenticated, signOut, DataStore, Stratus, cross-domain Slate→function pattern |
| `references/sdk-python.md` | Python SDK — DataStore, ZCQL, Cache, Stratus, Auth, Email, Search, Connections, NoSQL, Push Notifications, Job Scheduling, Circuits, Zia, SmartBrowz |
| `references/sdk-java.md` | Java SDK — Maven setup, DataStore, ZCQL, Cache, SmartBrowz (Selenium, PDF) |
| `references/sdk-mobile.md` | Android (Kotlin), iOS (Swift), Flutter (Dart) — auth, DataStore, ZCQL, Stratus, Push Notifications, Search |
