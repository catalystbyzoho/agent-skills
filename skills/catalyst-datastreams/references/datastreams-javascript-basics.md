# Data Streams with JavaScript (Node.js and browser)

Server code runs in a Catalyst Advanced I/O function; subscribers run in Node or the browser. Package: `@zcatalyst/datastreams` (exports `DataStreams` and `DataStreamsWebSocket`).

## Install

```bash
# In the function folder
npm install @zcatalyst/datastreams @zcatalyst/auth
```

- Do a fresh install (delete `package-lock.json` and `node_modules`) if `@zcatalyst/auth-admin` 1.1.0 throws `Cannot read properties of undefined (reading 'api')`. That happens when a lockfile keeps `@zcatalyst/utils` at 1.0.0; 1.1.0 fixes it.
- The packages declare `engines: node >=22`, but they run on the `node20` function stack (verified); npm only warns.
- Subscribers only need `@zcatalyst/datastreams`. A bundler (Vite, webpack, esbuild) picks its browser build automatically through the package's `browser` export, with no Node `ws` dependency. For example: `npx esbuild client.js --bundle --platform=browser --format=iife --outfile=bundle.js` (about 60 KB).
- A browser page calls your token endpoint like any API. If the page is served from another origin, that origin must be allowed by your backend's CORS setup; serving the page from the same project avoids it.

Function config (`functions/<name>/catalyst-config.json`):

```json
{
  "deployment": {
    "name": "stream_api",
    "stack": "node20",
    "type": "advancedio",
    "env_variables": {}
  },
  "execution": {
    "main": "index.js"
  }
}
```

Project `catalyst.json` (deploy with `catalyst deploy --only functions:stream_api`):

```json
{ "functions": { "targets": ["stream_api"], "source": "functions" } }
```

The function is reached at `https://<project-domain>/server/<name>/<route>`, so route on the end of `req.url`.

## Initialize in a function

```javascript
const { zcAuth } = require('@zcatalyst/auth');
const { DataStreams } = require('@zcatalyst/datastreams');

module.exports = async (req, res) => {
    const app = await zcAuth.init(req);      // per request, before any component
    const datastreams = new DataStreams(app);
    // ...
};
```

In Node.js, `DataStreams` exposes the admin methods (`publishData`, `getAllChannels`, `getChannelDetails`, `getLiveCount`) as well as `getTokenPair`. In the browser it exposes only `getTokenPair`.

## Raw request and response

A plain Advanced I/O function receives Node's `IncomingMessage` and `ServerResponse`. `req.body`, `res.status()` and `res.json()` are all `undefined` (they exist only if you export an Express app). Read and write JSON yourself:

```javascript
const readJson = (req) => new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
        try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); }
    });
});

const sendJson = (res, status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
};
```

## Publish

```javascript
const ok = await datastreams.publishData(channelId, JSON.stringify({ orderId: 12345, status: 'shipped' }));
// ok === true
```

`data` must be a non-empty string: stringify objects.

## Token endpoint (User Roles channel)

Authenticate the caller first, then issue a token for their app user ID.

```javascript
const { zcAuth } = require('@zcatalyst/auth');
const { DataStreams } = require('@zcatalyst/datastreams');

const readJson = (req) => new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
        try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); }
    });
});

const sendJson = (res, status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
};

module.exports = async (req, res) => {
    try {
        const app = await zcAuth.init(req);
        const datastreams = new DataStreams(app);
        const { channelId, userId } = await readJson(req);
        const token = await datastreams.getTokenPair(channelId, { userId: String(userId) });
        sendJson(res, 200, { token });   // { 'wss-id', 'channel-id', key, url, deployment }
    } catch (error) {
        sendJson(res, 500, { error: error.message, code: error.code });
    }
};
```

## Custom Logic function (Custom Logic channel)

Select this function as the channel's access control in the console. Clients call it to get their token; it is the only place a Custom Logic token can be generated.

```javascript
const { zcAuth } = require('@zcatalyst/auth');
const { DataStreams } = require('@zcatalyst/datastreams');

const readJson = (req) => new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
        try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); }
    });
});

const sendJson = (res, status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
};

// Replace with your real check (session cookie, SSO token, device registry...)
const isAllowed = async (req, connectionName) =>
    typeof connectionName === 'string' && connectionName.startsWith('device-');

module.exports = async (req, res) => {
    try {
        const { channelId, connectionName } = await readJson(req);
        if (!(await isAllowed(req, connectionName))) {
            return sendJson(res, 403, { approved: false, reason: 'Unauthorized' });
        }
        const app = await zcAuth.init(req);
        const datastreams = new DataStreams(app);
        const token = await datastreams.getTokenPair(channelId, { connectionName });
        sendJson(res, 200, { approved: true, token });
    } catch (error) {
        sendJson(res, 500, { error: error.message });
    }
};
```

## Read channels and live count

```javascript
const channels = await datastreams.getAllChannels();         // array of channel objects
const channel = await datastreams.getChannelDetails(channelId);
const live = await datastreams.getLiveCount(channelId);      // { status: 'success', data: { connections: 1 } }
```

## Subscriber (Node or browser)

```javascript
const { DataStreamsWebSocket } = require('@zcatalyst/datastreams');   // or: import { DataStreamsWebSocket } from '@zcatalyst/datastreams';

// token = what your token endpoint returned
const socket = new DataStreamsWebSocket({
    url: token.url,
    zuid: token['wss-id'],
    key: token.key
});

socket.on('open', () => socket.subscribe('0'));       // '-1' earliest, '-2' resume
socket.on('message', (event) => {
    const payload = JSON.parse(event.data);            // data is always a string
    console.log(event.streamingId, payload);
    socket.sendAck();                                  // required for the next message
});
socket.on('error', (err) => console.error(err.code, err.message));
socket.on('close', () => console.log('closed'));

// Leaving: socket.unsubscribe() first (frees the session), then socket.close().
// Coming back: release the old session, then a fresh token + subscribe('0')
// (see "Reconnecting" in datastreams-basics.md; don't resume a dropped session with '-2').
```

- Client options: `url` (a host name, not a full URL), `key`, `zuid`, and optional `enableLogging: true`. The connection starts as soon as the object is created.
- Other methods: `isConnected()`, `getConnectionState()` (`'connected'`, `'connecting'`, `'closing'`, `'closed'`, `'disconnected'`), `getSessionInfo()` (`{ sid, uid }`), `unsubscribe()`, `close()`. Events: `open`, `message`, `error`, `close`, `pong`.
- `subscribe()` throws if the socket isn't open yet: call it from the `open` handler.

In Node the client logs one `close` about 1–2 s after connecting and then reconnects on its own. Delivery is unaffected and you do not need to subscribe again: messages keep arriving on the same `message` handler. Don't rely on the `close` event's code: the browser reports 1006, while in Node the event argument may have no `code`. After your own `unsubscribe()`, an `error` event with code `1000` ("Current session will be closed…") is expected. Both builds also close and reconnect every 27 minutes, resubscribing with `'-2'` once an ack has been sent; if that session missed messages, expect the duplicates described in `datastreams-basics.md`, and keep your message handling idempotent. The browser build does not auto-reconnect after a drop: handle `close` yourself.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot read properties of undefined (reading 'api')` from `auth-admin` | `@zcatalyst/auth-admin` 1.1.0 with `@zcatalyst/utils` 1.0.0 from a lockfile | Delete the lockfile and `node_modules`, reinstall |
| `TypeError: Cannot destructure property … of 'req.body'` | Advanced I/O `req` has no parsed body | Read the stream (`readJson` above) |
| `TypeError: res.status is not a function` | Raw `ServerResponse` | `res.writeHead(status, headers); res.end(body)` |
| `zuid` undefined, socket never opens | `token.wss_id` | `token['wss-id']` |
| Only the first message arrives | No `sendAck()` | Call `sendAck()` in every `message` handler |
| `subscribe` has no effect | Called before `open` | Subscribe inside the `open` handler |
| `publishData` validation error | `data` is an object or empty | Pass a non-empty string (`JSON.stringify`) |
