#!/usr/bin/env node
// Syncs shared fields from manifest.source.json into every platform manifest.
// Usage: node tools/sync-manifests.js [--check]
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const check = process.argv.includes('--check');
const src = JSON.parse(fs.readFileSync(path.join(root, 'manifest.source.json'), 'utf8'));

// file -> function applying shared fields to the parsed manifest
const targets = {
  '.claude-plugin/plugin.json': (m) => Object.assign(m, pick(['version', 'description', 'license'])),
  '.cursor-plugin/plugin.json': (m) => Object.assign(m, pick(['version', 'description', 'license', 'homepage', 'repository'])),
  '.codex-plugin/plugin.json': (m) => Object.assign(m, pick(['version', 'description', 'license', 'homepage', 'repository'])),
  'plugin.json': (m) => Object.assign(m, pick(['version', 'description', 'license', 'homepage', 'repository'])),
  'gemini-extension.json': (m) => Object.assign(m, pick(['version', 'description'])),
  '.github/plugin/marketplace.json': (m) => {
    m.metadata.version = src.version;
    m.plugins.forEach((p) => { p.version = src.version; });
  },
};

function pick(keys) {
  return Object.fromEntries(keys.map((k) => [k, src[k]]));
}

let stale = 0;
for (const [file, apply] of Object.entries(targets)) {
  const full = path.join(root, file);
  const before = fs.readFileSync(full, 'utf8');
  const manifest = JSON.parse(before);
  apply(manifest);
  const after = JSON.stringify(manifest, null, 2) + '\n';
  if (JSON.stringify(JSON.parse(before)) === JSON.stringify(manifest)) continue;
  if (check) {
    console.error(`out of sync: ${file}`);
    stale++;
  } else {
    fs.writeFileSync(full, after);
    console.log(`updated ${file}`);
  }
}

if (check && stale) process.exit(1);
if (check) console.log('all manifests in sync');
