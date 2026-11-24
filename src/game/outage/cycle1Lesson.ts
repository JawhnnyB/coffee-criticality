/**
 * Cycle 1 as a worked example. Counts are read off beavrsCycle1(). No figure is added here.
 */
import { beavrsCycle1 } from "./core";

export interface BatchCount {
  e: number;
  ba: number;
  n: number;
}

export const CYCLE1_TUTORIAL = [
  "Worked example. Cycle 1, fresh, from the benchmark map in this build.",
  "Each cell is enrichment in percent. A second number is absorber rods.",
  "The counts are the map. This screen adds no figures.",
  "Lower-right quarter. The centre of the core is the top-left of this grid.",
] as const;

export function cycle1Batches(): BatchCount[] {
  const map = new Map<string, BatchCount>();
  for (const a of beavrsCycle1()) {
    if (!a) continue;
    const key = `${a.e}/${a.ba}`;
    const cur = map.get(key) ?? { e: a.e, ba: a.ba, n: 0 };
    cur.n += 1;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => b.n - a.n || b.e - a.e || a.ba - b.ba);
}

export function cycle1FuelCount(): number {
  return cycle1Batches().reduce((sum, b) => sum + b.n, 0);
}
