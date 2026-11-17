/**
 * BOWL.CAB pin motion and generation-k. Pure, so a seeded roll can be checked
 * without the canvas. Damping and contact distances match the cabinet.
 */

export interface BowlPin {
  x: number;
  y: number;
  up: boolean;
  vx: number;
  vy: number;
}

export interface BowlBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function pinLayout(): BowlPin[] {
  const p: BowlPin[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c <= r; c++) {
      p.push({ x: 160 + (c - r / 2) * 18, y: 36 + r * 16, up: true, vx: 0, vy: 0 });
    }
  }
  return p;
}

/** k = pins this roll / pins the previous roll. Null when the previous roll toppled nothing. */
export function generationK(prevFalls: number, falls: number): number | null {
  return prevFalls > 0 ? falls / prevFalls : null;
}

export function launchVelocity(aim: number, power: number): { vx: number; vy: number } {
  return {
    vx: Math.sin(aim) * (80 + power * 160),
    vy: -Math.cos(aim) * (80 + power * 180),
  };
}

/** One step. Returns true when this roll has stopped. */
export function stepRoll(pins: BowlPin[], ball: BowlBall, dt: number): boolean {
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.vy += 8 * dt;
  ball.vx *= Math.exp(-0.4 * dt);
  if (ball.x < 70 || ball.x > 250) ball.vx *= -0.7;
  for (const p of pins) {
    if (!p.up) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      continue;
    }
    const d2 = (p.x - ball.x) ** 2 + (p.y - ball.y) ** 2;
    if (d2 < 80) {
      p.up = false;
      p.vx = (p.x - ball.x) * 8;
      p.vy = (p.y - ball.y) * 8;
      ball.vx *= 0.7;
      ball.vy *= 0.7;
    }
  }
  for (let i = 0; i < pins.length; i++) {
    if (pins[i].up) continue;
    for (let j = 0; j < pins.length; j++) {
      if (i === j || !pins[j].up) continue;
      const d2 = (pins[i].x - pins[j].x) ** 2 + (pins[i].y - pins[j].y) ** 2;
      if (d2 < 70) {
        pins[j].up = false;
        pins[j].vx = pins[i].vx * 0.6;
        pins[j].vy = pins[i].vy * 0.6;
      }
    }
  }
  return ball.y < 12 || (Math.hypot(ball.vx, ball.vy) < 8 && ball.y < 120);
}

export interface GenCount {
  /** Pins that fell on this roll, not the standing total. */
  falls: number;
  knocked: number;
  k: number | null;
}

/**
 * Fixed aim, power, and dt. A strike (10 down) or the second ball resets the pins,
 * the same rule the cabinet uses between rolls.
 */
export function seededRolls(opts: {
  aim: number;
  power: number;
  dt: number;
  rolls: number;
  maxSteps?: number;
}): GenCount[] {
  const maxSteps = opts.maxSteps ?? 8000;
  let pins = pinLayout();
  let prevFalls = 0;
  let balls = 0;
  const out: GenCount[] = [];
  for (let n = 0; n < opts.rolls; n++) {
    const downAtFire = pins.filter((p) => !p.up).length;
    const v = launchVelocity(opts.aim, opts.power);
    const ball: BowlBall = { x: 160, y: 160, vx: v.vx, vy: v.vy };
    balls += 1;
    let stopped = false;
    for (let s = 0; s < maxSteps; s++) {
      stopped = stepRoll(pins, ball, opts.dt);
      if (stopped) break;
    }
    const knocked = pins.filter((p) => !p.up).length;
    const falls = stopped ? Math.max(0, knocked - downAtFire) : 0;
    const k = generationK(prevFalls, falls);
    prevFalls = falls;
    out.push({ falls, knocked, k });
    if (knocked === 10 || balls >= 2) {
      pins = pinLayout();
      balls = 0;
    }
  }
  return out;
}
