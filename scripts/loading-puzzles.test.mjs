import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-pz-"));
const entry = join(dir, "entry.ts");
writeFileSync(entry, `export { loadingPuzzles, minSwaps, gradePuzzle, notePuzzleMet, readPuzzleMet, PUZZLE_LINES, peakOf } from ${JSON.stringify(join(root, "src/game/loadingPuzzles.ts"))};\n`);
const out = join(dir, "pz.mjs");
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
const M = await import(out);

function apply(start, swaps) {
  const a = start.slice();
  for (const [i, j] of swaps) {
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

test("each puzzle takes 3 to 5 swaps, and search finds no 1-swap or 2-swap answer", () => {
  const list = M.loadingPuzzles();
  assert.equal(list.length, 10);
  const ids = new Set();
  for (const p of list) {
    assert.equal(ids.has(p.id), false);
    ids.add(p.id);
    assert.ok(p.par >= 3 && p.par <= 5, `${p.id} par ${p.par}`);
    assert.equal(p.limit, p.par + 2);
    assert.equal(p.swaps.length, p.par);
    assert.deepEqual(apply(p.start, p.swaps), p.target);
    const found = M.minSwaps(p.start, p.target, 5);
    assert.equal(found, p.par, `${p.id} search ${found} wanted ${p.par}`);
    assert.equal(M.minSwaps(p.start, p.target, 2), -1, `${p.id} is reachable in 1 or 2`);
    assert.equal(M.gradePuzzle(p, p.start, 0).met, false);
    assert.equal(M.gradePuzzle(p, p.target, p.par).grade, "A");
    assert.equal(M.gradePuzzle(p, p.target, p.limit).met, true);
    assert.equal(M.gradePuzzle(p, p.target, p.limit + 1).met, false);
    assert.ok(M.peakOf(p.target) > 1);
  }
  for (const line of Object.values(M.PUZZLE_LINES)) {
    assert.ok(line.length <= 92, line);
    assert.equal(line.includes("!"), false, line);
  }
  store.clear();
  assert.deepEqual(M.notePuzzleMet(3), [3]);
  assert.deepEqual(M.notePuzzleMet(3), [3]);
  assert.deepEqual(M.readPuzzleMet(), [3]);
  assert.equal(store.has("cc.save.v2"), false);
});
