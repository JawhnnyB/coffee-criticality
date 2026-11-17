import { DT_BAND, thermalState, type PlantType } from "./plant";

/** Seconds the ΔT band must be held. Same number the bench shows. */
export const BENCH_HOLD: Record<PlantType, number> = { pwr: 8, bwr: 8, pebble: 8, msr: 8 };

const SCRAM_HOT: Record<PlantType, number> = { pwr: 332, bwr: 300, pebble: 950, msr: 750 };

/**
 * Point kinetics for the bench. One delayed group, prompt-jump form. Teaching proxies, not plant data.
 * beta and lambda are the usual textbook one-group values for thermal U-235 fission.
 * timeScale runs the delayed tail at classroom speed, so a visit takes seconds and not minutes.
 * rodSpeed is how fast the rods follow the slider, in percent per second.
 */
export const KINETICS = { beta: 0.0065, lambda: 0.08, timeScale: 3, rodSpeed: 12 };

/** Reactivity the fuel gives back from zero to full power (Δk/k). Rod worth over the slider is the same size. */
export const POWER_DEFECT: Record<PlantType, number> = { pwr: 0.012, bwr: 0.02, pebble: 0.03, msr: 0.01 };

/**
 * Reactivity per °C of mean coolant temperature (Δk/k per °C). Negative on every type.
 * The BWR number stands in for voids, which is why it is the largest.
 */
export const COOLANT_COEFF: Record<PlantType, number> = { pwr: -2.5e-4, bwr: -1.5e-3, pebble: -4e-5, msr: -5e-5 };

function meanCoolant(plant: PlantType, powerPct: number, flowPct: number): number {
  const ts = thermalState(plant, { powerPct, flowPct });
  return (ts.tCold + ts.tHot) / 2;
}

/**
 * Net reactivity (Δk/k) at this power, rod position, and flow.
 * Zero when power equals the rod percent at the reference flow. Slower flow runs the coolant
 * hotter at the same power, which takes reactivity away.
 */
export function benchReactivity(plant: PlantType, powerPct: number, rodPos: number, flow: number, flowRef = 100): number {
  const rod = (POWER_DEFECT[plant] * (rodPos - powerPct)) / 100;
  const coolant = COOLANT_COEFF[plant] * (meanCoolant(plant, powerPct, flow) - meanCoolant(plant, powerPct, flowRef));
  return rod + coolant;
}

/**
 * Prompt-jump power for a precursor level. Solves n * (beta - rho(n)) = beta * c.
 * rho falls with n, so the bracket [0, hi] always holds one root.
 */
function promptPower(plant: PlantType, c: number, rodPos: number, flow: number, flowRef: number): number {
  const { beta } = KINETICS;
  const f = (n: number) => n * (beta - benchReactivity(plant, n, rodPos, flow, flowRef)) - beta * c;
  let lo = 0;
  let hi = Math.max(200, c * 4);
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

export interface BenchFrame {
  power: number;
  rods: number;
  flow: number;
  hold: number;
  dt: number;
  plant: PlantType;
  /** Delayed-neutron precursor level, in power percent. Omitted on the first frame: starts at `power`. */
  precursors?: number;
  /** Where the rods are. They follow `rods` at KINETICS.rodSpeed. Omitted: the rods are already there. */
  rodPos?: number;
  /** The design flow. Reactivity is zero when power equals the rods at this flow. Omitted: 100. */
  flowRef?: number;
  /** Last power written to the shared run. Null until the first write of this visit. */
  lastWritten: number | null;
}

export interface BenchWrite {
  powerPct: number;
  scram?: boolean;
}

export interface BenchResult {
  power: number;
  hold: number;
  scram: boolean;
  passed: boolean;
  msg: string | null;
  /** Null when this frame did not change the shared run. One write per change, not one per frame. */
  write: BenchWrite | null;
  lastWritten: number | null;
  precursors: number;
  rodPos: number;
  /** Net reactivity at the end of the frame, in pcm. */
  rhoPcm: number;
}

/**
 * One frame of the bench. Pure: the caller applies `write` outside any React state updater.
 * The rods walk toward the slider. Power takes the prompt jump for the reactivity that leaves,
 * then follows the delayed neutrons until fuel and coolant feedback bring reactivity back to zero.
 * At the reference flow that rest point is power equal to the rod percent.
 * The shared run is written when the rounded percent changes, and once on a scram.
 * A frame that stays on the same rounded percent writes nothing.
 */
export function stepBench(frame: BenchFrame): BenchResult {
  const flowRef = frame.flowRef ?? 100;
  let rodPos = frame.rodPos ?? frame.rods;
  let c = frame.precursors ?? frame.power;
  let next = frame.power;
  const steps = Math.max(1, Math.ceil(frame.dt / 0.02));
  const h = frame.dt / steps;
  for (let i = 0; i < steps; i++) {
    const gap = frame.rods - rodPos;
    const reach = KINETICS.rodSpeed * h;
    rodPos += Math.abs(gap) <= reach ? gap : Math.sign(gap) * reach;
    next = promptPower(frame.plant, c, rodPos, frame.flow, flowRef);
    c += KINETICS.lambda * KINETICS.timeScale * (next - c) * h;
  }
  const rhoPcm = benchReactivity(frame.plant, next, rodPos, frame.flow, flowRef) * 1e5;
  const state = { precursors: c, rodPos, rhoPcm };
  const band = DT_BAND[frame.plant];
  const ts = thermalState(frame.plant, { powerPct: next, flowPct: frame.flow });
  if (ts.dT > band.hi * 1.45 || ts.tHot > SCRAM_HOT[frame.plant] || next > 114) {
    return {
      power: next,
      hold: frame.hold,
      scram: true,
      passed: false,
      msg: "Scram. Teaching model — you get the bench again. Heat still had to leave.",
      write: { powerPct: next, scram: true },
      lastWritten: next,
      ...state,
    };
  }
  const inBand = ts.dT >= band.lo && ts.dT <= band.hi;
  const hold = inBand ? frame.hold + frame.dt : 0;
  const justPassed = hold >= BENCH_HOLD[frame.plant] && frame.hold < BENCH_HOLD[frame.plant];
  const changed = frame.lastWritten === null || Math.round(frame.lastWritten) !== Math.round(next);
  return {
    power: next,
    hold,
    scram: false,
    passed: justPassed,
    msg: justPassed ? "Band held. The courier took the heat. Teaching only." : null,
    write: changed ? { powerPct: next } : null,
    lastWritten: changed ? next : frame.lastWritten,
    ...state,
  };
}
