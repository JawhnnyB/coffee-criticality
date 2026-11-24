/**
 * Outage discharge against the teaching pattern. Does not edit the shuffle pass rule.
 * Fresh fuel on the rim is what this pattern discharges. The score is overlap, not a plant figure.
 */
import { isRim, startMap, type Burn } from "./shuffleModel";

/** Fresh assemblies on the rim of this map. */
export function referenceDischarge(grid: readonly Burn[] = startMap()): number[] {
  const out: number[] = [];
  for (let i = 0; i < grid.length; i++) if (grid[i] === 0 && isRim(i)) out.push(i);
  return out;
}

export interface DischargeScore {
  matched: number;
  wanted: number;
  picked: number;
  /** 0 to 100. Extras dilute the score. Perfect only when the pick is the pattern. */
  points: number;
}

export function scoreDischarge(picks: readonly number[], grid: readonly Burn[] = startMap()): DischargeScore {
  const want = new Set(referenceDischarge(grid));
  const uniq = [...new Set(picks)];
  let matched = 0;
  for (const i of uniq) if (want.has(i)) matched += 1;
  const wanted = want.size;
  const denom = Math.max(uniq.length, wanted, 1);
  return { matched, wanted, picked: uniq.length, points: Math.round((100 * matched) / denom) };
}
