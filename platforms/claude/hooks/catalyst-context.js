#!/usr/bin/env node
/*
 * SessionStart hook — Catalyst workspace context bootstrap + prerequisite check.
 *
 * Part 1 — Context. Reads the project's `.catalystrc` (CLI-generated) and injects
 * the org ID, project ID, environment, and domain into the model's context at
 * session start, so the AI begins development already knowing the workspace it is
 * in — no MCP pre-flight (List_All_Organizations / List_All_Projects) or user
 * prompting needed just to establish which org/project is active. It also primes
 * the local-first workflow default (serve + test on Local before deploying to
 * Development; Local is coupled to Development) so the model applies it before any
 * skill loads. A production environment escalates a visible warning banner and
 * instructs the model to confirm before any live/destructive operation.
 *
 * Part 2 — Prerequisite check. Verifies the local toolchain needed for Catalyst
 * development so gaps surface at session start (cheap) instead of mid-task after
 * tokens have been spent scaffolding code that can't build/deploy:
 *   1. Catalyst CLI present and >= 1.27.0 (older versions lack `-ni` mode).
 *   2. Node.js >= 20 (required to run the CLI itself).
 *   3. Runtimes for the stacks declared locally (functions' catalyst-config.json,
 *      AppSail app-config.json) are on PATH; and if a custom (Docker) runtime is
 *      present, the Docker daemon is running and accessible.
 * All external commands are timeout-bounded and wrapped — a check that fails or
 * hangs never blocks or slows a session; issues are reported, not thrown.
 *
 * Exits silently (0) when no `.catalystrc` is present or it cannot be parsed, so
 * it never runs any of this in non-Catalyst directories.
 *
 * `.catalystrc` shape (CLI-generated — never authored by hand):
 *   { defaults:{project,env}, actives:{project,env},
 *     projects:[ { idx, id, name, domain:{id,name}, timezone,
 *                  env:[ { idx, id, name, type } ] } ] }
 *   - projects[].id       -> Project ID
 *   - projects[].env[].id -> Org ID (Catalyst stores the org identifier here)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Prerequisite thresholds — bump here when Catalyst raises its minimums.
const MIN_CLI = [1, 27, 0];    // non-interactive (-ni) mode support
const MIN_NODE_MAJOR = 20;     // required to run the Catalyst CLI

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

function readJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return null;
  }
}

// Run a shell command and return trimmed output, or null if it is not found /
// fails. Tools that print to stderr (java, some pythons) should redirect with
// `2>&1` in the command string. Always timeout-bounded so nothing hangs startup.
function runCmd(cmd, timeoutMs) {
  try {
    const out = execSync(cmd, {
      timeout: timeoutMs,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
      windowsHide: true,
    });
    return (out || '').trim();
  } catch (e) {
    // Some tools exit non-zero yet still print a usable version string.
    const out = e && e.stdout ? e.stdout.toString().trim() : '';
    return out || null;
  }
}

function parseSemver(s) {
  const m = /(\d+)\.(\d+)\.(\d+)/.exec(s || '');
  return m ? [+m[1], +m[2], +m[3]] : null;
}

function gte(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] > b[i]) return true;
    if (a[i] < b[i]) return false;
  }
  return true;
}

// Look for the Catalyst MCP server in the .mcp.json files this hook can see:
// the project's own config, then the plugin's bundled config (via
// CLAUDE_PLUGIN_ROOT — the plugin ships its own .mcp.json, so the server is
// usually provided there, not by the user's project). This detects whether the
// server is *configured* and at which endpoint — it says NOTHING about live
// connectivity or authentication, which only the model's tool list can confirm.
// MCP can also be configured in global/user settings the hook cannot read, so a
// negative result is informational, not authoritative.
function findCatalystMcp(projectRoot) {
  const seen = new Set();
  const candidates = [];
  const add = (dir, label) => {
    if (!dir) return;
    const p = path.join(dir, '.mcp.json');
    if (seen.has(p)) return;
    seen.add(p);
    candidates.push({ p, label });
  };
  add(projectRoot, 'project');
  add(process.cwd(), 'cwd');
  add(process.env.CLAUDE_PLUGIN_ROOT, 'plugin');

  for (const { p, label } of candidates) {
    const cfg = readJsonSafe(p);
    const servers = cfg && cfg.mcpServers;
    if (!servers || typeof servers !== 'object') continue;
    const key = Object.keys(servers).find((k) => /catalyst/i.test(k));
    if (key) {
      return { found: true, source: label, url: (servers[key] && servers[key].url) || '' };
    }
  }
  return { found: false };
}

// ---------------------------------------------------------------------------
// Local project scan — find declared runtime stacks without any network call.
// Bounded depth + skip list keep this fast even in large repos.
// ---------------------------------------------------------------------------

function scanProject(root) {
  const configs = [];
  let hasDockerfile = false;
  let visited = 0;
  const SKIP = new Set([
    'node_modules', '.git', '.catalyst', 'dist', 'build',
    '.next', 'target', '__pycache__', 'coverage', '.venv', 'venv',
  ]);

  const walk = (dir, depth) => {
    if (depth > 4 || visited > 6000) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      return;
    }
    for (const ent of entries) {
      visited++;
      const name = ent.name;
      if (ent.isDirectory()) {
        if (SKIP.has(name) || name.startsWith('.')) continue;
        walk(path.join(dir, name), depth + 1);
      } else if (name === 'catalyst-config.json' || name === 'app-config.json') {
        configs.push(path.join(dir, name));
      } else if (name === 'Dockerfile' || name.startsWith('Dockerfile.')) {
        hasDockerfile = true;
      }
    }
  };

  walk(root, 0);
  return { configs, hasDockerfile };
}

// Derive the highest runtime version required per family from the declared
// stack tokens (node20, java17, python_3_12, ...). Field-name agnostic: matches
// the stack tokens wherever they appear in the config text, so it survives CLI
// schema changes.
function detectRequiredRuntimes(configs) {
  const need = { node: 0, java: 0, python: 0 }; // python encoded as major*100 + minor
  for (const p of configs) {
    let txt;
    try {
      txt = fs.readFileSync(p, 'utf8');
    } catch (e) {
      continue;
    }
    let m;
    const nodeRe = /\bnode(\d{2})\b/g;
    while ((m = nodeRe.exec(txt))) need.node = Math.max(need.node, +m[1]);
    const javaRe = /\bjava(\d{1,2})\b/g;
    while ((m = javaRe.exec(txt))) need.java = Math.max(need.java, +m[1]);
    const pyRe = /\bpython[_-]?(\d)[._](\d{1,2})\b/gi;
    while ((m = pyRe.exec(txt))) need.python = Math.max(need.python, +m[1] * 100 + +m[2]);
  }
  return need;
}

// Parse `catalyst config:list` output into a map of configured runtime binary
// paths. A runtime can be pointed at a binary that is NOT on PATH via
// `catalyst config:set <stack>.bin=<path>`; config:list prints one `key=value`
// per line, empty when unset. Note the key spelling: node<major>.bin,
// java<major>.bin, python3_<minor>.bin (the python key drops the underscore the
// stack token uses — stack `python_3_12` maps to config key `python3_12.bin`).
// Regex-based + whitespace-delimited value so it also tolerates --verbose noise.
function parseConfigBins(out) {
  const map = {};
  if (!out) return map;
  const re = /\b(node\d+|java\d+|python3_\d+)\.bin=([^\s]*)/g;
  let m;
  while ((m = re.exec(out))) {
    if (m[2]) map[m[1]] = m[2]; // keep only non-empty (configured) entries
  }
  return map;
}

// ---------------------------------------------------------------------------
// Prerequisite checks — returns { issues: [{level, user, claude}] }
//   level: 'blocker' (breaks most Catalyst work) | 'warn' (breaks a subset)
// ---------------------------------------------------------------------------

function runPrereqChecks(root) {
  const issues = [];

  // 1. Node.js version (needed to run the CLI). Check the PATH node the CLI
  //    would use, not this hook's runtime.
  const nodeRaw = runCmd('node -v', 6000);
  const nodeMajor = nodeRaw ? parseInt(nodeRaw.replace(/^v/, '').split('.')[0], 10) : null;
  if (nodeRaw === null) {
    issues.push({
      level: 'blocker',
      user: "Node.js not found on PATH — the Catalyst CLI requires Node 20+.",
      claude: 'Node.js is not on PATH. The Catalyst CLI cannot run. Guide the user to install Node 20+ before any CLI/scaffold step.',
    });
  } else if (Number.isFinite(nodeMajor) && nodeMajor < MIN_NODE_MAJOR) {
    issues.push({
      level: 'blocker',
      user: `Node.js ${nodeRaw} detected — the Catalyst CLI requires Node ${MIN_NODE_MAJOR}+.`,
      claude: `Node.js ${nodeRaw} is below the CLI minimum (Node ${MIN_NODE_MAJOR}+). CLI commands may fail; guide the user to upgrade Node before scaffolding/deploying.`,
    });
  }

  // 2. Catalyst CLI presence + version.
  // The zcatalyst-cli package ships exactly one binary: `catalyst`.
  const cliRaw = runCmd('catalyst -v', 6000);
  const cliVer = parseSemver(cliRaw);
  if (cliRaw === null) {
    // Distinguish "not installed" from "installed but the binary won't run"
    // (e.g. a corrupt install) — the fixes differ (install vs. reinstall).
    const cliPath = runCmd('command -v catalyst', 4000);
    if (cliPath) {
      const where = cliPath.split('\n')[0];
      issues.push({
        level: 'blocker',
        user: `Catalyst CLI is installed (${where}) but not responding to 'catalyst -v' — the install may be broken. Reinstall: npm i -g zcatalyst-cli@latest`,
        claude: `The Catalyst CLI binary exists (${where}) but 'catalyst -v' failed — likely a broken install (or a transient error). Do not assume CLI commands will work; if commands keep failing, guide the user to reinstall/repair before scaffolding or deploying.`,
      });
    } else {
      issues.push({
        level: 'blocker',
        user: "Catalyst CLI not found on PATH — install with: npm i -g zcatalyst-cli (needs Node 20+).",
        claude: 'The Catalyst CLI is not installed / not on PATH. Do NOT attempt catalyst commands; guide the user to run `npm i -g zcatalyst-cli` first.',
      });
    }
  } else if (!cliVer) {
    issues.push({
      level: 'warn',
      user: `Could not parse Catalyst CLI version from "${cliRaw}". Ensure it is v${MIN_CLI.join('.')}+ for non-interactive (-ni) mode.`,
      claude: `Catalyst CLI version could not be parsed ("${cliRaw}"). Verify it is >= ${MIN_CLI.join('.')} before relying on -ni commands.`,
    });
  } else if (!gte(cliVer, MIN_CLI)) {
    issues.push({
      level: 'blocker',
      user: `Catalyst CLI v${cliVer.join('.')} detected — non-interactive (-ni) mode needs v${MIN_CLI.join('.')}+. Upgrade: npm i -g zcatalyst-cli@latest`,
      claude: `Catalyst CLI is v${cliVer.join('.')}, below v${MIN_CLI.join('.')}. Non-interactive (-ni) commands (init, functions:add, etc.) are unavailable — either guide the user to upgrade, or fall back to the documented interactive flow. Do not emit -ni commands as if they will work.`,
    });
  }

  // 3. CLI authentication. Only meaningful when the CLI actually responded
  //    above. `catalyst whoami` reports the session (both states exit 0):
  //      logged in : "✔ Logged as: <email>"
  //      logged out: "✖ Not logged in yet. To login use catalyst login"
  //    A clearly logged-out result is a blocker — init/deploy/pull all require
  //    auth. An unrecognized or flaky result makes NO claim (this CLI is known
  //    to fail transiently) rather than raising a false alarm. Note that both
  //    states exit 0, so detection is by message content, not exit code.
  if (cliRaw !== null) {
    const who = runCmd('catalyst whoami 2>&1', 8000);
    // Check the negative signal FIRST: "not logged in" contains the substring
    // "logged in", so a naive positive match would misread a logged-out state.
    const loggedOut = who && /(not\s+logged|please\s+log\s?in|log\s?in\s+required|no\b[^.]*\bcredential|run\s+[^.]*\blogin)/i.test(who);
    if (loggedOut) {
      issues.push({
        level: 'blocker',
        user: 'Catalyst CLI is not logged in — run `catalyst login` (or `catalyst login --dc <dc> -ni`) before init/deploy/pull.',
        claude: 'The Catalyst CLI is not authenticated (`catalyst whoami` reports no active session). CLI cloud operations (init, deploy, functions:add, pull) will fail. Guide the user to run `catalyst login` before attempting them; do not emit those commands expecting success.',
      });
    }
    // Logged in (e.g. "Logged as: <email>") -> silent; ambiguous/flaky -> no claim.
  }

  // 4. Runtimes for the stacks declared in this project. A runtime counts as
  //    available if it is on PATH OR the CLI has a configured `<stack>.bin`
  //    override (catalyst config:set / config:list). Only query config:list
  //    when a stack is actually declared — it costs a subprocess.
  const { configs, hasDockerfile } = scanProject(root);
  const need = detectRequiredRuntimes(configs);
  const needsAnyRuntime = need.node > 0 || need.java > 0 || need.python > 0;
  const cfgBins = needsAnyRuntime ? parseConfigBins(runCmd('catalyst config:list', 8000)) : {};

  // A configured bin that is an absolute path but no longer exists is worse
  // than "not configured" — the CLI will try it and fail. Bare-command values
  // (e.g. "python3.9") are left to the CLI to resolve.
  const configuredButMissing = (val) => val && val.startsWith('/') && !fs.existsSync(val);

  // Node runtime for functions/appsail (distinct from the CLI's Node above).
  if (need.node > 0) {
    const key = `node${need.node}`;
    const cfg = cfgBins[key];
    if (configuredButMissing(cfg)) {
      issues.push({
        level: 'warn',
        user: `A component targets node${need.node}; CLI override '${key}.bin=${cfg}' points to a path that no longer exists. Fix: catalyst config:set ${key}.bin=<path-to-node${need.node}>`,
        claude: `node${need.node} is mapped via CLI config '${key}.bin' to a missing path (${cfg}); local serve/execute for that component will fail until the path is corrected or node${need.node} is on PATH.`,
      });
    } else if (!cfg && Number.isFinite(nodeMajor) && nodeMajor !== null && nodeMajor < need.node) {
      issues.push({
        level: 'warn',
        user: `A component targets node${need.node} but Node ${nodeRaw} is installed and no '${key}.bin' override is set. Install node${need.node}, or run: catalyst config:set ${key}.bin=<path-to-node${need.node}>`,
        claude: `A component declares node${need.node}; installed Node is ${nodeRaw} with no CLI '${key}.bin' override. Local execution may diverge from / fail against the deploy runtime.`,
      });
    }
  }

  if (need.java > 0) {
    const key = `java${need.java}`;
    const cfg = cfgBins[key];
    if (configuredButMissing(cfg)) {
      issues.push({
        level: 'warn',
        user: `A component declares java${need.java}; CLI override '${key}.bin=${cfg}' points to a path that no longer exists. Fix: catalyst config:set ${key}.bin=<path>`,
        claude: `java${need.java} is mapped via CLI config '${key}.bin' to a missing path (${cfg}); serve/execute for that component will fail until corrected.`,
      });
    } else if (!cfg && runCmd('java -version 2>&1', 6000) === null) {
      issues.push({
        level: 'warn',
        user: `A component declares java${need.java} but 'java' is not on PATH and no '${key}.bin' override is set. Install a JDK, or run: catalyst config:set ${key}.bin=<path>`,
        claude: `A Java stack (java${need.java}) is declared locally, 'java' is not on PATH, and no CLI '${key}.bin' override exists. catalyst serve / functions:execute for that component will fail.`,
      });
    }
  }

  if (need.python > 0) {
    const minor = need.python % 100;
    const key = `python3_${minor}`;        // config key spelling (no leading underscore)
    const pyLabel = `python_3_${minor}`;   // stack-token spelling
    const cfg = cfgBins[key];
    if (configuredButMissing(cfg)) {
      issues.push({
        level: 'warn',
        user: `A component declares ${pyLabel}; CLI override '${key}.bin=${cfg}' points to a path that no longer exists. Fix: catalyst config:set ${key}.bin=<path>`,
        claude: `${pyLabel} is mapped via CLI config '${key}.bin' to a missing path (${cfg}); serve/execute for that component will fail until corrected.`,
      });
    } else if (!cfg && runCmd('python3 --version 2>&1', 6000) === null && runCmd('python --version 2>&1', 6000) === null) {
      issues.push({
        level: 'warn',
        user: `A component declares ${pyLabel} but no 'python3' is on PATH and no '${key}.bin' override is set. Install Python, or run: catalyst config:set ${key}.bin=<path>`,
        claude: `A Python stack (${pyLabel}) is declared locally, no python3 is on PATH, and no CLI '${key}.bin' override exists. catalyst serve / functions:execute for that component will fail.`,
      });
    }
  }

  // Custom (Docker) runtime: only pay the (slower) daemon check when a
  // Dockerfile is actually present. Short timeout — a hung daemon must not
  // stall session startup.
  if (hasDockerfile) {
    const dockerRaw = runCmd('docker info --format "{{.ServerVersion}}" 2>&1', 5000);
    if (dockerRaw === null || /error|cannot connect|refused/i.test(dockerRaw)) {
      issues.push({
        level: 'warn',
        user: 'A custom (Docker) runtime is present but Docker is not running/accessible — start Docker Desktop or the daemon before building/deploying it.',
        claude: 'A Dockerfile (custom runtime) exists but the Docker daemon is not reachable. Building or deploying the custom-runtime AppSail will fail until Docker is running and accessible.',
      });
    }
  }

  return { issues };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const searchDirs = [process.env.CLAUDE_PROJECT_DIR, process.cwd()].filter(Boolean);

  let rcPath = null;
  for (const dir of searchDirs) {
    const candidate = path.join(dir, '.catalystrc');
    if (fs.existsSync(candidate)) {
      rcPath = candidate;
      break;
    }
  }
  if (!rcPath) return; // not a Catalyst workspace — stay silent

  const rc = readJsonSafe(rcPath);
  if (!rc) return; // malformed rc — don't guess, stay silent

  const projectRoot = path.dirname(rcPath);

  const projects = Array.isArray(rc.projects) ? rc.projects : [];
  if (projects.length === 0) return;

  const activeProjectIdx = rc.actives && rc.actives.project;
  const project = projects.find((p) => p.idx === activeProjectIdx) || projects[0];

  const envs = Array.isArray(project.env) ? project.env : [];
  const activeEnvIdx = rc.actives && rc.actives.env;
  const env = envs.find((e) => e.idx === activeEnvIdx) || envs[0] || {};

  const projectId = project.id || '';
  const projectName = project.name || '';
  const orgId = env.id || ''; // Catalyst stores the org ID in env[].id
  const envName = env.name || '';
  const envType = env.type || '';
  const domain = (project.domain && project.domain.name) || '';
  const timezone = project.timezone || '';

  if (!projectId && !orgId) return;

  // Treat the active environment as production when either the CLI-provided
  // type or the human name signals it. Kept intentionally loose so that a
  // "Production", "prod", or "Live" environment all escalate the warning.
  const isProduction = /prod|live/i.test(`${envType} ${envName}`);

  const lines = [
    'Catalyst workspace detected (.catalystrc) — the active org/project are read from it:',
    `- Org ID: ${orgId || '(unknown)'}`,
    `- Project: ${projectName || '(unnamed)'} (project_id=${projectId || 'unknown'})`,
    `- Environment: ${envName || 'Development'}${isProduction ? ' (PRODUCTION)' : ''}`,
    domain ? `- Domain: ${domain}` : null,
    timezone ? `- Timezone: ${timezone}` : null,
    'Do NOT re-derive these with List_All_Organizations / List_All_Projects. Before MCP resource operations, follow the canonical pre-flight (skills/catalyst-basics/references/preflight.md): confirm the MCP account and CLI agree via CatalystbyZoho_Get_Project_By_Id on this project, then operate. Never assume an org/project that is not in .catalystrc — if .catalystrc is absent, resolve and confirm the project with the user first (see the pre-flight Golden Rule).',
    'Local-first workflow: Catalyst has three environments — Local (this machine, via `catalyst serve`), Development (remote sandbox, the default `catalyst deploy` target), and Production (remote/live, reached only by migrating verified Development changes up). For components you run yourself (Functions, AppSail, Slate), serve and test on Local before deploying to Development, and promote to Production only after Development is verified. Local is coupled to Development: it has no standalone data plane, so Data Store / Stratus / other managed-service calls proxy to the Development environment and act on real Development data. Do not deploy freshly written or changed serve-able code without a local serve + test pass first. Full loop: skills/catalyst-basics/references/project-basics.md -> Environments.',
    'Catalyst MCP operates on LIVE cloud resources: writes, deletes, and schema changes take effect immediately and may be irreversible or incur billing.',
    isProduction
      ? 'The active environment is PRODUCTION. Before any write, delete, or schema change, explicitly confirm with the user, name the exact resource and environment, and warn that the change is live and may be irreversible. Never perform destructive operations in production without explicit user confirmation.'
      : null,
  ].filter(Boolean);

  // MCP configuration note — presence + endpoint only; never a connectivity or
  // auth claim (only the model's tool list can confirm those). Wrapped so a
  // parse failure never disrupts startup.
  let mcp = { found: false };
  try {
    mcp = findCatalystMcp(projectRoot);
  } catch (e) {
    mcp = { found: false };
  }
  if (mcp.found) {
    lines.push(
      `MCP: the catalyst-by-zoho server is configured (endpoint ${mcp.url || 'unknown'}, via ${mcp.source} .mcp.json). That endpoint is data-center-specific — if MCP calls fail with region/auth errors the account's DC may differ from this endpoint; use the switch-dc command to repoint it. This hook does NOT verify live MCP connectivity or authentication: before the first MCP resource operation confirm the ZohoMCP_* meta-tools (ZohoMCP_getSchema, ZohoMCP_executeTool, ZohoMCP_listTools, ZohoMCP_getFeatures) are present in the tool list — that is the connectivity signal; the CatalystbyZoho_* names are tool_name values passed to ZohoMCP_executeTool, never visible tools. Expect a one-time authentication on the first call.`
    );
  } else {
    lines.push(
      'MCP: no catalyst-by-zoho server was found in the .mcp.json files this hook can see (project or plugin). This is NOT authoritative — it may be configured in global/user settings. Before any MCP resource operation, confirm the ZohoMCP_* meta-tools (ZohoMCP_getSchema, ZohoMCP_executeTool, ZohoMCP_listTools, ZohoMCP_getFeatures) are present in the tool list — that is the connectivity signal; the CatalystbyZoho_* names are tool_name values passed to ZohoMCP_executeTool, never visible tools. If the meta-tools are absent, guide the user through MCP setup (catalyst-zoho-mcp skill). Authentication is established lazily on the first MCP call.'
    );
  }

  // Prerequisite check — never let it throw into session startup.
  let issues = [];
  try {
    issues = runPrereqChecks(projectRoot).issues;
  } catch (e) {
    issues = [];
  }

  const blockers = issues.filter((i) => i.level === 'blocker');
  const warns = issues.filter((i) => i.level === 'warn');

  if (issues.length > 0) {
    lines.push(
      'Local toolchain prerequisite check (run at session start) found unmet prerequisites — surface the fix to the user before attempting the affected operations; do not scaffold or emit commands that cannot succeed:'
    );
    for (const i of blockers) lines.push(`- [BLOCKER] ${i.claude}`);
    for (const i of warns) lines.push(`- [WARN] ${i.claude}`);
  }

  // systemMessage is rendered directly to the user (a visible banner), unlike
  // additionalContext which is only seen by the model.
  const banner = isProduction
    ? `⚠️  Catalyst: active environment is PRODUCTION (${envName || 'unknown'}${domain ? `, ${domain}` : ''}). MCP operations run on live resources — writes and deletes take effect immediately and may be irreversible. Confirm each change before it runs.`
    : `⚠️  Catalyst workspace active — environment: ${envName || 'Development'}${domain ? ` (${domain})` : ''}. MCP operations run on live cloud resources; deletions are permanent and may incur billing.`;

  let systemMessage = banner;
  if (issues.length > 0) {
    const parts = ['', 'Catalyst prerequisite check:'];
    for (const i of blockers) parts.push(`  ✗ ${i.user}`);
    for (const i of warns) parts.push(`  ⚠ ${i.user}`);
    systemMessage += '\n' + parts.join('\n');
  }

  const output = {
    systemMessage,
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: lines.join('\n'),
    },
  };

  process.stdout.write(JSON.stringify(output));
}

try {
  main();
} catch (e) {
  // never let a hook error disrupt session startup
}
process.exit(0);
