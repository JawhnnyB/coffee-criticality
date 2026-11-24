"use client";

import { useMemo, useState } from "react";
import { N, fluxOf, type Burn } from "./shuffleModel";
import { gradePuzzle, loadingPuzzles, notePuzzleMet, PUZZLE_LINES, readPuzzleMet, type Puzzle } from "./loadingPuzzles";

export function LoadingPuzzles({ enrich, onClose }: { enrich: number; onClose: () => void }) {
  const puzzles = useMemo(() => loadingPuzzles(enrich), [enrich]);
  const [open, setOpen] = useState<Puzzle | null>(null);
  const [grid, setGrid] = useState<Burn[] | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [met, setMet] = useState<number[]>(() => readPuzzleMet());
  const [verdict, setVerdict] = useState<string>("");

  const openPuzzle = (p: Puzzle) => {
    setOpen(p);
    setGrid(p.grid.slice());
    setSel(null);
    setVerdict("");
  };

  const click = (i: number) => {
    if (!grid) return;
    if (sel === null) return setSel(i);
    if (sel === i) return setSel(null);
    const next = grid.slice();
    const a = next[sel];
    next[sel] = next[i];
    next[i] = a;
    setGrid(next);
    setSel(null);
    setVerdict("");
  };

  const grade = () => {
    if (!open || !grid) return;
    const g = gradePuzzle(open, grid, enrich);
    if (g.met) {
      setMet(notePuzzleMet(open.id));
      setVerdict(PUZZLE_LINES.met);
    } else {
      setVerdict(PUZZLE_LINES.over);
    }
  };

  const fq = grid ? fluxOf(grid, enrich).fq : 0;

  return (
    <div className="absolute inset-0 z-30 overflow-y-auto bg-[#1a1410]/85 px-3 pb-28 pt-16 sm:px-8">
      <div className="mx-auto max-w-3xl border-8 border-[#1a1410] bg-[#f3e6d0] p-4 shadow-[0_0_0_4px_#c4783a] sm:p-6" data-testid="loading-puzzles">
        <p className="font-mono text-xs tracking-widest text-[#8a4820]">LOADING PUZZLES · teaching only</p>
        <h2 className="font-display mt-2 text-2xl text-[#1a1410]">Ten peaks</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#3a2818]">{PUZZLE_LINES.note}</p>
        {open && grid ? (
          <>
            <p className="mt-3 font-mono text-xs text-[#3a2818]" data-testid="puzzle-peak">
              Puzzle {open.id}. Peak {fq.toFixed(3)}. Target {open.targetFq.toFixed(3)}.
            </p>
            <div className="mt-3 grid grid-cols-6 gap-1" style={{ maxWidth: 280 }}>
              {grid.map((b, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => click(i)}
                  data-testid={`puzzle-cell-${i}`}
                  className="aspect-square border font-mono text-[10px]"
                  style={{ borderColor: sel === i ? "#f3e6d0" : "#1a1410", background: "#3a2818", color: "#f3e6d0" }}
                >
                  {b === 0 ? "F" : b}
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm" data-testid="puzzle-verdict">
              {verdict}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn-ghost" onClick={() => setOpen(null)}>
                List
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
                    {p.id}. Target {p.targetFq.toFixed(3)}{met.includes(p.id) ? " · Met" : ""}
                  </button>
                </li>
              ))}
            </ol>
            <button type="button" className="btn-ghost mt-4" data-testid="puzzles-close" onClick={onClose}>
              Back to the map
            </button>
          </>
        )}
        <p className="mt-3 text-[10px] text-[#8a7864]">{N} by {N}. Swap only. The fuel you were given stays the fuel you grade.</p>
      </div>
    </div>
  );
}
