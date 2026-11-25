/**
 * The crew remembers you from one week to the next.
 *
 * The owner, 25 November 2026: a new week used to wipe everything, so the closest scenes (Mabel's chalk,
 * Tommy's lock, Jordan's lane) were reached with two or three people at most and then erased. Now a new week
 * keeps the people: trust, who you've met, the scenes and moments you've had, what they gave you, and the
 * outage's progress. The plant, the incidents, culture, catches and hides start fresh: a new week is a new
 * chance to be honest, with people who already know you.
 *
 * Stored in the machine profile (profile.ts), which a new week never wipes. save.ts and sim.ts are untouched:
 * the week is wiped exactly as before, then the crew is put back after you pick your badge.
 */
import { profileGet, profileSet } from "./profile";
import type { NpcId } from "./content";

export const CREW_IDS: readonly NpcId[] = ["mabel", "holt", "elena", "tommy", "marcus", "priya", "jordan"];

/** Set on the shift's flags in any week after the first. Talks and tiers read it. */
export const RETURNING_FLAG = "crew:returning";

/**
 * Flags that belong to the relationship, not the week. Named ones: met, the choices you made with them, what they
 * gave you. Prefixes: trust scenes seen, crew moments had, and the outage's progress.
 * Week-only flags stay behind on purpose: elenaSecondEyes (Valve 14 this week), holtAfternoon, the end-of-day
 * flags, jordanCredit, anything about this week's catches and hides.
 */
export const CARRY_NAMED: readonly string[] = [
  ...CREW_IDS.map((id) => `${id}Talked`),
  "arcade",
  "elenaReactor",
  "elenaVan",
  "holtBoard",
  "holtDeferred",
  "jordanLater",
  "jordanQuiet",
  "jordanSaid",
  "jordanTrust",
  "mabelChalk",
  "mabelHeard",
  "marcusChecked",
  "marcusSay",
  "marcusSheet",
  "momentOwned",
  "outageOpen",
  "priyaSheet",
  "priyaWalk",
  "tommyLeft",
  "tommyLock",
  "tommyTry",
];
export const CARRY_PREFIXES: readonly string[] = ["social:", "moment:", "outage:"];

export interface CrewCarry {
  /** The week just finished: 1 after the first week. The next week is week + 1. */
  week: number;
  trust: Partial<Record<NpcId, number>>;
  flags: string[];
}

export function carriedFlag(key: string): boolean {
  return CARRY_NAMED.includes(key) || CARRY_PREFIXES.some((p) => key.startsWith(p));
}

/** What a finished (or abandoned) week leaves with the crew. Null when there was no shift to remember. */
export function snapshotCrew(
  s: { role: unknown; trust: Record<string, number>; flags: Record<string, boolean> },
  prior: CrewCarry | null,
): CrewCarry | null {
  if (!s.role) return prior;
  const trust: Partial<Record<NpcId, number>> = {};
  for (const id of CREW_IDS) if (typeof s.trust[id] === "number") trust[id] = s.trust[id];
  const flags = Object.keys(s.flags).filter((k) => s.flags[k] && carriedFlag(k)).sort();
  return { week: (prior?.week ?? 0) + 1, trust, flags };
}

/** Put the crew back on a fresh shift. Trust only moves toward what they felt; the floor is the starting trust. */
export function applyCrew(s: { trust: Record<string, number>; flags: Record<string, boolean> }, carry: CrewCarry | null): number {
  if (!carry || carry.week < 1) return 1;
  for (const id of CREW_IDS) {
    const t = carry.trust[id];
    if (typeof t === "number" && t > (s.trust[id] ?? -100)) s.trust[id] = t;
  }
  for (const k of carry.flags) if (carriedFlag(k)) s.flags[k] = true;
  s.flags[RETURNING_FLAG] = true;
  return carry.week + 1;
}

function valid(o: unknown): CrewCarry | null {
  if (!o || typeof o !== "object") return null;
  const c = o as Partial<CrewCarry>;
  if (typeof c.week !== "number" || !Array.isArray(c.flags) || !c.trust || typeof c.trust !== "object") return null;
  return { week: c.week, trust: c.trust, flags: c.flags.filter((f): f is string => typeof f === "string") };
}

export function readCarry(): CrewCarry | null {
  try {
    return valid((profileGet("carry") as unknown) ?? null);
  } catch {
    return null;
  }
}

export function writeCarry(c: CrewCarry | null): void {
  profileSet("carry", c);
}
