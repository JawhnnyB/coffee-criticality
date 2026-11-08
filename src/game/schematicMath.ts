/**
 * Pure layout data for the reactor schematics. No React here, so the layout rules can be tested in node.
 * Every plant uses the same native grid (160 × 80), the same outline, footer and colour bar (STYLE-STANDARD §4).
 * The seven temperature bands run cold to hot.
 */
export const BANDS = ["#3a78c0", "#4aa0c8", "#7ac0b8", "#e8d070", "#e8963a", "#d4552e", "#a82a3a"] as const;
export const NATIVE_W = 160;
export const NATIVE_H = 80;

export type PlantKey = "pwr" | "bwr" | "pebble" | "msr";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Scale {
  lo: number;
  hi: number;
}

export interface Label {
  /** Top-left corner, in native pixels. */
  x: number;
  y: number;
  text: string;
  color: "cream" | "dim" | "outline" | "gold" | "orange";
  /** Names the drawn object this label sits inside. Its box must fit inside that object. */
  inside?: string;
}

export const PWR_SCALE: Scale = { lo: 285, hi: 350 };
/**
 * STYLE-STANDARD §4 gives 200–330 °C. The model's BWR range is about 273–277 °C cold and up to about 301 °C
 * hot (full power at the 50% flow minimum). At 200–330 the whole range falls in one band, so the hot and cold
 * legs print the same colour. The range is narrowed to 270–300 so colour still carries the difference; the
 * extreme corner (about 301 °C) reads as the top band.
 */
export const BWR_SCALE: Scale = { lo: 270, hi: 300 };
export const PEBBLE_SCALE: Scale = { lo: 250, hi: 750 };
/**
 * STYLE-STANDARD §4 gives 625–670 °C. The model's full-power hot leg is 678 °C (620 + 58). At 625–670 that
 * value would clamp into the top band under a printed scale that is wrong, so the range is widened.
 */
export const MSR_SCALE: Scale = { lo: 620, hi: 680 };
export const SCALES: Record<PlantKey, Scale> = { pwr: PWR_SCALE, bwr: BWR_SCALE, pebble: PEBBLE_SCALE, msr: MSR_SCALE };

/** Index 0 (coldest) to 6 (hottest). Values outside the scale are clamped to the end bands. */
export function bandIndex(t: number, lo: number = PWR_SCALE.lo, hi: number = PWR_SCALE.hi): number {
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.min(6, Math.floor(((t - lo) / (hi - lo)) * 7)));
}

export function bandColor(t: number, lo: number = PWR_SCALE.lo, hi: number = PWR_SCALE.hi): string {
  return BANDS[bandIndex(t, lo, hi)];
}

/** Layout box used by the checks, in native pixels: 4 px advance per character (3 px glyph + 1 px gap), 6 px tall. */
export function labelBox(l: Label): { x0: number; y0: number; x1: number; y1: number } {
  return { x0: l.x, y0: l.y, x1: l.x + 4 * l.text.length, y1: l.y + 6 };
}

const r = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });

/** The colour bar sits in the same place on every drawing. */
const BAR = r(137, 14, 5, 42);

const f = (t: number) => t.toFixed(0);

function footer(): Label[] {
  return [
    { x: 4, y: 68, text: "SIMPLIFIED TEACHING DRAWING.", color: "dim" },
    { x: 4, y: 74, text: "NOT A LICENSE.", color: "dim" },
  ];
}

function scaleEnds(s: Scale): Label[] {
  return [
    { x: 144, y: 10, text: `${s.hi}`, color: "dim" },
    { x: 144, y: 54, text: `${s.lo}`, color: "dim" },
  ];
}

// ---------------------------------------------------------------- PWR

/** Every drawn object, in native pixels. The layout test checks labels against these. */
export const PWR_SHAPES = {
  core: r(4, 14, 28, 42),
  sg: r(68, 14, 18, 42),
  hot: r(32, 15, 36, 6),
  cold: r(32, 49, 36, 6),
  pump: r(37, 47, 11, 11),
  pzr: r(90, 22, 12, 11),
  heat: r(86, 39, 8, 5),
  /** Control-rod drive housing above the core. The rods enter the core from the top. */
  rods: r(22, 1, 9, 13),
  /** Secondary-side steam, drawn as dots (phase by texture, not colour). */
  steam: r(106, 24, 22, 10),
  bar: BAR,
};

export function pwrLabels(tHot: number, tCold: number): Label[] {
  return [
    { x: 9, y: 33, text: "CORE", color: "outline", inside: "core" },
    { x: 72, y: 33, text: "SG", color: "cream", inside: "sg" },
    { x: 32, y: 8, text: `HOT ${f(tHot)}C`, color: "cream" },
    { x: 32, y: 59, text: `COLD ${f(tCold)}C`, color: "cream" },
    { x: 88, y: 15, text: "15.5 MPA", color: "gold" },
    { x: 94, y: 37, text: "HEAT", color: "orange" },
    { x: 2, y: 6, text: "RODS", color: "dim" },
    ...scaleEnds(PWR_SCALE),
    ...footer(),
  ];
}

// ---------------------------------------------------------------- BWR

export const BWR_SHAPES = {
  vessel: r(46, 4, 32, 52),
  /** Steam dome and separators at the top of the vessel. */
  dome: r(50, 7, 24, 9),
  core: r(52, 28, 20, 20),
  downL: r(47, 16, 4, 38),
  downR: r(73, 16, 4, 38),
  /** Steam line to the turbine. Steam is dots. */
  steamLine: r(78, 7, 34, 5),
  turbine: r(112, 3, 14, 16),
  /** Feedwater returns into the downcomer. */
  feed: r(78, 39, 28, 5),
  /** Recirculation loop and its pump. */
  recirc: r(35, 51, 11, 5),
  pump: r(25, 48, 11, 11),
  /** Control-rod drives enter the vessel from below. */
  rods: r(56, 56, 16, 7),
  bar: BAR,
};

export function bwrLabels(tHot: number, tCold: number): Label[] {
  return [
    { x: 4, y: 6, text: "7.2 MPA", color: "gold" },
    { x: 78, y: 14, text: `HOT ${f(tHot)}C`, color: "cream" },
    { x: 78, y: 46, text: `COLD ${f(tCold)}C`, color: "cream" },
    { x: 100, y: 22, text: "TURBINE", color: "cream" },
    { x: 54, y: 37, text: "CORE", color: "outline", inside: "core" },
    { x: 76, y: 58, text: "RODS", color: "dim" },
    ...scaleEnds(BWR_SCALE),
    ...footer(),
  ];
}

// ---------------------------------------------------------------- Pebble bed

export const PEBBLE_SHAPES = {
  vessel: r(26, 4, 36, 56),
  bedTop: r(31, 10, 26, 22),
  bedBot: r(31, 32, 26, 23),
  riser: r(18, 8, 5, 53),
  plenum: r(18, 5, 40, 5),
  hotPipe: r(56, 49, 44, 5),
  sg: r(100, 26, 16, 35),
  coldRet: r(18, 60, 82, 5),
  heat: r(116, 40, 4, 2),
  bar: BAR,
};

export function pebbleLabels(tHot: number, tCold: number): Label[] {
  return [
    { x: 2, y: 30, text: "BED", color: "cream" },
    { x: 66, y: 6, text: "HE 7 MPA", color: "gold" },
    { x: 62, y: 42, text: `HOT ${f(tHot)}C`, color: "cream" },
    { x: 62, y: 54, text: `COLD ${f(tCold)}C`, color: "cream" },
    { x: 105, y: 40, text: "SG", color: "cream", inside: "sg" },
    { x: 118, y: 45, text: "HEAT", color: "orange" },
    ...scaleEnds(PEBBLE_SCALE),
    ...footer(),
  ];
}

// ---------------------------------------------------------------- Molten salt

export const MSR_SHAPES = {
  core: r(16, 8, 30, 44),
  str0: r(20, 11, 2, 38),
  str1: r(25, 11, 2, 38),
  str2: r(30, 11, 2, 38),
  str3: r(35, 11, 2, 38),
  str4: r(40, 11, 2, 38),
  pumpBowl: r(54, 4, 14, 12),
  hotSalt: r(46, 10, 8, 5),
  toHx: r(68, 10, 9, 5),
  hx: r(77, 8, 16, 30),
  retPipe: r(46, 35, 31, 5),
  coolOut: r(93, 13, 7, 5),
  sg: r(100, 8, 16, 30),
  coolRet: r(93, 29, 7, 5),
  heat: r(116, 20, 4, 2),
  freeze: r(27, 52, 6, 6),
  drain: r(20, 58, 20, 8),
  bar: BAR,
};

export function msrLabels(tHot: number, tCold: number): Label[] {
  return [
    { x: 4, y: 2, text: "0.2 MPA", color: "gold" },
    { x: 48, y: 40, text: `HOT ${f(tHot)}C`, color: "cream" },
    { x: 48, y: 47, text: `COLD ${f(tCold)}C`, color: "cream" },
    { x: 82, y: 20, text: "HX", color: "cream", inside: "hx" },
    { x: 106, y: 20, text: "SG", color: "cream", inside: "sg" },
    { x: 118, y: 26, text: "HEAT", color: "orange" },
    { x: 44, y: 60, text: "DRAIN", color: "dim" },
    ...scaleEnds(MSR_SCALE),
    ...footer(),
  ];
}

/** Everything the canvas and the layout test need for one plant. */
export const DRAWINGS: Record<
  PlantKey,
  { scale: Scale; shapes: Record<string, Rect>; labels: (tHot: number, tCold: number) => Label[] }
> = {
  pwr: { scale: PWR_SCALE, shapes: PWR_SHAPES, labels: pwrLabels },
  bwr: { scale: BWR_SCALE, shapes: BWR_SHAPES, labels: bwrLabels },
  pebble: { scale: PEBBLE_SCALE, shapes: PEBBLE_SHAPES, labels: pebbleLabels },
  msr: { scale: MSR_SCALE, shapes: MSR_SHAPES, labels: msrLabels },
};
