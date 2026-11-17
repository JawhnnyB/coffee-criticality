"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { DT_BAND, thermalState, type PlantDesign, type PlantType, type RunState } from "./plant";
import { PixelSchematic } from "./PixelSchematic";
import { PlantCutaway } from "./PlantCutaway";
import { BENCH_HOLD, stepBench } from "./benchStep";
import { commandFor, panelFor, pebblePass, type OperatorMove } from "./siteControls";
import { paintEvent, pickEvent, resolveEvent, type EventView, type ShiftEvent } from "./siteEvents";
import { publishFace } from "./siteFace";

const PLANTS: { id: PlantType; title: string; note: string }[] = [
  { id: "pwr", title: "PWR", note: "Pressurized primary. Steam generators. Rods from above. Heat leaves with flow." },
  { id: "bwr", title: "BWR", note: "Boils in the vessel. Steam to the turbine. Rods from below." },
  { id: "pebble", title: "Pebble / TRISO", note: "Helium courier. Packed pebbles. Graphite reflector. Teaching only." },
  { id: "msr", title: "MSR / salt", note: "Fuel is the salt. Graphite channels. Freeze plug. Near-atm. Teaching only." },
];

const BAND: Record<PlantType, { lo: number; hi: number; hold: number }> = {
  pwr: { ...DT_BAND.pwr, hold: BENCH_HOLD.pwr },
  bwr: { ...DT_BAND.bwr, hold: BENCH_HOLD.bwr },
  pebble: { ...DT_BAND.pebble, hold: BENCH_HOLD.pebble },
  msr: { ...DT_BAND.msr, hold: BENCH_HOLD.msr },
};

/**
 * The bench runs `design`, the plant from the Builder. The old type picker is gone
 * from this view on purpose. Compare shows the other three types and does not switch the run.
 */
export function ReactorTrainer({
  onPass,
  onAbort,
  design,
  run,
  writeRun,
  onMinute,
  colorSafe = false,
}: {
  onPass: () => void;
  onAbort: () => void;
  design: PlantDesign | null;
  run: RunState;
  writeRun: (patch: Partial<Pick<RunState, "powerPct" | "flowPct" | "rodsWithdrawnPct" | "scram">>) => void;
  onMinute: (openMinutes: number) => void;
  colorSafe?: boolean;
}) {
  const plant = design?.type ?? null;
  const [rods, setRods] = useState(run.rodsWithdrawnPct);
  const [flow, setFlow] = useState(run.flowPct);
  const [power, setPower] = useState(run.powerPct);
  const [hold, setHold] = useState(0);
  const [scram, setScram] = useState(run.scram);
  const [passed, setPassed] = useState(false);
  const [compare, setCompare] = useState(false);
  const [msg, setMsg] = useState(
    design
      ? "This is the plant you designed. Match flow to power. Hold the ΔT band. Teaching only."
      : "The bench runs the reactor you design. Finish the builder first.",
  );
  const [drain, setDrain] = useState(false);
  const [drainSeconds, setDrainSeconds] = useState(0);
  const [passes, setPasses] = useState(0);
  const [burnup, setBurnup] = useState(0);
  const [call, setCall] = useState<ShiftEvent | null>(null);
  const [view, setView] = useState<EventView | null>(null);
  const viewRef = useRef<EventView | null>(null);
  viewRef.current = view;
  const drainRef = useRef(drain);
  const drainSecRef = useRef(drainSeconds);
  const passesRef = useRef(passes);
  const burnupRef = useRef(burnup);
  const rodsRef = useRef(rods);
  drainRef.current = drain;
  drainSecRef.current = drainSeconds;
  passesRef.current = passes;
  burnupRef.current = burnup;
  const flowRef = useRef(flow);
  const powerRef = useRef(power);
  const holdRef = useRef(hold);
  const writtenRef = useRef<number | null>(null);
  const precursorsRef = useRef<number | undefined>(undefined);
  const rodPosRef = useRef<number | undefined>(undefined);
  const [rhoPcm, setRhoPcm] = useState(0);
  const flowDesign = design?.flow ?? 100;
  const writeRef = useRef(writeRun);
  const minuteRef = useRef(onMinute);
  rodsRef.current = rods;
  flowRef.current = flow;
  writeRef.current = writeRun;
  minuteRef.current = onMinute;

  useEffect(() => {
    if (!plant) return;
    const move: OperatorMove = { rodsWithdrawnPct: rods, flowPct: flow, drain, drainSeconds, passes };
    const sim = commandFor(plant, power, move, scram);
    const base = panelFor(plant, move, sim, burnup);
    const panel = view ? paintEvent(base, view) : base;
    publishFace({ flowMul: panel.arrows ? 1 : 0, tubeMark: panel.tubeMark });
  }, [plant, rods, flow, drain, drainSeconds, passes, power, scram, burnup, view]);

  useEffect(
    () => () => {
      if (!viewRef.current) publishFace({ flowMul: 1, tubeMark: false });
    },
    [],
  );

  useEffect(() => {
    if (!plant || passed || scram) return;
    let last = performance.now();
    let acc = 0;
    let lastMin = -1;
    let raf = 0;
    let stopped = false;
    const loop = (now: number) => {
      if (stopped) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      acc += dt;
      const openMin = Math.floor(acc * 0.05);
      if (openMin !== lastMin) {
        lastMin = openMin;
        minuteRef.current(openMin);
      }
      if (plant === "msr" && drainRef.current) {
        drainSecRef.current += dt;
        setDrainSeconds(drainSecRef.current);
      }
      const move: OperatorMove = {
        rodsWithdrawnPct: rodsRef.current,
        flowPct: flowRef.current,
        drain: drainRef.current,
        drainSeconds: drainSecRef.current,
        passes: passesRef.current,
      };
      const step = stepBench({
        power: powerRef.current,
        rods: move.rodsWithdrawnPct,
        flow: move.flowPct,
        hold: holdRef.current,
        dt,
        plant,
        lastWritten: writtenRef.current,
        precursors: precursorsRef.current,
        rodPos: rodPosRef.current,
        flowRef: flowDesign,
      });
      precursorsRef.current = step.precursors;
      rodPosRef.current = step.rodPos;
      setRhoPcm(step.rhoPcm);
      let powerOut = step.power;
      let scramOut = step.scram;
      if (!step.scram && plant === "bwr") {
        powerOut = commandFor("bwr", step.power, move, false).powerPct;
      } else if (!step.scram && plant === "msr" && move.drain) {
        const cmd = commandFor("msr", step.power, move, false);
        powerOut = cmd.powerPct;
        scramOut = cmd.scram;
      }
      powerRef.current = powerOut;
      setPower(powerOut);
      holdRef.current = step.hold;
      writtenRef.current = step.lastWritten;
      setHold(step.hold);
      if (step.msg) setMsg(step.msg);
      if (step.write) writeRef.current(step.write);
      if (!step.scram && (plant === "bwr" || (plant === "msr" && move.drain))) {
        writeRef.current({ powerPct: powerOut, ...(scramOut ? { scram: true } : {}) });
      }
      if (scramOut) setScram(true);
      if (step.passed) setPassed(true);
      if (scramOut || step.passed) {
        stopped = true;
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [plant, passed, scram, flowDesign]);

  if (!design || !plant) {
    return (
      <Term>
        <p className="font-mono text-xs tracking-widest text-good">DT.BENCH  TEACHING.ONLY</p>
        <h2 className="font-mono mt-2 text-2xl text-good">No plant yet</h2>
        <p className="mt-3 max-w-md font-mono text-sm leading-relaxed text-good/80">
          This bench runs the reactor you design. It does not keep a separate toy plant. Finish the builder, then come back.
        </p>
        <button type="button" className="btn-ghost mt-5" onClick={onAbort}>
          Leave bench
        </button>
      </Term>
    );
  }

  const ts = thermalState(plant, { powerPct: power, flowPct: flow });
  const { dT, tCold, tHot } = ts;
  const band = BAND[plant];
  const inBand = dT >= band.lo && dT <= band.hi && !scram;
  const moveNow: OperatorMove = { rodsWithdrawnPct: rods, flowPct: flow, drain, drainSeconds, passes };
  const simCmd = commandFor(plant, power, moveNow, scram);
  const panel = view ? paintEvent(panelFor(plant, moveNow, simCmd, burnup), view) : panelFor(plant, moveNow, simCmd, burnup);
  const answer = (right: boolean) => {
    if (!call) return;
    const next = resolveEvent(call, right);
    setView(next);
    viewRef.current = next;
    if (next.scram) {
      setScram(true);
      setPower(0);
      powerRef.current = 0;
      writeRun({ scram: true, powerPct: 0 });
    } else if (next.flow === 0) {
      setFlow(0);
      flowRef.current = 0;
      writeRun({ flowPct: 0 });
    }
  };

  if (passed) {
    return (
      <Term>
        <p className="font-mono text-xs tracking-widest text-good">BAND.HELD</p>
        <h2 className="font-mono mt-2 text-2xl text-good">Heat left with the coolant</h2>
        <p className="mt-3 max-w-md text-center font-mono text-sm leading-relaxed text-good/80">
          Q = m * cp * dT. You matched flow to power. Teaching model only — not a real core, not a license.
        </p>
        <Schematic plant={plant} tHot={tHot} tCold={tCold} colorSafe={colorSafe} />
        <button type="button" className="btn-primary mt-6" onClick={onPass}>
          Thank Priya later
        </button>
      </Term>
    );
  }

  return (
    <Term scroll>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs tracking-widest text-good">
            {PLANTS.find((p) => p.id === plant)?.title} — this site · teaching only
          </p>
          <h2 className="font-mono mt-1 text-xl text-good">Hold the band</h2>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost" onClick={() => setCompare((v) => !v)}>
            {compare ? "Your plant" : "Compare"}
          </button>
          <button type="button" className="btn-ghost" onClick={onAbort}>
            Leave
          </button>
        </div>
      </div>
      <PlantCutaway
        kind={plant}
        testId="control-cutaway"
        maxScale={1}
        className="mt-3 w-full border border-[#c4783a]/40 bg-[#f3e6d0]"
        live={{
          power: scram ? 0 : power / 100,
          flow: panel.arrows ? flow / 100 : 0,
          rods: rods / 100,
          scram,
          tHot,
          tCold,
          arrows: panel.arrows,
          tubeMark: panel.tubeMark,
        }}
      />
      <Schematic plant={plant} tHot={tHot} tCold={tCold} colorSafe={colorSafe} />
      <p className="mt-2 text-sm text-muted">{msg}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
        <Stat k="Power" v={`${power.toFixed(0)} %`} />
        <Stat k="ρ" v={`${Math.round(rhoPcm) > 0 ? "+" : ""}${Math.round(rhoPcm) || 0} pcm`} />
        <Stat k="T-hot" v={`${tHot.toFixed(1)} °C`} />
        <Stat k="T-cold" v={`${tCold.toFixed(1)} °C`} />
        <Stat k="ΔT" v={`${dT.toFixed(1)} °C`} warn={!inBand} />
      </div>
      <p className="mt-2 font-mono text-xs text-subtle">
        Q = ṁ × cp × ΔT · {band.lo}–{band.hi} °C · hold {Math.min(band.hold, hold).toFixed(1)} / {band.hold} s
      </p>
      <div className="mt-2 border border-good/30 px-3 py-2 font-mono text-xs text-good/90" data-testid="site-panel">
        <p className="tracking-widest">{panel.title}</p>
        {panel.lines.map((line) => (
          <p key={line} className="mt-1 text-good/80">
            {line}
          </p>
        ))}
      </div>
      {compare && <CompareCard yours={plant} />}
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
        <div className="h-full bg-accent" style={{ width: `${Math.min(100, (hold / band.hold) * 100)}%` }} />
      </div>
      {scram ? (
        <button
          type="button"
          className="btn-primary mt-5"
          onClick={() => {
            setScram(false);
            setPower(40);
            setRods(40);
            setFlow(100);
            setHold(0);
            powerRef.current = 40;
            precursorsRef.current = undefined;
            rodPosRef.current = undefined;
            setRhoPcm(0);
            holdRef.current = 0;
            writtenRef.current = 40;
            setDrain(false);
            setDrainSeconds(0);
            drainRef.current = false;
            drainSecRef.current = 0;
            setCall(null);
            setView(null);
            viewRef.current = null;
            publishFace({ flowMul: 1, tubeMark: false });
            writeRun({ scram: false, powerPct: 40, rodsWithdrawnPct: 40, flowPct: 100 });
            setMsg("Reset. Slower on the rods. Match the pump.");
          }}
        >
          Reset bench
        </button>
      ) : (
        <div className="mt-5 space-y-4">
          <label className="block text-xs text-muted">
            {plant === "bwr" ? "Rods from below" : plant === "msr" ? "Salt worth / rods" : plant === "pebble" ? "Reflector rods" : "Rods withdrawn"} {rods}%
            <input
              type="range"
              min={20}
              max={100}
              value={rods}
              onChange={(e) => {
                const n = Number(e.target.value);
                setRods(n);
                writeRun({ rodsWithdrawnPct: n });
              }}
              className="mt-1 w-full"
            />
          </label>
          <label className="block text-xs text-muted">
            {plant === "pebble" ? "Helium flow" : plant === "msr" ? "Salt flow" : "Primary flow"} {flow}%
            <input
              type="range"
              min={50}
              max={120}
              value={flow}
              onChange={(e) => {
                const n = Number(e.target.value);
                setFlow(n);
                writeRun({ flowPct: n });
              }}
              className="mt-1 w-full"
            />
          </label>
          {plant === "pebble" ? (
            <button
              type="button"
              className="btn-ghost"
              data-testid="pebble-pass"
              onClick={() => {
                const next = pebblePass(burnupRef.current);
                burnupRef.current = next.burnupMWd;
                passesRef.current += 1;
                setBurnup(next.burnupMWd);
                setPasses(passesRef.current);
              }}
            >
              Pass a pebble
            </button>
          ) : null}
          {plant === "msr" && !drain ? (
            <button
              type="button"
              className="btn-ghost"
              data-testid="freeze-valve"
              onClick={() => {
                drainRef.current = true;
                setDrain(true);
              }}
            >
              Open the freeze valve
            </button>
          ) : null}
        </div>
      )}
      {!call ? (
        scram ? null : (
          <button type="button" className="btn-ghost mt-4" data-testid="plant-call" onClick={() => setCall(pickEvent(plant, Math.random()))}>
            A call from the plant
          </button>
        )
      ) : !view ? (
        <div className="mt-4 border border-warn/50 px-3 py-2 text-xs text-fg" data-testid="plant-event">
          <p className="font-mono tracking-widest text-warn">{call.title}</p>
          <p className="mt-1">{call.panel}</p>
          <p className="mt-1 text-muted">{call.hall}</p>
          <div className="mt-2 flex flex-col gap-2">
            <button
              type="button"
              className="btn-primary"
              data-testid="event-right"
              onClick={() => answer(true)}
            >
              {call.right}
            </button>
            <button type="button" className="btn-ghost" data-testid="event-wrong" onClick={() => answer(false)}>
              {call.wrong}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 font-mono text-xs text-warn" data-testid="event-result">
          {view.ended ? "Worse." : "Held."} {view.panel}
        </p>
      )}
    </Term>
  );
}

function CompareCard({ yours }: { yours: PlantType }) {
  return (
    <div className="mt-3 border border-good/30 p-3">
      <p className="font-mono text-xs tracking-widest text-good">COMPARE · DEFAULTS</p>
      <p className="mt-1 font-mono text-xs text-good/70">
        Full power, full flow, for each type. This does not change the plant you are running.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {PLANTS.map((p) => {
          const ts = thermalState(p.id, { powerPct: 100, flowPct: 100 });
          return (
            <div key={p.id} className="border border-good/20 px-2 py-2 font-mono text-xs text-good/80">
              <div>
                {p.title}
                {p.id === yours ? " · yours" : ""}
              </div>
              <div className="mt-1">ΔT {ts.dT.toFixed(0)} °C</div>
              <div className="text-good/60">
                {ts.tCold.toFixed(0)} → {ts.tHot.toFixed(0)} °C
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Term({ children, scroll }: { children: ReactNode; scroll?: boolean }) {
  return (
    <div className={"bench-shell absolute inset-0 z-30 grid place-items-center bg-bg/80 px-3 pb-24 pt-16 " + (scroll ? "overflow-y-auto" : "")}>
      <div className="bench-frame w-full max-w-2xl border-8 border-[#1a1410] bg-[#f3e6d0] p-1 shadow-[0_0_0_4px_#c4783a]">
        <div className="bench-screen border border-[#c4783a]/50 bg-[#2a2218] p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}

function Stat({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2">
      <div className="text-[11px] text-subtle">{k}</div>
      <div className={"font-mono text-sm tabular " + (warn ? "text-warn" : "text-fg")}>{v}</div>
    </div>
  );
}

/** One pixel drawing for every plant type: the same grid, labels, footer and colour bar. */
function Schematic({ plant, tHot, tCold, colorSafe }: { plant: PlantType; tHot: number; tCold: number; colorSafe: boolean }) {
  return <PixelSchematic plant={plant} tHot={tHot} tCold={tCold} colorSafe={colorSafe} />;
}
