import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(mkdtempSync(join(tmpdir(), "cc-bench-")), "benchStep.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/benchStep.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const M = await import(out);

function frame(over = {}) {
  return { power: 62, rods: 62, flow: 100, hold: 0, dt: 0.016, plant: "pwr", lastWritten: null, ...over };
}

test("a frame that does not change the rounded power writes once, then not again", () => {
  const first = M.stepBench(frame());
  assert.ok(first.write, "the first sample is a change");
  assert.equal(first.write.scram, undefined);
  const again = M.stepBench(frame({ power: first.power, hold: first.hold, lastWritten: first.lastWritten }));
  assert.equal(again.write, null);
  const third = M.stepBench(frame({ power: again.power, hold: again.hold, lastWritten: again.lastWritten }));
  assert.equal(third.write, null);
});

test("moving the rods writes once for the new percent, and the next tiny frame does not", () => {
  const moved = M.stepBench(frame({ rods: 100, dt: 1, lastWritten: 62 }));
  assert.ok(moved.write);
  assert.ok(Math.round(moved.power) !== 62);
  const coast = M.stepBench(frame({ power: moved.power, rods: 100, dt: 0.001, hold: moved.hold, lastWritten: moved.lastWritten }));
  assert.equal(coast.write, null);
});

test("a scram is one write, and it carries the scram flag", () => {
  const tripped = M.stepBench(frame({ power: 100, rods: 100, flow: 40, lastWritten: 100 }));
  assert.equal(tripped.scram, true);
  assert.equal(tripped.write.scram, true);
  assert.equal(tripped.passed, false);
});

test("holding the band passes once, and the next frame does not write a second pass", () => {
  const crossing = M.stepBench(frame({ power: 100, rods: 100, hold: 7.9, dt: 0.2, lastWritten: 100 }));
  assert.equal(crossing.passed, true);
  assert.match(crossing.msg, /Band held/);
  const after = M.stepBench(frame({ power: crossing.power, rods: 100, hold: crossing.hold, dt: 0.2, lastWritten: crossing.lastWritten }));
  assert.equal(after.passed, false);
  assert.equal(after.msg, null);
});
