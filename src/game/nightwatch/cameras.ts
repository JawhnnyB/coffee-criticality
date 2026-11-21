/**
 * Security camera scenes for Night Watch: plant spaces at night, drawn at 160×90 in the game palette.
 * The look is liminal rather than frightening: empty rooms under sodium and fluorescent light, a hum you can
 * almost see, nothing moving except what should not. Each scene draws its base, then the layers the model
 * reports for that camera (an event's visual or a harmless oddity).
 */
import { PAL } from "../palette";

export const CAM_W = 160;
export const CAM_H = 90;

type G = CanvasRenderingContext2D;
const fill = (g: G, x: number, y: number, w: number, h: number, c: string) => {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
};

/** Deterministic noise so stills are reproducible. */
function hash(a: number, b: number) {
  let h = (a * 374761393 + b * 668265263) >>> 0;
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
  return (h ^ (h >>> 16)) / 4294967296;
}

/** One-point-perspective room: back wall, floor, ceiling, side walls, ceiling light strips. */
function room(g: G, wall: string, wallD: string, floor: string, floorL: string, t: number, flicker: boolean, depth = 0.42) {
  const bx = CAM_W * (0.5 - depth / 2);
  const by = CAM_H * 0.28;
  const bw = CAM_W * depth;
  const bh = CAM_H * 0.42;
  fill(g, 0, 0, CAM_W, CAM_H, wallD);
  // Ceiling and floor as stacked bands narrowing toward the back wall.
  for (let k = 0; k < 14; k++) {
    const f = k / 14;
    const y0 = by * f;
    const x0 = bx * f;
    fill(g, x0, y0, CAM_W - 2 * x0, by / 14 + 1, k % 2 ? PAL.ash : PAL.muted);
    const yf = CAM_H - (CAM_H - by - bh) * f;
    fill(g, x0, yf - (CAM_H - by - bh) / 14 - 1, CAM_W - 2 * x0, (CAM_H - by - bh) / 14 + 1, k % 3 ? floor : floorL);
  }
  // Side walls.
  for (let x = 0; x < bx; x++) {
    const f = x / bx;
    fill(g, x, by * f, 1, CAM_H - by * f - (CAM_H - by - bh) * f, f > 0.5 ? wall : wallD);
    fill(g, CAM_W - 1 - x, by * f, 1, CAM_H - by * f - (CAM_H - by - bh) * f, f > 0.5 ? wall : wallD);
  }
  fill(g, bx, by, bw, bh, wall);
  // Light strips; one may flicker.
  const on = !flicker || Math.sin(t * 23) > -0.2 || hash(Math.floor(t * 8), 3) > 0.5;
  for (const f of [0.25, 0.55, 0.8]) {
    const x0 = bx * f;
    const y0 = by * f;
    fill(g, x0 + (CAM_W - 2 * x0) * 0.35, y0 + 1, (CAM_W - 2 * x0) * 0.3, 2, f === 0.55 && !on ? PAL.ash : PAL.cream);
  }
  return { bx, by, bw, bh };
}

function pipe(g: G, x: number, y: number, w: number, h: number) {
  fill(g, x, y, w, h, PAL.steelD);
  fill(g, x, y, w, Math.max(1, h / 3), PAL.steelL);
}

function beacon(g: G, x: number, y: number, t: number, color: string = PAL.bad) {
  fill(g, x - 2, y, 5, 4, PAL.outline);
  const lit = Math.sin(t * 9) > 0;
  fill(g, x - 1, y + 1, 3, 2, lit ? color : PAL.copperD);
  if (lit) {
    g.globalAlpha = 0.25;
    fill(g, x - 12, y - 6, 25, 16, color);
    g.globalAlpha = 1;
  }
}

function puddle(g: G, cx: number, cy: number, t: number) {
  const r = 14 + Math.sin(t * 0.7) * 1.5;
  for (let k = 0; k < 4; k++) fill(g, cx - r + k * 3, cy + k, (r - k * 3) * 2, 1.5, k % 2 ? PAL.sky : PAL.steel);
  fill(g, cx - 3, cy + 1, 5, 1, PAL.white);
}

function wisp(g: G, x: number, y: number, t: number) {
  // A plume rising from (x, y): denser near the source, spreading as it climbs.
  for (let k = 0; k < 9; k++) {
    g.globalAlpha = 0.75 - k * 0.06;
    const yy = y - k * 3 - ((t * 8) % 3);
    const xx = x - (2 + k) / 2 + Math.sin(t * 2 + k * 0.9) * (1 + k * 0.6);
    fill(g, xx, yy, 3 + k, 3, PAL.white);
  }
  g.globalAlpha = 1;
}

function trefoil(g: G, x: number, y: number) {
  fill(g, x - 3, y - 3, 7, 7, PAL.gold);
  fill(g, x, y, 1, 1, PAL.ink);
  fill(g, x - 2, y - 2, 2, 2, PAL.copperD);
  fill(g, x + 1, y - 2, 2, 2, PAL.copperD);
  fill(g, x - 1, y + 1, 3, 2, PAL.copperD);
}

function pumpMotor(g: G, x: number, y: number, t: number, running: boolean) {
  fill(g, x, y, 22, 26, PAL.leafD);
  fill(g, x + 2, y + 2, 18, 22, PAL.leaf);
  for (let k = 0; k < 4; k++) fill(g, x + 2, y + 5 + k * 5, 18, 1, PAL.leafD);
  fill(g, x + 6, y + 26, 10, 6, PAL.steel);
  const phase = running ? Math.floor(t * 20) % 3 : 0;
  for (let k = 0; k < 3; k++) fill(g, x + 7 + k * 3, y + 27, 1, 4, k === phase ? PAL.steelL : PAL.steelD);
  fill(g, x - 2, y + 32, 26, 10, PAL.steelD);
  fill(g, x, y + 33, 22, 3, PAL.steel);
}

function dark(g: G, a: number) {
  g.globalAlpha = a;
  fill(g, 0, 0, CAM_W, CAM_H, PAL.ink);
  g.globalAlpha = 1;
}

const SCENES: Record<string, (g: G, t: number, v: Set<string>) => void> = {
  containment(g, t, v) {
    room(g, PAL.steel, PAL.steelD, PAL.ash, PAL.muted, t, v.has("flicker"), 0.5);
    fill(g, 0, 6, CAM_W, 3, PAL.gold);
    pipe(g, 10, 52, 50, 8);
    pipe(g, 100, 52, 50, 8);
    pumpMotor(g, 69, 26, t, true);
    if (v.has("puddle")) {
      puddle(g, 80, 78, t);
      wisp(g, 74, 66, t);
    }
  },
  pressurizer(g, t, v) {
    room(g, PAL.ash, PAL.muted, PAL.ash, PAL.muted, t, v.has("flicker"), 0.36);
    fill(g, 66, 10, 28, 70, PAL.steelD);
    fill(g, 68, 12, 24, 66, PAL.steelL);
    fill(g, 68, 12, 6, 66, PAL.cream);
    pipe(g, 92, 18, 40, 4);
    pipe(g, 128, 4, 4, 18);
    fill(g, 124, 18, 12, 6, PAL.copperD);
    // Weeping from the relief valve body, up past the tailpipe.
    if (v.has("steamWisp")) wisp(g, 128, 30, t);
  },
  msiv(g, t, v) {
    room(g, PAL.muted, PAL.ash, PAL.ash, PAL.muted, t, false, 0.44);
    pipe(g, 0, 40, CAM_W, 12);
    fill(g, 66, 30, 28, 32, PAL.steelD);
    fill(g, 70, 20, 20, 12, PAL.leafD);
    fill(g, 120, 22, 16, 14, PAL.cream);
    fill(g, 122, 25, 12, 4, PAL.ink);
    fill(g, 124, 30, 8, 3, v.has("beacon") ? PAL.bad : PAL.leafL);
    trefoil(g, 128, 12);
    if (v.has("beacon")) beacon(g, 140, 16, t);
  },
  drywell(g, t, v) {
    room(g, PAL.copperD, PAL.ink, PAL.steelD, PAL.steel, t, v.has("flicker"), 0.5);
    for (let x = 0; x < CAM_W; x += 6) fill(g, x, 70, 3, 1, PAL.copper);
    pumpMotor(g, 69, 22, t, true);
    pipe(g, 0, 50, 60, 7);
    if (v.has("puddle")) puddle(g, 80, 80, t);
  },
  torus(g, t, v) {
    room(g, PAL.steel, PAL.steelD, PAL.steelD, PAL.steel, t, false, 0.6);
    for (let y = 52; y < CAM_H; y += 2) fill(g, 0, y, CAM_W, 1, (y / 2 + Math.floor(t * 3)) % 3 ? PAL.steelD : PAL.sky);
    fill(g, 0, 50, CAM_W, 2, PAL.steelL);
    if (v.has("steamWisp")) {
      wisp(g, 50, 52, t);
      wisp(g, 110, 54, t + 1);
    }
  },
  tunnel(g, t, v) {
    room(g, PAL.ash, PAL.ink, PAL.ash, PAL.muted, t, v.has("flicker") || v.has("condensate"), 0.18);
    pipe(g, 0, 30, 58, 10);
    pipe(g, 102, 30, 58, 10);
    for (let k = 0; k < 6; k++) pipe(g, 58 + k * 1, 34, 4, 4);
    trefoil(g, 80, 14);
    if (v.has("beacon")) beacon(g, 80, 22, t);
    if (v.has("condensate")) for (let k = 0; k < 3; k++) fill(g, 30 + k * 40, 42 + ((t * 30 + k * 13) % 30), 1, 2, PAL.sky);
  },
  cavity(g, t, v) {
    room(g, PAL.ash, PAL.muted, PAL.ash, PAL.muted, t, false, 0.5);
    fill(g, 40, 46, 80, 30, PAL.steelD);
    fill(g, 44, 48, 72, 26, PAL.steel);
    for (let k = 0; k < 8; k++) fill(g, 48 + k * 9, 30, 3, 18, PAL.steelL);
    if (v.has("warmGlow")) {
      g.globalAlpha = 0.18 + 0.05 * Math.sin(t);
      fill(g, 40, 40, 80, 40, PAL.copperL);
      g.globalAlpha = 1;
    }
  },
  blower(g, t, v) {
    const dx = v.has("shake") ? Math.round(Math.sin(t * 60)) : 0;
    room(g, PAL.steel, PAL.steelD, PAL.ash, PAL.muted, t, false, 0.5);
    fill(g, 20 + dx, 30, 40, 40, PAL.leafD);
    fill(g, 24 + dx, 34, 32, 32, PAL.leaf);
    fill(g, 36 + dx, 46, 8, 8, PAL.steelD);
    fill(g, 96, 8, 30, 72, PAL.steelD);
    fill(g, 98, 10, 26, 68, PAL.steelL);
    pipe(g, 60, 44, 36, 8);
    if (v.has("steamWisp")) wisp(g, 112, 20, t);
    if (v.has("shake")) beacon(g, 40, 22, t, PAL.gold);
  },
  discharge(g, t, v) {
    room(g, PAL.muted, PAL.ash, PAL.ash, PAL.muted, t, false, 0.4);
    pipe(g, 76, 0, 8, 60);
    pipe(g, 76, 58, 60, 8);
    fill(g, 40, 46, 22, 16, PAL.cream);
    fill(g, 42, 48, 18, 4, PAL.ink);
    fill(g, 42, 54, 18, 3, v.has("jam") ? PAL.bad : PAL.leafL);
    if (v.has("jam")) beacon(g, 51, 36, t);
    const y = v.has("jam") ? 40 : (t * 12) % 56;
    fill(g, 78, y, 4, 4, PAL.ink);
  },
  cell(g, t, v) {
    fill(g, 0, 0, CAM_W, CAM_H, PAL.ink);
    fill(g, 20, 12, 120, 64, PAL.copperD);
    fill(g, 24, 16, 112, 56, PAL.gold);
    g.globalAlpha = 0.35;
    fill(g, 24, 16, 112, 56, PAL.copper);
    g.globalAlpha = 1;
    pipe(g, 30, 40, 100, 6);
    for (let x = 30; x < 130; x += 4) fill(g, x, 46, 2, 1, v.has("heaterDark") && x > 70 && x < 100 ? PAL.steelD : PAL.bad);
    if (v.has("shadow")) {
      g.globalAlpha = 0.3;
      fill(g, 96, 18, 2, 22, PAL.ink);
      fill(g, 92, 38, 10, 4, PAL.ink);
      g.globalAlpha = 1;
    }
    fill(g, 20, 76, 120, 4, PAL.steelD);
  },
  freeze(g, t, v) {
    room(g, PAL.steel, PAL.steelD, PAL.ash, PAL.muted, t, false, 0.4);
    pipe(g, 70, 0, 10, 60);
    fill(g, 66, 40, 18, 14, PAL.steelD);
    if (!v.has("frostGone")) for (let k = 0; k < 18; k++) fill(g, 66 + hash(k, 1) * 18, 40 + hash(k, 2) * 14, 1, 1, PAL.white);
    fill(g, 100, 46, 18, 18, PAL.ash);
    const spin = v.has("frostGone") ? 0 : Math.floor(t * 18) % 2;
    fill(g, 108, 48 + spin * 6, 2, 8, PAL.steelD);
    fill(g, 102 + spin * 6, 54, 8, 2, PAL.steelD);
    if (v.has("frostGone")) beacon(g, 75, 30, t, PAL.gold);
  },
  offgas(g, t, v) {
    room(g, PAL.muted, PAL.ash, PAL.ash, PAL.muted, t, false, 0.5);
    for (const x of [30, 70, 110]) {
      fill(g, x, 24, 22, 50, PAL.steelD);
      fill(g, x + 2, 26, 18, 46, PAL.steel);
    }
    pipe(g, 20, 20, 120, 4);
    trefoil(g, 140, 34);
    if (v.has("beacon")) beacon(g, 140, 44, t);
  },
  turbine(g, t, v) {
    room(g, PAL.ash, PAL.muted, PAL.steel, PAL.steelL, t, v.has("flicker"), 0.3);
    fill(g, 30, 34, 100, 18, PAL.leafD);
    fill(g, 32, 36, 96, 10, PAL.leaf);
    pumpMotor(g, 18, 46, t, true);
    pumpMotor(g, 120, 46, t, !v.has("pumpStopped"));
    if (v.has("pumpStopped")) beacon(g, 131, 40, t);
    if (v.has("hardhat")) {
      fill(g, 74, 80, 10, 4, PAL.gold);
      fill(g, 73, 83, 12, 1, PAL.copperD);
    }
  },
  corridor(g, t, v) {
    const r = room(g, PAL.goldL, PAL.gold, PAL.copperL, PAL.goldL, t, v.has("flicker"), 0.16);
    // Doors down the corridor, the near right one a locked high radiation door.
    for (const f of [0.3, 0.55, 0.75]) {
      const x0 = r.bx * f;
      const top = r.by * f + 8;
      fill(g, x0 + 2, top, 6 * (1 - f) + 3, 30 * (1 - f * 0.6), PAL.copperD);
    }
    const dx = CAM_W - 30;
    fill(g, dx, 24, 16, 44, PAL.gold);
    fill(g, dx + 1, 25, 14, 42, PAL.bad);
    trefoil(g, dx + 8, 32);
    if (v.has("doorAjar")) {
      fill(g, dx - 4, 24, 5, 44, PAL.ink);
      g.globalAlpha = 0.25;
      fill(g, dx - 10, 60, 12, 24, PAL.ink);
      g.globalAlpha = 1;
    }
    if (v.has("puddle")) puddle(g, 60, 80, t);
    if (v.has("chair")) {
      fill(g, 82, 58, 10, 8, PAL.steelD);
      fill(g, 82, 50, 10, 9, PAL.ink);
      fill(g, 86, 66, 2, 6, PAL.ink);
      fill(g, 81, 72, 12, 1, PAL.ink);
    }
  },
  pool(g, t, v) {
    room(g, PAL.ash, PAL.muted, PAL.ash, PAL.muted, t, false, 0.7);
    const low = v.has("poolLow");
    const top = low ? 40 : 34;
    fill(g, 10, 30, 140, 56, PAL.steelL);
    fill(g, 12, top, 136, 86 - top, PAL.sky);
    // Fuel racks on the bottom, with their Cherenkov light (the owner-approved exception).
    for (let x = 22; x < 140; x += 8) {
      fill(g, x, 70, 6, 12, PAL.steelD);
      g.globalAlpha = 0.6 + 0.2 * Math.sin(t * 1.3 + x);
      fill(g, x + 1, 71, 4, 10, PAL.cherenkov);
      g.globalAlpha = 1;
      fill(g, x + 2, 73, 2, 4, PAL.cherenkovL);
    }
    if (low) fill(g, 12, 34, 136, 6, PAL.steel);
    if (v.has("ripple") || v.has("toolBag")) {
      const rx = 60 + Math.sin(t * 0.5) * 10;
      fill(g, rx, top + 3, 16, 1, PAL.white);
    }
    if (v.has("toolBag")) {
      fill(g, 120, 24, 14, 8, PAL.copperD);
      fill(g, 124, 21, 6, 3, PAL.ink);
    }
    for (let x = 10; x < 150; x += 10) fill(g, x, 26, 5, 2, PAL.gold);
  },
  yard(g, t, v) {
    fill(g, 0, 0, CAM_W, CAM_H, PAL.ink);
    for (let k = 0; k < 20; k++) fill(g, hash(k, 9) * CAM_W, hash(k, 4) * 30, 1, 1, PAL.steel);
    fill(g, 0, 70, CAM_W, 20, PAL.leafD);
    for (const x of [30, 80, 130]) {
      fill(g, x, 22, 3, 50, PAL.steel);
      fill(g, x - 10, 24, 23, 2, PAL.steel);
      fill(g, x - 10, 26, 2, 4, PAL.cream);
      fill(g, x + 11, 26, 2, 4, PAL.cream);
    }
    for (const y of [25, 29]) fill(g, 0, y, CAM_W, 1, PAL.steelD);
    if (v.has("arc") && hash(Math.floor(t * 12), 7) > 0.55) {
      g.globalAlpha = 0.6;
      fill(g, 70, 18, 20, 16, PAL.sky);
      g.globalAlpha = 1;
      fill(g, 78, 22, 4, 8, PAL.white);
    }
    if (v.has("fog") || v.has("arc")) {
      g.globalAlpha = 0.25;
      for (let k = 0; k < 6; k++) fill(g, ((t * 4 + k * 40) % 200) - 40, 50 + k * 4, 60, 4, PAL.steelL);
      g.globalAlpha = 1;
    }
  },
  intake(g, t, v) {
    fill(g, 0, 0, CAM_W, CAM_H, PAL.ink);
    fill(g, 0, 30, CAM_W, 6, PAL.steelD);
    for (let y = 40; y < CAM_H; y += 3) fill(g, 0, y, CAM_W, 2, (y + Math.floor(t * 4)) % 2 ? PAL.steelD : PAL.sky);
    for (const x of [30, 74, 118]) {
      fill(g, x, 16, 16, 60, PAL.steel);
      for (let y = 20; y < 74; y += 3) fill(g, x + 1, y, 14, 1, PAL.steelD);
      if (v.has("debris")) for (let k = 0; k < 6; k++) fill(g, x + hash(k, x) * 12, 40 + hash(x, k) * 30, 3, 2, PAL.copperD);
    }
    if (v.has("debris")) beacon(g, 140, 20, t, PAL.gold);
    if (v.has("gull")) {
      const gx = (t * 10) % 180 - 10;
      fill(g, gx, 12, 6, 2, PAL.cream);
      fill(g, gx + 2, 10, 2, 2, PAL.cream);
    }
  },
};

/**
 * Draw one camera. visuals: the model's layers for this camera. switching: 0..1 static while changing feed.
 * After a reactor trip the plant goes to emergency lighting: darker, with a slow red cast.
 */
export function paintCamera(g: G, scene: string, visuals: string[], t: number, opts: { switching?: number; tripped?: boolean } = {}) {
  const v = new Set(visuals);
  (SCENES[scene] ?? SCENES.corridor)(g, t, v);
  if (opts.tripped) {
    dark(g, 0.45);
    g.globalAlpha = 0.12 + 0.06 * Math.sin(t * 2);
    fill(g, 0, 0, CAM_W, CAM_H, PAL.bad);
    g.globalAlpha = 1;
  }
  // Night camera: dim, scanlines, grain, vignette.
  dark(g, 0.18);
  for (let y = 0; y < CAM_H; y += 2) {
    g.globalAlpha = 0.12;
    fill(g, 0, y, CAM_W, 1, PAL.ink);
  }
  g.globalAlpha = 1;
  const frame = Math.floor(t * 12);
  for (let k = 0; k < 60; k++) {
    g.globalAlpha = 0.18;
    fill(g, hash(k, frame) * CAM_W, hash(frame, k) * CAM_H, 1, 1, hash(k, k + frame) > 0.5 ? PAL.cream : PAL.ink);
  }
  g.globalAlpha = 1;
  for (let k = 0; k < 6; k++) {
    g.globalAlpha = 0.08 * (6 - k);
    fill(g, 0, k, CAM_W, 1, PAL.ink);
    fill(g, 0, CAM_H - 1 - k, CAM_W, 1, PAL.ink);
    fill(g, k, 0, 1, CAM_H, PAL.ink);
    fill(g, CAM_W - 1 - k, 0, 1, CAM_H, PAL.ink);
  }
  g.globalAlpha = 1;
  if (opts.switching && opts.switching > 0) {
    for (let y = 0; y < CAM_H; y++) {
      for (let x = 0; x < CAM_W; x += 2) {
        if (hash(x + y * CAM_W, frame) < opts.switching) fill(g, x, y, 2, 1, hash(x, y + frame) > 0.5 ? PAL.cream : PAL.ink);
      }
    }
  }
}

export const SCENE_NAMES = Object.keys(SCENES);
