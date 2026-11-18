/**
 * Refuelling outage: a small core simulator, the same split the industry uses. A lattice code (here, the
 * lattice set) gives each assembly type's k-infinity as it burns. This file solves the whole core.
 *
 * Model: one-group diffusion on the real 193-assembly, 15×15 core with one node per assembly (21.50 cm),
 * a one-node reflector around it (the cells SIMULATE marks as reflector, which are exactly the cells touching
 * fuel) with its own absorption, and zero flux beyond. Uniform migration area M². The model is 2D, so axial
 * leakage is a uniform k∞ shift. Fission source ∝ k∞·φ, so assembly power ∝ k∞·φ (absorption taken as
 * uniform). Boron is a uniform k∞ shift found each step so the core is critical. Burnup moves each assembly
 * by its own power. The cycle ends when critical boron reaches 0 ppm.
 *
 * At power, hot assemblies lose reactivity (fuel temperature, moderator temperature), which flattens the power.
 * That is a local k∞ change of -feedback·(P − 1), iterated with the power map.
 *
 * M², the reflector absorption and the axial shift are core constants (calibration.ts), fitted to the measured
 * BEAVRS Cycle 1 zero-power detector map with the core critical at the measured 975 ppm. The feedback
 * coefficient is fitted to measured at-power detector maps.
 *
 * What it leaves out, said plainly: pin power inside an assembly, axial shape, thermal feedback, control rods,
 * two energy groups, and the small absorber spectral effect after the inserts come out. It is a teaching
 * simulator calibrated to measured BEAVRS data (see preset.ts), not a licensing code.
 */
import { BEAVRS as beavrs } from "./beavrs";
import { CORE } from "./calibration";
import { kInf, type LatticeSet } from "./lattice";

export const N = 15;
const G = N + 2;
export const PITCH_CM: number = beavrs.assemblyPitchCm;
export const SPECIFIC_POWER: number = beavrs.specificPowerMWperT;
export const FDH_LIMIT: number = beavrs.fdhLimit;
/**
 * Pin peaking inside an assembly is not modelled. FΔH is estimated as assembly power × this factor.
 * Assumption, not a BEAVRS number: fresh 17×17 assemblies typically peak a few percent above their average.
 */
export const PIN_FACTOR = 1.05;
/** The assembly power that just meets the FΔH limit under PIN_FACTOR. */
export const ASSEMBLY_LIMIT = FDH_LIMIT / PIN_FACTOR;

export interface Assembly {
  /** Stable id: where it was first loaded, "C1-H08", or "C2-new-3". */
  id: string;
  e: number;
  ba: number;
  burnup: number;
  /** Cycles completed before this one. 0 = fresh this cycle, absorbers in. */
  cycles: number;
}

/** Row-major 15×15. null where there is no fuel position. */
export type Core = (Assembly | null)[];

const SHAPE: boolean[] = beavrs.cycle1.flat().map((v) => v !== null);
export const isFuel = (i: number) => SHAPE[i];
export const FUEL_COUNT = SHAPE.filter(Boolean).length;
export const COLUMNS: string = beavrs.columns;
export const posName = (i: number) => `${COLUMNS[i % N]}${String(Math.floor(i / N) + 1).padStart(2, "0")}`;
/** "D12" (the plant's detector naming) to a 15×15 index. */
export const posIndex = (p: string) => (parseInt(p.slice(1), 10) - 1) * N + COLUMNS.indexOf(p[0]);

/**
 * Mesh cells per assembly side. One finite-difference cell per 21.50 cm assembly is far coarser than the
 * neutron migration length (about 8 cm), and the answer is then wrong, not just rough: at M² = 60 cm² one
 * cell per assembly gave a peak of 2.05 where 2×2 and 4×4 cells agree on about 1.36. 4×4 is used.
 */
export const MESH = 4;
const GM = G * MESH;

// Coarse kinds on the 17×17 grid: 0 outside, 1 reflector, 2 fuel.
const COARSE: number[] = (() => {
  const k = new Array(G * G).fill(0);
  const fuelAt = (r: number, c: number) => r >= 1 && r <= N && c >= 1 && c <= N && SHAPE[(r - 1) * N + (c - 1)];
  for (let r = 0; r < G; r++) {
    for (let c = 0; c < G; c++) {
      if (fuelAt(r, c)) k[r * G + c] = 2;
      else {
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (fuelAt(r + dr, c + dc)) k[r * G + c] = 1;
      }
    }
  }
  return k;
})();
/** Fine cell → its 15×15 assembly index, or -1. */
const OWNER: Int32Array = Int32Array.from({ length: GM * GM }, (_, n) => {
  const r = Math.floor(Math.floor(n / GM) / MESH);
  const c = Math.floor((n % GM) / MESH);
  return COARSE[r * G + c] === 2 ? (r - 1) * N + (c - 1) : -1;
});
const KIND: Int8Array = Int8Array.from({ length: GM * GM }, (_, n) => {
  const r = Math.floor(Math.floor(n / GM) / MESH);
  const c = Math.floor((n % GM) / MESH);
  return COARSE[r * G + c];
});
const NB: number[][] = Array.from({ length: GM * GM }, (_, n) => {
  const r = Math.floor(n / GM);
  const c = n % GM;
  return [
    [r - 1, c],
    [r + 1, c],
    [r, c - 1],
    [r, c + 1],
  ]
    .filter(([a, b]) => a >= 0 && b >= 0 && a < GM && b < GM && KIND[a * GM + b] !== 0)
    .map(([a, b]) => a * GM + b);
});

export interface Solution {
  k: number;
  /** Relative assembly power, row-major 15×15, mean 1 over fuel, 0 where there is no fuel. */
  power: number[];
  /** Flux on the fine mesh, for a warm start. */
  phi: Float64Array;
}

const NB_START = new Int32Array(GM * GM + 1);
const NB_FLAT: Int32Array = (() => {
  const flat: number[] = [];
  for (let n = 0; n < GM * GM; n++) {
    NB_START[n] = flat.length;
    flat.push(...NB[n]);
  }
  NB_START[GM * GM] = flat.length;
  return Int32Array.from(flat);
})();
const ACTIVE = Int32Array.from(Array.from(KIND, (k, n) => (k !== 0 ? n : -1)).filter((n) => n >= 0));
/** Fine fuel cells and their owning assembly. */
const FUEL_CELLS = Int32Array.from(Array.from(OWNER, (o, n) => (o >= 0 ? n : -1)).filter((n) => n >= 0));
const CELL_OWNER = Int32Array.from(Array.from(FUEL_CELLS, (n) => OWNER[n]));

/**
 * One-group eigenvalue problem for a map of k-infinity (row-major 15×15, fuel only):
 * (1 + 4c)φ − cΣφ_nb = (k∞/k)φ in fuel, c = M²/h², with extra absorption in the reflector.
 * Power iteration with SOR inner sweeps.
 *
 * With search = true, it also finds the uniform k∞ shift that makes k = 1 (the boron search), updating the
 * shift every outer iteration by first-order perturbation: for this symmetric one-group operator,
 * dk/dδ = k·Σφ²/Σ(k∞φ²) over fuel.
 */
function iterate(
  map: NodeMap,
  m2: number,
  reflectorAbs: number,
  warm: Float64Array | undefined,
  search: boolean,
): { k: number; shift: number; phi: Float64Array } {
  const h = PITCH_CM / MESH;
  const c = m2 / (h * h);
  const diag = new Float64Array(GM * GM);
  const sa = new Float64Array(GM * GM);
  const base = new Float64Array(GM * GM);
  for (const n of ACTIVE) diag[n] = 1 + 4 * c + (KIND[n] === 1 ? reflectorAbs : 0);
  for (let f = 0; f < FUEL_CELLS.length; f++) {
    const n = FUEL_CELLS[f];
    const i = CELL_OWNER[f];
    sa[n] = map.absorb[i];
    base[n] = map.produce[i];
    diag[n] = map.absorb[i] + 4 * c;
  }
  let phi = warm && warm.length === GM * GM ? Float64Array.from(warm) : Float64Array.from(KIND, (k) => (k === 2 ? 1 : k === 1 ? 0.3 : 0));
  let shift = 0;
  let k = 1;
  const kg = new Float64Array(GM * GM);
  const fill = () => {
    // The shift is a uniform change in k∞, applied as production: ν Σf + δ·Σa.
    for (let f = 0; f < FUEL_CELLS.length; f++) {
      const n = FUEL_CELLS[f];
      kg[n] = base[n] + shift * sa[n];
    }
  };
  fill();
  const src = new Float64Array(GM * GM);
  const fission = (v: Float64Array) => {
    let t = 0;
    for (let f = 0; f < FUEL_CELLS.length; f++) t += kg[FUEL_CELLS[f]] * v[FUEL_CELLS[f]];
    return t;
  };
  let fOld = fission(phi);
  for (let outer = 0; outer < 3000; outer++) {
    for (const n of ACTIVE) src[n] = (kg[n] * phi[n]) / k;
    const next = Float64Array.from(phi);
    for (let inner = 0; inner < 6; inner++) {
      for (const n of ACTIVE) {
        let t = src[n];
        for (let j = NB_START[n]; j < NB_START[n + 1]; j++) t += c * next[NB_FLAT[j]];
        next[n] += 1.6 * (t / diag[n] - next[n]);
      }
    }
    const fNew = fission(next);
    const kNew = (k * fNew) / fOld;
    // Flux is normalised to unit fission source, so each cell is ~1e-4 and this tolerance is ~1e-3 relative.
    // That leaves power symmetric to about 1e-4 (tested). A tighter test hits the SOR noise floor and stalls.
    let diff = 0;
    for (const n of ACTIVE) {
      const v = next[n] / fNew;
      diff = Math.max(diff, Math.abs(v - phi[n] / fOld));
      next[n] = v;
    }
    phi = next;
    const dk = Math.abs(kNew - k);
    k = kNew;
    if (search) {
      let a = 0;
      let b = 0;
      for (let f = 0; f < FUEL_CELLS.length; f++) {
        const n = FUEL_CELLS[f];
        const p = phi[n];
        a += sa[n] * p * p;
        b += kg[n] * p * p;
      }
      const step = (1 - k) / ((k * a) / b);
      shift += step;
      fill();
      fOld = fission(phi);
      if (Math.abs(step) < 1e-8 && diff < 1e-7 && Math.abs(k - 1) < 1e-7 && outer > 4) break;
    } else {
      fOld = 1;
      if (dk < 1e-8 && diff < 1e-7 && outer > 4) break;
    }
  }
  return { k, shift, phi };
}

function powerOf(map: NodeMap, phi: Float64Array): number[] {
  // Power follows the fuel's own fission rate. Boron and absorber rods take neutrons, they do not fission.
  const raw = new Array(N * N).fill(0);
  let sum = 0;
  for (let f = 0; f < FUEL_CELLS.length; f++) {
    const i = CELL_OWNER[f];
    const v = map.fission[i] * phi[FUEL_CELLS[f]];
    raw[i] += v;
    sum += v;
  }
  const mean = sum / FUEL_COUNT;
  return raw.map((v) => v / mean);
}

/** Mean flux in each assembly (the thermal-flux stand-in the detectors are compared with). */
export function assemblyFlux(phi: Float64Array): number[] {
  const out = new Array(N * N).fill(0);
  for (let f = 0; f < FUEL_CELLS.length; f++) out[CELL_OWNER[f]] += phi[FUEL_CELLS[f]] / (MESH * MESH);
  return out;
}

export function solve(map: NodeMap, m2: number = CORE.m2, warm?: Float64Array, reflectorAbs: number = CORE.reflectorAbs): Solution {
  const r = iterate(map, m2, reflectorAbs, warm, false);
  return { k: r.k, power: powerOf(map, r.phi), phi: r.phi };
}

/**
 * Per-assembly one-group constants, relative to fuel without absorber rods (Σa = 1).
 * - Fuel: production νΣf = k∞, absorption 1, fission ∝ k∞.
 * - With absorber rods in: the rods add absorption and no fission. Production and fission stay those of the
 *   same fuel without rods (k0); absorption rises to k0 / k∞, so k∞ comes out right.
 * The core's axial leakage is a uniform k∞ shift, applied as production.
 * Only lattice curves go in, so a player's own OpenMC set works the same way.
 */
export interface NodeMap {
  produce: number[];
  absorb: number[];
  fission: number[];
}

export function nodeMap(core: Core, set: LatticeSet, axial: number = CORE.axialShift): NodeMap {
  const produce = new Array(N * N).fill(0);
  const absorb = new Array(N * N).fill(0);
  const fission = new Array(N * N).fill(0);
  core.forEach((a, i) => {
    if (!a) return;
    const rods = a.cycles === 0 && a.ba > 0;
    const k0 = kInf(set, a.e, a.ba, a.burnup, false);
    const k = rods ? kInf(set, a.e, a.ba, a.burnup, true) : k0;
    absorb[i] = k0 / k;
    produce[i] = k0 + axial * absorb[i];
    fission[i] = k0;
  });
  return { produce, absorb, fission };
}

/** Apply local power feedback: each assembly's k∞ changes by -feedback·(P − 1), applied as production. */
export function withFeedback(map: NodeMap, power: number[], feedback: number): NodeMap {
  return { ...map, produce: map.produce.map((v, i) => (v ? v - feedback * (power[i] - 1) * map.absorb[i] : 0)) };
}

/** The critical state at power: boron search and feedback iterated together. */
export function criticalAtPower(
  map: NodeMap,
  feedback: number = CORE.feedback,
  warm?: Float64Array,
  guess?: number[],
): { shift: number; sol: Solution } {
  let crit = critical(guess ? withFeedback(map, guess, feedback) : map, CORE.m2, warm);
  if (feedback === 0) return crit;
  // Under-relaxed fixed point: feed back the average of the last two power maps, or it oscillates.
  let used = guess ?? crit.sol.power;
  for (let it = 0; it < 12; it++) {
    const mixed = used.map((p, i) => 0.5 * p + 0.5 * crit.sol.power[i]);
    crit = critical(withFeedback(map, mixed, feedback), CORE.m2, crit.sol.phi);
    let d = 0;
    crit.sol.power.forEach((p, i) => (d = Math.max(d, Math.abs(p - mixed[i]))));
    used = mixed;
    if (d < 0.002) break;
  }
  return crit;
}

/** Same, from bare k∞ values (no absorber split). Used where only k∞ is known. */
export function plainMap(kinf: number[]): NodeMap {
  return { produce: kinf.slice(), absorb: kinf.map((v) => (v ? 1 : 0)), fission: kinf.slice() };
}

/** The uniform k∞ shift that makes the core critical, and the critical solution. */
export function critical(
  map: NodeMap,
  m2: number = CORE.m2,
  warm?: Float64Array,
  reflectorAbs: number = CORE.reflectorAbs,
): { shift: number; sol: Solution } {
  const r = iterate(map, m2, reflectorAbs, warm, true);
  return { shift: r.shift, sol: { k: r.k, power: powerOf(map, r.phi), phi: r.phi } };
}

export interface CycleStep {
  efpd: number;
  /** Core-average burnup gained this cycle, GWd/tHM. */
  burnup: number;
  ppm: number;
  /** Highest assembly power at this step. */
  peak: number;
}

export interface CycleResult {
  steps: CycleStep[];
  /** Length to 0 ppm, effective full-power days. */
  efpd: number;
  bocPpm: number;
  /** Highest assembly power over the cycle, and where. */
  peak: number;
  peakAt: number;
  /** FΔH estimate: peak × PIN_FACTOR. */
  fdh: number;
  /** The core at end of cycle, burnups updated, cycles not yet advanced. */
  eoc: Core;
  /** Power map at beginning of cycle. */
  bocPower: number[];
}

/** HFP critical boron (ppm) for a critical shift. */
export function ppmOf(set: LatticeSet, shift: number): number {
  return set.refBoronPpm + (shift - set.hfpShift) / set.boronWorth;
}

/** Deplete one cycle at hot full power to 0 ppm. step: core-average GWd/tHM per step. */
export function runCycle(start: Core, set: LatticeSet, step = 0.25, maxBurnup = 40, stopEfpd?: number): CycleResult {
  if (stopEfpd !== undefined) maxBurnup = (stopEfpd * SPECIFIC_POWER) / 1000;
  const core: Core = start.map((a) => (a ? { ...a } : null));
  const steps: CycleStep[] = [];
  let gained = 0;
  let warm: Float64Array | undefined;
  let lastPower: number[] | undefined;
  let peak = 0;
  let peakAt = -1;
  let bocPower: number[] = [];
  let prev: CycleStep | null = null;
  for (;;) {
    const crit = criticalAtPower(nodeMap(core, set), CORE.feedback, warm, lastPower);
    lastPower = crit.sol.power;
    warm = crit.sol.phi;
    const ppm = ppmOf(set, crit.shift);
    let stepPeak = 0;
    let stepAt = -1;
    crit.sol.power.forEach((p, i) => {
      if (p > stepPeak) {
        stepPeak = p;
        stepAt = i;
      }
    });
    if (steps.length === 0) bocPower = crit.sol.power;
    const here: CycleStep = { efpd: (gained * 1000) / SPECIFIC_POWER, burnup: gained, ppm, peak: stepPeak };
    if ((ppm <= 0 && stopEfpd === undefined) || gained >= maxBurnup - 1e-9) {
      if (prev && ppm < 0 && stopEfpd === undefined) {
        // Interpolate to the 0 ppm point.
        const f = prev.ppm / (prev.ppm - ppm);
        const b = prev.burnup + f * (gained - prev.burnup);
        steps.push({ efpd: (b * 1000) / SPECIFIC_POWER, burnup: b, ppm: 0, peak: prev.peak + f * (stepPeak - prev.peak) });
        // Pull burnups back to the 0 ppm point.
        const back = gained - b;
        core.forEach((a, i) => {
          if (a) a.burnup -= crit.sol.power[i] * back;
        });
        gained = b;
      } else steps.push(here);
      break;
    }
    steps.push(here);
    if (stepPeak > peak) {
      peak = stepPeak;
      peakAt = stepAt;
    }
    const dB = Math.min(step, maxBurnup - gained);
    core.forEach((a, i) => {
      if (a) a.burnup += crit.sol.power[i] * dB;
    });
    gained += dB;
    prev = here;
  }
  const last = steps[steps.length - 1];
  return {
    steps,
    efpd: last.efpd,
    bocPpm: steps[0].ppm,
    peak,
    peakAt,
    fdh: peak * PIN_FACTOR,
    eoc: core,
    bocPower,
  };
}

/** Advance to the next outage: every assembly in the core has now completed one more cycle. */
export function endCycle(core: Core): Core {
  return core.map((a) => (a ? { ...a, cycles: a.cycles + 1 } : null));
}

/** The real BEAVRS Cycle 1 core, fresh. */
export function beavrsCycle1(): Core {
  return beavrs.cycle1.flat().map((v, i) => (v ? { id: `C1-${posName(i)}`, e: v.e, ba: v.ba, burnup: 0, cycles: 0 } : null));
}

/** The plant's own Cycle 2 loading, built from an end-of-Cycle-1 core. Fresh assemblies get new ids. */
export function beavrsCycle2(eoc1: Core): Core {
  let n = 0;
  return beavrs.cycle2.flat().map((v) => {
    if (!v) return null;
    if ("from" in v && v.from) {
      const [r, c] = v.from as number[];
      const a = eoc1[r * N + c];
      if (!a) throw new Error("Cycle 2 names a position with no Cycle 1 fuel.");
      return { ...a };
    }
    const f = v as { e: number; ba: number };
    n += 1;
    return { id: `C2-new-${n}`, e: f.e, ba: f.ba, burnup: 0, cycles: 0 };
  });
}

/** Rotate a 15×15 index by 90° clockwise about the centre. */
export function rot90(i: number): number {
  const r = Math.floor(i / N);
  const c = i % N;
  return c * N + (N - 1 - r);
}

/** The four positions a quarter-core position stands for (itself and its three rotations). */
export function orbit(i: number): number[] {
  const out = [i];
  let j = i;
  for (let t = 0; t < 3; t++) {
    j = rot90(j);
    if (!out.includes(j)) out.push(j);
  }
  return out;
}

/** Swap two rotational orbits element by element, so each assembly keeps its own burnup and alignment. */
export function swapOrbits(core: Core, a: number, b: number): Core | null {
  const oa = orbit(a);
  const ob = orbit(b);
  if (oa.length !== ob.length) return null;
  const next = core.slice();
  for (let k = 0; k < oa.length; k++) [next[oa[k]], next[ob[k]]] = [core[ob[k]], core[oa[k]]];
  return next;
}

/** Next outage: discharge the most burned orbits (as many as there are fresh), load fresh of the chosen type. */
export function nextOutage(eoc: Core, fresh: { e: number; ba: number }, cycle: number, freshOrbits = 16): Core {
  const core = endCycle(eoc);
  const orbits = QUARTER.filter((i) => orbit(i).length === 4).map((i) => ({
    i,
    burn: orbit(i).reduce((s, j) => s + (core[j]?.burnup ?? 0), 0) / 4,
  }));
  orbits.sort((x, y) => y.burn - x.burn);
  let n = 0;
  for (const o of orbits.slice(0, freshOrbits)) {
    for (const j of orbit(o.i)) {
      n += 1;
      core[j] = { id: `C${cycle}-new-${n}`, e: fresh.e, ba: fresh.ba, burnup: 0, cycles: 0 };
    }
  }
  return core;
}

/** The positions the player edits: the lower-right quarter including the centre row and column halves. */
export const QUARTER: number[] = (() => {
  const seen = new Set<number>();
  const q: number[] = [];
  for (let r = 7; r < N; r++) {
    for (let c = 7; c < N; c++) {
      const i = r * N + c;
      if (!SHAPE[i] || seen.has(i)) continue;
      for (const j of orbit(i)) seen.add(j);
      q.push(i);
    }
  }
  return q;
})();

export const MEASURED = {
  maps: beavrs.maps,
  letdown: beavrs.letdown as { cycle1: [number, number][]; cycle2: [number, number][] },
  eocEfpd: beavrs.eocEfpd,
  hzpAroBoron: beavrs.hzpAroBoron,
};
