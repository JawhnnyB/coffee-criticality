/** LOAD.CAB rules, kept free of React so they can be tested. See LoadGame.tsx for the cabinet. */

export const N = 4;
export const TURNS = 5;
export const W = 320;
export const H = 180;
export const OX = 56;
export const OY = 34;
export const CW = 52;
export const CH = 28;
export const HOT = 4;

export type Axis = "row" | "col";
export type Line = { axis: Axis; i: number };
export type Cell = { p: number; xe: number; leak: number };
export type Action = { kind: "rod"; line: Line } | { kind: "catch"; r: number; c: number };
export type End = { ok: boolean; score: number; line: string };

/** A fresh set of pulses each run. No line repeats on the next turn, so you cannot memorise the card. */
export function makePulses(): Line[] {
  const out: Line[] = [];
  let prev: Line | null = null;
  for (let t = 0; t < TURNS; t++) {
    let line: Line;
    do {
      const axis: Axis = Math.random() < 0.5 ? "row" : "col";
      line = { axis, i: Math.floor(Math.random() * N) };
    } while (prev && line.axis === prev.axis && line.i === prev.i);
    out.push(line);
    prev = line;
  }
  return out;
}

export const lineName = (l: Line) => (l.axis === "row" ? `ROW ${l.i + 1}` : `COL ${String.fromCharCode(65 + l.i)}`);
export const IDLE: Action = { kind: "rod", line: { axis: "row", i: -1 } };

/** Two-turn forecast with the rods idle: does the core hold, and where does xenon sit? */
export function forecast(cells: Cell[], pulses: Line[], turn: number): { fail: boolean; xe: number } {
  let c = clone(cells);
  let fail = false;
  for (let k = 0; k < 2 && turn + k < TURNS; k++) {
    const out = resolve(c, pulses[turn + k], IDLE, turn + k);
    c = out.cells;
    if (out.fail) {
      fail = true;
      break;
    }
  }
  return { fail, xe: c.filter((x) => x.xe > 0).length };
}

export type Snap = { cells: Cell[]; turn: number; caughtN: number; lastAct: Action | null };

export function fresh(): Cell[] {
  const cells: Cell[] = [];
  for (let i = 0; i < N * N; i++) cells.push({ p: 0, xe: 0, leak: 0 });
  cells[1 * N + 1].p = 1;
  cells[2 * N + 2].p = 1;
  cells[0 * N + 3].leak = 1;
  return cells;
}

export function onLine(r: number, c: number, line: Line) {
  return line.axis === "row" ? r === line.i : c === line.i;
}

export function clone(cells: Cell[]) {
  return cells.map((c) => ({ ...c }));
}

export function resolve(cells: Cell[], pulse: Line, act: Action, turn: number): { cells: Cell[]; fail: string | null; caught: boolean } {
  const next = clone(cells);
  let fail: string | null = null;
  let caught = false;
  const rod = act.kind === "rod" ? act.line : null;
  if (act.kind === "catch") {
    const cell = next[act.r * N + act.c];
    if (cell.leak > 0) {
      cell.leak = 0;
      caught = true;
    }
  }

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const cell = next[r * N + c];
      if (cell.xe > 0) {
        cell.p = Math.max(0, cell.p - 1);
        cell.xe -= 1;
      }
      if (rod && onLine(r, c, rod)) cell.p = Math.max(0, cell.p - 1);
      if (onLine(r, c, pulse) && !(rod && onLine(r, c, rod))) cell.p += 1;
      if (cell.p >= 2) cell.xe = Math.min(2, cell.xe + 1);
      if (cell.p >= HOT) fail = "HOT. One assembly through the fat of the curve. Holt: volume, not a speech.";
    }
  }

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const cell = next[r * N + c];
      if (cell.leak <= 0) continue;
      cell.leak += 1;
      if (cell.leak < 3) continue;
      const edge = r === 0 || c === 0 || r === N - 1 || c === N - 1;
      if (edge) {
        cell.leak = 0;
        fail = fail ?? "Leak walked off the board. PNL. Catch is cheaper than a search.";
      } else {
        cell.leak = 0;
        const nr = r < 2 ? r - 1 : r + 1;
        const rr = Math.max(0, Math.min(N - 1, nr));
        next[rr * N + c].leak = Math.max(next[rr * N + c].leak, 2);
      }
    }
  }

  if (turn === 1 || turn === 3) {
    const spots = [
      [0, 0],
      [0, 3],
      [3, 0],
      [3, 3],
      [0, 1],
      [3, 2],
    ];
    const [sr, sc] = spots[turn % spots.length];
    if (next[sr * N + sc].leak === 0) next[sr * N + sc].leak = 1;
  }

  return { cells: next, fail, caught };
}

export function powerOf(cells: Cell[]) {
  return cells.reduce((a, c) => a + c.p, 0);
}
