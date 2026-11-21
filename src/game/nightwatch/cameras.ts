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
 */

export const CAM_W = 480;
export const CAM_H = 270;
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
  g.fillStyle = bg;
  g.fillRect(x, y, w, h);
  g.strokeStyle = "rgba(0,0,0,0.5)";
  g.lineWidth = 1;
  g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
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

function puddle(g: G, cx: number, cy: number, r: number, t: number) {
  g.save();
  g.translate(cx, cy);
  g.scale(1, 0.22);
  // Wet floor: darker than dry concrete, with a bright rim and the ceiling lights caught in it.
  g.fillStyle = rad(g, 0, 0, r, [[0, "rgba(8,10,12,0.75)"], [0.8, "rgba(14,16,18,0.6)"], [1, "rgba(0,0,0,0)"]]);
  g.beginPath();
  g.arc(0, 0, r, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(220,230,235,0.35)";
  g.lineWidth = 3;
  g.beginPath();
  g.arc(0, 0, r * 0.82, Math.PI * 1.05, Math.PI * 1.95);
  g.stroke();
  g.globalCompositeOperation = "lighter";
  g.fillStyle = `rgba(255,250,230,${0.45 + 0.15 * Math.sin(t * 1.7)})`;
  g.fillRect(-r * 0.35, -r * 0.2, r * 0.7, r * 0.08);
  g.fillRect(-r * 0.2, r * 0.2, r * 0.4, r * 0.06);
  g.globalCompositeOperation = "source-over";
  g.restore();
  // A drip from above, landing.
  const ph = (t * 0.9) % 1;
  g.fillStyle = "rgba(220,230,240,0.8)";
  g.fillRect(cx + r * 0.1, cy - 160 + ph * 160, 1.5, 4);
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
  const [r, gr, b] = color;
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
  const step = Math.sin(t * 6) * 3 * s;
  // Torch beam on the floor ahead.
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

function oddities(g: G, t: number, v: Vis, r: Room) {
  if (v.has("chair")) {
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
  if (v.has("hardhat")) {
    const [x, y] = r.floor(-0.2, 0.25);
    const s = r.scale(0.25);
    g.fillStyle = "#e8c21a";
    g.beginPath();
    g.ellipse(x, y - 4 * s, 12 * s, 9 * s, 0, Math.PI, 0);
    g.fill();
    g.fillRect(x - 15 * s, y - 4 * s, 30 * s, 3 * s);
  }
  if (v.has("flicker")) {
    const off = hash(Math.floor(t * 9), 11) > 0.62 || Math.sin(t * 31) > 0.85;
    if (off) {
      g.fillStyle = "rgba(0,0,0,0.38)";
      g.fillRect(0, 0, W, H);
    }
  }
}

/* ---------------------------------------------------------------- equipment */

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
  if (running) {
    const ph = (t * 25) % 1;
    g.fillStyle = "rgba(255,255,255,0.18)";
    g.fillRect(cx - 12 * s + ph * 24 * s, top + mh + 2 * s, 3 * s, 18 * s);
  }
  vCyl(g, cx - mw * 0.6, top + mh + 22 * s, mw * 1.2, 58 * s, "#25282b", "#5b6266", "#a3aaae");
  hPipe(g, cx - 160 * s, floorY - 50 * s, 120 * s, 30 * s);
  hPipe(g, cx + 40 * s, floorY - 50 * s, 120 * s, 30 * s);
  flange(g, cx - 46 * s, floorY - 54 * s, 8 * s, 38 * s);
  flange(g, cx + 38 * s, floorY - 54 * s, 8 * s, 38 * s);
}

/* ---------------------------------------------------------------- scenes */

const S: Record<string, Scene> = {
  containment: {
    look: "fluor",
    base(g) {
      room(g, { backW: 0.5, backH: 0.5, vy: 0.45, wallLow: "#4d5357", wallHigh: "#5e6569", ceiling: "#3c4144", floor: "#3a3d3f", floorLine: "rgba(0,0,0,0.3)", floorKind: "grating", lights: [0.2, 0.6] });
      // Polar crane girder.
      hPipe(g, 0, 14, W, 10, "#3b2a10", "#a7781c", "#e2b63a");
      sign(g, 32, 70, 54, 30, "#e8c21a", "#6b1f6b", ["CAUTION", "HIGH RAD", "AREA"]);
      trefoil(g, 59, 112, 8);
    },
    live(g, t, v) {
      pumpSet(g, W / 2, H - 28, 0.95, true, t);
      if (v.has("puddle")) {
        puddle(g, W / 2, H - 16, 90, t);
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
      sign(g, 40, 90, 58, 26, "#ffffff", "#c0392b", ["DANGER", "HOT SURFACES"]);
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
      sign(g, 360, 54, 70, 46, "#ececec", "#111", ["MAIN STEAM", "LINE RAD", "MONITOR"]);
      trefoil(g, 395, 40, 7);
    },
    live(g, t, v) {
      // The monitor's display: green normal, red with the reading high.
      const hi = v.has("beacon");
      g.fillStyle = hi ? `rgba(230,40,30,${0.6 + 0.4 * Math.sin(t * 6)})` : "rgba(60,200,90,0.85)";
      g.fillRect(372, 102, 46, 8);
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
      pumpSet(g, W / 2, H - 24, 0.9, true, t);
      if (v.has("puddle")) {
        puddle(g, W / 2, H - 12, 100, t);
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
      trefoil(g, W / 2, 86, 6);
    },
    live(g, t, v) {
      if (v.has("beacon")) beacon(g, W / 2, 70, t);
      if (v.has("condensate"))
        for (let k = 0; k < 4; k++) {
          g.fillStyle = "rgba(200,220,230,0.7)";
          g.fillRect(120 + k * 70, 120 + ((t * 60 + k * 37) % 120), 1, 3);
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
      const dx = v.has("shake") ? Math.sin(t * 80) * 2 : 0;
      vCyl(g, 70 + dx, 110, 130, 120, "#1f3327", "#3d6a4d", "#7fae8d");
      vCyl(g, 120 + dx, 150, 30, 30, "#141618", "#3c4043", "#7b8186");
      hPipe(g, 200, 150, 90, 24);
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
      g.fillStyle = jam ? `rgba(230,40,30,${0.6 + 0.4 * Math.sin(t * 6)})` : "rgba(60,200,90,0.85)";
      g.fillRect(100, 150, 50, 8);
      if (jam) beacon(g, 125, 104, t);
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
      // Trace heaters glow along the salt line; one zone out.
      for (let x = 92; x < 388; x += 6) {
        const dead = v.has("heaterDark") && x > 220 && x < 300;
        g.fillStyle = dead ? "rgba(40,30,20,0.9)" : `rgba(255,${Math.round(110 + 30 * Math.sin(t + x))},40,0.8)`;
        g.fillRect(x, 160, 3, 2);
      }
      if (v.has("shadow")) {
        g.fillStyle = "rgba(0,0,0,0.35)";
        g.fillRect(300, 50, 4, 60);
        g.fillRect(288, 106, 28, 10);
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
      sign(g, 60, 80, 80, 34, "#ffffff", "#111", ["FREEZE VALVE", "FV-103"]);
    },
    live(g, t, v) {
      if (!v.has("frostGone"))
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
      trefoil(g, 440, 90, 8);
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
      sign(g, 20, 40, 40, 18, "#0f6b2f", "#fff", ["EXIT"]);
    },
    live(g, t, v) {
      // Feed pumps A (left) and B (right) in the foreground.
      pumpSet(g, 70, H - 6, 0.55, true, t);
      pumpSet(g, 410, H - 6, 0.55, !v.has("pumpStopped"), t);
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
      sign(g, 386, 94, 58, 46, "#e8c21a", "#6b1f6b", ["LOCKED HIGH", "RADIATION", "AREA"]);
      trefoil(g, 415, 158, 9);
    },
    live(g, t, v) {
      if (v.has("doorAjar")) {
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
      if (v.has("puddle")) puddle(g, 200, H - 26, 80, t);
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
      // Exposed liner where the level dropped.
      if (low) {
        g.fillStyle = lin(g, 0, 100, 0, 122, [[0, "#8a9196"], [1, "#4b5155"]]);
        g.fillRect(14, 106, W - 28, 16);
      }
      g.fillStyle = lin(g, 0, top, 0, H, [[0, "#1d4f6b"], [0.5, "#0f3048"], [1, "#081b2a"]]);
      g.fillRect(14, top, W - 28, H - top);
      // Racks on the bottom, glowing Cherenkov blue.
      for (let x = 40; x < W - 40; x += 22) {
        g.fillStyle = "#0b1822";
        g.fillRect(x, 196, 18, 60);
        g.globalCompositeOperation = "lighter";
        g.fillStyle = rad(g, x + 9, 226, 26, [[0, `rgba(80,160,255,${0.55 + 0.1 * Math.sin(t * 1.1 + x)})`], [1, "rgba(0,0,0,0)"]]);
        g.fillRect(x - 20, 190, 58, 70);
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
        g.strokeStyle = "rgba(220,240,255,0.35)";
        g.lineWidth = 1;
        for (let k = 1; k < 4; k++) {
          g.beginPath();
          g.ellipse(rx, top + 8, ((t * 10 + k * 12) % 40) + 4, 3, 0, 0, Math.PI * 2);
          g.stroke();
        }
      }
      if (v.has("toolBag")) {
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
      if (v.has("arc") && hash(Math.floor(t * 14), 7) > 0.6) {
        g.globalCompositeOperation = "lighter";
        g.fillStyle = rad(g, 278, 62, 90, [[0, "rgba(200,220,255,0.9)"], [0.2, "rgba(160,190,255,0.4)"], [1, "rgba(0,0,0,0)"]]);
        g.fillRect(180, 0, 200, 160);
        g.globalCompositeOperation = "source-over";
      }
      if (v.has("fog") || v.has("arc")) {
        for (let k = 0; k < 8; k++) {
          const x = ((t * 6 + k * 90) % (W + 200)) - 100;
          g.fillStyle = rad(g, x, 150 + k * 6, 110, [[0, "rgba(160,150,130,0.16)"], [1, "rgba(0,0,0,0)"]]);
          g.fillRect(x - 110, 40, 220, 220);
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
        for (const x of [80, 210, 340])
          for (let k = 0; k < 14; k++) {
            g.fillStyle = "rgba(40,32,20,0.9)";
            g.fillRect(x + 6 + hash(k, x) * 52, 120 + hash(x, k) * 90, 5, 3);
          }
        beacon(g, 450, 30, t, [240, 190, 40]);
      }
      if (v.has("gull")) {
        const gx = ((t * 30) % (W + 60)) - 30;
        g.fillStyle = "#d8d8d0";
        g.beginPath();
        g.moveTo(gx - 10, 50 + Math.sin(t * 8) * 3);
        g.lineTo(gx, 54);
        g.lineTo(gx + 10, 50 + Math.sin(t * 8) * 3);
        g.lineTo(gx, 56);
        g.fill();
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
    const c = makeCanvas();
    const g = c?.getContext("2d") as G | null | undefined;
    if (!c || !g) return null;
    const img = g.createImageData(W, H);
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
  yard: { y: 200, s: 0.45 },
  intake: { y: 112, s: 0.45 },
  cell: { y: 236, s: 0 },
};

/**
 * Draw one camera frame. visuals: the model's layers for this camera. switching: 0..1 static while changing
 * feed. After a reactor trip the plant goes to emergency lighting: darker, with a slow red cast.
 */
export function paintCamera(g: G, scene: string, visuals: string[], t: number, opts: { switching?: number; tripped?: boolean } = {}) {
  const sc = S[scene] ?? S.corridor;
  const v = parseVis(visuals);
  g.save();
  g.globalAlpha = 1;
  g.globalCompositeOperation = "source-over";
  const base = baseFor(scene, sc);
  if (base) g.drawImage(base as CanvasImageSource, 0, 0);
  else sc.base(g);
  sc.live(g, t, v);
  // The rover walks through (the shielding window has nobody behind it).
  const rv = v.at("rover");
  const walk = WALK[scene];
  if (rv !== null && walk && walk.s > 0) rover(g, rv, t, walk.y, walk.s);
  oddities(g, t, v, GENERIC);
  if (opts.tripped) {
    g.fillStyle = "rgba(0,0,0,0.5)";
    g.fillRect(0, 0, W, H);
    g.fillStyle = `rgba(200,20,10,${0.14 + 0.06 * Math.sin(t * 2)})`;
    g.fillRect(0, 0, W, H);
  }
  // Camera pass: grade, infrared black and white, lens, grain, scan.
  const grade = GRADE[sc.look];
  g.globalCompositeOperation = "multiply";
  g.fillStyle = grade.tint;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "screen";
  g.fillStyle = grade.lift;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "source-over";
  if (grade.mono && typeof g.filter === "string" && g.canvas) {
    g.filter = "grayscale(1) contrast(1.15) brightness(1.05)";
    g.drawImage(g.canvas as CanvasImageSource, 0, 0);
    g.filter = "none";
  }
  // Exposure breathing, the auto-gain hunting in the dark.
  g.fillStyle = `rgba(0,0,0,${0.06 + 0.05 * Math.sin(t * 0.7)})`;
  g.fillRect(0, 0, W, H);
  const frames = noiseFrames();
  const tick = Math.floor(t * 24);
  if (frames) {
    g.globalAlpha = sc.look === "ir" ? 0.16 : 0.11;
    g.globalCompositeOperation = "overlay";
    g.drawImage(frames[tick % frames.length] as CanvasImageSource, (tick * 37) % 7, 0);
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
  } else {
    for (let k = 0; k < 300; k++) {
      g.fillStyle = hash(k, tick) > 0.5 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
      g.fillRect(hash(k, tick + 1) * W, hash(tick + 2, k) * H, 1, 1);
    }
  }
  g.fillStyle = "rgba(0,0,0,0.07)";
  for (let y = 0; y < H; y += 2) g.fillRect(0, y, W, 1);
  const bar = ((t * 22) % (H + 60)) - 30;
  g.fillStyle = lin(g, 0, bar - 20, 0, bar + 20, [[0, "rgba(255,255,255,0)"], [0.5, "rgba(255,255,255,0.035)"], [1, "rgba(255,255,255,0)"]]);
  g.fillRect(0, bar - 20, W, 40);
  g.fillStyle = rad(g, W / 2, H / 2, W * 0.62, [[0.55, "rgba(0,0,0,0)"], [1, "rgba(0,0,0,0.75)"]]);
  g.fillRect(0, 0, W, H);
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
      g.drawImage(frames[Math.floor(t * 60) % frames.length] as CanvasImageSource, 0, 0);
      g.globalAlpha = 1;
    } else {
      g.fillStyle = `rgba(128,128,128,${0.8 * s})`;
      g.fillRect(0, 0, W, H);
    }
  }
  g.restore();
}

export const SCENE_NAMES = Object.keys(S);
