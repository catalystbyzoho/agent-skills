# Data Streams Basics

Real-time publish/subscribe: a server publishes to a channel, and every subscriber connected over WebSocket receives the message. Everything here was verified against live calls.

## How the pieces fit

```
Console: create channel + choose access control (User Roles or Custom Logic)
Server (Catalyst function):
  publishData(channelId, data)  (admin)   -> every connected subscriber
  getTokenPair(channelId, { userId | connectionName }) -> token pair for one client
Client (browser, Node, Java app):
  get token pair from your function -> open WebSocket -> on 'open' subscribe(type)
  -> on 'message' process event, then sendAck()
```

- **Channels are created only in the console** (Cloud Scale → Data Streams → Create Channel). There is no SDK method, REST endpoint, or MCP tool to create, edit, or delete a channel. The agent cannot see the console: ask the user for the channel ID, or list channels from a function.
- **Admin methods run on the server only.** `publishData`, `getAllChannels`, `getChannelDetails` and `getLiveCount` are server-side (admin) methods: call them in a Catalyst function, never in browser or mobile code.
- **`getTokenPair` is available in server-side and in the browser SDK.** On a **Custom Logic** channel the token must still come from the configured function (see below), so issue it there and return it to the client.
- **Subscribers** can run anywhere that opens a WebSocket: a browser, a Node service, a Java app.

## Channel access control

Chosen when the channel is created. It decides which identifier a token pair must use.

| Access control | `control_type` | Token identifier | Where the token must be generated |
|---|---|---|---|
| **User Roles** (pick roles, e.g. App Administrator, App User) | `0` | `userId`: an **app user's** ID from Catalyst Authentication | Any Catalyst function, or the REST API |
| **Custom Logic** (pick an Advanced I/O function) | `1` | `connectionName`: any string you choose per client | **Only inside the configured function** |

What happens with the wrong combination:

| Request | Result |
|---|---|
| User Roles channel + `connectionName` | `400 MISSING_PARAM` "Mandatory parameter app_user_id is missing." |
| User Roles channel + a console admin's user ID (not an app user) | `400 INVALID_INPUT` "Invalid input value for app_user_id" |
| User Roles channel + an app user who was invited but has not confirmed | Works |
| Custom Logic channel + `connectionName` from any function other than the configured one, or from REST | `400 DATASTREAMS_ERROR` "Invalid access control source! Kindly request from the configured one!" |
| Custom Logic channel + `userId` (from any function, or REST) | Token is issued, but the WebSocket rejects it: error `3000` "Authentication failed, please generate valid credentials…" |

**Custom Logic, as it really works:** the function you select in the console is the channel's token endpoint. Your client calls it; it runs whatever check you need (session, SSO, device ID) and then calls `getTokenPair(channelId, { connectionName })` itself. Catalyst does not call the function at token time or at connect time, and nothing reads an `{ approved: true }` response. Find users' IDs for User Roles channels in Console → Authentication, or with the Catalyst MCP tool that lists project users.

## Token pair

Response of `getTokenPair` (SDK) or `POST …/tokenpair` (REST). Keys are **hyphenated**:

```json
{
  "wss-id": "sub_<appUserId>_<orgId>_<projectId>_<channelId>",
  "channel-id": "<channelId>",
  "key": "<352-character key>",
  "url": "<data-center streaming host, e.g. us4-dms.zoho.com>",
  "deployment": "<data-center deployment, e.g. us4>"
}
```

- Pass `wss-id` as `zuid` when creating the WebSocket client, with `url` and `key`. `token.wss_id` and `token.channel_id` are `undefined`.
- `url` is a bare host name for the user's data center. Use the value the token returns; do not hardcode a host.
- For Custom Logic tokens, `wss-id` starts with the connection name (`<connectionName>_subua_…`).
- Each token is scoped to one channel.

## Subscribe types

Pass to `subscribe(type)` after the WebSocket `open` event.

| Type | Behaviour (verified) |
|---|---|
| `'0'` | Live only: messages published after subscribing |
| `'-1'` | Earliest: replays every message still within the 48-hour retention, then live |
| `'-2'` | Resume the previous session. Clean only when the session missed nothing; see the warning below |
| `'<streamingId>'` | Resume from a specific message. Same warning as `'-2'` |

> **Don't rely on resume after a drop (verified live).** When a session that missed messages resubscribes with `'-2'` or a `streamingId`, the server delivers each missed message **twice** and also **replays the channel's whole 48-hour retention**, interleaved. With nothing missed, resume is clean. Reconnect the way that works instead: see [Reconnecting](#reconnecting).

## Acknowledgement

Delivery is sequential. After handling a message the subscriber must call `sendAck()`. Without it, the server holds every later message: with three messages published and no ack, only the first arrives.

- Handle the message, persist anything you need, **then** `sendAck()`. A crash before the ack leaves the message unacknowledged instead of lost.
- Each subscriber receives the next message about one network round trip after its ack (about 300 ms from India to a US data center). A burst of 20 messages takes a few seconds to drain per subscriber, so publish state snapshots (for example, totals once a second) rather than one message per tiny change.

## Reconnecting

What works in live tests, for both access-control types:

1. **Keep your data in your own store** (Data Store, your API). Treat the channel as "something changed", not as the record.
2. **Save the current token** while connected (for example, in local storage or the Keychain).
3. **Before reconnecting, release the old session:** open a socket with the *old* token, call `unsubscribe()` on `open` without subscribing, wait about a second, then close it. The release socket may still be sent a message that was published while you were disconnected: **ignore it and don't ack it** (step 4 reloads state anyway). The new session then starts clean, with no duplicates or retention replay.
4. **Connect with a fresh token and `subscribe('0')`.** Buffer live messages, load the current state from your store, then apply the buffer.
5. **Make updates idempotent:** carry a version or timestamp in each message and ignore anything older than what you hold.
6. **Unsubscribe before every deliberate close** (page unload, sign-out, idle). Sessions closed without `unsubscribe()` stay on the channel, and in tests many of them slowed `publishData` from ~50 ms to 130–380 ms, with spikes of several seconds.

Why step 3 matters: on a **User Roles** channel, one user has one live session per channel. After a drop without `unsubscribe()`, a fresh token for the same user connected and then kept closing every 2–4 s with no live messages, until the old session was released. On **Custom Logic** channels a `connectionName` also has one live session; after a clean `close()`, a second token for the same name fails with `DUPLICATE_VALUE`, so use a new name per connection (for example `kds-grill-4f2a`) or release the old one first. Connection names are at most **20 characters**, and `.` or `:` are rejected (with the misleading error "Either userId or connectionName must be provided").

## Messages

- Fields: `data` and `streamingId`; API-operation (bulk) messages also carry `url` and `method`. There is no `operation` field.
- `data` is **always a string**. The SDKs' `publishData(channelId, data)` requires a string, so `JSON.stringify` objects and `JSON.parse` on receipt. The REST API also accepts a JSON object as `data`; subscribers receive it as a JSON string.
- Messages arrive in publish order, typically within about 60 ms, and can reach a subscriber before the publisher's call returns.
- The Java message class also has `getUrl()` / `getMethod()` for bulk messages. Check `data` first; only use `url` when `data` is null.

## Retention and live count

- Messages are kept for **48 hours** per channel, then dropped.
- `getLiveCount(channelId)` returns the number of connected subscribers. The REST path accepts the channel name or ID.
- The count lags: it can still include a subscriber for a few seconds after it unsubscribes and closes. Allow for that before asserting 0 in a test.

## REST API

Base: `https://api.catalyst.zoho.com/baas/v1/project/{project_id}/datastreams` (use the user's data-center API domain).
Headers: `Authorization: Zoho-oauthtoken <token>`; `CATALYST-ORG: <org_id>` and `Environment: Development|Production` are optional.

| Operation | Method and path | Body | Scope |
|---|---|---|---|
| List channels | `GET /channel` | | `ZohoCatalyst.datastreams.channel.READ` |
| Channel details | `GET /channel/{channel_id}` | | `ZohoCatalyst.datastreams.channel.READ` |
| Live count | `GET /channel/{channel_name_or_id}/liveclient` | | `ZohoCatalyst.datastreams.connections.READ` |
| Token pair | `POST /channel/{channel_id}/tokenpair` | `{"app_user_id": <id>}` | `ZohoCatalyst.datastreams.connections.token.CREATE` |
| Publish | `POST /channel/{channel_id}/stream` | `{"data": <string or object>}` | `ZohoCatalyst.datastreams.channel.stream.CREATE` |

Responses are wrapped: `{"status": "success", "data": …}`. Publish returns `"data": true`. Live count returns `"data": {"connections": <n>}`. A REST token request can't use `connection_name` on a Custom Logic channel, because the request isn't coming from the configured function.

Channel object (from list and details): `id`, `name`, `control_type` (0 User Roles, 1 Custom Logic), `control_ids` (role IDs, or the function ID), `retention` (48), `project_id`, `created_by`, `modified_by`, timestamps.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Mandatory parameter app_user_id is missing.` | `connectionName` used on a User Roles channel | Use an app user's `userId`, or create a Custom Logic channel for anonymous or device clients |
| `Invalid input value for app_user_id` | The ID is a console admin or not an app user of this project | Use an app user's ID from Console → Authentication (invited users work before they confirm) |
| `Invalid access control source! Kindly request from the configured one!` | Token for a Custom Logic channel requested outside its configured function, or via REST | Generate the token inside the function selected as the channel's access control |
| WebSocket error `3000` "Authentication failed…" | User-ID token on a Custom Logic channel, or an expired or wrong token | On Custom Logic channels use `connectionName` from the configured function; otherwise request a fresh token |
| `No Channel exist with the given identifer!` | Wrong channel ID, or the channel is in another project or environment | List channels and use the `id` field |
| `Invalid input value for Env Name` | `Environment: Production` sent for a project without a Production environment | Omit the header, or deploy the project to Production first |
| Subscriber gets the first message only | `sendAck()` not called | Call `sendAck()` after processing each message |
| `zuid` undefined / connection never opens | Read `token.wss_id` | Use `token['wss-id']` |
| Duplicates and old messages after reconnecting | Resubscribed a session that missed messages with `'-2'` or a `streamingId` | Release the old session, reconnect with a fresh token and `'0'`, reload state from your store ([Reconnecting](#reconnecting)) |
| Fresh token connects, then closes every few seconds with no messages | Old session for the same user or connection name still open | Release it first: open the old token and `unsubscribe()` |

## WebSocket error codes

| Code | Meaning | What to do |
|---|---|---|
| `3000` | Authentication failed | Generate a new token pair |
| `1000` | Session closing. Fired right after **your own `unsubscribe()`** ("Current session will be closed. New connection to be established."), in every SDK; otherwise the session expired | After your own `unsubscribe()`: expected, don't reconnect. Otherwise: reconnect with a new token pair |
| `1013` | Connection blocked | Contact support |
| `1011` | Server down | Retry after a minute |
| `1014` | Missing key parameter | Pass `token.key` when creating the client |
| `1006` | Failed to create the WebSocket connection | Retry; check the host and network |
| `1007` | Invalid host received in a switch-URL message | Reconnect with a fresh token pair |
