import { PAL } from "./palette";
import {
  CUTAWAY_H,
  CUTAWAY_W,
  PLANTS,
  cherenkov,
  type Comp,
  type CutawayKind,
  type Medium,
  type PipeTemp,
  type PlantDrawing,
} from "./plantLoops";

/**
 * Paints a plant cutaway at 320 x 180, one canvas pixel per art pixel. No letters.
 * Everything that moves is driven by `t` (seconds), so a still frame is just t = 0.
 * hot: the core is making heat. A cool PWR has no Cherenkov glow and no steam.
 */
export interface CutawayFrame {
  hot: boolean;
  t: number;
}

type G = CanvasRenderingContext2D;

const fill = (g: G, x: number, y: number, w: number, h: number, c: string) => {
  if (w <= 0 || h <= 0) return;
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

const box = (g: G, x: number, y: number, w: number, h: number, body: string, edge: string = PAL.outline) => {
  fill(g, x, y, w, h, edge);
  fill(g, x + 1, y + 1, w - 2, h - 2, body);
};

/** A tank with rounded ends: the outline steps in two pixels at each corner. */
const capsule = (g: G, x: number, y: number, w: number, h: number, body: string, vertical = true) => {
  const r = Math.min(4, Math.floor((vertical ? w : h) / 3));
  for (let i = 0; i < (vertical ? h : w); i++) {
    const from = Math.min(i, (vertical ? h : w) - 1 - i);
    const inset = from >= r ? 0 : Math.round(r - Math.sqrt(r * r - (r - from) * (r - from)));
    if (vertical) {
      fill(g, x + inset, y + i, w - inset * 2, 1, PAL.outline);
      if (from > 0) fill(g, x + inset + 1, y + i, w - inset * 2 - 2, 1, body);
    } else {
      fill(g, x + i, y + inset, 1, h - inset * 2, PAL.outline);
      if (from > 0) fill(g, x + i, y + inset + 1, 1, h - inset * 2 - 2, body);
    }
  }
};

const disc = (g: G, cx: number, cy: number, r: number, c: string) => {
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.round(Math.sqrt(r * r - dy * dy));
    fill(g, cx - half, cy + dy, half * 2 + 1, 1, c);
  }
};

/** Stable noise in 0..1. */
const hash = (a: number, b: number) => {
  let n = (a * 374761393 + b * 668265263) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return (((n ^ (n >>> 16)) >>> 0) % 1000) / 1000;
};

interface PipeLook {
  body: string;
  dash: string;
  width: number;
  /** Pixels per second the dashes move. Zero: no flow. */
  speed: number;
  /** Fuel is in this pipe. Drawn with a gold centre line. */
  fuel: boolean;
}

function pipeLook(medium: Medium, temp: PipeTemp, running: boolean): PipeLook {
  const speed = running ? (temp === "steam" ? 30 : 16) : 0;
  if (temp === "steam") return { body: PAL.white, dash: PAL.ash, width: 5, speed, fuel: false };
  if (medium === "helium")
    return temp === "hot"
      ? { body: PAL.copperL, dash: PAL.cream, width: 7, speed: speed * 1.6, fuel: false }
      : { body: PAL.steelL, dash: PAL.creamD, width: 7, speed: speed * 1.6, fuel: false };
  if (medium === "fuelSalt")
    return temp === "hot" ? { body: PAL.gold, dash: PAL.goldL, width: 5, speed, fuel: true } : { body: PAL.goldD, dash: PAL.gold, width: 5, speed, fuel: true };
  if (medium === "nitrate") return temp === "hot" ? { body: PAL.bad, dash: PAL.copperL, width: 5, speed, fuel: false } : { body: PAL.wine, dash: PAL.bad, width: 5, speed, fuel: false };
  return temp === "hot" ? { body: PAL.copper, dash: PAL.copperL, width: 5, speed, fuel: false } : { body: PAL.sky, dash: PAL.cream, width: 5, speed, fuel: false };
}

/** Draws a pipe along its corner points, then moving dashes in the flow direction. */
function pipe(g: G, pts: [number, number][], look: PipeLook, t: number) {
  const half = Math.floor(look.width / 2);
  const seg = (a: [number, number], b: [number, number], pad: number, c: string) => {
    const x0 = Math.min(a[0], b[0]);
    const y0 = Math.min(a[1], b[1]);
    const x1 = Math.max(a[0], b[0]);
    const y1 = Math.max(a[1], b[1]);
    fill(g, x0 - pad, y0 - pad, x1 - x0 + pad * 2 + 1, y1 - y0 + pad * 2 + 1, c);
  };
  for (let i = 0; i + 1 < pts.length; i++) seg(pts[i], pts[i + 1], half, PAL.outline);
  for (let i = 0; i + 1 < pts.length; i++) seg(pts[i], pts[i + 1], half - 1, look.body);
  if (look.fuel) for (let i = 0; i + 1 < pts.length; i++) seg(pts[i], pts[i + 1], 0, PAL.goldL);
  if (look.speed <= 0) return;
  // Dashes: two pixels every eight along the run, moving from the first point to the last.
  let along = 0;
  const offset = (t * look.speed) % 8;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [a, b] = [pts[i], pts[i + 1]];
    const len = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
    const dx = Math.sign(b[0] - a[0]);
    const dy = Math.sign(b[1] - a[1]);
    for (let s = 0; s < len; s++) {
      const k = (along + s - offset + 800) % 8;
      if (k < 2) fill(g, a[0] + dx * s, a[1] + dy * s, 1, 1, look.dash);
    }
    along += len;
  }
}

/** A small arrowhead on the longest run of a pipe, pointing the way the fluid goes. Shows flow in a still. */
function arrow(g: G, pts: [number, number][], color: string) {
  let best = 0;
  let at = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const len = Math.abs(pts[i + 1][0] - pts[i][0]) + Math.abs(pts[i + 1][1] - pts[i][1]);
    if (len > best) {
      best = len;
      at = i;
    }
  }
  if (best < 14) return;
  const [a, b] = [pts[at], pts[at + 1]];
  const mx = Math.round((a[0] + b[0]) / 2);
  const my = Math.round((a[1] + b[1]) / 2);
  const dx = Math.sign(b[0] - a[0]);
  const dy = Math.sign(b[1] - a[1]);
  // A chevron four rows deep: the tip, then wider rows behind it. It covers the pipe and the outline.
  for (let k = 0; k < 4; k++) {
    if (dx !== 0) fill(g, mx + dx * (2 - k), my - k, 1, k * 2 + 1, color);
    else fill(g, mx - k, my + dy * (2 - k), k * 2 + 1, 1, color);
  }
}

/** True when some pipe ends on the top edge of this part, so a motor there would cover it. */
function topTaken(p: PlantDrawing, c: Comp) {
  const ends = [...p.pipes, ...p.branches].flatMap((q) => [q.pts[0], q.pts[q.pts.length - 1]]);
  return ends.some(([x, y]) => Math.abs(y - c.y) <= 1 && x >= c.x && x <= c.x + c.w);
}

function pump(g: G, p: PlantDrawing, c: Comp, t: number, running: boolean) {
  const cx = c.x + Math.floor(c.w / 2);
  const cy = c.y + Math.floor(c.h / 2);
  const r = Math.floor(Math.min(c.w, c.h) / 2) - 1;
  if (!topTaken(p, c)) {
    // The motor stands on the volute: a finned can and a shaft.
    const mh = Math.round(c.h * 0.7);
    box(g, cx - 5, c.y - mh, 11, mh - 2, PAL.steel);
    for (let y = c.y - mh + 2; y < c.y - 3; y += 2) fill(g, cx - 4, y, 9, 1, PAL.steelD);
    fill(g, cx - 3, c.y - mh - 2, 7, 2, PAL.outline);
    fill(g, cx, c.y - 3, 1, 3, PAL.outline);
  }
  disc(g, cx, cy, r, PAL.outline);
  disc(g, cx, cy, r - 1, PAL.steelL);
  disc(g, cx, cy, r - 3, PAL.steelD);
  // Impeller: four vanes that turn while the pump runs.
  const a0 = running ? t * 9 : 0.4;
  for (let k = 0; k < 4; k++) {
    const a = a0 + (k * Math.PI) / 2;
    for (let s = 1; s < r - 2; s++) fill(g, Math.round(cx + Math.cos(a) * s), Math.round(cy + Math.sin(a) * s), 1, 1, PAL.cream);
  }
  fill(g, cx - 1, cy - 1, 3, 3, PAL.gold);
}

function steamGen(g: G, c: Comp, plant: PlantDrawing, frame: CutawayFrame, running: boolean) {
  capsule(g, c.x, c.y, c.w, c.h, PAL.steel);
  const ix = c.x + 3;
  const iw = c.w - 6;
  if (plant.kind === "pwr") {
    // Channel head: hot side and cold side, split by the divider plate.
    const headY = c.y + c.h - 12;
    fill(g, ix, headY, iw, 9, PAL.outline);
    fill(g, ix + 1, headY + 1, Math.floor(iw / 2) - 1, 7, frame.hot ? PAL.copper : PAL.sky);
    fill(g, ix + Math.floor(iw / 2) + 1, headY + 1, Math.floor(iw / 2) - 2, 7, PAL.sky);
    fill(g, ix, headY - 2, iw, 2, PAL.steelD);
    // Secondary water up to the level, steam above it.
    const level = c.y + Math.round(c.h * 0.42);
    fill(g, ix, level, iw, headY - 2 - level, PAL.sky);
    fill(g, ix, c.y + 3, iw, level - c.y - 3, PAL.white);
    // U-tubes: hot water up the left legs, over, and down the right legs.
    for (let k = 0; k < 4; k++) {
      const left = ix + 2 + k * 2;
      const right = ix + iw - 3 - k * 2;
      const top = level + 2 + k * 3;
      fill(g, left, top, 1, headY - 2 - top, frame.hot ? PAL.copper : PAL.steelL);
      fill(g, right, top, 1, headY - 2 - top, frame.hot ? PAL.copperD : PAL.steelL);
      fill(g, left, top, right - left + 1, 1, frame.hot ? PAL.copperD : PAL.steelL);
    }
    // Separators and dryer in the steam dome.
    for (let k = 0; k < 3; k++) box(g, ix + 3 + k * 9, level - 12, 6, 9, PAL.steelL);
    for (let x = ix + 2; x < ix + iw - 2; x += 4) {
      fill(g, x, c.y + 7, 2, 1, PAL.ash);
      fill(g, x + 2, c.y + 8, 2, 1, PAL.ash);
    }
    fill(g, ix, level, iw, 1, PAL.steelD);
    if (running) boil(g, ix + 1, level + 1, iw - 2, headY - level - 8, frame.t);
    return;
  }
  // Once-through steam generator for gas and salt: a helical coil, water in at the bottom, steam out at the top.
  fill(g, ix, c.y + 3, iw, c.h - 6, plant.coreMedium === "helium" ? PAL.steelD : PAL.woodMid);
  const coilTop = c.y + 10;
  const coilBot = c.y + c.h - 10;
  for (let y = coilTop; y < coilBot; y += 4) {
    const frac = (y - coilTop) / (coilBot - coilTop);
    const color = frac < 0.35 ? PAL.white : frac < 0.7 ? PAL.cream : PAL.sky;
    for (let x = ix + 2; x < ix + iw - 2; x++) {
      const wave = Math.round(Math.sin((x - ix) * 0.55) * 1.2);
      fill(g, x, y + wave, 1, 2, color);
    }
  }
}

function boil(g: G, x: number, y: number, w: number, h: number, t: number) {
  for (let i = 0; i < Math.round((w * h) / 30); i++) {
    const bx = x + Math.floor(hash(i, 3) * w);
    const rise = (t * (8 + hash(i, 5) * 8) + hash(i, 7) * h) % h;
    fill(g, bx, y + h - 1 - Math.floor(rise), 1, 1, PAL.white);
  }
}

function pressurizer(g: G, c: Comp, hot: boolean) {
  capsule(g, c.x, c.y, c.w, c.h, PAL.steel);
  const level = c.y + Math.round(c.h * 0.42);
  fill(g, c.x + 3, c.y + 3, c.w - 6, level - c.y - 3, PAL.white);
  fill(g, c.x + 3, level, c.w - 6, c.y + c.h - 3 - level, hot ? PAL.copperD : PAL.steelL);
  fill(g, c.x + 3, level, c.w - 6, 1, PAL.outline);
  // Heaters in the bottom head, and the spray nozzle in the top.
  for (let k = 0; k < 3; k++) fill(g, c.x + 4 + k * 3, c.y + c.h - 12, 1, 8, hot ? PAL.bad : PAL.badD);
  fill(g, c.x + Math.floor(c.w / 2) - 1, c.y + 4, 3, 2, PAL.sky);
}

function turbine(g: G, c: Comp, t: number, running: boolean) {
  box(g, c.x, c.y, c.w, c.h, PAL.steelD);
  // The blade stack widens from the high-pressure end to the low-pressure end.
  for (let x = c.x + 2; x < c.x + c.w - 2; x++) {
    const frac = (x - c.x) / c.w;
    const half = Math.round(4 + frac * 9);
    const mid = c.y + Math.floor(c.h / 2);
    const lit = running ? ((x + Math.floor(t * 20)) % 3 === 0 ? PAL.steelL : PAL.steel) : x % 3 === 0 ? PAL.steelL : PAL.steel;
    fill(g, x, mid - half, 1, half * 2, lit);
  }
  fill(g, c.x + 1, c.y + Math.floor(c.h / 2), c.w - 2, 1, PAL.outline);
  fill(g, c.x + c.w, c.y + Math.floor(c.h / 2) - 1, 6, 3, PAL.outline);
}

function generator(g: G, c: Comp, t: number, running: boolean) {
  box(g, c.x, c.y, c.w, c.h, PAL.copperD);
  for (let x = c.x + 3; x < c.x + c.w - 3; x += 3) fill(g, x, c.y + 3, 1, c.h - 6, PAL.copper);
  // The line to the grid, with a pulse while the plant makes power.
  fill(g, c.x + c.w, c.y + 6, CUTAWAY_W - c.x - c.w, 3, PAL.outline);
  fill(g, c.x + c.w, c.y + 7, CUTAWAY_W - c.x - c.w, 1, PAL.gold);
  if (running) {
    const px = c.x + c.w + Math.floor((t * 24) % (CUTAWAY_W - c.x - c.w));
    fill(g, px, c.y + 7, 3, 1, PAL.goldL);
  }
}

function condenser(g: G, c: Comp, t: number, running: boolean) {
  box(g, c.x, c.y, c.w, c.h, PAL.steelD);
  // Tube bundle carrying river water, and the hotwell at the bottom.
  for (let y = c.y + 6; y < c.y + c.h - 10; y += 4) for (let x = c.x + 4; x < c.x + c.w - 4; x += 4) fill(g, x + ((y >> 2) % 2) * 2, y, 2, 2, PAL.sky);
  fill(g, c.x + 1, c.y + c.h - 7, c.w - 2, 6, PAL.sky);
  if (running) {
    for (let i = 0; i < 14; i++) {
      const x = c.x + 3 + Math.floor(hash(i, 11) * (c.w - 6));
      const y = c.y + 2 + Math.floor((t * 14 + hash(i, 13) * c.h) % (c.h - 10));
      fill(g, x, y, 1, 1, PAL.white);
    }
  }
}

function heatExchanger(g: G, c: Comp, plant: PlantDrawing) {
  const vertical = c.h > c.w;
  capsule(g, c.x, c.y, c.w, c.h, PAL.steel, vertical);
  // Shell side holds the core loop's salt, the tubes hold the next loop's.
  const shell = plant.coreMedium === "fuelSalt" ? PAL.gold : PAL.copper;
  const tubes = plant.kind === "fhr" ? PAL.bad : PAL.sky;
  fill(g, c.x + 3, c.y + 3, c.w - 6, c.h - 6, shell);
  if (vertical) for (let x = c.x + 5; x < c.x + c.w - 4; x += 3) fill(g, x, c.y + 4, 1, c.h - 8, tubes);
  else for (let y = c.y + 5; y < c.y + c.h - 4; y += 3) fill(g, c.x + 4, y, c.w - 8, 1, tubes);
}

function drainTank(g: G, c: Comp) {
  capsule(g, c.x, c.y, c.w, c.h, PAL.steelD, false);
  fill(g, c.x + 4, c.y + c.h - 8, c.w - 8, 5, PAL.goldD);
  // Cooling fins on the tank.
  for (let x = c.x + 6; x < c.x + c.w - 6; x += 4) fill(g, x, c.y + c.h, 2, 2, PAL.steel);
}

function blower(g: G, c: Comp, t: number, running: boolean) {
  box(g, c.x, c.y, c.w, c.h, PAL.steel);
  const cx = c.x + Math.floor(c.w / 2);
  const cy = c.y + Math.floor(c.h / 2);
  disc(g, cx, cy, 7, PAL.outline);
  disc(g, cx, cy, 6, PAL.steelD);
  const a0 = running ? t * 12 : 0;
  for (let k = 0; k < 3; k++) {
    const a = a0 + (k * 2 * Math.PI) / 3;
    for (let s = 1; s < 6; s++) fill(g, Math.round(cx + Math.cos(a) * s), Math.round(cy + Math.sin(a) * s), 1, 1, PAL.cream);
  }
}

/** Fuel rods standing in a coolant, lit blue when the core glows. */
function rodBundle(g: G, x: number, y: number, w: number, h: number, glow: boolean, coolant: string, t: number) {
  fill(g, x, y, w, h, glow ? PAL.cherenkov : coolant);
  for (let rx = x + 1; rx < x + w - 1; rx += 3) fill(g, rx, y + 1, 2, h - 2, glow ? PAL.cherenkovD : PAL.steelD);
  for (let rx = x + 1; rx < x + w - 1; rx += 3) fill(g, rx, y + 1, 1, h - 2, glow ? PAL.steelL : PAL.ash);
  if (!glow) return;
  // The glow is brightest between the rods. A few pixels shift each frame.
  const tick = Math.floor(t * 6);
  for (let i = 0; i < Math.round((w * h) / 14); i++) {
    const px = x + 3 + Math.floor(hash(i, tick % 7) * (w - 4) / 3) * 3 - 1;
    const py = y + 1 + Math.floor(hash(i + 50, tick % 5) * (h - 2));
    fill(g, px, py, 1, 1, PAL.cherenkovL);
  }
}

/** Dots moving through a region: up or down. */
function drift(g: G, x: number, y: number, w: number, h: number, dir: 1 | -1, t: number, color: string, speed = 10, n = 0) {
  const count = n || Math.max(2, Math.round((w * h) / 40));
  for (let i = 0; i < count; i++) {
    const px = x + Math.floor(hash(i, 17) * w);
    const off = (t * speed + hash(i, 19) * h) % h;
    const py = dir > 0 ? y + Math.floor(off) : y + h - 1 - Math.floor(off);
    fill(g, px, py, 1, 1, color);
  }
}

function vesselPWR(g: G, c: Comp, frame: CutawayFrame, glow: boolean) {
  // Control rod drive mechanisms on the head.
  for (let k = 0; k < 5; k++) {
    const x = c.x + 6 + k * 7;
    box(g, x, c.y - 12, 5, 14, PAL.steel);
    fill(g, x + 1, c.y - 13, 3, 1, PAL.gold);
  }
  capsule(g, c.x, c.y, c.w, c.h, PAL.steelD);
  fill(g, c.x + 2, c.y + 16, c.w - 4, 2, PAL.outline);
  for (let x = c.x + 4; x < c.x + c.w - 3; x += 5) fill(g, x, c.y + 15, 2, 1, PAL.gold);
  const ix = c.x + 3;
  const iw = c.w - 6;
  // Downcomer: the cold water goes down between the vessel wall and the core barrel.
  fill(g, ix, c.y + 18, iw, c.h - 22, PAL.sky);
  const bx = ix + 4;
  const bw = iw - 8;
  fill(g, bx - 1, c.y + 26, 1, c.h - 44, PAL.outline);
  fill(g, bx + bw, c.y + 26, 1, c.h - 44, PAL.outline);
  // Upper plenum with the rod guide tubes, then the core, then the lower plenum.
  // The nozzles sit above the core, so the core starts below them.
  const coreTop = c.y + 60;
  const coreBot = c.y + c.h - 16;
  fill(g, bx, c.y + 18, bw, coreTop - c.y - 18, frame.hot ? PAL.copper : PAL.sky);
  for (let x = bx + 3; x < bx + bw - 2; x += 6) fill(g, x, c.y + 20, 2, coreTop - c.y - 20, PAL.steelD);
  rodBundle(g, bx, coreTop, bw, coreBot - coreTop, glow, PAL.steelD, frame.t);
  // Control rods: a few inserted part way from the top.
  for (let x = bx + 3; x < bx + bw - 2; x += 12) fill(g, x, coreTop, 2, 10, PAL.outline);
  fill(g, bx, coreBot, bw, 2, PAL.outline);
  if (frame.t >= 0) {
    drift(g, ix, c.y + 26, 3, c.h - 46, 1, frame.t, PAL.cream, 14, 3);
    drift(g, ix + iw - 3, c.y + 26, 3, c.h - 46, 1, frame.t, PAL.cream, 14, 3);
    drift(g, bx + 2, coreTop + 2, bw - 4, coreBot - coreTop - 4, -1, frame.t, glow ? PAL.white : PAL.cream, 12, 6);
  }
}

function vesselBWR(g: G, c: Comp, frame: CutawayFrame, glow: boolean) {
  // Control rod drives come in from below.
  for (let k = 0; k < 6; k++) box(g, c.x + 8 + k * 7, c.y + c.h - 2, 4, 14, PAL.steel);
  capsule(g, c.x, c.y, c.w, c.h, PAL.steelD);
  const ix = c.x + 3;
  const iw = c.w - 6;
  const level = c.y + 40;
  // Steam dome with the dryer, then separators standing in the water.
  fill(g, ix, c.y + 3, iw, level - c.y - 3, PAL.white);
  for (let x = ix + 2; x < ix + iw - 2; x += 4) {
    fill(g, x, c.y + 9, 2, 1, PAL.ash);
    fill(g, x + 2, c.y + 10, 2, 1, PAL.ash);
    fill(g, x, c.y + 11, 2, 1, PAL.ash);
  }
  fill(g, ix, level, iw, c.h - (level - c.y) - 4, PAL.sky);
  for (let k = 0; k < 5; k++) box(g, ix + 5 + k * 9, c.y + 22, 6, 24, PAL.steelL);
  fill(g, ix, level, iw, 1, PAL.outline);
  // Shroud, core, and the jet pumps in the downcomer on each side.
  const bx = ix + 7;
  const bw = iw - 14;
  const coreTop = c.y + 62;
  const coreBot = c.y + c.h - 22;
  fill(g, bx - 1, c.y + 48, 1, coreBot - c.y - 46, PAL.outline);
  fill(g, bx + bw, c.y + 48, 1, coreBot - c.y - 46, PAL.outline);
  fill(g, bx, c.y + 48, bw, coreTop - c.y - 48, PAL.creamD);
  rodBundle(g, bx, coreTop, bw, coreBot - coreTop, glow, PAL.steelD, frame.t);
  for (const jx of [ix + 1, ix + iw - 5]) {
    box(g, jx, coreTop - 6, 4, coreBot - coreTop + 10, PAL.steel);
    fill(g, jx + 1, coreTop - 8, 2, 2, PAL.steelL);
  }
  // Control blades up from the bottom.
  for (let x = bx + 4; x < bx + bw - 2; x += 10) fill(g, x, coreBot - 12, 2, 12, PAL.outline);
  if (frame.hot) {
    // Boiling starts in the core and the two-phase mix rises to the separators.
    boil(g, bx + 1, c.y + 48, bw - 2, coreBot - c.y - 60, frame.t);
    boil(g, ix + 2, level - 1, iw - 4, 1, frame.t);
  }
  drift(g, ix + 1, level + 4, 3, coreTop - level, 1, frame.t, PAL.cream, 12, 3);
  drift(g, ix + iw - 4, level + 4, 3, coreTop - level, 1, frame.t, PAL.cream, 12, 3);
}

function vesselPebble(g: G, c: Comp, frame: CutawayFrame) {
  // Fuel goes in at the top and comes out at the bottom.
  const mid = c.x + Math.floor(c.w / 2);
  box(g, mid - 3, c.y - 10, 7, 12, PAL.steel);
  box(g, mid - 3, c.y + c.h - 2, 7, CUTAWAY_H - (c.y + c.h) - 2, PAL.steel);
  capsule(g, c.x, c.y, c.w, c.h, PAL.steelD);
  const ix = c.x + 3;
  const iw = c.w - 6;
  // Graphite reflector, with cold helium rising in its side channels.
  fill(g, ix, c.y + 3, iw, c.h - 6, PAL.ink);
  for (let y = c.y + 4; y < c.y + c.h - 4; y += 3) for (let x = ix; x < ix + iw; x += 5) if (hash(x, y) > 0.7) fill(g, x, y, 1, 1, PAL.steelD);
  for (const sx of [ix + 2, ix + iw - 4]) {
    fill(g, sx, c.y + 12, 2, c.h - 30, PAL.steelD);
    drift(g, sx, c.y + 12, 2, c.h - 30, -1, frame.t, PAL.creamD, 18, 4);
  }
  // The bed: hotter toward the bottom, where the helium leaves.
  const bx = ix + 6;
  const bw = iw - 12;
  const top = c.y + 16;
  const bot = c.y + c.h - 22;
  fill(g, bx, top, bw, bot - top, PAL.woodDark);
  for (let row = 0, y = top + 2; y < bot - 2; row++, y += 4) {
    const frac = (y - top) / (bot - top);
    const body = !frame.hot ? PAL.woodMid : frac > 0.6 ? PAL.copper : frac > 0.3 ? PAL.copperD : PAL.woodMid;
    for (let x = bx + 2 + (row % 2) * 2; x < bx + bw - 2; x += 4) {
      fill(g, x, y, 3, 3, body);
      fill(g, x, y, 1, 1, frame.hot && frac > 0.6 ? PAL.copperL : PAL.wood);
    }
  }
  drift(g, bx + 1, top, bw - 2, bot - top, 1, frame.t, PAL.cream, 12, 8);
  // Hot plenum under the bed.
  fill(g, bx, bot, bw, 6, frame.hot ? PAL.copperL : PAL.steelL);
}

function vesselMSR(g: G, c: Comp, frame: CutawayFrame) {
  capsule(g, c.x, c.y, c.w, c.h, PAL.steelD);
  const ix = c.x + 3;
  const iw = c.w - 6;
  fill(g, ix, c.y + 3, iw, c.h - 6, frame.hot ? PAL.gold : PAL.goldD);
  // Graphite stringers, with the fuel salt rising in the channels between them.
  const top = c.y + 12;
  const bot = c.y + c.h - 12;
  for (let x = ix + 2; x < ix + iw - 2; x += 5) {
    fill(g, x, top, 3, bot - top, PAL.ink);
    fill(g, x, top, 1, bot - top, PAL.steelD);
  }
  for (let x = ix + 5; x < ix + iw - 2; x += 5) drift(g, x, top, 2, bot - top, -1, frame.t, PAL.goldL, 10, 3);
  // Two control rod thimbles from the top.
  for (const x of [ix + 9, ix + iw - 11]) box(g, x, c.y - 4, 3, 28, PAL.steelL);
}

function vesselMSFR(g: G, c: Comp, frame: CutawayFrame) {
  capsule(g, c.x, c.y, c.w, c.h, PAL.steel);
  const ix = c.x + 3;
  const iw = c.w - 6;
  // Fertile blanket salt around the core, behind a thin protection layer.
  fill(g, ix, c.y + 3, iw, c.h - 6, PAL.wine);
  for (let y = c.y + 4; y < c.y + c.h - 4; y += 4) fill(g, ix + 1, y, iw - 2, 1, PAL.badD);
  const cx = ix + 6;
  const cw = iw - 12;
  const top = c.y + 10;
  const bot = c.y + c.h - 10;
  fill(g, cx - 1, top - 1, cw + 2, bot - top + 2, PAL.outline);
  // The core is an open cavity of fuel salt. No graphite: the spectrum is fast.
  fill(g, cx, top, cw, bot - top, frame.hot ? PAL.gold : PAL.goldD);
  for (let i = 0; i < 6; i++) {
    const x = cx + 3 + Math.floor((i * cw) / 6);
    for (let y = top + 2; y < bot - 2; y++) {
      const sway = Math.round(Math.sin(y * 0.15 + i + frame.t * 2) * 2);
      if ((y + Math.floor(frame.t * 10) + i * 3) % 6 < 2) fill(g, x + sway, y, 1, 1, PAL.goldL);
    }
  }
}

function vesselFHR(g: G, c: Comp, frame: CutawayFrame, glow: boolean) {
  // Pebbles go in at the bottom and float up; they are taken out at the top.
  box(g, c.x + 9, c.y - 12, 6, 14, PAL.steel);
  box(g, c.x + Math.floor(c.w / 2) - 3, c.y + c.h - 2, 7, CUTAWAY_H - (c.y + c.h) - 2, PAL.steel);
  capsule(g, c.x, c.y, c.w, c.h, PAL.steelD);
  const ix = c.x + 3;
  const iw = c.w - 6;
  // FLiBe is clear, so the hot core glows blue between the pebbles.
  fill(g, ix, c.y + 3, iw, c.h - 6, glow ? PAL.cherenkov : PAL.steelL);
  fill(g, ix, c.y + 3, 3, c.h - 6, PAL.ink);
  fill(g, ix + iw - 3, c.y + 3, 3, c.h - 6, PAL.ink);
  const bx = ix + 4;
  const bw = iw - 8;
  const bedTop = c.y + 10;
  const bedBot = c.y + Math.round(c.h * 0.7);
  for (let row = 0, y = bedTop; y < bedBot; row++, y += 4) {
    for (let x = bx + (row % 2) * 2; x < bx + bw - 2; x += 4) {
      fill(g, x, y, 3, 3, PAL.ink);
      fill(g, x, y, 1, 1, PAL.steelD);
    }
  }
  // Below the bed: clear salt, and a few pebbles on their way up.
  for (let i = 0; i < 4; i++) {
    const x = bx + 2 + Math.floor(hash(i, 23) * (bw - 4));
    const span = c.y + c.h - 6 - bedBot;
    const y = c.y + c.h - 6 - Math.floor((frame.t * 3 + hash(i, 29) * span) % span);
    fill(g, x, y, 3, 3, PAL.ink);
  }
  if (glow) {
    const tick = Math.floor(frame.t * 6);
    for (let i = 0; i < 40; i++) {
      const x = bx + Math.floor(hash(i, tick % 7) * bw);
      const y = bedTop + Math.floor(hash(i + 9, tick % 5) * (bedBot - bedTop));
      fill(g, x, y, 1, 1, PAL.cherenkovL);
    }
  }
  drift(g, ix + 3, c.y + 6, iw - 6, c.h - 12, -1, frame.t, glow ? PAL.white : PAL.cream, 10, 8);
}

function freezePlug(g: G, x: number, y: number) {
  // A plug of frozen salt, kept frozen by a cooling jacket. It melts and drains the core if power is lost.
  fill(g, x - 5, y - 3, 11, 7, PAL.outline);
  fill(g, x - 4, y - 2, 9, 5, PAL.sky);
  fill(g, x - 2, y - 2, 5, 5, PAL.white);
}

function containment(g: G, r: { x: number; y: number; w: number; h: number }) {
  // Dashed boundary: the steel-lined concrete building around the reactor coolant system.
  for (let x = r.x; x < r.x + r.w; x++) {
    if (x % 6 < 4) {
      fill(g, x, r.y, 1, 2, PAL.ash);
      fill(g, x, r.y + r.h - 2, 1, 2, PAL.ash);
    }
  }
  for (let y = r.y; y < r.y + r.h; y++) {
    if (y % 6 < 4) {
      fill(g, r.x, y, 2, 1, PAL.ash);
      fill(g, r.x + r.w - 2, y, 2, 1, PAL.ash);
    }
  }
}

function paper(g: G) {
  fill(g, 0, 0, CUTAWAY_W, CUTAWAY_H, PAL.cream);
  for (let x = 0; x < CUTAWAY_W; x += 16) fill(g, x, 0, 1, CUTAWAY_H, PAL.creamD);
  for (let y = 0; y < CUTAWAY_H; y += 16) fill(g, 0, y, CUTAWAY_W, 1, PAL.creamD);
}

export function paintCutaway(g: G, kind: CutawayKind, frame: CutawayFrame) {
  const plant = PLANTS[kind];
  const glow = cherenkov(plant, frame.hot);
  g.imageSmoothingEnabled = false;
  paper(g);
  if (plant.containment) containment(g, plant.containment);

  const loopMedium = new Map(plant.loops.map((l) => [l.id, l.medium] as const));
  for (const b of plant.branches) {
    const temp = b.id.startsWith("river") ? "cold" : frame.hot ? b.temp : "cold";
    pipe(g, b.pts, pipeLook(b.medium, temp, b.id.startsWith("river") ? frame.hot : false), frame.t);
  }
  for (const q of plant.pipes) {
    const medium = loopMedium.get(q.loop) ?? "water";
    const steamSide = q.loop === "steam";
    // A cool core makes no steam: the secondary side stands still. The coolant pumps keep running.
    const running = steamSide ? frame.hot : true;
    const temp: PipeTemp = frame.hot ? q.temp : steamSide && q.temp === "steam" ? "steam" : "cold";
    pipe(g, q.pts, pipeLook(medium, temp, running), frame.t);
    if (running) arrow(g, q.pts, PAL.outline);
  }

  for (const c of plant.comps) {
    const running = c.id === "fwpump" || c.kind === "turbine" || c.kind === "generator" || c.kind === "condenser" ? frame.hot : true;
    switch (c.kind) {
      case "vessel":
        if (kind === "pwr") vesselPWR(g, c, frame, glow);
        else if (kind === "bwr") vesselBWR(g, c, frame, glow);
        else if (kind === "pebble") vesselPebble(g, c, frame);
        else if (kind === "msr") vesselMSR(g, c, frame);
        else if (kind === "msfr") vesselMSFR(g, c, frame);
        else vesselFHR(g, c, frame, glow);
        break;
      case "sg":
        steamGen(g, c, plant, frame, frame.hot);
        break;
      case "pump":
        pump(g, plant, c, frame.t, running);
        break;
      case "pressurizer":
        pressurizer(g, c, frame.hot);
        break;
      case "turbine":
        turbine(g, c, frame.t, running);
        break;
      case "generator":
        generator(g, c, frame.t, running);
        break;
      case "condenser":
        condenser(g, c, frame.t, running);
        break;
      case "hx":
        heatExchanger(g, c, plant);
        break;
      case "drain":
        drainTank(g, c);
        break;
      case "blower":
        blower(g, c, frame.t, running);
        break;
    }
  }
  if (kind === "msr") {
    const b = plant.branches.find((x) => x.id === "freeze-valve");
    if (b) freezePlug(g, b.pts[0][0], Math.round((b.pts[0][1] + b.pts[1][1]) / 2));
  }
  if (kind === "msfr") {
    const b = plant.branches.find((x) => x.id === "drain-line");
    if (b) freezePlug(g, b.pts[0][0], Math.round((b.pts[0][1] + b.pts[1][1]) / 2));
  }
}

export { CUTAWAY_H, CUTAWAY_W };
