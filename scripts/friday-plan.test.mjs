#!/usr/bin/env node
// Friday's shuffle carried onto the real core (src/game/outage/fridayPlan.ts).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-friday-"));
const entry = join(dir, "entry.ts");
const out = join(dir, "friday.mjs");
writeFileSync(entry, [
  `export * from ${JSON.stringify(join(root, "src/game/outage/fridayPlan.ts"))};`,
  `export { beavrsCycle1, beavrsCycle2, endCycle, orbit, QUARTER, N } from ${JSON.stringify(join(root, "src/game/outage/core.ts"))};`,
  `export { PRESET_EOC1 } from ${JSON.stringify(join(root, "src/game/outage/eoc1.ts"))};`,
  `export { presetSet } from ${JSON.stringify(join(root, "src/game/outage/preset.ts"))};`,
  `export { PRESET_FIT, FIT_REPORT } from ${JSON.stringify(join(root, "src/game/outage/calibration.ts"))};`,
].join("\n"));
const b = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], { encoding: "utf8", cwd: root });
if (b.status !== 0) throw new Error(b.stderr || b.stdout);
const F = await import(out);

const map = (rows) => rows.join("").split("").map((c, k) => ({ i: Math.floor(k / 6), j: k % 6, cycle: c }));
// A low-leakage Friday plan: twice-burned on the fence, fresh scattered inside.
const LOW = map(["222222", "2F1F12", "21F1F2", "2F1F12", "21F1F2", "222222"]);
// The opposite: fresh on the fence.
const HIGH = map(["FFFFFF", "F2121F", "F1212F", "F2121F", "F1212F", "FFFFFF"]);
const eoc1 = F.beavrsCycle1().map((a, i) => (a ? { ...a, burnup: F.PRESET_EOC1[i] } : null));
const core = F.beavrsCycle2(F.endCycle(eoc1));
const set = F.presetSet(F.PRESET_FIT, F.FIT_REPORT);

test("the layout moves fuel, never makes or loses it, and keeps the 90° symmetry", () => {
  const laid = F.fridayLayout(core, LOW);
  const ids = (c) => c.filter(Boolean).map((a) => a.id).sort();
  assert.deepEqual(ids(laid), ids(core));
  for (let i = 0; i < core.length; i++) assert.equal(laid[i] === null, core[i] === null, `shape at ${i}`);
  for (const q of F.QUARTER) {
    const o = F.orbit(q);
    if (o.length !== 4) { assert.equal(laid[q], core[q], "the centre stays"); continue; }
    const kinds = o.map((j) => `${laid[j].cycles}`);
    assert.equal(new Set(kinds).size, 1, `orbit ${q} holds one batch`);
  }
});

test("the plan's strategy shows on the real core", () => {
  const low = F.freshOnRim(F.fridayLayout(core, LOW, set));
  const high = F.freshOnRim(F.fridayLayout(core, HIGH, set));
  assert.ok(low < 0.4, `low-leakage plan keeps most fresh fuel off the outer third (${low})`);
  assert.ok(high > low + 0.25, `a fresh-on-the-fence plan puts more of it there (${high} vs ${low})`);
});

test("Friday's freshness reads by distance from the centre", () => {
  const want = F.planFreshness(LOW);
  assert.ok(want(0.3) > want(1), "fresher inside than at the fence");
  const flip = F.planFreshness(HIGH);
  assert.ok(flip(1) > flip(0.3));
});
