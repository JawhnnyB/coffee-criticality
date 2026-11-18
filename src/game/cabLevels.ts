/**
 * Cabinet levels. Each cabinet with a level ladder starts at level 1. Clearing a level's score unlocks the
 * next. Level 3 at a hosted cabinet also needs the host to trust you (social tier 2), because they set it up.
 * Levels are saved as flags ("cab:<id>:2", "cab:<id>:3"), so the frozen save format is not touched.
 *
 * Not levelled: DELAY (its file is frozen), LOAD and PHYS (they run tested teaching models; a harder setting
 * would change what they teach, not how hard they are).
 */
import type { NpcId } from "./content";
import { socialTier } from "./social";

export type CabLevel = 1 | 2 | 3;

export interface LevelLadder {
  /** Score that clears level 1 and level 2. */
  clear: [number, number];
  host?: NpcId;
  /** What changes, per level, in a few words. */
  what: [string, string, string];
}

export const LADDERS: Record<string, LevelLadder> = {
  catch: { clear: [4, 4], what: ["48 s clock", "40 s clock", "34 s clock"] },
  rods: { clear: [7, 7], what: ["band ±0.28", "band ±0.22", "band ±0.17"] },
  pebble: { clear: [5, 6], what: ["wide gate", "narrower, quicker gate", "narrow, quick gate"] },
  fish: { clear: [4, 5], what: ["calm water", "quicker fish", "quickest fish"] },
  golf: { clear: [8, 8], host: "mabel", what: ["slow greens", "quicker greens", "fast greens"] },
  bowl: { clear: [5, 6], host: "jordan", what: ["dry lane", "the lane drifts", "the lane drifts hard"] },
  horde: { clear: [20, 30], what: ["from round 1", "from round 3", "from round 5"] },
  plot: { clear: [6, 8], what: ["45 s, pests slow", "40 s, more pests", "35 s, pests everywhere"] },
};

const key = (id: string, n: 2 | 3) => `cab:${id}:${n}`;

/** Highest unlocked level. Cabinets without a ladder are always 1. */
export function cabLevel(flags: Record<string, boolean>, id: string): CabLevel {
  if (!LADDERS[id]) return 1;
  if (flags[key(id, 3)]) return 3;
  if (flags[key(id, 2)]) return 2;
  return 1;
}

export interface CabOutcome {
  /** A level unlocked by this run. */
  unlocked: CabLevel | null;
  /** The score cleared the level, but level 3 waits on the host's trust. */
  waitsOn: NpcId | null;
}

/**
 * Record one run. Sets the unlock flag when the score clears the level just played.
 * trust and start are the host's current and starting trust (for the tier check).
 */
export function recordCab(
  flags: Record<string, boolean>,
  id: string,
  level: CabLevel,
  score: number,
  hostTrust?: { trust: number; start: number },
): CabOutcome {
  const ladder = LADDERS[id];
  if (!ladder || level === 3) return { unlocked: null, waitsOn: null };
  if (score < ladder.clear[level - 1]) return { unlocked: null, waitsOn: null };
  const next = (level + 1) as 2 | 3;
  if (flags[key(id, next)]) return { unlocked: null, waitsOn: null };
  if (next === 3 && ladder.host && hostTrust && socialTier(hostTrust.trust, hostTrust.start, 99) < 2) {
    return { unlocked: null, waitsOn: ladder.host };
  }
  flags[key(id, next)] = true;
  return { unlocked: next, waitsOn: null };
}

/** Tuning a cabinet reads for its level. Index 0 is level 1. */
export const TUNE = {
  catchClock: [48, 40, 34],
  rodsBand: [0.28, 0.22, 0.17],
  pebbleGate: [54, 44, 36],
  pebbleGateSpeed: [1, 1.2, 1.4],
  fishSpeed: [1, 1.25, 1.5],
  golfDamp: [2.4, 1.9, 1.5],
  bowlDrift: [0, 8, 14],
  hordeStartRound: [1, 3, 5],
  plotClock: [45, 40, 35],
  plotPest: [1, 1.4, 1.8],
} as const;
