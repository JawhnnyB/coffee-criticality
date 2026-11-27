/**
 * The café, alive (tools/roomkit/cafe_candy.py paints it still). Drawn on the world buffer in room pixels, so it
 * scales with everything else and stays crisp:
 *  - behind people: the string lights twinkling along the top of the wall, the clock telling the shift's time, and
 *    the cat asleep on the windowsill, breathing, with the odd flick of the tail;
 *  - in front: steam off Mabel's kettle, the two espressos and the cups on the little table, the record turning,
 *    and dust drifting in the window light.
 * Then the room's own light and shade (ROOM_LIGHT), screen and multiply, over everything, people included.
 * With motion reduced it all holds one frame.
 */

export interface Pen {
  fillStyle: unknown;
  globalAlpha: number;
  fillRect(x: number, y: number, w: number, h: number): void;
}

/** Rooms with painted light: a warm light map screened over the room, a shade map multiplied under it. */
export const ROOM_LIGHT: Record<string, { light: string; shade: string }> = {
  cafe: { light: "/art/rooms/cafe/candy-light.png?v=candy1", shade: "/art/rooms/cafe/candy-shade.png?v=candy1" },
};

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

/** Wall and sill, behind anyone walking. */
export function drawCafeBack(g: Pen, t: number, minutes: number, still: boolean) {
  const tt = still ? 0 : t;
  // String lights: each bulb on its own slow pulse, a little glow when it's bright.
  BULB_X.forEach((x, i) => {
    const y = wireY(x) + 1;
    const c = BULB_COLOURS[i % BULB_COLOURS.length];
    const on = still ? 1 : 0.55 + 0.45 * Math.sin(tt * (1.1 + hash(i) * 0.9) + i * 1.7);
    g.globalAlpha = 0.25 * on;
    px(g, x - 1, y - 1, c, 4, 4);
    g.globalAlpha = 0.55 + 0.45 * on;
    px(g, x, y, c, 2, 2);
    g.globalAlpha = 1;
    px(g, x, y - 1, "#2a1c14");
  });
  // The clock tells the shift's time.
  const [[hx1, hy1], [mx1, my1]] = clockHands(minutes);
  hand(g, 63, 16, mx1, my1, "#6a4a32");
  hand(g, 63, 16, hx1, hy1, "#3b2318");
  // The cat on the sill: a ginger loaf, breathing; now and then the tail flicks.
  drawCat(g, 102, 35, !still && frac(tt / 2.4) < 0.5, !still && frac(tt / 7) > 0.92);
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

/** Dust in the window light: the shaft runs from the window down and to the right. */
export function dustMotes(t: number): { x: number; y: number; a: number }[] {
  const out: { x: number; y: number; a: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const v = frac(hash(i) + t * 0.012 * (0.6 + hash(i + 9)));
    const y = 44 + v * 96;
    const across = hash(i + 3);
    const x0 = 96 + ((y - 36) / 114) * 54;
    const x1 = 176 + ((y - 36) / 114) * 70;
    const x = x0 + 6 + across * (x1 - x0 - 12) + Math.sin(t * 0.7 + i) * 2;
    out.push({ x: Math.round(x), y: Math.round(y), a: 0.35 + 0.35 * frac(t * 0.3 + hash(i + 5)) });
  }
  return out;
}

/** Things in the room's air and on the counter, in front of people. */
export function drawCafeFront(g: Pen, t: number, still: boolean) {
  const tt = still ? 0.6 : t;
  for (const p of steamPuffs(tt)) {
    g.globalAlpha = p.a;
    px(g, p.x, p.y, "#fff8ec");
  }
  for (const m of dustMotes(tt)) {
    g.globalAlpha = m.a;
    px(g, m.x, m.y, "#fff4d0");
  }
  g.globalAlpha = 1;
  // the record's label going round (record player stamp at 14,204; the disc's centre at 27,214)
  const a = still ? 0 : tt * 3.5;
  px(g, 26, 213, "#c84040", 3, 2);
  px(g, Math.round(27 + Math.cos(a) * 2), Math.round(214 + Math.sin(a) * 1), "#f4ecd8");
}
