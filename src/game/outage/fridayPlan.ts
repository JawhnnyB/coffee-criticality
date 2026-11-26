/**
 * Friday's fuel shuffle, carried onto the real core.
 *
 * The owner, 25 November 2026: the day-5 shuffle and the Refuelling Outage were two reloads that didn't talk to
 * each other. They teach at two scales: the shuffle is a small classroom core (6×6) where you work out a strategy
 * (burned toward the fence, fresh scattered inside); the outage is the real 193-assembly core. This file turns the
 * strategy you signed on Friday into a layout of the real core, so the outage carries your plan out and the cycle
 * run tells you whether it holds at full scale.
 *
 * How: read the Friday map as freshness by distance from the centre (fresh 1, once-burned ½, twice-burned 0),
 * smoothed, then lay the real core out by it with the rules a full-size core adds. See fridayLayout. Fuel only moves orbit to orbit, four assemblies at a time, as
 * swapOrbits does, so the core keeps its 90° symmetry and every assembly keeps its own burnup. The centre stays.
 *
 * Teaching model, not a license: a radial ranking, not an optimiser. The run is what judges it.
 */
import type { ShuffleCell } from "../plant";
import { CORE } from "./calibration";
import { N, QUARTER, critical, nodeMap, orbit, swapOrbits, type Assembly, type Core } from "./core";
import { kInf, type LatticeSet } from "./lattice";

const FRIDAY_N = 6;
const FRESHNESS: Record<string, number> = { F: 1, "1": 0.5, "2": 0 };
const MID = (N - 1) / 2;

/** How fresh Friday's plan wants the fuel at a given fraction of the way out (0 centre, 1 the fence). */
export function planFreshness(map: readonly ShuffleCell[]): (rho: number) => number {
  const cells = map.map((c) => ({
    rho: Math.hypot(c.j - (FRIDAY_N - 1) / 2, c.i - (FRIDAY_N - 1) / 2) / Math.hypot((FRIDAY_N - 1) / 2, (FRIDAY_N - 1) / 2),
    f: FRESHNESS[c.cycle] ?? 0.5,
  }));
  return (rho: number) => {
    let w = 0;
    let sum = 0;
    for (const c of cells) {
      const k = Math.exp(-(((c.rho - rho) / 0.18) ** 2));
      w += k;
      sum += k * c.f;
    }
    return w > 0 ? sum / w : 0.5;
  };
}

/**
 * How lively an assembly is: k∞ at its burnup, absorber rods in if it's fresh and has them (as nodeMap reads it).
 * Without a lattice set, a stand-in: fresh first, then by burnup.
 */
function liveliness(a: Assembly | null, set?: LatticeSet): number {
  if (!a) return -1;
  if (set) return kInf(set, a.e, a.ba, a.burnup, a.cycles === 0 && a.ba > 0);
  return a.cycles === 0 ? 10 - a.burnup / 100 : 1 + a.e / 10 - a.burnup / 100;
}

/** The four-fold orbits the player can move, with their distance out and how lively their fuel is. */
function movable(core: Core, set?: LatticeSet) {
  const orbits = QUARTER.filter((i) => orbit(i).length === 4);
  const reach = Math.max(...orbits.map((i) => Math.hypot((i % N) - MID, Math.floor(i / N) - MID)));
  return orbits.map((i) => ({
    i,
    rho: Math.hypot((i % N) - MID, Math.floor(i / N) - MID) / reach,
    live: orbit(i).reduce((sum, j) => sum + liveliness(core[j], set), 0) / 4,
  }));
}

/** The full-core positions next to any of an orbit's four (up, down, left, right). */
function neighbours(i: number): number[] {
  const out: number[] = [];
  for (const j of orbit(i)) {
    const r = Math.floor(j / N);
    const c = j % N;
    if (r > 0) out.push(j - N);
    if (r < N - 1) out.push(j + N);
    if (c > 0) out.push(j - 1);
    if (c < N - 1) out.push(j + 1);
  }
  return out;
}

/**
 * The real core laid out by Friday's plan, with the rules a real core adds.
 *
 * The owner, 25 November 2026: the shuffle is the climax of every fuel cycle now, so the plan has to be something
 * the real core can actually carry out. Laid out literally (the liveliest third wherever Friday wanted fresh fuel),
 * it peaked at 2.35 against the plant's own 1.45 in the same simulator. Two things in the hall's 6×6 core don't
 * carry over to 193 assemblies, and Priya applies them as she lays your plan out:
 *
 *   1. Fresh fuel without absorber rods goes on the outer flats. In the small core the edge leaks so much that
 *      anything there is tame; in the real core, unpoisoned fresh fuel inside is a peak. (BEAVRS Cycle 2 does this.)
 *   2. The very centre holds the most-burned fuel. "Inside" means the middle ring, not the middle.
 *
 * Then the plan decides the rest: fresh fuel with absorber rods goes where Friday wanted fresh fuel in the middle
 * ring, never side by side ("scattered inside"); the liveliest burned fuel goes where Friday wanted fresher fuel; the
 * most burned toward the fence. Fuel only moves orbit to orbit, so the core keeps its 90° symmetry.
 *
 * If that still doesn't hold, priyaPass() works the layout swap by swap. Teaching model, not a license.
 */
export function fridayLayout(core: Core, map: readonly ShuffleCell[], set?: LatticeSet): Core {
  return fridayLayoutWithNotes(core, map, set).core;
}

export interface LayoutNotes {
  core: Core;
  /** Orbits of unpoisoned fresh fuel moved to the outer flats. */
  toFlats: number;
  /** Orbits of burned fuel put in the centre. */
  toCentre: number;
}

/** Where "inside" starts and the centre ends, as a fraction of the way out. */
export const RING_START = 0.6;
export const CENTRE_END = 0.3;

export function fridayLayoutWithNotes(core: Core, map: readonly ShuffleCell[], set?: LatticeSet): LayoutNotes {
  const want = planFreshness(map);
  const slots = movable(core, set);
  const rhoOf = new Map(slots.map((p) => [p.i, p.rho]));
  const fresh = slots.filter((p) => core[p.i]!.cycles === 0);
  const bare = fresh.filter((p) => !(core[p.i]!.ba > 0)).map((p) => p.i);
  const poisoned = fresh.filter((p) => core[p.i]!.ba > 0).map((p) => p.i);
  const burned = slots.filter((p) => core[p.i]!.cycles > 0).sort((a, b) => b.live - a.live || a.i - b.i).map((p) => p.i);

  const free = new Set(slots.map((p) => p.i));
  const target = new Map<number, number>(); // position orbit → fuel orbit
  const hot = new Set<number>();
  const put = (pos: number, fuel: number, lively: boolean) => {
    target.set(pos, fuel);
    free.delete(pos);
    if (lively) for (const j of orbit(pos)) hot.add(j);
  };
  const r = (i: number) => rhoOf.get(i) ?? 0;

  // 1. Unpoisoned fresh fuel: the outermost positions.
  const outer = [...free].sort((a, b) => r(b) - r(a) || a - b);
  bare.forEach((f, k) => put(outer[k], f, true));
  const toFlats = bare.filter((f, k) => f !== outer[k]).length;

  // 2. Fresh fuel with absorber rods: the middle ring, where the plan most wants fresh fuel, never side by side.
  const ring = [...free].filter((p) => r(p) >= RING_START).sort((a, b) => want(r(b)) - want(r(a)) || r(a) - r(b) || a - b);
  for (const f of poisoned) {
    const p = ring.find((q) => free.has(q) && !neighbours(q).some((n) => hot.has(n))) ?? ring.find((q) => free.has(q)) ?? [...free][0];
    put(p, f, true);
  }

  // 3. The centre: the most burned fuel.
  const centre = [...free].filter((p) => r(p) < CENTRE_END).sort((a, b) => r(a) - r(b) || a - b);
  const quiet = [...burned].reverse();
  centre.forEach((p, k) => put(p, quiet[k], false));
  const inCentre = new Set(quiet.slice(0, centre.length));

  // 4. The rest of the burned fuel: liveliest where Friday wanted fresher fuel, most burned toward the fence.
  const rest = [...free].sort((a, b) => want(r(b)) - want(r(a)) || r(a) - r(b) || a - b);
  burned.filter((f) => !inCentre.has(f)).forEach((f, k) => put(rest[k], f, false));

  const next = core.slice();
  for (const [to, from] of target) {
    const a = orbit(to);
    const b = orbit(from);
    for (let t = 0; t < 4; t++) next[a[t]] = core[b[t]];
  }
  return { core: next, toFlats, toCentre: centre.length };
}

/** A plan holds if its peak is within this factor of the plant's own pattern, run in the same simulator. */
export const HOLD_MARGIN = 1.1;

export function holds(peak: number, plantPeak: number): boolean {
  return peak <= plantPeak * HOLD_MARGIN + 1e-9;
}

export interface PassProgress {
  tried: number;
  of: number;
  best: number;
}

/**
 * Priya works the layout: swap by swap, she keeps whatever lowers the start-of-cycle peak, and now and then tries a
 * worse one to get out of a dead end (simulated annealing). Mostly she moves the hottest orbit. The cycle run, not
 * this, judges the result. Async so the desk can show her working: each try is one core solve.
 */
export async function priyaPass(
  start: Core,
  set: LatticeSet,
  opts: { tries?: number; seed?: number; onProgress?: (p: PassProgress) => void; yieldEvery?: number } = {},
): Promise<{ core: Core; peak: number }> {
  const tries = opts.tries ?? 150;
  let seed = (opts.seed ?? 1) * 7919 + 17;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const orbits = QUARTER.filter((i) => orbit(i).length === 4);
  let warm: Float64Array | undefined;
  const peakOf = (c: Core) => {
    const q = critical(nodeMap(c, set), CORE.m2, warm);
    warm = q.sol.phi;
    let at = 0;
    q.sol.power.forEach((v, i) => {
      if (v > q.sol.power[at]) at = i;
    });
    return { peak: q.sol.power[at], at };
  };
  let cur = start;
  let here = peakOf(cur);
  let best = cur;
  let bestPeak = here.peak;
  for (let n = 1; n <= tries; n++) {
    const temp = 0.05 * (1 - n / tries);
    const hot = orbits.find((o) => orbit(o).includes(here.at)) ?? orbits[Math.floor(rnd() * orbits.length)];
    const a = rnd() < 0.7 ? hot : orbits[Math.floor(rnd() * orbits.length)];
    const b = orbits[Math.floor(rnd() * orbits.length)];
    if (a !== b) {
      const next = swapOrbits(cur, a, b);
      if (next) {
        const r = peakOf(next);
        if (r.peak < here.peak || rnd() < Math.exp(-(r.peak - here.peak) / Math.max(temp, 1e-4))) {
          cur = next;
          here = r;
          if (r.peak < bestPeak) {
            best = next;
            bestPeak = r.peak;
          }
        }
      }
    }
    if (n % (opts.yieldEvery ?? 1) === 0) {
      opts.onProgress?.({ tried: n, of: tries, best: bestPeak });
      await new Promise((res) => setTimeout(res, 0));
    }
  }
  return { core: best, peak: bestPeak };
}

/** Share of the fresh assemblies sitting on the outer third of the core: the leak Friday's rim rule watches. */
export function freshOnRim(core: Core): number {
  const fuel = core.map((a, i) => ({ a, i })).filter((x) => x.a);
  const reach = Math.max(...fuel.map((x) => Math.hypot((x.i % N) - MID, Math.floor(x.i / N) - MID)));
  const fresh = fuel.filter((x) => x.a!.cycles === 0);
  if (!fresh.length) return 0;
  return fresh.filter((x) => Math.hypot((x.i % N) - MID, Math.floor(x.i / N) - MID) / reach > 2 / 3).length / fresh.length;
}
