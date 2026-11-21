/**
 * Night Watch security cameras: the one place in the game that looks like real footage.
 *
 * Owner decision (20 November 2026): the camera feeds break from the pixel style on purpose, to be the most
 * immersive and eerie part of the game. They are not bound to the palette. Everything is drawn here in code:
 * shaded geometry, light falloff, then a security-camera pass (low-light colour or infrared black and white,
 * sensor grain, scanlines, lens vignette, a slow rolling bar, exposure breathing, switching static).
 *
 * Each scene has a static base (cached once per scene where the browser allows) and a live layer: the model's
 * visuals for that camera (an event, an oddity, the rover on his rounds, the day supervisor's headlights).
 * A photoreal plate, when it has loaded, replaces the base. The live layer and the camera pass stay in code.
 */

import { PLATES, SIGNS_BAKED, plateFor, roverSheet, stateFor } from "./plates";

export const CAM_W = 480;
export const CAM_H = 270;
/** Backing-store scale. Logical coordinates stay 480×270; the tablet canvas is twice that. */
export const CAM_PX = 2;
const W = CAM_W;
const H = CAM_H;

type G = CanvasRenderingContext2D;
type Look = "ir" | "sodium" | "fluor" | "pool" | "amber";

interface Scene {
  look: Look;
  base: (g: G) => void;
  live: (g: G, t: number, v: Vis) => void;
}

interface Vis {
  has: (k: string) => boolean;
  /** 0..1 progress of a "name:0.42" visual, or null. */
  at: (k: string) => number | null;
}

/** True while a photo plate is the base, so static equipment already in the photo is not drawn again. */
let usingPlate = false;
/** True while words are being painted onto a photo's blank sign boards. */
let wordsOnly = false;
/** The look of the frame currently being painted. Infrared beacons stay white without a full-frame filter. */
let frameLook = "fluor";

function stateReady(scene: string, visual: string) {
  return stateFor(scene, visual) !== null;
}

function hash(a: number, b: number) {
  let h = (a * 374761393 + b * 668265263) >>> 0;
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
  return (h ^ (h >>> 16)) / 4294967296;
}

/* ---------------------------------------------------------------- drawing helpers */

function poly(g: G, pts: number[][], fill: string | CanvasGradient) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (const p of pts.slice(1)) g.lineTo(p[0], p[1]);
  g.closePath();
  g.fillStyle = fill;
  g.fill();
}

function lin(g: G, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  return gr;
}

function rad(g: G, x: number, y: number, r: number, stops: [number, string][]) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  return gr;
}

/** A vertical metal cylinder, lit from the upper left. */
function vCyl(g: G, x: number, y: number, w: number, h: number, dark: string, mid: string, light: string) {
  g.fillStyle = lin(g, x, 0, x + w, 0, [
    [0, dark],
    [0.28, light],
    [0.45, mid],
    [1, dark],
  ]);
  g.fillRect(x, y, w, h);
}

/** A horizontal pipe, lit from above. */
function hPipe(g: G, x: number, y: number, w: number, h: number, dark = "#2a2f33", mid = "#6b7378", light = "#c9d0d3") {
  g.fillStyle = lin(g, 0, y, 0, y + h, [
    [0, dark],
    [0.3, light],
    [0.55, mid],
    [1, dark],
  ]);
  g.fillRect(x, y, w, h);
}

/** Insulated (lagged) pipe: dull aluminium jacket with seams. */
function lagged(g: G, x: number, y: number, w: number, h: number, vertical = false) {
  if (vertical) vCyl(g, x, y, w, h, "#5d6266", "#a7adb0", "#dfe3e4");
  else hPipe(g, x, y, w, h, "#5d6266", "#a7adb0", "#e3e6e7");
  g.fillStyle = "rgba(40,44,47,0.55)";
  const step = vertical ? 22 : 26;
  for (let k = step; k < (vertical ? h : w); k += step) {
    if (vertical) g.fillRect(x, y + k, w, 1);
    else g.fillRect(x + k, y, 1, h);
  }
}

function flange(g: G, x: number, y: number, w: number, h: number) {
  vCyl(g, x, y, w, h, "#33383b", "#7d8487", "#bfc5c8");
  g.fillStyle = "#1d2023";
  for (let k = 0; k < 4; k++) g.fillRect(x + 1 + k * ((w - 3) / 3), y + 1, 2, 2);
}

function handwheel(g: G, cx: number, cy: number, r: number) {
  g.strokeStyle = "#7b2a20";
  g.lineWidth = Math.max(1.5, r / 5);
  g.beginPath();
  g.ellipse(cx, cy, r, r * 0.35, 0, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.moveTo(cx - r, cy);
  g.lineTo(cx + r, cy);
  g.stroke();
}

function sign(g: G, x: number, y: number, w: number, h: number, bg: string, fg: string, lines: string[]) {
  if (!wordsOnly) {
    g.fillStyle = bg;
    g.fillRect(x, y, w, h);
    g.strokeStyle = "rgba(0,0,0,0.5)";
    g.lineWidth = 1;
    g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
  g.fillStyle = fg;
  let size = Math.max(5, Math.round(h / (lines.length + 1)));
  g.font = `bold ${size}px Arial, sans-serif`;
  // Shrink until the longest line fits inside the plate (a stand-in context with no measureText draws as is).
  const widest = () => Math.max(...lines.map((l) => g.measureText(l)?.width ?? 0));
  while (size > 5 && typeof widest() === "number" && widest() > w - 6) {
    size -= 1;
    g.font = `bold ${size}px Arial, sans-serif`;
  }
  g.textAlign = "center";
  g.textBaseline = "middle";
  lines.forEach((l, k) => g.fillText(l, x + w / 2, y + (h * (k + 1)) / (lines.length + 1)));
  g.textAlign = "start";
  g.textBaseline = "alphabetic";
}

function trefoil(g: G, cx: number, cy: number, r: number) {
  g.fillStyle = "#e8c21a";
  g.beginPath();
  g.arc(cx, cy, r * 1.35, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#6b1f6b";
  for (let k = 0; k < 3; k++) {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / 3;
    g.beginPath();
    g.moveTo(cx, cy);
    g.arc(cx, cy, r, a - Math.PI / 6, a + Math.PI / 6);
    g.closePath();
    g.fill();
  }
  g.beginPath();
  g.fillStyle = "#e8c21a";
  g.arc(cx, cy, r * 0.28, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#6b1f6b";
  g.beginPath();
  g.arc(cx, cy, r * 0.18, 0, Math.PI * 2);
  g.fill();
}

/** Speckle a region, for concrete and grime. Deterministic. */
function speckle(g: G, x: number, y: number, w: number, h: number, n: number, color: string, seed: number) {
  g.fillStyle = color;
  for (let k = 0; k < n; k++) g.fillRect(x + hash(k, seed) * w, y + hash(seed, k) * h, 1, 1);
}

/* ---------------------------------------------------------------- rooms in one-point perspective */

interface Room {
  /** Point on the floor at depth f (0 front, 1 back wall) and lateral u (-1 left, 1 right). */
  floor: (u: number, f: number) => [number, number];
  /** Scale of an object at depth f. */
  scale: (f: number) => number;
}

interface RoomSpec {
  backW: number;
  backH: number;
  vy: number;
  wallLow: string;
  wallHigh: string;
  ceiling: string;
  floor: string;
  floorLine: string;
  split?: number;
  floorKind?: "tile" | "grating" | "concrete" | "epoxy";
  lights?: number[];
  lightColor?: string;
}

function room(g: G, o: RoomSpec): Room {
  const bw = W * o.backW;
  const bh = H * o.backH;
  const bx = (W - bw) / 2;
  const by = H * o.vy - bh / 2;
  const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
  const floor = (u: number, f: number): [number, number] => {
    const xl = lerp(0, bx, f);
    const xr = lerp(W, bx + bw, f);
    return [lerp(xl, xr, (u + 1) / 2), lerp(H, by + bh, f)];
  };
  const scale = (f: number) => lerp(1, bw / W, f);
  // Ceiling, walls, floor, back wall: darker with depth.
  poly(g, [[0, 0], [W, 0], [bx + bw, by], [bx, by]], lin(g, 0, 0, 0, by, [[0, o.ceiling], [1, "#151719"]]));
  poly(g, [[0, 0], [bx, by], [bx, by + bh], [0, H]], lin(g, 0, 0, bx, 0, [[0, o.wallHigh], [1, "#1a1c1d"]]));
  poly(g, [[W, 0], [bx + bw, by], [bx + bw, by + bh], [W, H]], lin(g, W, 0, bx + bw, 0, [[0, o.wallHigh], [1, "#1a1c1d"]]));
  if (o.split !== undefined) {
    // Two-tone industrial paint: the lower band of each wall.
    const s = o.split;
    poly(g, [[0, H * (1 - s)], [bx, by + bh * (1 - s)], [bx, by + bh], [0, H]], lin(g, 0, 0, bx, 0, [[0, o.wallLow], [1, "#141516"]]));
    poly(g, [[W, H * (1 - s)], [bx + bw, by + bh * (1 - s)], [bx + bw, by + bh], [W, H]], lin(g, W, 0, bx + bw, 0, [[0, o.wallLow], [1, "#141516"]]));
  }
  poly(g, [[0, H], [W, H], [bx + bw, by + bh], [bx, by + bh]], lin(g, 0, H, 0, by + bh, [[0, o.floor], [1, "#121314"]]));
  g.fillStyle = lin(g, 0, by, 0, by + bh, [[0, "#26292b"], [1, "#1b1d1e"]]);
  g.fillRect(bx, by, bw, bh);
  // Floor texture.
  g.strokeStyle = o.floorLine;
  g.lineWidth = 1;
  const kind = o.floorKind ?? "tile";
  if (kind === "tile" || kind === "grating") {
    const n = kind === "grating" ? 22 : 10;
    for (let k = 0; k <= n; k++) {
      const u = -1 + (2 * k) / n;
      const [x0, y0] = floor(u, 0);
      const [x1, y1] = floor(u, 1);
      g.beginPath();
      g.moveTo(x0, y0);
      g.lineTo(x1, y1);
      g.stroke();
    }
    for (let k = 1; k < (kind === "grating" ? 40 : 14); k++) {
      const f = 1 - 1 / (1 + k * (kind === "grating" ? 0.25 : 0.55));
      const [x0, y0] = floor(-1, f);
      const [x1] = floor(1, f);
      g.beginPath();
      g.moveTo(x0, y0);
      g.lineTo(x1, y0);
      g.stroke();
    }
  } else {
    speckle(g, 0, by + bh, W, H - by - bh, 900, "rgba(0,0,0,0.25)", 3);
    speckle(g, 0, by + bh, W, H - by - bh, 400, "rgba(255,255,255,0.06)", 5);
  }
  if (kind === "epoxy") {
    // A painted walkway and its yellow edges.
    poly(g, [floor(-0.35, 0), floor(0.35, 0), floor(0.35, 1), floor(-0.35, 1)], "rgba(70,110,80,0.35)");
    g.strokeStyle = "rgba(230,190,40,0.7)";
    g.lineWidth = 2;
    for (const u of [-0.35, 0.35]) {
      const [x0, y0] = floor(u, 0);
      const [x1, y1] = floor(u, 1);
      g.beginPath();
      g.moveTo(x0, y0);
      g.lineTo(x1, y1);
      g.stroke();
    }
  }
  // Conduit along the left wall.
  g.strokeStyle = "rgba(160,160,150,0.35)";
  g.lineWidth = 1;
  for (const off of [0.08, 0.11]) {
    g.beginPath();
    g.moveTo(0, H * off);
    g.lineTo(bx, by + bh * off);
    g.stroke();
  }
  // Light fixtures down the ceiling centre and the pools they make on the floor.
  for (const f of o.lights ?? [0.15, 0.45, 0.75]) {
    const cy = by * f + 2;
    const half = (W / 2 - bx) * (1 - f) * 0.22 + 4;
    g.fillStyle = o.lightColor ?? "#f3f1e2";
    g.fillRect(W / 2 - half, cy, half * 2, Math.max(1.5, 4 * (1 - f)));
    g.globalCompositeOperation = "lighter";
    g.fillStyle = rad(g, W / 2, cy, 60 * (1 - f) + 12, [[0, "rgba(255,248,220,0.18)"], [1, "rgba(0,0,0,0)"]]);
    g.fillRect(0, 0, W, H);
    const [fx, fy] = floor(0, Math.min(1, f + 0.06));
    g.save();
    g.translate(fx, fy);
    g.scale(1, 0.3);
    g.fillStyle = rad(g, 0, 0, 140 * (1 - f) + 20, [[0, "rgba(255,245,210,0.16)"], [1, "rgba(0,0,0,0)"]]);
    g.fillRect(-200, -200, 400, 400);
    g.restore();
    g.globalCompositeOperation = "source-over";
  }
  // Depth haze toward the back wall.
  g.fillStyle = rad(g, W / 2, by + bh / 2, Math.max(bw, bh) * 1.4, [[0, "rgba(8,9,10,0.55)"], [1, "rgba(8,9,10,0)"]]);
  g.fillRect(0, 0, W, H);
  return { floor, scale };
}

/* ---------------------------------------------------------------- shared live layers */

function puddle(g: G, cx: number, cy: number, rFull: number, t: number, grow = 1) {
  const r = Math.max(22, rFull * (0.35 + 0.65 * grow));
  g.save();
  g.translate(cx, cy);
  g.scale(1, 0.28);
  g.globalCompositeOperation = "multiply";
  g.fillStyle = rad(g, 0, 0, r, [[0, "rgb(165,165,165)"], [0.72, "rgb(200,200,200)"], [1, "rgb(255,255,255)"]]);
  g.beginPath();
  g.arc(0, 0, r, 0, Math.PI * 2);
  g.fill();
  g.restore();
  g.save();
  g.globalCompositeOperation = "lighter";
  g.fillStyle = rad(g, cx - r * 0.12, cy, r * 0.4, [[0, `rgba(255,248,220,${0.28 + 0.06 * Math.sin(t * 1.7)})`], [1, "rgba(255,248,220,0)"]]);
  g.fillRect(cx - r * 0.45, cy - 8, r * 0.9, 16);
  g.restore();
  const ph = (t * 0.9) % 1;
  g.fillStyle = "rgba(200,214,222,0.7)";
  g.fillRect(cx + r * 0.08, cy - 110 + ph * 110, 1, 2);
}

/** Steam or vapour rising from (x, y), spreading and thinning. */
function plume(g: G, x: number, y: number, t: number, scale = 1) {
  for (let k = 0; k < 14; k++) {
    const age = (k / 14 + t * 0.35) % 1;
    const py = y - age * 70 * scale;
    const px = x + Math.sin(t * 1.3 + k * 1.7) * 6 * age * scale + age * 8 * scale;
    const r = (4 + age * 22) * scale;
    g.fillStyle = rad(g, px, py, r, [[0, `rgba(235,238,240,${0.5 * (1 - age)})`], [1, "rgba(235,238,240,0)"]]);
    g.fillRect(px - r, py - r, r * 2, r * 2);
  }
}

function beacon(g: G, x: number, y: number, t: number, color: [number, number, number] = [230, 40, 30]) {
  // A rotating beacon: never fully dark, and bright enough to bloom the sensor when it faces the lens.
  const lit = 0.35 + 0.65 * Math.max(0, Math.sin(t * 7));
  const [r, gr, b] = frameLook === "ir" ? [236, 236, 236] : color;
  g.fillStyle = "#1a1a1a";
  g.fillRect(x - 6, y + 6, 12, 5);
  g.fillStyle = `rgba(${r},${gr},${b},${0.6 + 0.4 * lit})`;
  g.beginPath();
  g.arc(x, y + 6, 6, Math.PI, 0);
  g.fill();
  g.globalCompositeOperation = "lighter";
  g.fillStyle = rad(g, x, y + 3, 110, [[0, `rgba(${r},${gr},${b},${0.55 * lit})`], [0.35, `rgba(${r},${gr},${b},${0.18 * lit})`], [1, "rgba(0,0,0,0)"]]);
  g.fillRect(x - 110, y - 110, 220, 220);
  g.fillStyle = rad(g, x, y + 3, 9, [[0, `rgba(255,255,255,${0.9 * lit})`], [1, "rgba(255,255,255,0)"]]);
  g.fillRect(x - 9, y - 6, 18, 18);
  g.globalCompositeOperation = "source-over";
}

/** A person on rounds: hard hat, coveralls, a torch sweeping. p: 0..1 across the frame. */
function rover(g: G, p: number, t: number, floorY: number, s = 1) {
  const x = -30 + p * (W + 60);
  const h = 78 * s;
  // Torch beam on the floor ahead. The sprite does not include a beam.
  g.globalCompositeOperation = "lighter";
  g.save();
  g.translate(x + 18 * s, floorY);
  g.scale(1, 0.25);
  g.fillStyle = rad(g, 30 * s, 0, 46 * s, [[0, "rgba(255,250,220,0.28)"], [1, "rgba(0,0,0,0)"]]);
  g.fillRect(-60 * s, -60 * s, 160 * s, 120 * s);
  g.restore();
  g.globalCompositeOperation = "source-over";
  g.fillStyle = "rgba(0,0,0,0.35)";
  g.beginPath();
  g.ellipse(x, floorY, 14 * s, 3 * s, 0, 0, Math.PI * 2);
  g.fill();
  const sheet = roverSheet();
  if (sheet) {
    const frame = Math.floor(t * 8) % 8;
    const fh = h;
    const fw = fh * (96 / 192);
    const cellW = sheet.width / 8;
    g.drawImage(sheet, frame * cellW, 0, cellW, sheet.height, x - fw / 2, floorY - fh, fw, fh);
    return;
  }
  const step = Math.sin(t * 6) * 3 * s;
  // Legs.
  g.fillStyle = "#1e2c3a";
  g.fillRect(x - 6 * s + step, floorY - h * 0.45, 5 * s, h * 0.45);
  g.fillRect(x + 1 * s - step, floorY - h * 0.45, 5 * s, h * 0.45);
  // Body, with reflective stripes that catch the light.
  g.fillStyle = "#24364a";
  g.fillRect(x - 8 * s, floorY - h * 0.82, 16 * s, h * 0.4);
  g.fillStyle = "rgba(220,230,200,0.85)";
  g.fillRect(x - 8 * s, floorY - h * 0.62, 16 * s, 2 * s);
  g.fillRect(x - 8 * s, floorY - h * 0.52, 16 * s, 2 * s);
  // Arm and torch.
  g.fillStyle = "#24364a";
  g.fillRect(x + 6 * s, floorY - h * 0.76, 10 * s, 4 * s);
  g.fillStyle = "#fff6d0";
  g.fillRect(x + 15 * s, floorY - h * 0.76, 3 * s, 3 * s);
  // Head and hard hat.
  g.fillStyle = "#c9a58a";
  g.fillRect(x - 4 * s, floorY - h * 0.94, 8 * s, 9 * s);
  g.fillStyle = "#e6e6e0";
  g.beginPath();
  g.ellipse(x, floorY - h * 0.95, 7 * s, 4 * s, 0, Math.PI, 0);
  g.fill();
  g.fillRect(x - 8 * s, floorY - h * 0.95, 16 * s, 1.5 * s);
}

/** A floor plane for the generic oddities, close enough for any room scene. */
const GENERIC: Room = {
  floor: (u, f) => [W / 2 + u * W * 0.4 * (1 - f * 0.7), H - f * 120],
  scale: (f) => 1 - f * 0.7,
};

function oddities(g: G, t: number, v: Vis, r: Room, scene: string) {
  if (v.has("chair") && !stateReady(scene, "chair")) {
    const [x, y] = r.floor(0.15, 0.35);
    const s = r.scale(0.35);
    g.fillStyle = "rgba(0,0,0,0.4)";
    g.beginPath();
    g.ellipse(x, y, 20 * s, 4 * s, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#1c1e20";
    g.fillRect(x - 2 * s, y - 26 * s, 4 * s, 24 * s);
    g.fillRect(x - 16 * s, y - 2 * s, 32 * s, 3 * s);
    g.fillStyle = "#2d3134";
    g.fillRect(x - 14 * s, y - 32 * s, 28 * s, 7 * s);
    g.fillRect(x - 12 * s, y - 62 * s, 24 * s, 30 * s);
  }
  // The hard hat is the corridor state plate (aux camera). No code hat on the turbine.
  if (v.has("flicker")) {
    const off = hash(Math.floor(t * 9), 11) > 0.62 || Math.sin(t * 31) > 0.85;
    if (off) {
      g.fillStyle = "rgba(0,0,0,0.38)";
      g.fillRect(0, 0, W, H);
    }
  }
}

/* ---------------------------------------------------------------- equipment */

/** The spinning highlight on a pump coupling. Kept in code even when the pump body is in the plate. */
function shaftGlint(g: G, cx: number, floorY: number, s: number, running: boolean, t: number) {
  if (!running) return;
  const mh = 90 * s;
  const top = floorY - 170 * s;
  const ph = (t * 25) % 1;
  g.fillStyle = "rgba(255,255,255,0.18)";
  g.fillRect(cx - 12 * s + ph * 24 * s, top + mh + 2 * s, 3 * s, 18 * s);
}

/** A vertical pump and motor: motor with cooling fins, coupling, casing, nozzles. */
function pumpSet(g: G, cx: number, floorY: number, s: number, running: boolean, t: number) {
  const mw = 70 * s;
  const mh = 90 * s;
  const top = floorY - 170 * s;
  vCyl(g, cx - mw / 2, top, mw, mh, "#1f3327", "#3d6a4d", "#7fae8d");
  g.fillStyle = "rgba(0,0,0,0.35)";
  for (let k = 1; k < 9; k++) g.fillRect(cx - mw / 2, top + k * (mh / 9), mw, 1.5 * s);
  vCyl(g, cx - mw * 0.55, top - 8 * s, mw * 1.1, 10 * s, "#22252a", "#55606a", "#9aa4ab");
  // Coupling: a spinning shaft behind a guard.
  vCyl(g, cx - 12 * s, top + mh, 24 * s, 22 * s, "#1b1c1d", "#4a4d50", "#8d9296");
  shaftGlint(g, cx, floorY, s, running, t);
  vCyl(g, cx - mw * 0.6, top + mh + 22 * s, mw * 1.2, 58 * s, "#25282b", "#5b6266", "#a3aaae");
  hPipe(g, cx - 160 * s, floorY - 50 * s, 120 * s, 30 * s);
  hPipe(g, cx + 40 * s, floorY - 50 * s, 120 * s, 30 * s);
  flange(g, cx - 46 * s, floorY - 54 * s, 8 * s, 38 * s);
  flange(g, cx + 38 * s, floorY - 54 * s, 8 * s, 38 * s);
}

/* ---------------------------------------------------------------- scenes */

/** Words and radiation symbols. On a photo these land on the blank boards the plate already has. */
function marks(g: G, scene: string) {
  if (scene === "containment") {
    sign(g, 32, 70, 54, 30, "#e8c21a", "#6b1f6b", ["CAUTION", "HIGH RAD", "AREA"]);
    trefoil(g, 59, 112, 8);
  } else if (scene === "pressurizer") {
    sign(g, 40, 90, 58, 26, "#ffffff", "#c0392b", ["DANGER", "HOT SURFACES"]);
  } else if (scene === "msiv") {
    sign(g, 360, 54, 70, 46, "#ececec", "#111", ["MAIN STEAM", "LINE RAD", "MONITOR"]);
    trefoil(g, 395, 40, 7);
  } else if (scene === "tunnel") {
    trefoil(g, W / 2, 86, 6);
  } else if (scene === "freeze") {
    sign(g, 60, 80, 80, 34, "#ffffff", "#111", ["FREEZE VALVE", "FV-103"]);
  } else if (scene === "offgas") {
    trefoil(g, 440, 90, 8);
  } else if (scene === "turbine") {
    sign(g, 20, 40, 40, 18, "#0f6b2f", "#fff", ["EXIT"]);
  } else if (scene === "corridor") {
    sign(g, 386, 94, 58, 46, "#e8c21a", "#6b1f6b", ["LOCKED HIGH", "RADIATION", "AREA"]);
    trefoil(g, 415, 158, 9);
  }
}

const S: Record<string, Scene> = {
  containment: {
    look: "fluor",
    base(g) {
      room(g, { backW: 0.5, backH: 0.5, vy: 0.45, wallLow: "#4d5357", wallHigh: "#5e6569", ceiling: "#3c4144", floor: "#3a3d3f", floorLine: "rgba(0,0,0,0.3)", floorKind: "grating", lights: [0.2, 0.6] });
      // Polar crane girder.
      hPipe(g, 0, 14, W, 10, "#3b2a10", "#a7781c", "#e2b63a");
      marks(g, "containment");
    },
    live(g, t, v) {
      if (usingPlate) shaftGlint(g, W / 2, H - 28, 0.95, true, t);
      else pumpSet(g, W / 2, H - 28, 0.95, true, t);
      if (v.has("puddle")) {
        puddle(g, W / 2, H - 16, 90, t, v.at("puddle") ?? 1);
        plume(g, W / 2 + 10, H - 70, t, 0.8);
      }
    },
  },
  pressurizer: {
    look: "fluor",
    base(g) {
      room(g, { backW: 0.36, backH: 0.42, vy: 0.5, wallLow: "#55595b", wallHigh: "#63686a", ceiling: "#3e4244", floor: "#3c3f41", floorLine: "rgba(0,0,0,0.25)", floorKind: "concrete", lights: [0.3] });
      // The vessel, lagged, filling the cubicle.
      lagged(g, 180, 0, 120, H - 20, true);
      g.fillStyle = "rgba(0,0,0,0.35)";
      g.fillRect(300, 0, 10, H - 20);
      // Spray line and the relief line to its valve, with a handwheel.
      lagged(g, 300, 40, 100, 14);
      lagged(g, 392, 0, 14, 60, true);
      vCyl(g, 380, 56, 38, 30, "#3a1f14", "#7d4a2c", "#b98058");
      handwheel(g, 399, 52, 16);
      marks(g, "pressurizer");
    },
    live(g, t, v) {
      if (v.has("steamWisp")) plume(g, 400, 62, t, 1.1);
    },
  },
  msiv: {
    look: "fluor",
    base(g) {
      room(g, { backW: 0.44, backH: 0.44, vy: 0.45, wallLow: "#4a4f52", wallHigh: "#5a6063", ceiling: "#3b3f42", floor: "#393c3e", floorLine: "rgba(0,0,0,0.25)", floorKind: "concrete", lights: [0.25, 0.65] });
      lagged(g, 0, 128, W, 46);
      vCyl(g, 200, 96, 80, 110, "#26292c", "#5a6064", "#a7aeb2");
      vCyl(g, 214, 54, 52, 44, "#1d3a28", "#3f7353", "#82b896");
      marks(g, "msiv");
    },
    live(g, t, v) {
      // The monitor's display: green normal, red with the reading high.
      const hi = v.has("beacon");
      // Status strip sits in the lower margin of the rad-monitor board, not under it.
      g.fillStyle = hi ? `rgba(230,40,30,${0.6 + 0.4 * Math.sin(t * 6)})` : "rgba(60,200,90,0.85)";
      g.fillRect(364, 96, 64, 4);
      if (hi) beacon(g, 440, 40, t);
    },
  },
  drywell: {
    look: "ir",
    base(g) {
      room(g, { backW: 0.5, backH: 0.5, vy: 0.45, wallLow: "#3d3530", wallHigh: "#4b423b", ceiling: "#2c2825", floor: "#3a3530", floorLine: "rgba(255,170,60,0.25)", floorKind: "grating", lights: [0.3, 0.7] });
      lagged(g, 0, 40, 160, 20);
    },
    live(g, t, v) {
      if (usingPlate) shaftGlint(g, W / 2, H - 24, 0.9, true, t);
      else pumpSet(g, W / 2, H - 24, 0.9, true, t);
      if (v.has("puddle")) {
        puddle(g, W / 2, H - 12, 100, t, v.at("puddle") ?? 1);
        plume(g, W / 2 - 20, H - 60, t, 0.7);
      }
    },
  },
  torus: {
    look: "ir",
    base(g) {
      room(g, { backW: 0.6, backH: 0.4, vy: 0.4, wallLow: "#4e5458", wallHigh: "#5d6468", ceiling: "#3a3e41", floor: "#2a2f33", floorLine: "rgba(0,0,0,0)", floorKind: "concrete", lights: [0.3, 0.7] });
      g.fillStyle = lin(g, 0, 150, 0, H, [[0, "#3e4a52"], [1, "#1c2328"]]);
      g.fillRect(0, 150, W, H - 150);
      hPipe(g, 0, 140, W, 12);
    },
    live(g, t, v) {
      for (let k = 0; k < 18; k++) {
        const y = 156 + k * 6;
        g.fillStyle = `rgba(200,215,225,${0.05 + 0.04 * Math.sin(t * 1.4 + k)})`;
        g.fillRect(0, y + Math.sin(t + k) * 1.5, W, 1);
      }
      if (v.has("steamWisp")) {
        plume(g, 150, 160, t, 1);
        plume(g, 330, 166, t + 1.3, 1.1);
        for (let k = 0; k < 10; k++) {
          g.fillStyle = "rgba(230,235,240,0.5)";
          g.beginPath();
          g.arc(140 + hash(k, Math.floor(t * 4)) * 220, 168 + hash(Math.floor(t * 4), k) * 60, 1.5, 0, Math.PI * 2);
          g.fill();
        }
      }
    },
  },
  tunnel: {
    look: "ir",
    base(g) {
      room(g, { backW: 0.16, backH: 0.2, vy: 0.42, wallLow: "#3a3f42", wallHigh: "#4a5054", ceiling: "#2b2f32", floor: "#323538", floorLine: "rgba(0,0,0,0.3)", floorKind: "concrete", lights: [0.15, 0.4, 0.62, 0.8] });
      // Two main steam lines receding.
      for (const [x0, x1] of [[0, 196], [W, 284]] as const) {
        poly(g, [[x0, 70], [x1, 104], [x1, 114], [x0, 116]], lin(g, 0, 70, 0, 116, [[0, "#c8cdd0"], [1, "#4b5054"]]));
      }
      marks(g, "tunnel");
    },
    live(g, t, v) {
      if (v.has("beacon")) beacon(g, W / 2, 70, t);
      if (v.has("condensate")) {
        const grow = v.at("condensate") ?? 0.7;
        for (let k = 0; k < 4; k++) {
          const x = 148 + k * 52;
          const fall = (t * 22 + k * 19) % 70;
          const streak = 5;
          for (let s = 0; s < streak; s++) {
            g.fillStyle = `rgba(186,198,206,${0.28 * (1 - s / streak)})`;
            g.fillRect(x, 116 + fall + s, 1, 2);
          }
          const pr = 16 + grow * 8;
          g.save();
          g.globalCompositeOperation = "multiply";
          g.fillStyle = rad(g, x, H - 18, pr, [[0, "rgb(50,50,50)"], [0.7, "rgb(110,110,110)"], [1, "rgb(255,255,255)"]]);
          g.beginPath();
          g.ellipse(x, H - 18, pr, pr * 0.34, 0, 0, Math.PI * 2);
          g.fill();
          g.restore();
        }
      }
    },
  },
  cavity: {
    look: "ir",
    base(g) {
      room(g, { backW: 0.5, backH: 0.45, vy: 0.42, wallLow: "#4e5256", wallHigh: "#5c6064", ceiling: "#3a3d40", floor: "#3b3e40", floorLine: "rgba(0,0,0,0.3)", floorKind: "concrete", lights: [0.3, 0.7] });
      g.fillStyle = lin(g, 0, 150, 0, 230, [[0, "#6d7377"], [1, "#2d3134"]]);
      g.beginPath();
      g.ellipse(W / 2, 180, 150, 36, 0, 0, Math.PI * 2);
      g.fill();
      for (let k = 0; k < 10; k++) vCyl(g, 150 + k * 19, 96, 10, 80, "#2a2d30", "#6c7276", "#b5bbbe");
    },
    live(g, t, v) {
      if (v.has("warmGlow")) {
        g.globalCompositeOperation = "lighter";
        g.fillStyle = rad(g, W / 2, 180, 160, [[0, `rgba(255,200,150,${0.4 + 0.08 * Math.sin(t)})`], [1, "rgba(0,0,0,0)"]]);
        g.fillRect(0, 0, W, H);
        g.globalCompositeOperation = "source-over";
      }
    },
  },
  blower: {
    look: "fluor",
    base(g) {
      room(g, { backW: 0.5, backH: 0.48, vy: 0.45, wallLow: "#4b5155", wallHigh: "#5b6165", ceiling: "#3a3e41", floor: "#393c3f", floorLine: "rgba(0,0,0,0.3)", floorKind: "epoxy", lights: [0.3, 0.7] });
      vCyl(g, 290, 0, 110, H - 30, "#2a2e31", "#6b7276", "#c2c8cb");
    },
    live(g, t, v) {
      if (!usingPlate) {
        const dx = v.has("shake") ? Math.sin(t * 80) * 2 : 0;
        vCyl(g, 70 + dx, 110, 130, 120, "#1f3327", "#3d6a4d", "#7fae8d");
        vCyl(g, 120 + dx, 150, 30, 30, "#141618", "#3c4043", "#7b8186");
        hPipe(g, 200, 150, 90, 24);
      } else if (v.has("shake")) {
        // Redraw the casing from the plate itself, a couple of pixels off, so the machine vibrates.
        const img = plateFor("blower");
        if (img) {
          const dx = Math.sin(t * 80) * 2;
          const sx = (66 * img.width) / W;
          const sy = (106 * img.height) / H;
          const sw = (138 * img.width) / W;
          const sh = (128 * img.height) / H;
          g.drawImage(img, sx, sy, sw, sh, 66 + dx, 106, 138, 128);
        }
      }
      if (v.has("steamWisp")) plume(g, 340, 150, t, 1);
      if (v.has("shake")) beacon(g, 135, 96, t, [240, 190, 40]);
    },
  },
  discharge: {
    look: "fluor",
    base(g) {
      room(g, { backW: 0.4, backH: 0.44, vy: 0.45, wallLow: "#4f5458", wallHigh: "#5d6366", ceiling: "#3a3e41", floor: "#393c3e", floorLine: "rgba(0,0,0,0.3)", floorKind: "concrete", lights: [0.3, 0.7] });
      lagged(g, 230, 0, 22, 190, true);
      lagged(g, 230, 180, W - 230, 22);
      g.fillStyle = "#d8d8d0";
      g.fillRect(90, 120, 70, 50);
      g.fillStyle = "#111";
      g.fillRect(96, 128, 58, 14);
    },
    live(g, t, v) {
      const jam = v.has("jam");
      // Dark screen on the wall panel, measured on the plate: (87, 124, 19, 14).
      g.fillStyle = jam ? `rgba(230,40,30,${0.6 + 0.4 * Math.sin(t * 6)})` : "rgba(60,200,90,0.85)";
      g.fillRect(89, 128, 15, 6);
      if (jam) beacon(g, 91, 108, t);
    },
  },
  cell: {
    look: "amber",
    base(g) {
      g.fillStyle = "#0d0d0c";
      g.fillRect(0, 0, W, H);
      // A thick shielding window: amber glass, deep frame.
      g.fillStyle = lin(g, 60, 0, 420, 0, [[0, "#2b2722"], [0.5, "#3b352d"], [1, "#2b2722"]]);
      g.fillRect(50, 30, 380, 210);
      g.fillStyle = lin(g, 0, 50, 0, 220, [[0, "#6a4a14"], [1, "#3a2608"]]);
      g.fillRect(74, 50, 332, 170);
      hPipe(g, 90, 140, 300, 18, "#2a1d0c", "#6a4d22", "#b38a4a");
      vCyl(g, 180, 70, 70, 70, "#2a1d0c", "#6a4d22", "#b38a4a");
      g.fillStyle = "rgba(255,240,200,0.08)";
      g.fillRect(74, 50, 332, 30);
    },
    live(g, t, v) {
      // The photo already has the glowing trace. Dots are the code fallback, including a dark zone
      // when the dark-heater plate has not loaded.
      const plateShowsHeaters = usingPlate && (!v.has("heaterDark") || stateReady("cell", "heaterDark"));
      if (!plateShowsHeaters) {
        for (let x = 92; x < 388; x += 6) {
          const dead = v.has("heaterDark") && x > 220 && x < 300;
          g.fillStyle = dead ? "rgba(40,30,20,0.9)" : `rgba(255,${Math.round(110 + 30 * Math.sin(t + x))},40,0.8)`;
          g.fillRect(x, 160, 3, 2);
        }
      }
      if (v.has("shadow")) {
        // Soft figure in the bright part of the glass. Multiply darkens about 30%, feathered 6px. No rim.
        const x = 228 + Math.sin((t * Math.PI) / 2);
        g.save();
        g.globalCompositeOperation = "multiply";
        g.shadowColor = "rgb(210,210,210)";
        g.shadowBlur = 6;
        g.shadowOffsetX = 0;
        g.shadowOffsetY = 0;
        g.fillStyle = "rgb(178,178,178)";
        g.beginPath();
        g.ellipse(x, 98, 8, 10, 0, 0, Math.PI * 2);
        g.ellipse(x, 126, 13, 24, 0, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
    },
  },
  freeze: {
    look: "fluor",
    base(g) {
      room(g, { backW: 0.4, backH: 0.44, vy: 0.45, wallLow: "#4b5054", wallHigh: "#5a6064", ceiling: "#3a3e41", floor: "#393c3e", floorLine: "rgba(0,0,0,0.3)", floorKind: "concrete", lights: [0.3] });
      lagged(g, 220, 0, 30, 170, true);
      vCyl(g, 205, 120, 60, 44, "#26292c", "#5a6064", "#a7aeb2");
      hPipe(g, 265, 136, 90, 12);
      vCyl(g, 350, 112, 70, 70, "#30353a", "#62696f", "#a9b0b5");
      marks(g, "freeze");
    },
    live(g, t, v) {
      if (!v.has("frostGone") && !usingPlate)
        for (let k = 0; k < 420; k++) {
          g.fillStyle = "rgba(240,245,250,0.85)";
          g.fillRect(203 + hash(k, 1) * 64, 116 + hash(k, 2) * 52, 2, 2);
        }
      // Cooling-air fan.
      const a = v.has("frostGone") ? 0.3 : t * 14;
      g.strokeStyle = "#cfd5d8";
      g.lineWidth = 3;
      for (let k = 0; k < 3; k++) {
        g.beginPath();
        g.moveTo(385, 147);
        g.lineTo(385 + Math.cos(a + (k * 2 * Math.PI) / 3) * 28, 147 + Math.sin(a + (k * 2 * Math.PI) / 3) * 28);
        g.stroke();
      }
      if (v.has("frostGone")) beacon(g, 235, 96, t, [240, 190, 40]);
    },
  },
  offgas: {
    look: "fluor",
    base(g) {
      room(g, { backW: 0.5, backH: 0.45, vy: 0.45, wallLow: "#4c5155", wallHigh: "#5b6165", ceiling: "#3a3e41", floor: "#393c3e", floorLine: "rgba(0,0,0,0.3)", floorKind: "concrete", lights: [0.3, 0.7] });
      for (const x of [80, 200, 320]) vCyl(g, x, 70, 80, 150, "#2a2d30", "#62686c", "#b0b6b9");
      lagged(g, 60, 56, 360, 12);
      marks(g, "offgas");
    },
    live(g, t, v) {
      if (v.has("beacon")) beacon(g, 440, 110, t);
    },
  },
  turbine: {
    look: "fluor",
    base(g) {
      room(g, { backW: 0.3, backH: 0.3, vy: 0.36, wallLow: "#6a6e66", wallHigh: "#7d8279", ceiling: "#4a4d48", floor: "#5f6360", floorLine: "rgba(0,0,0,0.15)", floorKind: "epoxy", lights: [0.1, 0.3, 0.5, 0.7, 0.85], split: 0.25 });
      // The turbine casing down the hall.
      poly(g, [[110, 120], [370, 120], [310, 96], [170, 96]], lin(g, 0, 96, 0, 120, [[0, "#9fb8a2"], [1, "#3e5a45"]]));
      g.fillStyle = "#2c3f31";
      g.fillRect(110, 120, 260, 18);
      marks(g, "turbine");
    },
    live(g, t, v) {
      // Feed pumps A (left) and B (right) in the foreground. The bodies live in the plate; the glint stays.
      if (usingPlate) {
        shaftGlint(g, 70, H - 6, 0.55, true, t);
        shaftGlint(g, 410, H - 6, 0.55, !v.has("pumpStopped"), t);
      } else {
        pumpSet(g, 70, H - 6, 0.55, true, t);
        pumpSet(g, 410, H - 6, 0.55, !v.has("pumpStopped"), t);
      }
      if (v.has("pumpStopped")) beacon(g, 410, 120, t);
    },
  },
  corridor: {
    look: "sodium",
    base(g) {
      const r = room(g, { backW: 0.14, backH: 0.24, vy: 0.42, wallLow: "#9a8a52", wallHigh: "#c8b97a", ceiling: "#a89b6e", floor: "#8a7d55", floorLine: "rgba(60,50,20,0.25)", floorKind: "tile", lights: [0.08, 0.25, 0.42, 0.58, 0.72, 0.84], lightColor: "#fff8dc", split: 0.3 });
      // Doors down the left side, the locked high radiation door near right.
      for (const f of [0.25, 0.5, 0.7]) {
        const [x, y] = r.floor(-1, f);
        const s = r.scale(f);
        g.fillStyle = "#5c4a2c";
        g.fillRect(x + 2, y - 110 * s, 40 * s, 110 * s);
        g.fillStyle = "#c2a66a";
        g.fillRect(x + 30 * s, y - 55 * s, 4 * s, 4 * s);
      }
      g.fillStyle = "#3a3d40";
      g.fillRect(372, 70, 86, 176);
      g.fillStyle = lin(g, 376, 0, 454, 0, [[0, "#8f2b20"], [0.4, "#b8392a"], [1, "#6a1f17"]]);
      g.fillRect(376, 74, 78, 172);
      marks(g, "corridor");
    },
    live(g, t, v) {
      if (v.has("doorAjar") && !stateReady("corridor", "doorAjar")) {
        g.fillStyle = "#050505";
        g.fillRect(360, 74, 16, 172);
        g.fillStyle = "rgba(0,0,0,0.45)";
        g.beginPath();
        g.moveTo(360, 246);
        g.lineTo(376, 246);
        g.lineTo(320, H);
        g.lineTo(290, H);
        g.fill();
      }
      if (v.has("puddle")) puddle(g, 200, H - 26, 80, t, v.at("puddle") ?? 1);
    },
  },
  pool: {
    look: "pool",
    base(g) {
      room(g, { backW: 0.7, backH: 0.36, vy: 0.32, wallLow: "#5c6266", wallHigh: "#6b7175", ceiling: "#44494c", floor: "#474b4e", floorLine: "rgba(0,0,0,0)", floorKind: "concrete", lights: [0.4, 0.8] });
      // Railing and the FME line.
      g.fillStyle = "#e8c21a";
      for (let x = 20; x < W; x += 34) g.fillRect(x, 96, 18, 3);
      hPipe(g, 0, 80, W, 4, "#3b2a10", "#a7781c", "#e2b63a");
    },
    live(g, t, v) {
      const low = v.has("poolLow");
      const top = low ? 122 : 106;
      // A loaded plate already has the water. The flat fill comes back if the low-level variant is missing.
      const photo = usingPlate && !(low && !stateReady("pool", "poolLow"));
      if (!photo) {
        // Exposed liner where the level dropped.
        if (low) {
          g.fillStyle = lin(g, 0, 100, 0, 122, [[0, "#8a9196"], [1, "#4b5155"]]);
          g.fillRect(14, 106, W - 28, 16);
        }
        g.fillStyle = lin(g, 0, top, 0, H, [[0, "#1d4f6b"], [0.5, "#0f3048"], [1, "#081b2a"]]);
        g.fillRect(14, top, W - 28, H - top);
      }
      // Racks on the bottom, glowing Cherenkov blue. A photo already has its own cells:
      // the code glow is placed on those cells, and the flat rectangles stay off.
      if (!usingPlate) {
        for (let x = 40; x < W - 40; x += 22) {
          g.fillStyle = "#0b1822";
          g.fillRect(x, 196, 18, 60);
          g.globalCompositeOperation = "lighter";
          g.fillStyle = rad(g, x + 9, 226, 26, [[0, `rgba(80,160,255,${0.55 + 0.1 * Math.sin(t * 1.1 + x)})`], [1, "rgba(0,0,0,0)"]]);
          g.fillRect(x - 20, 190, 58, 70);
          g.globalCompositeOperation = "source-over";
        }
      } else {
        const dot = cherenkovDot();
        g.globalCompositeOperation = "lighter";
        if (dot) {
          for (const [x, y] of PLATES.pool.glow ?? []) {
            g.globalAlpha = 0.5 + 0.12 * Math.sin(t * 1.1 + x);
            g.drawImage(dot as CanvasImageSource, x - 16, y - 16, 32, 32);
          }
          g.globalAlpha = 1;
        }
        g.globalCompositeOperation = "source-over";
      }
      // Caustics on the surface.
      for (let k = 0; k < 26; k++) {
        const y = top + 4 + k * 5;
        if (y > 190) break;
        g.fillStyle = `rgba(160,210,240,${0.06 + 0.05 * Math.sin(t * 1.6 + k * 0.7)})`;
        g.fillRect(14 + Math.sin(t + k) * 10, y, W - 28, 1);
      }
      if (v.has("ripple") || v.has("toolBag")) {
        const rx = 200 + Math.sin(t * 0.4) * 40;
        const img = plateFor("pool");
        for (let k = 0; k < 3; k++) {
          const age = (t * 0.3 + k / 3) % 1;
          const rxr = 16 + age * 34;
          const ryr = 5 + age * 7;
          const y = 188 + k * 8;
          g.save();
          g.beginPath();
          g.ellipse(rx, y, rxr, ryr, 0, 0, Math.PI * 2);
          g.ellipse(rx, y, rxr * 0.72, ryr * 0.72, 0, 0, Math.PI * 2, true);
          g.clip();
          if (img) {
            const shift = 6 * Math.sin(t * 1.4 + k);
            g.drawImage(img, 0, 0, img.width, img.height, shift, 0.6, W, H);
          } else {
            g.globalAlpha = 0.12;
            g.strokeStyle = "rgba(220,240,255,0.9)";
            g.lineWidth = 1;
            g.beginPath();
            g.ellipse(rx, y, rxr * 0.86, ryr * 0.86, 0, 0, Math.PI * 2);
            g.stroke();
          }
          g.restore();
        }
      }
      if (v.has("toolBag") && !stateReady("pool", "toolBag")) {
        g.fillStyle = lin(g, 0, 70, 0, 96, [[0, "#7a2e1c"], [1, "#3e170e"]]);
        g.fillRect(380, 76, 44, 22);
        g.fillStyle = "#151515";
        g.fillRect(392, 70, 20, 6);
      }
    },
  },
  yard: {
    look: "sodium",
    base(g) {
      g.fillStyle = lin(g, 0, 0, 0, 170, [[0, "#06080c"], [1, "#1a1f26"]]);
      g.fillRect(0, 0, W, 170);
      speckle(g, 0, 0, W, 90, 70, "rgba(200,210,230,0.5)", 9);
      g.fillStyle = lin(g, 0, 170, 0, H, [[0, "#1b2016"], [1, "#0b0d09"]]);
      g.fillRect(0, 170, W, H - 170);
      // Gravel catching the sodium light.
      speckle(g, 0, 175, W, 95, 1400, "rgba(255,200,120,0.12)", 4);
      for (const x of [90, 240, 390]) {
        g.strokeStyle = "#3d4247";
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(x - 24, 178);
        g.lineTo(x, 40);
        g.lineTo(x + 24, 178);
        g.stroke();
        g.lineWidth = 1;
        for (let y = 60; y < 178; y += 16) {
          g.beginPath();
          g.moveTo(x - 24 * ((y - 40) / 138), y);
          g.lineTo(x + 24 * ((y + 16 - 40) / 138), y + 16);
          g.stroke();
        }
        g.fillStyle = "#3d4247";
        g.fillRect(x - 40, 52, 80, 3);
        for (const dx of [-38, 36]) {
          g.fillStyle = "#c8c8c0";
          g.fillRect(x + dx, 55, 3, 12);
        }
      }
      g.strokeStyle = "rgba(120,125,130,0.7)";
      for (const y of [62, 66]) {
        g.beginPath();
        g.moveTo(0, y + 4);
        g.quadraticCurveTo(165, y + 16, 240, y);
        g.quadraticCurveTo(315, y + 16, W, y + 4);
        g.stroke();
      }
      // A sodium lamp on a pole.
      g.fillStyle = "#2a2a2a";
      g.fillRect(452, 60, 3, 120);
      g.globalCompositeOperation = "lighter";
      g.fillStyle = rad(g, 446, 60, 120, [[0, "rgba(255,170,70,0.35)"], [1, "rgba(0,0,0,0)"]]);
      g.fillRect(320, 0, 160, 200);
      g.globalCompositeOperation = "source-over";
    },
    live(g, t, v) {
      if (v.has("arc") && Math.abs(hash(Math.floor(t * 14), 7)) > 0.3) {
        // hash() is signed, so a raw "> 0.6" never fired and the flashover never showed.
        g.globalCompositeOperation = "lighter";
        g.fillStyle = rad(g, 278, 62, 90, [[0, "rgba(200,220,255,0.9)"], [0.2, "rgba(160,190,255,0.4)"], [1, "rgba(0,0,0,0)"]]);
        g.fillRect(180, 0, 200, 160);
        g.globalCompositeOperation = "source-over";
      }
      if (v.has("fog") || v.has("arc")) {
        for (let k = 0; k < 8; k++) {
          const x = ((t * 6 + k * 90) % (W + 200)) - 100;
          g.fillStyle = rad(g, x, 150 + k * 6, 120, [[0, "rgba(190,180,160,0.55)"], [1, "rgba(0,0,0,0)"]]);
          g.fillRect(x - 120, 30, 240, 240);
        }
      }
      const van = v.at("van");
      if (van !== null) {
        // Headlights coming up the access road.
        const x = 40 + van * 200;
        g.globalCompositeOperation = "lighter";
        for (const dx of [0, 18]) {
          g.fillStyle = rad(g, x + dx, 214, 60, [[0, "rgba(255,250,230,0.8)"], [0.15, "rgba(255,240,200,0.35)"], [1, "rgba(0,0,0,0)"]]);
          g.fillRect(x + dx - 60, 154, 120, 120);
        }
        g.globalCompositeOperation = "source-over";
      }
    },
  },
  intake: {
    look: "ir",
    base(g) {
      g.fillStyle = "#0b0c0d";
      g.fillRect(0, 0, W, H);
      g.fillStyle = lin(g, 0, 80, 0, 110, [[0, "#5d6265"], [1, "#2b2f31"]]);
      g.fillRect(0, 80, W, 30);
      for (const x of [80, 210, 340]) {
        vCyl(g, x, 30, 64, 190, "#25292c", "#5a6064", "#9aa1a5");
        g.fillStyle = "rgba(0,0,0,0.45)";
        for (let y = 40; y < 216; y += 7) g.fillRect(x + 4, y, 56, 2);
      }
    },
    live(g, t, v) {
      for (let k = 0; k < 30; k++) {
        const y = 150 + k * 4;
        g.fillStyle = `rgba(150,170,180,${0.05 + 0.05 * Math.sin(t * 2 + k)})`;
        g.fillRect(Math.sin(t * 0.8 + k) * 20, y, W, 2);
      }
      if (v.has("debris")) {
        if (!stateReady("intake", "debris")) {
          for (const x of [80, 210, 340])
            for (let k = 0; k < 14; k++) {
              g.fillStyle = "rgba(40,32,20,0.9)";
              g.fillRect(x + 6 + hash(k, x) * 52, 120 + hash(x, k) * 90, 5, 3);
            }
        }
        beacon(g, 450, 30, t, [240, 190, 40]);
      }
      if (v.has("gull")) {
        const gx = ((t * 36) % (W + 80)) - 40;
        const gy = 46 + Math.sin(t * 3) * 8;
        g.fillStyle = "#f2f2ea";
        g.beginPath();
        g.moveTo(gx - 36, gy + 2);
        g.quadraticCurveTo(gx - 12, gy - 18, gx, gy);
        g.quadraticCurveTo(gx + 12, gy - 18, gx + 36, gy + 2);
        g.quadraticCurveTo(gx + 10, gy + 10, gx, gy + 6);
        g.quadraticCurveTo(gx - 10, gy + 10, gx - 36, gy + 2);
        g.fill();
        g.fillStyle = "#1a1a18";
        g.fillRect(gx + 16, gy - 1, 6, 2);
      }
    },
  },
};

/* ---------------------------------------------------------------- the camera pass */

const GRADE: Record<Look, { tint: string; lift: string; mono: boolean }> = {
  ir: { tint: "rgb(190,200,190)", lift: "rgb(18,22,20)", mono: true },
  sodium: { tint: "rgb(255,196,120)", lift: "rgb(20,14,6)", mono: false },
  fluor: { tint: "rgb(205,225,210)", lift: "rgb(10,14,12)", mono: false },
  pool: { tint: "rgb(200,220,235)", lift: "rgb(6,10,14)", mono: false },
  amber: { tint: "rgb(255,210,150)", lift: "rgb(12,8,4)", mono: false },
};

/** Which look a scene is graded with (exported for tests and the UI's feed label). */
export function lookOf(scene: string): Look {
  return (S[scene] ?? S.corridor).look;
}

type Surface = HTMLCanvasElement | OffscreenCanvas;

/** A canvas to cache scene bases in, where the environment has one. */
function makeCanvas(): Surface | null {
  try {
    if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(W, H);
    if (typeof document !== "undefined") {
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      return c;
    }
  } catch {
    // No canvas here (tests): draw the base every frame.
  }
  return null;
}

const cache = new Map<string, Surface>();
let noise: Surface[] | null = null;
let noiseTried = false;

function baseFor(scene: string, sc: Scene): Surface | null {
  const hit = cache.get(scene);
  if (hit) return hit;
  const c = makeCanvas();
  const g = c?.getContext("2d") as G | null | undefined;
  if (!c || !g) return null;
  sc.base(g);
  cache.set(scene, c);
  return c;
}

function noiseFrames(): Surface[] | null {
  if (noise || noiseTried) return noise;
  noiseTried = true;
  const frames: Surface[] = [];
  for (let f = 0; f < 4; f++) {
    const c = makeBacking();
    const g = c?.getContext("2d") as G | null | undefined;
    if (!c || !g) return null;
    const img = g.createImageData(W * CAM_PX, H * CAM_PX);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(hash(i, f + 1) * 255);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    frames.push(c);
  }
  noise = frames;
  return noise;
}

function parseVis(visuals: string[]): Vis {
  const set = new Set(visuals.map((x) => x.split(":")[0]));
  return {
    has: (k) => set.has(k),
    at: (k) => {
      const hit = visuals.find((x) => x.startsWith(`${k}:`));
      return hit ? Number(hit.split(":")[1]) : null;
    },
  };
}

/** One Cherenkov blob, reused. Building a radial gradient per cell per frame was the pool's frame cost. */
let cherenkov: Surface | null | undefined;
function cherenkovDot(): Surface | null {
  if (cherenkov !== undefined) return cherenkov;
  const s = 64;
  try {
    const c: Surface | null = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(s, s) : null;
    const g = c?.getContext("2d") as G | null | undefined;
    if (!c || !g) {
      cherenkov = null;
      return null;
    }
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, "rgba(80,160,255,1)");
    gr.addColorStop(1, "rgba(80,160,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
    cherenkov = c;
    return c;
  } catch {
    cherenkov = null;
    return null;
  }
}

/** Where people walk on each scene: the floor line and how big they are (0: nobody can be seen). */
const WALK: Record<string, { y: number; s: number }> = {
  containment: { y: 250, s: 0.9 },
  pressurizer: { y: 250, s: 0.9 },
  msiv: { y: 245, s: 0.85 },
  drywell: { y: 250, s: 0.9 },
  torus: { y: 150, s: 0.55 },
  tunnel: { y: 210, s: 0.6 },
  cavity: { y: 250, s: 0.85 },
  blower: { y: 255, s: 0.9 },
  discharge: { y: 250, s: 0.85 },
  freeze: { y: 250, s: 0.85 },
  offgas: { y: 250, s: 0.85 },
  turbine: { y: 200, s: 0.55 },
  corridor: { y: 200, s: 0.5 },
  pool: { y: 100, s: 0.5 },
  yard: { y: 214, s: 0.9 },
  intake: { y: 112, s: 0.45 },
  cell: { y: 236, s: 0 },
};

function layers(g: G, scene: string, sc: Scene, v: Vis, t: number) {
  sc.live(g, t, v);
  // The rover walks through (the shielding window has nobody behind it).
  const rv = v.at("rover");
  const walk = WALK[scene];
  if (rv !== null && walk && walk.s > 0) rover(g, rv, t, walk.y, walk.s);
  oddities(g, t, v, GENERIC, scene);
}

/**
 * The scene without the camera pass: what the lens sees before grain, grade and vignette. Used to export
 * reference plates (base only with no visuals, or with every layer) for art made to fit the same layout.
 */
export function paintReference(g: G, scene: string, visuals: string[], t: number, withLayers = true) {
  const sc = S[scene] ?? S.corridor;
  const name = S[scene] ? scene : "corridor";
  const v = parseVis(visuals);
  g.save();
  layBase(g, name, sc, v, false);
  if (withLayers) layers(g, name, sc, v, t);
  usingPlate = false;
  g.restore();
}

const plateCache = new Map<string, Surface>();

/** The photo, drawn once at the backing-store size, so a frame does not rescale the file. */
function cachedPlate(scene: string, img: CanvasImageSource): Surface | null {
  const hit = plateCache.get(scene);
  if (hit) return hit;
  let c: Surface | null = null;
  try {
    if (typeof OffscreenCanvas !== "undefined") c = new OffscreenCanvas(W * CAM_PX, H * CAM_PX);
    else if (typeof document !== "undefined") {
      const el = document.createElement("canvas");
      el.width = W * CAM_PX;
      el.height = H * CAM_PX;
      c = el;
    }
  } catch {
    c = null;
  }
  const cg = c?.getContext("2d") as G | null | undefined;
  if (!c || !cg) return null;
  cg.drawImage(img, 0, 0, W * CAM_PX, H * CAM_PX);
  plateCache.set(scene, c);
  return c;
}

/** Photo plate, or the code base. `cached` is the game path; the reference export redraws. */
function layBase(g: G, scene: string, sc: Scene, v: Vis, cached: boolean) {
  const plate = plateFor(scene);
  usingPlate = plate !== null;
  if (plate) {
    const drawn = cachedPlate(scene, plate);
    if (drawn) g.drawImage(drawn as CanvasImageSource, 0, 0, W, H);
    else g.drawImage(plate, 0, 0, W, H);
    blitStates(g, scene, v);
    if (!SIGNS_BAKED) {
      wordsOnly = true;
      marks(g, scene);
      wordsOnly = false;
    }
    return;
  }
  usingPlate = false;
  if (cached) {
    const base = baseFor(scene, sc);
    if (base) {
      g.drawImage(base as CanvasImageSource, 0, 0);
      return;
    }
  }
  sc.base(g);
}

/** Paste a state plate into its box with a 6px soft edge, so the seam does not show. */
function blitStates(g: G, scene: string, v: Vis) {
  const states = PLATES[scene]?.states;
  if (!states) return;
  for (const [visual, st] of Object.entries(states)) {
    if (!v.has(visual)) continue;
    const img = stateFor(scene, visual);
    if (img) blitFeather(g, img, st.box);
  }
}

let stampB: Surface | null | undefined;
let maskB: Surface | null | undefined;

/** A canvas at the tablet's backing size (960×540), not the logical 480×270. */
function makeBacking(): Surface | null {
  try {
    if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(W * CAM_PX, H * CAM_PX);
    if (typeof document !== "undefined") {
      const el = document.createElement("canvas");
      el.width = W * CAM_PX;
      el.height = H * CAM_PX;
      return el;
    }
  } catch {
    // No canvas here.
  }
  return null;
}

/**
 * Paste a state plate into its box. The mask is built with source-over, then applied once:
 * destination-in on each edge strip would erase the strip drawn before it.
 */
function blitFeather(g: G, img: CanvasImageSource, box: [number, number, number, number]) {
  const [x, y, w, h] = box;
  if (stampB === undefined) stampB = makeBacking();
  if (maskB === undefined) maskB = makeBacking();
  const stamp = stampB;
  const mask = maskB;
  const sg = stamp?.getContext("2d") as G | null | undefined;
  const mg = mask?.getContext("2d") as G | null | undefined;
  if (!stamp || !mask || !sg || !mg) {
    g.save();
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();
    g.drawImage(img, 0, 0, W, H);
    g.restore();
    return;
  }
  const px = CAM_PX;
  const BW = W * px;
  const BH = H * px;
  sg.setTransform(1, 0, 0, 1, 0, 0);
  sg.globalCompositeOperation = "source-over";
  sg.clearRect(0, 0, BW, BH);
  sg.drawImage(img, 0, 0, BW, BH);

  mg.setTransform(1, 0, 0, 1, 0, 0);
  mg.globalCompositeOperation = "source-over";
  mg.clearRect(0, 0, BW, BH);
  const X = x * px;
  const Y = y * px;
  const Ww = w * px;
  const Hh = h * px;
  const f = 6 * px;
  const soft = "rgba(255,255,255,0)";
  if (Ww > f * 2 && Hh > f * 2) {
    mg.fillStyle = "#fff";
    mg.fillRect(X + f, Y + f, Ww - f * 2, Hh - f * 2);
  }
  mg.fillStyle = lin(mg, X, 0, X + f, 0, [[0, soft], [1, "#fff"]]);
  mg.fillRect(X, Y, Math.min(f, Ww), Hh);
  mg.fillStyle = lin(mg, X + Ww - f, 0, X + Ww, 0, [[0, "#fff"], [1, soft]]);
  mg.fillRect(X + Math.max(0, Ww - f), Y, Math.min(f, Ww), Hh);
  mg.fillStyle = lin(mg, 0, Y, 0, Y + f, [[0, soft], [1, "#fff"]]);
  mg.fillRect(X, Y, Ww, Math.min(f, Hh));
  mg.fillStyle = lin(mg, 0, Y + Hh - f, 0, Y + Hh, [[0, "#fff"], [1, soft]]);
  mg.fillRect(X, Y + Math.max(0, Hh - f), Ww, Math.min(f, Hh));

  sg.globalCompositeOperation = "destination-in";
  sg.drawImage(mask, 0, 0);
  sg.globalCompositeOperation = "source-over";
  g.drawImage(stamp, 0, 0, W, H);
}

const gradedCache = new Map<string, Surface>();

function applyGrade(g: G, look: Look) {
  const grade = GRADE[look];
  g.globalCompositeOperation = "multiply";
  g.fillStyle = grade.tint;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "screen";
  g.fillStyle = grade.lift;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "source-over";
}

/** State visuals this scene can show as a plate crop, in a stable order. */
function activeStates(scene: string, visuals: string[]): string[] {
  const states = PLATES[scene]?.states;
  if (!states) return [];
  const set = new Set(visuals.map((x) => x.split(":")[0]));
  return Object.keys(states).filter((k) => set.has(k)).sort();
}

/** Photo or code base, state crops, then the colour grade. Cached per scene and which states are on. */
function gradedStill(scene: string, sc: Scene, visuals: string[]): Surface | null {
  const plate = plateFor(scene);
  const names = plate ? activeStates(scene, visuals) : [];
  const key = plate ? `${scene}:photo:${names.join(",")}` : `${scene}:code`;
  const hit = gradedCache.get(key);
  if (hit) return hit;
  const c = makeBacking();
  const cg = c?.getContext("2d") as G | null | undefined;
  if (!c || !cg) return null;
  cg.setTransform(CAM_PX, 0, 0, CAM_PX, 0, 0);
  cg.globalAlpha = 1;
  cg.globalCompositeOperation = "source-over";
  if (plate) {
    cg.drawImage(plate, 0, 0, W, H);
    if (!SIGNS_BAKED) {
      wordsOnly = true;
      marks(cg, scene);
      wordsOnly = false;
    }
    // Crop before the grade, so the state takes the same tint as the rest of the photo.
    blitStates(cg, scene, parseVis(visuals));
  } else sc.base(cg);
  applyGrade(cg, sc.look);
  if (sc.look === "ir") {
    cg.globalCompositeOperation = "saturation";
    cg.fillStyle = "#808080";
    cg.fillRect(0, 0, W, H);
    cg.globalCompositeOperation = "overlay";
    cg.fillStyle = "rgba(170,170,170,0.22)";
    cg.fillRect(0, 0, W, H);
    cg.globalCompositeOperation = "source-over";
  }
  gradedCache.set(key, c);
  return c;
}

let lens: Surface | null | undefined;

/** Scanlines and vignette, one image for every feed. */
function lensOverlay(): Surface | null {
  if (lens !== undefined) return lens;
  const c = makeBacking();
  const og = c?.getContext("2d") as G | null | undefined;
  if (!c || !og) {
    lens = null;
    return null;
  }
  og.setTransform(CAM_PX, 0, 0, CAM_PX, 0, 0);
  og.clearRect(0, 0, W, H);
  og.fillStyle = "rgba(0,0,0,0.07)";
  for (let y = 0; y < H; y += 2) og.fillRect(0, y, W, 1);
  og.fillStyle = rad(og, W / 2, H / 2, W * 0.62, [[0.55, "rgba(0,0,0,0)"], [1, "rgba(0,0,0,0.75)"]]);
  og.fillRect(0, 0, W, H);
  lens = c;
  return c;
}

/** Drop cached frames. The audit page uses this when it turns plates on and off. */
export function resetFrameCaches() {
  gradedCache.clear();
  plateCache.clear();
  lens = undefined;
}

/**
 * Draw one camera frame. visuals: the model's layers for this camera. switching: 0..1 static while changing
 * feed. After a reactor trip the plant goes to emergency lighting: darker, with a slow red cast.
 *
 * The static picture (photo or code base, state crops, plus the colour grade) is cached. A frame draws
 * that, then the live layer, then grain, the rolling bar and one cached scanline-and-vignette overlay.
 */
export function paintCamera(g: G, scene: string, visuals: string[], t: number, opts: { switching?: number; tripped?: boolean } = {}) {
  const sc = S[scene] ?? S.corridor;
  const name = S[scene] ? scene : "corridor";
  const v = parseVis(visuals);
  g.save();
  g.globalAlpha = 1;
  g.globalCompositeOperation = "source-over";
  frameLook = sc.look;
  const still = gradedStill(name, sc, visuals);
  usingPlate = plateFor(name) !== null;
  if (still) g.drawImage(still as CanvasImageSource, 0, 0, W, H);
  else layBase(g, name, sc, v, true);
  layers(g, name, sc, v, t);
  usingPlate = false;
  if (!still) applyGrade(g, sc.look);
  if (opts.tripped) {
    g.fillStyle = "rgba(0,0,0,0.5)";
    g.fillRect(0, 0, W, H);
    g.fillStyle = `rgba(200,20,10,${0.14 + 0.06 * Math.sin(t * 2)})`;
    g.fillRect(0, 0, W, H);
  }
  // Exposure breathing, the auto-gain hunting in the dark.
  g.fillStyle = `rgba(0,0,0,${0.06 + 0.05 * Math.sin(t * 0.7)})`;
  g.fillRect(0, 0, W, H);
  const frames = noiseFrames();
  const tick = Math.floor(t * 24);
  if (frames) {
    g.globalAlpha = sc.look === "ir" ? 0.16 : 0.11;
    g.globalCompositeOperation = "overlay";
    g.save();
    g.translate((tick * 37) % 7, 0);
    g.drawImage(frames[tick % frames.length] as CanvasImageSource, 0, 0, W, H);
    g.restore();
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
  } else {
    for (let k = 0; k < 300; k++) {
      g.fillStyle = hash(k, tick) > 0.5 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
      g.fillRect(hash(k, tick + 1) * W, hash(tick + 2, k) * H, 1, 1);
    }
  }
  const bar = ((t * 22) % (H + 60)) - 30;
  g.fillStyle = lin(g, 0, bar - 20, 0, bar + 20, [[0, "rgba(255,255,255,0)"], [0.5, "rgba(255,255,255,0.035)"], [1, "rgba(255,255,255,0)"]]);
  g.fillRect(0, bar - 20, W, 40);
  const shade = lensOverlay();
  if (shade) g.drawImage(shade as CanvasImageSource, 0, 0, W, H);
  else {
    g.fillStyle = "rgba(0,0,0,0.07)";
    for (let y = 0; y < H; y += 2) g.fillRect(0, y, W, 1);
    g.fillStyle = rad(g, W / 2, H / 2, W * 0.62, [[0.55, "rgba(0,0,0,0)"], [1, "rgba(0,0,0,0.75)"]]);
    g.fillRect(0, 0, W, H);
  }
  if (opts.switching && opts.switching > 0) {
    // Feed change: torn bands and snow.
    const s = opts.switching;
    for (let k = 0; k < 10; k++) {
      const y = hash(k, Math.floor(t * 30)) * H;
      const c = hash(k, 3) > 0.5 ? 230 : 20;
      g.fillStyle = `rgba(${c},${c},${c},${0.5 * s})`;
      g.fillRect(0, y, W, 2 + hash(k, 5) * 12);
    }
    if (frames) {
      g.globalAlpha = 0.85 * s;
      g.drawImage(frames[Math.floor(t * 60) % frames.length] as CanvasImageSource, 0, 0, W, H);
      g.globalAlpha = 1;
    } else {
      g.fillStyle = `rgba(128,128,128,${0.8 * s})`;
      g.fillRect(0, 0, W, H);
    }
  }
  g.restore();
}

export const SCENE_NAMES = Object.keys(S);
