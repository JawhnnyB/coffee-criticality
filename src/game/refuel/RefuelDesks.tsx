/**
 * The Friday desks for the other reactor types (refuel/byType.ts): the BWR bundle bench and TIP traces, the pebble
 * bed's pass count, and the molten-salt site's salt loop. Same paper as the PWR fuel desk (FuelShuffle.tsx).
 * Teaching model, not a license.
 */
import { useMemo, useState, type ReactNode } from "react";
import * as B from "./bwrBundle";
import * as P from "./pebbleBed";
import * as S from "./saltLoop";

const INK = "#1a1410";
const PAPER = "#f3e6d0";

function Desk({
  testId,
  kicker,
  title,
  intro,
  children,
  onAbort,
  onSign,
  canSign,
  signLabel,
  practice,
}: {
  testId: string;
  kicker: string;
  title: string;
  intro: ReactNode;
  children: ReactNode;
  onAbort: () => void;
  onSign: () => void;
  canSign: boolean;
  signLabel: string;
  practice: boolean;
}) {
  return (
    <div className="absolute inset-0 z-30 overflow-y-auto bg-[#1a1410]/85 px-3 pb-28 pt-16 sm:px-8" data-testid={testId}>
      <div className="mx-auto max-w-4xl border-8 border-[#1a1410] p-4 shadow-[0_0_0_4px_#c4783a] sm:p-6" style={{ background: PAPER, color: INK }}>
        <div className="font-mono text-xs tracking-widest text-[#8a4820]">
          {kicker} · {practice ? "practice" : "Friday"} · teaching only
        </div>
        <h2 className="font-display mt-2 text-2xl">{title}</h2>
        <div className="mt-2 max-w-2xl text-sm leading-relaxed text-[#3a2818]">{intro}</div>
        <div className="mt-4">{children}</div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" onClick={onAbort} style={{ minHeight: 44 }}>
            Leave desk
          </button>
          <button type="button" className="btn-primary" data-testid={`${testId}-sign`} disabled={!canSign} onClick={onSign} style={{ minHeight: 44 }}>
            {signLabel}
          </button>
        </div>
        <div className="mt-2 text-[10px] text-[#8a7864]">Teaching model only — not a license. Teaching numbers throughout.</div>
      </div>
    </div>
  );
}

function Checklist<T extends { id: string; label: string; value: string; ok: boolean; why: string }>({ items, testId }: { items: T[]; testId: string }) {
  return (
    <div className="space-y-1 font-mono text-[11px]" data-testid={testId}>
      {items.map((c) => (
        <div key={c.id} data-testid={`${testId}-${c.id}`} data-ok={c.ok ? "yes" : "no"}>
          <span style={{ color: c.ok ? "#2f6b3a" : "#a8322a" }}>{c.ok ? "✓" : "✗"}</span> {c.label}: <strong>{c.value}</strong>
          {c.ok ? null : <div className="pl-4 font-sans text-[11px] leading-snug text-[#6a4a32]">{c.why}</div>}
        </div>
      ))}
    </div>
  );
}

/** A column of bars, top of the core at the top. */
function AxialBars({ values, labels, max, color, testId, onPick, hidden }: { values: number[]; labels?: string[]; max: number; color: string; testId: string; onPick?: (i: number) => void; hidden?: boolean[] }) {
  const rows = values.map((v, i) => ({ v, i })).reverse();
  return (
    <div className="space-y-[2px]" data-testid={testId}>
      {rows.map(({ v, i }) => (
        <button
          key={i}
          type="button"
          data-testid={`${testId}-${i}`}
          disabled={!onPick}
          onClick={() => onPick?.(i)}
          className="flex w-full items-center gap-1 text-left font-mono text-[10px]"
          style={{ minHeight: onPick ? 24 : 14, cursor: onPick ? "pointer" : "default" }}
        >
          <span className="w-7 shrink-0 text-right text-[#6a4a32]">{labels?.[i] ?? i + 1}</span>
          <span className="relative h-3 flex-1 bg-[#e6d5b8]">
            {hidden?.[i] ? null : <span className="absolute inset-y-0 left-0" style={{ width: `${Math.min(100, (v / max) * 100)}%`, background: color }} />}
          </span>
          <span className="w-9 shrink-0 text-right">{hidden?.[i] ? "?" : v.toFixed(2)}</span>
        </button>
      ))}
    </div>
  );
}

// --- BWR: the bundle bench -----------------------------------------------------------------------------------------

const PIN_COLOR: Record<B.Pin, string> = { L: "#ead48c", H: "#d9822b", G: "#6f8f6a" };
const LAYER_NAME = ["Bottom third", "Middle third", "Top third (part-length rods end below it)"];

export function BundleBench({
  start,
  practice,
  onDone,
  onAbort,
}: {
  start: B.Bundle | null;
  practice: boolean;
  onDone: (hottestPin: number, bundle: B.Bundle) => void;
  onAbort: () => void;
}) {
  const [bundle, setBundle] = useState<B.Bundle>(() => (start ? start.map((l) => l.slice()) : B.uniformBundle("H")));
  const [tool, setTool] = useState<B.Pin>("L");
  const r = useMemo(() => B.evaluate(bundle), [bundle]);
  const list = B.checks(r);
  const ok = list.every((c) => c.ok);
  const paint = (layer: number, i: number) =>
    setBundle((b) => b.map((l, k) => (k === layer ? l.map((p, j) => (j === i ? tool : p)) : l)));
  const copyTo = (from: number) => setBundle((b) => b.map(() => b[from].slice()));
  return (
    <Desk
      testId="bundle-bench"
      kicker="BUNDLE.BENCH · BWR · 10×10"
      title="Design the reload bundle"
      practice={practice}
      intro={
        <>
          One bundle, three layers, one boiling channel. Water enters at the bottom and leaves as a steam-water mix, so
          the bottom moderates best and power leans down. Gadolinia low down pushes it back up. The part-length rods
          end below the top layer, leaving room for water where the steam is thickest. Pins on the edges and corners
          sit by the water gap between bundles and run hot: give them lower enrichment.
        </>
      }
      onAbort={onAbort}
      onSign={() => onDone(r.hottestPin, bundle)}
      canSign={ok || practice}
      signLabel={practice ? "Done practising" : ok ? "Sign the bundle" : "Not yet within limits"}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Pin to place">
        {(["L", "H", "G"] as const).map((p) => (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={tool === p}
            data-testid={`pin-tool-${p}`}
            onClick={() => setTool(p)}
            className="flex items-center gap-2 border-2 px-2 font-mono text-[11px]"
            style={{ minHeight: 40, borderColor: tool === p ? INK : "#c9b69a", background: tool === p ? "#fff8ea" : "transparent" }}
          >
            <span className="inline-block h-4 w-4 rounded-full border border-[#1a1410]" style={{ background: PIN_COLOR[p] }} />
            {B.PIN_NAME[p]}
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <div className="space-y-3">
          {[2, 1, 0].map((layer) => {
            const L = r.layers[layer];
            return (
              <div key={layer} data-testid={`bundle-layer-${layer}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-[10px] text-[#6a4a32]">
                  <span>
                    {LAYER_NAME[layer]} · {L.pins} pins · avg {L.avgEnrich.toFixed(2)}% · {L.gad} Gd · pin peak {L.localPeak.toFixed(2)}
                  </span>
                  <button type="button" className="underline" onClick={() => copyTo(layer)} style={{ minHeight: 28 }}>
                    Copy to all layers
                  </button>
                </div>
                <div className="mt-1 grid w-fit grid-cols-10 gap-[2px] bg-[#9cb7c9] p-[3px]">
                  {bundle[layer].map((p, i) => {
                    const pin = B.hasPin(layer, i);
                    const water = B.WATER_RODS.has(i);
                    const hot = i === L.hotPin;
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={!pin}
                        data-testid={`pin-${layer}-${i}`}
                        aria-label={pin ? `${LAYER_NAME[layer]} pin ${i}: ${B.PIN_NAME[p]}` : water ? "water rod" : "water above a part-length rod"}
                        onClick={() => paint(layer, i)}
                        className="relative h-[24px] w-[24px] rounded-full sm:h-[26px] sm:w-[26px]"
                        style={{
                          background: pin ? PIN_COLOR[p] : water ? "#4f86ad" : "#c9dce8",
                          border: hot ? "3px solid #a8322a" : `1px solid ${pin ? INK : "#7fa3bb"}`,
                          borderRadius: water ? 3 : "9999px",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="space-y-3">
          <div>
            <div className="font-mono text-[11px] text-[#6a4a32]">Axial power, top of the core at the top (12 nodes)</div>
            <AxialBars values={r.power} max={2} color="#d9822b" testId="bundle-axial" />
            <div className="mt-1 font-mono text-[10px] text-[#6a4a32]">
              Void, bottom → top: {r.voidFrac.map((v) => `${Math.round(v * 100)}`).join(" · ")} %
            </div>
          </div>
          <Checklist items={list} testId="bundle-checks" />
        </div>
      </div>
    </Desk>
  );
}

// --- BWR: TIP traces -----------------------------------------------------------------------------------------------

/**
 * Weeks without an outage. A traversing in-core probe runs up a channel and reads the power at each height. The trace
 * is hidden until you find the peak: tap a height to read it. Where the cycle is decides the shape: early on the
 * gadolinia holds the bottom down; later it's burned out and the bottom has burned most, so the peak climbs.
 */
export function TipTrace({
  bundle,
  phase,
  where,
  onDone,
  onAbort,
}: {
  bundle: B.Bundle;
  phase: "boc" | "moc" | "eoc" | "eq";
  where: string;
  onDone: (fz: number) => void;
  onAbort: () => void;
}) {
  const st = useMemo(() => B.cycleState(phase), [phase]);
  const r = useMemo(() => B.evaluate(bundle, st), [bundle, st]);
  const peak = r.power.indexOf(Math.max(...r.power));
  const [reads, setReads] = useState<number[]>([]);
  const misses = reads.filter((i) => i !== peak).length;
  const found = reads.includes(peak);
  const shown = found || misses >= 3;
  const hidden = r.power.map((_, i) => !shown && !reads.includes(i));
  return (
    <Desk
      testId="tip-trace"
      kicker={`TIP.TRACE · BWR · ${where}`}
      title="Find the axial peak"
      practice={false}
      intro={
        <>
          No fuel moves this week. The probe has run up the channel of the bundle you designed. Tap a height to read
          it. Gadolinia left: about {Math.round(st.gadLeft * 100)}%. The bottom burns first, and as the gadolinia
          burns out the peak climbs.
        </>
      }
      onAbort={onAbort}
      onSign={() => onDone(r.fz)}
      canSign={shown}
      signLabel={shown ? "Sign the trace" : "Find the peak"}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
        <AxialBars values={r.power} max={2} color="#d9822b" testId="tip-node" onPick={(i) => !shown && setReads((x) => [...x, i])} hidden={hidden} />
        <div className="font-mono text-[11px]">
          <div>Reads {reads.length} · misses {misses} of 3</div>
          {found ? (
            <div className="mt-2" data-testid="tip-found">
              That&apos;s the peak: node {peak + 1} of 12, {r.fz.toFixed(2)} times the average.
            </div>
          ) : shown ? (
            <div className="mt-2" data-testid="tip-shown">
              The whole trace. The peak is node {peak + 1}, at {r.fz.toFixed(2)}.
            </div>
          ) : (
            <div className="mt-2">Tap a height to read the probe there.</div>
          )}
        </div>
      </div>
    </Desk>
  );
}

// --- Pebble bed: the pass count ------------------------------------------------------------------------------------

export function PassDesk({
  start,
  practice,
  onDone,
  onAbort,
}: {
  start: P.PassPlan | null;
  practice: boolean;
  onDone: (k: number, plan: P.PassPlan) => void;
  onAbort: () => void;
}) {
  const [plan, setPlan] = useState<P.PassPlan>(() => start ?? { passes: 2, burnup: 95 });
  const r = useMemo(() => P.evaluate(plan), [plan]);
  const list = P.checks(r, plan);
  const ok = list.every((c) => c.ok);
  return (
    <Desk
      testId="pass-desk"
      kicker="PEBBLE.DESK · PEBBLE BED · 250 MWt"
      title="Set how the pebbles move"
      practice={practice}
      intro={
        <>
          About 420,000 pebbles fall slowly through the core while it runs. At the bottom each one is measured: if
          it&apos;s burned enough it leaves, and a fresh one goes in on top; if not, it goes round again. You set how many
          trips a pebble gets, and the burnup that sends it out.
        </>
      }
      onAbort={onAbort}
      onSign={() => onDone(r.k, plan)}
      canSign={ok || practice}
      signLabel={practice ? "Done practising" : ok ? "Sign the settings" : "Not yet within limits"}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          <label className="block font-mono text-[11px]">
            Passes per pebble: <strong data-testid="pass-count">{plan.passes}</strong>
            <input
              type="range"
              min={1}
              max={25}
              step={1}
              value={plan.passes}
              data-testid="pass-slider"
              onChange={(e) => setPlan((p) => ({ ...p, passes: Number(e.target.value) }))}
              className="mt-1 block w-full"
              style={{ minHeight: 32 }}
            />
          </label>
          <label className="block font-mono text-[11px]">
            Discharge burnup: <strong data-testid="pass-burnup">{plan.burnup} GWd/t</strong>
            <input
              type="range"
              min={60}
              max={110}
              step={1}
              value={plan.burnup}
              data-testid="burnup-slider"
              onChange={(e) => setPlan((p) => ({ ...p, burnup: Number(e.target.value) }))}
              className="mt-1 block w-full"
              style={{ minHeight: 32 }}
            />
          </label>
          <div className="font-mono text-[11px] text-[#3a2818]">
            {Math.round(r.freshPerDay)} fresh pebbles a day · each pass about {Math.round(r.daysPerPass)} days
          </div>
          <Checklist items={list} testId="pass-checks" />
        </div>
        <div>
          <div className="font-mono text-[11px] text-[#6a4a32]">Power by height, top of the core at the top. Helium flows down.</div>
          <AxialBars values={r.power} labels={r.fuelC.map((t) => `${Math.round(t)}°`)} max={3} color="#c4783a" testId="pass-axial" />
          <div className="mt-1 font-mono text-[10px] text-[#6a4a32]">Left: hottest fuel at that height. Bars: power.</div>
        </div>
      </div>
    </Desk>
  );
}

// --- Molten salt: the salt loop ------------------------------------------------------------------------------------

export function SaltDesk({
  week,
  start,
  practice,
  onDone,
  onAbort,
}: {
  week: number;
  start: S.SaltPlan | null;
  practice: boolean;
  onDone: (maxC: number, plan: S.SaltPlan) => void;
  onAbort: () => void;
}) {
  const [plan, setPlan] = useState<S.SaltPlan>(() => start ?? S.START_PLAN);
  const ws = useMemo(() => S.weekStart(week), [week]);
  const run = useMemo(() => S.runWeek(plan, ws), [plan, ws]);
  const list = S.checks(run, plan);
  const ok = list.every((c) => c.ok);
  const W = 320;
  const H = 120;
  const lo = 620;
  const hi = 680;
  const y = (t: number) => H - ((Math.max(lo, Math.min(hi, t)) - lo) / (hi - lo)) * H;
  const x = (h: number) => (h / (7 * 24)) * W;
  const points = run.hours.map((h, i) => `${x(h).toFixed(1)},${y(run.tempC[i]).toFixed(1)}`).join(" ");
  const slider = (label: string, value: string, id: string, min: number, max: number, step: number, v: number, set: (n: number) => void) => (
    <label className="block font-mono text-[11px]">
      {label}: <strong>{value}</strong>
      <input type="range" min={min} max={max} step={step} value={v} data-testid={id} onChange={(e) => set(Number(e.target.value))} className="mt-1 block w-full" style={{ minHeight: 32 }} />
    </label>
  );
  return (
    <Desk
      testId="salt-desk"
      kicker="SALT.DESK · MOLTEN SALT · weekly sample"
      title="Balance the salt for the week"
      practice={practice}
      intro={
        <>
          The fuel is dissolved in the salt, so nothing moves and nothing is reloaded. Fission burns the fuel away; xenon
          leaves as a gas when the salt is sprayed in the pump bowl; lanthanides stay in the salt until cleanup takes
          them out. Whatever reactivity is left over shows up as salt temperature. Keep the outlet between {S.BAND.lowC}{" "}
          and {S.BAND.highC} °C for all seven days.
        </>
      }
      onAbort={onAbort}
      onSign={() => onDone(run.maxC, plan)}
      canSign={ok || practice}
      signLabel={practice ? "Done practising" : ok ? "Sign the week" : "Not yet within the band"}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          {slider("Fresh fuel fed a day", plan.feed.toFixed(1), "salt-feed", 0, S.LIMITS.feedMax, 0.1, plan.feed, (n) => setPlan((p) => ({ ...p, feed: n })))}
          {slider("Xenon stripped in the pump bowl", `${Math.round(plan.sparge * 100)}%`, "salt-sparge", 0, S.LIMITS.spargeMax, 0.05, plan.sparge, (n) => setPlan((p) => ({ ...p, sparge: n })))}
          {slider("Salt sent through cleanup a day", `${(plan.cleanup * 100).toFixed(1)}%`, "salt-cleanup", 0, S.LIMITS.cleanupMax, 0.005, plan.cleanup, (n) => setPlan((p) => ({ ...p, cleanup: n })))}
          <div className="font-mono text-[10px] text-[#6a4a32]">
            This week&apos;s salt: lanthanides ≈ {Math.round(ws.lanth)} pcm, xenon ≈ {Math.round(ws.xenon)} pcm.
          </div>
          <Checklist items={list} testId="salt-checks" />
        </div>
        <div>
          <div className="font-mono text-[11px] text-[#6a4a32]">Salt outlet over the week, °C</div>
          <svg viewBox={`0 0 ${W} ${H}`} className="mt-1 w-full border border-[#1a1410] bg-[#fff8ea]" data-testid="salt-chart" role="img" aria-label={`Salt outlet from ${Math.round(run.minC)} to ${Math.round(run.maxC)} °C`}>
            <rect x={0} y={y(S.BAND.highC)} width={W} height={y(S.BAND.lowC) - y(S.BAND.highC)} fill="#d8e8c9" />
            {[1, 2, 3, 4, 5, 6].map((d) => (
              <line key={d} x1={x(d * 24)} x2={x(d * 24)} y1={0} y2={H} stroke="#e6d5b8" />
            ))}
            <polyline points={points} fill="none" stroke={run.inBand ? "#2f6b3a" : "#a8322a"} strokeWidth={2} />
          </svg>
          <div className="flex justify-between font-mono text-[10px] text-[#6a4a32]">
            <span>Mon</span>
            <span>Sun</span>
          </div>
        </div>
      </div>
    </Desk>
  );
}
