#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const PLUGIN_NAME = 'catalyst-by-zoho';
const DC_URLS = Object.freeze({
  US: 'https://catalyst.zohomcp.com/mcp/message',
  EU: 'https://catalyst.zohomcp.eu/mcp/message',
  IN: 'https://catalyst.zohomcp.in/mcp/message',
  AU: 'https://catalyst.zohomcp.com.au/mcp/message',
  CA: 'https://catalyst.zohomcp.ca/mcp/message',
  SA: 'https://catalyst.zohomcp.sa/mcp/message',
  JP: 'https://catalyst.zohomcp.jp/mcp/message',
  UAE: 'https://catalyst.zohomcp.ae/mcp/message',
});

const SERVER_TO_DC = Object.freeze(
  Object.fromEntries(Object.keys(DC_URLS).map((dc) => [`catalyst-${dc.toLowerCase()}`, dc]))
);

function usage() {
  return [
    'Usage:',
    '  node switch-dc.js <US|EU|IN|AU|CA|SA|JP|UAE> [options]',
    '  node switch-dc.js --status [options]',
    '',
    'Options:',
    '  --plugin-id <id>  Override automatic installed-plugin discovery',
    '  --config <path>    Override the Codex config path (for testing)',
    '  --dry-run          Print the proposed config without writing it',
  ].join('\n');
}

function tomlBasicString(value) {
  return JSON.stringify(String(value));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function serverHeaderRegex(pluginId) {
  const plugin = escapeRegex(tomlBasicString(pluginId));
  const servers = Object.keys(SERVER_TO_DC).map(escapeRegex).join('|');
  return new RegExp(
    `^\\s*\\[plugins\\.${plugin}\\.mcp_servers\\.(?:"(${servers})"|(${servers}))\\]\\s*(?:#.*)?$`
  );
}

function anyCatalystHeaderRegex() {
  const servers = Object.keys(SERVER_TO_DC).map(escapeRegex).join('|');
  return new RegExp(
    `^\\s*\\[plugins\\."((?:\\\\.|[^"])*)"\\.mcp_servers\\.(?:"(${servers})"|(${servers}))\\]\\s*(?:#.*)?$`
  );
}

function isTableHeader(line) {
  return /^\s*\[\[?[^\]]+\]\]?\s*(?:#.*)?$/.test(line);
}

function sectionRanges(lines, headerRegex) {
  const ranges = [];
  for (let i = 0; i < lines.length; i++) {
    const match = headerRegex.exec(lines[i]);
    if (!match) continue;
    let end = i + 1;
    while (end < lines.length && !isTableHeader(lines[end])) end++;
    ranges.push({ start: i, end, match });
  }
  return ranges;
}

function updateDcPolicy(configText, pluginId, selectedDc) {
  const dc = String(selectedDc || '').toUpperCase();
  if (!DC_URLS[dc]) {
    throw new Error(`Unsupported Catalyst data center "${selectedDc}". Choose: ${Object.keys(DC_URLS).join(', ')}.`);
  }
  if (!pluginId || typeof pluginId !== 'string') {
    throw new Error('A Codex plugin ID is required.');
  }

  const newline = configText.includes('\r\n') ? '\r\n' : '\n';
  const lines = configText ? configText.replace(/\r\n/g, '\n').split('\n') : [];
  const ranges = sectionRanges(lines, serverHeaderRegex(pluginId));
  const found = new Map();

  for (const range of ranges) {
    const server = range.match[1] || range.match[2];
    if (found.has(server)) {
      throw new Error(`Duplicate Codex policy table for ${pluginId}/${server}; resolve it before switching DC.`);
    }
    found.set(server, range);
  }

  // Work backwards so inserting an enabled key cannot invalidate later ranges.
  for (const [server, range] of [...found.entries()].sort((a, b) => b[1].start - a[1].start)) {
    const enabled = SERVER_TO_DC[server] === dc;
    let enabledLine = -1;
    for (let i = range.start + 1; i < range.end; i++) {
      if (/^\s*enabled\s*=/.test(lines[i])) {
        if (enabledLine !== -1) {
          throw new Error(`Duplicate enabled keys in Codex policy table for ${pluginId}/${server}.`);
        }
        enabledLine = i;
      }
    }
    if (enabledLine === -1) {
      lines.splice(range.end, 0, `enabled = ${enabled}`);
    } else {
      const indent = (/^(\s*)/.exec(lines[enabledLine]) || ['', ''])[1];
      lines[enabledLine] = `${indent}enabled = ${enabled}`;
    }
  }

  const missing = Object.keys(SERVER_TO_DC).filter((server) => !found.has(server));
  if (missing.length > 0) {
    if (lines.length > 0 && lines[lines.length - 1] !== '') lines.push('');
    lines.push('# Catalyst by Zoho regional MCP selection (managed by catalyst-switch-dc).');
    for (const server of missing) {
      lines.push(
        `[plugins.${tomlBasicString(pluginId)}.mcp_servers.${tomlBasicString(server)}]`,
        `enabled = ${SERVER_TO_DC[server] === dc}`,
        ''
      );
    }
  }

  let result = lines.join('\n');
  if (result && !result.endsWith('\n')) result += '\n';
  return result.replace(/\n/g, newline);
}

function readDcPolicies(configText) {
  const lines = String(configText || '').replace(/\r\n/g, '\n').split('\n');
  const ranges = sectionRanges(lines, anyCatalystHeaderRegex());
  const policies = [];

  for (const range of ranges) {
    let pluginId;
    try {
      pluginId = JSON.parse(`"${range.match[1]}"`);
    } catch (_) {
      continue;
    }
    const server = range.match[2] || range.match[3];
    let enabled = null;
    for (let i = range.start + 1; i < range.end; i++) {
      const match = /^\s*enabled\s*=\s*(true|false)\s*(?:#.*)?$/i.exec(lines[i]);
      if (match) enabled = match[1].toLowerCase() === 'true';
    }
    policies.push({ pluginId, server, dc: SERVER_TO_DC[server], enabled });
  }
  return policies;
}

function resolvePluginId(explicitPluginId) {
  if (explicitPluginId) return explicitPluginId;

  let output;
  try {
    output = execFileSync('codex', ['plugin', 'list', '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 15000,
    });
  } catch (error) {
    throw new Error(`Could not list installed Codex plugins. Re-run with --plugin-id <id>. ${error.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(output);
  } catch (_) {
    throw new Error('Codex returned invalid JSON while listing installed plugins. Re-run with --plugin-id <id>.');
  }

  const matches = (Array.isArray(parsed.installed) ? parsed.installed : [])
    .filter((entry) => entry && entry.installed && entry.enabled && entry.name === PLUGIN_NAME)
    .map((entry) => entry.pluginId)
    .filter(Boolean);

  if (matches.length === 0) {
    throw new Error(`No enabled ${PLUGIN_NAME} plugin installation was found. Install/enable it, or pass --plugin-id <id>.`);
  }
  if (matches.length > 1) {
    throw new Error(`Multiple enabled ${PLUGIN_NAME} installations were found: ${matches.join(', ')}. Pass --plugin-id <id>.`);
  }
  return matches[0];
}

function defaultConfigPath() {
  const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
  return path.join(codexHome, 'config.toml');
}

function atomicWriteWithBackup(configPath, content) {
  const dir = path.dirname(configPath);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });

  const lockPath = `${configPath}.catalyst-dc.lock`;
  let lockFd;
  try {
    lockFd = fs.openSync(lockPath, 'wx', 0o600);
    fs.writeFileSync(lockFd, `${process.pid}\n`);
  } catch (error) {
    if (lockFd !== undefined) {
      try { fs.closeSync(lockFd); } catch (_) {}
      try { fs.unlinkSync(lockPath); } catch (_) {}
    }
    if (error.code === 'EEXIST') {
      throw new Error(`Another Catalyst DC update may be running (${lockPath} exists).`);
    }
    throw error;
  }

  const tempPath = `${configPath}.catalyst-dc.${process.pid}.tmp`;
  try {
    let mode = 0o600;
    if (fs.existsSync(configPath)) {
      const stat = fs.statSync(configPath);
      mode = stat.mode & 0o777;
      fs.copyFileSync(configPath, `${configPath}.catalyst-dc.bak`);
      fs.chmodSync(`${configPath}.catalyst-dc.bak`, mode);
    }
    fs.writeFileSync(tempPath, content, { encoding: 'utf8', mode });
    fs.renameSync(tempPath, configPath);
  } finally {
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch (_) {
      // Best-effort cleanup only.
    }
    try {
      if (lockFd !== undefined) fs.closeSync(lockFd);
      fs.unlinkSync(lockPath);
    } catch (_) {
      // Best-effort cleanup only.
    }
  }
}

function parseArgs(argv) {
  const options = { dryRun: false, status: false };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--status') options.status = true;
    else if (arg === '--plugin-id' || arg === '--config') {
      if (!argv[i + 1]) throw new Error(`${arg} requires a value.`);
      options[arg === '--plugin-id' ? 'pluginId' : 'configPath'] = argv[++i];
    } else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`);
    else positional.push(arg);
  }
  if (positional.length > 1) throw new Error('Provide exactly one data-center code.');
  options.dc = positional[0] && positional[0].toUpperCase();
  return options;
}

function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }

  const configPath = path.resolve(options.configPath || defaultConfigPath());
  const configText = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf8') : '';

  if (options.status) {
    const policies = readDcPolicies(configText).filter((policy) =>
      options.pluginId ? policy.pluginId === options.pluginId : policy.pluginId.startsWith(`${PLUGIN_NAME}@`)
    );
    const enabled = policies.filter((policy) => policy.enabled);
    process.stdout.write(JSON.stringify({ configPath, policies, enabled }, null, 2) + '\n');
    return enabled.length === 1 ? 0 : 2;
  }

  if (!options.dc) throw new Error(`A data-center code is required.\n\n${usage()}`);
  const pluginId = resolvePluginId(options.pluginId);
  const updated = updateDcPolicy(configText, pluginId, options.dc);

  if (options.dryRun) {
    process.stdout.write(updated);
    return 0;
  }

  atomicWriteWithBackup(configPath, updated);
  process.stdout.write(
    [
      `Catalyst MCP data center set to ${options.dc}.`,
      `Endpoint: ${DC_URLS[options.dc]}`,
      `Codex config: ${configPath}`,
      'Restart Codex now. Do not run Catalyst MCP operations in this session; the old MCP connection remains active until restart.',
      'After restart, complete OAuth for the selected regional endpoint.',
    ].join('\n') + '\n'
  );
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = main();
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  DC_URLS,
  SERVER_TO_DC,
  atomicWriteWithBackup,
  parseArgs,
  readDcPolicies,
  resolvePluginId,
  updateDcPolicy,
};
