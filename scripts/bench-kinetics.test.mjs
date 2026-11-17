#!/usr/bin/env node
// The bench's point kinetics (benchStep.ts). Every number printed here is computed by stepBench.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(mkdtempSync(join(tmpdir(), "cc-kin-")), "benchStep.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/benchStep.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const M = await import(out);
const TYPES = ["pwr", "bwr", "pebble", "msr"];

/** Run the bench for `seconds` with fixed controls. Scram limits are not the subject here, so the caller keeps clear of them. */
function settle(plant, start, rods, flow, seconds, flowRef = 100) {
  let f = { power: start, rods, flow, hold: 0, dt: 0.05, plant, lastWritten: null, flowRef, rodPos: start };
  let peak = start;
  let low = start;
  for (let t = 0; t < seconds; t += 0.05) {
    const r = M.stepBench(f);
    peak = Math.max(peak, r.power);
    low = Math.min(low, r.power);
    f = { ...f, power: r.power, precursors: r.precursors, rodPos: r.rodPos, hold: 0, lastWritten: r.lastWritten };
    if (r.scram) return { power: r.power, peak, low, scram: true, rhoPcm: r.rhoPcm };
  }
  const last = M.stepBench({ ...f, dt: 0.001 });
  return { power: last.power, peak, low, scram: false, rhoPcm: last.rhoPcm };
}

test("at the reference flow, power comes to rest on the rod percent with zero reactivity", () => {
  for (const plant of TYPES) {
    const r = settle(plant, 62, 80, 100, 240);
    console.log(JSON.stringify({ check: "rest", plant, power: +r.power.toFixed(3), rhoPcm: +r.rhoPcm.toFixed(3) }));
    assert.equal(r.scram, false, plant);
    assert.ok(Math.abs(r.power - 80) < 0.1, `${plant} rests at ${r.power}`);
    assert.ok(Math.abs(r.rhoPcm) < 1, `${plant} rho ${r.rhoPcm}`);
  }
});

test("a design flow other than 100 does not move the seeded power", () => {
  const r = settle("pwr", 62, 62, 115, 60, 115);
  console.log(JSON.stringify({ check: "seed-holds", power: +r.power.toFixed(4), peak: +r.peak.toFixed(4), low: +r.low.toFixed(4) }));
  assert.ok(Math.abs(r.peak - 62) < 0.01 && Math.abs(r.low - 62) < 0.01);
});

test("power approaches the new rest point from below, without overshoot", () => {
  for (const plant of TYPES) {
    const r = settle(plant, 62, 85, 100, 120);
    console.log(JSON.stringify({ check: "no-overshoot", plant, peak: +r.peak.toFixed(3) }));
    assert.ok(r.peak <= 85.05, `${plant} peaked at ${r.peak}`);
  }
});

test("the rods walk to the slider at the stated speed, and reactivity is positive on the way up", () => {
  const first = M.stepBench({ power: 62, rods: 100, flow: 100, hold: 0, dt: 1, plant: "pwr", lastWritten: 62, rodPos: 62 });
  console.log(JSON.stringify({ check: "rod-walk", rodPos: +first.rodPos.toFixed(3), power: +first.power.toFixed(3), rhoPcm: +first.rhoPcm.toFixed(1) }));
  assert.ok(Math.abs(first.rodPos - (62 + M.KINETICS.rodSpeed)) < 1e-6);
  assert.ok(first.power > 62 && first.power < 62 + M.KINETICS.rodSpeed);
  assert.ok(first.rhoPcm > 0);
});

test("the first instant after a rod step is the prompt jump: n = beta * c / (beta - rho)", () => {
  const r = M.stepBench({ power: 62, rods: 70, flow: 100, hold: 0, dt: 1e-6, plant: "pwr", lastWritten: 62, precursors: 62, rodPos: 70 });
  const rho = r.rhoPcm / 1e5;
  const expected = (M.KINETICS.beta * 62) / (M.KINETICS.beta - rho);
  console.log(JSON.stringify({ check: "prompt-jump", power: +r.power.toFixed(4), expected: +expected.toFixed(4), rhoPcm: +r.rhoPcm.toFixed(2) }));
  assert.ok(r.power > 62.5, "power jumped");
  assert.ok(Math.abs(r.power - expected) < 0.01);
  assert.ok(rho < M.KINETICS.beta, "below prompt critical");
});

test("less flow at the same rods rests at lower power, more flow at higher power, on every type", () => {
  for (const plant of TYPES) {
    const base = settle(plant, 70, 70, 100, 240).power;
    const slow = settle(plant, 70, 70, 85, 240).power;
    const fast = settle(plant, 70, 70, 115, 240).power;
    console.log(JSON.stringify({ check: "flow-feedback", plant, slow: +slow.toFixed(2), base: +base.toFixed(2), fast: +fast.toFixed(2) }));
    assert.ok(slow < base - 0.2, `${plant} slow ${slow}`);
    assert.ok(fast > base + 0.2, `${plant} fast ${fast}`);
  }
});

test("every coolant coefficient is negative and every power defect is positive", () => {
  for (const plant of TYPES) {
    assert.ok(M.COOLANT_COEFF[plant] < 0, plant);
    assert.ok(M.POWER_DEFECT[plant] > 0, plant);
  }
});
