/**
 * Cycle 1 → Cycle 2 discharge. The plant's own set is the Cycle 1 positions
 * no Cycle 2 "from" points back to. FuelShuffle does not teach this.
 */
import { BEAVRS } from "./beavrs";
import { N, endCycle, posName, type Core } from "./core";

export const DISCHARGE_COUNT = 64;

/** One line. The holes get fresh fuel; the shuffle is what moves it. */
export const DISCHARGE_RULE =
  "Discharge the least reactive, most-burned fuel. Fresh fuel goes where the shuffle puts it.";

export const DISCHARGE_FACT = "64 of the 65 1.6% assemblies came out.";

export interface FreshSpec {
  e: number;
  ba: number;
}

/** Cycle-1 indexes that Cycle 2 does not carry forward. */
export function realDischarge(): number[] {
  const kept = new Set<number>();
  for (const row of BEAVRS.cycle2) {
    for (const cell of row) {
      if (cell && "from" in cell && cell.from) {
        const [r, c] = cell.from;
        kept.add(r * N + c);
      }
    }
  }
  const out: number[] = [];
  BEAVRS.cycle1.flat().forEach((cell, i) => {
    if (cell && !kept.has(i)) out.push(i);
  });
  return out;
}

/** The 64 fresh assemblies Cycle 2 actually loaded, in core order. */
export function cycle2Fresh(): FreshSpec[] {
  const out: FreshSpec[] = [];
  for (const row of BEAVRS.cycle2) {
    for (const cell of row) {
      if (cell && !("from" in cell)) {
        const f = cell as { e: number; ba: number };
        out.push({ e: f.e, ba: f.ba });
      }
    }
  }
  return out;
}

/** How many of the chosen indexes are in the plant's discharge. Duplicates count once. */
export function dischargeScore(chosen: readonly number[], real: readonly number[] = realDischarge()): number {
  const want = new Set(real);
  const seen = new Set<number>();
  let n = 0;
  for (const i of chosen) {
    if (seen.has(i)) continue;
    seen.add(i);
    if (want.has(i)) n += 1;
  }
  return n;
}

/**
 * Take the chosen assemblies out. Fresh fuel fills those holes, in core order,
 * from the plant's fresh batch. What stays keeps its burnup and moves on a cycle.
 */
export function afterDischarge(eoc: Core, chosen: readonly number[], fresh: readonly FreshSpec[] = cycle2Fresh()): Core {
  const drop = new Set(chosen);
  const core = endCycle(eoc).map((a) => (a ? { ...a } : null));
  const holes = [...drop].filter((i) => i >= 0 && i < core.length && core[i]).sort((a, b) => a - b);
  const last = fresh[fresh.length - 1] ?? { e: 3.2, ba: 0 };
  holes.forEach((i, k) => {
    const f = fresh[k] ?? last;
    core[i] = { id: `C2-fresh-${posName(i)}`, e: f.e, ba: f.ba, burnup: 0, cycles: 0 };
  });
  return core;
}
