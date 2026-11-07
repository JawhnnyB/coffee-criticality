#!/usr/bin/env node
// One thermal model for the trainer, the control room, CORE CAM, and Results (plant.ts thermalState).
// The numbers pinned here are the trainer's own: at 62% power and 100% flow the PWR bench reads ΔT 19.8 °C.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(mkdtempSync(join(tmpdir(), "cc-thermal-")), "plant.mjs");
const bundled = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/plant.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (bundled.status !== 0) throw new Error(bundled.stderr || bundled.stdout || "esbuild failed");
const M = await import(out);
const TYPES = ["pwr", "bwr", "pebble", "msr"];

test("PWR bench values match the trainer's own readout", () => {
  const t = M.thermalState("pwr", { powerPct: 62, flowPct: 100 });
  assert.ok(Math.abs(t.dT - 19.84) < 0.01, `dT ${t.dT}`);
  assert.equal(t.tCold, 292);
  assert.ok(Math.abs(t.tHot - 311.84) < 0.01);
});

test("ΔT is in band at 100% power and 100% flow for PWR", () => {
  const t = M.thermalState("pwr", { powerPct: 100, flowPct: 100 });
  assert.equal(t.dT, 32);
  assert.equal(t.inBand, true);
});

test("ΔT rises with power and falls with flow, for every plant type", () => {
  for (const type of TYPES) {
    const lo = M.thermalState(type, { powerPct: 40, flowPct: 100 }).dT;
    const hi = M.thermalState(type, { powerPct: 80, flowPct: 100 }).dT;
    assert.ok(hi > lo, `${type} power`);
    const slow = M.thermalState(type, { powerPct: 80, flowPct: 80 }).dT;
    const fast = M.thermalState(type, { powerPct: 80, flowPct: 140 }).dT;
    assert.ok(slow > fast, `${type} flow`);
  }
});

test("fuel is hotter than the hot leg, which is hotter than the cold leg, whenever power is above zero", () => {
  for (const type of TYPES) {
    for (const powerPct of [1, 25, 62, 100]) {
      for (const flowPct of [60, 100, 140]) {
        const t = M.thermalState(type, { powerPct, flowPct });
        assert.ok(t.tFuel > t.tHot, `${type} ${powerPct}/${flowPct} fuel>hot`);
        assert.ok(t.tHot > t.tCold, `${type} ${powerPct}/${flowPct} hot>cold`);
      }
    }
  }
});

test("zero power gives no ΔT and no fuel rise", () => {
  const t = M.thermalState("pwr", { powerPct: 0, flowPct: 100 });
  assert.equal(t.dT, 0);
  assert.equal(t.tFuel, t.tHot);
  assert.equal(t.inBand, false);
});

test("a PlantDesign and its type give the same answer", () => {
  const design = { ...M.DEFAULT_PLANT, type: "bwr" };
  assert.deepEqual(M.thermalState(design, { powerPct: 70, flowPct: 110 }), M.thermalState("bwr", { powerPct: 70, flowPct: 110 }));
});

test("the flow floor keeps ΔT finite at very low flow", () => {
  const t = M.thermalState("pwr", { powerPct: 50, flowPct: 0 });
  assert.ok(Number.isFinite(t.dT));
  assert.equal(t.dT, M.thermalState("pwr", { powerPct: 50, flowPct: 40 }).dT);
});

test("the shared run seeds from the design, not the 62% drill", () => {
  const run = M.seedRun(M.DEFAULT_PLANT);
  assert.equal(run.powerPct, 100);
  assert.equal(run.flowPct, M.DEFAULT_PLANT.flow);
  assert.equal(run.rodsWithdrawnPct, 100);
  assert.equal(run.scram, false);
  assert.deepEqual(run.history, []);
  const custom = M.seedRun({ ...M.DEFAULT_PLANT, flow: 80 });
  assert.equal(custom.flowPct, 80);
});

test("history is per minute while open and per hour while closed, and it caps", () => {
  const run = M.seedRun(M.DEFAULT_PLANT);
  assert.equal(M.shouldSample(run.history, 412, true), true);
  M.pushSample(run, { t: 412, dT: 32, inBand: true, k: 1 });
  assert.equal(M.shouldSample(run.history, 412.4, true), false);
  assert.equal(M.shouldSample(run.history, 413, true), true);
  assert.equal(M.shouldSample(run.history, 419, false), false);
  assert.equal(M.shouldSample(run.history, 420, false), true);
  for (let i = 0; i < M.RUN_HISTORY_CAP + 10; i++) {
    M.pushSample(run, { t: 500 + i, dT: 1, inBand: false, k: 1 });
  }
  assert.equal(run.history.length, M.RUN_HISTORY_CAP);
  assert.equal(run.history[0].t, 500 + 10);
});

test("fuel mass stays pending until someone cites an inventory", () => {
  for (const type of TYPES) assert.equal(M.TEACHING.fuelMassKg[type], null);
});
