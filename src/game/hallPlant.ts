import { PAL } from "./palette";
import type { CutawayKind, PlantDrawing } from "./plantLoops";

/**
 * The reactor hall, seen from the operating floor, drawn for the site's reactor type.
 * Room pixels, top-down, the same footprint as the old vessel stamp, so collision does not change.
 *
 * What a visitor would see on a real refuelling or operating floor:
 * - PWR: the vessel head with its forest of control rod drive housings and the closure studs.
 * - BWR: a smooth head with no drives on top (the rods come in from below), and the main steam lines.
 * - Pebble bed: a slender vessel, a ring of rod drives in the reflector, the fuel loading tube.
 * - Salt: the reactor cell roofed with concrete plugs; one plug is off over the pump bowl.
 * The pipes are lagged in reflective metal insulation, with a colour band and flow arrows,
 * the way plant piping is labelled.
 */

export interface HallState {
  kind: CutawayKind;
  /** 0 to 1. How bright the core glows through the viewing port. 0: no glow. */
  glow: number;
  /** 0 to 1.6. How fast the arrows move on the pipes. */
  flow: number;
  /** The salt or pebble core is hot: drawn warm in the port. */
  hot: boolean;
}

type G = CanvasRenderingContext2D;

const fill = (g: G, x: number, y: number, w: number, h: number, c: string) => {
  if (w <= 0 || h <= 0) return;
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

const disc = (g: G, cx: number, cy: number, r: number, c: string) => {
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)));
    fill(g, cx - half, cy + dy, half * 2 + 1, 1, c);
  }
};

/** A shaded dome seen from above: lit from the upper left. */
function dome(g: G, cx: number, cy: number, r: number) {
  disc(g, cx, cy, r + 1, PAL.outline);
  disc(g, cx, cy, r, PAL.steelD);
  disc(g, cx - 2, cy - 2, r - 3, PAL.steel);
  disc(g, cx - 5, cy - 5, Math.max(2, Math.round(r * 0.45)), PAL.steelL);
}

const hash = (a: number, b: number) => {
  let n = (a * 374761393 + b * 668265263) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return (((n ^ (n >>> 16)) >>> 0) % 1000) / 1000;
};

/**
 * The radiation symbol: an ink hub and three ink blades on gold, inside an ink ring.
 * Blades point down, upper left and upper right, 60 degrees wide each, as on a real sign.
 */
export function trefoil(g: G, cx: number, cy: number) {
  const R = 5;
  for (let dy = -R; dy <= R; dy++) {
    for (let dx = -R; dx <= R; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > R + 0.4) continue;
      let c: string = PAL.gold;
      if (d > R - 0.6) c = PAL.outline;
      else if (d <= 1.1) c = PAL.outline;
      else if (d >= 1.9 && d <= R - 1) {
        const a = (Math.atan2(dy, dx) * 180) / Math.PI;
        const near = (deg: number) => Math.abs(((a - deg + 540) % 360) - 180) <= 30;
        if (near(90) || near(-150) || near(-30)) c = PAL.outline;
      }
      fill(g, cx + dx, cy + dy, 1, 1, c);
    }
  }
}

/** The view through the port: Cherenkov blue for a water core, warm for gas or salt. */
function port(g: G, cx: number, cy: number, r: number, st: HallState, t: number) {
  disc(g, cx, cy, r + 2, PAL.outline);
  disc(g, cx, cy, r + 1, PAL.steelL);
  const salt = st.kind === "msr" || st.kind === "msfr";
  const gas = st.kind === "pebble";
  if (st.glow > 0) {
    disc(g, cx, cy, r, st.glow < 0.4 ? PAL.cherenkovD : PAL.cherenkov);
    const tick = Math.floor(t * 6);
    for (let i = 0; i < Math.round(r * r * 0.5 * st.glow); i++) {
      const a = hash(i, tick % 7) * Math.PI * 2;
      const d = Math.sqrt(hash(i + 31, tick % 5)) * (r - 1);
      fill(g, cx + Math.round(Math.cos(a) * d), cy + Math.round(Math.sin(a) * d), 1, 1, PAL.cherenkovL);
    }
  } else if (salt) {
    disc(g, cx, cy, r, st.hot ? PAL.gold : PAL.goldD);
    for (let i = 0; i < r * 2; i++) {
      const a = hash(i, 3) * Math.PI * 2 + t * 0.6;
      const d = hash(i, 5) * (r - 1);
      fill(g, cx + Math.round(Math.cos(a) * d), cy + Math.round(Math.sin(a) * d), 1, 1, PAL.goldL);
    }
  } else if (gas) {
    // A pebble bed seen through a sight glass: hot pebbles, no blue in helium.
    disc(g, cx, cy, r, PAL.woodDark);
    for (let y = -r + 1; y < r; y += 2) for (let x = -r + 1 + ((y + r) % 4 === 0 ? 1 : 0); x < r; x += 2) {
      if (x * x + y * y < (r - 1) * (r - 1)) fill(g, cx + x, cy + y, 1, 1, st.hot ? PAL.copper : PAL.wood);
    }
  } else {
    disc(g, cx, cy, r, PAL.steelD);
  }
  fill(g, cx - Math.round(r / 2), cy - Math.round(r / 2), 2, 1, PAL.white);
}

/** Yellow and ink stripes: the edge of the cavity, where you do not step. */
function hazardRing(g: G, x: number, y: number, w: number, h: number) {
  for (let i = 0; i < w; i++) {
    const c = (i >> 2) % 2 === 0 ? PAL.gold : PAL.outline;
    fill(g, x + i, y, 1, 2, c);
    fill(g, x + i, y + h - 2, 1, 2, c);
  }
  for (let i = 0; i < h; i++) {
    const c = (i >> 2) % 2 === 0 ? PAL.gold : PAL.outline;
    fill(g, x, y + i, 2, 1, c);
    fill(g, x + w - 2, y + i, 2, 1, c);
  }
}

/** The centrepiece, in the old vessel stamp's box. */
export function drawHallReactor(g: G, box: { x: number; y: number; w: number; h: number }, st: HallState, t: number) {
  const { x, y, w, h } = box;
  const cx = x + Math.floor(w / 2);
  const cy = y + Math.floor(h / 2) - 4;
  // Shadow under the cavity rim, then the concrete rim with its hazard edge.
  fill(g, x + 3, y + h - 8, w - 4, 6, "rgba(22,17,13,0.25)");
  fill(g, x, y + 2, w, h - 10, PAL.outline);
  fill(g, x + 1, y + 3, w - 2, h - 12, PAL.ash);
  for (let i = 0; i < 40; i++) fill(g, x + 2 + Math.floor(hash(i, 9) * (w - 4)), y + 4 + Math.floor(hash(i, 11) * (h - 16)), 1, 1, PAL.muted);
  hazardRing(g, x + 2, y + 4, w - 4, h - 14);

  if (st.kind === "msr" || st.kind === "msfr") {
    // The reactor cell roof: removable concrete plugs. One is off, over the pump bowl.
    for (let py = y + 8; py < y + h - 16; py += 12) {
      for (let px = x + 6; px < x + w - 8; px += 18) {
        fill(g, px, py, 17, 11, PAL.outline);
        fill(g, px + 1, py + 1, 15, 9, PAL.creamD);
        fill(g, px + 1, py + 1, 15, 2, PAL.cream);
        fill(g, px + 7, py + 4, 3, 2, PAL.gold);
      }
    }
    fill(g, cx - 12, cy - 10, 25, 20, PAL.outline);
    fill(g, cx - 11, cy - 9, 23, 18, PAL.ink);
    disc(g, cx, cy, 8, PAL.steel);
    port(g, cx, cy, 5, st, t);
    // The freeze valve hatch, with its cooling air lines.
    fill(g, x + 8, y + h - 24, 12, 8, PAL.outline);
    fill(g, x + 9, y + h - 23, 10, 6, PAL.sky);
    fill(g, x + 11, y + h - 21, 6, 2, PAL.white);
    trefoil(g, x + w - 12, y + h - 20);
    return;
  }

  if (st.kind === "pebble") {
    // A tall, narrow vessel: its head is small from above. Rod drives sit in the reflector ring.
    dome(g, cx, cy, 20);
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      const rx = cx + Math.round(Math.cos(a) * 15);
      const ry = cy + Math.round(Math.sin(a) * 15);
      fill(g, rx - 1, ry - 1, 3, 3, PAL.outline);
      fill(g, rx - 1, ry - 1, 2, 2, PAL.steelL);
    }
    // The fuel loading tube comes down to the centre, with a pebble on its way.
    fill(g, cx - 2, y + 4, 5, cy - y - 6, PAL.outline);
    fill(g, cx - 1, y + 4, 3, cy - y - 6, PAL.steelL);
    const py = y + 6 + Math.floor((t * 6) % Math.max(1, cy - y - 14));
    fill(g, cx - 1, py, 3, 3, PAL.ink);
    port(g, cx, cy, 6, st, t);
    trefoil(g, x + 10, y + h - 20);
    return;
  }

  // Water reactors: the vessel head on its flange, with the closure studs around the rim.
  dome(g, cx, cy, 30);
  for (let k = 0; k < 28; k++) {
    const a = (k / 28) * Math.PI * 2;
    fill(g, cx + Math.round(Math.cos(a) * 28), cy + Math.round(Math.sin(a) * 28), 2, 2, PAL.gold);
  }
  if (st.kind === "pwr") {
    // The CRDM forest: a grid of drive housings inside the cooling shroud.
    disc(g, cx, cy, 21, PAL.outline);
    disc(g, cx, cy, 20, PAL.steelD);
    for (let gy = -18; gy <= 18; gy += 5) {
      for (let gx = -18; gx <= 18; gx += 5) {
        if (gx * gx + gy * gy > 17 * 17) continue;
        if (gx * gx + gy * gy < 8 * 8) continue;
        fill(g, cx + gx - 1, cy + gy - 1, 3, 3, PAL.outline);
        fill(g, cx + gx - 1, cy + gy - 1, 2, 2, PAL.steelL);
      }
    }
  } else {
    // BWR: no drives on top. Four lifting lugs and the head vent.
    for (const [dx, dy] of [[-16, -16], [16, -16], [-16, 16], [16, 16]]) {
      fill(g, cx + dx - 2, cy + dy - 2, 5, 5, PAL.outline);
      fill(g, cx + dx - 1, cy + dy - 1, 3, 3, PAL.gold);
    }
    fill(g, cx + 10, cy - 4, 4, 3, PAL.outline);
  }
  port(g, cx, cy, 6, st, t);
  trefoil(g, x + 10, y + h - 20);
}

/** What a pipe in the hall carries, for its band colour. */
export type HallPipe = "hot" | "cold" | "steam" | "salt" | "helium";

/**
 * An insulated pipe: a silver jacket with seams, a colour band, and flow arrows moving the way
 * the fluid goes. dir: +1 runs left to right (or down), -1 the other way.
 */
export function drawLaggedPipe(g: G, x: number, y: number, w: number, h: number, carries: HallPipe, dir: 1 | -1, flow: number, t: number) {
  const across = w >= h;
  fill(g, x, y, w, h, PAL.outline);
  fill(g, x + 1, y + 1, w - 2, h - 2, PAL.creamD);
  if (across) {
    fill(g, x + 1, y + 1, w - 2, 2, PAL.white);
    fill(g, x + 1, y + h - 3, w - 2, 2, PAL.ash);
    for (let i = x + 6; i < x + w - 2; i += 8) fill(g, i, y + 1, 1, h - 2, PAL.ash);
  } else {
    fill(g, x + 1, y + 1, 2, h - 2, PAL.white);
    fill(g, x + w - 3, y + 1, 2, h - 2, PAL.ash);
    for (let i = y + 6; i < y + h - 2; i += 8) fill(g, x + 1, i, w - 2, 1, PAL.ash);
  }
  const band = carries === "hot" ? PAL.copper : carries === "cold" ? PAL.sky : carries === "steam" ? PAL.white : carries === "salt" ? PAL.gold : PAL.copperL;
  // The colour band, and arrows riding on it.
  if (across) {
    const by = y + Math.floor(h / 2) - 1;
    fill(g, x + 1, by, w - 2, 3, band);
    if (carries === "steam") fill(g, x + 1, by + 1, w - 2, 1, PAL.ash);
    if (flow > 0.01) {
      const off = Math.floor(t * 10 * flow) % 10;
      for (let i = 4 + (dir > 0 ? off : 9 - off); i < w - 4; i += 10) {
        const ax = x + i;
        fill(g, ax, by + 1, 1, 1, PAL.outline);
        fill(g, ax - dir, by, 1, 3, PAL.outline);
      }
    }
  } else {
    const bx = x + Math.floor(w / 2) - 1;
    fill(g, bx, y + 1, 3, h - 2, band);
    if (carries === "steam") fill(g, bx + 1, y + 1, 1, h - 2, PAL.ash);
    if (flow > 0.01) {
      const off = Math.floor(t * 10 * flow) % 10;
      for (let i = 4 + (dir > 0 ? off : 9 - off); i < h - 4; i += 10) {
        const ay = y + i;
        fill(g, bx + 1, ay, 1, 1, PAL.outline);
        fill(g, bx, ay - dir, 3, 1, PAL.outline);
      }
    }
  }
  // Salt lines are kept molten by heater tape wound on the pipe.
  if (carries === "salt") {
    if (across) for (let i = x + 3; i < x + w - 3; i += 4) fill(g, i, y + 1, 1, h - 2, PAL.copperD);
    else for (let i = y + 3; i < y + h - 3; i += 4) fill(g, x + 1, i, w - 2, 1, PAL.copperD);
  }
}

/** The two hall pipes, named and banded for what each plant carries. */
export const HALL_PIPES: Record<"pwr" | "bwr" | "pebble" | "msr", { out: HallPipe; back: HallPipe; outName: string; backName: string }> = {
  pwr: { out: "hot", back: "cold", outName: "Hot leg", backName: "Cold leg" },
  bwr: { out: "steam", back: "cold", outName: "Main steam", backName: "Feedwater" },
  pebble: { out: "helium", back: "cold", outName: "Hot gas duct", backName: "Cold helium" },
  msr: { out: "salt", back: "salt", outName: "Fuel salt out", backName: "Fuel salt return" },
};

/**
 * The control room mimic: the site's loops drawn small on the wall panel, from plantLoops.
 * Hot lines copper, cold lines sky, steam white. Pumps light green while they run.
 * The core lamp is blue for a water core that glows, warm for gas or salt, dark when shut down.
 */
export function drawMimic(g: G, box: { x: number; y: number; w: number; h: number }, plant: PlantDrawing, st: HallState, t: number) {
  const { x, y, w, h } = box;
  fill(g, x, y, w, h, PAL.outline);
  fill(g, x + 1, y + 1, w - 2, h - 2, PAL.leafD);
  const sx = (w - 4) / 320;
  const sy = (h - 4) / 180;
  const X = (v: number) => x + 2 + Math.round(v * sx);
  const Y = (v: number) => y + 2 + Math.round(v * sy);
  const line = (pts: [number, number][], c: string) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [a, b] = [pts[i], pts[i + 1]];
      const x0 = Math.min(X(a[0]), X(b[0]));
      const y0 = Math.min(Y(a[1]), Y(b[1]));
      fill(g, x0, y0, Math.abs(X(b[0]) - X(a[0])) + 1, Math.abs(Y(b[1]) - Y(a[1])) + 1, c);
    }
  };
  for (const q of plant.pipes) {
    const c = q.temp === "steam" ? PAL.white : q.temp === "hot" && st.hot ? PAL.copperL : PAL.sky;
    line(q.pts, c);
  }
  for (const c of plant.comps) {
    const lit = c.kind === "vessel";
    const x0 = X(c.x);
    const y0 = Y(c.y);
    const ww = Math.max(2, X(c.x + c.w) - x0);
    const hh = Math.max(2, Y(c.y + c.h) - y0);
    fill(g, x0, y0, ww, hh, PAL.steelL);
    if (lit) {
      const core = st.glow > 0 ? (st.glow < 0.4 ? PAL.cherenkovD : PAL.cherenkov) : st.hot ? PAL.copperL : PAL.steelD;
      fill(g, x0 + 1, y0 + Math.floor(hh / 2), Math.max(1, ww - 2), Math.max(1, Math.floor(hh / 3)), core);
    }
    if (c.kind === "pump" || c.kind === "blower") {
      const on = st.flow > 0.02 && (c.id !== "fwpump" || st.hot);
      fill(g, x0, y0, ww, hh, on ? PAL.leafL : PAL.ash);
    }
  }
  // A slow scan blink in the corner: the panel is live.
  if (Math.floor(t * 2) % 2 === 0) fill(g, x + w - 3, y + 2, 1, 1, PAL.goldL);
}

/**
 * The reactor building roof on the lot, seen from above. The PWR keeps the domed roof in the atlas.
 * box: the roof part of the stamp, above the facade.
 * BWR: a flat reactor building roof with the refuelling crane rails and ventilation units.
 * Pebble bed: two module roofs, each with its vessel hatch.
 * Salt: a flat roof with a row of air cooler fans, turning while the plant makes heat.
 */
export function drawLotRoof(g: G, box: { x: number; y: number; w: number; h: number }, kind: CutawayKind, running: boolean, t: number) {
  if (kind === "pwr") return;
  const { x, y, w, h } = box;
  const roof = (rx: number, ry: number, rw: number, rh: number) => {
    fill(g, rx, ry, rw, rh, PAL.outline);
    fill(g, rx + 1, ry + 1, rw - 2, rh - 2, PAL.muted);
    fill(g, rx + 1, ry + rh - 3, rw - 2, 2, PAL.ash);
    for (let i = rx + 6; i < rx + rw - 2; i += 12) fill(g, i, ry + 2, 1, rh - 5, PAL.ash);
  };
  const unit = (ux: number, uy: number) => {
    fill(g, ux, uy, 12, 9, PAL.outline);
    fill(g, ux + 1, uy + 1, 10, 7, PAL.steelL);
    for (let i = 0; i < 3; i++) fill(g, ux + 2, uy + 2 + i * 2, 8, 1, PAL.steel);
  };
  if (kind === "bwr") {
    roof(x, y, w, h);
    // Crane rails over the refuelling floor, and the roof hatch above the reactor well.
    fill(g, x + 12, y + 10, w - 24, 2, PAL.gold);
    fill(g, x + 12, y + h - 14, w - 24, 2, PAL.gold);
    fill(g, x + Math.floor(w / 2) - 14, y + 18, 28, h - 34, PAL.outline);
    fill(g, x + Math.floor(w / 2) - 13, y + 19, 26, h - 36, PAL.steel);
    unit(x + 16, y + 20);
    unit(x + w - 30, y + 20);
    trefoil(g, x + w - 14, y + h - 9);
    return;
  }
  if (kind === "pebble") {
    // Two modules, each over its own reactor and steam generator.
    fill(g, x, y, w, h, PAL.leafD);
    const mw = Math.floor((w - 12) / 2);
    for (const mx of [x + 4, x + 8 + mw]) {
      roof(mx, y + 4, mw, h - 8);
      disc(g, mx + 18, y + Math.floor(h / 2), 9, PAL.outline);
      disc(g, mx + 18, y + Math.floor(h / 2), 8, PAL.steel);
      disc(g, mx + 16, y + Math.floor(h / 2) - 2, 3, PAL.steelL);
      unit(mx + mw - 20, y + 10);
    }
    trefoil(g, x + w - 12, y + h - 10);
    return;
  }
  // Salt: air coolers. Fans turn while the plant makes heat.
  roof(x, y, w, h);
  const fans = 5;
  for (let i = 0; i < fans; i++) {
    const cx = x + 18 + Math.floor((i * (w - 36)) / (fans - 1));
    const cy = y + Math.floor(h / 2);
    disc(g, cx, cy, 11, PAL.outline);
    disc(g, cx, cy, 10, PAL.steelD);
    const a0 = running ? t * 8 + i : i;
    for (let k = 0; k < 3; k++) {
      const a = a0 + (k * 2 * Math.PI) / 3;
      for (let s = 2; s < 9; s++) fill(g, Math.round(cx + Math.cos(a) * s), Math.round(cy + Math.sin(a) * s), 2, 2, PAL.steelL);
    }
    disc(g, cx, cy, 2, PAL.gold);
  }
  trefoil(g, x + w - 10, y + 8);
}
