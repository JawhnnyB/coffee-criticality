/**
 * What the Core Map remembers between openings (spec 14.2: an app reopens without losing state).
 * The grid and the swap count live on results. Swaps never set shuffleDone, and only the pass path
 * writes the save. A saved value that does not check out is treated as absent, never as v1.
 */
import { N, startMap, type Burn } from "./shuffleModel";

export interface CoreMapSave {
  grid: Burn[];
  swaps: number;
}

/** Checks a saved Core Map. Anything malformed returns null and the map starts from startMap(). */
export function sanitizeCoreMap(x: unknown): CoreMapSave | null {
  if (!x || typeof x !== "object") return null;
  const { grid, swaps } = x as { grid?: unknown; swaps?: unknown };
  if (!Array.isArray(grid) || grid.length !== N * N) return null;
  if (!grid.every((v) => v === 0 || v === 1 || v === 2)) return null;
  if (typeof swaps !== "number" || !Number.isInteger(swaps) || swaps < 0) return null;
  return { grid: [...(grid as Burn[])], swaps };
}

/** The Core Map as it stands when the window opens. */
export function readCoreMap(saved: CoreMapSave | null | undefined): CoreMapSave {
  return saved ? { grid: [...saved.grid], swaps: saved.swaps } : { grid: startMap(), swaps: 0 };
}

/** The Core Map as it stands after a swap. Copies, so the caller can keep its own grid. */
export function rememberCoreMap(grid: readonly Burn[], swaps: number): CoreMapSave {
  return { grid: [...grid], swaps };
}
