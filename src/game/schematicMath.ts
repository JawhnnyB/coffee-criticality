/**
 * Pure drawing helpers for the pixel schematic. No React here, so the rules can be tested in node.
 * The seven temperature bands (STYLE-STANDARD §4) run cold to hot.
 */
export const BANDS = ["#3a78c0", "#4aa0c8", "#7ac0b8", "#e8d070", "#e8963a", "#d4552e", "#a82a3a"] as const;
export const PWR_SCALE = { lo: 285, hi: 350 } as const;
export const NATIVE_W = 160;
export const NATIVE_H = 80;

/** Index 0 (coldest) to 6 (hottest). Values outside the scale are clamped to the end bands. */
export function bandIndex(t: number, lo: number = PWR_SCALE.lo, hi: number = PWR_SCALE.hi): number {
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.min(6, Math.floor(((t - lo) / (hi - lo)) * 7)));
}

export function bandColor(t: number, lo: number = PWR_SCALE.lo, hi: number = PWR_SCALE.hi): string {
  return BANDS[bandIndex(t, lo, hi)];
}

export interface Label {
  /** Top-left corner, in native pixels. */
  x: number;
  y: number;
  text: string;
  color: "cream" | "dim" | "outline" | "gold" | "orange";
  /** Sits on its own object (the core, the steam generator). Exempt from the open-space fit test. */
  inside?: boolean;
}

/** Labels in native pixel coordinates. Each one sits in open space, clear of every drawn object. */
export function pwrLabels(tHot: number, tCold: number): Label[] {
  return [
    { x: 9, y: 33, text: "CORE", color: "outline", inside: true },
    { x: 72, y: 33, text: "SG", color: "cream", inside: true },
    { x: 32, y: 8, text: `HOT ${tHot.toFixed(0)}C`, color: "cream" },
    { x: 32, y: 59, text: `COLD ${tCold.toFixed(0)}C`, color: "cream" },
    { x: 88, y: 15, text: "15.5 MPA", color: "gold" },
    { x: 94, y: 37, text: "HEAT", color: "orange" },
    { x: 144, y: 10, text: `${PWR_SCALE.hi}`, color: "dim" },
    { x: 144, y: 54, text: `${PWR_SCALE.lo}`, color: "dim" },
    { x: 4, y: 68, text: "SIMPLIFIED TEACHING DRAWING.", color: "dim" },
    { x: 4, y: 74, text: "NOT A LICENSE.", color: "dim" },
  ];
}

/** Layout box used by the checks, in native pixels: 4 px advance per character (3 px glyph + 1 px gap), 6 px tall. */
export function labelBox(l: Label): { x0: number; y0: number; x1: number; y1: number } {
  return { x0: l.x, y0: l.y, x1: l.x + 4 * l.text.length, y1: l.y + 6 };
}

/** Every drawn object, in native pixels. drawPwr draws from these, and the layout test checks labels against them. */
export const PWR_SHAPES = {
  core: { x: 4, y: 14, w: 28, h: 42 },
  sg: { x: 68, y: 14, w: 18, h: 42 },
  hot: { x: 32, y: 15, w: 36, h: 6 },
  cold: { x: 32, y: 49, w: 36, h: 6 },
  pump: { x: 37, y: 47, w: 11, h: 11 },
  pzr: { x: 90, y: 22, w: 12, h: 11 },
  heat: { x: 86, y: 39, w: 8, h: 5 },
  bar: { x: 137, y: 14, w: 5, h: 42 },
} as const;
