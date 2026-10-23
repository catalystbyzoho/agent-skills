#!/usr/bin/env node
// PreToolUse guard: asks for confirmation before Catalyst CLI commands that
// deploy or delete resources. Reads toolCall.args.CommandLine from stdin.
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  const risky = /\b(?:catalyst|zcatalyst)\b.*?\b(deploy|[\w:-]*:(delete|remove|destroy))\b/i;
  let command = '';
  try {
    command = String(JSON.parse(input).toolCall?.args?.CommandLine ?? '');
  } catch {
    // malformed payload: allow
  }
  const out = risky.test(command)
    ? {
        decision: 'ask',
        reason:
          'This Catalyst command deploys or deletes resources. Confirm the project, data center and environment first.',
      }
    : { decision: 'allow' };
  process.stdout.write(JSON.stringify(out));
});
