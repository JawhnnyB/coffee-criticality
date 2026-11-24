import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-c1-"));
const entry = join(dir, "entry.ts");
writeFileSync(
  entry,
  [
    `export { beavrsCycle1 } from ${JSON.stringify(join(root, "src/game/outage/core.ts"))};`,
    `export { CYCLE1_TUTORIAL, cycle1Batches, cycle1FuelCount } from ${JSON.stringify(join(root, "src/game/outage/cycle1Lesson.ts"))};`,
  ].join("\n"),
);
const out = join(dir, "c1.mjs");
const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], {
  encoding: "utf8",
  cwd: root,
});
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
const M = await import(out);

test("the worked example counts the benchmark Cycle 1 map and adds no figures", () => {
  const core = M.beavrsCycle1();
  const fuel = core.filter(Boolean);
  const batches = M.cycle1Batches();
  assert.equal(M.cycle1FuelCount(), fuel.length);
  assert.equal(batches.reduce((s, b) => s + b.n, 0), fuel.length);
  assert.ok(fuel.length > 100);
  const seen = new Set(fuel.map((a) => `${a.e}/${a.ba}`));
  for (const b of batches) {
    assert.equal(seen.has(`${b.e}/${b.ba}`), true);
    assert.equal(fuel.filter((a) => a.e === b.e && a.ba === b.ba).length, b.n);
  }
  for (const line of M.CYCLE1_TUTORIAL) {
    assert.ok(line.length <= 78, line);
    assert.equal(line.includes("!"), false, line);
  }
});
