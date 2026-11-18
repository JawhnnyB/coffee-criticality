/**
 * Lattice data: k-infinity of one fuel assembly type as it burns.
 *
 * A lattice set is what a lattice code (OpenMC, CASMO, SCALE) hands a core simulator. The game ships one
 * preset set and accepts a player's own set, made with tools/openmc/beavrs_lattice.py or any other code.
 *
 * Frame: every curve is k-infinity at one reference state. The set says which state ("reference"), and gives
 * the uniform shift to hot full power with equilibrium xenon (hfpShift) and the k-infinity worth of one ppm of
 * soluble boron away from the reference boron (boronWorth). A set made at hot full power, 0 ppm, equilibrium
 * xenon has hfpShift 0 and refBoronPpm 0.
 */

export interface LatticeCurve {
  /** Enrichment, weight percent U-235. */
  e: number;
  /** Burnable absorber rods in the assembly while it is fresh. 0 for none. */
  ba: number;
  /** [burnup GWd/tHM, k-infinity] pairs, burnup ascending, starting at 0. */
  k: [number, number][];
}

export interface LatticeSet {
  version: 1;
  name: string;
  /** Where every number came from. Shown to the player. */
  source: string;
  /** The state the curves were computed at, in words. */
  reference: string;
  refBoronPpm: number;
  /** k-infinity added to every curve to reach hot full power with equilibrium xenon. */
  hfpShift: number;
  /** k-infinity per ppm of boron (negative). */
  boronWorth: number;
  curves: LatticeCurve[];
}

export const MAX_BURNUP = 70;

/**
 * Validate a set from an untrusted source (a player's paste). Returns the set or an error in plain words.
 * hfpShift and boronWorth may be the string "preset" (a set made in the preset's own reference state):
 * they are then taken from `preset`.
 */
export function parseLatticeSet(
  text: string,
  preset?: Pick<LatticeSet, "hfpShift" | "boronWorth">,
): { ok: true; set: LatticeSet } | { ok: false; error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "That is not JSON." };
  }
  const o = raw as Partial<LatticeSet>;
  if (!o || typeof o !== "object") return { ok: false, error: "Expected an object." };
  for (const key of ["hfpShift", "boronWorth"] as const) {
    if ((o as Record<string, unknown>)[key] === "preset") {
      if (!preset) return { ok: false, error: `"${key}" says "preset", and there is no preset here.` };
      (o as Record<string, unknown>)[key] = preset[key];
    }
  }
  if (o.version !== 1) return { ok: false, error: 'Expected "version": 1.' };
  for (const key of ["name", "source", "reference"] as const) {
    if (typeof o[key] !== "string" || !(o[key] as string).trim()) return { ok: false, error: `Missing "${key}".` };
    if ((o[key] as string).length > 400) return { ok: false, error: `"${key}" is too long.` };
  }
  for (const key of ["refBoronPpm", "hfpShift", "boronWorth"] as const) {
    if (typeof o[key] !== "number" || !Number.isFinite(o[key])) return { ok: false, error: `"${key}" must be a number.` };
  }
  if (o.boronWorth! > 0 || o.boronWorth! < -1e-3) return { ok: false, error: '"boronWorth" must be between -0.001 and 0 per ppm.' };
  if (!Array.isArray(o.curves) || o.curves.length === 0 || o.curves.length > 64) return { ok: false, error: '"curves" must list 1 to 64 assembly types.' };
  const seen = new Set<string>();
  for (const [i, c] of o.curves.entries()) {
    const where = `curves[${i}]`;
    if (typeof c?.e !== "number" || c.e <= 0 || c.e > 20) return { ok: false, error: `${where}.e must be an enrichment in percent.` };
    if (!Number.isInteger(c.ba) || c.ba < 0 || c.ba > 24) return { ok: false, error: `${where}.ba must be 0 to 24 rods.` };
    const key = `${c.e}/${c.ba}`;
    if (seen.has(key)) return { ok: false, error: `${where} repeats ${c.e}% with ${c.ba} absorbers.` };
    seen.add(key);
    if (!Array.isArray(c.k) || c.k.length < 2 || c.k.length > 200) return { ok: false, error: `${where}.k needs 2 to 200 points.` };
    let last = -1;
    for (const p of c.k) {
      if (!Array.isArray(p) || p.length !== 2 || !p.every((v) => typeof v === "number" && Number.isFinite(v))) {
        return { ok: false, error: `${where}.k points must be [burnup, k].` };
      }
      if (p[0] <= last) return { ok: false, error: `${where}.k burnups must rise.` };
      if (p[1] <= 0.2 || p[1] > 2) return { ok: false, error: `${where}.k has k-infinity ${p[1]}, outside 0.2 to 2.` };
      last = p[0];
    }
    if (c.k[0][0] !== 0) return { ok: false, error: `${where}.k must start at burnup 0.` };
  }
  return { ok: true, set: o as LatticeSet };
}

function interp(k: [number, number][], b: number): number {
  if (b <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (b <= k[i][0]) {
      const [b0, k0] = k[i - 1];
      const [b1, k1] = k[i];
      return k0 + ((k1 - k0) * (b - b0)) / (b1 - b0);
    }
  }
  // Past the last point: carry the last slope on, the way the linear reactivity model does.
  const n = k.length;
  const [b0, k0] = k[n - 2];
  const [b1, k1] = k[n - 1];
  return k1 + ((k1 - k0) * (b - b1)) / (b1 - b0);
}

/** Types the set can load fresh. */
export function freshTypes(set: LatticeSet): { e: number; ba: number }[] {
  return set.curves.map((c) => ({ e: c.e, ba: c.ba })).sort((a, b) => a.e - b.e || a.ba - b.ba);
}

/**
 * k-infinity at the set's reference state.
 * Absorber rods sit in an assembly only for its first cycle, then come out with the inserts.
 * A burned assembly follows the no-absorber curve of its enrichment.
 */
export function kInf(set: LatticeSet, e: number, ba: number, burnup: number, absorbersIn: boolean): number {
  const want = absorbersIn ? ba : 0;
  const c = set.curves.find((x) => x.e === e && x.ba === want) ?? set.curves.find((x) => x.e === e && x.ba === 0);
  if (!c) throw new Error(`No lattice curve for ${e}% with ${want} absorbers.`);
  return interp(c.k, burnup);
}
