/**
 * Endless night high score. localStorage only. Never the week save.
 */
const KEY = "cc.endless";

export interface EndlessScore {
  nights: number;
  points: number;
}

export function readEndless(): EndlessScore {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || "{}") as { nights?: unknown; points?: unknown };
    const nights = Number(o.nights);
    const points = Number(o.points);
    return { nights: Number.isFinite(nights) ? nights : 0, points: Number.isFinite(points) ? points : 0 };
  } catch {
    return { nights: 0, points: 0 };
  }
}

/** Keep the best run. `nights` is how many dawns were stood. `points` is the last passing grade. */
export function noteEndless(nights: number, points: number): EndlessScore {
  const cur = readEndless();
  const next = { nights: Math.max(cur.nights, nights), points: Math.max(cur.points, points) };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
  return next;
}
