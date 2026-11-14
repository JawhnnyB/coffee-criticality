import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(mkdtempSync(join(tmpdir(), "cc-bowl-")), "bowl.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/bowlModel.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const M = await import(out);

// Raw toppled counts for aim -0.24 rad, power 1, dt 1/60 s, two rolls.
// k is recomputed outside this file from those counts: 1/6.
const AIM = -0.24;
const POWER = 1;
const DT = 1 / 60;

test("a seeded roll reports generation k from pins toppled per roll", () => {
  const gens = M.seededRolls({ aim: AIM, power: POWER, dt: DT, rolls: 2 });
  const falls = gens.map((g) => g.falls);
  assert.deepEqual(falls, [6, 1]);
  assert.equal(gens[0].k, null);
  assert.equal(gens[1].k, 1 / 6);
  assert.equal(M.generationK(falls[0], falls[1]), 1 / 6);
});
