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
