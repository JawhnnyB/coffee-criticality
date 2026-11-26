"use client";

import { useMemo, useState } from "react";
import type { PlantDesign, ShuffleCell } from "./plant";
import { type Burn, FQ_MAX, N, RIM_MAX, fluxOf, passes, startMap } from "./shuffleModel";
import { LoadingPuzzles } from "./LoadingPuzzles";

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
  review,
}: {
  plant: PlantDesign;
  onDone: (fq: number, map: ShuffleCell[]) => void;
  onAbort: () => void;
  practice?: boolean;
  /** Flux map Friday (campaign.ts): no fuel moves. Read the core you signed at the last outage and find its peak. */
  review?: { map: ShuffleCell[] | null; where: string };
}) {
  if (review) return <FluxMap plant={plant} review={review} onDone={onDone} onAbort={onAbort} />;
  return <ShuffleDesk plant={plant} onDone={onDone} onAbort={onAbort} practice={practice} />;
}

function ShuffleDesk({
  plant,
  onDone,
  onAbort,
  practice,
}: {
  plant: PlantDesign;
  onDone: (fq: number, map: ShuffleCell[]) => void;
  onAbort: () => void;
  practice: boolean;
}) {
  const [grid, setGrid] = useState<Burn[]>(() => startMap());
  const [sel, setSel] = useState<number | null>(null);
  const [swaps, setSwaps] = useState(0);
  const [challenges, setChallenges] = useState(false);
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

  if (challenges) return <LoadingPuzzles enrich={plant.enrich} onClose={() => setChallenges(false)} />;

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
        {!practice ? (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#3a2818]" data-testid="shuffle-plan-note">
            This small core is where you work out the plan. Once you sign it, the Refuelling Outage on the desk lays the
            real 193-assembly core out the same way, and runs the cycle to see if your plan holds.
          </p>
        ) : null}
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
          <button type="button" className="btn-ghost" data-testid="shuffle-challenges" onClick={() => setChallenges(true)}>
            Challenges
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

function fromMap(map: ShuffleCell[] | null): Burn[] {
  if (!map || map.length !== N * N) return startMap();
  const burn: Record<ShuffleCell["cycle"], Burn> = { F: 0, "1": 1, "2": 2 };
  const out = startMap();
  for (const c of map) out[c.i * N + c.j] = burn[c.cycle] ?? 1;
  return out;
}

/**
 * Flux map Friday. In a real plant, movable detectors are run through the core every month or so and the measured
 * power map is checked against the prediction. Here: the colours are hidden until you've found the peak. Each tap
 * reads one assembly's detector, as a share of the core's hottest. Three misses and the map is shown anyway.
 */
function FluxMap({
  plant,
  review,
  onDone,
  onAbort,
}: {
  plant: PlantDesign;
  review: { map: ShuffleCell[] | null; where: string };
  onDone: (fq: number, map: ShuffleCell[]) => void;
  onAbort: () => void;
}) {
  const grid = useMemo(() => fromMap(review.map), [review.map]);
  const flux = useMemo(() => fluxOf(grid, plant.enrich), [grid, plant.enrich]);
  const peak = useMemo(() => flux.power.indexOf(Math.max(...flux.power)), [flux]);
  const [reads, setReads] = useState<Record<number, number>>({});
  const [found, setFound] = useState(false);
  const misses = Object.keys(reads).filter((k) => Number(k) !== peak).length;
  const shown = found || misses >= 3;
  const read = (i: number) => {
    if (shown) return;
    const share = flux.power[i] / flux.max;
    setReads((r) => ({ ...r, [i]: share }));
    if (i === peak || share >= 0.995) setFound(true);
  };
  const last = Object.entries(reads).pop();
  return (
    <div className="absolute inset-0 z-30 overflow-y-auto bg-[#1a1410]/85 px-3 pb-28 pt-16 sm:px-8" data-testid="flux-map">
      <div className="mx-auto max-w-3xl border-8 border-[#1a1410] bg-[#f3e6d0] p-4 shadow-[0_0_0_4px_#c4783a] sm:p-6">
        <div className="font-mono text-xs tracking-widest text-[#8a4820]">
          FLUX.MAP  ·  {plant.type.toUpperCase()}  ·  {review.where}  ·  teaching only
        </div>
        <h2 className="font-display mt-2 text-2xl text-[#1a1410]">Find the peak</h2>
        <div className="mt-2 max-w-xl text-sm leading-relaxed text-[#3a2818]">
          No fuel moves today. The detectors have been run through the core, and the map is in, but the colours are
          hidden. Tap the assembly you think carries the most power. Each tap reads that assembly&apos;s detector as a
          share of the hottest. Fresh fuel with fresh neighbours, near the middle, is where to look.
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_11rem]">
          <div className="grid grid-cols-6 gap-1">
            {grid.map((b, i) => (
              <button
                key={i}
                type="button"
                data-testid={`flux-cell-${i}`}
                onClick={() => read(i)}
                className="relative aspect-square overflow-hidden rounded-sm border text-[10px] font-mono"
                style={{
                  borderColor: shown && i === peak ? "#f3e6d0" : "#1a1410",
                  borderWidth: shown && i === peak ? 3 : 1,
                  color: "#f3e6d0",
                  backgroundColor: shown ? heat(flux.power[i], flux.max, 0.6) : reads[i] != null ? heat(flux.power[i], flux.max, 0.45) : "#3a2818",
                  backgroundImage: `url(/art/gen/ui/fuel_${b === 0 ? "F" : b}.png?v=art101)`,
                  backgroundSize: "32px 32px",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  imageRendering: "pixelated",
                }}
              >
                {reads[i] != null ? (
                  <span
                    className="absolute inset-x-0 bottom-0 font-mono text-[11px] leading-tight"
                    style={{ background: "rgba(22,17,13,0.82)", color: "#f3e6d0" }}
                  >
                    {Math.round(reads[i] * 100)}%
                  </span>
                ) : b === 0 ? "F" : b === 1 ? "1" : "2"}
              </button>
            ))}
          </div>
          <div className="font-mono text-xs text-[#3a2818]">
            <div>Reads {Object.keys(reads).length}</div>
            <div className="mt-1">Misses {misses} of 3</div>
            <div className="mt-3 text-[#6a4a32]">F fresh · 1 once · 2 twice</div>
            {found ? (
              <div className="mt-3 text-[#1a1410]" data-testid="flux-found">
                That&apos;s the peak. Fq {flux.fq.toFixed(2)}. Priya will want to hear why it&apos;s there.
              </div>
            ) : shown ? (
              <div className="mt-3 text-[#1a1410]" data-testid="flux-shown">
                The map, in full. The peak is outlined. Fq {flux.fq.toFixed(2)}. Look at what&apos;s around it.
              </div>
            ) : last ? (
              <div className="mt-3">That one reads {Math.round(Number(last[1]) * 100)}% of the hottest. Keep looking.</div>
            ) : (
              <div className="mt-3">Tap an assembly to read it.</div>
            )}
            {shown && flux.fq > FQ_MAX ? (
              <div className="mt-2 text-[#8a4820]" data-testid="flux-over">
                Above the {FQ_MAX.toFixed(2)} band. Nothing moves today, but this is what the next reload has to fix.
              </div>
            ) : null}
            <div className="mt-3 text-[10px] text-[#8a7864]">Teaching model only — not a license. Fq is a classroom proxy.</div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" onClick={onAbort}>
            Leave desk
          </button>
          <button type="button" className="btn-primary" data-testid="flux-sign" disabled={!shown} onClick={() => onDone(flux.fq, toMap(grid))}>
            {shown ? "Sign the flux map" : "Find the peak"}
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
