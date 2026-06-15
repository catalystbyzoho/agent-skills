# Catalyst Agent Skills

A collection of AI agent skills for [Catalyst by Zoho](https://catalyst.zoho.com) — the full-stack serverless cloud platform.

These skills give AI coding agents (Claude, etc.) deep knowledge of Catalyst's platform, services, SDK patterns, and best practices — enabling them to write deployment-ready Catalyst code, recommend the right architecture, and even manage infrastructure directly via Zoho MCP tools.

## What's included

| Skill | Description |
|-------|-------------|
| `catalyst-by-zoho` | Complete Catalyst development assistant — covers all services, SDKs, CLI, architecture patterns, pricing, migration guides, and Zoho MCP tool-based resource management |

> **Note:** For edge-case lookups not covered by the Tier 1 or Tier 2 reference files, the skill instructs agents to search the official Catalyst docs site (`docs.catalyst.zoho.com`) and fetch individual pages — rather than bundling the full documentation dump locally. This keeps the repo lean while ensuring accurate, up-to-date answers.

### Dedicated skills (full guidance + code examples)

| Service | Skill |
|---------|-------|
| Functions (7 types, API Gateway, Security Rules) | `catalyst-functions` |
| AppSail (PaaS, Docker, managed runtimes) | `catalyst-appsail` |
| Slate (frontend hosting, Git deploy, SSR) | `catalyst-slate` |
| Data Store + ZCQL | `catalyst-datastore` |
| Stratus (object storage, signed URLs) | `catalyst-stratus` |
| NoSQL (document storage) | `catalyst-nosql` |
| Authentication + Connections (OAuth) | `catalyst-authentication` |
| Cache (in-memory key-value, TTL) | `catalyst-cache` |
| Pricing (free tier, cost estimation) | `catalyst-pricing` |
| SDKs (Node.js, Web, Python, Java, Android, iOS, Flutter) | `catalyst-sdk` |
| Zia Services + QuickML (OCR, AutoML) | `catalyst-zia` |
| Zoho MCP (`CatalystbyZoho_*` tools) | `catalyst-zoho-mcp` |
| Project setup, CLI, environments, architecture | `catalyst-basics` |

### Also covered (via reference files, no dedicated skill)

Signals (event bus), Circuits (workflows), Job Scheduling, Pipelines (CI/CD), ConvoKraft (chatbots), SmartBrowz (headless browser), Logs, APM, Alerts, GitHub integration, VS Code Extension, REST APIs. These topics appear in architecture guides and SDK references — agents will find relevant guidance but won't have a dedicated step-by-step skill.

## Installation

### Option 1: Agent Skills CLI

Install with a single command — works with Cursor, Claude Code, Copilot, Windsurf, and any other Agent Skills-compatible tool:

```bash
npx skills add catalystbyzoho/agent-skills
```

The CLI automatically detects which AI tools you have configured and installs the skills in the right location for each one.

---

### Option 2: Claude Code (Plugin)

> **Prerequisites:** You must have the [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code/overview) installed. Open your **system terminal** (not the Claude Code desktop app or web interface) and start a session with `claude` before running the commands below.

**Steps:**

1. Register this repository as a plugin marketplace source:
   ```
   /plugin marketplace add catalystbyzoho/agent-skills
   ```

2. Install the Catalyst skill plugin:
   ```
   /plugin install catalyst-by-zoho@catalyst-by-zoho
   ```

3. Set up Zoho MCP so Claude can manage Catalyst infrastructure (create tables, cache) directly from the conversation:
   1. Go to [mcp.zoho.com](https://mcp.zoho.com) → create or open an MCP server
   2. Under **Tools → Config Tools**, search for **"Catalyst by Zoho"** and add it
   3. Under **Connections**, set authorization to **"On Demand"**
   4. Copy your MCP server URL (format: `https://<server>-<org>.zohomcp.com/mcp/<token>/message`)
   5. In your project, open `.mcp.json` and replace the `<YOUR_ZOHO_MCP_URL>` placeholder with your URL

   > For full details and verification steps, see the [Zoho MCP setup section](#zoho-mcp-setup-recommended-all-tools) below.


### Option 3: Gemini CLI (Extension)

```bash
gemini extensions install https://github.com/catalystbyzoho/agent-skills
```

### Option 4: Cursor

**Via symlink (recommended):**
```bash
git clone https://github.com/catalystbyzoho/agent-skills.git
ln -s /path/to/catalyst-skills/skills ~/.cursor/rules/catalyst-by-zoho
```

**Or via the plugin manifest:** The `.cursor-plugin/plugin.json` in this repo points Cursor
to the `skills/` directory automatically if Cursor supports plugin manifests in your version.
Alternatively, copy the `.cursor-plugin/` and `skills/` folders into your project root.

### Option 5: GitHub Copilot

1. Clone the repo:
   ```bash
   git clone https://github.com/catalystbyzoho/agent-skills.git
   ```
2. **Append** the contents of `skills/SKILL.md` to your project's `.github/copilot-instructions.md` — do not replace the file if it already has content.

   > **Strip the frontmatter first.** `SKILL.md` starts with a YAML frontmatter block that `copilot-instructions.md` does not support. Remove everything between and including the opening and closing `---` lines before appending:
   > ```
   > ---
   > name: catalyst-by-zoho
   > description: >
   >   ...
   > ---
   > ```
   > Everything after the second `---` is the skill content — that's what you append.

   Quick one-liner to append with frontmatter stripped:
   ```bash
   awk '/^---/{f++; next} f>=2' skills/SKILL.md >> .github/copilot-instructions.md
   ```

3. Copy the `skills/` folder into `.github/` for the agent to load reference files on demand

### Option 6: Windsurf

1. Clone the repo:
   ```bash
   git clone https://github.com/catalystbyzoho/agent-skills.git
   ```
2. Copy `skills/` into your project's `.windsurfrules/` directory

### Option 7: Any other AI tool (Manual)

1. Clone the repo:
   ```bash
   git clone https://github.com/catalystbyzoho/agent-skills.git
   ```
2. Point your AI tool to the `skills/` directory, or copy its contents to wherever your tool reads skill/instruction files

### Zoho MCP setup (recommended, all tools)

To let the AI manage Catalyst infrastructure (create tables, query data, manage cache/buckets) directly:

1. Create a Zoho MCP server at [mcp.zoho.com](https://mcp.zoho.com)
2. Add **"Catalyst by Zoho"** tools to the server
3. Enable **"On Demand"** authorization (not "Authorization via Connection")
4. Copy your MCP server URL — go to the **Connect tab** → **Server URL** field (format: `https://<server>-<org>.zohomcp.com/mcp/<token>/message`)
5. Add it to your tool's MCP config, or update the `<YOUR_ZOHO_MCP_URL>` placeholder in `.mcp.json`

> **Note:** `.mcp.json` ships with a placeholder URL. See the `_setup` field inside for instructions.

See `skills/catalyst-zoho-mcp/references/zoho-mcp.md` for detailed setup and verification steps.

## What the skill enables

- **Architecture recommendations** — get Catalyst-specific service picks for your use case
- **Production-ready code generation** — correct handler signatures, SDK patterns, `catalyst-config.json`, and project structure that works with `catalyst deploy`
- **Platform migration guidance** — maps AWS, GCP, Azure, Vercel, Firebase, Supabase, and Heroku services to Catalyst equivalents
- **Infrastructure management via Zoho MCP** — create tables, insert data, run ZCQL queries, manage cache/buckets directly from the AI conversation
- **Pricing estimation** — detailed cost breakdowns with unit prices and free tier offsets

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## About CATALYST.md

`CATALYST.md` at the repo root is a **lightweight MCP routing stub** — it contains only
the minimal context needed for MCP-enabled tools (e.g. Claude Code with Zoho MCP connected)
to discover and invoke `CatalystbyZoho_*` tools correctly.

**It is not a replacement for the full skill.** If you are building a Catalyst application,
always use `skills/SKILL.md` (and its `references/` folder), which includes
the complete service catalog, SDK patterns, handler signatures, architecture guidance, and
all reference docs. `CATALYST.md` alone is insufficient for app development.

## License

This project is licensed under the Apache 2.0 License — see the [LICENSE](LICENSE) file for details.

## Resources

- [Catalyst Documentation](https://docs.catalyst.zoho.com/en/)
- [Catalyst Pricing](https://catalyst.zoho.com/pricing.html)
- [Catalyst GitHub](https://github.com/catalystbyzoho)
- [Zoho MCP](https://mcp.zoho.com/)
