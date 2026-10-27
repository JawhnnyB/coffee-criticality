/**
 * Fuel shuffle teaching model: pure, no React. FuelShuffle.tsx renders it; scripts/shuffle-model.test.mjs
 * proves the pass rule is solvable by reasoning (not a needle search).
 *
 * The lesson is a trade-off, not a rule of thumb:
 *   - fresh fuel on the rim flattens power (low Fq) but the rim leaks neutrons (high rim share);
 *   - fresh fuel in the middle keeps neutrons in but peaks the centre (high Fq).
 * "Low-leakage loading" lives between the two: burned fuel toward the rim, fresh fuel scattered inside.
 * Rim share is a leakage proxy (power produced where neutrons can leave), not a leakage calculation.
 */
export const N = 6;
export type Burn = 0 | 1 | 2;

/** Pass band. Fq under FQ_MAX *and* rim share at most RIM_MAX, after at least MIN_SWAPS swaps. */
export const FQ_MAX = 1.5;
export const RIM_MAX = 0.5;
export const MIN_SWAPS = 3;

/**
 * Outage inventory as it came out of the pool: scattered, 12 fresh / 12 once / 12 twice.
 * Chosen so Fq is 1.67, rim share is 0.46, and every swap that helps is visible (no flat plateau).
 */
const START_ROWS = "120201202011211200011010220102222110";

export function startMap(): Burn[] {
  return Array.from(START_ROWS, (c) => Number(c) as Burn);
}

export function isRim(i: number): boolean {
  const x = i % N;
  const y = Math.floor(i / N);
  return x === 0 || y === 0 || x === N - 1 || y === N - 1;
}

export interface Flux {
  power: number[];
  fq: number;
  avg: number;
  max: number;
  /** Share of core power produced on the outer ring of assemblies. */
  rim: number;
}

export function fluxOf(grid: readonly Burn[], enrich: number): Flux {
  const power: number[] = [];
  let sum = 0;
  let max = 0;
  let rimSum = 0;
  for (let i = 0; i < N * N; i++) {
    const x = i % N;
    const y = Math.floor(i / N);
    const r = Math.hypot(x - 2.5, y - 2.5) / 3.6;
    const fresh = 1.35 - grid[i] * 0.38;
    const shape = 1.12 - 0.55 * r;
    let couple = 0;
    for (const n of [i - 1, i + 1, i - N, i + N]) {
      if (n < 0 || n >= N * N) continue;
      if (Math.abs((n % N) - x) + Math.abs(Math.floor(n / N) - y) !== 1) continue;
      couple += 0.08 * (1.2 - grid[n] * 0.3);
    }
    const p = Math.max(0.15, fresh * shape * (0.85 + enrich / 10) + couple);
    power.push(p);
    sum += p;
    if (p > max) max = p;
    if (isRim(i)) rimSum += p;
  }
  const avg = sum / (N * N);
  return { power, fq: max / avg, avg, max, rim: rimSum / sum };
}

export function passes(flux: Flux, swaps: number): boolean {
  return flux.fq < FQ_MAX && flux.rim <= RIM_MAX && swaps >= MIN_SWAPS;
}
