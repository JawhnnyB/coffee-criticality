"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Plant = "pwr" | "bwr" | "pebble" | "msr";

const PLANTS: { id: Plant; title: string; note: string }[] = [
  { id: "pwr", title: "PWR — this site", note: "Pressurized primary. Steam generators. Rods from above. Heat leaves with flow." },
  { id: "bwr", title: "BWR — comparison", note: "Boils in the vessel. Steam to the turbine. Rods from below." },
  { id: "pebble", title: "Pebble / TRISO", note: "Helium courier. Packed pebbles. Graphite reflector. Teaching only." },
  { id: "msr", title: "MSR / salt", note: "Fuel is the salt. Graphite channels. Freeze plug. Near-atm. Teaching only." },
];

const BAND: Record<Plant, { lo: number; hi: number; hold: number }> = {
  pwr: { lo: 28, hi: 36, hold: 8 },
  bwr: { lo: 8, hi: 14, hold: 8 },
  pebble: { lo: 160, hi: 260, hold: 8 },
  msr: { lo: 40, hi: 80, hold: 8 },
};

function scaleDt(plant: Plant, power: number, flow: number) {
  const f = Math.max(40, flow);
  if (plant === "bwr") return (power / f) * 12;
  if (plant === "pebble") return (power / f) * 220;
  if (plant === "msr") return (power / f) * 58;
  return (power / f) * 32;
}

function tColdOf(plant: Plant, flow: number) {
  if (plant === "bwr") return 275 - (flow - 100) * 0.03;
  if (plant === "pebble") return 530 - (flow - 100) * 0.2;
  if (plant === "msr") return 620 - (flow - 100) * 0.1;
  return 292 - (flow - 100) * 0.05;
}

export function ReactorTrainer({
  onPass,
  onAbort,
  site = "pwr",
}: {
  onPass: () => void;
  onAbort: () => void;
  site?: Plant;
}) {
  const [plant, setPlant] = useState<Plant | null>(site);
  const [rods, setRods] = useState(62);
  const [flow, setFlow] = useState(100);
  const [power, setPower] = useState(62);
  const [hold, setHold] = useState(0);
  const [scram, setScram] = useState(false);
  const [passed, setPassed] = useState(false);
  const [msg, setMsg] = useState("Match flow to power. Hold the ΔT band. Teaching only.");
  const rodsRef = useRef(rods);
  const flowRef = useRef(flow);
  rodsRef.current = rods;
  flowRef.current = flow;

  useEffect(() => {
    if (!plant || passed || scram) return;
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setPower((p) => {
        const target = rodsRef.current;
        const next = p + (target - p) * dt * 0.45;
        const band = BAND[plant];
        const dNow = scaleDt(plant, next, flowRef.current);
        const tHot = tColdOf(plant, flowRef.current) + dNow;
        const scramHot = plant === "pwr" ? 332 : plant === "bwr" ? 300 : plant === "pebble" ? 950 : 750;
        if (dNow > band.hi * 1.45 || tHot > scramHot || next > 114) {
          setScram(true);
          setMsg("Scram. Teaching model — you get the bench again. Heat still had to leave.");
          return next;
        }
        if (dNow >= band.lo && dNow <= band.hi) {
          setHold((h) => {
            const n = h + dt;
            if (n >= band.hold && !passed) {
              setPassed(true);
              setMsg("Band held. The courier took the heat. Teaching only.");
            }
            return n;
          });
        } else {
          setHold(0);
        }
        return next;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [plant, passed, scram]);

  if (!plant) {
    return (
      <Term>
        <p className="font-mono text-xs tracking-widest text-good">DT.BENCH  TEACHING.ONLY</p>
        <h2 className="font-mono mt-2 text-2xl text-good">Pick a plant to hold</h2>
        <p className="mt-3 max-w-md font-mono text-sm leading-relaxed text-good/80">
          This site is a PWR. The others are comparison models. Same law: heat leaves with the courier. Not a license.
        </p>
        <div className="mt-6 flex w-full flex-col gap-2">
          {PLANTS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="border border-good/40 bg-transparent px-4 py-3 text-left font-mono text-good hover:bg-good/10"
              onClick={() => setPlant(p.id)}
            >
              <div>{p.title}</div>
              <div className="mt-1 text-xs text-good/70">{p.note}</div>
            </button>
          ))}
        </div>
        <button type="button" className="btn-ghost mt-5" onClick={onAbort}>
          Leave bench
        </button>
      </Term>
    );
  }

  const dT = scaleDt(plant, power, flow);
  const tCold = tColdOf(plant, flow);
  const tHot = tCold + dT;
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
        <Schematic plant={plant} dT={dT} inBand />
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
          <button type="button" className="btn-ghost" onClick={() => setPlant(null)}>
            Compare
          </button>
          <button type="button" className="btn-ghost" onClick={onAbort}>
            Leave
          </button>
        </div>
      </div>
      <Schematic plant={plant} dT={dT} inBand={inBand} />
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
              onChange={(e) => setRods(Number(e.target.value))}
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
              onChange={(e) => setFlow(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>
        </div>
      )}
    </Term>
  );
}

function Term({ children, scroll }: { children: ReactNode; scroll?: boolean }) {
  return (
    <div className={"absolute inset-0 z-30 grid place-items-center bg-bg/80 px-3 pb-24 pt-16 " + (scroll ? "overflow-y-auto" : "")}>
      <div className="w-full max-w-2xl border-8 border-[#1a1410] bg-[#0a1612] p-1 shadow-[0_0_0_3px_#6b8f71]">
        <div className="border border-[#6b8f71]/40 bg-[#07140f] p-4 sm:p-5">{children}</div>
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

function Schematic({ plant, dT, inBand }: { plant: Plant; dT: number; inBand: boolean }) {
  const glow = inBand ? "#6b8f71" : "#c4783a";
  return (
    <svg viewBox="0 0 560 200" className="mt-4 w-full" aria-hidden>
      <rect x="0" y="0" width="560" height="200" fill="#1a1410" rx="8" />
      {plant === "pwr" && (
        <>
          <ellipse cx="130" cy="110" rx="48" ry="72" fill="#2a3238" stroke={glow} strokeWidth="3" />
          {[0, 1, 2, 3].map((n) => (
            <rect key={n} x={118 + n * 8} y="18" width="6" height="22" fill="#6b8f71" />
          ))}
          <rect x="250" y="36" width="72" height="128" rx="8" fill="#2a261e" stroke="#c4783a" strokeWidth="2" />
          <circle cx="410" cy="140" r="26" fill="#1c2a2c" stroke="#7a8f9a" strokeWidth="2" />
          <rect x="470" y="40" width="36" height="70" rx="6" fill="#2a3238" stroke="#c9a227" strokeWidth="2" />
          <path d="M178 50 H250 M322 50 H410 M410 114 V50" fill="none" stroke="#8a7864" strokeWidth="6" />
          <path d="M178 150 H250 M322 150 H386" fill="none" stroke="#3d5c66" strokeWidth="6" />
          <text x="130" y="114" textAnchor="middle" fill="#f3e6d0" fontSize="11">core</text>
          <text x="286" y="104" textAnchor="middle" fill="#f3e6d0" fontSize="11">SG</text>
          <text x="410" y="144" textAnchor="middle" fill="#f3e6d0" fontSize="10">pump</text>
          <text x="488" y="78" textAnchor="middle" fill="#f3e6d0" fontSize="9">PZR</text>
        </>
      )}
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
