/**
 * Daylight by the clock, for rooms with a window and painted light (the café first). One day, keyed by game minutes:
 * night, dawn, sunrise, morning, midday, golden hour, sunset, dusk, night again. A shift runs from about 06:40 to
 * 17:10, so a day in the café opens on the sunrise and clocks out into the sunset; night shows after dark.
 *
 * Each key holds the window's colours (sky, clouds, far shore, lake), the light coming in through the glass (its
 * colour and strength: pale gold by day, orange low in the sky, a cool white under the moon), the room's ambient
 * (multiplied over everything but the window: white by day, a soft blue-grey at night), and how far up the lamps
 * are (low by day, full at night). Between keys everything blends, in five-minute steps so it changes the way
 * pixel art should: in steps, not smears.
 * Pure: no DOM.
 */

export type Hex = string;

export interface Daylight {
  key: string;
  skyTop: Hex;
  skyMid: Hex;
  horizon: Hex;
  cloud: Hex;
  hillFar: Hex;
  hillNear: Hex;
  lake: Hex;
  lakeDeep: Hex;
  sparkle: Hex;
  /** Light through the window. */
  outside: Hex;
  outsideStrength: number;
  /** Multiplied over the room, not the window. */
  ambient: Hex;
  /** How far up the lamps are, 0..1. */
  lamps: number;
  stars: number;
}

type Key = Omit<Daylight, "key"> & { at: number; key: string };

const NIGHT = {
  skyTop: "#141a38", skyMid: "#1e2a50", horizon: "#2e3c64", cloud: "#2a3458", hillFar: "#1e2a3c", hillNear: "#141e2a",
  lake: "#1a2c48", lakeDeep: "#142238", sparkle: "#8a9ac8", outside: "#b8c8f0", outsideStrength: 0.3,
  ambient: "#4e5078", lamps: 1, stars: 1,
};

/** Minutes after midnight, in order. The first and last keys are the same night, so the day wraps. */
export const KEYS: Key[] = [
  { at: 0, key: "night", ...NIGHT },
  { at: 330, key: "night", ...NIGHT },
  {
    at: 385, key: "dawn", skyTop: "#2a3468", skyMid: "#6a5a8a", horizon: "#d88a8a", cloud: "#a87a98", hillFar: "#4a4a6a",
    hillNear: "#2e3446", lake: "#4a5a80", lakeDeep: "#3a4a6a", sparkle: "#e8b0b0", outside: "#ffc8b0", outsideStrength: 0.45,
    ambient: "#a89cb0", lamps: 0.85, stars: 0.35,
  },
  {
    at: 425, key: "sunrise", skyTop: "#6a8ac8", skyMid: "#e8a0a0", horizon: "#ffc078", cloud: "#ffd0c0", hillFar: "#8a7a8a",
    hillNear: "#4a5a5a", lake: "#7a8ab0", lakeDeep: "#5a6a98", sparkle: "#ffd0a0", outside: "#ffc890", outsideStrength: 0.75,
    ambient: "#f0dcd0", lamps: 0.62, stars: 0,
  },
  {
    at: 490, key: "morning", skyTop: "#90c8e8", skyMid: "#b8dcf0", horizon: "#e8f0e0", cloud: "#ffffff", hillFar: "#86b09a",
    hillNear: "#5e8c6c", lake: "#5aa4bc", lakeDeep: "#4c94ae", sparkle: "#a8dcea", outside: "#ffe8b8", outsideStrength: 0.6,
    ambient: "#fff6ec", lamps: 0.45, stars: 0,
  },
  {
    at: 720, key: "midday", skyTop: "#a8d8ea", skyMid: "#c2e4f2", horizon: "#e6f0dc", cloud: "#ffffff", hillFar: "#86b09a",
    hillNear: "#5e8c6c", lake: "#5aa4bc", lakeDeep: "#4c94ae", sparkle: "#a8dcea", outside: "#fff0c8", outsideStrength: 0.55,
    ambient: "#ffffff", lamps: 0.38, stars: 0,
  },
  {
    at: 930, key: "golden", skyTop: "#98c0e0", skyMid: "#e8d0a8", horizon: "#ffd890", cloud: "#fff0d0", hillFar: "#a0a080",
    hillNear: "#6a7a58", lake: "#7aa0b0", lakeDeep: "#6a8aa0", sparkle: "#ffe8a8", outside: "#ffd8a0", outsideStrength: 0.7,
    ambient: "#fff0dc", lamps: 0.55, stars: 0,
  },
  {
    at: 990, key: "sunset", skyTop: "#5a5a98", skyMid: "#e07a6a", horizon: "#ffa050", cloud: "#ff9a78", hillFar: "#7a5a6a",
    hillNear: "#3e3a4a", lake: "#8a6a8a", lakeDeep: "#6a5078", sparkle: "#ffb070", outside: "#ffa868", outsideStrength: 0.85,
    ambient: "#f0d0bc", lamps: 0.75, stars: 0,
  },
  {
    at: 1035, key: "dusk", skyTop: "#232a58", skyMid: "#4a4a80", horizon: "#a86a78", cloud: "#5a4a70", hillFar: "#3a3a54",
    hillNear: "#22283a", lake: "#3a4670", lakeDeep: "#2c3860", sparkle: "#c89ab0", outside: "#d0c0e0", outsideStrength: 0.5,
    ambient: "#9a90b0", lamps: 0.9, stars: 0.4,
  },
  { at: 1110, key: "night", ...NIGHT },
  { at: 1440, key: "night", ...NIGHT },
];

/**
 * A preview seam: hold the sky at a time of day without moving the shift's clock (the shift ends at 16:48, so night
 * never comes in play yet). Test hook setSky; null goes back to the clock.
 */
let override: number | null = null;
export function setSkyOverride(minutes: number | null) {
  override = minutes;
}
export function skyMinutes(clock: number): number {
  return override ?? clock;
}
export function skyOverridden(): boolean {
  return override !== null;
}

/** The walk in to a night watch happens at this hour (the openers say 18:00). */
export const NIGHT_WALK_MINUTES = 18 * 60;

/** The sun is up between these (it touches the far shore at each end). */
export const SUNRISE = 395;
export const SUNSET = 1020;

function hx(c: Hex): [number, number, number] {
  const n = Number.parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function toHex([r, g, b]: number[]): Hex {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}
export function mixHex(a: Hex, b: Hex, t: number): Hex {
  const x = hx(a);
  const y = hx(b);
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
}

/** Where in the day: minutes wrapped to 0..1440, stepped to five minutes. */
export function stepMinutes(minutes: number): number {
  const m = ((minutes % 1440) + 1440) % 1440;
  return Math.floor(m / 5) * 5;
}

export function daylightAt(minutes: number): Daylight {
  const m = stepMinutes(minutes);
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1].at <= m) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = b.at === a.at ? 0 : (m - a.at) / (b.at - a.at);
  const out: Record<string, unknown> = { key: t < 0.5 ? a.key : b.key };
  for (const k of Object.keys(a) as (keyof Key)[]) {
    if (k === "at" || k === "key") continue;
    const va = a[k];
    const vb = b[k];
    out[k] = typeof va === "number" ? va + ((vb as number) - va) * t : mixHex(va as Hex, vb as Hex, t);
  }
  return out as unknown as Daylight;
}

/** The sun across the window: x along 0..1 left to right, height 0 (on the far shore) to 1 (top). Null at night. */
export function sunAt(minutes: number): { x: number; h: number } | null {
  const m = stepMinutes(minutes);
  if (m < SUNRISE || m > SUNSET) return null;
  const u = (m - SUNRISE) / (SUNSET - SUNRISE);
  return { x: u, h: Math.sin(Math.PI * u) };
}

/** The moon, the same way, from dusk to dawn. */
export function moonAt(minutes: number): { x: number; h: number } | null {
  const m0 = stepMinutes(minutes);
  const m = m0 < 720 ? m0 + 1440 : m0;
  const rise = 1080;
  const set = 1440 + 380;
  if (m < rise || m > set) return null;
  const u = (m - rise) / (set - rise);
  return { x: u, h: Math.sin(Math.PI * u) };
}
