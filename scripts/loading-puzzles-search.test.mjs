// Exhaustive check of the ten loading puzzles (Claude, 23 November 2026).
// For each puzzle: the start does not meet the goal, the stored three-swap line does,
// no map one or two swaps away does, and the goal sits clear of both on the three-decimal screen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "puzzles-"));
const entry = join(dir, "entry.ts");
writeFileSync(
  entry,
  `export * from ${JSON.stringify(join(root, "src/game/loadingPuzzles.ts"))};\n` +
    `export { fluxOf } from ${JSON.stringify(join(root, "src/game/shuffleModel.ts"))};\n`,
);
const out = join(dir, "bundle.cjs");
const esbuild = process.env.ESBUILD || join(root, "node_modules/.bin/esbuild");
execFileSync(esbuild, [entry, "--bundle", "--platform=node", `--outfile=${out}`, "--log-level=error"]);
const P = createRequire(import.meta.url)(out);

const pairs = [];
for (let i = 0; i < 36; i++) for (let j = i + 1; j < 36; j++) pairs.push([i, j]);

for (const p of P.loadingPuzzles()) {
  test(`puzzle ${p.id}: three swaps is the shortest honest answer`, () => {
    assert.equal(P.meets(p, p.start), false, "the start must not already meet the goal");
    const end = P.applySwaps(p.start, p.swaps);
    assert.equal(P.meets(p, end), true, "the stored line meets the goal");
    const lineFq = P.shownFq(P.fluxOf(end, P.PUZZLE_ENRICH).fq);
    assert.ok(lineFq < p.fqMax, "the stored line reads under the goal on screen");
    let best2 = Infinity;
    for (const a of pairs) {
      if (p.start[a[0]] === p.start[a[1]]) continue;
      const g1 = P.applySwaps(p.start, [a]);
      assert.equal(P.meets(p, g1), false, `one swap ${a} must not meet the goal`);
      for (const b of pairs) {
        if (g1[b[0]] === g1[b[1]]) continue;
        const g2 = P.applySwaps(g1, [b]);
        assert.equal(P.meets(p, g2), false, `two swaps ${a} ${b} must not meet the goal`);
        const f = P.fluxOf(g2, P.PUZZLE_ENRICH);
        if (f.rim < p.rimMax) best2 = Math.min(best2, f.fq);
      }
    }
    // The best two-swap map must read clearly above the goal (not equal at three decimals).
    assert.ok(P.shownFq(best2) > p.fqMax, `best two-swap map reads ${P.shownFq(best2)}, goal ${p.fqMax}`);
    assert.ok(p.fqMax < P.fluxOf(p.start, P.PUZZLE_ENRICH).fq, "the goal improves the peak");
  });
}
