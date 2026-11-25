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
 * smoothed. Rank the real core's quarter-core positions by that freshness, and its fuel by how lively it is (k∞),
 * in Friday's thirds. See fridayLayout. Fuel only moves orbit to orbit, four assemblies at a time, as
 * swapOrbits does, so the core keeps its 90° symmetry and every assembly keeps its own burnup. The centre stays.
 *
 * Teaching model, not a license: a radial ranking, not an optimiser. The run is what judges it.
 */
import type { ShuffleCell } from "../plant";
import { N, QUARTER, orbit, type Assembly, type Core } from "./core";
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
 * The real core laid out by Friday's plan. Same assemblies, same symmetry; only the four-fold orbits move.
 *
 * Friday's map has three kinds in equal thirds: fresh, once-burned, twice-burned. On the real core those become
 * the liveliest third of the orbits, the middle third and the quietest third (by k∞, so a barely-burned assembly
 * counts as lively). The liveliest go where Friday wanted fresh fuel, but never side by side with each other
 * ("scattered inside") unless there's no room left; then the middle third, then the quietest toward the fence.
 */
export function fridayLayout(core: Core, map: readonly ShuffleCell[], set?: LatticeSet): Core {
  const want = planFreshness(map);
  const slots = movable(core, set);
  const places = [...slots].sort((a, b) => want(b.rho) - want(a.rho) || a.rho - b.rho).map((p) => p.i);
  const fuel = [...slots].sort((a, b) => b.live - a.live || a.i - b.i);
  const third = Math.round(fuel.length / 3);
  const lively = fuel.slice(0, third);
  const rest = fuel.slice(third);

  const target = new Map<number, number>(); // position orbit → fuel orbit
  const hot = new Set<number>(); // full-core positions holding the liveliest fuel
  const free = places.slice();
  for (const f of lively) {
    const k = free.findIndex((pos) => !neighbours(pos).some((n) => hot.has(n)));
    const at = free.splice(k >= 0 ? k : 0, 1)[0];
    target.set(at, f.i);
    for (const j of orbit(at)) hot.add(j);
  }
  for (const f of rest) target.set(free.shift()!, f.i);

  const next = core.slice();
  for (const [to, from] of target) {
    const a = orbit(to);
    const b = orbit(from);
    for (let t = 0; t < 4; t++) next[a[t]] = core[b[t]];
  }
  return next;
}

/** Share of the fresh assemblies sitting on the outer third of the core: the leak Friday's rim rule watches. */
export function freshOnRim(core: Core): number {
  const fuel = core.map((a, i) => ({ a, i })).filter((x) => x.a);
  const reach = Math.max(...fuel.map((x) => Math.hypot((x.i % N) - MID, Math.floor(x.i / N) - MID)));
  const fresh = fuel.filter((x) => x.a!.cycles === 0);
  if (!fresh.length) return 0;
  return fresh.filter((x) => Math.hypot((x.i % N) - MID, Math.floor(x.i / N) - MID) / reach > 2 / 3).length / fresh.length;
}
