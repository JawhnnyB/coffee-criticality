/**
 * Ten loading puzzles. Each target is a permutation of eight assemblies.
 * Par is the fewest swaps that reach it. The move limit is two past par.
 * Search (minSwaps) is what checks the par. No target is a one-swap or two-swap peak.
 */
const KEY = "cc.puzzles";

export const PUZZLE_LINES = {
  met: "Met.",
  over: "Not the target.",
  out: "Out of moves.",
  note: "Each target takes three to five swaps. Par is the fewest. The limit is two past par.",
} as const;

export interface Puzzle {
  id: number;
  title: string;
  start: string[];
  target: string[];
  /** Fewest swaps. Checked by search. */
  par: number;
  limit: number;
  /** One shortest path, used by the test. The board does not show it. */
  swaps: [number, number][];
}

const NAMES = ["A", "B", "C", "D", "E", "F", "G", "H"];

/** Reactivity used only to print a peak. Not the pass rule. */
const WEIGHT: Record<string, number> = { A: 1.34, B: 1.22, C: 1.12, D: 1.02, E: 0.92, F: 0.82, G: 0.72, H: 0.6 };

function apply(start: readonly string[], swaps: readonly [number, number][]): string[] {
  const a = start.slice();
  for (const [i, j] of swaps) {
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

const SPECS: { id: number; title: string; swaps: [number, number][] }[] = [
  { id: 1, title: "Rim batch", swaps: [[0, 3], [0, 2], [0, 1]] },
  { id: 2, title: "Centre shift", swaps: [[0, 4], [0, 3], [0, 2], [0, 1]] },
  { id: 3, title: "Checker row", swaps: [[0, 5], [0, 4], [0, 3], [0, 2], [0, 1]] },
  { id: 4, title: "Three pairs", swaps: [[0, 1], [2, 3], [4, 5]] },
  { id: 5, title: "Split batch", swaps: [[0, 2], [0, 1], [3, 6], [3, 5], [3, 4]] },
  { id: 6, title: "Inner ring", swaps: [[2, 5], [2, 4], [2, 3]] },
  { id: 7, title: "Edge and pair", swaps: [[0, 3], [0, 2], [0, 1], [4, 5]] },
  { id: 8, title: "Odd seats", swaps: [[1, 7], [1, 5], [1, 3]] },
  { id: 9, title: "Long move", swaps: [[0, 4], [0, 3], [0, 2], [0, 1], [5, 6]] },
  { id: 10, title: "Two groups", swaps: [[0, 3], [0, 2], [0, 1], [4, 6], [4, 5]] },
];

export function loadingPuzzles(): Puzzle[] {
  return SPECS.map((s) => ({
    id: s.id,
    title: s.title,
    start: NAMES.slice(),
    target: apply(NAMES, s.swaps),
    par: s.swaps.length,
    limit: s.swaps.length + 2,
    swaps: s.swaps.map((pair) => [pair[0], pair[1]] as [number, number]),
  }));
}

/** Assembly peak of this row. A classroom proxy, not a core calculation. */
export function peakOf(layout: readonly string[]): number {
  let max = 0;
  let sum = 0;
  layout.forEach((id, i) => {
    const r = Math.abs(i - (layout.length - 1) / 2) / (layout.length / 2);
    const p = (WEIGHT[id] ?? 1) * (1.12 - 0.35 * r);
    sum += p;
    if (p > max) max = p;
  });
  return sum === 0 ? 0 : max / (sum / layout.length);
}

/** Fewest swaps of any two seats. -1 if the search gives up past `cap`. */
export function minSwaps(start: readonly string[], goal: readonly string[], cap = 6): number {
  const g = goal.join("");
  const s0 = start.join("");
  if (s0 === g) return 0;
  const n = start.length;
  const seen = new Set<string>([s0]);
  let layer = [start.slice()];
  for (let dist = 1; dist <= cap; dist++) {
    const next: string[][] = [];
    for (const cur of layer) {
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const copy = cur.slice();
          const t = copy[i];
          copy[i] = copy[j];
          copy[j] = t;
          const key = copy.join("");
          if (seen.has(key)) continue;
          if (key === g) return dist;
          seen.add(key);
          next.push(copy);
        }
      }
    }
    layer = next;
    if (!layer.length) return -1;
  }
  return -1;
}

export function gradePuzzle(puzzle: Puzzle, grid: readonly string[], moves: number): { met: boolean; grade: "A" | "B" | "C" | "F"; peak: number } {
  const same = grid.length === puzzle.target.length && grid.every((v, i) => v === puzzle.target[i]);
  const peak = peakOf(grid);
  if (!same || moves > puzzle.limit) return { met: false, grade: "F", peak };
  if (moves <= puzzle.par) return { met: true, grade: "A", peak };
  if (moves === puzzle.par + 1) return { met: true, grade: "B", peak };
  return { met: true, grade: "C", peak };
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
