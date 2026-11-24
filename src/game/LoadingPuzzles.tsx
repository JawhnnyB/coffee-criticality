"use client";

import { useMemo, useState } from "react";
import { gradePuzzle, loadingPuzzles, notePuzzleMet, peakOf, PUZZLE_LINES, readPuzzleMet, type Puzzle } from "./loadingPuzzles";

export function LoadingPuzzles({ onClose }: { enrich?: number; onClose: () => void }) {
  const puzzles = useMemo(() => loadingPuzzles(), []);
  const [open, setOpen] = useState<Puzzle | null>(null);
  const [grid, setGrid] = useState<string[] | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [met, setMet] = useState<number[]>(() => readPuzzleMet());
  const [verdict, setVerdict] = useState("");

  const openPuzzle = (p: Puzzle) => {
    setOpen(p);
    setGrid(p.start.slice());
    setSel(null);
    setMoves(0);
    setVerdict("");
  };

  const click = (i: number) => {
    if (!grid || !open) return;
    if (moves >= open.limit && verdict === PUZZLE_LINES.out) return;
    if (sel === null) return setSel(i);
    if (sel === i) return setSel(null);
    const next = grid.slice();
    const a = next[sel];
    next[sel] = next[i];
    next[i] = a;
    const n = moves + 1;
    setGrid(next);
    setMoves(n);
    setSel(null);
    if (n > open.limit) setVerdict(PUZZLE_LINES.out);
    else setVerdict("");
  };

  const grade = () => {
    if (!open || !grid) return;
    const g = gradePuzzle(open, grid, moves);
    if (g.met) {
      setMet(notePuzzleMet(open.id));
      setVerdict(`${PUZZLE_LINES.met} ${g.grade}.`);
    } else {
      setVerdict(moves > open.limit ? PUZZLE_LINES.out : PUZZLE_LINES.over);
    }
  };

  const peak = grid ? peakOf(grid) : 0;
  const solved = !!(open && grid && verdict.startsWith(PUZZLE_LINES.met));

  return (
    <div className="absolute inset-0 z-30 overflow-y-auto bg-[#1a1410]/85 px-3 pb-28 pt-16 sm:px-8">
      <div className="mx-auto max-w-3xl border-8 border-[#1a1410] bg-[#f3e6d0] p-4 shadow-[0_0_0_4px_#c4783a] sm:p-6" data-testid="loading-puzzles">
        <p className="font-mono text-xs tracking-widest text-[#8a4820]">LOADING PUZZLES · teaching only</p>
        <h2 className="font-display mt-2 text-2xl text-[#1a1410]">Ten peaks</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#3a2818]">{PUZZLE_LINES.note}</p>
        {open && grid ? (
          <>
            <p className="mt-3 font-mono text-xs text-[#3a2818]" data-testid="puzzle-peak">
              Puzzle {open.id}. {open.title}. Peak {peak.toFixed(3)}. Target {peakOf(open.target).toFixed(3)}.
            </p>
            <p className="mt-1 font-mono text-xs text-[#3a2818]" data-testid="puzzle-moves">
              Moves {moves}. Par {open.par}. Limit {open.limit}.
            </p>
            <div className="mt-3 grid grid-cols-8 gap-1" style={{ maxWidth: 360 }} data-testid={solved ? "puzzle-solved" : "puzzle-board"}>
              {grid.map((b, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => click(i)}
                  data-testid={`puzzle-cell-${i}`}
                  className="aspect-square border font-mono text-[11px]"
                  style={{ borderColor: sel === i ? "#f3e6d0" : "#1a1410", background: b === open.target[i] ? "#6a4a32" : "#3a2818", color: "#f3e6d0" }}
                >
                  {b}
                </button>
              ))}
            </div>
            <p className="mt-2 font-mono text-[10px] text-[#6a4a32]">Target {open.target.join(" ")}</p>
            <p className="mt-3 text-sm" data-testid="puzzle-verdict">
              {verdict}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn-ghost" onClick={() => setOpen(null)}>
                List
              </button>
              <button type="button" className="btn-ghost" data-testid="puzzle-reset" onClick={() => openPuzzle(open)}>
                Reset
              </button>
              <button type="button" className="btn-primary" data-testid="puzzle-grade" onClick={grade}>
                Grade
              </button>
            </div>
          </>
        ) : (
          <>
            <ol className="mt-3 grid gap-1">
              {puzzles.map((p) => (
                <li key={p.id}>
                  <button type="button" className="btn-ghost w-full text-left" data-testid={`puzzle-${p.id}`} onClick={() => openPuzzle(p)}>
                    {p.id}. {p.title}. Par {p.par}. Target peak {peakOf(p.target).toFixed(3)}
                    {met.includes(p.id) ? " · Met" : ""}
                  </button>
                </li>
              ))}
            </ol>
            <button type="button" className="btn-ghost mt-4" data-testid="puzzles-close" onClick={onClose}>
              Back to the map
            </button>
          </>
        )}
        <p className="mt-3 text-[10px] text-[#8a7864]">Eight assemblies. Swap two at a time. The fuel you were given stays the fuel you grade.</p>
      </div>
    </div>
  );
}
