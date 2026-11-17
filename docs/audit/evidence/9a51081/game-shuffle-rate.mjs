import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const es = "/tmp/esb/node_modules/.bin/esbuild";
const out = join(mkdtempSync(join(tmpdir(), "cc-sh-")), "m.mjs");
const r = spawnSync(es, ["/root/work/coffee/src/game/shuffleModel.ts", "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], { encoding: "utf8" });
if (r.status) throw new Error(r.stderr);
const M = await import(out);
function pen(f) { return f.fq + Math.max(0, f.rim - M.RIM_MAX) * 20; }
function climb(start, enrich) {
  let grid = start.slice();
  let cur = pen(M.fluxOf(grid, enrich));
  let swaps = 0;
  for (;;) {
    let best = cur, pick = null;
    for (let a = 0; a < 36; a++) for (let b = a + 1; b < 36; b++) {
      if (grid[a] === grid[b]) continue;
      const t = grid.slice();
      [t[a], t[b]] = [t[b], t[a]];
      const p = pen(M.fluxOf(t, enrich));
      if (p < best - 1e-9) { best = p; pick = t; }
    }
    if (!pick) break;
    grid = pick; cur = best; swaps += 1;
    if (swaps > 60) break;
  }
  return { swaps, flux: M.fluxOf(grid, enrich) };
}
let pass = 0, bestFq = Infinity;
for (let seed = 1; seed <= 1000; seed++) {
  let x = seed >>> 0;
  const rnd = () => ((x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296);
  const g = M.startMap();
  for (let k = 35; k > 0; k--) {
    const j = Math.floor(rnd() * (k + 1));
    [g[k], g[j]] = [g[j], g[k]];
  }
  const res = climb(g, 4.5);
  if (res.flux.fq < bestFq) bestFq = res.flux.fq;
  if (M.passes(res.flux, res.swaps)) pass += 1;
}
const start = climb(M.startMap(), 4.5);
console.log(JSON.stringify({ pass, rate: pass / 1000, bestFq, startFq: start.flux.fq, startRim: start.flux.rim, startSwaps: start.swaps, fqMax: M.FQ_MAX, rimMax: M.RIM_MAX, minSwaps: M.MIN_SWAPS }));
