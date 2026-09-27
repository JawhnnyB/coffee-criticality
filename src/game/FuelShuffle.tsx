"use client";

import { useMemo, useState } from "react";
import type { PlantDesign, ShuffleCell } from "./plant";

const N = 6;
type Burn = 0 | 1 | 2;

function startMap(): Burn[] {
  const g: Burn[] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const r = Math.hypot(x - 2.5, y - 2.5);
      if (r < 1.6) g.push(0);
      else if (r < 2.6) g.push(1);
      else g.push(2);
    }
  }
  return g;
}

function fluxOf(grid: Burn[], enrich: number) {
  const power: number[] = [];
  let sum = 0;
  let max = 0;
  for (let i = 0; i < N * N; i++) {
    const x = i % N;
    const y = Math.floor(i / N);
    const r = Math.hypot(x - 2.5, y - 2.5) / 3.6;
    const fresh = 1.35 - grid[i] * 0.38;
    const shape = 1.12 - 0.55 * r;
    let couple = 0;
    const nbs = [i - 1, i + 1, i - N, i + N];
    for (const n of nbs) {
      if (n < 0 || n >= N * N) continue;
      if (Math.abs((n % N) - x) + Math.abs(Math.floor(n / N) - y) !== 1) continue;
      couple += 0.08 * (1.2 - grid[n] * 0.3);
    }
    const p = Math.max(0.15, fresh * shape * (0.85 + enrich / 10) + couple);
    power.push(p);
    sum += p;
    if (p > max) max = p;
  }
  const avg = sum / (N * N);
  return { power, fq: max / avg, avg, max };
}

function heat(v: number, max: number) {
  const t = Math.max(0, Math.min(1, v / (max * 1.02)));
  const r = Math.round(40 + t * 200);
  const g = Math.round(180 - t * 140);
  const b = Math.round(90 - t * 70);
  return `rgb(${r},${g},${b})`;
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
  const edgeFresh = edgeFreshCount(grid);
  const ok = flux.fq < 1.48 && edgeFresh <= 4 && swaps >= 3;

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
    <div className="absolute inset-0 z-30 overflow-y-auto bg-[#0d2018] px-4 pb-28 pt-16 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs tracking-widest text-good">
          FUEL.SHUFFLE  ·  {plant.type.toUpperCase()}  ·  {plant.enrich}%  ·  {practice ? "practice" : "outage"}  ·  teaching only
        </p>
        <h2 className="font-mono mt-2 text-2xl text-good">Program the core</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-good/80">
          Fresh in the dead center peaking. Twice-burned belongs on the rim. Click two assemblies to swap.
          Hold Fq under 1.48 and keep fresh off the fence.
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
                  backgroundImage: `linear-gradient(${heat(flux.power[i], flux.max)}aa, ${heat(flux.power[i], flux.max)}66), url(/art/gen/ui/fuel_${b === 0 ? "F" : b}.png?v=art101)`,
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
          <div className="font-mono text-xs text-good">
            <p>Fq {flux.fq.toFixed(3)}</p>
            <p className="mt-1">Fresh on edge {edgeFresh}</p>
            <p className="mt-1">Swaps {swaps}</p>
            <p className="mt-3 text-good/70">F fresh · 1 once · 2 twice</p>
            <p className="mt-3 text-good/70">Color is flux. Red is a peak you will have to explain.</p>
            {ok ? <p className="mt-3 text-fg">Band held. Priya can sign this.</p> : <p className="mt-3">Not yet.</p>}
            <p className="mt-3 text-[10px] text-good/60">Teaching model only — not a license. Fq is a classroom proxy.</p>
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

function edgeFreshCount(grid: Burn[]) {
  let n = 0;
  for (let i = 0; i < N * N; i++) {
    const x = i % N;
    const y = Math.floor(i / N);
    if ((x === 0 || y === 0 || x === N - 1 || y === N - 1) && grid[i] === 0) n += 1;
  }
  return n;
}
