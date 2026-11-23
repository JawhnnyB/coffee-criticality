/**
 * One shared night per UTC day. Scores stay on this machine. No Steam board.
 */
const KEY = "cc.daily";

export interface DailyRow {
  points: number;
  letter: string;
  at: number;
}

export interface DailyBoard {
  day: string;
  seed: number;
  rows: DailyRow[];
}

export function utcDay(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Same number for everyone on this UTC date. */
export function dailySeed(d = new Date()): number {
  const day = utcDay(d);
  let h = 2166136261;
  for (let i = 0; i < day.length; i++) {
    h ^= day.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function readDaily(d = new Date()): DailyBoard {
  const day = utcDay(d);
  const seed = dailySeed(d);
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || "{}") as { day?: unknown; rows?: unknown };
    if (o.day === day && Array.isArray(o.rows)) {
      const rows = o.rows
        .filter((row): row is DailyRow => !!row && typeof row === "object" && typeof (row as DailyRow).points === "number")
        .slice(0, 10);
      return { day, seed, rows };
    }
  } catch {
    /* ignore */
  }
  return { day, seed, rows: [] };
}

export function recordDaily(points: number, letter: string, d = new Date()): DailyBoard {
  const cur = readDaily(d);
  const rows = [...cur.rows, { points, letter, at: Date.now() }].sort((a, b) => b.points - a.points || a.at - b.at).slice(0, 10);
  const next = { day: cur.day, seed: cur.seed, rows };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
  return next;
}
