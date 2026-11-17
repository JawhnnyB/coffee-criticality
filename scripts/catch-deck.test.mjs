import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(mkdtempSync(join(tmpdir(), "cc-deck-")), "deck.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/Arcade.tsx"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const M = await import(out);

test("day 1 includes a valve board, and a seed repeats the five boards", () => {
  const a = M.deckSignature(1, 7);
  const b = M.deckSignature(1, 7);
  assert.equal(a.length, 5);
  assert.equal(a[0].kind, "valve");
  assert.ok(a.some((board) => board.kind === "valve"));
  assert.deepEqual(a, b);
  const other = M.deckSignature(1, 8);
  assert.notDeepEqual(a, other);
});
