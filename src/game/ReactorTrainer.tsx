"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { DT_BAND, thermalState, type PlantDesign, type PlantType, type RunState } from "./plant";
import { PixelSchematic } from "./PixelSchematic";
import { BENCH_HOLD, stepBench } from "./benchStep";

const PLANTS: { id: PlantType; title: string; note: string }[] = [
  { id: "pwr", title: "PWR — this site", note: "Pressurized primary. Steam generators. Rods from above. Heat leaves with flow." },
  { id: "bwr", title: "BWR — comparison", note: "Boils in the vessel. Steam to the turbine. Rods from below." },
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
}: {
  onPass: () => void;
  onAbort: () => void;
  design: PlantDesign | null;
  run: RunState;
  writeRun: (patch: Partial<Pick<RunState, "powerPct" | "flowPct" | "rodsWithdrawnPct" | "scram">>) => void;
  onMinute: (openMinutes: number) => void;
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
  const rodsRef = useRef(rods);
  const flowRef = useRef(flow);
  const powerRef = useRef(power);
  const holdRef = useRef(hold);
  const writtenRef = useRef<number | null>(null);
  const writeRef = useRef(writeRun);
  const minuteRef = useRef(onMinute);
  rodsRef.current = rods;
  flowRef.current = flow;
  writeRef.current = writeRun;
  minuteRef.current = onMinute;

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
      const step = stepBench({
        power: powerRef.current,
        rods: rodsRef.current,
        flow: flowRef.current,
        hold: holdRef.current,
        dt,
        plant,
        lastWritten: writtenRef.current,
      });
      powerRef.current = step.power;
      holdRef.current = step.hold;
      writtenRef.current = step.lastWritten;
      setPower(step.power);
      setHold(step.hold);
      if (step.msg) setMsg(step.msg);
      if (step.write) writeRef.current(step.write);
      if (step.scram) setScram(true);
      if (step.passed) setPassed(true);
      if (step.scram || step.passed) {
        stopped = true;
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [plant, passed, scram]);

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

  if (passed) {
    return (
      <Term>
        <p className="font-mono text-xs tracking-widest text-good">BAND.HELD</p>
        <h2 className="font-mono mt-2 text-2xl text-good">Heat left with the coolant</h2>
        <p className="mt-3 max-w-md text-center font-mono text-sm leading-relaxed text-good/80">
          Q = m * cp * dT. You matched flow to power. Teaching model only — not a real core, not a license.
        </p>
        <Schematic plant={plant} dT={dT} inBand tHot={tHot} tCold={tCold} />
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
            {PLANTS.find((p) => p.id === plant)?.title} · teaching only
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
      <Schematic plant={plant} dT={dT} inBand={inBand} tHot={tHot} tCold={tCold} />
      <p className="mt-2 text-sm text-muted">{msg}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Stat k="Power" v={`${power.toFixed(0)} %`} />
        <Stat k="T-hot" v={`${tHot.toFixed(1)} °C`} />
        <Stat k="T-cold" v={`${tCold.toFixed(1)} °C`} />
        <Stat k="ΔT" v={`${dT.toFixed(1)} °C`} warn={!inBand} />
      </div>
      <p className="mt-2 font-mono text-xs text-subtle">
        Q = ṁ × cp × ΔT · {band.lo}–{band.hi} °C · hold {Math.min(band.hold, hold).toFixed(1)} / {band.hold} s
      </p>
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
            holdRef.current = 0;
            writtenRef.current = 40;
            writeRun({ scram: false, powerPct: 40, rodsWithdrawnPct: 40, flowPct: 100 });
            setMsg("Reset. Slower on the rods. Match the pump.");
          }}
        >
          Reset bench
        </button>
      ) : (
        <div className="mt-5 space-y-4">
          <label className="block text-xs text-muted">
            {plant === "msr" ? "Salt worth / rods" : plant === "pebble" ? "Reflector rods" : "Rods withdrawn"} {rods}%
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
        </div>
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
    <div className={"absolute inset-0 z-30 grid place-items-center bg-bg/80 px-3 pb-24 pt-16 " + (scroll ? "overflow-y-auto" : "")}>
      <div className="w-full max-w-2xl border-8 border-[#1a1410] bg-[#f3e6d0] p-1 shadow-[0_0_0_4px_#c4783a]">
        <div className="border border-[#c4783a]/50 bg-[#2a2218] p-4 sm:p-5">{children}</div>
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

function Schematic({ plant, dT, inBand, tHot, tCold }: { plant: PlantType; dT: number; inBand: boolean; tHot: number; tCold: number }) {
  const glow = inBand ? "#6b8f71" : "#c4783a";
  if (plant === "pwr") return <PixelSchematic tHot={tHot} tCold={tCold} />;
  return (
    <svg viewBox="0 0 560 200" className="mt-4 w-full" aria-hidden>
      <rect x="0" y="0" width="560" height="200" fill="#1a1410" rx="8" />
      {plant === "bwr" && (
        <>
          <ellipse cx="200" cy="110" rx="58" ry="80" fill="#2a3238" stroke={glow} strokeWidth="3" />
          <rect x="160" y="38" width="80" height="18" fill="#d6e0e6" opacity="0.5" />
          {[0, 1, 2, 3, 4].map((n) => (
            <rect key={n} x={170 + n * 12} y="168" width="6" height="22" fill="#6b8f71" />
          ))}
          <rect x="340" y="28" width="90" height="50" rx="6" fill="#2a261e" stroke="#c4783a" strokeWidth="2" />
          <path d="M200 30 H385" fill="none" stroke="#8a7864" strokeWidth="6" />
          <text x="200" y="114" textAnchor="middle" fill="#f3e6d0" fontSize="11">vessel</text>
          <text x="385" y="58" textAnchor="middle" fill="#f3e6d0" fontSize="11">turbine</text>
          <text x="200" y="188" textAnchor="middle" fill="#6b8f71" fontSize="9">rods from below</text>
        </>
      )}
      {plant === "pebble" && (
        <>
          <circle cx="200" cy="108" r="74" fill="#2a261e" stroke={glow} strokeWidth="3" />
          <circle cx="200" cy="108" r="52" fill="#1c2a2c" stroke="#3d5c66" strokeWidth="2" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => (
            <circle key={n} cx={176 + (n % 4) * 16} cy={84 + Math.floor(n / 4) * 18} r="6" fill="#c4783a" />
          ))}
          <path d="M200 20 V34" fill="none" stroke="#7a8f9a" strokeWidth="6" />
          <path d="M200 160 V188 H320" fill="none" stroke="#c4783a" strokeWidth="6" />
          <text x="200" y="30" textAnchor="middle" fill="#7a8f9a" fontSize="10">He in</text>
          <text x="360" y="188" fill="#c4783a" fontSize="10">He out</text>
        </>
      )}
      {plant === "msr" && (
        <>
          <rect x="80" y="36" width="140" height="110" rx="8" fill="#2a261e" stroke={glow} strokeWidth="3" />
          {[0, 1, 2, 3, 4].map((i) =>
            [0, 1, 2, 3].map((j) => (
              <circle key={`${i}-${j}`} cx={100 + i * 22} cy={56 + j * 22} r="6" fill="#c9a227" />
            )),
          )}
          <rect x="260" y="48" width="70" height="70" rx="6" fill="#1c2a2c" stroke="#7a8f9a" strokeWidth="2" />
          <circle cx="400" cy="140" r="24" fill="#1c2a2c" stroke="#c9a227" strokeWidth="2" />
          <rect x="120" y="146" width="28" height="10" fill="#c9a227" />
          <ellipse cx="134" cy="176" rx="36" ry="16" fill="#2a261e" stroke="#c4783a" strokeWidth="2" />
          <path d="M220 70 H260 M330 70 H400 M400 116 V70" fill="none" stroke="#c9a227" strokeWidth="5" />
          <text x="150" y="30" textAnchor="middle" fill="#f3e6d0" fontSize="10">graphite + salt</text>
          <text x="294" y="88" textAnchor="middle" fill="#f3e6d0" fontSize="10">HX</text>
          <text x="134" y="180" textAnchor="middle" fill="#c4783a" fontSize="9">drain</text>
        </>
      )}
      <text x="28" y="24" fill="#b5a48c" fontSize="11">
        ΔT {dT.toFixed(1)} °C
      </text>
    </svg>
  );
}
