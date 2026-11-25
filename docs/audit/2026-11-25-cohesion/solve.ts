// A signable Friday plan for the hall's fuel desk, and the swaps that get there from the pool inventory.
import { fluxOf, passes, startMap, type Burn } from "../../../src/game/shuffleModel";
export function solve(enrich: number): { target: Burn[]; swaps: [number, number][] } {
  let rng = 7;
  const rand = () => ((rng = (rng * 1103515245 + 12345) % 2147483648) / 2147483648);
  let g = startMap(); let best = fluxOf(g, enrich);
  const score = (f: ReturnType<typeof fluxOf>) => Math.max(0, f.fq - 1.4) * 5 + Math.max(0, f.rim - 0.48) * 10 + f.fq;
  for (let it = 0; it < 6000; it++) {
    const a = Math.floor(rand() * 36), b = Math.floor(rand() * 36);
    const n = g.slice(); [n[a], n[b]] = [n[b], n[a]];
    const f = fluxOf(n, enrich); if (score(f) <= score(best)) { g = n; best = f; }
  }
  const cur = startMap(); const swaps: [number, number][] = [];
  for (let k = 0; k < 36; k++) {
    if (cur[k] === g[k]) continue;
    let j = k + 1; while (j < 36 && !(cur[j] === g[k] && cur[j] !== g[j])) j++;
    if (j >= 36) { j = k + 1; while (cur[j] !== g[k]) j++; }
    [cur[k], cur[j]] = [cur[j], cur[k]]; swaps.push([k, j]);
  }
  if (!passes(fluxOf(cur, enrich), swaps.length)) throw new Error("no signable plan");
  return { target: g, swaps };
}
