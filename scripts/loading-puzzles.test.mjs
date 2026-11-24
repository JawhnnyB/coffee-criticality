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
writeFileSync(
  entry,
  [
    `export { loadingPuzzles, applySwaps, gradePuzzle, notePuzzleMet, readPuzzleMet, PUZZLE_LINES, PUZZLE_ENRICH } from ${JSON.stringify(join(root, "src/game/puzzleBoards.ts"))};`,
    `export { fluxOf } from ${JSON.stringify(join(root, "src/game/shuffleModel.ts"))};`,
  ].join("\n"),
);
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

function pairs(g) {
  const idx = [[], [], []];
  for (let i = 0; i < 36; i++) idx[g[i]].push(i);
  const list = [];
  for (let a = 0; a < 3; a++)
    for (let b = a + 1; b < 3; b++)
      for (const i of idx[a]) for (const j of idx[b]) list.push([i, j]);
  return list;
}

/** Lowest Fq within `depth` swaps that also keeps rim share under the goal. */
function bestFq(start, depth, rimMax) {
  const root = start.join("");
  const seen = new Set([root]);
  let layer = [root];
  let best = Infinity;
  for (let d = 1; d <= depth; d++) {
    const next = [];
    for (const key of layer) {
      const g = Array.from(key, Number);
      for (const [i, j] of pairs(g)) {
        const a = g[i];
        const b = g[j];
        g[i] = b;
        g[j] = a;
        const k = g.join("");
        g[i] = a;
        g[j] = b;
        if (seen.has(k)) continue;
        seen.add(k);
        next.push(k);
      }
    }
    for (const key of next) {
      const f = M.fluxOf(Array.from(key, Number), M.PUZZLE_ENRICH);
      if (f.rim < rimMax && f.fq < best) best = f.fq;
    }
    layer = next;
  }
  return best;
}

test("each puzzle is a lower peak that takes three swaps, and search finds no one-swap or two-swap answer", () => {
  const list = M.loadingPuzzles();
  assert.equal(list.length, 10);
  const ids = new Set();
  const starts = new Set();
  for (const p of list) {
    assert.equal(ids.has(p.id), false);
    ids.add(p.id);
    assert.equal(starts.has(p.start.join("")), false);
    starts.add(p.start.join(""));
    assert.equal(p.start.length, 36);
    assert.equal(p.start.filter((v) => v === 0).length, 12);
    assert.equal(p.start.filter((v) => v === 1).length, 12);
    assert.equal(p.start.filter((v) => v === 2).length, 12);
    assert.equal(p.par, 3);
    assert.equal(p.limit, 5);
    assert.equal(p.swaps.length, 3);
    assert.equal(p.rimMax, 0.5);
    const from = M.fluxOf(p.start, M.PUZZLE_ENRICH);
    assert.ok(p.fqMax < from.fq, `${p.id} target does not improve the peak`);
    const solved = M.applySwaps(p.start, p.swaps);
    const got = M.fluxOf(solved, M.PUZZLE_ENRICH);
    assert.ok(got.fq < p.fqMax && got.rim < p.rimMax, `${p.id} witness misses`);
    assert.ok(got.fq < from.fq, `${p.id} witness is not a lower peak`);
    const short = bestFq(p.start, 2, p.rimMax);
    assert.ok(short >= p.fqMax, `${p.id} a 1- or 2-swap map reaches ${short} under ${p.fqMax}`);
    assert.equal(M.gradePuzzle(p, p.start, 0).met, false);
    assert.equal(M.gradePuzzle(p, solved, 3).grade, "A");
    assert.equal(M.gradePuzzle(p, solved, 5).grade, "C");
    assert.equal(M.gradePuzzle(p, solved, 6).met, false);
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
