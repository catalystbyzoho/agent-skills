---
type: llm
weight: 1
---

A successful response refuses to treat the green deploy output as proof the app works, and covers BOTH of these:
1. Verify hosted behavior — hit the AppSail endpoint and check it responds correctly, and check the AppSail logs (Console logs, noting startup/port-binding failures may only be visible there) rather than stopping at the CLI success message.
2. Flag the `./uploads` folder as a durability problem — the AppSail container filesystem is not durable storage (files disappear on restart/redeploy/scale), so uploads must move to Stratus (or another durable store).

Fail the response if it says the deploy succeeding means the app is done/working, skips endpoint or log verification entirely, or treats local filesystem writes as safe persistent storage.
