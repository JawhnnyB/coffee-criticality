import { PAL } from "./palette";
import type { Season } from "./parlorOS";

/**
 * The desktop wallpaper: the lake at Lake Master, with the plant on the far shore.
 * Painted at a small native size and shown at a whole-number scale. Palette tints only.
 * No letters, no measurements. The plume and the lit windows are decoration.
 */

/** Native rows the scene is designed for. The caller picks the scale so the canvas is about this tall. */
export const WALL_NATIVE_H = 180;
/** Native columns a narrow screen should still show. Keeps a phone from zooming in on the tower. */
export const WALL_NATIVE_W = 200;

interface Look {
  /** Sky bands, top to horizon. */
  sky: string[];
  sun: string | null;
  far: string;
  near: string;
  shore: string;
  plant: string;
  /** The sun side of the tower and the dome. */
  plantHi: string;
  plantLit: string;
  water: string[];
  glint: string;
  bank: string;
  reed: string;
  plume: string;
}

const LOOKS: Record<Season, Look> = {
  spring: {
    sky: [PAL.steelD, PAL.steel, PAL.steelL, PAL.sky, PAL.leafL],
    sun: PAL.cream,
    far: PAL.steelL,
    near: PAL.leaf,
    shore: PAL.leafD,
    plant: PAL.steelD,
    plantHi: PAL.steel,
    plantLit: PAL.goldL,
    water: [PAL.steelL, PAL.steel, PAL.steelD],
    glint: PAL.leafL,
    bank: PAL.outline,
    reed: PAL.leafD,
    plume: PAL.cream,
  },
  summer: {
    sky: [PAL.skyDusk, PAL.wine, PAL.copperD, PAL.copper, PAL.copperL],
    sun: PAL.goldL,
    far: PAL.wine,
    near: PAL.copperD,
    shore: PAL.woodDark,
    plant: PAL.woodDark,
    plantHi: PAL.woodMid,
    plantLit: PAL.goldL,
    water: [PAL.copper, PAL.copperD, PAL.woodMid],
    glint: PAL.goldL,
    bank: PAL.outline,
    reed: PAL.woodMid,
    plume: PAL.copperL,
  },
  fall: {
    sky: [PAL.woodDark, PAL.woodMid, PAL.wood, PAL.copperD, PAL.copper],
    sun: PAL.copperL,
    far: PAL.wood,
    near: PAL.copperD,
    shore: PAL.woodDark,
    plant: PAL.outline,
    plantHi: PAL.woodDark,
    plantLit: PAL.goldL,
    water: [PAL.copperD, PAL.woodMid, PAL.woodDark],
    glint: PAL.copperL,
    bank: PAL.ink,
    reed: PAL.goldD,
    plume: PAL.creamD,
  },
  winter: {
    sky: [PAL.ink, PAL.steelD, PAL.steel, PAL.steelL, PAL.muted],
    sun: PAL.white,
    far: PAL.steelL,
    near: PAL.muted,
    shore: PAL.creamD,
    plant: PAL.steelD,
    plantHi: PAL.steel,
    plantLit: PAL.goldL,
    water: [PAL.steel, PAL.steelD, PAL.ink],
    glint: PAL.white,
    bank: PAL.ink,
    reed: PAL.ash,
    plume: PAL.white,
  },
};

/** Stable noise in 0..1 from two whole numbers. The same canvas size always paints the same picture. */
function hash(x: number, y: number): number {
  let n = (x * 374761393 + y * 668265263) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  n = n ^ (n >>> 16);
  return ((n >>> 0) % 1024) / 1024;
}

/** A ridge line from three slow waves. Returns the height of the ridge above its base, in rows. */
function ridge(x: number, seed: number, tall: number): number {
  const a = Math.sin(x * 0.021 + seed) * 0.5;
  const b = Math.sin(x * 0.047 + seed * 2.3) * 0.3;
  const c = Math.sin(x * 0.113 + seed * 5.1) * 0.2;
  return Math.round((a + b + c + 1) * 0.5 * tall);
}

/** Half-width of the cooling tower at a row, counted from its top. Waist at about a third of the way down. */
function towerHalf(row: number, rows: number, base: number): number {
  const t = row / Math.max(1, rows - 1);
  const waist = 0.25;
  // A hyperbola through three points: 0.6 of the base at the lip, 0.5 at the waist, 1 at the ground.
  const u = t < waist ? (waist - t) / waist : (t - waist) / (1 - waist);
  const grow = t < waist ? 0.11 : 0.75;
  return Math.max(2, Math.round(base * Math.sqrt(0.25 + grow * u * u)));
}

export function paintWallpaper(g: CanvasRenderingContext2D, w: number, h: number, season: Season): void {
  const L = LOOKS[season];
  // A tall phone canvas keeps the plant low, under the icon grid.
  const horizon = Math.round(h * (h > w ? 0.74 : 0.56));
  // Feature size follows the shorter side, so a tall phone canvas keeps the plant small and clear of the icons.
  const u = Math.min(h, Math.round(w * 0.5625));
  const px = (x: number, y: number, ww: number, hh: number, color: string) => {
    g.fillStyle = color;
    g.fillRect(x, y, ww, hh);
  };

  // Sky: flat bands, with a thin stripe where two bands meet.
  const bandH = Math.ceil(horizon / L.sky.length);
  for (let i = 0; i < L.sky.length; i++) {
    px(0, i * bandH, w, bandH, L.sky[i]);
    if (i === 0) continue;
    // One thin stripe of the next band above the edge. A hard step, no dither teeth.
    px(0, i * bandH - 3, w, 1, L.sky[i]);
  }

  // Sun, low on the left third. Winter gets a few stars above it.
  if (L.sun) {
    const cx = Math.round(w * 0.3);
    const cy = horizon - Math.round(u * 0.13);
    const r = Math.max(5, Math.round(u * 0.045));
    for (let dy = -r; dy <= r; dy++) {
      const half = Math.round(Math.sqrt(r * r - dy * dy));
      px(cx - half, cy + dy, half * 2 + 1, 1, L.sun);
    }
  }
  if (season === "winter") {
    for (let i = 0; i < Math.round(w / 9); i++) {
      const x = Math.floor(hash(i, 7) * w);
      const y = Math.floor(hash(i, 13) * bandH * 1.6);
      px(x, y, 1, 1, i % 3 === 0 ? PAL.white : PAL.muted);
    }
  }

  // Two ridges behind the far shore.
  for (let x = 0; x < w; x++) {
    const far = ridge(x, 1.7, Math.round(u * 0.13));
    px(x, horizon - 6 - far, 1, far + 6, L.far);
  }
  for (let x = 0; x < w; x++) {
    const near = ridge(x, 4.1, Math.round(u * 0.07));
    px(x, horizon - 2 - near, 1, near + 2, L.near);
  }

  // The far shore: a tree line with uneven tops.
  for (let x = 0; x < w; x++) {
    const top = 2 + Math.round(hash(Math.floor(x / 3), 3) * 3) + (hash(x, 5) > 0.7 ? 1 : 0);
    px(x, horizon - top, 1, top, L.shore);
  }

  // The plant, right of centre on the far shore.
  const base = horizon - 1;
  const tx = Math.round(w * 0.68);
  const rows = Math.round(u * 0.23);
  const halfBase = Math.round(rows * 0.46);
  for (let r = 0; r < rows; r++) {
    const half = towerHalf(r, rows, halfBase);
    px(tx - half, base - rows + r, half * 2, 1, L.plant);
  }
  // The sun side of the tower: a lit strip that follows the curve.
  for (let r = 0; r < rows; r++) {
    const half = towerHalf(r, rows, halfBase);
    px(tx - half, base - rows + r, Math.max(2, Math.round(half * 0.45)), 1, L.plantHi);
  }
  px(tx - towerHalf(0, rows, halfBase), base - rows, towerHalf(0, rows, halfBase) * 2, 1, L.plantHi);
  // Plume: a column of soft blocks that leans right as it climbs.
  for (let i = 0; i < 9; i++) {
    const pw = 5 + Math.round(hash(i, 21) * 5) + i;
    const ph = 3 + Math.round(hash(i, 22) * 2);
    const x = tx - Math.round(pw / 2) + i * 3 + Math.round(hash(i, 23) * 3);
    const y = base - rows - 3 - i * 4;
    if (y < 2) break;
    px(x, y, pw, ph, L.plume);
    px(x + 1, y - 1, Math.max(2, pw - 3), 1, L.plume);
  }
  // Containment dome and the turbine hall beside the tower.
  const dx = tx - halfBase - Math.round(rows * 0.55);
  const dr = Math.round(rows * 0.2);
  for (let dy = 0; dy <= dr; dy++) {
    const half = Math.round(Math.sqrt(dr * dr - (dr - dy) * (dr - dy)));
    px(dx - half, base - dr * 2 + dy, half * 2 + 1, 1, L.plant);
    px(dx - half, base - dr * 2 + dy, Math.max(1, Math.round(half * 0.6)), 1, L.plantHi);
  }
  px(dx - dr, base - dr, dr * 2 + 1, dr, L.plant);
  px(dx - dr, base - dr, Math.round(dr * 0.6), dr, L.plantHi);
  const hallW = Math.round(rows * 0.9);
  const hallH = Math.round(rows * 0.22);
  const hx = tx + halfBase + 3;
  px(hx, base - hallH, hallW, hallH, L.plant);
  px(hx + hallW - 4, base - hallH - Math.round(rows * 0.35), 2, Math.round(rows * 0.35), L.plant);
  for (let i = 0; i < Math.floor(hallW / 4); i++) {
    if (hash(i, 31) > 0.35) px(hx + 2 + i * 4, base - hallH + 2, 2, 1, L.plantLit);
  }
  px(dx - 1, base - dr + 2, 1, 1, L.plantLit);
  px(tx, base - rows - 1, 1, 1, PAL.bad);

  // The lake: three bands, then broken glints that thin out toward the viewer.
  const lakeH = h - horizon;
  const wb = L.water.length;
  for (let i = 0; i < wb; i++) {
    const y0 = horizon + Math.floor((lakeH * i) / wb);
    const y1 = horizon + Math.floor((lakeH * (i + 1)) / wb);
    px(0, y0, w, y1 - y0, L.water[i]);
    if (i > 0) px(0, y0 - 3, w, 1, L.water[i]);
  }
  // Reflections: the shore line, then the tower as broken rows under it.
  px(0, horizon, w, 1, L.shore);
  for (let r = 0; r < rows; r++) {
    if (r % 2 === 1) continue;
    const half = towerHalf(rows - 1 - r, rows, halfBase);
    const wob = Math.round(Math.sin(r * 1.3) * 1.5);
    const y = horizon + 2 + r;
    if (y >= h) break;
    px(tx - half + wob, y, half * 2 - (r % 4 === 0 ? 0 : 2), 1, L.plant);
  }
  if (L.sun) {
    const cx = Math.round(w * 0.3);
    for (let r = 0; r < Math.round(Math.min(lakeH, u * 0.44) * 0.6); r += r < 12 ? 2 : 3) {
      const half = 2 + Math.round(hash(r, 41) * 3) + Math.round(r / 10);
      px(cx - half + Math.round((hash(r, 42) - 0.5) * 4), horizon + 3 + r, half * 2, 1, L.glint);
    }
  }
  for (let i = 0; i < Math.round((w * lakeH) / 260); i++) {
    const x = Math.floor(hash(i, 51) * w);
    const y = horizon + 3 + Math.floor(hash(i, 52) * (lakeH - 6));
    const len = 2 + Math.floor(hash(i, 53) * 5);
    px(x, y, len, 1, i % 3 === 0 ? L.glint : L.water[0]);
  }

  // Near bank along the bottom, with reeds.
  const bankH = Math.max(4, Math.round(u * 0.045));
  for (let x = 0; x < w; x++) {
    const lift = Math.round(Math.sin(x * 0.05) * 1.5 + hash(Math.floor(x / 2), 61) * 2);
    px(x, h - bankH - lift, 1, bankH + lift, L.bank);
  }
  // Reeds stand in clumps, not as a fence.
  for (let i = 0; i < Math.round(w / 34); i++) {
    const cx = Math.floor((i + hash(i, 71)) * 34);
    const blades = 3 + Math.floor(hash(i, 72) * 4);
    for (let b = 0; b < blades; b++) {
      const x = cx + b * 2 - blades + Math.round((hash(i, 80 + b) - 0.5) * 2);
      const tall = 5 + Math.floor(hash(i, 90 + b) * 9);
      const y = h - bankH - tall;
      px(x, y, 1, tall, L.reed);
      if (hash(i, 100 + b) > 0.6) px(x, y - 3, 2, 3, season === "winter" ? PAL.ash : PAL.wood);
    }
  }
}
