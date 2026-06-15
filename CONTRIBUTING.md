# Contributing to Catalyst Agent Skills

Thanks for your interest in improving Catalyst agent skills! This guide covers how to contribute.

## How to contribute

### Reporting issues

If the skill produces incorrect code, recommends deprecated services, or misses a Catalyst feature:

1. Open an [Issue](../../issues)
2. Include the prompt you used and the response you got
3. Describe what was wrong and what the correct answer should be

### Improving the skill

1. Fork the repository
2. Edit the relevant `SKILL.md` or reference files in `skills/{service}/references/`
3. Test the updated skill by importing it into your AI tool
4. Open a Pull Request with a clear description of what changed and why

### What makes a good contribution

- **Accuracy fixes**: Correcting wrong SDK patterns, handler signatures, or API details
- **New service coverage**: Adding documentation for newly launched Catalyst services
- **Better examples**: Adding real-world code patterns that work out of the box
- **Deprecation updates**: Updating deprecated service warnings as EOL dates pass
- **MCP tool coverage**: Adding new Zoho MCP tool patterns as they become available

### Skill folder structure

```
skills/
├── SKILL.md                              ← Root router — routes queries to service skills
├── references/
│   └── skill-feedback.md                 ← Loaded when a skill gives wrong guidance
├── catalyst-basics/
│   ├── SKILL.md
│   └── references/
│       ├── project-basics.md             ← Directory structure, catalyst.json, IDs, environments
│       ├── cli.md                        ← Full CLI command reference
│       ├── architecture.md              ← Service selection guide, DC availability table
│       └── setup/
│           ├── claude-code.md            ← MCP setup for Claude Code
│           ├── cursor.md                 ← MCP setup for Cursor
│           └── github-copilot.md         ← MCP setup for GitHub Copilot
├── catalyst-functions/
│   ├── SKILL.md
│   └── references/
│       ├── functions-basics.md           ← All 7 function types, handler signatures, config
│       ├── functions-advanced.md         ← File uploads, streaming, chaining
│       └── api-gateway.md                ← API Gateway routing, rate limiting
├── catalyst-appsail/
│   ├── SKILL.md
│   └── references/
│       └── appsail-basics.md
├── catalyst-datastore/
│   ├── SKILL.md
│   └── references/
│       └── datastore-basics.md           ← CRUD, ZCQL, permissions, pagination
├── catalyst-authentication/
│   ├── SKILL.md
│   └── references/
│       ├── auth-basics.md                ← Login/signup, ZAID, Security Rules
│       └── connections.md                ← OAuth/Connections for external APIs
├── catalyst-stratus/
│   ├── SKILL.md
│   └── references/
│       └── stratus-basics.md
├── catalyst-nosql/
│   ├── SKILL.md
│   └── references/
│       └── nosql-basics.md
├── catalyst-cache/
│   ├── SKILL.md
│   └── references/
│       └── cache-basics.md
├── catalyst-slate/
│   ├── SKILL.md
│   └── references/
│       └── slate-basics.md
├── catalyst-pricing/
│   ├── SKILL.md
│   └── references/
│       └── pricing-basics.md
├── catalyst-sdk/
│   ├── SKILL.md
│   └── references/
│       ├── sdk-nodejs.md
│       ├── sdk-web.md
│       ├── sdk-python.md
│       ├── sdk-java.md
│       └── sdk-mobile.md
├── catalyst-zia/
│   ├── SKILL.md
│   └── references/
│       ├── zia-services.md
│       └── quickml.md
└── catalyst-zoho-mcp/
    ├── SKILL.md
    └── references/
        └── zoho-mcp.md                   ← MCP setup (all 3 clients), tool catalog, errors
```

### Guidelines

- Keep the `SKILL.md` description field under 1024 characters
- Test your changes by importing the skill and running prompts against it
- Don't remove existing reference files without discussion — add new ones instead
- Keep code examples deployment-ready (correct handler signatures, proper config files)

## Code of conduct

Be respectful, constructive, and helpful. We're all here to make Catalyst development better.

## Plugin manifests — keep in sync

When updating the skill description, update ALL four manifest files to keep them identical:
- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`
- `.cursor-plugin/plugin.json`
- `gemini-extension.json`
