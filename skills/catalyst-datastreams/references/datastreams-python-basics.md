# Data Streams with Python

Server code runs in a Catalyst Python function; subscribers run in any Python 3.10+ process. Package: `zcatalyst-sdk` **1.5.0 or later** (module `zcatalyst_sdk.datastreams`: `Datastreams`, `DataStreamsWebSocket`, `DataStreamsConfig`). Everything below was verified against live calls with 1.5.0.

## Install

```bash
pip install "zcatalyst-sdk>=1.5.0"
```

- Requires **Python 3.10+**. It pulls in `requests` and `websocket-client` (used by the subscriber).
- Function stacks: `python_3_10` to `python_3_13`. The CLI needs a local interpreter matching the stack, or `catalyst deploy` fails with "unable to locate python3.11 in your system"; set it with `catalyst config:set python3_11.bin=<path>`, or choose the stack that matches your local Python.
- Verified deploy: dependencies installed into the function folder for the Linux runtime, next to `main.py`:
  `pip install -r requirements.txt -t . --platform manylinux2014_x86_64 --only-binary=:all: --python-version 3.13 --implementation cp`
  (use the `--python-version` of your stack; `charset_normalizer` ships compiled Linux wheels).

Function config (`functions/<name>/catalyst-config.json`):

```json
{
  "deployment": {
    "name": "stream_api",
    "stack": "python_3_13",
    "type": "advancedio",
    "env_variables": {}
  },
  "execution": {
    "main": "main.py"
  }
}
```

## Initialize in a function

```python
import zcatalyst_sdk
from flask import Request, jsonify, make_response

def handler(request: Request):
    app = zcatalyst_sdk.initialize(req=request)   # per request
    datastreams = app.datastreams()               # plural; there is no app.datastream()
    ...
```

- The SDK's own docstrings show `app.datastream()`; that method does not exist. Use `app.datastreams()`.
- Flask is provided by the runtime: don't vendor it. The handler receives every sub-path of `https://<project-domain>/server/<name>/`, so route on `request.path`.
- Project `catalyst.json`: `{ "functions": { "targets": ["stream_api"], "source": "functions" } }`, then `catalyst deploy --only functions:stream_api`.
- In an Advanced I/O function, both `initialize(req=request)` and `initialize(req=request, scope='admin')` worked for every call below. `get_token_pair` sends user credentials internally, so in functions without a request user (Job, Cron, Event), initialize with `scope='admin'`.
- `get_all_channels`, `get_channel_details`, `get_live_count` and `publish_data` are **admin** methods: server only.

## Publish

```python
import json

ok = datastreams.publish_data(channel_id, json.dumps({"orderId": 12345, "status": "shipped"}))
# ok is True
```

`data` must be a non-empty **string**: passing a dict fails validation with `Invalid-Argument` "Value provided for data is expected to be a non-empty string." `json.dumps` objects and `json.loads` on receipt.

## Token endpoint (User Roles channel)

Authenticate the caller first, then issue a token for their app user ID.

```python
def handler(request: Request):
    app = zcatalyst_sdk.initialize(req=request)
    body = request.get_json(silent=True) or {}
    token = app.datastreams().get_token_pair(str(body["channelId"]), user_id=body["userId"])
    return make_response(jsonify({"token": token}), 200)
```

- Signature: `get_token_pair(channel_id: str, user_id=None, connection_name=None)`. Pass `user_id` or `connection_name` as a **keyword**. If both are given, `user_id` wins.
- `channel_id` must be a **string** here: an `int` fails with `Invalid-Argument` "Value provided for channel_id is expected to be a non-empty string." (The other methods accept a string or a number.)
- The result is a plain dict with **hyphenated** keys: `wss-id`, `channel-id`, `key`, `url`, `deployment`. The SDK's type hints say `wss_id` / `channel_id`; those keys don't exist. Use `token["wss-id"]`.
- On a User Roles channel, `connection_name` fails with `MISSING_PARAM` "Mandatory parameter app_user_id is missing."

## Custom Logic channel

The token must be generated inside the function selected as the channel's access control, with `connection_name`:

```python
token = app.datastreams().get_token_pair(channel_id, connection_name="device-4f2a")
```

From any other function, Python included, the call fails with `DATASTREAMS_ERROR` "Invalid access control source! Kindly request from the configured one!" (verified). The rules in `datastreams-basics.md` apply unchanged: run your own check before issuing the token, and keep connection names at most 20 characters.

## Read channels and live count

```python
channels = datastreams.get_all_channels()            # list of channel dicts
channel = datastreams.get_channel_details(channel_id)
live = datastreams.get_live_count(channel_id)        # {'connections': 1}
```

## Subscriber

```python
import json, threading
from zcatalyst_sdk.datastreams import DataStreamsWebSocket

# token = what your token endpoint returned
ws = DataStreamsWebSocket(url=token["url"], zuid=token["wss-id"], key=token["key"])

def on_open(event):                 # event.code == 200
    ws.subscribe("0")               # subscribe only after open

def on_message(event):
    payload = json.loads(event.data)          # data is always a string
    print(event.streaming_id, payload)
    ws.send_ack()                             # required for the next message

ws.set_on_open(on_open)
ws.set_on_message(on_message)
ws.set_on_error(lambda e: print("error", e.code, e.message))
ws.set_on_close(lambda e: print("closed", e))

ws.connect()                        # nothing happens until connect()
threading.Event().wait()            # keep the process alive; the socket runs on a daemon thread

# Leaving: ws.unsubscribe(), then ws.close()
```

- Unlike the JavaScript client, creating the object does not connect: call **`connect()`**. It runs the socket on a **daemon thread**, so the main thread must stay alive or the process exits.
- Events are set with `set_on_open`, `set_on_message`, `set_on_error`, `set_on_close`, `set_on_pong`. Message events have `data`, `streaming_id` (snake case), and `url` / `method` (set only on API-operation messages).
- For logging or custom timers, pass a config instead: `DataStreamsWebSocket(config=DataStreamsConfig(url=..., zuid=..., key=..., enable_logging=True))`.
- Other methods: `is_connected()`, `get_connection_state()` (a `ConnectionState` enum: `connected`, `connecting`, `closing`, `closed`, `disconnected`), `get_session_info()` (`{'sid', 'uid'}`), `unsubscribe()`, `close()`. `subscribe()` and `unsubscribe()` raise `ConnectionError` when the socket isn't open.
- `url` is checked against a built-in list of Data Streams hosts. The `url` from the token pair passes; don't hardcode or rewrite it.
- Verified: messages arrived in publish order, `get_live_count` showed 1 while connected, and without `send_ack()` only the first message arrived.
- `unsubscribe()` is followed by error `1000` "Current session will be closed. New connection to be established." and a lost-connection `1006`: that is the session ending, not a failure.
- A connection that drops without `unsubscribe()` (or `close()` without it) leaves the session open; release it as described in "Reconnecting" in `datastreams-basics.md`.
- Like the JavaScript client, it closes and reconnects every 27 minutes, resubscribing with `'-2'` once an ack has been sent. Follow "Reconnecting" in `datastreams-basics.md` and keep message handling idempotent.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `AttributeError: 'CatalystApp' object has no attribute 'datastream'` | Followed the SDK docstring | `app.datastreams()` |
| `KeyError: 'wss_id'` | Followed the type hints | `token["wss-id"]` |
| `Invalid-Argument` "…channel_id is expected to be a non-empty string" | `get_token_pair` with an `int` channel ID | Pass `str(channel_id)` |
| `Invalid-Argument` "…data is expected to be a non-empty string" | `publish_data` with a dict or empty string | `json.dumps(...)` |
| `MISSING_PARAM` "Mandatory parameter app_user_id is missing." | `connection_name` on a User Roles channel | Use `user_id=` with an app user's ID |
| `DATASTREAMS_ERROR` "Invalid access control source!…" | Custom Logic token requested outside the configured function | Generate it inside the configured function |
| `unable to locate python3.11 in your system` on deploy | No local interpreter for the stack | `catalyst config:set python3_11.bin=<path>`, or match the stack to your Python |
| Subscriber never receives anything, no error | `connect()` not called, or the script exited | Call `connect()` and keep the main thread alive |
| Only the first message arrives | No `send_ack()` | Call `send_ack()` in the message handler |
