import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-seed-"));
const entry = join(dir, "entry.ts");
writeFileSync(entry, `export * from ${JSON.stringify(join(root, "src/game/nightwatch/model.ts"))};\n`);
const out = join(dir, "seed.mjs");
const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], {
  encoding: "utf8",
  cwd: root,
});
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
const W = await import(out);

test("the night keeps the seed that dealt it", () => {
  const n = W.newNight("pwr", 1, 42);
  assert.equal(n.seed, 42);
  const again = W.newNight("pwr", 1, 42);
  assert.equal(again.seed, n.seed);
  assert.equal(again.events.map((e) => e.def.id).join(), n.events.map((e) => e.def.id).join());
  W.setNextNightSeed(99);
  const pending = W.newNight("pwr", 2);
  assert.equal(pending.seed, 99);
  const plain = W.newNight("pwr", 1);
  assert.equal(plain.seed, 1 * 7919 + "pwr".length);
});
