#!/usr/bin/env node
// The Day-5 fuel shuffle must be solvable by reasoning. This test caught a real bug: the old rule
// (Fq < 1.48 with at most 4 fresh on the rim) had a best-possible Fq of ~1.46, so only ~1 in 18,000
// legal layouts passed and the capstone of the week was a needle search.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(mkdtempSync(join(tmpdir(), "cc-shuffle-")), "model.mjs");
const bundled = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/shuffleModel.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (bundled.status !== 0) throw new Error(bundled.stderr || bundled.stdout || "esbuild failed");
const M = await import(out);

const ENRICH = [3.5, 4.5, 5.0, 8.5];

function pen(f) {
  return f.fq + Math.max(0, f.rim - M.RIM_MAX) * 20;
}

/** Best single swap by the penalty a player would feel (Fq plus rim overshoot). */
function climb(start, enrich) {
  let grid = start.slice();
  let cur = pen(M.fluxOf(grid, enrich));
  let swaps = 0;
  for (;;) {
    let best = cur;
    let pick = null;
    for (let a = 0; a < 36; a++) {
      for (let b = a + 1; b < 36; b++) {
        if (grid[a] === grid[b]) continue;
        const t = grid.slice();
        [t[a], t[b]] = [t[b], t[a]];
        const p = pen(M.fluxOf(t, enrich));
        if (p < best - 1e-9) {
          best = p;
          pick = t;
        }
      }
    }
    if (!pick) break;
    grid = pick;
    cur = best;
    swaps += 1;
    if (swaps > 60) break;
  }
  return { grid, swaps, flux: M.fluxOf(grid, enrich) };
}

test("start map is not a plateau: a single swap can lower Fq", () => {
  const g = M.startMap();
  const f0 = M.fluxOf(g, 4.5).fq;
  let better = 0;
  for (let a = 0; a < 36; a++)
    for (let b = a + 1; b < 36; b++) {
      if (g[a] === g[b]) continue;
      const t = g.slice();
      [t[a], t[b]] = [t[b], t[a]];
      if (M.fluxOf(t, 4.5).fq < f0 - 1e-9) better += 1;
    }
  assert.ok(better > 0, "no single swap improves the start map");
  assert.equal(g.filter((v) => v === 0).length, 12);
  assert.equal(g.filter((v) => v === 1).length, 12);
  assert.equal(g.filter((v) => v === 2).length, 12);
});

test("start map does not already pass", () => {
  for (const e of ENRICH) assert.equal(M.passes(M.fluxOf(M.startMap(), e), 99), false);
});

test("greedy play from the start map reaches the pass band at every enrichment", () => {
  for (const e of ENRICH) {
    const r = climb(M.startMap(), e);
    assert.ok(M.passes(r.flux, Math.max(r.swaps, 3)), `enrich ${e}: fq ${r.flux.fq.toFixed(3)} rim ${r.flux.rim.toFixed(3)}`);
  }
});

test("pass band has real margin: guided play lands well under the limit", () => {
  // Greedy climbs from 40 seeded scatters. The best legal result must clear Fq by a comfortable margin.
  let best = Infinity;
  let rim = 1;
  for (let seed = 1; seed <= 40; seed++) {
    let x = seed >>> 0;
    const rnd = () => ((x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296);
    const g = M.startMap();
    for (let k = 35; k > 0; k--) {
      const j = Math.floor(rnd() * (k + 1));
      [g[k], g[j]] = [g[j], g[k]];
    }
    const r = climb(g, 4.5);
    if (r.flux.rim <= M.RIM_MAX && r.flux.fq < best) {
      best = r.flux.fq;
      rim = r.flux.rim;
    }
  }
  assert.ok(best < M.FQ_MAX - 0.05, `margin too thin: best Fq ${best.toFixed(3)} (rim ${rim.toFixed(3)})`);
});

test("the trade-off is real: out-in is flat but leaks, in-out is quiet on the rim but peaks", () => {
  const order = [...Array(36).keys()].sort(
    (a, b) => Math.hypot(b % 6 - 2.5, Math.floor(b / 6) - 2.5) - Math.hypot(a % 6 - 2.5, Math.floor(a / 6) - 2.5),
  );
  const outIn = Array(36).fill(0);
  const inOut = Array(36).fill(0);
  order.forEach((c, k) => {
    outIn[c] = k < 12 ? 0 : k < 24 ? 1 : 2;
    inOut[c] = k < 12 ? 2 : k < 24 ? 1 : 0;
  });
  const a = M.fluxOf(outIn, 4.5);
  const b = M.fluxOf(inOut, 4.5);
  assert.ok(a.fq < M.FQ_MAX && a.rim > M.RIM_MAX, "out-in must fail on leakage");
  assert.ok(b.fq >= M.FQ_MAX && b.rim <= M.RIM_MAX, "in-out must fail on Fq");
});
