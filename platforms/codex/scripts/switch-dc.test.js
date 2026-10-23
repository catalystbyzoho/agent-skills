'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { execFileSync } = require('node:child_process');

const {
  DC_URLS,
  atomicWriteWithBackup,
  readDcPolicies,
  updateDcPolicy,
} = require('./switch-dc');
const { findCodexDcSelection } = require('../hooks/catalyst-context');

const PLUGIN_ID = 'catalyst-by-zoho@test-marketplace';
const PLUGIN_ROOT = path.resolve(__dirname, '..');
const REPOSITORY_ROOT = path.resolve(PLUGIN_ROOT, '..', '..');

function hasCodexCli() {
  try {
    execFileSync('codex', ['--version'], { stdio: 'ignore', timeout: 10000 });
    return true;
  } catch (_) {
    return false;
  }
}

test('plugin manifest points to the shared regional MCP definitions', () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(REPOSITORY_ROOT, '.codex-plugin', 'plugin.json'), 'utf8')
  );
  const definitions = JSON.parse(
    fs.readFileSync(path.join(REPOSITORY_ROOT, '.mcp.json'), 'utf8')
  ).mcpServers;

  assert.equal(manifest.mcpServers, './.mcp.json');
  assert.equal(Object.hasOwn(manifest, 'apps'), false);
  assert.equal(fs.existsSync(path.join(REPOSITORY_ROOT, '.app.json')), false);
  assert.deepEqual(
    Object.keys(definitions).sort(),
    Object.keys(DC_URLS).map((dc) => `catalyst-${dc.toLowerCase()}`).sort()
  );
  for (const [server, definition] of Object.entries(definitions)) {
    const dc = server.replace('catalyst-', '').toUpperCase();
    assert.equal(definition.url, DC_URLS[dc]);
  }
});

test('creates policy for every DC and enables exactly the selected one', () => {
  const updated = updateDcPolicy('', PLUGIN_ID, 'IN');
  const policies = readDcPolicies(updated);

  assert.equal(policies.length, Object.keys(DC_URLS).length);
  assert.deepEqual(
    policies.filter((policy) => policy.enabled).map((policy) => policy.dc),
    ['IN']
  );
});

test('switches DC while preserving unrelated settings and server policy', () => {
  const original = [
    'model = "gpt-5"',
    '',
    `[plugins."${PLUGIN_ID}".mcp_servers."catalyst-in"]`,
    'enabled = true',
    'default_tools_approval_mode = "prompt"',
    '',
    '[projects."/tmp/example"]',
    'trust_level = "trusted"',
    '',
  ].join('\n');

  const updated = updateDcPolicy(original, PLUGIN_ID, 'EU');
  const policies = readDcPolicies(updated);

  assert.match(updated, /model = "gpt-5"/);
  assert.match(updated, /default_tools_approval_mode = "prompt"/);
  assert.match(updated, /trust_level = "trusted"/);
  assert.deepEqual(
    policies.filter((policy) => policy.enabled).map((policy) => policy.dc),
    ['EU']
  );
});

test('supports bare regional server keys in existing Codex policy', () => {
  const original = [
    `[plugins."${PLUGIN_ID}".mcp_servers.catalyst-us]`,
    'enabled = true',
    '',
  ].join('\n');

  const updated = updateDcPolicy(original, PLUGIN_ID, 'JP');
  const policies = readDcPolicies(updated);

  assert.deepEqual(
    policies.filter((policy) => policy.enabled).map((policy) => policy.dc),
    ['JP']
  );
});

test('rejects unsupported data centers', () => {
  assert.throws(
    () => updateDcPolicy('', PLUGIN_ID, 'UK'),
    /Unsupported Catalyst data center/
  );
});

test('rejects duplicate regional policy tables', () => {
  const duplicate = [
    `[plugins."${PLUGIN_ID}".mcp_servers.catalyst-us]`,
    'enabled = true',
    '',
    `[plugins."${PLUGIN_ID}".mcp_servers."catalyst-us"]`,
    'enabled = false',
    '',
  ].join('\n');

  assert.throws(
    () => updateDcPolicy(duplicate, PLUGIN_ID, 'US'),
    /Duplicate Codex policy table/
  );
});

test('writes atomically and keeps a backup', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'catalyst-dc-test-'));
  const configPath = path.join(dir, 'config.toml');
  try {
    fs.writeFileSync(configPath, 'model = "before"\n', { mode: 0o600 });
    atomicWriteWithBackup(configPath, 'model = "after"\n');

    assert.equal(fs.readFileSync(configPath, 'utf8'), 'model = "after"\n');
    assert.equal(
      fs.readFileSync(`${configPath}.catalyst-dc.bak`, 'utf8'),
      'model = "before"\n'
    );
    assert.equal(fs.existsSync(`${configPath}.catalyst-dc.lock`), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('session hook resolves exactly one enabled regional policy', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'catalyst-dc-hook-test-'));
  const previousCodexHome = process.env.CODEX_HOME;
  try {
    process.env.CODEX_HOME = dir;
    const config = updateDcPolicy('', PLUGIN_ID, 'CA');
    fs.writeFileSync(path.join(dir, 'config.toml'), config);

    const selection = findCodexDcSelection();
    assert.equal(selection.state, 'valid');
    assert.equal(selection.dc, 'CA');
    assert.equal(selection.url, DC_URLS.CA);
  } finally {
    if (previousCodexHome === undefined) delete process.env.CODEX_HOME;
    else process.env.CODEX_HOME = previousCodexHome;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('session hook rejects enabled regions across multiple plugin installations', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'catalyst-dc-hook-test-'));
  const previousCodexHome = process.env.CODEX_HOME;
  try {
    process.env.CODEX_HOME = dir;
    let config = updateDcPolicy('', PLUGIN_ID, 'US');
    config = updateDcPolicy(config, 'catalyst-by-zoho@another-marketplace', 'EU');
    fs.writeFileSync(path.join(dir, 'config.toml'), config);

    const selection = findCodexDcSelection();
    assert.equal(selection.state, 'ambiguous');
    assert.equal(selection.enabled.length, 2);
  } finally {
    if (previousCodexHome === undefined) delete process.env.CODEX_HOME;
    else process.env.CODEX_HOME = previousCodexHome;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('Codex installs the plugin with bundled regional MCP definitions', {
  skip: !hasCodexCli(),
  timeout: 30000,
}, () => {
  const codexHome = fs.mkdtempSync(path.join(os.tmpdir(), 'catalyst-codex-plugin-test-'));
  const env = { ...process.env, CODEX_HOME: codexHome };
  try {
    execFileSync('codex', ['plugin', 'marketplace', 'add', REPOSITORY_ROOT, '--json'], {
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 15000,
    });
    const installed = JSON.parse(
      execFileSync(
        'codex',
        ['plugin', 'add', 'catalyst-by-zoho@catalyst-by-zoho-marketplace', '--json'],
        {
          env,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
          timeout: 15000,
        }
      )
    );
    assert.equal(installed.name, 'catalyst-by-zoho');
    assert.equal(installed.pluginId, 'catalyst-by-zoho@catalyst-by-zoho-marketplace');

    const switchOutput = execFileSync(
      process.execPath,
      [path.join(installed.installedPath, 'platforms', 'codex', 'scripts', 'switch-dc.js'), 'IN'],
      {
        env,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 15000,
      }
    );
    assert.match(switchOutput, /data center set to IN/);

    const policies = readDcPolicies(
      fs.readFileSync(path.join(codexHome, 'config.toml'), 'utf8')
    ).filter((policy) => policy.pluginId === installed.pluginId);
    assert.deepEqual(
      policies.filter((policy) => policy.enabled).map((policy) => policy.dc),
      ['IN']
    );

    // Parsing the plugin list again verifies that Codex accepts the generated
    // plugin-scoped TOML policy, not just that our own reader accepts it.
    execFileSync('codex', ['plugin', 'list', '--json'], {
      env,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 15000,
    });
  } finally {
    fs.rmSync(codexHome, { recursive: true, force: true });
  }
});
