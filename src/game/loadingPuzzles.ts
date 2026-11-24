/**
 * Ten loading puzzles. The target peak is the best one-swap Fq of that grid, from fluxOf.
 * No target is a typed constant. The shuffle pass rule is not used here.
 */
import { N, fluxOf, startMap, type Burn } from "./shuffleModel";

export interface Puzzle {
  id: number;
  grid: Burn[];
  targetFq: number;
}

export const PUZZLE_LINES = {
  met: "Met.",
  over: "Over the target.",
  note: "Target is this model's best one-swap peak. Not a plant figure.",
} as const;

const KEY = "cc.puzzles";

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function scrambled(seed: number): Burn[] {
  const grid = startMap();
  const rand = rng(seed);
  let guard = 0;
  let done = 0;
  while (done < 4 && guard < 80) {
    guard += 1;
    const a = Math.floor(rand() * N * N);
    const b = Math.floor(rand() * N * N);
    if (a === b || grid[a] === grid[b]) continue;
    const hold = grid[a];
    grid[a] = grid[b];
    grid[b] = hold;
    done += 1;
  }
  return grid;
}

/** Lowest Fq one swap can reach, including the grid as it stands. */
export function bestSwapFq(grid: readonly Burn[], enrich: number): number {
  let best = fluxOf(grid, enrich).fq;
  for (let a = 0; a < N * N; a++) {
    for (let b = a + 1; b < N * N; b++) {
      if (grid[a] === grid[b]) continue;
      const t = grid.slice() as Burn[];
      t[a] = grid[b];
      t[b] = grid[a];
      const fq = fluxOf(t, enrich).fq;
      if (fq < best) best = fq;
    }
  }
  return best;
}

export function loadingPuzzles(enrich: number): Puzzle[] {
  const out: Puzzle[] = [];
  let salt = 1;
  while (out.length < 10 && salt < 400) {
    const grid = scrambled(salt);
    salt += 1;
    const here = fluxOf(grid, enrich).fq;
    const targetFq = bestSwapFq(grid, enrich);
    if (!(targetFq < here - 1e-6)) continue;
    out.push({ id: out.length + 1, grid, targetFq });
  }
  return out;
}

function sameFuel(a: readonly Burn[], b: readonly Burn[]): boolean {
  if (a.length !== b.length) return false;
  const count = (g: readonly Burn[], n: Burn) => g.filter((v) => v === n).length;
  return count(a, 0) === count(b, 0) && count(a, 1) === count(b, 1) && count(a, 2) === count(b, 2);
}

export function gradePuzzle(puzzle: Puzzle, grid: readonly Burn[], enrich: number): { met: boolean; fq: number } {
  const fq = fluxOf(grid, enrich).fq;
  const met = sameFuel(grid, puzzle.grid) && fq <= puzzle.targetFq + 1e-9;
  return { met, fq };
}

export function readPuzzleMet(): number[] {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || "{}") as { met?: unknown };
    if (!Array.isArray(o.met)) return [];
    return o.met.filter((n) => Number.isInteger(n) && n >= 1 && n <= 10);
  } catch {
    return [];
  }
}

export function notePuzzleMet(id: number): number[] {
  const met = [...new Set([...readPuzzleMet(), id])].sort((a, b) => a - b);
  try {
    localStorage.setItem(KEY, JSON.stringify({ met }));
  } catch {
    /* private mode */
  }
  return met;
}
