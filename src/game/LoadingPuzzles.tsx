"use client";

import { useMemo, useState } from "react";
import { fluxOf, type Burn } from "./shuffleModel";
import { gradePuzzle, loadingPuzzles, notePuzzleMet, PUZZLE_ENRICH, PUZZLE_LINES, readPuzzleMet, type Puzzle } from "./puzzleBoards";
import { juiceClass, prefersReducedMotion } from "./reducedMotion";

function heat(v: number, max: number) {
  const t = Math.max(0, Math.min(1, v / (max * 1.02)));
  const r = Math.round(40 + t * 200);
  const g = Math.round(180 - t * 140);
  const b = Math.round(90 - t * 70);
  return `rgba(${r},${g},${b},0.55)`;
}

export function LoadingPuzzles({ onClose }: { enrich?: number; onClose: () => void }) {
  const puzzles = useMemo(() => loadingPuzzles(), []);
  const [open, setOpen] = useState<Puzzle | null>(null);
  const [grid, setGrid] = useState<Burn[] | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [met, setMet] = useState<number[]>(() => readPuzzleMet());
  const [verdict, setVerdict] = useState("");

  const openPuzzle = (p: Puzzle) => {
    setOpen(p);
    setGrid(p.start.slice() as Burn[]);
    setSel(null);
    setMoves(0);
    setVerdict("");
  };

  const click = (i: number) => {
    if (!grid || !open) return;
    if (moves >= open.limit && verdict === PUZZLE_LINES.out) return;
    if (sel === null) return setSel(i);
    if (sel === i) return setSel(null);
    const next = grid.slice() as Burn[];
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

  const flux = grid ? fluxOf(grid, PUZZLE_ENRICH) : null;
  const solved = !!(open && grid && verdict.startsWith(PUZZLE_LINES.met));

  return (
    <div className="absolute inset-0 z-30 overflow-y-auto bg-[#1a1410]/85 px-3 pb-28 pt-16 sm:px-8">
      <div className="mx-auto max-w-3xl border-8 border-[#1a1410] bg-[#f3e6d0] p-4 shadow-[0_0_0_4px_#c4783a] sm:p-6" data-testid="loading-puzzles">
        <p className="font-mono text-xs tracking-widest text-[#8a4820]">LOADING PUZZLES · teaching only</p>
        <h2 className="font-display mt-2 text-2xl text-[#1a1410]">Ten cores</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#3a2818]">{PUZZLE_LINES.note}</p>
        {open && grid && flux ? (
          <>
            <p className="mt-3 font-mono text-xs text-[#3a2818]" data-testid="puzzle-peak">
              Puzzle {open.id}. Fq {flux.fq.toFixed(3)} under {open.fqMax.toFixed(3)}. Rim {(flux.rim * 100).toFixed(1)}% under 50%.
            </p>
            <p className="mt-1 font-mono text-xs text-[#3a2818]" data-testid="puzzle-moves">
              Moves {moves}. Par {open.par}. Limit {open.limit}.
            </p>
            <div className="mt-3 grid grid-cols-6 gap-1" style={{ maxWidth: 360 }} data-testid={solved ? "puzzle-solved" : "puzzle-board"}>
              {grid.map((b, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => click(i)}
                  data-testid={`puzzle-cell-${i}`}
                  className="relative aspect-square overflow-hidden border font-mono text-[10px]"
                  style={{
                    borderColor: sel === i ? "#f3e6d0" : "#1a1410",
                    color: "#f3e6d0",
                    backgroundColor: heat(flux.power[i], flux.max),
                    backgroundImage: `url(/art/gen/ui/fuel_${b === 0 ? "F" : b}.png?v=art101)`,
                    backgroundSize: "32px 32px",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    imageRendering: "pixelated",
                  }}
                >
                  {b === 0 ? "F" : b}
                </button>
              ))}
            </div>
            <p className={"mt-3 text-sm " + (solved ? juiceClass(prefersReducedMotion()) : "")} data-juice={solved ? "grade" : undefined} data-testid="puzzle-verdict">
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
              {puzzles.map((p) => {
                const from = fluxOf(p.start, PUZZLE_ENRICH);
                return (
                  <li key={p.id}>
                    <button type="button" className="btn-ghost w-full text-left" data-testid={`puzzle-${p.id}`} onClick={() => openPuzzle(p)}>
                      {p.id}. {p.title}. Rim under 50%. From Fq {from.fq.toFixed(3)}. Par {p.par}
                      {met.includes(p.id) ? " · Met" : ""}
                    </button>
                  </li>
                );
              })}
            </ol>
            <button type="button" className="btn-ghost mt-4" data-testid="puzzles-close" onClick={onClose}>
              Back to the map
            </button>
          </>
        )}
        <p className="mt-3 text-[10px] text-[#8a7864]">36 assemblies, same flux model as the shuffle, enrichment 4.5%. F fresh, 1 once, 2 twice. Teaching model only.</p>
      </div>
    </div>
  );
}
