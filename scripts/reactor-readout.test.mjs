// CORE CAM mapping, core health, and the colour-safe ramp. Spec sections 6 and 7.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-readout-"));

function bundle(name) {
  const out = join(dir, name + ".mjs");
  const built = spawnSync(
    process.env.ESBUILD ?? "npx",
    [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/" + name + ".ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
    { encoding: "utf8", cwd: root },
  );
  if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
  return import(out);
}

const R = await bundle("reactorReadout");
const M = await bundle("schematicMath");

const residue = { valve: "open", tag: "open", dose: "open", log: "open" };
const plant = {
  type: "pwr",
  powerMW: 1100,
  dT: 32,
  flow: 100,
  enrich: 4.5,
  fuelTempK: 900,
  coolantTempK: 580,
  fuelDensity: 10.97,
  coolantDensity: 0.7,
  scale: "core",
  depletion: false,
  fullCore: false,
  reflector: false,
  burnupMWd_kg: 0,
  sizeClass: 1,
};

test("core health is 100 when every part is full, and drops by the weight when one part is zero", () => {
  const full = R.coreHealth({ inBandFrac: 1, incidentOpen: false, residue, k: 1 });
  assert.equal(full.score, 100);
  const noBand = R.coreHealth({ inBandFrac: 0, incidentOpen: false, residue, k: 1 });
  assert.equal(noBand.score, 60);
  const incident = R.coreHealth({ inBandFrac: 1, incidentOpen: true, residue, k: 1 });
  assert.equal(incident.score, 80);
});

test("a hide lowers the residue part, and a catch does not", () => {
  const hid = R.coreHealth({ inBandFrac: 1, incidentOpen: false, residue: { ...residue, valve: "hid" }, k: 1 });
  const caught = R.coreHealth({ inBandFrac: 1, incidentOpen: false, residue: { ...residue, valve: "caught" }, k: 1 });
  assert.ok(hid.score < 100);
  assert.equal(caught.score, 100);
});

test("more power means more glow and more particles, and more flow means faster particles", () => {
  const low = R.camFrame(plant, { powerPct: 20, flowPct: 100, scram: false });
  const high = R.camFrame(plant, { powerPct: 100, flowPct: 100, scram: false });
  const fast = R.camFrame(plant, { powerPct: 100, flowPct: 140, scram: false });
  assert.ok(high.glow > low.glow);
  assert.ok(high.count > low.count);
  assert.ok(fast.speed > high.speed);
  assert.ok(high.tFuel > high.tHot && high.tHot > high.tCold);
});

test("reduced motion asks for zero particles, and a full core draws more cells than the window", () => {
  assert.equal(R.particleCount(40, true), 0);
  assert.equal(R.particleCount(40, false), 40);
  assert.ok(R.cellCount("core", 1, true) > R.cellCount("core", 1, false));
  assert.equal(R.cellCount("core", 1, false), 9);
  assert.equal(R.cellCount("rod", 2, true), 1);
});

test("burnup stays pending, and the daily row does not invent a mass", () => {
  const row = R.makeDaily({ day: 2, inBandFrac: 1, incidentOpen: false, residue, k: 1 });
  assert.equal(row.burnup, null);
  assert.equal(row.coreHealth, 100);
  assert.match(R.BURNUP_PENDING, /Pending verification/);
});

test("colour-safe marks use the listed palette, one per band, and no grey ramp", () => {
  const listed = new Set(["#f3e6d0", "#16110d"]);
  assert.equal(M.BAND_TICK.length, 7);
  for (const c of M.BAND_TICK) assert.ok(listed.has(c), `${c} is a listed token`);
  for (const c of M.BANDS) assert.ok(/^#[0-9a-f]{6}$/.test(c));
  assert.equal(M.SAFE_BANDS, undefined, "the grey ramp is gone");
});

test("band time is the last day, after the clock resets", () => {
  const week = [
    { t: 500, inBand: true },
    { t: 900, inBand: true },
    { t: 420, inBand: false },
    { t: 500, inBand: false },
  ];
  assert.equal(R.inBandFraction(week), 0);
  assert.equal(R.lastDaySlice(week).length, 2);
});

test("higher burnup dims the glow, and scram eases to 0.15 over three seconds", () => {
  const run = { powerPct: 80, flowPct: 100, scram: false };
  const fresh = R.camFrame({ ...plant, burnupMWd_kg: 0 }, run);
  const burned = R.camFrame({ ...plant, burnupMWd_kg: 60 }, run);
  assert.ok(burned.glow < fresh.glow);
  const hot = R.camFrame(plant, { powerPct: 100, flowPct: 100, scram: false });
  const cold = R.camFrame(plant, { powerPct: 100, flowPct: 100, scram: true });
  assert.ok(Math.abs(cold.glow - hot.glow * 0.15) < 1e-9);
  assert.equal(R.easeScram(1, true, 3), 0.15);
  assert.ok(R.easeScram(0.15, false, 3) > 0.15 && R.easeScram(0.15, false, 3) < 1);
});

test("scram clears the flow, vapor rises, and the downcomer falls", () => {
  const dots = [{ x: 40, y: 40, lane: 0 }];
  R.stepFlow(dots, 4, 100, "pwr", 0.1, true);
  assert.equal(dots.length, 0);
  const vapor = [{ x: 40, y: 40, lane: 0 }];
  R.stepFlow(vapor, 1, 100, "bwr", 0.1, false);
  assert.ok(vapor[0].y < 40);
  const down = [{ x: 20, y: 40, lane: 0 }];
  R.stepFlow(down, 1, 100, "pwr", 0.1, false);
  assert.ok(down[0].y > 40);
});

test("core map uses passes and does not set shuffleDone", () => {
  const src = readFileSync(join(root, "src/game/ReactorApps.tsx"), "utf8");
  assert.match(src, /passes\(/);
  assert.doesNotMatch(src, /shuffleDone/);
});
