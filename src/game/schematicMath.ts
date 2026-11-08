/**
 * Pure drawing helpers for the pixel schematic. No React here, so the rules can be tested in node.
 * The seven temperature bands (STYLE-STANDARD §4) run cold to hot.
 */
export const BANDS = ["#3a78c0", "#4aa0c8", "#7ac0b8", "#e8d070", "#e8963a", "#d4552e", "#a82a3a"] as const;
export const PWR_SCALE = { lo: 285, hi: 350 } as const;

/** Index 0 (coldest) to 6 (hottest). Values outside the scale are clamped to the end bands. */
export function bandIndex(t: number, lo: number = PWR_SCALE.lo, hi: number = PWR_SCALE.hi): number {
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.min(6, Math.floor(((t - lo) / (hi - lo)) * 7)));
}

export function bandColor(t: number, lo: number = PWR_SCALE.lo, hi: number = PWR_SCALE.hi): string {
  return BANDS[bandIndex(t, lo, hi)];
}

export interface Label {
  x: number;
  y: number;
  text: string;
  color: "cream" | "dim" | "outline" | "gold" | "orange";
}

/** Labels in native pixel coordinates (160 × 80). The footer is required (§4). */
export function pwrLabels(tHot: number, tCold: number): Label[] {
  return [
    { x: 8, y: 26, text: "CORE", color: "outline" },
    { x: 70, y: 26, text: "SG", color: "cream" },
    { x: 92, y: 24, text: "HEAT", color: "orange" },
    { x: 100, y: 3, text: "15.5 MPA", color: "gold" },
    { x: 32, y: 7, text: `HOT ${tHot.toFixed(0)}C`, color: "cream" },
    { x: 32, y: 55, text: `COLD ${tCold.toFixed(0)}C`, color: "cream" },
    { x: 144, y: 4, text: `${PWR_SCALE.hi}`, color: "dim" },
    { x: 144, y: 40, text: `${PWR_SCALE.lo}`, color: "dim" },
    { x: 4, y: 64, text: "SIMPLIFIED TEACHING DRAWING.", color: "dim" },
    { x: 4, y: 70, text: "NOT A LICENSE.", color: "dim" },
  ];
}
