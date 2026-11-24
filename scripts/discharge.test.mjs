/**
 * The real Cycle 1 discharge, read from beavrs.ts: positions Cycle 2 never points back to.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-discharge-"));
const entry = join(dir, "entry.ts");
writeFileSync(
  entry,
  `export * from ${JSON.stringify(join(root, "src/game/outage/discharge.ts"))};\nexport { beavrsCycle1, posName } from ${JSON.stringify(join(root, "src/game/outage/core.ts"))};\n`,
);
const out = join(dir, "d.mjs");
const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], {
  encoding: "utf8",
  cwd: root,
});
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
const M = await import(out);

test("the real discharge is 64 of the 65 1.6% assemblies, and F14 stayed", () => {
  const c1 = M.beavrsCycle1();
  const low = [];
  c1.forEach((a, i) => {
    if (a && a.e === 1.6) low.push(i);
  });
  assert.equal(low.length, 65);
  const real = M.realDischarge();
  assert.equal(real.length, 64);
  assert.ok(real.every((i) => c1[i] && c1[i].e === 1.6));
  const stayed = low.filter((i) => !real.includes(i));
  assert.deepEqual(stayed.map((i) => M.posName(i)), ["F14"]);
  assert.equal(M.dischargeScore(real), 64);
  const wrong = real.slice(0, 63);
  const other = c1.findIndex((a) => a && a.e !== 1.6);
  wrong.push(other);
  assert.equal(wrong.length, 64);
  assert.equal(M.dischargeScore(wrong), 63);
  const core = M.afterDischarge(c1, real);
  assert.equal(core.filter((a) => a && a.cycles === 0).length, 64);
  assert.equal(core.filter((a) => a && a.id === "C1-F14").length, 1);
  assert.equal(core.filter((a) => a && a.id.startsWith("C1-")).length, 129);
  assert.equal(M.cycle2Fresh().length, 64);
  assert.equal(M.DISCHARGE_FACT, "64 of the 65 1.6% assemblies came out.");
});
