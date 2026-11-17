import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(mkdtempSync(join(tmpdir(), "cc-loto-")), "lototo.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/lototoSlot.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const M = await import(out);

test("200 seeds hit every orange slot, and one seed stays on one slot", () => {
  const seen = new Set();
  for (let seed = 1; seed <= 200; seed++) seen.add(M.lieSlot(seed));
  assert.equal(seen.size, 9);
  for (let slot = 0; slot < 9; slot++) assert.ok(seen.has(slot), `missing slot ${slot}`);
  assert.equal(M.lieSlot(42), M.lieSlot(42));
  assert.equal(M.lieSlot(42), 5);
});
