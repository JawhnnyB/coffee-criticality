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
  `export { beavrsCycle1, beavrsCycle2, endCycle, orbit, QUARTER, N, runCycle } from ${JSON.stringify(join(root, "src/game/outage/core.ts"))};`,
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

const MID = (F.N - 1) / 2;
const reach = (c) => Math.max(...c.map((a, i) => (a ? Math.hypot((i % F.N) - MID, Math.floor(i / F.N) - MID) : 0)));
/** Share of one kind of fresh fuel on the outer third. */
const outerShare = (c, poisoned) => {
  const R = reach(c);
  const fresh = c.map((a, i) => ({ a, i })).filter((x) => x.a && x.a.cycles === 0 && x.a.ba > 0 === poisoned);
  return fresh.filter((x) => Math.hypot((x.i % F.N) - MID, Math.floor(x.i / F.N) - MID) / R > 2 / 3).length / fresh.length;
};

test("Priya's real-core rules: unpoisoned fresh fuel on the flats, the most burned in the centre", () => {
  for (const plan of [LOW, HIGH]) {
    const n = F.fridayLayoutWithNotes(core, plan, set);
    assert.equal(outerShare(n.core, false), 1, "every unpoisoned fresh assembly on the outer third");
    assert.ok(n.toCentre > 0);
    const centre = F.QUARTER.filter((q) => F.orbit(q).length === 4 && Math.hypot((q % F.N) - MID, Math.floor(q / F.N) - MID) / reach(core) < F.CENTRE_END);
    for (const q of centre) assert.ok(n.core[q].cycles > 0, "no fresh fuel in the very centre");
  }
});

test("the plan still decides where the poisoned fresh fuel goes", () => {
  const low = outerShare(F.fridayLayout(core, LOW, set), true);
  const high = outerShare(F.fridayLayout(core, HIGH, set), true);
  assert.ok(high > low, `a fresh-on-the-fence plan puts more of it outward (${high} vs ${low})`);
});

test("laid out by the rules and worked by Priya, a low-leakage plan holds against the plant's own pattern", async () => {
  const plantPeak = F.runCycle(core, set, 0.5).peak;
  const laid = F.fridayLayout(core, LOW, set);
  const literal = F.runCycle(laid, set, 0.5).peak;
  const worked = await F.priyaPass(laid, set, { tries: 150, seed: 1, yieldEvery: 1000 });
  const after = F.runCycle(worked.core, set, 0.5).peak;
  assert.ok(after <= literal + 1e-6 || F.holds(after, plantPeak), `Priya's pass never makes it worse (${literal} → ${after})`);
  assert.ok(F.holds(after, plantPeak), `holds: ${after.toFixed(3)} vs plant ${plantPeak.toFixed(3)} × ${F.HOLD_MARGIN}`);
});

test("Friday's freshness reads by distance from the centre", () => {
  const want = F.planFreshness(LOW);
  assert.ok(want(0.3) > want(1), "fresher inside than at the fence");
  const flip = F.planFreshness(HIGH);
  assert.ok(flip(1) > flip(0.3));
});
