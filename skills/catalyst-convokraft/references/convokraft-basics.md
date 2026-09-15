# ConvoKraft Basics

Build a bot whose action configuration, backend, and embedded client agree.

## Configure actions

Create or select the bot in **ConvoKraft → Bots**. Model each user task as an action with its own namespace and sample sentences. An action can answer directly or invoke business logic; use the latter when the answer requires application data or an operation. Preserve an existing choice of Integration Functions, Deluge, or webhooks. [Bot overview](https://docs.catalyst.zoho.com/en/convokraft/help/bots/introduction/), [action models](https://docs.catalyst.zoho.com/en/convokraft/help/actions/overview/models/).

For example, define a `convertTemperature` action with a `celsius` numeric param and sentences such as “Convert 20 Celsius to Fahrenheit” and “What is the Fahrenheit value of 5 Celsius?”. Configure a prompt for a missing temperature. This is an action-design recipe, not an importable bot configuration.

Business-logic actions support at most 20 params. Param names start lowercase, use letters/numbers, and are unique within the action; do not use reserved request fields such as `user`, `org`, or `sessionData`. Match each param's declared type and requiredness to the backend. [Param rules](https://docs.catalyst.zoho.com/en/convokraft/help/actions/define-params/).

Load [bot logic](convokraft-advanced.md) only when implementing the selected backend.

## Train and distinguish failure modes

Train from the bot's details page after creating or changing actions, and wait for the training result before testing. Training failure needs diagnosis and a successful retry before release. [Training](https://docs.catalyst.zoho.com/en/convokraft/help/manage-a-bot/train-a-bot/).

| Test input or event | Evidence to inspect |
|---------------------|---------------------|
| A configured sentence and a new paraphrase | Correct action selected after training |
| Sentence missing a required param | A prompt appears; supplied value reaches the right param |
| Unrelated request | Fallback response, without executing another action accidentally |
| Backend exception or timeout | Failure behavior and backend logs, rather than another intent-training change |
| Fresh chat session | Welcome behavior and correct bot namespace |

Fallback handles an unrecognized user input; Failure handles an exception during the conversation. Enable the intended handlers in the bot settings and implement the corresponding platform handlers. [Fallback](https://docs.catalyst.zoho.com/en/convokraft/help/handlers/fallback-handler/), [Failure](https://docs.catalyst.zoho.com/en/convokraft/help/handlers/failure-handler/).

Do not treat a plausible chat message as proof that an external operation succeeded. Inspect the operation's result, and avoid displaying request bodies or personal conversation data in diagnostic output.

## Embed the correct client

Copy the generated embed configuration from the bot's **Clients** tab for the selected project/environment. Preserve its resource URLs and project/org identifiers. `bot-name` refers to the bot namespace. Include `convokraft-chat-sdk.js` **after** the `convokraft-chat-bot` element; the SDK documentation recommends a fixed-position container. [SDK integration](https://docs.catalyst.zoho.com/en/convokraft/sdk/js/overview/), [bot customization](https://docs.catalyst.zoho.com/en/convokraft/sdk/js/customization-of-a-bot/).

When the widget is blank, check the DOM element, script load order, browser network failures, bot namespace, and environment-specific client configuration before rewriting backend logic. A standalone custom element without the generated SDK setup is not a complete integration.

## Release actions to production

Development action changes do not appear immediately in the production bot. For an authorized production release, use **Deploy to Production** on the bot details page, select the changed actions, choose a release type, and provide release notes. Unselected actions keep their production behavior. The button is active when underlying actions have changes. Deploy required backend changes too, then test the production client. A function CLI deployment alone does not establish that bot actions were published. [Bot deployment](https://docs.catalyst.zoho.com/en/convokraft/help/manage-a-bot/deploy-a-bot/).

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| New wording triggers fallback | Untrained changes, weak sample sentences, or wrong action | Inspect action selection and training result; retest a paraphrase |
| Param remains empty | Namespace/type/prompt differs from handler expectation | Align action param configuration with the request received |
| Bot works in Development but uses old actions in Production | Changed actions were not selected for publication | Inspect the bot release and selected actions |
| Blank embedded bot | Script order, namespace, or generated client setup is wrong | Inspect DOM and network requests against the Clients configuration |
| Backend exception appears as failed conversation | Failure and fallback were conflated | Inspect the failure handler and backend execution |
