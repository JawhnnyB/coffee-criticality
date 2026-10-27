"use client";

import { useMemo, useState } from "react";
import type { PlantDesign, ShuffleCell } from "./plant";
import { type Burn, FQ_MAX, N, RIM_MAX, fluxOf, passes, startMap } from "./shuffleModel";

/** rgba(), not "rgb(...)aa": an rgb() with a hex-alpha suffix is invalid CSS and drops the whole declaration. */
function heat(v: number, max: number, alpha: number) {
  const t = Math.max(0, Math.min(1, v / (max * 1.02)));
  const r = Math.round(40 + t * 200);
  const g = Math.round(180 - t * 140);
  const b = Math.round(90 - t * 70);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function FuelShuffle({
  plant,
  onDone,
  onAbort,
  practice = false,
}: {
  plant: PlantDesign;
  onDone: (fq: number, map: ShuffleCell[]) => void;
  onAbort: () => void;
  practice?: boolean;
}) {
  const [grid, setGrid] = useState<Burn[]>(() => startMap());
  const [sel, setSel] = useState<number | null>(null);
  const [swaps, setSwaps] = useState(0);
  const flux = useMemo(() => fluxOf(grid, plant.enrich), [grid, plant.enrich]);
  const ok = passes(flux, swaps);

  const click = (i: number) => {
    if (sel === null) {
      setSel(i);
      return;
    }
    if (sel === i) {
      setSel(null);
      return;
    }
    const next = grid.slice();
    const a = next[sel];
    next[sel] = next[i];
    next[i] = a;
    setGrid(next);
    setSel(null);
    setSwaps((n) => n + 1);
  };

  return (
    <div className="absolute inset-0 z-30 overflow-y-auto bg-[#1a1410]/85 px-3 pb-28 pt-16 sm:px-8">
      <div className="mx-auto max-w-3xl border-8 border-[#1a1410] bg-[#f3e6d0] p-4 shadow-[0_0_0_4px_#c4783a] sm:p-6">
        <p className="font-mono text-xs tracking-widest text-[#8a4820]">
          FUEL.SHUFFLE  ·  {plant.type.toUpperCase()}  ·  {plant.enrich}%  ·  {practice ? "practice" : "outage"}  ·  teaching only
        </p>
        <h2 className="font-display mt-2 text-2xl text-[#1a1410]">Program the core</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#3a2818]">
          Fresh in the middle peaks the core. Fresh on the rim flattens it but the rim leaks. Click two assemblies to
          swap. Hold Fq under {FQ_MAX.toFixed(2)} and keep the rim share at {Math.round(RIM_MAX * 100)}% or less:
          burned toward the fence, fresh scattered inside.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_11rem]">
          <div className="grid grid-cols-6 gap-1">
            {grid.map((b, i) => (
              <button
                key={i}
                type="button"
                onClick={() => click(i)}
                className="relative aspect-square overflow-hidden rounded-sm border text-[10px] font-mono"
                style={{
                  borderColor: sel === i ? "#f3e6d0" : "#1a1410",
                  color: "#f3e6d0",
                  backgroundColor: heat(flux.power[i], flux.max, 0.6),
                  backgroundImage: `url(/art/gen/ui/fuel_${b === 0 ? "F" : b}.png?v=art101)`,
                  backgroundSize: "32px 32px",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  imageRendering: "pixelated",
                }}
              >
                {b === 0 ? "F" : b === 1 ? "1" : "2"}
              </button>
            ))}
          </div>
          <div className="font-mono text-xs text-[#3a2818]">
            <p>Fq {flux.fq.toFixed(3)}</p>
            <p className="mt-1">Rim share {(flux.rim * 100).toFixed(0)}%</p>
            <p className="mt-1">Swaps {swaps}</p>
            <p className="mt-3 text-[#6a4a32]">F fresh · 1 once · 2 twice</p>
            <p className="mt-3 text-[#6a4a32]">Color is flux. Red is a peak you will have to explain.</p>
            {ok ? <p className="mt-3 text-[#1a1410]">Band held. Priya can sign this.</p> : <p className="mt-3">Not yet.</p>}
            <p className="mt-3 text-[10px] text-[#8a7864]">Teaching model only — not a license. Fq is a classroom proxy.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" onClick={onAbort}>
            Leave desk
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!ok}
            onClick={() => onDone(flux.fq, toMap(grid))}
          >
            {ok ? (practice ? "Practice held" : "Sign the shuffle") : "Hold Fq"}
          </button>
        </div>
      </div>
    </div>
  );
}

function toMap(grid: Burn[]): ShuffleCell[] {
  const cycle: Record<Burn, ShuffleCell["cycle"]> = { 0: "F", 1: "1", 2: "2" };
  const out: ShuffleCell[] = [];
  for (let i = 0; i < N * N; i++) {
    out.push({ i: Math.floor(i / N), j: i % N, cycle: cycle[grid[i]] });
  }
  return out;
}

