# ConvoKraft Bot Logic

Implement the bot backend using the selected platform's actual handler contract.

## Choose the backend deliberately

| Platform | Implementation boundary |
|----------|-------------------------|
| Catalyst Integration Functions | Java, Node.js, or Python; use generated ConvoKraft handlers; response limit 3 MB and request timeout 15 seconds |
| Webhooks | Publicly reachable external backend; response limit 100 KB and request timeout 5 seconds |
| Deluge | Use its execution/context/button function templates in the console |

Sources: [Integration Functions](https://docs.catalyst.zoho.com/en/convokraft/help/actions/bot-logic/catalyst-integration-functions/), [webhooks](https://docs.catalyst.zoho.com/en/convokraft/help/actions/bot-logic/webhooks/), [Deluge](https://docs.catalyst.zoho.com/en/convokraft/help/actions/overview/models/).

Integration Functions are unavailable in EU, AU, IN, JP, SA, and CA DCs. Check this before scaffolding, and confirm which bot platforms the project's console offers. The Integration Function restriction alone does not prove the entire ConvoKraft service is unavailable. [Function availability](https://docs.catalyst.zoho.com/en/serverless/help/functions/integration-functions/).

## Start from the CLI templates

For an initialized and linked Catalyst project, CLI 1.27.0+ accepts the following alternatives. Use the one matching the user's runtime; retain generated dependencies, configuration, entry point, and response wrapper.

```bash
catalyst functions:add --name temperature_bot_node --type integ --integ-service Convokraft --stack node22 -ni
```

```bash
catalyst functions:add --name temperature_bot_python --type integ --integ-service Convokraft --stack python_3_12 -ni
```

See the shared [CLI guide](../../catalyst-basics/references/cli.md) for project binding and supported runtime selection. Check current runtime availability before creating a new function.

The following replacements match the ConvoKraft templates in [zcatalyst-cli 1.27.0](https://www.npmjs.com/package/zcatalyst-cli/v/1.27.0), under `templates/init/functions/{node,python}/integ/convokraft/`. They implement the `convertTemperature` action from [the basics reference](convokraft-basics.md). Configure `celsius` as a required numeric param before invoking it.

Node.js `execute.js` (the generated project uses ES modules):

```javascript
export default function handleExecute(request) {
  const raw = request.params?.celsius;
  if ((typeof raw !== 'number' && typeof raw !== 'string') ||
      (typeof raw === 'string' && raw.trim() === '')) {
    return { message: 'Please provide a numeric Celsius temperature.' };
  }
  const celsius = Number(raw);
  const fahrenheit = celsius * 9 / 5 + 32;
  if (!Number.isFinite(celsius) || !Number.isFinite(fahrenheit)) {
    return { message: 'Please provide a finite Celsius temperature.' };
  }
  return { message: `${celsius} Celsius is ${fahrenheit} Fahrenheit.` };
}
```

Python `execute_handler.py`:

```python
import math


def handle_execute_request(req_body):
    raw = req_body.get('params', {}).get('celsius')
    if isinstance(raw, bool) or not isinstance(raw, (int, float, str)):
        return {'message': 'Please provide a numeric Celsius temperature.'}
    try:
        celsius = float(raw)
        fahrenheit = celsius * 9 / 5 + 32
    except (ValueError, OverflowError):
        return {'message': 'Please provide a numeric Celsius temperature.'}
    if not math.isfinite(celsius) or not math.isfinite(fahrenheit):
        return {'message': 'Please provide a finite Celsius temperature.'}
    return {'message': f'{celsius:g} Celsius is {fahrenheit:g} Fahrenheit.'}
```

Local execute-handler fixture:

```json
{
  "todo": "execute",
  "action": "convertTemperature",
  "params": { "celsius": 20 }
}
```

Expect a message reporting 68 Fahrenheit; also test a missing value and a nonnumeric value. These pure handler tests do not replace a trained-bot conversation test.

**Keep the transport contract:** the Node.js entry point dispatches on `request.todo` and sends `response.end(new IntegResponse(jsonResponse))`. Python extracts `request.get_request_body()`, dispatches, sets status/content type, and sends serialized JSON. Do not replace these with an Express handler. Keep welcome, prompt, fallback, and failure dispatch intact. The examples are synchronous; if a Node.js handler starts returning a Promise, add `await` at its dispatcher call before constructing `IntegResponse`, so both its result and rejection are handled.

## Webhook responses and limits

Webhook requests identify the operation with `todo` and carry action params in `params`. They include the conversation environment; use it to select the correct backend configuration. A completed webhook response can be:

```json
{
  "status": "execution",
  "message": "20 Celsius is 68 Fahrenheit.",
  "card": [],
  "data": {},
  "broadcast": {},
  "trigger": {},
  "followup": {}
}
```

For more input, use the documented `status: "prompt"` shape with `prompt.param_name`. Keep within the webhook's own response/time limits. For longer operations, return an honest acknowledgement and design a separate status action; do not claim that work finished.

When secured webhooks are enabled, validate `X-CONVOKRAFT-SIGNATURE` using the bot's published public key and the documented DSA scheme. Do not substitute an invented HMAC secret/header. Confirm the precise verification format before implementing signature code. [Webhook contract](https://docs.catalyst.zoho.com/en/convokraft/help/actions/bot-logic/webhooks/).

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Integration service missing | Wrong DC, function type, or service selection | Check availability; use `integ` and `Convokraft` where supported |
| Handler produces `{}` after SDK call | Promise serialized before resolution | Await the async handler in the generated Node.js dispatcher |
| Function returns but bot fails | Response bypassed the generated wrapper or exceeded limits | Preserve the template response transport and inspect response size/time |
| Webhook returns after 8 seconds and bot reports failure | Webhook has a 5-second timeout | Shorten synchronous work or return an acknowledgement/status workflow |
| Signature verification fails | Wrong key, environment, or algorithm assumptions | Check the published bot key and documented signature contract |
