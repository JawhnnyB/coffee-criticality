/**
 * CORE CAM drawing on the 160 × 96 native grid. Spec 6.1 (geometry) and 6.4 (edge cases).
 *
 * Rules this file keeps:
 * - Hard pixel edges. Every shape is a fillRect on whole pixels. No arcs, no antialiasing.
 * - Palette only. The fixed colours are the tokens from STYLE-STANDARD §3–4 and GROK_PHASES 2.2.
 *   The glow is the one interpolated ramp (steel, gold, copper, cream). See glowColor in reactorReadout.ts.
 * - No text. Labels are HTML, in ReactorApps.tsx.
 * - Pure: takes a Pen (a small subset of CanvasRenderingContext2D), so the tests can record the calls.
 */
import type { PlantType } from "./plant";
import type { FlowDot } from "./reactorReadout";

export const CAM_W = 160;
export const CAM_H = 96;

/** Fixed colours. Every one is a listed token. */
export const COL = {
  screen: "#1c1410", // §3 bezel screen
  ink: "#16110d", // ink token
  steel: "#3d5c66", // steel token, cold
  graphite: "#4e5560", // §4 graphite
  gold: "#c9a227", // gold token
  copper: "#c4783a", // copper token
  cream: "#f3e6d0", // cream token
  steam: "#f4ecd8", // §4 steam cream, phase by dots
  helium: "#d4cce6", // §4 helium, stipple for gas
  wood: "#6a4a32", // wood token
} as const;

/** The subset of the canvas API the drawing uses. */
export interface Pen {
  fillStyle: string | CanvasGradient | CanvasPattern;
  imageSmoothingEnabled: boolean;
  fillRect(x: number, y: number, w: number, h: number): void;
}

export type CamKind = "rod" | "assembly" | "core";

export interface CamScene {
  type: PlantType;
  kind: CamKind;
  /** Assemblies or pebbles drawn. From cellCount. */
  cells: number;
  /** Fuel glow colour, from glowColor. */
  glow: string;
  /** Frame colour: steel when scrammed or low, gold in band, copper high. */
  edge: string;
  dots: readonly FlowDot[];
  /** BWR steam bubbles. Empty for every other type. */
  bubbles: readonly FlowDot[];
}

/** Integer scale for a window width. At least 1, at most 4. The canvas is never scaled by a fraction. */
export function camScale(width: number): number {
  if (!Number.isFinite(width)) return 1;
  return Math.max(1, Math.min(4, Math.floor(width / CAM_W)));
}

/** Pixel span of a filled circle on the native grid. Each row is one fillRect. */
function circleRows(cx: number, cy: number, r: number): { y: number; x0: number; x1: number }[] {
  const rows: { y: number; x0: number; x1: number }[] = [];
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)));
    rows.push({ y: cy + dy, x0: cx - half, x1: cx + half });
  }
  return rows;
}

function fillCircle(g: Pen, cx: number, cy: number, r: number, fill: string, edge: string) {
  for (const row of circleRows(cx, cy, r)) {
    g.fillStyle = fill;
    g.fillRect(row.x0, row.y, row.x1 - row.x0 + 1, 1);
    g.fillStyle = edge;
    g.fillRect(row.x0, row.y, 1, 1);
    g.fillRect(row.x1, row.y, 1, 1);
  }
}

/** Rod (§6.1): cladding, gap, pellets, centre line. Pellets are stacked segments. */
function drawRod(g: Pen, glow: string) {
  g.fillStyle = COL.graphite;
  g.fillRect(72, 14, 16, 68); // cladding
  g.fillStyle = COL.screen;
  g.fillRect(73, 15, 14, 66); // gap between cladding and pellets
  for (let i = 0; i < 8; i++) {
    g.fillStyle = glow;
    g.fillRect(74, 16 + i * 7, 12, 6); // pellets, 1 px gap between them
  }
  g.fillStyle = COL.ink;
  g.fillRect(80, 14, 1, 68); // centre line
}

/** Assembly (§6.1): pin lattice, spacers, guide tubes. n is 4, 6 or 8 from the cell count. */
function drawAssembly(g: Pen, cells: number, glow: string) {
  const n = Math.max(2, Math.round(Math.sqrt(cells)));
  const pitch = Math.max(3, Math.floor(60 / n));
  const size = n * pitch;
  const x0 = 80 - Math.floor(size / 2);
  const y0 = 18 + Math.floor((60 - size) / 2);
  g.fillStyle = COL.graphite;
  g.fillRect(x0 - 2, y0 - 2, size + 4, size + 4); // channel wall
  g.fillStyle = COL.screen;
  g.fillRect(x0 - 1, y0 - 1, size + 2, size + 2);
  const mid = Math.floor(n / 2);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const px = x0 + c * pitch + 1;
      const py = y0 + r * pitch + 1;
      const pw = pitch - 2;
      const guide = (r === mid - 1 || r === mid) && (c === mid - 1 || c === mid);
      g.fillStyle = guide ? COL.graphite : glow; // guide tubes are steel-walled, fuel pins glow
      g.fillRect(px, py, pw, pitch - 2);
    }
  }
  // Spacer grids: two bars across the lattice, one third and two thirds of the way down.
  g.fillStyle = COL.steel;
  for (const k of [1, 2]) {
    const sy = y0 + Math.round((size * k) / 3);
    g.fillRect(x0 - 2, sy, size + 4, 1);
  }
}

/** Core cells (§6.1): the grid of assemblies. A full core is a larger grid; the window is 3×3. */
function drawCore(g: Pen, type: PlantType, cells: number, glow: string) {
  const cols = Math.ceil(Math.sqrt(cells));
  const rows = Math.ceil(cells / cols);
  const cw = Math.floor(120 / cols);
  const ch = Math.floor(60 / rows);
  for (let i = 0; i < cells; i++) {
    const x = 18 + (i % cols) * cw;
    const y = 16 + Math.floor(i / cols) * ch;
    const w = Math.max(2, cw - 2);
    const h = Math.max(2, ch - 2);
    g.fillStyle = COL.graphite;
    g.fillRect(x, y, w, h);
    if (type === "msr") {
      g.fillStyle = glow;
      g.fillRect(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 2));
    } else {
      g.fillStyle = COL.screen;
      g.fillRect(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 2));
      g.fillStyle = glow;
      g.fillRect(x + 2, y + 1, Math.max(1, w - 4), Math.max(1, h - 2));
    }
  }
}

/** Pebble bed (§6.1): packed circles with helium stipple between them. */
function drawPebbles(g: Pen, cells: number, glow: string) {
  const cols = Math.ceil(Math.sqrt(cells));
  const rows = Math.ceil(cells / cols);
  const px = Math.floor(120 / (cols + 0.5));
  const py = Math.floor(60 / rows);
  const r = Math.max(1, Math.floor(Math.min(px, py) / 2) - 1);
  const circles: { x: number; y: number }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let c = 0; c < cols; c++) {
      const i = row * cols + c;
      if (i >= cells) break;
      const offset = row % 2 ? Math.floor(px / 2) : 0;
      circles.push({ x: 18 + c * px + offset + Math.floor(px / 2), y: 16 + row * py + Math.floor(py / 2) });
    }
  }
  g.fillStyle = COL.screen;
  g.fillRect(16, 14, 124, 64);
  // Helium between pebbles: a stipple every third pixel, skipping pixels inside a pebble.
  g.fillStyle = COL.helium;
  for (let y = 16; y <= 76; y += 3) {
    for (let x = 18; x <= 138; x += 3) {
      if (circles.some((p) => (x - p.x) ** 2 + (y - p.y) ** 2 <= r * r)) continue;
      g.fillRect(x, y, 1, 1);
    }
  }
  for (const p of circles) fillCircle(g, p.x, p.y, r, glow, COL.steel);
}

/** Flow arrows (§4: every pipe has direction arrows). Down on the downcomer (left), up through the core (right). */
function drawArrow(g: Pen, x: number, y: number, up: boolean) {
  g.fillStyle = COL.cream;
  if (up) {
    g.fillRect(x + 2, y, 1, 1);
    g.fillRect(x + 1, y + 1, 3, 1);
    g.fillRect(x, y + 2, 5, 1);
    g.fillRect(x + 2, y + 3, 1, 4);
  } else {
    g.fillRect(x + 2, y, 1, 4);
    g.fillRect(x, y + 4, 5, 1);
    g.fillRect(x + 1, y + 5, 3, 1);
    g.fillRect(x + 2, y + 6, 1, 1);
  }
}

/** Frame (§5: outline on every object). The screen fill is the bezel token. */
function drawFrame(g: Pen, edge: string) {
  g.fillStyle = COL.screen;
  g.fillRect(0, 0, CAM_W, CAM_H);
  g.fillStyle = edge;
  g.fillRect(8, 8, 144, 80);
  g.fillStyle = COL.screen;
  g.fillRect(10, 10, 140, 76);
}

function drawDots(g: Pen, dots: readonly FlowDot[]) {
  g.fillStyle = COL.cream;
  // Dots move in fractions of a pixel. Round them to the grid so every edge stays hard.
  for (const p of dots) g.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
}

/** Draws one CORE CAM frame. Same inputs, same pixels: the snapshot test depends on that. */
export function drawCamScene(g: Pen, sc: CamScene): void {
  g.imageSmoothingEnabled = false;
  drawFrame(g, sc.edge);
  if (sc.kind === "rod") drawRod(g, sc.glow);
  else if (sc.kind === "assembly") drawAssembly(g, sc.cells, sc.glow);
  else if (sc.type === "pebble") drawPebbles(g, sc.cells, sc.glow);
  else drawCore(g, sc.type, sc.cells, sc.glow);
  if (sc.kind === "core" && (sc.type === "pwr" || sc.type === "msr")) {
    for (const y of [24, 56]) {
      drawArrow(g, 12, y, false); // downcomer, down
      drawArrow(g, 141, y, true); // core, up
    }
  }
  if (sc.type === "bwr") {
    g.fillStyle = COL.steam;
    for (const b of sc.bubbles) g.fillRect(Math.round(b.x), Math.round(b.y), 2, 2);
  }
  drawDots(g, sc.dots);
}
