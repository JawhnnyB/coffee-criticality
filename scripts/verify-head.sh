#!/bin/sh
# Run the same checks on a clean export of a commit.
# Usage: scripts/verify-head.sh <sha>
# Writes docs/audit/evidence/<sha>/ next to the current repo, not inside the export.
set -eu
sha="${1:?commit sha required}"
root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
out="$root/docs/audit/evidence/$sha"
mkdir -p "$out"
export_dir=$(mktemp -d)
cleanup() { rm -rf "$export_dir"; }
trap cleanup EXIT
git -C "$root" archive "$sha" | tar -x -C "$export_dir"
if [ -d "$root/node_modules" ]; then
  ln -s "$root/node_modules" "$export_dir/node_modules"
fi
cd "$export_dir"
{
  echo "sha $sha"
  echo "date $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "node $(node -v)"
} > "$out/manifest.head"
set +e
npx tsc --noEmit --pretty false > "$out/tsc.txt" 2>&1
echo "TSC_EXIT:$?" >> "$out/tsc.txt"
if [ -n "${ESBUILD:-}" ]; then
  ESBUILD="$ESBUILD" node --test 'scripts/**/*.test.mjs' > "$out/unit.txt" 2>&1
else
  node --test 'scripts/**/*.test.mjs' > "$out/unit.txt" 2>&1
fi
echo "UNIT_EXIT:$?" >> "$out/unit.txt"
npm run build > "$out/build.txt" 2>&1
echo "BUILD_EXIT:$?" >> "$out/build.txt"
node scripts/claims-check.mjs docs/audit/2026-11-14-dream-pass-5.md > "$out/claims.txt" 2>&1
echo "CLAIMS_EXIT:$?" >> "$out/claims.txt"
set -e
node -e '
const fs = require("fs");
const sha = process.argv[1];
const out = process.argv[2];
function exitOf(name) {
  const text = fs.readFileSync(out + "/" + name, "utf8");
  const marks = [...text.matchAll(/[A-Z0-9_]*EXIT:(\d+)/g)];
  return marks.length ? Number(marks[marks.length - 1][1]) : null;
}
const manifest = {
  sha,
  date: new Date().toISOString(),
  node: process.version,
  tsc: exitOf("tsc.txt"),
  unit: exitOf("unit.txt"),
  build: exitOf("build.txt"),
  claims: exitOf("claims.txt"),
};
fs.writeFileSync(out + "/manifest.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify(manifest));
' "$sha" "$out"
