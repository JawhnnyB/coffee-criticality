import { PAL } from "./palette";
import { SCALES } from "./schematicMath";
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
 *
 * Without `live`, the plant is drawn at full power (hot) or cold and shut down (not hot).
 * With `live`, the drawing follows a run: pipe colours from the hot and cold leg temperatures,
 * flow speed, Cherenkov brightness from power, rod position, and a turbine trip on a scram.
 */
export interface LiveRun {
  /** Share of design power, 0 to 1. */
  power: number;
  /** Share of design flow, 0 to 1.6. */
  flow: number;
  /** Share of rod length withdrawn, 0 to 1. */
  rods: number;
  scram: boolean;
  /** Hot and cold leg temperatures in °C, from thermalState. */
  tHot: number;
  tCold: number;
}

export interface CutawayFrame {
  hot: boolean;
  t: number;
  live?: LiveRun;
}

type G = CanvasRenderingContext2D;

/**
 * The temperature range each plant's colours span, in °C. The four designable plants use the same
 * ranges as Reactor Control's colour bar. FHR and MSFR are teaching values for their usual inlet and outlet.
 */
export const TEMP_RANGE: Record<CutawayKind, { lo: number; hi: number }> = {
  pwr: SCALES.pwr,
  bwr: SCALES.bwr,
  pebble: SCALES.pebble,
  msr: SCALES.msr,
  fhr: { lo: 540, hi: 660 },
  msfr: { lo: 640, hi: 760 },
};

/** Cold and hot leg at full power, in °C, for drawings with no live run. Teaching values. */
const DESIGN_TEMPS: Record<CutawayKind, { tCold: number; tHot: number }> = {
  pwr: { tCold: 292, tHot: 324 },
  bwr: { tCold: 275, tHot: 286 },
  pebble: { tCold: 260, tHot: 735 },
  msr: { tCold: 625, tHot: 672 },
  fhr: { tCold: 550, tHot: 650 },
  msfr: { tCold: 650, tHot: 750 },
};

/** Cold to hot, all from the locked palette. Copper is the top of the range; no red. */
const RAMP = [PAL.sky, PAL.muted, PAL.gold, PAL.copper, PAL.copperL];

/** The colour of water or salt at this temperature on this plant's range. */
export function tempColor(kind: CutawayKind, t: number): string {
  const { lo, hi } = TEMP_RANGE[kind];
  const f = Math.max(0, Math.min(1, (t - lo) / (hi - lo)));
  return RAMP[Math.min(RAMP.length - 1, Math.floor(f * RAMP.length))];
}

interface Drive {
  power: number;
  flow: number;
  rods: number;
  scram: boolean;
  tHot: number;
  tCold: number;
  /** 0 to 1. How bright the Cherenkov light is. A scrammed core keeps a faint glow from decay heat. */
  glow: number;
  /** The steam side runs: turbine, condenser, feed pump. It trips on a scram. */
  steam: boolean;
}

export function drive(kind: CutawayKind, frame: CutawayFrame): Drive {
  const plant = PLANTS[kind];
  if (frame.live) {
    const L = frame.live;
    const power = Math.max(0, Math.min(1.2, L.power));
    const flow = Math.max(0, Math.min(1.6, L.flow));
    const decay = L.scram ? 0.08 : 0;
    const level = L.scram ? decay : power;
    return {
      power,
      flow,
      rods: L.scram ? 0 : Math.max(0, Math.min(1, L.rods)),
      scram: L.scram,
      tHot: L.tHot,
      tCold: L.tCold,
      glow: cherenkov(plant, level > 0.02) ? level : 0,
      steam: !L.scram && power > 0.03,
    };
  }
  const d = DESIGN_TEMPS[kind];
  return frame.hot
    ? { power: 1, flow: 1, rods: 0.85, scram: false, tHot: d.tHot, tCold: d.tCold, glow: cherenkov(plant, true) ? 1 : 0, steam: true }
    : { power: 0, flow: 0.3, rods: 0, scram: false, tHot: d.tCold, tCold: d.tCold, glow: 0, steam: false };
}

const fill = (g: G, x: number, y: number, w: number, h: number, c: string) => {
  if (w <= 0 || h <= 0) return;
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

const box = (g: G, x: number, y: number, w: number, h: number, body: string, edge: string = PAL.outline) => {
  fill(g, x, y, w, h, edge);
  fill(g, x + 1, y + 1, w - 2, h - 2, body);
};

/** A tank with rounded ends: the outline steps in at each corner. */
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

/** A lighter shade for the moving dashes on a pipe of this colour. */
function dashFor(body: string): string {
  if (body === PAL.sky) return PAL.cream;
  if (body === PAL.muted) return PAL.cream;
  if (body === PAL.gold) return PAL.goldL;
  if (body === PAL.copper) return PAL.copperL;
  return PAL.cream;
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

/** speed: 0 stopped, 1 normal. */
function pump(g: G, p: PlantDrawing, c: Comp, t: number, speed: number) {
  const cx = c.x + Math.floor(c.w / 2);
  const cy = c.y + Math.floor(c.h / 2);
  const r = Math.floor(Math.min(c.w, c.h) / 2) - 1;
  if (!topTaken(p, c)) {
    const mh = Math.round(c.h * 0.7);
    box(g, cx - 5, c.y - mh, 11, mh - 2, PAL.steel);
    for (let y = c.y - mh + 2; y < c.y - 3; y += 2) fill(g, cx - 4, y, 9, 1, PAL.steelD);
    fill(g, cx - 3, c.y - mh - 2, 7, 2, PAL.outline);
    fill(g, cx, c.y - 3, 1, 3, PAL.outline);
    // Run light on the motor.
    fill(g, cx + 3, c.y - mh + 2, 1, 1, speed > 0.02 ? PAL.leafL : PAL.ash);
  }
  disc(g, cx, cy, r, PAL.outline);
  disc(g, cx, cy, r - 1, PAL.steelL);
  disc(g, cx, cy, r - 3, PAL.steelD);
  const a0 = 0.4 + t * 9 * speed;
  for (let k = 0; k < 4; k++) {
    const a = a0 + (k * Math.PI) / 2;
    for (let s = 1; s < r - 2; s++) fill(g, Math.round(cx + Math.cos(a) * s), Math.round(cy + Math.sin(a) * s), 1, 1, PAL.cream);
  }
  fill(g, cx - 1, cy - 1, 3, 3, PAL.gold);
}

function boil(g: G, x: number, y: number, w: number, h: number, t: number, rate = 1) {
  if (rate <= 0.01 || h <= 0) return;
  const n = Math.round(((w * h) / 30) * Math.min(1.6, rate));
  for (let i = 0; i < n; i++) {
    const bx = x + Math.floor(hash(i, 3) * w);
    const rise = (t * (8 + hash(i, 5) * 8) + hash(i, 7) * h) % h;
    fill(g, bx, y + h - 1 - Math.floor(rise), 1, 1, PAL.white);
  }
}

function steamGen(g: G, c: Comp, plant: PlantDrawing, d: Drive, t: number) {
  capsule(g, c.x, c.y, c.w, c.h, PAL.steel);
  const ix = c.x + 3;
  const iw = c.w - 6;
  const hotC = tempColor(plant.kind, d.tHot);
  const coldC = tempColor(plant.kind, d.tCold);
  if (plant.kind === "pwr") {
    // Channel head: hot side and cold side, split by the divider plate.
    const headY = c.y + c.h - 12;
    fill(g, ix, headY, iw, 9, PAL.outline);
    fill(g, ix + 1, headY + 1, Math.floor(iw / 2) - 1, 7, hotC);
    fill(g, ix + Math.floor(iw / 2) + 1, headY + 1, Math.floor(iw / 2) - 2, 7, coldC);
    fill(g, ix, headY - 2, iw, 2, PAL.steelD);
    const level = c.y + Math.round(c.h * 0.42);
    fill(g, ix, level, iw, headY - 2 - level, PAL.sky);
    fill(g, ix, c.y + 3, iw, level - c.y - 3, PAL.white);
    // U-tubes: hot water up the left legs, over the top, and down the right legs, cooling as it goes.
    const midT = (d.tHot + d.tCold) / 2;
    for (let k = 0; k < 4; k++) {
      const left = ix + 2 + k * 2;
      const right = ix + iw - 3 - k * 2;
      const top = level + 2 + k * 3;
      fill(g, left, top, 1, headY - 2 - top, hotC);
      fill(g, left, top, right - left + 1, 1, tempColor(plant.kind, midT));
      fill(g, right, top, 1, headY - 2 - top, coldC);
    }
    for (let k = 0; k < 3; k++) box(g, ix + 3 + k * 9, level - 12, 6, 9, PAL.steelL);
    for (let x = ix + 2; x < ix + iw - 2; x += 4) {
      fill(g, x, c.y + 7, 2, 1, PAL.ash);
      fill(g, x + 2, c.y + 8, 2, 1, PAL.ash);
    }
    fill(g, ix, level, iw, 1, PAL.steelD);
    boil(g, ix + 1, level + 1, iw - 2, headY - level - 8, t, d.power);
    return;
  }
  // Once-through steam generator for gas and salt: a helical coil, water in at the bottom, steam out at the top.
  fill(g, ix, c.y + 3, iw, c.h - 6, plant.coreMedium === "helium" ? PAL.steelD : PAL.woodMid);
  const coilTop = c.y + 10;
  const coilBot = c.y + c.h - 10;
  // How far up the coil the water boils: higher power, more of the coil is steam.
  const steamFrac = d.steam ? 0.25 + 0.2 * Math.min(1, d.power) : 0;
  for (let y = coilTop; y < coilBot; y += 4) {
    const frac = (y - coilTop) / (coilBot - coilTop);
    const color = frac < steamFrac ? PAL.white : frac < steamFrac + 0.3 ? PAL.cream : PAL.sky;
    for (let x = ix + 2; x < ix + iw - 2; x++) {
      const wave = Math.round(Math.sin((x - ix) * 0.55) * 1.2);
      fill(g, x, y + wave, 1, 2, color);
    }
  }
}

function pressurizer(g: G, c: Comp, plant: PlantDrawing, d: Drive) {
  capsule(g, c.x, c.y, c.w, c.h, PAL.steel);
  // Level follows average coolant temperature: hotter water takes more room.
  const { lo, hi } = TEMP_RANGE[plant.kind];
  const tAvg = (d.tHot + d.tCold) / 2;
  const f = Math.max(0, Math.min(1, (tAvg - lo) / (hi - lo)));
  const level = c.y + Math.round(c.h * (0.62 - 0.3 * f));
  fill(g, c.x + 3, c.y + 3, c.w - 6, level - c.y - 3, PAL.white);
  fill(g, c.x + 3, level, c.w - 6, c.y + c.h - 3 - level, tempColor(plant.kind, hi));
  fill(g, c.x + 3, level, c.w - 6, 1, PAL.outline);
  // Heaters in the bottom head hold the water at saturation. The spray nozzle in the top.
  for (let k = 0; k < 3; k++) fill(g, c.x + 4 + k * 3, c.y + c.h - 12, 1, 8, d.power > 0.02 ? PAL.bad : PAL.badD);
  fill(g, c.x + Math.floor(c.w / 2) - 1, c.y + 4, 3, 2, PAL.sky);
  // Safety valves on the top head.
  fill(g, c.x + 3, c.y - 3, 3, 3, PAL.outline);
  fill(g, c.x + c.w - 6, c.y - 3, 3, 3, PAL.outline);
}

function turbine(g: G, c: Comp, t: number, running: boolean) {
  box(g, c.x, c.y, c.w, c.h, PAL.steelD);
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
  fill(g, c.x + c.w, c.y + 6, CUTAWAY_W - c.x - c.w, 3, PAL.outline);
  fill(g, c.x + c.w, c.y + 7, CUTAWAY_W - c.x - c.w, 1, running ? PAL.gold : PAL.goldD);
  if (running) {
    const px = c.x + c.w + Math.floor((t * 24) % (CUTAWAY_W - c.x - c.w));
    fill(g, px, c.y + 7, 3, 1, PAL.goldL);
  }
}

function condenser(g: G, c: Comp, t: number, running: boolean) {
  box(g, c.x, c.y, c.w, c.h, PAL.steelD);
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

function heatExchanger(g: G, c: Comp, plant: PlantDrawing, d: Drive) {
  const vertical = c.h > c.w;
  capsule(g, c.x, c.y, c.w, c.h, PAL.steel, vertical);
  // Shell side holds the core loop's salt, the tubes hold the next loop's. The shell cools along its length.
  const fuel = plant.coreMedium === "fuelSalt";
  const tubes = plant.kind === "fhr" ? PAL.bad : PAL.sky;
  const n = vertical ? c.h - 6 : c.w - 6;
  for (let i = 0; i < n; i++) {
    const T = d.tHot - (d.tHot - d.tCold) * (i / n);
    const col = fuel ? (T > (d.tHot + d.tCold) / 2 ? PAL.gold : PAL.goldD) : tempColor(plant.kind, T);
    if (vertical) fill(g, c.x + 3, c.y + 3 + i, c.w - 6, 1, col);
    else fill(g, c.x + 3 + i, c.y + 3, 1, c.h - 6, col);
  }
  if (vertical) for (let x = c.x + 5; x < c.x + c.w - 4; x += 3) fill(g, x, c.y + 4, 1, c.h - 8, tubes);
  else for (let y = c.y + 5; y < c.y + c.h - 4; y += 3) fill(g, c.x + 4, y, c.w - 8, 1, tubes);
}

function drainTank(g: G, c: Comp) {
  capsule(g, c.x, c.y, c.w, c.h, PAL.steelD, false);
  fill(g, c.x + 4, c.y + c.h - 8, c.w - 8, 5, PAL.goldD);
  for (let x = c.x + 6; x < c.x + c.w - 6; x += 4) fill(g, x, c.y + c.h, 2, 2, PAL.steel);
}

function blower(g: G, c: Comp, t: number, speed: number) {
  box(g, c.x, c.y, c.w, c.h, PAL.steel);
  const cx = c.x + Math.floor(c.w / 2);
  const cy = c.y + Math.floor(c.h / 2);
  disc(g, cx, cy, 7, PAL.outline);
  disc(g, cx, cy, 6, PAL.steelD);
  const a0 = t * 12 * speed;
  for (let k = 0; k < 3; k++) {
    const a = a0 + (k * 2 * Math.PI) / 3;
    for (let s = 1; s < 6; s++) fill(g, Math.round(cx + Math.cos(a) * s), Math.round(cy + Math.sin(a) * s), 1, 1, PAL.cream);
  }
}

/** Fuel rods standing in a coolant, lit blue when the core glows. glow: 0 none, 1 full power. */
function rodBundle(g: G, x: number, y: number, w: number, h: number, glow: number, coolant: string, t: number) {
  // Dark blue at low power or after a scram, full blue from about 40% power.
  const base = glow <= 0 ? coolant : glow < 0.4 ? PAL.cherenkovD : PAL.cherenkov;
  fill(g, x, y, w, h, base);
  for (let rx = x + 1; rx < x + w - 1; rx += 3) fill(g, rx, y + 1, 2, h - 2, glow > 0 ? PAL.cherenkovD : PAL.steelD);
  for (let rx = x + 1; rx < x + w - 1; rx += 3) fill(g, rx, y + 1, 1, h - 2, glow > 0 ? PAL.steelL : PAL.ash);
  if (glow < 0.2) return;
  // The glow is brightest between the rods, and there is more of it at higher power.
  const tick = Math.floor(t * 6);
  const n = Math.round(((w * h) / 14) * Math.min(1.2, glow));
  for (let i = 0; i < n; i++) {
    const px = x + 3 + Math.floor((hash(i, tick % 7) * (w - 4)) / 3) * 3 - 1;
    const py = y + 1 + Math.floor(hash(i + 50, tick % 5) * (h - 2));
    fill(g, px, py, 1, 1, PAL.cherenkovL);
  }
}

/** Dots moving through a region: up or down. speed 0: none drawn. */
function drift(g: G, x: number, y: number, w: number, h: number, dir: 1 | -1, t: number, color: string, speed = 10, n = 0) {
  if (speed <= 0 || h <= 0) return;
  const count = n || Math.max(2, Math.round((w * h) / 40));
  for (let i = 0; i < count; i++) {
    const px = x + Math.floor(hash(i, 17) * w);
    const off = (t * speed + hash(i, 19) * h) % h;
    const py = dir > 0 ? y + Math.floor(off) : y + h - 1 - Math.floor(off);
    fill(g, px, py, 1, 1, color);
  }
}

function vesselPWR(g: G, c: Comp, d: Drive, t: number) {
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
  const coldC = tempColor("pwr", d.tCold);
  const hotC = tempColor("pwr", d.tHot);
  // Downcomer: the cold leg water goes down between the vessel wall and the core barrel.
  fill(g, ix, c.y + 18, iw, c.h - 22, coldC);
  const bx = ix + 4;
  const bw = iw - 8;
  fill(g, bx - 1, c.y + 26, 1, c.h - 44, PAL.outline);
  fill(g, bx + bw, c.y + 26, 1, c.h - 44, PAL.outline);
  const coreTop = c.y + 60;
  const coreBot = c.y + c.h - 16;
  // Upper plenum: the water has come up through the core and is at hot leg temperature.
  fill(g, bx, c.y + 18, bw, coreTop - c.y - 18, hotC);
  for (let x = bx + 3; x < bx + bw - 2; x += 6) fill(g, x, c.y + 20, 2, coreTop - c.y - 20, PAL.steelD);
  rodBundle(g, bx, coreTop, bw, coreBot - coreTop, d.glow, PAL.steelD, t);
  // Control rods drop in from the top. Withdrawn rods sit in the guide tubes above the core.
  const depth = Math.round((1 - d.rods) * (coreBot - coreTop));
  for (let x = bx + 3; x < bx + bw - 2; x += 12) fill(g, x, coreTop - 6, 2, depth + 6, PAL.outline);
  fill(g, bx, coreBot, bw, 2, PAL.outline);
  const v = 14 * d.flow;
  drift(g, ix, c.y + 26, 3, c.h - 46, 1, t, PAL.cream, v, 3);
  drift(g, ix + iw - 3, c.y + 26, 3, c.h - 46, 1, t, PAL.cream, v, 3);
  drift(g, bx + 2, coreTop + 2, bw - 4, coreBot - coreTop - 4, -1, t, d.glow > 0 ? PAL.white : PAL.cream, 12 * d.flow, 6);
}

function vesselBWR(g: G, c: Comp, d: Drive, t: number) {
  for (let k = 0; k < 6; k++) box(g, c.x + 8 + k * 7, c.y + c.h - 2, 4, 14, PAL.steel);
  capsule(g, c.x, c.y, c.w, c.h, PAL.steelD);
  const ix = c.x + 3;
  const iw = c.w - 6;
  const level = c.y + 40;
  fill(g, ix, c.y + 3, iw, level - c.y - 3, PAL.white);
  for (let x = ix + 2; x < ix + iw - 2; x += 4) {
    fill(g, x, c.y + 9, 2, 1, PAL.ash);
    fill(g, x + 2, c.y + 10, 2, 1, PAL.ash);
    fill(g, x, c.y + 11, 2, 1, PAL.ash);
  }
  fill(g, ix, level, iw, c.h - (level - c.y) - 4, tempColor("bwr", d.tCold));
  for (let k = 0; k < 5; k++) box(g, ix + 5 + k * 9, c.y + 22, 6, 24, PAL.steelL);
  fill(g, ix, level, iw, 1, PAL.outline);
  const bx = ix + 7;
  const bw = iw - 14;
  const coreTop = c.y + 62;
  const coreBot = c.y + c.h - 22;
  fill(g, bx - 1, c.y + 48, 1, coreBot - c.y - 46, PAL.outline);
  fill(g, bx + bw, c.y + 48, 1, coreBot - c.y - 46, PAL.outline);
  // Above the core: the two-phase mix on its way to the separators. Paler with more steam in it.
  const voidFrac = Math.max(0, Math.min(1, (0.5 * d.power) / Math.max(0.2, d.flow)));
  fill(g, bx, c.y + 48, bw, coreTop - c.y - 48, voidFrac > 0.3 ? PAL.cream : voidFrac > 0.05 ? PAL.creamD : tempColor("bwr", d.tCold));
  rodBundle(g, bx, coreTop, bw, coreBot - coreTop, d.glow, PAL.steelD, t);
  for (const jx of [ix + 1, ix + iw - 5]) {
    box(g, jx, coreTop - 6, 4, coreBot - coreTop + 10, PAL.steel);
    fill(g, jx + 1, coreTop - 8, 2, 2, PAL.steelL);
  }
  // Control blades come up from the bottom.
  const depth = Math.round((1 - d.rods) * (coreBot - coreTop));
  for (let x = bx + 4; x < bx + bw - 2; x += 10) fill(g, x, coreBot - depth, 2, depth + 4, PAL.outline);
  // Boiling starts in the core. The void proxy from the spec: more power or less flow, more steam.
  boil(g, bx + 1, c.y + 48, bw - 2, coreBot - c.y - 60, t, voidFrac * 2);
  boil(g, ix + 2, level - 1, iw - 4, 1, t, voidFrac * 2);
  drift(g, ix + 1, level + 4, 3, coreTop - level, 1, t, PAL.cream, 12 * d.flow, 3);
  drift(g, ix + iw - 4, level + 4, 3, coreTop - level, 1, t, PAL.cream, 12 * d.flow, 3);
}

function vesselPebble(g: G, c: Comp, d: Drive, t: number) {
  const mid = c.x + Math.floor(c.w / 2);
  box(g, mid - 3, c.y - 10, 7, 12, PAL.steel);
  box(g, mid - 3, c.y + c.h - 2, 7, CUTAWAY_H - (c.y + c.h) - 2, PAL.steel);
  capsule(g, c.x, c.y, c.w, c.h, PAL.steelD);
  const ix = c.x + 3;
  const iw = c.w - 6;
  fill(g, ix, c.y + 3, iw, c.h - 6, PAL.ink);
  for (let y = c.y + 4; y < c.y + c.h - 4; y += 3) for (let x = ix; x < ix + iw; x += 5) if (hash(x, y) > 0.7) fill(g, x, y, 1, 1, PAL.steelD);
  for (const sx of [ix + 2, ix + iw - 4]) {
    fill(g, sx, c.y + 12, 2, c.h - 30, PAL.steelD);
    drift(g, sx, c.y + 12, 2, c.h - 30, -1, t, PAL.creamD, 18 * d.flow, 4);
  }
  // The bed: the helium heats as it goes down, so the pebbles are hotter toward the bottom.
  const bx = ix + 6;
  const bw = iw - 12;
  const top = c.y + 16;
  const bot = c.y + c.h - 22;
  fill(g, bx, top, bw, bot - top, PAL.woodDark);
  for (let row = 0, y = top + 2; y < bot - 2; row++, y += 4) {
    const frac = (y - top) / (bot - top);
    const T = d.tCold + (d.tHot - d.tCold) * frac;
    const tc = tempColor("pebble", T);
    const body = tc === PAL.sky ? PAL.woodMid : tc === PAL.muted ? PAL.wood : tc === PAL.gold ? PAL.copperD : tc;
    for (let x = bx + 2 + (row % 2) * 2; x < bx + bw - 2; x += 4) {
      fill(g, x, y, 3, 3, body);
      fill(g, x, y, 1, 1, body === PAL.copperL || body === PAL.copper ? PAL.copperL : PAL.wood);
    }
  }
  drift(g, bx + 1, top, bw - 2, bot - top, 1, t, PAL.cream, 12 * d.flow, 8);
  fill(g, bx, bot, bw, 6, tempColor("pebble", d.tHot) === PAL.sky ? PAL.steelL : PAL.copperL);
}

function vesselMSR(g: G, c: Comp, d: Drive, t: number) {
  capsule(g, c.x, c.y, c.w, c.h, PAL.steelD);
  const ix = c.x + 3;
  const iw = c.w - 6;
  fill(g, ix, c.y + 3, iw, c.h - 6, d.power > 0.05 ? PAL.gold : PAL.goldD);
  const top = c.y + 12;
  const bot = c.y + c.h - 12;
  for (let x = ix + 2; x < ix + iw - 2; x += 5) {
    fill(g, x, top, 3, bot - top, PAL.ink);
    fill(g, x, top, 1, bot - top, PAL.steelD);
  }
  for (let x = ix + 5; x < ix + iw - 2; x += 5) drift(g, x, top, 2, bot - top, -1, t, PAL.goldL, 10 * d.flow, 3);
  // Control rod thimbles from the top. The rods inside follow the rod setting.
  const depth = Math.round((1 - d.rods) * 20);
  for (const x of [ix + 9, ix + iw - 11]) {
    box(g, x, c.y - 4, 3, 28, PAL.steelL);
    fill(g, x + 1, c.y - 3, 1, 6 + depth, PAL.outline);
  }
}

function vesselMSFR(g: G, c: Comp, d: Drive, t: number) {
  capsule(g, c.x, c.y, c.w, c.h, PAL.steel);
  const ix = c.x + 3;
  const iw = c.w - 6;
  fill(g, ix, c.y + 3, iw, c.h - 6, PAL.wine);
  for (let y = c.y + 4; y < c.y + c.h - 4; y += 4) fill(g, ix + 1, y, iw - 2, 1, PAL.badD);
  const cx = ix + 6;
  const cw = iw - 12;
  const top = c.y + 10;
  const bot = c.y + c.h - 10;
  fill(g, cx - 1, top - 1, cw + 2, bot - top + 2, PAL.outline);
  fill(g, cx, top, cw, bot - top, d.power > 0.05 ? PAL.gold : PAL.goldD);
  if (d.flow <= 0.01) return;
  for (let i = 0; i < 6; i++) {
    const x = cx + 3 + Math.floor((i * cw) / 6);
    for (let y = top + 2; y < bot - 2; y++) {
      const sway = Math.round(Math.sin(y * 0.15 + i + t * 2) * 2);
      if ((y + Math.floor(t * 10 * d.flow) + i * 3) % 6 < 2) fill(g, x + sway, y, 1, 1, PAL.goldL);
    }
  }
}

function vesselFHR(g: G, c: Comp, d: Drive, t: number) {
  box(g, c.x + 9, c.y - 12, 6, 14, PAL.steel);
  box(g, c.x + Math.floor(c.w / 2) - 3, c.y + c.h - 2, 7, CUTAWAY_H - (c.y + c.h) - 2, PAL.steel);
  capsule(g, c.x, c.y, c.w, c.h, PAL.steelD);
  const ix = c.x + 3;
  const iw = c.w - 6;
  const salt = d.glow <= 0 ? tempColor("fhr", d.tCold) : d.glow < 0.4 ? PAL.cherenkovD : PAL.cherenkov;
  fill(g, ix, c.y + 3, iw, c.h - 6, salt);
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
  for (let i = 0; i < 4; i++) {
    const x = bx + 2 + Math.floor(hash(i, 23) * (bw - 4));
    const span = c.y + c.h - 6 - bedBot;
    const y = c.y + c.h - 6 - Math.floor((t * 3 + hash(i, 29) * span) % span);
    fill(g, x, y, 3, 3, PAL.ink);
  }
  if (d.glow >= 0.2) {
    const tick = Math.floor(t * 6);
    for (let i = 0; i < Math.round(40 * d.glow); i++) {
      const x = bx + Math.floor(hash(i, tick % 7) * bw);
      const y = bedTop + Math.floor(hash(i + 9, tick % 5) * (bedBot - bedTop));
      fill(g, x, y, 1, 1, PAL.cherenkovL);
    }
  }
  drift(g, ix + 3, c.y + 6, iw - 6, c.h - 12, -1, t, d.glow > 0 ? PAL.white : PAL.cream, 10 * d.flow, 8);
}

function freezePlug(g: G, x: number, y: number) {
  // A plug of frozen salt, kept frozen by a cooling jacket. It melts and drains the core if power is lost.
  fill(g, x - 5, y - 3, 11, 7, PAL.outline);
  fill(g, x - 4, y - 2, 9, 5, PAL.sky);
  fill(g, x - 2, y - 2, 5, 5, PAL.white);
}

function containment(g: G, r: { x: number; y: number; w: number; h: number }) {
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

/** The temperature a pipe carries, for its colour. */
function pipeTemp(plant: PlantDrawing, loopId: string, temp: PipeTemp, d: Drive): number {
  const coreLoop = plant.loops.find((l) => l.path.includes("vessel") && !l.path.includes("turbine"))?.id ?? "steam";
  if (loopId === coreLoop || (plant.kind === "bwr" && loopId === "recirc")) return temp === "hot" ? d.tHot : d.tCold;
  // An intermediate salt loop runs a little cooler than the loop that heats it.
  const span = d.tHot - d.tCold;
  return temp === "hot" ? d.tCold + span * 0.75 : d.tCold + span * 0.05;
}

export function paintCutaway(g: G, kind: CutawayKind, frame: CutawayFrame) {
  const plant = PLANTS[kind];
  const d = drive(kind, frame);
  const t = frame.t;
  g.imageSmoothingEnabled = false;
  paper(g);
  if (plant.containment) containment(g, plant.containment);

  const loopMedium = new Map(plant.loops.map((l) => [l.id, l.medium] as const));
  for (const b of plant.branches) {
    const river = b.id.startsWith("river");
    const T = b.temp === "hot" ? TEMP_RANGE[kind].hi : d.tCold;
    const body = river ? PAL.sky : b.medium === "fuelSalt" ? PAL.goldD : tempColor(kind, T);
    const look: PipeLook = { body, dash: dashFor(body), width: 5, speed: river && d.steam ? 16 : 0, fuel: b.medium === "fuelSalt" };
    pipe(g, b.pts, look, t);
  }
  for (const q of plant.pipes) {
    const medium: Medium = loopMedium.get(q.loop) ?? "water";
    const steamSide = q.loop === "steam";
    let look: PipeLook;
    if (q.temp === "steam") {
      look = { body: PAL.white, dash: PAL.ash, width: 5, speed: d.steam ? 30 * Math.max(0.3, d.power) : 0, fuel: false };
    } else if (steamSide) {
      look = { body: PAL.sky, dash: PAL.cream, width: 5, speed: d.steam ? 16 * Math.max(0.3, d.power) : 0, fuel: false };
    } else {
      const T = pipeTemp(plant, q.loop, q.temp, d);
      const fuel = medium === "fuelSalt";
      const nitrate = medium === "nitrate";
      const body = fuel ? (q.temp === "hot" && d.power > 0.05 ? PAL.gold : PAL.goldD) : nitrate ? (q.temp === "hot" && d.power > 0.05 ? PAL.bad : PAL.wine) : tempColor(kind, T);
      look = { body, dash: fuel ? PAL.goldL : nitrate ? PAL.copperL : dashFor(body), width: medium === "helium" ? 7 : 5, speed: 16 * d.flow * (medium === "helium" ? 1.6 : 1), fuel };
    }
    pipe(g, q.pts, look, t);
    if (look.speed > 0) arrow(g, q.pts, PAL.outline);
  }

  for (const c of plant.comps) {
    const bop = c.id === "fwpump" || c.kind === "turbine" || c.kind === "generator" || c.kind === "condenser";
    switch (c.kind) {
      case "vessel":
        if (kind === "pwr") vesselPWR(g, c, d, t);
        else if (kind === "bwr") vesselBWR(g, c, d, t);
        else if (kind === "pebble") vesselPebble(g, c, d, t);
        else if (kind === "msr") vesselMSR(g, c, d, t);
        else if (kind === "msfr") vesselMSFR(g, c, d, t);
        else vesselFHR(g, c, d, t);
        break;
      case "sg":
        steamGen(g, c, plant, d, t);
        break;
      case "pump":
        pump(g, plant, c, t, bop ? (d.steam ? Math.max(0.3, d.power) : 0) : d.flow);
        break;
      case "pressurizer":
        pressurizer(g, c, plant, d);
        break;
      case "turbine":
        turbine(g, c, t, d.steam);
        break;
      case "generator":
        generator(g, c, t, d.steam);
        break;
      case "condenser":
        condenser(g, c, t, d.steam);
        break;
      case "hx":
        heatExchanger(g, c, plant, d);
        break;
      case "drain":
        drainTank(g, c);
        break;
      case "blower":
        blower(g, c, t, d.flow);
        break;
    }
  }
  const plug = plant.branches.find((x) => x.to === "drain");
  if (plug) freezePlug(g, plug.pts[0][0], Math.round((plug.pts[0][1] + plug.pts[1][1]) / 2));
}

export { CUTAWAY_H, CUTAWAY_W };
