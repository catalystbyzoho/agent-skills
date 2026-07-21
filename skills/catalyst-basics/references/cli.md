# CLI Command Reference

Complete reference for the Catalyst CLI (`catalyst` / `zcatalyst`). For official docs see: https://docs.catalyst.zoho.com/en/cli/v1/cli-command-reference/

---

## Table of Contents
1. [Global Options](#global-options)
2. [Authentication & Identity](#authentication--identity)
3. [Token Management](#token-management)
4. [Project Management](#project-management)
5. [Initialization & Setup](#initialization--setup)
6. [Functions](#functions)
7. [Client](#client)
8. [Slate](#slate)
9. [AppSail Setup](#appsail-setup)
10. [Data Store](#data-store)
11. [API Gateway](#api-gateway)
12. [IAC (Infrastructure as Code)](#iac)
13. [Event & Signal Payload Generation](#event--signal-payload-generation)
14. [Configuration](#configuration)
15. [Code Library](#code-library)
16. [Local Development](#local-development)
17. [Deployment](#deployment)
18. [Other Commands](#other-commands)
19. [Safety Rules](#safety-rules)
20. [Troubleshooting](#troubleshooting)
21. [Resource-First Development Order](#resource-first-development-order)

---

## Global Options

These flags can be used with any command:

| Flag | Description |
|------|-------------|
| `-v`, `--version` | Print CLI version |
| `-p`, `--project` | Specify the project ID or name to target |
| `--org` | Specify the organization ID |
| `--token` | Use a Catalyst auth token instead of interactive login |
| `--dc` | Data center region: `us`, `eu`, `in`, `au`, `jp`, `sa`, `ca` |
| `--verbose` | Enable verbose/debug output for troubleshooting |
| `-h`, `--help` | Show help for a command |
| `-ni`, `--non-interactive` | Skip all interactive prompts — requires CLI v1.27.0+. Equivalent env var: `ZCATALYST_NON_INTERACTIVE=1` |

---

## Authentication & Identity

### `catalyst login`
Authenticate with Zoho Catalyst. Opens a browser for OAuth by default.

```bash
catalyst login --dc <dc> -ni    # Non-interactive (--dc is REQUIRED in NI mode)
catalyst login                  # Interactive browser-based login
catalyst login --no-localhost   # Use manual code entry (for remote/headless machines)
catalyst login --force          # Force re-login even if already authenticated
```

> **NI mode:** `--dc` is required. Valid values: `us`, `eu`, `in`, `au`, `ca`, `sa`, `jp`, `uae`. Logging into a different DC correctly switches the active data center.

### `catalyst logout`
Log out of the current session, clearing stored credentials.

```bash
catalyst logout
```

### `catalyst whoami`
Display the currently logged-in user and associated org details.

```bash
catalyst whoami
```

---

## Token Management

### `catalyst token:generate`
Generate a new auth token for CI/CD or automation.

```bash
catalyst token:generate              # Generate a new token
catalyst token:generate --current    # Generate token for the current project context
```

### `catalyst token:list`
List all active tokens.

```bash
catalyst token:list
```

### `catalyst token:revoke`
Revoke an existing token.

```bash
catalyst token:revoke
```

---

## Project Management

### `catalyst project:list`
List all projects accessible in the current org.

```bash
catalyst project:list
```

### `catalyst project:use`
Set the active project context for subsequent commands.

```bash
catalyst project:use
```

### `catalyst project:reset`
Clear the current project context.

```bash
catalyst project:reset
```

---

## Initialization & Setup

### `catalyst init`
Initialize a Catalyst project in the current directory. **Supports non-interactive mode in CLI v1.27.0+** — use `--org`, `-p`, and `-ni` flags.

```bash
# ✅ Non-interactive (CLI v1.27.0+) — preferred for agents and CI/CD
catalyst init --org <orgId> -p <projectId> -ni
catalyst init --org <orgId> -p <projectId> -ni --force        # Re-initialize
```

| Flag | Description |
|------|-------------|
| `--project`, `-p` | Project name or ID to link — **required** in NI mode |
| `--org` | Organization name or ID — conditional; required when more than one org exists |
| `-ni` | Non-interactive mode (CLI v1.27.0+) |
| `--force` | Overwrite existing `.catalystrc` |

> **NI mode limitation:** only linking an existing project is supported. Creating a new project requires the browser flow — create the project in the Catalyst console first, then run `catalyst init -ni` to link it.

### `catalyst functions:setup`
**DISABLED in non-interactive mode.** Use `catalyst functions:add -ni` instead — it creates the directory structure and adds the function in one step.

### `catalyst functions:add`
Add a new function to the project. **Supports non-interactive mode in CLI v1.27.0+** — use `--name`, `--type`, `--stack`, and `-ni` flags. On older CLI versions the command is fully interactive (arrow-key menus).

```bash
# ✅ Non-interactive (CLI v1.27.0+) — preferred for agents and CI/CD
catalyst functions:add --name <name> --type <type> --stack <stack> -ni

# Examples:
catalyst functions:add --name api --type aio --stack node20 -ni
catalyst functions:add --name scheduler --type cron --stack node20 -ni
catalyst functions:add --name processor --type job --stack python_3_12 -ni

# Interactive fallback (any CLI version)
catalyst functions:add    # Arrow-key menus for name, type, stack
```

| Flag | Description |
|------|-------------|
| `--name` | Function name (alphanumeric + underscores) |
| `--type` | Function type: `bio`, `aio`, `event`, `cron`, `job`, `integ`, `browserlogic` |
| `--stack` | Runtime stack (see values below) |
| `--integ-service` | Integration service — **required when `--type integ`**. Valid values: `ZohoCliq`, `Convokraft` |
| `--overwrite` | Overwrite existing function with the same name — **required in NI mode if function already exists** |
| `-ni` | Non-interactive mode (CLI v1.27.0+) |

**`--type` values:**

| Value | Function type |
|-------|--------------|
| `bio` | Basic I/O |
| `aio` | Advanced I/O |
| `event` | Event function |
| `cron` | Cron/scheduled function |
| `job` | Job function |
| `integ` | Integration function (requires `--integ-service`: `ZohoCliq` or `Convokraft`) |
| `browserlogic` | Browser Logic (SmartBrowz) |

**`--stack` values:**
- Node.js: `node24`, `node22`, `node20`, `node18`, `node16`, `node14`, `node12` (prefer `node20` or `node24`)
- Java: `java25`, `java21`, `java17`, `java11`, `java8`
- Python: `python_3_13`, `python_3_12`, `python_3_11`, `python_3_10`

**Legacy fallback (CLI < v1.27.0):** If the user cannot upgrade, ask them to run `functions:add` interactively and provide the name, type, and stack values to enter. Once they complete the interactive run, you can take over for the remaining implementation steps.

### `catalyst client:setup`
Set up the client (frontend) directory in the current project. **Supports non-interactive mode in CLI v1.27.0+** with `--type` and `--name` flags.

```bash
# ✅ Non-interactive (CLI v1.27.0+)
catalyst client:setup --type react --name <name> --flavour js -ni
catalyst client:setup --type react --name <name> --flavour ts -ni
catalyst client:setup --type angular --name <name> --routing --stylesheet scss -ni
catalyst client:setup --type basic --name <name> -ni

# If the client directory already exists, --overwrite is REQUIRED in NI mode
catalyst client:setup --type basic --name <name> --overwrite -ni

# Interactive fallback (any CLI version)
catalyst client:setup
```

| Flag | Description |
|------|-------------|
| `--type` | Client type: `react`, `angular`, `basic` (required for `-ni`) |
| `--name` | Client application name (required for `-ni`) |
| `--flavour` | `js` or `ts` — React only |
| `--routing` | Enable routing — Angular only |
| `--stylesheet` | `css`, `scss`, `sass`, `less` — Angular only |
| `--overwrite` | Overwrite existing client directory — **required in NI mode if client dir already exists** |

### `catalyst appsail:add`
Add an AppSail service. **ALWAYS use flags to avoid interactive prompts.**

`--source` is required and determines the runtime automatically (directory path → managed runtime; Docker image/archive → custom runtime).

```bash
# Catalyst-managed runtime (source is a local directory)
catalyst appsail:add --name <name> --source <dir> --stack <stack>
catalyst appsail:add --name <name> --source <dir> --stack java17 --platform war --overwrite-config

# Custom (Docker) runtime (source is a Docker image or archive)
catalyst appsail:add --name <name> --source <image-or-archive> --port <port>
```

| Flag | NI | Description |
|------|----|-------------|
| `--name` | Required | Service name |
| `--source` | Required | Local source directory (managed) or Docker image/archive (custom) |
| `--stack` | Required — managed runtime only | Runtime stack: `node24`, `node22`, `java25`, `java21`, `python_3_13`, `python_3_12`, `python_3_11`, `python_3_10` |
| `--build` | Optional | Build path relative to source (managed only) |
| `--platform` | Java only | `javase` or `war` |
| `--port` | Custom runtime only | HTTP port |
| `--overwrite-config` | Conditional | Required only to overwrite an existing service config |

---

## Functions

### `catalyst functions:shell`
Open an interactive shell for testing functions locally.

**DISABLED in non-interactive mode.** Use `catalyst functions:execute` to run Event/Cron/Job/Integration functions from automation.

```bash
catalyst functions:shell    # Interactive only — not available with -ni
```

### `catalyst functions:execute`
Execute a function locally. Use this instead of `functions:shell` in non-interactive mode.

```bash
catalyst functions:execute                        # Single function — runs automatically
catalyst functions:execute <function_name>        # Required when more than one function exists
catalyst functions:execute <function_name> --input '{"key":"value"}'   # Inline JSON input
catalyst functions:execute <function_name> --input payload.json        # File input
catalyst functions:execute <function_name> --input - --key myInput     # stdin input
```

| Flag | NI | Description |
|------|----|-------------|
| `[function name]` | Conditional — required when more than one function exists | The function to run; auto-selected with a single function |
| `--input <value>` | Optional | Function input — inline JSON, a file path, or `-` for stdin |
| `--key <input key>` | Conditional — required when the function has multiple named inputs | Selects which input to use |
| `--debug` | Optional | Enable debugging |

### `catalyst functions:config`
View or modify function configuration.

```bash
catalyst functions:config              # View config
catalyst functions:config --memory     # View/set memory allocation
```

### `catalyst functions:delete`
Delete a function.

```bash
catalyst functions:delete <function_name> --local      # Remove only from local project (default in NI mode)
catalyst functions:delete <function_name> --remote     # ⛔ BLOCKED in NI mode — delete locally only
```

> **NI mode:** `<function_name>` positional argument is required in non-interactive mode — omitting it falls back to an interactive selector.

---

## Client

### `catalyst client:setup`
Initialize the client directory for the project.

```bash
catalyst client:setup
```

### `catalyst client:delete`
Delete the client component.

```bash
catalyst client:delete --local     # Remove only from local project (default in NI mode)
catalyst client:delete --remote    # ⛔ BLOCKED in NI mode — delete locally only
```

> **NI mode caveat:** `client:delete --local` may still prompt interactively in some CLI versions despite `-ni`. If it does, manually remove the client entry from `catalyst.json` → `client.targets` array and delete the local client directory instead.

---

## Slate

Slate is Catalyst's frontend framework scaffolding system. **NEVER scaffold manually (no `npm create vite`, etc.).** Always use Slate commands. Additional libraries should be installed AFTER scaffolding.

### `catalyst slate:create`
Create a new Slate frontend project.

```bash
# ✅ Non-interactive
catalyst slate:create --name <name> --framework <framework> -ni
```

| Flag | NI | Description |
|------|----|-------------|
| `--name` | Required | Slate app name |
| `--framework` | Required | Framework to use (see table below) |
| `--template <url>` | Optional | Template URL to initialize from |
| `--default` | Ignored | Not applicable in NI mode — ignored with a warning |

#### Framework Values

| Framework Value | Detection Keywords | Build Output Directory |
|----------------|-------------------|----------------------|
| `static` | Plain HTML/CSS/JS | `.` or `public/` |
| `angular` | Angular, @angular/core | `dist/<project-name>` |
| `astro` | Astro | `dist/` |
| `create-react-app` | CRA, create-react-app | `build/` |
| `nextjs` | Next.js, next | `out/` or `.next/` |
| `preact` | Preact | `dist/` |
| `react-vite` | React + Vite | `dist/` |
| `solidjs` | SolidJS, Solid | `dist/` |
| `svelte` | Svelte, SvelteKit | `dist/` or `build/` |
| `vue` | Vue.js, Vue 3 | `dist/` |
| `other` | Custom/unknown | Varies |

#### `dev_command` per Framework (in `cli-config.json`)

| Framework | Dev Command |
|-----------|------------|
| React + Vite | `npx vite --port $PORT` |
| Next.js | `npx next dev --port $PORT` |
| Angular | `npx ng serve --port $PORT` |
| Astro | `npx astro dev --port $PORT` |
| Vue | `npx vite --port $PORT` |
| SolidJS | `npx vite --port $PORT` |
| Preact | `npx vite --port $PORT` |
| Svelte | `npx vite --port $PORT` |
| Create React App | `npx react-scripts start` (PORT env var) |

### `catalyst slate:link`
Link an existing local directory as a Slate project.

```bash
# ✅ Non-interactive
catalyst slate:link --source <path> -ni
catalyst slate:link --source <path> --name <name> --framework <framework> -ni
```

| Flag | NI | Description |
|------|----|-------------|
| `--source` | Required | Path to existing app directory |
| `--name` | Optional | Slate app name |
| `--framework` | Optional | Frontend framework — auto-detected from app if omitted |
| `--template` | Ignored | Not applicable when linking |
| `--default` | Ignored | Not applicable in NI mode |

### `catalyst slate:unlink`
Unlink a Slate project from the Catalyst project.

```bash
# ✅ Non-interactive
catalyst slate:unlink --name <app-name> -ni
catalyst slate:unlink --name <app-name> --remove-source -ni   # Also delete source directory
```

| Flag | NI | Description |
|------|----|-------------|
| `--name` | Required | App to unlink — unknown/missing name fails with list of available apps |
| `--remove-source` | Optional | Delete the source directory (kept by default) |

---

## AppSail Setup

AppSail is for deploying full application servers (Express, Spring Boot, Flask, etc.).

**ALWAYS use flags to avoid interactive prompts.**

```bash
# Node.js 18
catalyst appsail:add --name my-api --source ./server --stack node18

# Java 17 WAR
catalyst appsail:add --name my-service --source ./server --stack java17

# Python 3.13
catalyst appsail:add --name my-app --source ./app --stack python_3_13

# With all options
catalyst appsail:add --name my-api --source ./server --stack node18 --build ./build --overwrite-config
```

---

## Data Store

### `catalyst ds:import`
Import data into the Data Store from a CSV file.

```bash
catalyst ds:import data.csv --table <TableName>
catalyst ds:import data.csv --table <TableName> --production
```

### `catalyst ds:export`
Export Data Store tables to CSV.

```bash
catalyst ds:export <TableName>
catalyst ds:export <TableName> --production
```

### `catalyst ds:status`
Check the status of a Data Store import/export operation.

```bash
catalyst ds:status import <jobid>
catalyst ds:status export <jobid>
```

---

## API Gateway

### `catalyst apig:enable`
Enable the API Gateway for the current project.

```bash
catalyst apig:enable
```

### `catalyst apig:disable`
Disable the API Gateway.

```bash
catalyst apig:disable
```

### `catalyst apig:status`
Check API Gateway status.

```bash
catalyst apig:status
```

---

## IAC

Infrastructure as Code for managing project resources declaratively.

### `catalyst iac:pack`
Package the current project state into an IAC archive.

```bash
catalyst iac:pack
```

### `catalyst iac:import`
Import an IAC package into the project.

```bash
catalyst iac:import -n    # Import with a specific name
```

### `catalyst iac:export`
Export the project configuration as an IAC package.

```bash
catalyst iac:export                # Export development config
catalyst iac:export --production   # Export production config (CAUTION: targets live environment)
```

### `catalyst iac:status`
Check the status of an IAC operation.

```bash
catalyst iac:status
```

---

## Event & Signal Payload Generation

Generate sample payload files for testing event listeners, integrations, jobs, and signals.

### `catalyst event:generate`
Generate a sample event payload.

```bash
catalyst event:generate
```

### `catalyst event:generate:integ`
Generate a sample integration event payload.

```bash
catalyst event:generate:integ
```

### `catalyst event:generate:job`
Generate a sample job event payload.

```bash
catalyst event:generate:job
```

### `catalyst signals:generate`
Generate a sample signal payload.

```bash
catalyst signals:generate
```

---

## Configuration

Manage CLI configuration key-value pairs.

### `catalyst config:set`
Set a configuration value.

```bash
catalyst config:set <key> <value>
```

### `catalyst config:get`
Get a configuration value.

```bash
catalyst config:get <key>
```

### `catalyst config:delete`
Delete a configuration key.

```bash
catalyst config:delete <key>
```

### `catalyst config:list`
List all configuration values.

```bash
catalyst config:list
```

---

## Code Library

### `catalyst codelib:install`
Install a code library into the project.

```bash
catalyst codelib:install
```

---

## Local Development

### `catalyst serve`
Start the local development server. Serves functions, client, and AppSail locally.

**IMPORTANT: The `catalyst serve` port is dynamic. Never hardcode the port. Never use Vite's dev server directly -- always use `catalyst serve`.**

```bash
catalyst serve                          # Start with defaults
catalyst serve --http                   # Force HTTP (no HTTPS)
catalyst serve --debug                  # Enable debug mode
catalyst serve --proxy                  # Enable proxy mode
catalyst serve --only functions         # Serve only functions
catalyst serve --only client            # Serve only client
catalyst serve --except appsail         # Serve everything except AppSail
catalyst serve --no-watch               # Disable file watching/hot reload
catalyst serve --no-open                # Don't auto-open browser
```

| Flag | Description |
|------|-------------|
| `--http` | Use HTTP instead of HTTPS |
| `--debug` | Enable debug/verbose output |
| `--proxy` | Enable proxy mode for API calls |
| `--only <component>` | Serve only the specified component(s) |
| `--except <component>` | Serve everything except specified component(s) |
| `--no-watch` | Disable file watcher / hot reload |
| `--no-open` | Don't open the browser automatically |

---

## Deployment

### `catalyst deploy`
Deploy the project to Catalyst cloud.

> ⚠️ **`catalyst deploy` silently overwrites environment variables** — only values defined in `catalyst-config.json` survive a deploy. Any env vars set through the Console are wiped on every deploy. Keep all env vars in `catalyst-config.json`, not the Console.

```bash
catalyst deploy                         # Deploy everything
catalyst deploy --only functions        # Deploy only functions
catalyst deploy --only client           # Deploy only client
catalyst deploy --except appsail        # Deploy everything except AppSail
```

#### AppSail Deploy Options

```bash
catalyst deploy appsail
```

#### Slate Deploy Options

```bash
# ✅ Non-interactive — app name is required
catalyst deploy slate <name> -ni
catalyst deploy slate <name> -m "Deployment message" -ni
catalyst deploy slate <name> --production -ni    # Deploy to production (CAUTION)
catalyst deploy slate <name> --no-wait -ni       # Don't wait for completion
```

| Flag | Description |
|------|-------------|
| `--only <component>` | Deploy only the specified component |
| `--except <component>` | Deploy everything except specified component |
| `-m` | Deployment message (for Slate) |
| `--production` | Deploy to production environment (CAUTION) |

---

## Other Commands

### `catalyst pull`
Pull remote project resources to local.

```bash
# ✅ Non-interactive — feature and resource are required
catalyst pull functions --resource <functionName> -ni
catalyst pull functions --resource <fn1>,<fn2> -ni        # Multiple functions
catalyst pull client --resource <version> -ni
catalyst pull client --resource <version> --overwrite -ni  # Overwrite existing local files

# If function already exists locally, --overwrite is REQUIRED in NI mode
catalyst pull functions --resource <functionName> --overwrite -ni
```

| Argument/Flag | NI | Description |
|---------------|----|-------------|
| `[feature]` | Required | Feature to pull: `functions`, `client` — one per run |
| `--resource` | Required | Function name(s) or client version to pull (comma-separated for multiple) |
| `--overwrite` | Required in NI if target exists locally | Skips without overwriting and exits with error in NI mode if omitted and target exists |

### `catalyst run-script`
Run a custom script defined in the project.

```bash
catalyst run-script
```

### `catalyst help`
Display help for any command.

```bash
catalyst help
catalyst help <command>
catalyst <command> --help
```

---

## Safety Rules

### Destructive Commands Reference

| Command | Risk Level | What It Does | Safeguard |
|---------|-----------|--------------|-----------|
| `functions:delete --remote` | HIGH | Deletes deployed function | Confirm project first |
| `client:delete --remote` | HIGH | Deletes deployed client | Confirm project first |
| `deploy --production` | HIGH | Pushes to production | Verify project and changes |
| `deploy slate --production` | HIGH | Pushes Slate to production | Verify project and changes |
| `iac:export --production` | MEDIUM | Exports production config | May expose secrets |
| `iac:import` | MEDIUM | Overwrites project resources | Verify package contents |
| `ds:import` | MEDIUM | Overwrites Data Store data | Verify CSV and table |
| `project:reset` | LOW | Clears project context | Re-run `project:use` |

### Critical Rules

- **`--production` flag warning**: Any command with `--production` targets the live production environment. Always double-check the project context before using this flag.
- **Always confirm project before mutating**: Run `catalyst whoami` and verify the project context before running any destructive or deployment command.

---

## Common Errors

### Common Issues

| Issue | Diagnosis | Solution |
|-------|-----------|---------|
| Login fails | Auth token expired or browser blocked | Run `catalyst login --force` or use `--no-localhost` for headless |
| Wrong project targeted | Stale `.catalystrc` or context | Run `catalyst whoami`, then `catalyst project:use` or `catalyst init` |
| Wrong data center | Mismatched `--dc` flag | Re-login with correct `--dc` (us/eu/in/au/jp/sa/ca) |
| Deploy fails | Missing config, build errors | Check `catalyst.json`, run `catalyst deploy --verbose` |
| `Deploy fails: Invalid input value for name — Cannot have different name than <project-name>` | Client `package.json` `name` field does not match the Catalyst project name | Set `"name"` in `client/<app>/package.json` to exactly match the Catalyst project name (e.g. `"name": "bandwidth-cost"`) |
| `client:delete --local` still prompts despite `-ni` | Known CLI edge case — confirmation prompt not suppressed in some versions | Manually remove the client folder name from `catalyst.json` → `client.targets` array and delete the local directory |
| Env vars missing after deploy | `catalyst deploy` overwrites env vars with `catalyst-config.json` values — Console-set vars are lost | Move all env vars into `catalyst-config.json` before deploying |
| Functions not found | Missing `catalyst-config.json` or wrong directory structure | Verify `functions/<name>/catalyst-config.json` exists |
| Port conflicts | Another process using the port | Stop other servers; `catalyst serve` assigns ports dynamically |
| Token expired | Stale auth token | Run `catalyst token:generate` or `catalyst login --force` |
| IAC status stuck | Long-running import/export | Run `catalyst iac:status` to check progress |
| DS import fails | Malformed CSV or schema mismatch | Verify CSV format matches table schema; run `catalyst ds:status` |

### Debugging

- **Enable verbose output**: Add `--verbose` to any command for detailed logs.
- **Get command help**: Run `catalyst help <command>` or `catalyst <command> --help`.

---

## Resource-First Development Order

Always follow this order when building a Catalyst project:

1. **Login**: `catalyst login`
2. **Init**: `catalyst init --org <orgId> -p <projectId> -ni` (non-interactive; use MCP tools to get org/project IDs)
3. **Create tables**: Set up Data Store tables (via console or IAC)
4. **Configure permissions**: Set table-level and row-level access
5. **Seed data**: Import initial data with `catalyst ds:import`
6. **Set up compute**: Add functions (`catalyst functions:add --name <n> --type aio --stack node20 -ni`), AppSail (`appsail:add --name <n> --source <dir> --stack node20`), or Slate (`slate:create --name <n> --framework react-vite -ni`)
7. **Write code**: Implement business logic using the Catalyst SDK
8. **Serve locally**: `catalyst serve` (port is dynamic, never hardcode)
9. **Deploy**: `catalyst deploy`

---

External documentation: https://docs.catalyst.zoho.com/en/cli/v1/cli-command-reference/
