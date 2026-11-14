import { DT_BAND, thermalState, type PlantDesign, type PlantType } from "./plant";

/** Seconds the ΔT band must be held. Same number the bench shows. */
export const BENCH_HOLD: Record<PlantType, number> = { pwr: 8, bwr: 8, pebble: 8, msr: 8 };

const SCRAM_HOT: Record<PlantType, number> = { pwr: 332, bwr: 300, pebble: 950, msr: 750 };

export interface BenchFrame {
  power: number;
  rods: number;
  flow: number;
  hold: number;
  dt: number;
  plant: PlantType | PlantDesign;
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
}

/**
 * One frame of the bench. Pure: the caller applies `write` outside any React state updater.
 * Power eases toward the rods. The shared run is written when the rounded percent changes,
 * and once on a scram. A frame that stays on the same rounded percent writes nothing.
 */
export function stepBench(frame: BenchFrame): BenchResult {
  const type: PlantType = typeof frame.plant === "string" ? frame.plant : frame.plant.type;
  const next = frame.power + (frame.rods - frame.power) * frame.dt * 0.45;
  const band = DT_BAND[type];
  const ts = thermalState(frame.plant, { powerPct: next, flowPct: frame.flow });
  if (ts.dT > band.hi * 1.45 || ts.tHot > SCRAM_HOT[type] || next > 114) {
    return {
      power: next,
      hold: frame.hold,
      scram: true,
      passed: false,
      msg: "Scram. Teaching model — you get the bench again. Heat still had to leave.",
      write: { powerPct: next, scram: true },
      lastWritten: next,
    };
  }
  const inBand = ts.dT >= band.lo && ts.dT <= band.hi;
  const hold = inBand ? frame.hold + frame.dt : 0;
  const justPassed = hold >= BENCH_HOLD[type] && frame.hold < BENCH_HOLD[type];
  const changed = frame.lastWritten === null || Math.round(frame.lastWritten) !== Math.round(next);
  return {
    power: next,
    hold,
    scram: false,
    passed: justPassed,
    msg: justPassed ? "Band held. The courier took the heat. Teaching only." : null,
    write: changed ? { powerPct: next } : null,
    lastWritten: changed ? next : frame.lastWritten,
  };
}
