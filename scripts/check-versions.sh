#!/usr/bin/env bash
# Verifies skill version bumps against a base ref (see "Versioning" in AGENTS.md).
# Usage: scripts/check-versions.sh [base-ref]   (default: origin/main)
set -euo pipefail

base_ref="${1:-origin/main}"
cd "$(git rev-parse --show-toplevel)"

base=$(git merge-base "$base_ref" HEAD)
repo_major=$(sed -n 's/.*"version": *"\([0-9]*\)\..*/\1/p' .claude-plugin/plugin.json | head -1)

version_of() { sed -n 's/^  version: *"\(.*\)".*/\1/p' | head -1; }

# Returns 0 if $1 > $2 (semver, numeric per field).
greater() {
  awk -v a="$1" -v b="$2" 'BEGIN {
    split(a, x, "."); split(b, y, ".")
    for (i = 1; i <= 3; i++) { if (x[i] + 0 > y[i] + 0) exit 0; if (x[i] + 0 < y[i] + 0) exit 1 }
    exit 1 }'
}

# Skills with any change between the base and the working tree (committed or not).
changed=$( { git diff --name-only "$base" -- skills; git ls-files --others --exclude-standard -- skills; } \
  | awk -F/ 'NF > 2 { print $2 }' | sort -u)

if [ -z "$changed" ]; then
  echo "No skill changes against $base_ref."
  exit 0
fi

fail=0
printf "%-28s %-8s %-8s %s\n" SKILL BASE NOW STATUS
for skill in $changed; do
  file="skills/$skill/SKILL.md"
  if [ ! -f "$file" ]; then
    printf "%-28s %-8s %-8s %s\n" "$skill" "-" "-" "removed (router needs MAJOR)"
    continue
  fi
  now=$(version_of < "$file")
  old=$(git show "${base}:${file}" 2>/dev/null | version_of || true)
  if [ -z "$old" ]; then
    # A moved skill keeps its version history: look up the file it was renamed from.
    src=$(git diff -M --diff-filter=R --name-status "$base" | awk -v f="$file" '$3 == f { print $2 }')
    [ -n "$src" ] && old=$(git show "${base}:${src}" | version_of || true)
  fi

  if [ -z "$old" ]; then
    if [ "$now" = "${repo_major}.0.0" ]; then status="ok (new skill)"
    else status="FAIL: new skill must start at ${repo_major}.0.0"; fail=1; fi
    old="new"
  elif [ "$now" = "$old" ]; then
    status="FAIL: changed but not bumped"; fail=1
  elif greater "$now" "$old"; then
    status="ok"
  else
    status="FAIL: version went down"; fail=1
  fi
  printf "%-28s %-8s %-8s %s\n" "$skill" "$old" "$now" "$status"
done

exit "$fail"
