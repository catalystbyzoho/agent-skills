# Data Streams with Java

Data Streams is part of the main Catalyst Java SDK (`com.zc.component.datastream`). Server calls run in a Catalyst Java function; subscribers can run anywhere.

## Dependency

There is no `datastreams` artifact. Add the Java SDK from Zoho's Maven repository:

```xml
<repositories>
    <repository>
        <id>java-sdk</id>
        <url>https://maven.zohodl.com</url>
    </repository>
</repositories>

<dependencies>
    <dependency>
        <groupId>com.zoho.catalyst</groupId>
        <artifactId>java-sdk</artifactId>
        <version>2.5.0</version>
    </dependency>
</dependencies>
```

Version 2.5.0 is the first with Data Streams. It brings `function-sdk`, `Java-WebSocket`, `okhttp` and Jackson. For a CLI-deployed function, put the resolved jars in the function's `lib/` folder (`mvn dependency:copy-dependencies -DoutputDirectory=lib`): the CLI compiles the `.java` source against `lib/*` on deploy. Use stack `java17` (also `java8`, `java11`, `java21`). The copied jars include test and servlet jars (`junit`, `hamcrest`, `javax.servlet-api`); deploys work with them in place.

Function config (`functions/stream_api/catalyst-config.json`); `main` is the handler class name:

```json
{
  "deployment": { "name": "stream_api", "stack": "java17", "type": "advancedio", "env_variables": {} },
  "execution": { "main": "StreamApi" }
}
```

Project `catalyst.json`: `{ "functions": { "targets": ["stream_api"], "source": "functions" } }`, then `catalyst deploy --only functions:stream_api`. The function is reached at `https://<project-domain>/server/stream_api/<route>`; route on `req.getPathInfo()`.

## Server calls in a function

Inside a Catalyst function, `ZCDatastream.getInstance()` works with no extra setup.

```java
import com.catalyst.advanced.CatalystAdvancedIOHandler;
import com.zc.component.datastream.ZCDatastream;
import com.zc.component.datastream.beans.ZCChannelDetails;
import com.zc.component.datastream.beans.ZCChannelLiveCountResponse;
import com.zc.component.datastream.beans.ZCTokenResponse;
import org.json.JSONObject;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.List;
import java.util.stream.Collectors;

public class StreamApi implements CatalystAdvancedIOHandler {
    @Override
    public void runner(HttpServletRequest req, HttpServletResponse res) throws Exception {
        ZCDatastream ds = ZCDatastream.getInstance();
        JSONObject body = new JSONObject(req.getReader().lines().collect(Collectors.joining()));
        String channelId = body.getString("channelId");

        // Publish (data is a String)
        Boolean ok = ds.publishData(channelId, new JSONObject().put("status", "shipped").toString());

        // Token pair: Long userId for User Roles channels;
        // String connectionName only inside a Custom Logic channel's configured function
        ZCTokenResponse t = ds.getTokenPair(channelId, Long.valueOf(body.getString("userId")));

        // Reads
        List<ZCChannelDetails> channels = ds.getAllChannels();
        ZCChannelDetails channel = ds.getChannelDetails(channelId);
        ZCChannelLiveCountResponse live = ds.getLiveCount(channelId);

        res.setContentType("application/json");
        res.getWriter().write(new JSONObject()
            .put("published", ok)
            .put("live", live.getLiveConnections())
            .put("token", new JSONObject()
                .put("url", t.getUrl())
                .put("wssId", t.getWssId())
                .put("key", t.getKey())
                .put("channelId", String.valueOf(t.getChannelId())))
            .toString());
    }
}
```

`ZCTokenResponse` has `getUrl()`, `getWssId()`, `getKey()` and `getChannelId()` (a `Long`). There is no deployment getter.

`ZCChannelDetails` has `getId()`, `getName()`, `getControlType()` (0 User Roles, 1 Custom Logic), `getControlIds()`, `getProjectId()`, `getParentId()`, `getService()`, `getSource()`, `getCreatedBy()` / `getModifiedBy()` (`ZCUserInfo`). Unlike the REST and JavaScript channel object, there is no retention field.

## Subscriber

`subscribe()` and `unsubscribe()` throw the checked `ZCDataStreamException`, so wrap them; `onOpen` cannot throw it.

```java
import com.zc.component.datastream.beans.ZCCustomEvent;
import com.zc.component.datastream.beans.ZCDataStreamMessageEvent;
import com.zc.component.datastream.beans.ZCDataStreamsConfig;
import com.zc.component.datastream.websocket.ZCDataStreamsEventListener;
import com.zc.component.datastream.websocket.ZCDataStreamsWebSocket;
import com.zc.exception.ZCDataStreamException;

public class Subscriber {
    public static void main(String[] args) throws Exception {   // ZCDataStreamException from unsubscribe() propagates here
        // url, wssId, key come from your token endpoint
        String url = args[0], wssId = args[1], key = args[2];
        ZCDataStreamsConfig config = new ZCDataStreamsConfig(url, wssId, key, false);   // last argument: loggingEnabled

        // Outside a Catalyst function, construct the client directly
        final ZCDataStreamsWebSocket socket = new ZCDataStreamsWebSocket(config);

        socket.addEventListener(new ZCDataStreamsEventListener() {
            @Override public void onOpen(ZCCustomEvent event) {
                try {
                    socket.subscribe("0");           // "-1" earliest, "-2" resume
                } catch (ZCDataStreamException e) {
                    System.err.println("Subscribe failed: " + e.getMessage());
                }
            }
            @Override public void onMessage(ZCDataStreamMessageEvent event) {
                if (event.getData() != null) {
                    System.out.println(event.getStreamingId() + " " + event.getData());
                } else if (event.getUrl() != null) {
                    System.out.println("Bulk data at " + event.getMethod() + " " + event.getUrl());
                }
                socket.sendAck();                    // required for the next message
            }
            @Override public void onClose(ZCCustomEvent event) { System.out.println("Closed: " + event.getMessage()); }
            @Override public void onError(ZCCustomEvent event) { System.err.println("Error: " + event.getMessage()); }
            @Override public void onPong(ZCCustomEvent event) { }
        });

        Thread.sleep(60_000);
        socket.unsubscribe();   // free the session before closing; fires onError "Current session will be closed…", which is expected
        Thread.sleep(1_000);
        socket.close();
    }
}
```

Inside a Catalyst function you can also use `ZCDatastream.getInstance().createWebSocketClient(config)`. Outside one, `getInstance()` fails because there is no project context. Other client methods: `isConnected()`, `getConnectionState()`, `getSessionInfo()`.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Maven can't resolve `com.zoho.catalyst:datastreams` | The artifact doesn't exist | Use `com.zoho.catalyst:java-sdk:2.5.0` with the `maven.zohodl.com` repository |
| `unreported exception ZCDataStreamException; must be caught or declared to be thrown` | `subscribe()` called in `onOpen` without try/catch | Wrap `subscribe()` / `unsubscribe()` in try/catch |
| `NullPointerException` in `ZCProject.initProject` / "Exception in parsing the JSON" | `ZCDatastream.getInstance()` outside a Catalyst function | `new ZCDataStreamsWebSocket(config)` |
| `ZCServerException` "Mandatory parameter app_user_id is missing." | `getTokenPair(channelId, String)` on a User Roles channel | Use `getTokenPair(channelId, Long userId)` |
| `cannot find symbol ... CatalystAdvancedIOHandler` | `function-sdk` jar missing from `lib/` | Copy all Maven dependencies into `lib/` |
| Only the first message arrives | No `sendAck()` | Call `sendAck()` in `onMessage` |
