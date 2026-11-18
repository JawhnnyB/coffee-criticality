// Fit the outage simulator to measured BEAVRS data and write src/game/outage/calibration.ts.
//
// Stage 1, core constants (M², reflector absorption, axial shift):
//   the Cycle 1 core at hot zero power, 975 ppm, beginning of life, built from the NUREG/IA-0529 k∞ values,
//   must be critical (the measured all-rods-out boron), and its radial power should match the measured
//   zero-power detector map (58 instrumented assemblies).
// Stage 2, preset lattice burnup behaviour (slope, absorber burnout and residual, HFP shift, boron worth):
//   the plant's real Cycle 1 then its real Cycle 2 loading, depleted at hot full power for the measured cycle
//   lengths, should follow the measured boron letdown (spec Table 24, 41 points).
// Stage 1b, power feedback: one coefficient, fitted to two measured at-power maps (Cycle 1 near 1 GWd/t,
//   Cycle 2 at its start), with stage 2's parameters held at the previous fit, then stage 2 is refitted.
// The other at-power detector maps are not fitted. They are reported as an independent check.
//
// Run: ESBUILD=/path/to/esbuild node scripts/outage-calibrate.mjs
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-cal-"));
const entry = join(dir, "entry.ts");
writeFileSync(
  entry,
  ["core", "preset", "lattice", "calibration"].map((f) => `export * from ${JSON.stringify(join(root, `src/game/outage/${f}.ts`))};`).join("\n"),
);
const out = join(dir, "m.mjs");
const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], {
  encoding: "utf8",
});
if (built.status !== 0) throw new Error(built.stderr);
const M = await import(out);

// Nelder–Mead on unconstrained parameters.
function nelderMead(f, x0, scale, iters = 400) {
  const n = x0.length;
  let simplex = [x0, ...x0.map((_, i) => x0.map((v, j) => (i === j ? v + scale[j] : v)))].map((x) => ({ x, f: f(x) }));
  for (let it = 0; it < iters; it++) {
    simplex.sort((a, b) => a.f - b.f);
    const best = simplex[0];
    const worst = simplex[n];
    if (Math.abs(worst.f - best.f) < 1e-10 * (1 + Math.abs(best.f))) break;
    const c = Array.from({ length: n }, (_, j) => simplex.slice(0, n).reduce((s, p) => s + p.x[j], 0) / n);
    const at = (t) => c.map((v, j) => v + t * (worst.x[j] - v));
    const r = { x: at(-1) };
    r.f = f(r.x);
    if (r.f < best.f) {
      const e = { x: at(-2) };
      e.f = f(e.x);
      simplex[n] = e.f < r.f ? e : r;
    } else if (r.f < simplex[n - 1].f) simplex[n] = r;
    else {
      const k = { x: at(r.f < worst.f ? -0.5 : 0.5) };
      k.f = f(k.x);
      if (k.f < Math.min(r.f, worst.f)) simplex[n] = k;
      else simplex = simplex.map((p, i) => (i === 0 ? p : { x: p.x.map((v, j) => best.x[j] + 0.5 * (v - best.x[j])), f: NaN })).map((p) => (Number.isNaN(p.f) ? { x: p.x, f: f(p.x) } : p));
    }
  }
  simplex.sort((a, b) => a.f - b.f);
  return simplex[0];
}

// The detectors are fission chambers in each assembly's instrument tube: they read local thermal flux, not
// assembly power. Absorber rods sit next to that tube and depress the reading, which a one-group model cannot
// show. So the comparison is model assembly flux against detectors in assemblies without absorber rods.
function mapRms(phi, map, core) {
  const flux = M.assemblyFlux(phi);
  const pts = map.filter(([p]) => !core || core[M.posIndex(p)].ba === 0 || core[M.posIndex(p)].cycles > 0).map(([p, v]) => [v, flux[M.posIndex(p)]]);
  const norm = pts.length / pts.reduce((s, x) => s + x[1], 0);
  return Math.sqrt(pts.reduce((s, x) => s + (x[1] * norm - x[0]) ** 2, 0) / pts.length);
}

// ---------- Stage 1
const hzp = M.MEASURED.maps.find((m) => m.cycle === 1 && m.days === 0);
const c1 = M.beavrsCycle1();
// Built from the preset's BOL values (the NUREG k∞ exactly) at 975 ppm, through the same node map the game uses.
const bolSet = M.presetSet({ slope: 0, baBurnout: 1, baResidual: 0, hfpShift: 0, boronWorth: -1e-4 }, "");
const bolMap = M.nodeMap(c1, bolSet, 0);
M.CORE.feedback = 0; // hot zero power: no power, no feedback
const stage1 = (x) => {
  const m2 = Math.exp(x[0]);
  const refl = Math.exp(x[1]);
  const crit = M.critical(bolMap, m2, undefined, refl);
  return mapRms(crit.sol.phi, hzp.map, c1);
};
const s1 = nelderMead(stage1, [Math.log(60), Math.log(0.5)], [0.3, 1.0], 80);
const m2 = Math.exp(s1.x[0]);
const reflectorAbs = Math.exp(s1.x[1]);
const crit0 = M.critical(bolMap, m2, undefined, reflectorAbs);
Object.assign(M.CORE, { m2, reflectorAbs, axialShift: crit0.shift });
const hzpAll = mapRms(crit0.sol.phi, hzp.map, null);
console.log(`stage 1: M² ${m2.toFixed(2)} cm², reflector absorption ${reflectorAbs.toFixed(4)}, axial shift ${crit0.shift.toFixed(5)}, HZP flux RMS ${(s1.f * 100).toFixed(2)}% at assemblies without absorbers, ${(hzpAll * 100).toFixed(1)}% at all 58`);

// ---------- Stage 1b
const PREV = { slope: 0.0115, baBurnout: 6.0, baResidual: 0.00002, hfpShift: -0.0522, boronWorth: -0.000145 };
const FB_MAPS = M.MEASURED.maps.filter((m) => (m.cycle === 1 && m.days === 92) || (m.cycle === 2 && m.days === 5));
function mapAt(m, p) {
  const set = M.presetSet(p, "");
  const c1run = m.cycle === 2 ? M.runCycle(M.beavrsCycle1(), set, 1.0, 40, M.MEASURED.eocEfpd.cycle1) : null;
  const start = m.cycle === 1 ? M.beavrsCycle1() : M.beavrsCycle2(M.endCycle(c1run.eoc));
  const r = M.runCycle(start, set, 0.25, 40, Math.max((m.burnup * 1000) / M.SPECIFIC_POWER, 0.01));
  const crit = M.criticalAtPower(M.nodeMap(r.eoc, set));
  return mapRms(crit.sol.phi, m.map, r.eoc);
}
let fbBest = { fb: 0, f: Infinity };
// Bounded at 0.04: hfpShift (about -0.052) less a typical equilibrium-xenon worth (about -0.028) leaves a
// zero-to-full-power defect near -0.024, so a local coefficient much above 0.04 is not physical. Above about
// 0.05 the fixed-point iteration also stops converging.
for (const fb of [0, 0.01, 0.02, 0.03, 0.04]) {
  M.CORE.feedback = fb;
  const f = Math.sqrt(FB_MAPS.reduce((s, m) => s + mapAt(m, PREV) ** 2, 0) / FB_MAPS.length);
  console.log(`  feedback ${fb}: at-power map RMS ${(f * 100).toFixed(1)}%`);
  if (f < fbBest.f) fbBest = { fb, f };
}
M.CORE.feedback = fbBest.fb;
console.log(`stage 1b: feedback ${fbBest.fb}, fitted maps RMS ${(fbBest.f * 100).toFixed(1)}%`);

// ---------- Stage 2
const { letdown, eocEfpd } = M.MEASURED;
function plantCycles(p, step = 0.5) {
  const set = M.presetSet(p, "");
  const r1 = M.runCycle(M.beavrsCycle1(), set, step, 40, eocEfpd.cycle1);
  const r2 = M.runCycle(M.beavrsCycle2(M.endCycle(r1.eoc)), set, step, 40, eocEfpd.cycle2);
  return { r1, r2, set };
}
function ppmAt(steps, efpd) {
  for (let i = 1; i < steps.length; i++) {
    if (efpd <= steps[i].efpd) {
      const a = steps[i - 1];
      const b = steps[i];
      return a.ppm + ((b.ppm - a.ppm) * (efpd - a.efpd)) / (b.efpd - a.efpd);
    }
  }
  return steps[steps.length - 1].ppm;
}
const unpack = (x) => ({
  slope: Math.exp(x[0]),
  baBurnout: Math.exp(x[1]),
  baResidual: 1 / (1 + Math.exp(-x[2])),
  hfpShift: x[3],
  boronWorth: -Math.exp(x[4]),
});
const resid = (p, step) => {
  const { r1, r2 } = plantCycles(p, step);
  const d1 = letdown.cycle1.map(([e, b]) => ppmAt(r1.steps, e) - b);
  const d2 = letdown.cycle2.map(([e, b]) => ppmAt(r2.steps, e) - b);
  return { d1, d2, r1, r2 };
};
let evals = 0;
const stage2 = (x) => {
  const { d1, d2 } = resid(unpack(x), 1.0);
  const sse = [...d1, ...d2].reduce((s, d) => s + d * d, 0);
  if (++evals % 20 === 0) console.log(`  stage 2 eval ${evals}: RMS ${Math.sqrt(sse / (d1.length + d2.length)).toFixed(1)} ppm`);
  return sse;
};
// Start near the fit found on a coarser mesh; the fit itself runs at 1 GWd/t steps and is checked at 0.25 below.
const s2 = nelderMead(stage2, [Math.log(PREV.slope), Math.log(PREV.baBurnout), -4, PREV.hfpShift, Math.log(-PREV.boronWorth)], [0.1, 0.3, 1, 0.005, 0.1], 160);
const fit = unpack(s2.x);
const fine = resid(fit, 0.25);
const rms = (d) => Math.sqrt(d.reduce((s, v) => s + v * v, 0) / d.length);
const fit1 = rms(fine.d1);
const fit2 = rms(fine.d2);
console.log("stage 2:", Object.fromEntries(Object.entries(fit).map(([k, v]) => [k, +v.toPrecision(5)])));
console.log(`letdown RMS: cycle 1 ${fit1.toFixed(1)} ppm (${fine.d1.length} points), cycle 2 ${fit2.toFixed(1)} ppm (${fine.d2.length} points)`);

// ---------- Independent checks: at-power maps (not fitted), and the model's own cycle lengths to 0 ppm.
const set = M.presetSet(fit, "");
const checks = [];
for (const m of M.MEASURED.maps.filter((x) => !(x.cycle === 1 && x.days === 0))) {
  const fitted = FB_MAPS.includes(m);
  const start = m.cycle === 1 ? M.beavrsCycle1() : M.beavrsCycle2(M.endCycle(fine.r1.eoc));
  const efpd = (m.burnup * 1000) / M.SPECIFIC_POWER;
  const r = M.runCycle(start, set, 0.25, 40, Math.max(efpd, 0.01));
  const crit = M.criticalAtPower(M.nodeMap(r.eoc, set));
  const n = m.map.filter(([p]) => r.eoc[M.posIndex(p)].ba === 0 || r.eoc[M.posIndex(p)].cycles > 0).length;
  checks.push({ cycle: m.cycle, burnup: m.burnup, rms: mapRms(crit.sol.phi, m.map, r.eoc), n, fitted });
}
for (const c of checks) console.log(`${c.fitted ? "fitted" : "check "} map cycle ${c.cycle} at ${c.burnup} GWd/t: flux RMS ${(c.rms * 100).toFixed(1)}% over ${c.n} detectors without absorbers`);
const own1 = M.runCycle(M.beavrsCycle1(), set, 0.25);
const own2 = M.runCycle(M.beavrsCycle2(M.endCycle(fine.r1.eoc)), set, 0.25);
console.log(`own cycle length to 0 ppm: cycle 1 ${own1.efpd.toFixed(1)} EFPD (measured ${eocEfpd.cycle1}), cycle 2 ${own2.efpd.toFixed(1)} EFPD (measured ${eocEfpd.cycle2})`);
console.log(`model peak assembly power: cycle 1 ${own1.peak.toFixed(3)}, cycle 2 ${own2.peak.toFixed(3)}`);

const report = [
  `HZP detector map ${(s1.f * 100).toFixed(1)}% RMS (assemblies without absorbers, fitted)`,
  `letdown RMS ${fit1.toFixed(0)} ppm cycle 1, ${fit2.toFixed(0)} ppm cycle 2 (fitted)`,
  ...checks.map((c) => `cycle ${c.cycle} detector map at ${c.burnup} GWd/t ${(c.rms * 100).toFixed(1)}% RMS (${c.fitted ? "feedback fit" : "not fitted"})`),
  `cycle length to 0 ppm ${own1.efpd.toFixed(0)} vs ${eocEfpd.cycle1} EFPD, ${own2.efpd.toFixed(0)} vs ${eocEfpd.cycle2} EFPD`,
].join("; ");
const num = (v) => +v.toPrecision(6);
writeFileSync(
  join(root, "src/game/outage/calibration.ts"),
  `/**
 * Written by scripts/outage-calibrate.mjs. Do not edit by hand: rerun the script.
 * Core constants fitted to the measured BEAVRS Cycle 1 zero-power map and 975 ppm critical boron.
 * Preset burnup parameters fitted to the measured BEAVRS boron letdown, Cycles 1 and 2.
 */
export const CORE = { feedback: ${num(M.CORE.feedback)}, m2: ${num(m2)}, reflectorAbs: ${num(reflectorAbs)}, axialShift: ${num(crit0.shift)} };

export const PRESET_FIT = {
  slope: ${num(fit.slope)},
  baBurnout: ${num(fit.baBurnout)},
  baResidual: ${num(fit.baResidual)},
  hfpShift: ${num(fit.hfpShift)},
  boronWorth: ${num(fit.boronWorth)},
};

export const FIT_REPORT = ${JSON.stringify(report)};
`,
);
console.log("wrote src/game/outage/calibration.ts");
