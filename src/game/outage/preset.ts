/**
 * The preset lattice set: published numbers where they exist, and a fit to measured plant data for the rest.
 *
 * Sourced:
 * - Beginning-of-life k∞ of the nine BEAVRS Cycle 1 assembly types, at hot zero power and 975 ppm, from
 *   NUREG/IA-0529 (Simulations of the BEAVRS PWR with SCALE and PARCS), Table 3-2, 238-group SCALE results.
 * - 975 ppm is the measured Cycle 1 HZP all-rods-out critical boron (BEAVRS spec Table 22), so the core built
 *   from these k∞ values must be critical at that state. That, with the measured zero-power detector map,
 *   fixes the core constants in calibration.ts.
 *
 * Fitted (scripts/outage-calibrate.mjs, against the BEAVRS measured boron letdown, spec Table 24, both cycles):
 * - slope: k∞ lost per GWd/tHM (the linear reactivity model).
 * - baBurnout, baResidual: how fast borosilicate absorber worth burns out, and what is left.
 * - hfpShift: hot full power with equilibrium xenon, relative to hot zero power.
 * - boronWorth: k∞ per ppm.
 *
 * Derived, and so less certain (no published BOL k∞ for them):
 * - 3.2% and 3.4% fuel (Cycle 2): BOL k∞ from a fit of the three published enrichments in ln(e).
 * - Absorber worth per rod at 3.2%: from a straight-line fit of the six published absorber cases.
 */
import type { LatticeCurve, LatticeSet } from "./lattice";

/** NUREG/IA-0529 Table 3-2: 238-group k∞, HZP, 975 ppm, beginning of life. */
export const NUREG_BOL: Record<string, number> = {
  "1.6/0": 0.99173526,
  "2.4/0": 1.13322188,
  "2.4/12": 1.0098699,
  "2.4/16": 0.97153058,
  "3.1/0": 1.2146576,
  "3.1/6": 1.15787893,
  "3.1/15": 1.07351946,
  "3.1/16": 1.0589894,
  "3.1/20": 1.02322324,
};

/** Every type the game can load: the nine Cycle 1 types and the five Cycle 2 fresh types. */
export const PRESET_TYPES: { e: number; ba: number }[] = [
  { e: 1.6, ba: 0 },
  { e: 2.4, ba: 0 },
  { e: 2.4, ba: 12 },
  { e: 2.4, ba: 16 },
  { e: 3.1, ba: 0 },
  { e: 3.1, ba: 6 },
  { e: 3.1, ba: 15 },
  { e: 3.1, ba: 16 },
  { e: 3.1, ba: 20 },
  { e: 3.2, ba: 0 },
  { e: 3.2, ba: 4 },
  { e: 3.2, ba: 8 },
  { e: 3.2, ba: 12 },
  { e: 3.4, ba: 0 },
];

/** k∞(e) at BOL, no absorbers: exact through the three published points, quadratic in ln(e). */
export function bolNoAbsorber(e: number): number {
  const pts: [number, number][] = [
    [Math.log(1.6), NUREG_BOL["1.6/0"]],
    [Math.log(2.4), NUREG_BOL["2.4/0"]],
    [Math.log(3.1), NUREG_BOL["3.1/0"]],
  ];
  const x = Math.log(e);
  // Lagrange form.
  let k = 0;
  for (let i = 0; i < 3; i++) {
    let w = pts[i][1];
    for (let j = 0; j < 3; j++) if (j !== i) w *= (x - pts[j][0]) / (pts[i][0] - pts[j][0]);
    k += w;
  }
  return k;
}

/** BOL absorber penalty per rod: least-squares line in e through the six published absorber cases. */
export function penaltyPerRod(e: number): number {
  const pts: [number, number][] = [];
  for (const [key, k] of Object.entries(NUREG_BOL)) {
    const [es, bas] = key.split("/");
    const ee = Number(es);
    const ba = Number(bas);
    if (ba > 0) pts.push([ee, (NUREG_BOL[`${es}/0`] - k) / ba]);
  }
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n;
  const my = pts.reduce((s, p) => s + p[1], 0) / n;
  const sxy = pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0);
  const sxx = pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
  return my + (sxy / sxx) * (e - mx);
}

export function bol(e: number, ba: number): number {
  const exact = NUREG_BOL[`${e}/${ba}`];
  if (exact !== undefined) return exact;
  return bolNoAbsorber(e) - ba * penaltyPerRod(e);
}

export interface PresetParams {
  slope: number;
  baBurnout: number;
  baResidual: number;
  hfpShift: number;
  boronWorth: number;
}

const GRID: number[] = [
  ...Array.from({ length: 41 }, (_, i) => i * 0.25),
  ...Array.from({ length: 50 }, (_, i) => 11 + i),
];

export function presetCurve(e: number, ba: number, p: PresetParams): LatticeCurve {
  const k0 = bolNoAbsorber(e);
  const p0 = k0 - bol(e, ba);
  return {
    e,
    ba,
    k: GRID.map((b) => {
      const absorber = ba > 0 ? p0 * (p.baResidual + (1 - p.baResidual) * Math.exp(-b / p.baBurnout)) : 0;
      return [b, +(k0 - p.slope * b - absorber).toFixed(6)] as [number, number];
    }),
  };
}

export function presetSet(p: PresetParams, fit: string): LatticeSet {
  return {
    version: 1,
    name: "BEAVRS preset",
    source:
      "BOL k∞: NUREG/IA-0529 Table 3-2 (SCALE, 238 groups). Burnup slope, absorber burnout, HFP shift and boron worth: fitted to the BEAVRS measured boron letdown, Cycles 1 and 2 (spec rev. 3.0.2, Table 24). " +
      fit,
    reference: "Hot zero power, 975 ppm boron, beginning of life (shifted to hot full power, equilibrium xenon, by hfpShift).",
    refBoronPpm: 975,
    hfpShift: p.hfpShift,
    boronWorth: p.boronWorth,
    curves: PRESET_TYPES.map((t) => presetCurve(t.e, t.ba, p)),
  };
}
