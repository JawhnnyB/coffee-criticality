import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-dis-"));
const entry = join(dir, "entry.ts");
writeFileSync(
  entry,
  [
    `export * from ${JSON.stringify(join(root, "src/game/shuffleModel.ts"))};`,
    `export { referenceDischarge, scoreDischarge } from ${JSON.stringify(join(root, "src/game/discharge.ts"))};`,
  ].join("\n"),
);
const out = join(dir, "dis.mjs");
const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], {
  encoding: "utf8",
  cwd: root,
});
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
const M = await import(out);

test("discharge score is overlap with fresh fuel on the rim", () => {
  const grid = M.startMap();
  const want = [];
  for (let i = 0; i < grid.length; i++) if (grid[i] === 0 && M.isRim(i)) want.push(i);
  assert.ok(want.length > 0 && want.length < 12);
  assert.deepEqual(M.referenceDischarge(), want);
  assert.equal(M.scoreDischarge(want).points, 100);
  assert.equal(M.scoreDischarge(want).matched, want.length);
  assert.equal(M.scoreDischarge([]).points, 0);
  assert.equal(M.scoreDischarge([want[0]]).matched, 1);
  assert.ok(M.scoreDischarge([want[0]]).points < 100);
  const all = M.scoreDischarge([...Array(36).keys()]);
  assert.ok(all.points < 100);
  assert.equal(all.matched, want.length);
  const miss = M.scoreDischarge([grid.findIndex((b, i) => b !== 0 || !M.isRim(i))]);
  assert.equal(miss.matched, 0);
  assert.equal(miss.points, 0);
  assert.equal(M.passes(M.fluxOf(grid, 4.5), 99), false);
});
