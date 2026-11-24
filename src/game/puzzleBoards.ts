/**
 * Ten loading puzzles on the shuffle's 36-cell flux model.
 * A goal is Fq under X and rim share under Y. X sits halfway between the best map
 * one or two swaps away and a stored three-swap line, so the three-decimal Fq on
 * screen always agrees with the verdict.
 * The board never shows that line.
 */
import { fluxOf, type Burn } from "./shuffleModel";

const KEY = "cc.puzzles";

export const PUZZLE_ENRICH = 4.5;

export const PUZZLE_LINES = {
  met: "Met.",
  over: "Not under the line.",
  out: "Out of moves.",
  note: "Lower the peak. Keep the rim under 50%. Three swaps is the shortest.",
} as const;

export interface Puzzle {
  id: number;
  title: string;
  start: Burn[];
  /** Meet the goal with Fq strictly under this. */
  fqMax: number;
  /** And rim share strictly under this. */
  rimMax: number;
  par: number;
  limit: number;
  /** One three-swap line that meets the goal. Not shown on the board. */
  swaps: [number, number][];
}

const SPECS: { start: string; fqMax: number; swaps: [number, number][] }[] = [
  { start: "120201202011211200011010220102222110", fqMax: 1.456, swaps: [[16, 25], [21, 33], [26, 29]] },
  { start: "122202202011111200011010220102220110", fqMax: 1.482, swaps: [[0, 26], [5, 21], [17, 31]] },
  { start: "120001102012211200011012220112222100", fqMax: 1.476, swaps: [[6, 21], [9, 22], [11, 16]] },
  { start: "100201202012211000011210212100222112", fqMax: 1.445, swaps: [[10, 21], [0, 16], [15, 25]] },
  { start: "121201200100211200012020220101222111", fqMax: 1.491, swaps: [[5, 8], [21, 34], [9, 16]] },
  { start: "120221211011010200111020220112222000", fqMax: 1.476, swaps: [[4, 17], [11, 14], [21, 29]] },
  { start: "120201202011201201011010210202222110", fqMax: 1.473, swaps: [[1, 7], [10, 16], [0, 21]] },
  { start: "220101212001211200011011220102222010", fqMax: 1.469, swaps: [[3, 31], [16, 31], [21, 34]] },
  { start: "120221002021211100011210020102122210", fqMax: 1.445, swaps: [[15, 33], [25, 26], [16, 34]] },
  { start: "120101202012011002011012200102122122", fqMax: 1.475, swaps: [[25, 29], [21, 24], [15, 34]] },
];

function burns(s: string): Burn[] {
  return Array.from(s, (c) => Number(c) as Burn);
}

export function applySwaps(start: readonly Burn[], swaps: readonly [number, number][]): Burn[] {
  const a = start.slice() as Burn[];
  for (const [i, j] of swaps) {
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

export function loadingPuzzles(): Puzzle[] {
  return SPECS.map((s, n) => ({
    id: n + 1,
    title: `Fq under ${s.fqMax.toFixed(3)}`,
    start: burns(s.start),
    fqMax: s.fqMax,
    rimMax: 0.5,
    par: s.swaps.length,
    limit: s.swaps.length + 2,
    swaps: s.swaps.map((pair) => [pair[0], pair[1]] as [number, number]),
  }));
}

/** Fq as the board prints it. The verdict uses the same number the player reads. */
export function shownFq(fq: number): number {
  return Math.round(fq * 1000) / 1000;
}

export function meets(puzzle: Puzzle, grid: readonly Burn[]): boolean {
  const f = fluxOf(grid, PUZZLE_ENRICH);
  return shownFq(f.fq) < puzzle.fqMax && f.rim < puzzle.rimMax;
}

export function gradePuzzle(
  puzzle: Puzzle,
  grid: readonly Burn[],
  moves: number,
): { met: boolean; grade: "A" | "B" | "C" | "F"; fq: number; rim: number } {
  const f = fluxOf(grid, PUZZLE_ENRICH);
  const under = shownFq(f.fq) < puzzle.fqMax && f.rim < puzzle.rimMax;
  if (!under || moves > puzzle.limit) return { met: false, grade: "F", fq: f.fq, rim: f.rim };
  if (moves <= puzzle.par) return { met: true, grade: "A", fq: f.fq, rim: f.rim };
  if (moves === puzzle.par + 1) return { met: true, grade: "B", fq: f.fq, rim: f.rim };
  return { met: true, grade: "C", fq: f.fq, rim: f.rim };
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
