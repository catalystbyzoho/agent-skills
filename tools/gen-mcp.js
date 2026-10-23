#!/usr/bin/env node
// Generates the shared root .mcp.json (one server per Catalyst data center) and
// verifies the DC URLs in dc-switching.md, the Codex switch-dc script and the
// catalyst-switch-dc skill match it.
// Usage: node tools/gen-mcp.js [--check]
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const check = process.argv.includes('--check');

// IN first: the first server is the documented default.
const DCS = [
  ['IN', 'in'],
  ['US', 'com'],
  ['EU', 'eu'],
  ['AU', 'com.au'],
  ['CA', 'ca'],
  ['SA', 'sa'],
  ['JP', 'jp'],
  ['UAE', 'ae'],
];

const url = (tld) => `https://catalyst.zohomcp.${tld}/mcp/message`;

const config = {
  mcpServers: Object.fromEntries(
    DCS.map(([dc, tld]) => [`catalyst-${dc.toLowerCase()}`, { type: 'streamable-http', url: url(tld) }])
  ),
};

const target = path.join(root, '.mcp.json');
const expected = JSON.stringify(config, null, 2) + '\n';
let failed = false;

if (check) {
  const actual = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  if (actual !== expected) {
    console.error('out of sync: .mcp.json (run node tools/gen-mcp.js)');
    failed = true;
  }
  const doc = fs.readFileSync(path.join(root, 'skills/catalyst-zoho-mcp/references/dc-switching.md'), 'utf8');
  for (const [dc, tld] of DCS) {
    if (!doc.includes(`| ${dc} |`) || !doc.includes(`\`${url(tld)}\``)) {
      console.error(`dc-switching.md is missing or has a wrong URL for ${dc}`);
      failed = true;
    }
  }
  const codexUrls = require(path.join(root, 'platforms/codex/scripts/switch-dc.js')).DC_URLS;
  const skill = fs.readFileSync(path.join(root, 'skills/catalyst-switch-dc/SKILL.md'), 'utf8');
  for (const [dc, tld] of DCS) {
    if (codexUrls[dc] !== url(tld)) {
      console.error(`platforms/codex/scripts/switch-dc.js has a missing or wrong URL for ${dc}`);
      failed = true;
    }
    if (!skill.includes(`| ${dc} |`) || !skill.includes(`\`${url(tld)}\``)) {
      console.error(`skills/catalyst-switch-dc/SKILL.md is missing or has a wrong URL for ${dc}`);
      failed = true;
    }
  }
  if (Object.keys(codexUrls).length !== DCS.length) {
    console.error('platforms/codex/scripts/switch-dc.js has a different number of DCs');
    failed = true;
  }
  if (failed) process.exit(1);
  console.log('.mcp.json, dc-switching.md, Codex script and skill in sync');
} else {
  fs.writeFileSync(target, expected);
  console.log('updated .mcp.json');
}
