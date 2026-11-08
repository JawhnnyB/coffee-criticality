/**
 * Read-only numbers for CORE CAM, Results, and Core Map.
 * Nothing here writes the run. The fuel mass stays empty, so burnup is not a number.
 */
import type { Residue } from "./content";
import {
  DT_BAND,
  thermalState,
  type PlantDesign,
  type PlantType,
  type RunPoint,
} from "./plant";

export const BURNUP_PENDING =
  "Pending verification. The fuel mass is not cited, so no MWd/kg is shown.";

export function particleCount(frameCount: number, reduced: boolean): number {
  return reduced ? 0 : frameCount;
}

export interface HealthPart {
  id: "band" | "incident" | "residue" | "k";
  label: string;
  weight: number;
  /** 0 to 1. */
  value: number;
}

export interface Health {
  /** 0 to 100. A readout. It does not change culture, trust, or the ending. */
  score: number;
  parts: HealthPart[];
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/** 1 inside 0.98–1.04. It falls off in a straight line outside that band. */
export function kScore(k: number): number {
  if (!Number.isFinite(k)) return 0;
  if (k >= 0.98 && k <= 1.04) return 1;
  if (k < 0.98) return clamp01(1 - (0.98 - k) / 0.98);
  return clamp01(1 - (k - 1.04) / 1.04);
}

const RESIDUE_KEYS = ["valve", "tag", "dose", "log"] as const;

/** 1 when nothing was hid. A caught field counts as clean. */
export function residueClean(residue: Residue): number {
  const hid = RESIDUE_KEYS.filter((k) => residue[k] === "hid").length;
  return 1 - hid / RESIDUE_KEYS.length;
}

export function inBandFraction(history: readonly { inBand: boolean; t?: number }[]): number {
  const rows =
    history.length > 0 && history.every((s) => typeof s.t === "number")
      ? lastDaySlice(history as readonly { t: number; inBand: boolean }[])
      : history;
  if (!rows.length) return 0;
  let n = 0;
  for (const s of rows) if (s.inBand) n += 1;
  return n / rows.length;
}

/** Samples after the last clock reset. A new day starts the minutes over, so t drops. */
export function lastDaySlice<T extends { t: number }>(history: readonly T[]): readonly T[] {
  let start = 0;
  for (let i = 1; i < history.length; i++) {
    if (history[i].t < history[i - 1].t) start = i;
  }
  return history.slice(start);
}

export function coreHealth(input: {
  inBandFrac: number;
  incidentOpen: boolean;
  residue: Residue;
  k: number;
}): Health {
  const parts: HealthPart[] = [
    { id: "band", label: "Time in band", weight: 0.4, value: clamp01(input.inBandFrac) },
    { id: "incident", label: "No open incident", weight: 0.2, value: input.incidentOpen ? 0 : 1 },
    { id: "residue", label: "Residue clean", weight: 0.2, value: residueClean(input.residue) },
    { id: "k", label: "Classroom k", weight: 0.2, value: kScore(input.k) },
  ];
  const score = Math.round(parts.reduce((n, p) => n + p.weight * p.value, 0) * 100);
  return { score, parts };
}

/** One line. Not a grade. The worst part wins. Stance only speaks when every part is full. */
export function lookLine(stance: string | null | undefined, parts: readonly HealthPart[]): string {
  const worst = [...parts].reduce((a, b) => (b.value < a.value ? b : a));
  if (worst.value < 1) {
    if (worst.id === "band") return "Time in band is low. Watch the hold band in Reactor Control.";
    if (worst.id === "incident") return "An incident is open. Close it before the board is read as clean.";
    if (worst.id === "residue") return "A hide is still on the board. That is not a grade. It is still there.";
    return "Classroom k is outside 0.98 to 1.04. This is a proxy, not a measurement.";
  }
  if (stance === "cautious") return "Nothing is loud. Keep the hold band, and keep the board honest.";
  if (stance === "bold") return "The band is held. Output is the next thing to watch. This is not a grade.";
  return "The four parts are even. Watch the one that moves first.";
}

export interface DailyRow {
  day: number;
  coreHealth: number;
  /** Always null until a fuel mass is cited. */
  burnup: null;
  incidentCount: number;
}

export function makeDaily(input: {
  day: number;
  inBandFrac: number;
  incidentOpen: boolean;
  residue: Residue;
  k: number;
}): DailyRow {
  return {
    day: input.day,
    coreHealth: coreHealth(input).score,
    burnup: null,
    incidentCount: input.incidentOpen ? 1 : 0,
  };
}

/** Teaching ranges for the fuel glow. Not measurements. */
export const T_FUEL_RANGE: Record<PlantType, { lo: number; hi: number }> = {
  pwr: { lo: 300, hi: 1200 },
  bwr: { lo: 280, hi: 1100 },
  pebble: { lo: 250, hi: 1600 },
  msr: { lo: 600, hi: 1400 },
};

export interface CamFrame {
  dT: number;
  tHot: number;
  tCold: number;
  tFuel: number;
  glow: number;
  /** Particle count before reduced motion. Capped at 256. */
  count: number;
  speed: number;
  /** BWR boiling proxy, 0 to 1. */
  voidFrac: number;
  band: "low" | "in" | "high";
  scram: boolean;
}

export function camFrame(
  plant: PlantDesign,
  run: RunPoint & { scram?: boolean },
  scramFactor?: number,
): CamFrame {
  const th = thermalState(plant, run);
  const type = plant.type;
  const P = clamp01(run.powerPct / 100);
  const F = Math.max(0.4, Math.min(1.6, run.flowPct / 100));
  const base = 0.6 * clamp01((plant.enrich - 2) / 3) + 0.4 * (1 - clamp01(plant.burnupMWd_kg / 60));
  const range = T_FUEL_RANGE[type];
  const tt = clamp01((th.tFuel - range.lo) / (range.hi - range.lo));
  const scram = !!run.scram;
  const factor = scramFactor ?? (scram ? 0.15 : 1);
  const glow = (0.4 * base + 0.6 * tt) * factor;
  const count = Math.min(256, Math.round(24 + 96 * P));
  const speed = 20 + 120 * F;
  const band = DT_BAND[type];
  const mark: CamFrame["band"] = th.dT < band.lo ? "low" : th.dT > band.hi ? "high" : "in";
  return {
    dT: th.dT,
    tHot: th.tHot,
    tCold: th.tCold,
    tFuel: th.tFuel,
    glow,
    count,
    speed,
    voidFrac: clamp01((0.5 * P) / F),
    band: mark,
    scram,
  };
}

/** How many cells the teaching view draws. A full core is always more than the 3×3 window. */
export function cellCount(scale: PlantDesign["scale"], sizeClass: 0 | 1 | 2, fullCore: boolean): number {
  if (scale === "rod") return 1;
  if (scale === "assembly") return [16, 36, 64][sizeClass];
  if (!fullCore) return 9;
  return [16, 25, 36][sizeClass];
}

const GLOW_STOPS: { at: number; hex: string }[] = [
  { at: 0, hex: "#3d5c66" },
  { at: 0.6, hex: "#c9a227" },
  { at: 0.85, hex: "#c4783a" },
  { at: 1, hex: "#f3e6d0" },
];

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

/** Steel to gold to copper to cream. No red. */
export function glowColor(glow: number): string {
  const g = clamp01(glow);
  let i = 0;
  while (i < GLOW_STOPS.length - 2 && g > GLOW_STOPS[i + 1].at) i += 1;
  const a = GLOW_STOPS[i];
  const b = GLOW_STOPS[i + 1];
  const t = (g - a.at) / (b.at - a.at || 1);
  const [ar, ag, ab] = hexToRgb(a.hex);
  const [br, bg, bb] = hexToRgb(b.hex);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `#${[c(ar, br), c(ag, bg), c(ab, bb)].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

/** Scram falls to 0.15 over about 3 seconds. Reset climbs back over about 6. */
export function easeScram(factor: number, scram: boolean, dt: number): number {
  const target = scram ? 0.15 : 1;
  const dur = scram ? 3 : 6;
  const max = (0.85 * Math.max(0, dt)) / dur;
  const d = target - factor;
  if (Math.abs(d) <= max) return target;
  return factor + Math.sign(d) * max;
}

export interface FlowDot {
  x: number;
  y: number;
  /** 0 is the downcomer. 1 is the core. */
  lane: 0 | 1;
}

/** Moves the flow pool. Scram or a zero count clears it. Speed is native pixels per second. */
export function stepFlow(
  dots: FlowDot[],
  count: number,
  speed: number,
  type: PlantType,
  dt: number,
  stop: boolean,
): void {
  if (stop || count <= 0) {
    dots.length = 0;
    return;
  }
  const cap = Math.min(256, count);
  while (dots.length < cap) {
    const i = dots.length;
    dots.push({
      x: 20 + ((i * 17) % 120),
      y: 18 + ((i * 13) % 58),
      lane: (i % 2) as 0 | 1,
    });
  }
  if (dots.length > cap) dots.length = cap;
  const v = speed * dt;
  for (const p of dots) {
    if (type === "bwr") {
      p.y -= v;
      if (p.y < 16) p.y = 76;
    } else if (type === "pebble") {
      p.x += v * 0.35;
      p.y += (p.lane ? 0.25 : -0.25) * v;
      if (p.x > 138) p.x = 20;
      if (p.y < 16) p.y = 76;
      if (p.y > 76) p.y = 16;
    } else if (p.lane === 0) {
      p.y += v;
      if (p.y > 76) p.y = 16;
    } else {
      p.y -= v;
      if (p.y < 16) p.y = 76;
    }
  }
}
