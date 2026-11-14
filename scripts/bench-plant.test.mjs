import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
function bundle(rel) {
  const out = join(mkdtempSync(join(tmpdir(), "cc-benchp-")), "m.mjs");
  const built = spawnSync(
    process.env.ESBUILD ?? "npx",
    [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, rel), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
    { encoding: "utf8", cwd: root },
  );
  if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
  return out;
}
const P = await import(bundle("src/game/plant.ts"));
const B = await import(bundle("src/game/benchStep.ts"));

test("default PWR design matches the type constant at the 62% seed", () => {
  const run = { powerPct: 62, flowPct: 100 };
  const designed = P.benchThermal(P.DEFAULT_PLANT, run);
  const typed = P.benchThermal("pwr", run);
  assert.equal(designed.dT, typed.dT);
  assert.equal(designed.dT, (62 / 100) * 32);
  assert.equal(P.DEFAULT_PLANT.dT, 32);
  assert.equal(P.SEED_POWER_PCT, 62);
});

test("a non-default design ΔT is the bench's unit, not the type constant", () => {
  const design = { ...P.DEFAULT_PLANT, dT: 48 };
  const ts = P.benchThermal(design, { powerPct: 62, flowPct: 100 });
  assert.equal(ts.dT, (62 / 100) * 48);
  assert.notEqual(ts.dT, (62 / 100) * 32);
  const step = B.stepBench({ power: 62, rods: 62, flow: 100, hold: 0, dt: 0, plant: design, lastWritten: null });
  const typed = B.stepBench({ power: 62, rods: 62, flow: 100, hold: 0, dt: 0, plant: "pwr", lastWritten: null });
  assert.equal(step.power, typed.power);
  const hot = P.benchThermal(design, { powerPct: step.power, flowPct: 100 });
  const hotType = P.benchThermal("pwr", { powerPct: typed.power, flowPct: 100 });
  assert.ok(Math.abs(hot.dT - hotType.dT) > 1);
});
