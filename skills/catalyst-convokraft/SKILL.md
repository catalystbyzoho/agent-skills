---
name: catalyst-convokraft
description: "Catalyst ConvoKraft — create, train, embed, deploy, and debug conversational bots with actions, sample sentences, params, and bot logic. Use for 'chatbot does not understand', 'bot changes missing in production', ConvoKraft Integration Functions, webhook timeouts, welcome/fallback/failure handlers, or convokraft-chat-bot."
metadata:
  version: "2.0.0"
---

## How It Works

1. **Identify the bot and task** — Establish the project, environment, bot/action namespaces, data center, and current development platform. Distinguish an intent/training problem from a backend or embedding problem.
2. **Load the relevant reference** — Use `references/convokraft-basics.md` for actions, training, clients, and release behavior. Use `references/convokraft-advanced.md` when implementing handlers or diagnosing backend responses.
3. **Match the platform contract** — Preserve the selected bot platform. Check Integration Function availability before scaffolding; follow the installed CLI's handler/response templates. Webhooks have different limits and security requirements.
4. **Test the conversation** — Train after action changes; test a paraphrase, missing required param, unknown intent, and backend failure in Development. Verify the actual handler response and intended operation, not only the chat UI.
5. **Publish the intended changes** — When production deployment is requested, check the bot's selected action release as well as its backend and client configuration. Report training, backend deployment, action publication, and client verification separately, with evidence for each completed step.

## Triggers

Use this skill for: "ConvoKraft", "build a Catalyst chatbot", "chatbot does not understand", "bot changes missing in production", "train a bot", "sample sentences", "bot params", "action namespace", "welcome handler", "fallback handler", "failure handler", "webhook timeouts", "ConvoKraft Integration Functions", `Convokraft`, or `convokraft-chat-bot`.

## References

| Reference | Load when the query is about… |
|-----------|-------------------------------|
| `references/convokraft-basics.md` | Actions, params, training, conversation tests, client embedding, and production releases |
| `references/convokraft-advanced.md` | Platform choice, Node.js/Python Integration handlers, asynchronous responses, and webhook contracts |
