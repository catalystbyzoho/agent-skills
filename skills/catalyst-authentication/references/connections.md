## Overview

Connections manages OAuth2 tokens (and other auth types) for third-party service integrations. It auto-handles token refresh, so you never write refresh logic.

Supports: Zoho services, Google APIs, GitHub, Slack, HubSpot, Salesforce, custom OAuth2 providers.

---

## Using a Connection in a Function

```javascript
const connection = catalystApp.connection();

// Get a connector by name (configured in Console → Connections)
const connector = connection.getConnector('ZohoCRM');

// Get a valid access token (auto-refreshes if expired)
const tokenData = await connector.getAccessToken();
const accessToken = tokenData.access_token;

// Use the token to call the external API
const response = await fetch('https://www.zohoapis.com/crm/v3/Deals', {
  headers: {
    'Authorization': `Zoho-oauthtoken ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
```

---

## Setup in Console

1. Console → Connections → Create Connection
2. Select service type (Zoho, Google, or Custom OAuth2)
3. Provide Client ID / Client Secret
4. Authorize the connection (OAuth consent flow)
5. Set connection name (used as string arg to `getConnector()`)

---

## Custom OAuth2 Providers

For services not in the built-in list:
1. Choose "Custom OAuth2" connection type
2. Provide Authorization URL, Token URL, Scope
3. Complete the OAuth consent flow

---

## Pricing

Connections is a free feature — no additional cost per token fetch.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Connection not found` | Connection ID wrong or not yet authorized by user | Confirm the connection name in the Connections console and verify the user has completed the OAuth grant |
| `Token refresh failed` | OAuth app credentials rotated or revoked by third-party | Re-authenticate the connection from the Connections console |
| `Scope not authorized` | Required OAuth scope was not included during connection setup | Delete and recreate the connection with the correct scopes |
| `Connection is inactive` | Connection was manually disabled or expired | Re-enable or reconnect from Catalyst Console → Connections |
