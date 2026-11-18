import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-outage-"));
const entry = join(dir, "entry.ts");
writeFileSync(entry, ["core", "preset", "lattice", "calibration", "eoc1"].map((f) => `export * from ${JSON.stringify(join(root, `src/game/outage/${f}.ts`))};`).join("\n"));
const out = join(dir, "o.mjs");
const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], {
  encoding: "utf8",
  cwd: root,
});
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
const M = await import(out);
const SET = M.presetSet(M.PRESET_FIT, "");
const fuel = (core) => core.filter(Boolean);

test("BEAVRS data: 193 assemblies, the real Cycle 2 reload reuses 129 once each and adds 64 fresh, all 1.6% out", () => {
  const c1 = M.beavrsCycle1();
  assert.equal(fuel(c1).length, 193);
  const c2 = M.beavrsCycle2(c1);
  assert.equal(fuel(c2).length, 193);
  const reused = fuel(c2).filter((a) => a.id.startsWith("C1-"));
  assert.equal(reused.length, 129);
  assert.equal(new Set(reused.map((a) => a.id)).size, 129, "each burned assembly once");
  assert.equal(fuel(c2).filter((a) => a.id.startsWith("C2-new")).length, 64);
  const kept = new Set(reused.map((a) => a.id));
  const out = fuel(c1).filter((a) => !kept.has(a.id));
  assert.equal(out.length, 64);
  assert.ok(out.every((a) => a.e === 1.6), "every discharged assembly is 1.6%");
});

test("the Cycle 1 loading is symmetric under a quarter turn, and the solver keeps that symmetry", () => {
  const c1 = M.beavrsCycle1();
  for (let i = 0; i < 225; i++) {
    const a = c1[i];
    const b = c1[M.rot90(i)];
    assert.equal(!!a, !!b);
    if (a) assert.equal(`${a.e}/${a.ba}`, `${b.e}/${b.ba}`, M.posName(i));
  }
  const crit = M.critical(M.nodeMap(c1, SET));
  // The solver converges to about 1e-4 in relative power; symmetry is checked to 1e-3.
  for (let i = 0; i < 225; i++) if (M.isFuel(i)) assert.ok(Math.abs(crit.sol.power[i] - crit.sol.power[M.rot90(i)]) < 1e-3, M.posName(i));
  const avg = crit.sol.power.filter((_, i) => M.isFuel(i)).reduce((s, p) => s + p, 0) / 193;
  assert.ok(Math.abs(avg - 1) < 1e-9, "power averages 1");
});

test("the boron search finds a known shift exactly", () => {
  const map = M.nodeMap(M.beavrsCycle1(), SET);
  const base = M.critical(map);
  const lowered = { ...map, produce: map.produce.map((v, i) => (v ? v - 0.01 * map.absorb[i] : 0)) };
  const again = M.critical(lowered, undefined, base.sol.phi);
  assert.ok(Math.abs(again.shift - base.shift - 0.01) < 1e-6, `${again.shift - base.shift}`);
  assert.ok(Math.abs(again.sol.k - 1) < 1e-6);
});

test("calibration holds: critical at the measured 975 ppm, letdown and cycle lengths close to the plant", () => {
  // Zero power, 975 ppm: the published k∞ values plus the fitted axial shift must give k = 1.
  const bolSet = M.presetSet({ slope: 0, baBurnout: 1, baResidual: 0, hfpShift: 0, boronWorth: -1e-4 }, "");
  const save = M.CORE.feedback;
  M.CORE.feedback = 0;
  const hzp = M.critical(M.nodeMap(M.beavrsCycle1(), bolSet));
  M.CORE.feedback = save;
  assert.ok(Math.abs(hzp.shift) < 2e-4, `HZP shift ${hzp.shift}`);
  const r1 = M.runCycle(M.beavrsCycle1(), SET, 0.5, 40, M.MEASURED.eocEfpd.cycle1);
  const at = (steps, e) => {
    for (let i = 1; i < steps.length; i++) if (e <= steps[i].efpd) return steps[i - 1].ppm + ((steps[i].ppm - steps[i - 1].ppm) * (e - steps[i - 1].efpd)) / (steps[i].efpd - steps[i - 1].efpd);
    return steps[steps.length - 1].ppm;
  };
  const rms = (d) => Math.sqrt(d.reduce((s, v) => s + v * v, 0) / d.length);
  const d1 = M.MEASURED.letdown.cycle1.map(([e, b]) => at(r1.steps, e) - b);
  assert.ok(rms(d1) < 20, `cycle 1 letdown RMS ${rms(d1).toFixed(1)} ppm`);
  const own1 = M.runCycle(M.beavrsCycle1(), SET, 0.5);
  assert.ok(Math.abs(own1.efpd / M.MEASURED.eocEfpd.cycle1 - 1) < 0.08, `cycle 1 ${own1.efpd.toFixed(0)} EFPD vs 327.2`);
  const c2 = M.beavrsCycle2(M.endCycle(r1.eoc));
  const r2 = M.runCycle(c2, SET, 0.5, 40, M.MEASURED.eocEfpd.cycle2);
  const d2 = M.MEASURED.letdown.cycle2.map(([e, b]) => at(r2.steps, e) - b);
  assert.ok(rms(d2) < 25, `cycle 2 letdown RMS ${rms(d2).toFixed(1)} ppm`);
  const own2 = M.runCycle(c2, SET, 0.5);
  assert.ok(Math.abs(own2.efpd / M.MEASURED.eocEfpd.cycle2 - 1) < 0.1, `cycle 2 ${own2.efpd.toFixed(0)} EFPD vs 272.7`);
  // The committed end-of-Cycle-1 burnups are what this calibration gives.
  r1.eoc.forEach((a, i) => {
    if (a) assert.ok(Math.abs(a.burnup - M.PRESET_EOC1[i]) < 0.02, `${M.posName(i)} ${a.burnup} vs ${M.PRESET_EOC1[i]}`);
  });
});

test("fuel management physics: fresh fuel on the rim leaks neutrons and shortens the cycle", () => {
  // From the plant's low-leakage Cycle 2, swap each fresh orbit on the outer ring with the most burned interior orbit.
  const eoc1 = M.beavrsCycle1().map((a, i) => (a ? { ...a, burnup: M.PRESET_EOC1[i] } : null));
  const plant = M.beavrsCycle2(M.endCycle(eoc1));
  const ring = (i) => Math.max(Math.abs(Math.floor(i / 15) - 7), Math.abs((i % 15) - 7));
  const orbits = M.QUARTER.filter((i) => M.orbit(i).length === 4);
  const freshInside = orbits.filter((i) => plant[i].cycles === 0 && ring(i) < 6);
  const burnedRim = orbits.filter((i) => plant[i].cycles > 0 && ring(i) >= 6).sort((a, b) => plant[a].burnup - plant[b].burnup);
  let outIn = plant;
  for (let k = 0; k < Math.min(freshInside.length, burnedRim.length); k++) outIn = M.swapOrbits(outIn, freshInside[k], burnedRim[k]) ?? outIn;
  const rimFresh = (core) => orbits.filter((i) => core[i].cycles === 0 && ring(i) >= 6).length;
  assert.ok(rimFresh(outIn) > rimFresh(plant), "more fresh fuel on the rim");
  const a = M.runCycle(plant, SET, 0.5);
  const b = M.runCycle(outIn, SET, 0.5);
  assert.ok(b.efpd < a.efpd, `out-in ${b.efpd.toFixed(0)} EFPD should be shorter than the plant's ${a.efpd.toFixed(0)}`);
});

test("reload moves keep the inventory and the symmetry; the next outage discharges the most burned fuel", () => {
  const eoc1 = M.beavrsCycle1().map((a, i) => (a ? { ...a, burnup: M.PRESET_EOC1[i] } : null));
  const c2 = M.beavrsCycle2(M.endCycle(eoc1));
  const [p, q] = [M.QUARTER[3], M.QUARTER[20]];
  const swapped = M.swapOrbits(c2, p, q);
  assert.deepEqual(fuel(swapped).map((a) => a.id).sort(), fuel(c2).map((a) => a.id).sort());
  for (const i of M.orbit(p)) assert.equal(swapped[i].e, c2[M.orbit(q)[M.orbit(p).indexOf(i)]].e);
  assert.equal(M.swapOrbits(c2, 7 * 15 + 7, p), null, "the centre cannot swap with a 4-orbit");
  const r = M.runCycle(c2, SET, 1.0);
  const next = M.nextOutage(r.eoc, { e: 3.4, ba: 0 }, 3);
  assert.equal(fuel(next).filter((a) => a.cycles === 0).length, 64);
  const kept = fuel(next).filter((a) => a.cycles > 0);
  const gone = fuel(r.eoc).filter((a) => !kept.some((k) => k.id === a.id));
  assert.equal(gone.length, 64);
  const keptMin = Math.min(...kept.map((a) => a.burnup));
  const goneMin = Math.min(...gone.map((a) => a.burnup));
  assert.ok(goneMin >= keptMin, "discharged fuel is the more burned fuel, orbit by orbit");
});

test("a player's lattice set is validated, and 'preset' fills the shift and worth", () => {
  assert.equal(M.parseLatticeSet("not json").ok, false);
  const good = {
    version: 1,
    name: "t",
    source: "s",
    reference: "r",
    refBoronPpm: 975,
    hfpShift: "preset",
    boronWorth: "preset",
    curves: [{ e: 3.1, ba: 0, k: [[0, 1.2], [10, 1.1]] }],
  };
  const p = M.parseLatticeSet(JSON.stringify(good), SET);
  assert.equal(p.ok, true);
  assert.equal(p.set.hfpShift, SET.hfpShift);
  assert.equal(M.parseLatticeSet(JSON.stringify(good)).ok, false, "'preset' without a preset is refused");
  assert.equal(M.parseLatticeSet(JSON.stringify({ ...good, hfpShift: 0, boronWorth: 0, curves: [{ e: 3.1, ba: 0, k: [[1, 1.2], [2, 1.1]] }] })).ok, false, "must start at 0");
  assert.equal(M.parseLatticeSet(JSON.stringify({ ...good, hfpShift: 0, boronWorth: 0.1 })).ok, false, "boron worth must be negative and small");
});
