"use client";

import { useEffect, useRef, useState } from "react";
import { Bezel } from "./Arcade";
import { playBlip, playCatch, playHuntMiss } from "./audio";

/** LOAD.CAB — the load is the opponent. Perfect-info, one action, then it moves.
 *  PWR rods from above (a row or a column). Xenon follows power. A leak at the edge is PNL.
 *  Teaching model — not a license. Not a quiz. */

const N = 4;
const TURNS = 5;
const W = 320;
const H = 180;
const OX = 56;
const OY = 34;
const CW = 52;
const CH = 32;
const HOT = 4;

type Axis = "row" | "col";
type Line = { axis: Axis; i: number };
type Cell = { p: number; xe: number; leak: number };
type Action = { kind: "rod"; line: Line } | { kind: "catch"; r: number; c: number };
type End = { ok: boolean; score: number; line: string };

const PULSE: Line[] = [
  { axis: "row", i: 1 },
  { axis: "col", i: 2 },
  { axis: "row", i: 0 },
  { axis: "col", i: 1 },
  { axis: "row", i: 2 },
];

function fresh(): Cell[] {
  const cells: Cell[] = [];
  for (let i = 0; i < N * N; i++) cells.push({ p: 0, xe: 0, leak: 0 });
  cells[1 * N + 1].p = 1;
  cells[2 * N + 2].p = 1;
  cells[0 * N + 3].leak = 1;
  return cells;
}

function onLine(r: number, c: number, line: Line) {
  return line.axis === "row" ? r === line.i : c === line.i;
}

function clone(cells: Cell[]) {
  return cells.map((c) => ({ ...c }));
}

function resolve(cells: Cell[], pulse: Line, act: Action, turn: number): { cells: Cell[]; fail: string | null; caught: boolean } {
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

function powerOf(cells: Cell[]) {
  return cells.reduce((a, c) => a + c.p, 0);
}

export function LoadGame({ onDone, onAbort }: { onDone: (score: number) => void; onAbort: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"brief" | "play" | "end">("brief");
  const [end, setEnd] = useState<End | null>(null);
  const [hud, setHud] = useState("turn 1 / 5");
  const endRef = useRef(false);

  useEffect(() => {
    if (phase !== "play") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let cells = fresh();
    let turn = 0;
    let telegraph = PULSE[0];
    let hover: { kind: "row" | "col" | "cell"; a: number; b?: number } | null = null;
    let flash = 0;
    let lastAct: Action | null = null;
    let caughtN = 0;
    let last = performance.now();
    let raf = 0;
    let resolving = 0;

    const paint = () => {
      ctx.fillStyle = "#07140f";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#f3e6d0";
      ctx.font = "8px monospace";
      ctx.fillText(`turn ${turn + 1}/${TURNS}  catch ${caughtN}  Σp ${powerOf(cells)}`, 8, 12);
      ctx.fillStyle = "#c9a227";
      const who = telegraph.axis === "row" ? `ROW ${telegraph.i + 1}` : `COL ${String.fromCharCode(65 + telegraph.i)}`;
      ctx.fillText(`pulse → ${who}`, 200, 12);

      const names = ["A", "B", "C", "D"];
      for (let c = 0; c < N; c++) {
        const x = OX + c * CW;
        const hotCol = hover?.kind === "col" && hover.a === c;
        ctx.fillStyle = telegraph.axis === "col" && telegraph.i === c ? "#c9a227" : hotCol ? "#6b8f71" : "#8a7864";
        ctx.fillRect(x, OY - 16, CW - 4, 12);
        ctx.fillStyle = "#07140f";
        ctx.fillText(names[c], x + 20, OY - 7);
      }
      for (let r = 0; r < N; r++) {
        const y = OY + r * CH;
        const hotRow = hover?.kind === "row" && hover.a === r;
        ctx.fillStyle = telegraph.axis === "row" && telegraph.i === r ? "#c9a227" : hotRow ? "#6b8f71" : "#8a7864";
        ctx.fillRect(OX - 22, y, 18, CH - 4);
        ctx.fillStyle = "#07140f";
        ctx.fillText(String(r + 1), OX - 15, y + 18);
      }

      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const cell = cells[r * N + c];
          const x = OX + c * CW;
          const y = OY + r * CH;
          const tel = onLine(r, c, telegraph);
          const hov = hover?.kind === "cell" && hover.a === r && hover.b === c;
          const pal = cell.p >= 3 ? "#b85c4a" : cell.p === 2 ? "#c4783a" : cell.p === 1 ? "#3d5c66" : "#1a1410";
          ctx.fillStyle = pal;
          ctx.fillRect(x, y, CW - 4, CH - 4);
          if (tel) {
            ctx.strokeStyle = "#c9a227";
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, CW - 5, CH - 5);
          }
          if (hov) {
            ctx.strokeStyle = "#6b8f71";
            ctx.strokeRect(x + 1.5, y + 1.5, CW - 7, CH - 7);
          }
          if (cell.xe > 0) {
            ctx.fillStyle = "#6b8f71";
            ctx.fillRect(x + 4, y + 4, 6, 6);
            if (cell.xe > 1) ctx.fillRect(x + 12, y + 4, 6, 6);
          }
          if (cell.leak > 0) {
            ctx.fillStyle = "#b85c4a";
            ctx.fillRect(x + CW - 16, y + 4, 8, 8);
            ctx.fillStyle = "#f3e6d0";
            ctx.fillText("L", x + CW - 14, y + 11);
          }
          if (lastAct?.kind === "rod" && flash > 0 && onLine(r, c, lastAct.line)) {
            ctx.fillStyle = `rgba(107,143,113,${Math.min(0.4, flash)})`;
            ctx.fillRect(x, y, CW - 4, CH - 4);
          }
          if (lastAct?.kind === "catch" && flash > 0 && lastAct.r === r && lastAct.c === c) {
            ctx.fillStyle = `rgba(201,162,39,${Math.min(0.45, flash)})`;
            ctx.fillRect(x, y, CW - 4, CH - 4);
          }
          ctx.fillStyle = "#f3e6d0";
          ctx.fillText(String(cell.p), x + 20, y + 20);
        }
      }

      if (flash > 0) {
        ctx.fillStyle = `rgba(201,162,39,${Math.min(0.35, flash)})`;
        ctx.fillRect(OX, OY, N * CW, N * CH);
      }
      ctx.fillStyle = "#8a7864";
      ctx.fillText("letter/number = rod that line   click L = catch   one action", 8, H - 8);
    };

    const hit = (mx: number, my: number): Action | null => {
      for (let c = 0; c < N; c++) {
        const x = OX + c * CW;
        if (mx >= x && mx < x + CW - 4 && my >= OY - 16 && my < OY - 4) return { kind: "rod", line: { axis: "col", i: c } };
      }
      for (let r = 0; r < N; r++) {
        const y = OY + r * CH;
        if (mx >= OX - 22 && mx < OX - 4 && my >= y && my < y + CH - 4) return { kind: "rod", line: { axis: "row", i: r } };
      }
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const x = OX + c * CW;
          const y = OY + r * CH;
          if (mx >= x && mx <= x + CW - 4 && my >= y && my <= y + CH - 4) {
            if (cells[r * N + c].leak > 0) return { kind: "catch", r, c };
            return { kind: "rod", line: { axis: "row", i: r } };
          }
        }
      }
      return null;
    };

    const hoverAt = (mx: number, my: number) => {
      for (let c = 0; c < N; c++) {
        const x = OX + c * CW;
        if (mx >= x && mx < x + CW - 4 && my >= OY - 16 && my < OY - 4) {
          hover = { kind: "col", a: c };
          return;
        }
      }
      for (let r = 0; r < N; r++) {
        const y = OY + r * CH;
        if (mx >= OX - 22 && mx < OX - 4 && my >= y && my < y + CH - 4) {
          hover = { kind: "row", a: r };
          return;
        }
      }
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const x = OX + c * CW;
          const y = OY + r * CH;
          if (mx >= x && mx <= x + CW - 4 && my >= y && my <= y + CH - 4) {
            hover = { kind: "cell", a: r, b: c };
            return;
          }
        }
      }
      hover = null;
    };

    const playAct = (act: Action) => {
      if (endRef.current || resolving > 0) return;
      if (act.kind === "catch" && cells[act.r * N + act.c].leak <= 0) {
        playHuntMiss();
        return;
      }
      lastAct = act;
      const out = resolve(cells, telegraph, act, turn);
      cells = out.cells;
      if (out.caught) {
        caughtN += 1;
        playCatch();
      } else playBlip("ok");
      flash = 0.45;
      resolving = 0.35;
      if (out.fail) {
        endRef.current = true;
        setEnd({ ok: false, score: Math.max(1, turn), line: out.fail });
        return;
      }
      turn += 1;
      if (turn >= TURNS) {
        endRef.current = true;
        const score = caughtN >= 2 ? 9 : 7;
        setEnd({
          ok: true,
          score,
          line: "Five pulses. Xenon followed power. The leak did not walk. Teaching model — not a license.",
        });
        return;
      }
      telegraph = PULSE[turn];
      setHud(`turn ${turn + 1} / ${TURNS} · catch ${caughtN}`);
    };

    const down = (e: KeyboardEvent) => {
      if (e.code === "Escape") onAbort();
      const row = ["Digit1", "Digit2", "Digit3", "Digit4"].indexOf(e.code);
      const col = ["KeyA", "KeyB", "KeyC", "KeyD"].indexOf(e.code);
      if (row >= 0) playAct({ kind: "rod", line: { axis: "row", i: row } });
      if (col >= 0) playAct({ kind: "rod", line: { axis: "col", i: col } });
    };
    const move = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      hoverAt(((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H);
    };
    const click = (e: MouseEvent) => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const act = hit(((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H);
      if (act) playAct(act);
    };
    const touch = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (!t) return;
      const r = canvas.getBoundingClientRect();
      const act = hit(((t.clientX - r.left) / r.width) * W, ((t.clientY - r.top) / r.height) * H);
      if (act) playAct(act);
    };

    window.addEventListener("keydown", down);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mousedown", click);
    canvas.addEventListener("touchstart", touch, { passive: true });

    const loop = (now: number) => {
      if (endRef.current && resolving <= 0) {
        paint();
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      flash = Math.max(0, flash - dt * 1.6);
      resolving = Math.max(0, resolving - dt);
      paint();
      raf = requestAnimationFrame(loop);
    };
    paint();
    setHud("turn 1 / 5 · pulse on ROW 2");
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mousedown", click);
      canvas.removeEventListener("touchstart", touch);
    };
  }, [phase, onAbort]);

  if (phase === "brief") {
    return (
      <Bezel>
        <p className="font-mono text-xs tracking-widest text-good">LOAD.CAB  ·  the load is the opponent</p>
        <h2 className="font-display mt-2 text-2xl text-good">You see the next pulse</h2>
        <p className="mt-3 font-mono text-xs leading-relaxed text-good/80">
          Five turns. Gold outline is the load — it moves after you. Place <span className="text-good">one rod line</span> (a
          row or a column, PWR from above) or <span className="text-good">one catch</span> on a leak. Xenon follows power and
          bites next. A leak at the edge is PNL. If it walks off the board, you search. Catch is cheaper.
        </p>
        <p className="mt-2 font-mono text-xs leading-relaxed text-good/80">
          Not a quiz. Not a license. The load is the opponent. Delay still owns the slope. This board owns the night.
        </p>
        <button type="button" className="btn-primary mt-4" onClick={() => setPhase("play")} data-testid="load-start">
          Face the load
        </button>
        <button type="button" className="btn-ghost mt-2" onClick={onAbort}>
          Leave cabinet
        </button>
      </Bezel>
    );
  }

  if (end) {
    return (
      <Bezel>
        <p className="font-mono text-xs tracking-widest text-good">{end.ok ? "NIGHT.HELD" : "LOAD.WON"}</p>
        <h2 className="font-display mt-2 text-2xl text-good">{end.ok ? "The load moved. You placed." : "The load walked"}</h2>
        <p className="mt-3 font-mono text-sm leading-relaxed text-good/80">{end.line}</p>
        <p className="mt-2 font-mono text-xs text-good/70">Teaching core · 4×4 · rods from above · not a procedure</p>
        <button type="button" className="btn-primary mt-5" onClick={() => onDone(end.score)} data-testid="load-leave">
          Leave cabinet
        </button>
      </Bezel>
    );
  }

  return (
    <Bezel>
      <p className="font-mono text-xs tracking-widest text-good">LOAD.CAB  ·  perfect information  ·  not a license</p>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="mt-2 w-full cursor-pointer border border-[#3d5c66] touch-none"
        style={{ imageRendering: "pixelated" }}
        data-testid="load-canvas"
      />
      <p data-testid="load-hud" className="mt-2 font-mono text-[10px] text-good/70">
        {hud}. Gold = next pulse. Leaf square = xenon. Red L = leak. 1–4 rod a row, A–D a column.
      </p>
      <button type="button" className="btn-ghost mt-2" onClick={onAbort}>
        Leave cabinet
      </button>
    </Bezel>
  );
}
