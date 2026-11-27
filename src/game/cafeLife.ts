/**
 * The café, alive (tools/roomkit/cafe_candy.py paints it still). Drawn on the world buffer in room pixels, so it
 * scales with everything else and stays crisp:
 *  - behind people: the string lights twinkling along the top of the wall, the clock telling the shift's time, and
 *    the cat asleep on the windowsill, breathing, with the odd flick of the tail;
 *  - in front: steam off Mabel's kettle, the two espressos and the cups on the little table, the record turning,
 *    and dust drifting in the window light.
 * The window is live too: its sky, clouds, far shore and lake follow the clock (daylight.ts), with the sun rising
 * on the left in the morning and setting on the right at the end of the shift, and the moon and stars after dark.
 * Then the room's light (ROOM_LIGHT, applied in render.ts): shade multiplied, the room dimmed by the hour (but not
 * the window), the lamps' warm light up as it gets dark, and the light through the window tinted by the hour.
 * With motion reduced it all holds one frame (the clock still moves the sky).
 */

import { type Daylight, daylightAt, moonAt, sunAt } from "./daylight";

export interface Pen {
  fillStyle: unknown;
  globalAlpha: number;
  fillRect(x: number, y: number, w: number, h: number): void;
}

/**
 * Rooms with painted light: a shade map (multiplied), the lamps' warm light (screened, brighter after dark) and a
 * white mask of the light through the window (tinted by the hour, screened). glass is the window, kept out of the
 * room's dimming so the sky shows true.
 */
export interface RoomLight {
  shade: string;
  lamps: string;
  window: string;
  glass: { x: number; y: number; w: number; h: number };
  /** Inside the glass but in the room (the cat on the sill), so dimmed with it. */
  inside: { x: number; y: number; w: number; h: number }[];
}
export const ROOM_LIGHT: Record<string, RoomLight> = {
  cafe: {
    shade: "/art/rooms/cafe/candy-shade.png?v=candy2",
    lamps: "/art/rooms/cafe/candy-lamps.png?v=candy2",
    window: "/art/rooms/cafe/candy-window.png?v=candy2",
    glass: { x: 96, y: 4, w: 80, h: 30 },
    get inside() {
      return catRects(CAT_AT.x, CAT_AT.y);
    },
  },
};

/** Multiply two colours, the way the room's dimming does, for the window frame drawn over the glass. */
export function mulHex(a: string, b: string): string {
  const x = Number.parseInt(a.slice(1), 16);
  const y = Number.parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round((((x >> s) & 255) * ((y >> s) & 255)) / 255);
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, "0")).join("")}`;
}

const frac = (x: number) => x - Math.floor(x);
function hash(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
function px(g: Pen, x: number, y: number, c: string, w = 1, h = 1) {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), w, h);
}

/** The wire's sag, the same curve the painter used, so the bulbs hang on it. */
export function wireY(x: number): number {
  return Math.round(3 + 2.5 * Math.sin((Math.PI * ((x - 2) % 64)) / 64));
}

export const BULB_X: number[] = Array.from({ length: 19 }, (_, i) => 10 + i * 16 + (i % 2 ? 2 : 0));
const BULB_COLOURS = ["#ffe080", "#ff9aa8", "#a8f0d0", "#a8d0ff"];

/** Clock hands for a time of day in minutes: [hour hand end, minute hand end], from the clock's centre. */
export function clockHands(minutes: number, cx = 63, cy = 16): [[number, number], [number, number]] {
  const m = ((minutes % 720) + 720) % 720;
  const ha = (m / 720) * Math.PI * 2 - Math.PI / 2;
  const ma = ((m % 60) / 60) * Math.PI * 2 - Math.PI / 2;
  return [
    [Math.round(cx + Math.cos(ha) * 3), Math.round(cy + Math.sin(ha) * 3)],
    [Math.round(cx + Math.cos(ma) * 5), Math.round(cy + Math.sin(ma) * 5)],
  ];
}

function hand(g: Pen, x0: number, y0: number, x1: number, y1: number, c: string) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) px(g, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c);
}

const W = { x: 96, y: 4, w: 80, h: 30 };

function hash01(n: number): number {
  return hash(n);
}

/** The far shore and the trees, the same columns the painter used (Python's int() truncates toward zero). */
export function shoreAt(x: number): { far: number; near: number } {
  const far = 3 + Math.trunc(2 * Math.sin(x * 0.09) + 1.5 * Math.sin(x * 0.23));
  const near = 2 + Math.trunc(1.5 * Math.sin(x * 0.31 + 1) + ((x * 7) % 5 === 0 ? 1 : 0));
  return { far, near };
}

function clipPx(g: Pen, x: number, y: number, c: string, w = 1, h = 1, yMax = W.y + W.h - 1) {
  const x0 = Math.max(W.x, Math.round(x));
  const x1 = Math.min(W.x + W.w, Math.round(x) + w);
  const y0 = Math.max(W.y, Math.round(y));
  const y1 = Math.min(yMax + 1, Math.round(y) + h);
  if (x1 <= x0 || y1 <= y0) return;
  g.fillStyle = c;
  g.fillRect(x0, y0, x1 - x0, y1 - y0);
}

function disc(g: Pen, cx: number, cy: number, body: string, core: string, yMax: number) {
  const rows: [number, number][] = [[-1, 3], [-2, 5], [-2, 5], [-2, 5], [-1, 3]];
  rows.forEach(([dx, w], i) => clipPx(g, cx + dx, cy - 2 + i, body, w, 1, yMax));
  clipPx(g, cx - 1, cy - 1, core, 2, 2, yMax);
}

/** The window: sky, sun or moon and stars, clouds, far shore, lake, the sail, then the frame over it. */
export function drawWindow(g: Pen, day: Daylight, minutes: number, t: number, still: boolean) {
  const { x: wx, y: wy, w: ww } = W;
  const sky = [day.skyTop, mixHexLocal(day.skyTop, day.skyMid, 0.5), day.skyMid, mixHexLocal(day.skyMid, day.horizon, 0.4), mixHexLocal(day.skyMid, day.horizon, 0.75), day.horizon];
  for (let y = wy; y < wy + 18; y++) clipPx(g, wx, y, sky[Math.min(5, Math.floor((y - wy) / 3))], ww, 1);
  // stars
  if (day.stars > 0.02) {
    for (let i = 0; i < 16; i++) {
      const tw = still ? 1 : 0.55 + 0.45 * Math.sin(t * (0.8 + hash01(i + 7)) + i * 2.1);
      g.globalAlpha = Math.min(1, day.stars * tw);
      clipPx(g, wx + 1 + Math.floor(hash01(i) * 78), wy + Math.floor(hash01(i + 50) * 11), i % 5 ? "#e8ecff" : "#fff4d0");
    }
    g.globalAlpha = 1;
  }
  // the sun, rising on the left and setting on the right; the moon after dark
  const sun = sunAt(minutes);
  const horizonY = wy + 12;
  if (sun) {
    const cx = Math.round(wx + 3 + sun.x * (ww - 6));
    const cy = Math.round(horizonY - sun.h * 10);
    const low = Math.max(0, Math.min(1, 1 - sun.h * 3));
    const body = mixHexLocal("#fff2b0", "#ff9a50", low);
    const core = mixHexLocal("#ffffff", "#ffd080", low);
    g.globalAlpha = 0.35;
    clipPx(g, cx - 3, cy - 2, mixHexLocal("#fff8d8", "#ffb070", low), 7, 5, horizonY + 1);
    clipPx(g, cx - 2, cy - 3, mixHexLocal("#fff8d8", "#ffb070", low), 5, 7, horizonY + 1);
    g.globalAlpha = 1;
    disc(g, cx, cy, body, core, horizonY + 1);
  }
  const moon = moonAt(minutes);
  if (moon) {
    const cx = Math.round(wx + 3 + moon.x * (ww - 6));
    const cy = Math.round(horizonY - moon.h * 10);
    g.globalAlpha = 0.25;
    clipPx(g, cx - 3, cy - 3, "#c8d0f0", 7, 7, horizonY + 1);
    g.globalAlpha = 1;
    disc(g, cx, cy, "#f4f0dc", "#fffbea", horizonY + 1);
    clipPx(g, cx + 1, cy - 2, day.skyTop, 2, 1, horizonY + 1);                 // a crescent bite
    clipPx(g, cx + 2, cy - 1, day.skyTop, 1, 3, horizonY + 1);
    clipPx(g, cx + 1, cy + 2, day.skyTop, 2, 1, horizonY + 1);
  }
  // two clouds drifting right
  [[0.1, 9], [0.62, 7]].forEach(([base, cy], i) => {
    const cx = wx - 12 + frac(base + (still ? 0 : t * 0.004)) * (ww + 14);
    const under = mixHexLocal(day.cloud, day.skyMid, 0.35);
    clipPx(g, cx, wy + cy - 4, day.cloud, 10, 2);
    clipPx(g, cx + 2, wy + cy - 5, day.cloud, 5, 1);
    clipPx(g, cx + 1, wy + cy - 2, under, 9, 1);
    if (i === 0 && day.stars < 0.5) clipPx(g, cx + 3, wy + cy - 5, mixHexLocal(day.cloud, "#ffffff", 0.5), 2, 1);
  });
  // far shore and the trees on it, with a few lit windows at night
  for (let x = wx; x < wx + ww; x++) {
    const { far, near } = shoreAt(x);
    clipPx(g, x, wy + 16 - far, day.hillFar, 1, far);
    clipPx(g, x, wy + 18 - near, day.hillNear, 1, near);
  }
  if (day.stars > 0.2) {
    for (const x of [103, 116, 128, 147, 165]) {
      g.globalAlpha = Math.min(1, day.stars);
      clipPx(g, x, wy + 16 - shoreAt(x).far + 1, "#ffd070");
    }
    g.globalAlpha = 1;
  }
  // the lake, its sparkles, and the sun's or moon's road across it
  clipPx(g, wx, wy + 18, day.lake, ww, 5);
  clipPx(g, wx, wy + 23, day.lakeDeep, ww, 7);
  for (let i = 0; i < 14; i++) {
    const on = still || frac(t * 0.35 + hash01(i + 30)) < 0.7;
    if (!on) continue;
    clipPx(g, wx + 2 + Math.floor(hash01(i + 20) * 74), wy + 19 + Math.floor(hash01(i + 40) * 10), day.sparkle, 2 + (i % 2), 1);
  }
  const road = sun ?? moon;
  if (road) {
    const rx = Math.round(wx + 3 + road.x * (ww - 6));
    const col = sun ? mixHexLocal("#fff8d8", "#ffb070", Math.max(0, Math.min(1, 1 - sun.h * 3))) : "#e8ecff";
    g.globalAlpha = sun ? 0.35 + 0.4 * Math.max(0, 1 - sun.h * 2) : 0.55;
    for (let y = wy + 18; y < wy + 30; y += 2) {
      const wob = still ? 0 : Math.round(Math.sin(t * 2 + y) * 1);
      clipPx(g, rx - 1 + wob, y, col, 3 - ((y - wy) % 4 === 0 ? 1 : 0), 1);
    }
    g.globalAlpha = 1;
  }
  // the little sail, and its lantern after dark
  const sail = mixHexLocal("#fff8ec", day.skyMid, day.stars * 0.6);
  clipPx(g, 160, wy + 13, mixHexLocal("#6a4a32", day.hillNear, day.stars * 0.5), 1, 6);
  clipPx(g, 156, wy + 14, sail, 4, 4);
  clipPx(g, 157, wy + 13, sail, 3, 1);
  clipPx(g, 155, wy + 19, mixHexLocal("#c4643a", day.hillNear, day.stars * 0.5), 8, 1);
  if (day.stars > 0.2) {
    g.globalAlpha = Math.min(1, day.stars);
    clipPx(g, 161, wy + 17, "#ffd070");
    g.globalAlpha = 1;
  }
  // the frame over the glass, dimmed with the room
  const frame = mulHex("#f6e8d0", day.ambient);
  const frameD = mulHex("#d8c4a0", day.ambient);
  px(g, wx + ww / 2 - 1, wy, frame, 2, 30);
  px(g, wx, wy + 13, frame, ww, 2);
  px(g, wx + ww / 2 + 1, wy, frameD, 1, 30);
  px(g, wx, wy + 15, frameD, ww, 1);
  if (day.stars < 0.3) {
    for (const gx of [wx + 3, wx + ww / 2 + 4]) {
      px(g, gx, wy + 4, "#ffffff");
      px(g, gx + 1, wy + 3, "#ffffff");
      px(g, gx + 2, wy + 2, "#ffffff");
    }
  }
}

function mixHexLocal(a: string, b: string, t: number): string {
  const x = Number.parseInt(a.slice(1), 16);
  const y = Number.parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((x >> s) & 255) + (((y >> s) & 255) - ((x >> s) & 255)) * t);
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, "0")).join("")}`;
}

/** Wall and sill, behind anyone walking. */
export function drawCafeBack(g: Pen, t: number, minutes: number, still: boolean) {
  const tt = still ? 0 : t;
  const day = daylightAt(minutes);
  drawWindow(g, day, minutes, tt, still);
  // The clock tells the shift's time.
  const [[hx1, hy1], [mx1, my1]] = clockHands(minutes);
  hand(g, 63, 16, mx1, my1, "#6a4a32");
  hand(g, 63, 16, hx1, hy1, "#3b2318");
  // The cat on the sill: a ginger loaf, breathing; now and then the tail flicks.
  drawCat(g, CAT_AT.x, CAT_AT.y, !still && frac(tt / 2.4) < 0.5, !still && frac(tt / 7) > 0.92);
}

/** Where the cat sleeps: the left end of the sill (feet of the loaf). */
export const CAT_AT = { x: 102, y: 35 };

/**
 * The cat's pixels as row runs, both breaths and the resting tail, so the room's dimming takes the cat and nothing
 * else of the window (render.ts fills these with the ambient over the bright glass).
 */
let catCache: { x: number; y: number; w: number; h: number }[] | null = null;
export function catRects(x: number, y: number): { x: number; y: number; w: number; h: number }[] {
  if (catCache) return catCache;
  const out: { x: number; y: number; w: number; h: number }[] = [];
  CAT.forEach((row, ry) => {
    let start = -1;
    for (let rx = 0; rx <= row.length; rx++) {
      const on = rx < row.length && row[rx] !== ".";
      if (on && start < 0) start = rx;
      if (!on && start >= 0) {
        const top = y - CAT.length + ry;
        out.push({ x: x + start, y: top - (ry <= 3 ? 1 : 0), w: rx - start, h: ry <= 3 ? 2 : 1 });
        start = -1;
      }
    }
  });
  out.push({ x: x + 6, y: y - 1, w: 12, h: 2 }); // the tail round the front (a flick is too brief to matter)
  catCache = out;
  return out;
}

/** A sleeping ginger cat, loaf-shaped, head down on the left. Feet of the loaf at (x .. x+17, y). */
const CAT = [
  "..oo..oo..........",
  ".oiio.oio.........",
  ".oiiiooiioooooo...",
  "oiiiiiiiooggggggo.",
  "oiuiiuiiogggGgggGo",
  "oikiiiiiogggggGggo",
  ".oiiiiio.gggGgggggo",
  ".owwwwoggggggggggo",
  "..ooooooooooooooo.",
];

function drawCat(g: Pen, x: number, y: number, breathe: boolean, flick: boolean) {
  const col: Record<string, string> = { o: "#3b2318", i: "#e89848", g: "#e09040", G: "#c87830", u: "#3b2318", k: "#f0a8a0", w: "#fff4e8" };
  CAT.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx++) {
      const ch = row[rx];
      if (ch === ".") continue;
      // the back rises a pixel on the in-breath
      const up = breathe && rx >= 8 && ry <= 3 ? -1 : 0;
      px(g, x + rx, y - CAT.length + ry + up, col[ch] ?? "#3b2318");
    }
  });
  px(g, x + 10, y - 7 + (breathe ? -1 : 0), "#f4b868", 5, 1);           // light along the back
  if (flick) {
    px(g, x + 17, y - 9, "#3b2318", 1, 5);
    px(g, x + 18, y - 10, "#e09040", 1, 5);
    px(g, x + 19, y - 10, "#3b2318", 1, 5);
  } else {
    px(g, x + 6, y, "#3b2318", 12, 1);                                     // tail wrapped round the front
    px(g, x + 7, y - 1, "#c87830", 10, 1);
  }
}

/**
 * Light sources, drawn after the room's light so the dark doesn't dim them: the string lights, each bulb on its
 * own slow pulse, with a glow that grows as the lamps come up.
 */
export function drawCafeLights(g: Pen, t: number, minutes: number, still: boolean) {
  const tt = still ? 0 : t;
  const day = daylightAt(minutes);
  BULB_X.forEach((x, i) => {
    const y = wireY(x) + 1;
    const c = BULB_COLOURS[i % BULB_COLOURS.length];
    const on = still ? 1 : 0.55 + 0.45 * Math.sin(tt * (1.1 + hash(i) * 0.9) + i * 1.7);
    g.globalAlpha = (0.15 + 0.35 * day.lamps) * on;
    px(g, x - 1, y - 1, c, 4, 4);
    if (day.lamps > 0.7) {
      g.globalAlpha = 0.18 * on * day.lamps;
      px(g, x - 2, y - 2, c, 6, 6);
    }
    g.globalAlpha = 0.55 + 0.45 * on;
    px(g, x, y, c, 2, 2);
    g.globalAlpha = 1;
    px(g, x, y - 1, "#2a1c14");
  });
}

/** Steam sources, room pixels: the kettle's spout, the two espressos, the cups on the little table. */
export const STEAM = [
  { x: 97, y: 89, n: 4 },
  { x: 57, y: 95, n: 2 },
  { x: 67, y: 95, n: 2 },
  { x: 182, y: 167, n: 2 },
  { x: 188, y: 167, n: 2 },
];

export function steamPuffs(t: number): { x: number; y: number; a: number }[] {
  const out: { x: number; y: number; a: number }[] = [];
  STEAM.forEach((s, si) => {
    for (let k = 0; k < s.n; k++) {
      const u = frac(t / 2.2 + k / s.n + hash(si) * 0.3);
      const rise = u * 11;
      out.push({
        x: Math.round(s.x + Math.sin(u * 6 + si + k) * 1.4),
        y: Math.round(s.y - rise),
        a: u < 0.35 ? 0.55 : u < 0.7 ? 0.38 : 0.18,
      });
    }
  });
  return out;
}

/** Dust in the light just inside the window, drifting down slowly. */
export function dustMotes(t: number): { x: number; y: number; a: number }[] {
  const out: { x: number; y: number; a: number }[] = [];
  for (let i = 0; i < 9; i++) {
    const v = frac(hash(i) + t * 0.01 * (0.6 + hash(i + 9)));
    const y = 38 + v * 42;
    const x = 104 + hash(i + 3) * 64 + Math.sin(t * 0.7 + i) * 2;
    out.push({ x: Math.round(x), y: Math.round(y), a: 0.3 + 0.3 * frac(t * 0.3 + hash(i + 5)) });
  }
  return out;
}

/** Things in the room's air and on the counter, in front of people. */
export function drawCafeFront(g: Pen, t: number, still: boolean, minutes = 720) {
  const tt = still ? 0.6 : t;
  const day = daylightAt(minutes);
  for (const p of steamPuffs(tt)) {
    g.globalAlpha = p.a;
    px(g, p.x, p.y, "#fff8ec");
  }
  for (const m of dustMotes(tt)) {
    g.globalAlpha = m.a * (1 - day.stars) * Math.min(1, day.outsideStrength * 1.4);
    px(g, m.x, m.y, "#fff4d0");
  }
  g.globalAlpha = 1;
  // the record's label going round (record player stamp at 14,204; the disc's centre at 27,214)
  const a = still ? 0 : tt * 3.5;
  px(g, 26, 213, "#c84040", 3, 2);
  px(g, Math.round(27 + Math.cos(a) * 2), Math.round(214 + Math.sin(a) * 1), "#f4ecd8");
}
