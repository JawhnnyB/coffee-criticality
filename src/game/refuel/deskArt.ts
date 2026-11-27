/**
 * Small moving cutaways for three of the Friday desks (RefuelDesks.tsx):
 *  - BWR bundle bench: one row of the bundle in its channel, seen from the side. Bubbles appear where the water
 *    starts to boil and grow thicker as it rises, node by node from the bench's own void numbers. The part-length rods
 *    stop short, so there's open water at the top.
 *  - Pebble desk: pebbles drifting down the bed. One at a time leaves at the bottom, is measured, and either goes
 *    back round the lift to the top or, once in every N passes, out to the spent drum while a fresh one drops in.
 *  - Salt desk: the pump bowl. The spray ring throws salt into the helium so xenon comes out and leaves by the
 *    off-gas line; how hard it sprays is the desk's stripping slider. The salt's colour is its temperature, played
 *    through the week the desk has just run, against the band on the thermometer.
 *
 * Native 96x72 pixel art, per tools/artkit/STYLE-STANDARD.md: whole-number scale, 1px #3b2318 outline, flat colour,
 * steam and gas as dots, the seven temperature bands for the salt. Every rectangle lands on whole pixels.
 * Pure: no DOM, no clock. The desk owns the clock, steps it at ten frames a second, and holds a still frame when
 * motion is reduced. Teaching pictures, not drawings of a real plant.
 */

export const ART_W = 96;
export const ART_H = 72;

/** What the painters need from a 2D context. A canvas context fits; so does a test double. */
export interface Pen {
  fillStyle: unknown;
  fillRect(x: number, y: number, w: number, h: number): void;
}

const OL = "#3b2318";
const BG = "#dcc8aa";
const STEEL = "#9aa4ac";
const STEEL_L = "#c8ccd0";
const STEEL_D = "#7a828e";
const ROD_EDGE = "#5a6068";
const CREAM = "#f4ecd8";
const PAPER = "#fff8e4";
const GRAPHITE = "#4e5560";
const HELIUM = "#d4cce6";
const GOLD = "#c9a227";

/** Deterministic 0..1 noise, so a bubble or a pebble keeps its look from frame to frame. */
export function hash(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const frac = (x: number) => x - Math.floor(x);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function rect(g: Pen, x: number, y: number, w: number, h: number, c: string) {
  const x0 = Math.round(x);
  const y0 = Math.round(y);
  const w0 = Math.round(w);
  const h0 = Math.round(h);
  if (w0 <= 0 || h0 <= 0) return;
  g.fillStyle = c;
  g.fillRect(x0, y0, w0, h0);
}

/** An outlined box: 1px outline, flat fill. */
function box(g: Pen, x: number, y: number, w: number, h: number, fill: string) {
  rect(g, x, y, w, h, OL);
  rect(g, x + 1, y + 1, w - 2, h - 2, fill);
}

function frame(g: Pen, bg = BG) {
  rect(g, 0, 0, ART_W, ART_H, OL);
  rect(g, 1, 1, ART_W - 2, ART_H - 2, bg);
}

// --- BWR channel ---------------------------------------------------------------------------------------------------

/** Inside of the channel box, and the 12 axial nodes over it. */
const CH = { x0: 8, x1: 87, top: 4, bottom: 67 };
const NODES = 12;
const ROW = 6; // the row of the 10x10 bundle shown: both water-rod columns, part-length rods at each edge
const rodX = (c: number) => 9 + c * 8;

export function nodeAt(y: number): number {
  return clamp(Math.floor(((CH.bottom - y) / (CH.bottom - CH.top + 1)) * NODES), 0, NODES - 1);
}

/** Top of the part-length rods: the bottom two of the three layers. */
export const PART_TOP = Math.round(CH.bottom - ((CH.bottom - CH.top + 1) * 8) / NODES) + 1;

export interface ChannelRow {
  /** Columns 0..9: a full rod, a part-length rod, or part of a water rod. */
  kind: ("rod" | "part" | "water")[];
}

/** The side view's row, from the bundle's own layout (water rods and part-length positions). */
export function channelRow(waterRods: ReadonlySet<number>, partLength: ReadonlySet<number>, size = 10): ChannelRow {
  const kind: ChannelRow["kind"] = [];
  for (let c = 0; c < size; c++) {
    const i = ROW * size + c;
    kind.push(waterRods.has(i) ? "water" : partLength.has(i) ? "part" : "rod");
  }
  return { kind };
}

export interface Bubble {
  x: number;
  y: number;
  big: boolean;
}

/**
 * Bubbles in the channel at time t (seconds). Each one has its own threshold: it shows once the void where it is
 * passes that threshold, and void only grows on the way up, so a bubble that appears stays. More void, more bubbles.
 */
export function channelBubbles(row: ChannelRow, voidFrac: number[], t: number): Bubble[] {
  const lanes: { x: number; topOnly: boolean }[] = [];
  for (let c = 0; c < row.kind.length - 1; c++) {
    if (row.kind[c] === "water" && row.kind[c + 1] === "water") continue; // inside the water rod
    lanes.push({ x: rodX(c) + 5, topOnly: false }); // the middle of the gap after rod c
  }
  lanes.push({ x: rodX(row.kind.length - 1) + 5, topOnly: false });
  row.kind.forEach((k, c) => {
    if (k === "part") lanes.push({ x: rodX(c) + 1, topOnly: true }); // open water above a part-length rod
  });
  const out: Bubble[] = [];
  const span = CH.bottom - CH.top + 1;
  lanes.forEach((lane, li) => {
    for (let k = 0; k < 12; k++) {
      const phase = hash(li * 17 + k * 3.1);
      const speed = 11 + 9 * hash(li * 5.7 + k);
      const s = frac((t * speed) / span + phase) * span;
      const y = Math.floor(CH.bottom - s);
      if (y < CH.top + 1) continue;
      if (lane.topOnly && y >= PART_TOP) continue;
      const v = voidFrac[nodeAt(y)] ?? 0;
      if (v <= hash(li * 7.3 + k * 11.7) * 0.8) continue;
      const big = v > 0.45 && hash(li * 3 + k * 1.3) > 0.5;
      const wob = Math.round(Math.sin(t * 4 + phase * 6.28));
      const lo = lane.x - 1;
      const hi = lane.x + (big ? 0 : 1);
      out.push({ x: clamp(lane.x + wob, lo, hi), y, big });
    }
  });
  return out;
}

export function paintChannel(g: Pen, row: ChannelRow, voidFrac: number[], t: number) {
  frame(g, "#3a78c0"); // bypass water between the channels
  // Channel box walls, and the water inside it.
  rect(g, CH.x0 - 3, CH.top - 2, 1, CH.bottom - CH.top + 5, OL);
  rect(g, CH.x0 - 2, CH.top - 2, 2, CH.bottom - CH.top + 5, STEEL_D);
  rect(g, CH.x0 - 2, CH.top - 2, 1, CH.bottom - CH.top + 5, STEEL);
  rect(g, CH.x1 + 1, CH.top - 2, 2, CH.bottom - CH.top + 5, STEEL_D);
  rect(g, CH.x1 + 3, CH.top - 2, 1, CH.bottom - CH.top + 5, OL);
  rect(g, CH.x0, CH.top, CH.x1 - CH.x0 + 1, CH.bottom - CH.top + 1, "#4aa0c8");
  // Tie plates top and bottom.
  rect(g, CH.x0, CH.top - 2, CH.x1 - CH.x0 + 1, 2, STEEL_D);
  rect(g, CH.x0, CH.bottom + 1, CH.x1 - CH.x0 + 1, 2, STEEL_D);
  // Rods.
  for (let c = 0; c < row.kind.length; c++) {
    const k = row.kind[c];
    const x = rodX(c);
    if (k === "water") {
      if (row.kind[c - 1] === "water") continue;
      const w = row.kind[c + 1] === "water" ? 11 : 3;
      rect(g, x - 1, CH.top, w + 2, CH.bottom - CH.top + 1, ROD_EDGE);
      rect(g, x, CH.top, w, CH.bottom - CH.top + 1, STEEL_L);
      rect(g, x + 1, CH.top, w - 2, CH.bottom - CH.top + 1, "#3a78c0");
      rect(g, x + 2, CH.top, 1, CH.bottom - CH.top + 1, "#4aa0c8");
      continue;
    }
    const top = k === "part" ? PART_TOP : CH.top;
    const h = CH.bottom - top + 1;
    rect(g, x - 1, top, 5, h, ROD_EDGE);
    rect(g, x, top, 3, h, STEEL_L);
    rect(g, x, top, 1, h, "#eef0f0");
    rect(g, x + 2, top, 1, h, "#8a96a0");
    if (k === "part") rect(g, x - 1, top - 1, 5, 1, ROD_EDGE); // end cap
  }
  // Spacer grids every second node.
  for (let n = 2; n < NODES; n += 2) {
    const y = Math.round(CH.bottom - ((CH.bottom - CH.top + 1) * n) / NODES);
    rect(g, CH.x0, y, CH.x1 - CH.x0 + 1, 1, "#b8a070");
  }
  // Steam as dots.
  for (const b of channelBubbles(row, voidFrac, t)) rect(g, b.x, b.y, b.big ? 2 : 1, b.big ? 2 : 1, CREAM);
  // Flow: in at the bottom, up the channel.
  for (const x of [20, 52, 76]) {
    rect(g, x, 69, 1, 1, CREAM);
    rect(g, x - 1, 70, 3, 1, CREAM);
  }
}

// --- Pebble bed ----------------------------------------------------------------------------------------------------

const CAV = { x0: 18, x1: 57, top: 13, bottom: 51 };
/** Fresh (light) to spent (dark) graphite. */
export const PEBBLE_SHADES = ["#a8b0b8", "#8a929c", "#6e7680", "#545a64", "#3e434c"] as const;
/** Seconds per pebble out of the bottom. */
export const PEBBLE_CYCLE = 1.6;

export function shadeFor(pass: number, passes: number): string {
  const n = Math.max(1, passes);
  return PEBBLE_SHADES[clamp(Math.floor((pass / n) * PEBBLE_SHADES.length), 0, PEBBLE_SHADES.length - 1)];
}

/** Does the k-th pebble out of the bottom leave for good? One in every `passes`, so a once-through bed sends every one. */
export function pebbleLeaves(k: number, passes: number): boolean {
  const n = Math.max(1, Math.round(passes));
  return n === 1 || k % n === n - 1;
}

function pebble(g: Pen, x: number, y: number, c: string, clipTop = -99, clipBottom = 999) {
  const rows: [number, number, string][] = [
    [1, 4, OL],
    [0, 6, OL],
    [0, 6, OL],
    [0, 6, OL],
    [0, 6, OL],
    [1, 4, OL],
  ];
  rows.forEach(([dx, w, col], dy) => {
    const yy = y + dy;
    if (yy < clipTop || yy > clipBottom) return;
    rect(g, x + dx, yy, w, 1, col);
    if (dy === 1 || dy === 4) rect(g, x + 2, yy, 2, 1, c);
    if (dy === 2 || dy === 3) rect(g, x + 1, yy, 4, 1, c);
    if (dy === 2) rect(g, x + 2, yy, 1, 1, "#d8dce0");
  });
}

/** Where a pebble is along a path of straight legs, at fraction u of the whole length. */
function along(points: [number, number][], u: number): [number, number] {
  const legs = points.slice(1).map((p, i) => Math.abs(p[0] - points[i][0]) + Math.abs(p[1] - points[i][1]));
  let d = clamp(u, 0, 1) * legs.reduce((a, b) => a + b, 0);
  for (let i = 0; i < legs.length; i++) {
    if (d <= legs[i] || i === legs.length - 1) {
      const f = legs[i] ? d / legs[i] : 0;
      const [ax, ay] = points[i];
      const [bx, by] = points[i + 1];
      return [Math.round(ax + (bx - ax) * f), Math.round(ay + (by - ay) * f)];
    }
    d -= legs[i];
  }
  return points[points.length - 1];
}

export interface PebbleMove {
  /** Which pebble out of the bottom this is, counting from the start of the clock. */
  k: number;
  leaves: boolean;
  /** Where it is now (top-left of the 6x6 pebble), or null once it's in the drum. */
  at: [number, number] | null;
  /** The meter's light: off until it's read, then green to go round again or amber to leave. */
  light: "off" | "again" | "out";
  /** A fresh pebble on its way in from the hopper (only when one left). */
  fresh: [number, number] | null;
}

export function pebbleMove(passes: number, t: number): PebbleMove {
  const k = Math.floor(t / PEBBLE_CYCLE);
  const ph = t / PEBBLE_CYCLE - k;
  const leaves = pebbleLeaves(k, passes);
  const light = ph < 0.2 ? "off" : leaves ? "out" : "again";
  if (ph < 0.2) return { k, leaves, at: [35, Math.round(50 + (ph / 0.2) * 9)], light, fresh: null };
  if (ph < 0.4) return { k, leaves, at: [35, 59], light, fresh: null };
  const u = (ph - 0.4) / 0.6;
  if (leaves) {
    const at = u < 0.75 ? along([[35, 59], [49, 59], [49, 64]], u / 0.75) : null;
    return { k, leaves, at, light, fresh: along([[6, 2], [35, 2], [35, 13]], u) };
  }
  return { k, leaves, at: along([[35, 59], [86, 59], [86, 2], [35, 2], [35, 13]], u), light, fresh: null };
}

export function paintPebbles(g: Pen, passes: number, t: number) {
  const n = Math.max(1, Math.round(passes));
  frame(g);
  // Tracks: the lift on the right, the lane over the top, the run out of the meter.
  rect(g, 85, 2, 1, 64, STEEL_D);
  rect(g, 92, 2, 1, 64, STEEL_D);
  rect(g, 6, 8, 87, 1, STEEL_D);
  rect(g, 44, 65, 49, 1, STEEL_D);
  // Fresh-pebble hopper, top left.
  box(g, 1, 1, 12, 9, "#b88a50");
  pebble(g, 3, 2, PEBBLE_SHADES[0]);
  // Vessel: steel shell, graphite reflector, the bed.
  box(g, 12, 9, 52, 47, STEEL);
  rect(g, 15, 11, 46, 43, GRAPHITE);
  rect(g, CAV.x0, CAV.top, CAV.x1 - CAV.x0 + 1, CAV.bottom - CAV.top + 1, "#2a221b");
  rect(g, 35, 9, 6, 4, "#2a221b"); // inlet in the top
  rect(g, 35, 52, 6, 4, "#2a221b"); // throat at the bottom
  // The bed drifts down; each pebble keeps its shade (how many passes it has had) as it goes.
  const pos = t * 2.5;
  const base = Math.floor(pos / 6);
  const off = pos - base * 6;
  for (let i = 0; i < 8; i++) {
    const id = i - base;
    const y = Math.round(CAV.top - 6 + off + 6 * i);
    const stagger = ((id % 2) + 2) % 2 ? 3 : 0;
    for (let j = 0; j < 6; j++) {
      const x = CAV.x0 + 1 + stagger + 6 * j;
      if (x + 6 > CAV.x1 + 1) continue;
      const pass = Math.floor(hash(id * 13.1 + j * 7.7) * n);
      pebble(g, x, y, shadeFor(pass, n), CAV.top, CAV.bottom);
    }
  }
  // Burnup meter.
  const mv = pebbleMove(n, t);
  box(g, 31, 57, 14, 9, GOLD);
  rect(g, 34, 58, 8, 7, "#2a221b");
  rect(g, 42, 59, 2, 2, mv.light === "off" ? "#5a4a3a" : mv.light === "again" ? "#6b8f71" : "#e0a850");
  // The pebble on the move, and a fresh one if one left.
  const shade = shadeFor(Math.floor(hash(mv.k * 3.3) * n), n);
  if (mv.at) pebble(g, mv.at[0], mv.at[1], mv.leaves ? PEBBLE_SHADES[PEBBLE_SHADES.length - 1] : shade);
  if (mv.fresh) pebble(g, mv.fresh[0], mv.fresh[1], PEBBLE_SHADES[0]);
  // Spent drum, in front of anything dropping into it.
  box(g, 44, 64, 15, 7, "#6a4a32");
  rect(g, 45, 64, 13, 1, "#8a6242");
  rect(g, 49, 67, 5, 1, "#e0a850");
}

// --- Molten salt pump bowl -----------------------------------------------------------------------------------------

/** STYLE-STANDARD's seven temperature bands, cold to hot, over the MSR scale 625–670 °C. */
export const TEMP_BANDS = ["#3a78c0", "#4aa0c8", "#7ac0b8", "#e8d070", "#e8963a", "#d4552e", "#a82a3a"] as const;

export function saltColour(tempC: number): string {
  const i = Math.floor(((tempC - 625) / 45) * TEMP_BANDS.length);
  return TEMP_BANDS[clamp(i, 0, TEMP_BANDS.length - 1)];
}

/** Seconds to play the whole week through. */
export const WEEK_SECONDS = 14;

/** Which sample of the week's run is showing at time t, and the day (0 = Monday). */
export function weekSample(count: number, t: number): { i: number; day: number } {
  const f = frac(t / WEEK_SECONDS);
  return { i: clamp(Math.floor(f * count), 0, Math.max(0, count - 1)), day: clamp(Math.floor(f * 7), 0, 6) };
}

/** How many drops the spray ring throws, and how many gas dots leave by the off-gas line, for a stripping setting. */
export function sprayCounts(sparge: number, spargeMax: number): { drops: number; gas: number } {
  const f = spargeMax > 0 ? clamp(sparge / spargeMax, 0, 1) : 0;
  return { drops: Math.round(f * 16), gas: Math.round(f * 10) };
}

export interface SaltView {
  sparge: number;
  spargeMax: number;
  /** The week the desk just ran, °C, and the band to hold. */
  tempC: number[];
  lowC: number;
  highC: number;
}

const BOWL = { x0: 19, x1: 76, top: 15, bottom: 59, level: 38 };

export function paintSaltBowl(g: Pen, v: SaltView, t: number) {
  frame(g);
  const { i, day } = weekSample(v.tempC.length, t);
  const temp = v.tempC[i] ?? (v.lowC + v.highC) / 2;
  const salt = saltColour(temp);
  const { drops, gas } = sprayCounts(v.sparge, v.spargeMax);
  // Off-gas line, up out of the bowl and away to the right.
  box(g, 69, 3, 6, 13, STEEL);
  box(g, 69, 3, 26, 5, STEEL);
  rect(g, 70, 4, 4, 11, "#5a6068");
  rect(g, 70, 4, 24, 3, "#5a6068");
  // Pump motor and shaft.
  box(g, 39, 2, 18, 9, "#5a7a84");
  rect(g, 40, 3, 16, 1, "#7a98a2");
  // The bowl.
  box(g, BOWL.x0 - 3, BOWL.top - 1, BOWL.x1 - BOWL.x0 + 7, BOWL.bottom - BOWL.top + 5, STEEL);
  rect(g, BOWL.x0, BOWL.top, BOWL.x1 - BOWL.x0 + 1, BOWL.level - BOWL.top, HELIUM);
  for (let y = BOWL.top; y < BOWL.level; y++)
    for (let x = BOWL.x0; x <= BOWL.x1; x++) if ((x + y * 3) % 9 === 0) rect(g, x, y, 1, 1, "#b8aed0"); // gas, stippled
  for (let x = BOWL.x0; x <= BOWL.x1; x++) {
    const ys = BOWL.level + (Math.sin(x * 0.45 + t * 5) > 0.6 ? -1 : 0);
    rect(g, x, ys, 1, BOWL.bottom - ys + 1, salt);
    rect(g, x, ys, 1, 1, CREAM);
  }
  rect(g, 70, BOWL.top - 1, 4, 1, "#5a6068"); // the off-gas line's mouth
  rect(g, 46, 11, 4, 44, STEEL_L);
  rect(g, 46, 11, 1, 44, "#eef0f0");
  const f = Math.floor(t * 8) % 2;
  if (f === 0) rect(g, 41, 55, 14, 2, OL); // impeller, two frames: blades side-on, then turned
  else {
    rect(g, 44, 55, 8, 2, OL);
    rect(g, 47, 53, 2, 6, OL);
  }
  // Helium bubbles up through the salt.
  for (let j = 0; j < Math.round(drops / 3); j++) {
    const u = frac(t * 0.6 + hash(j + 40));
    const x = Math.round(24 + hash(j + 41) * 48);
    const y = Math.round(BOWL.bottom - u * (BOWL.bottom - BOWL.level - 1));
    rect(g, x, y, 1, 1, CREAM);
  }
  // Spray ring from the left: salt thrown up into the gas.
  box(g, 1, 21, 21, 5, STEEL);
  rect(g, 2, 22, 19, 3, "#5a6068");
  rect(g, 20, 22, 2, 3, salt);
  for (let j = 0; j < drops; j++) {
    const u = frac(t * 1.4 + hash(j));
    const x = 22 + u * (16 + 34 * hash(j + 50));
    const y = 23 - 6 * u + 21 * u * u;
    if (y < BOWL.level - 1) rect(g, x, y, 1, 1, salt);
  }
  // Xenon out of the salt, up the off-gas line, away.
  for (let j = 0; j < gas; j++) {
    const u = frac(t * 0.45 + hash(j + 90));
    let x: number;
    let y: number;
    if (u < 0.6) {
      const x0 = 26 + hash(j + 20) * 40;
      const p = u / 0.6;
      x = x0 + (71 - x0) * p;
      y = BOWL.level - 2 - (BOWL.level - 2 - BOWL.top) * p;
    } else if (u < 0.75) {
      x = 71 + (j % 2);
      y = BOWL.top - ((u - 0.6) / 0.15) * (BOWL.top - 5);
    } else {
      x = 71 + ((u - 0.75) / 0.25) * 22;
      y = 5;
    }
    rect(g, x, y, 1, 1, j % 3 ? "#2a221b" : CREAM);
  }
  // Thermometer: the band to hold, and this hour's salt.
  const ty = (c: number) => Math.round(61 - ((clamp(c, 620, 680) - 620) / 60) * 44);
  box(g, 82, 16, 7, 47, PAPER);
  rect(g, 83, ty(v.highC), 5, ty(v.lowC) - ty(v.highC) + 1, "#d8e8c9");
  rect(g, 81, ty(v.highC), 1, 1, OL);
  rect(g, 81, ty(v.lowC), 1, 1, OL);
  rect(g, 84, ty(temp), 3, 61 - ty(temp) + 1, salt);
  rect(g, 84, ty(temp), 3, 1, OL);
  // The week: Monday to Sunday.
  for (let d = 0; d < 7; d++) rect(g, 18 + d * 8, 66, 5, 3, d === day ? "#e0a850" : "#8a7864");
}
