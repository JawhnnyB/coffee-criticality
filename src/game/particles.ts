/**
 * The season's particle layer for the desktop. One pool, at most 160 particles, pixel squares only.
 * Reduced motion makes an empty pool. The layer is paused by its owner when the desktop is hidden.
 */
import { PAL } from "./palette";
import type { ParticleKind } from "./parlorOS";

export const MAX_PARTICLES = 160;

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Pixel size. */
  s: number;
  color: string;
  /** Streaks are drawn longer than they are wide. */
  len: number;
}

const COLORS: Record<ParticleKind, string[]> = {
  rain: [PAL.steelL, PAL.sky],
  heat: [PAL.goldL, PAL.copperL],
  leaves: [PAL.copper, PAL.copperL, PAL.leafL, PAL.gold],
  snow: [PAL.white, PAL.cream],
};

/** How many particles a view of this size gets. Never more than MAX_PARTICLES. */
export function particleCount(w: number, h: number, reduced: boolean): number {
  if (reduced) return 0;
  const area = Math.max(0, w) * Math.max(0, h);
  return Math.min(MAX_PARTICLES, Math.round(area / 9000));
}

/** Fill a pool. `random` is injectable so tests get the same pool every time. */
export function makePool(kind: ParticleKind, w: number, h: number, reduced: boolean, random: () => number = Math.random): Particle[] {
  const n = particleCount(w, h, reduced);
  const pool: Particle[] = [];
  const colors = COLORS[kind];
  for (let i = 0; i < n; i++) pool.push(spawn(kind, w, h, random, colors, true));
  return pool;
}

function spawn(kind: ParticleKind, w: number, h: number, random: () => number, colors: string[], anywhere: boolean): Particle {
  const color = colors[Math.floor(random() * colors.length) % colors.length];
  const x = random() * w;
  const y = anywhere ? random() * h : -random() * 20;
  switch (kind) {
    case "rain":
      return { x, y, vx: -18, vy: 220 + random() * 80, s: 1, color, len: 6 };
    case "heat":
      return { x, y, vx: (random() - 0.5) * 6, vy: -(8 + random() * 10), s: 1 + Math.floor(random() * 2), color, len: 1 };
    case "leaves":
      return { x, y, vx: 12 + random() * 14, vy: 18 + random() * 16, s: 2 + Math.floor(random() * 2), color, len: 1 };
    case "snow":
      return { x, y, vx: (random() - 0.5) * 8, vy: 14 + random() * 12, s: 1 + Math.floor(random() * 2), color, len: 1 };
  }
}

/** Advance the pool by dt seconds. Particles that leave the view come back at the other side or the top. */
export function stepPool(pool: Particle[], kind: ParticleKind, w: number, h: number, dt: number, random: () => number = Math.random) {
  const colors = COLORS[kind];
  for (let i = 0; i < pool.length; i++) {
    const p = pool[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (kind === "leaves" || kind === "snow") p.x += Math.sin((p.y + i) * 0.05) * 0.4;
    if (p.y > h + 8 || p.x < -8 || p.x > w + 8 || p.y < -24) {
      pool[i] = spawn(kind, w, h, random, colors, false);
      if (pool[i].x < -8 || pool[i].x > w + 8) pool[i].x = random() * w;
    }
  }
}
