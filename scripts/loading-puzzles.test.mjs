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
    `export { fluxOf, startMap, N } from ${JSON.stringify(join(root, "src/game/shuffleModel.ts"))};`,
    `export { loadingPuzzles, bestSwapFq, gradePuzzle, notePuzzleMet, readPuzzleMet, PUZZLE_LINES } from ${JSON.stringify(join(root, "src/game/loadingPuzzles.ts"))};`,
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

test("ten puzzles, each graded against a peak the model computed", () => {
  const enrich = 4.5;
  const list = M.loadingPuzzles(enrich);
  assert.equal(list.length, 10);
  const ids = new Set();
  for (const p of list) {
    assert.equal(ids.has(p.id), false);
    ids.add(p.id);
    assert.equal(p.grid.length, M.N * M.N);
    assert.equal(p.grid.filter((v) => v === 0).length, 12);
    const here = M.fluxOf(p.grid, enrich).fq;
    assert.ok(p.targetFq < here - 1e-6);
    assert.ok(Math.abs(p.targetFq - M.bestSwapFq(p.grid, enrich)) < 1e-12);
    assert.equal(M.gradePuzzle(p, p.grid, enrich).met, false);
    let solved = null;
    for (let a = 0; a < 36 && !solved; a++) {
      for (let b = a + 1; b < 36; b++) {
        if (p.grid[a] === p.grid[b]) continue;
        const t = p.grid.slice();
        t[a] = p.grid[b];
        t[b] = p.grid[a];
        if (M.fluxOf(t, enrich).fq <= p.targetFq + 1e-9) {
          solved = t;
          break;
        }
      }
    }
    assert.ok(solved);
    assert.equal(M.gradePuzzle(p, solved, enrich).met, true);
    const cheated = p.grid.slice();
    cheated[0] = 0;
    assert.equal(M.gradePuzzle(p, cheated, enrich).met, false);
  }
  for (const line of Object.values(M.PUZZLE_LINES)) {
    assert.ok(line.length <= 78, line);
    assert.equal(line.includes("!"), false, line);
  }
  store.clear();
  assert.deepEqual(M.notePuzzleMet(3), [3]);
  assert.deepEqual(M.notePuzzleMet(3), [3]);
  assert.deepEqual(M.readPuzzleMet(), [3]);
  assert.equal(store.has("cc.save.v2"), false);
});
