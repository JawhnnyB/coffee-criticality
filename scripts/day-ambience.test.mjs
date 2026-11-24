import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-amb-"));
const entry = join(dir, "entry.ts");
writeFileSync(entry, `export { dayLayers, stepPa, PA_GAP } from ${JSON.stringify(join(root, "src/game/audio.ts"))};\n`);
const out = join(dir, "amb.mjs");
const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], {
  encoding: "utf8",
  cwd: root,
});
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
const A = await import(out);

test("days add an office hum, the coffee machine, and a distant page", () => {
  const office = A.dayLayers("control", "play");
  assert.equal(office.office, true);
  assert.equal(office.coffee, false);
  assert.equal(office.pa, true);
  const cafe = A.dayLayers("cafe", "play");
  assert.equal(cafe.coffee, true);
  assert.equal(cafe.office, false);
  assert.equal(cafe.pa, true);
  assert.equal(A.dayLayers("engineering", "dialogue").office, true);
  assert.equal(A.dayLayers("gate", "play").pa, false);
  assert.equal(A.dayLayers("control", "menu").office, false);
  assert.equal(A.stepPa(0, 1, false).acc, 0);
  const almost = A.stepPa(A.PA_GAP - 0.2, 0.1, true);
  assert.equal(almost.fire, false);
  const page = A.stepPa(A.PA_GAP - 0.2, 0.3, true);
  assert.equal(page.fire, true);
  assert.equal(page.acc, 0);
});
