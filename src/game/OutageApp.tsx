/**
 * Refuelling Outage: reload a real PWR core (BEAVRS, a 4-loop plant) and run the cycle.
 *
 * Cycle 2 starts from the plant's own end of Cycle 1. The player rearranges the 193 assemblies a quarter-core at
 * a time (the core is loaded with 90° rotational symmetry, as the plant's was), runs the cycle, and compares it
 * with the pattern the plant actually loaded, in the same simulator, and with the plant's measured boron.
 * After Cycle 2, the next outage is the player's own: discharge the most burned fuel, choose the fresh batch,
 * load again.
 *
 * Physics: outage/core.ts. Data: outage/preset.ts, or the player's own lattice set (made with
 * tools/openmc/beavrs_lattice.py, or any code), pasted in and checked by outage/lattice.ts.
 * Saved in its own browser key, not in the game save.
 */
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { PAL } from "./palette";
import type { GameState } from "./sim";
import {
  ASSEMBLY_LIMIT,
  FDH_LIMIT,
  MEASURED,
  N,
  PIN_FACTOR,
  QUARTER,
  beavrsCycle1,
  beavrsCycle2,
  endCycle,
  isFuel,
  nextOutage,
  orbit,
  posName,
  runCycle,
  swapOrbits,
  type Core,
  type CycleResult,
} from "./outage/core";
import { afterDischarge, DISCHARGE_COUNT, DISCHARGE_FACT, DISCHARGE_RULE, dischargeScore } from "./outage/discharge";
import { CORE, FIT_REPORT, PRESET_FIT } from "./outage/calibration";
import { freshTypes, parseLatticeSet, type LatticeSet } from "./outage/lattice";
import { presetSet } from "./outage/preset";
import { PRESET_EOC1 } from "./outage/eoc1";
import { CYCLE1_TUTORIAL, cycle1Batches, cycle1FuelCount } from "./outage/cycle1Lesson";

const FIELD: CSSProperties = { fontFamily: "var(--font-body)", fontSize: "var(--text-body)", color: PAL.ink, lineHeight: 1.5 };
const SMALL: CSSProperties = { fontSize: "var(--text-small)", color: PAL.ink, opacity: 0.85 };
/** Map and notes sit side by side. On a phone the notes wrap under the map instead of covering it. */
const SPLIT: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start", marginTop: 8 };
const SIDE: CSSProperties = { flex: "1 1 260px", minWidth: 0, maxWidth: "100%" };
const STORE = "cc.outage.v1";

function Btn({ on, primary, disabled, onClick, testId, children }: { on?: boolean; primary?: boolean; disabled?: boolean; onClick: () => void; testId?: string; children: ReactNode }) {
  const fill = primary || on;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      style={{
        background: fill ? PAL.copper : PAL.cream,
        color: fill ? PAL.cream : PAL.ink,
        border: `2px solid ${PAL.outline}`,
        padding: "4px 10px",
        minHeight: 32,
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-small)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

export const PRESET: LatticeSet = presetSet(PRESET_FIT, `Fit: ${FIT_REPORT}`);

interface Saved {
  custom: LatticeSet | null;
  useCustom: boolean;
  /** Completed cycles, oldest first: the cycle number and the core as loaded. */
  history: { cycle: number; loaded: Core; efpd: number; peak: number }[];
  /** The core being loaded now, and its cycle number. */
  draft: Core | null;
  draftCycle: number;
  /** The Cycle 1 worked example has been closed. */
  tutorialSeen?: boolean;
  /** Cycle 2 only: the 64 assemblies the player chose to discharge. Null until they confirm. */
  discharged: number[] | null;
}

function readSaved(): Saved {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) {
      const v = JSON.parse(raw) as Saved;
      if (!("discharged" in v)) v.discharged = null;
      return v;
    }
  } catch {
    // Private mode or a broken entry: start clean.
  }
  return { custom: null, useCustom: false, history: [], draft: null, draftCycle: 2, discharged: null };
}

function writeSaved(v: Saved) {
  try {
    localStorage.setItem(STORE, JSON.stringify(v));
  } catch {
    // Not saved this time. The outage still works in this window.
  }
}

function cellColor(a: Core[number]): string {
  if (!a) return PAL.outline;
  if (a.cycles === 0) return a.e >= 3.4 ? PAL.goldL : a.e >= 3.2 ? PAL.gold : a.e >= 3.1 ? PAL.copperL : a.e >= 2.4 ? PAL.copper : PAL.copperD;
  if (a.burnup < 12) return PAL.steelL;
  if (a.burnup < 22) return PAL.steel;
  return PAL.steelD;
}

function cellText(a: Core[number]): string {
  if (!a) return "";
  if (a.cycles === 0) return `${a.e}${a.ba ? `·${a.ba}` : ""}`;
  return a.burnup.toFixed(1);
}

function powerColor(p: number): string {
  if (p >= ASSEMBLY_LIMIT) return PAL.bad;
  if (p >= 1.2) return PAL.copper;
  if (p >= 1.0) return PAL.gold;
  if (p >= 0.8) return PAL.leafL;
  return PAL.sky;
}

/** The quarter the player edits, as rows of 15×15 indices (null where there is no fuel). */
const QUARTER_ROWS: (number | null)[][] = Array.from({ length: 8 }, (_, r) =>
  Array.from({ length: 8 }, (_, c) => {
    const i = (r + 7) * N + (c + 7);
    return isFuel(i) ? i : null;
  }),
);

function Letdown({ runs }: { runs: { label: string; color: string; result: CycleResult }[] }) {
  const W = 300;
  const H = 120;
  const maxE = 360;
  const maxB = 1100;
  const x = (e: number) => 28 + (e / maxE) * (W - 36);
  const y = (b: number) => 8 + (1 - b / maxB) * (H - 26);
  const measured = MEASURED.letdown.cycle2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 420, background: PAL.cream, border: `1px solid ${PAL.steel}` }} role="img" aria-label="Critical boron over the cycle">
      {[0, 500, 1000].map((b) => (
        <g key={b}>
          <line x1={28} x2={W - 8} y1={y(b)} y2={y(b)} stroke={PAL.ash} strokeWidth={0.5} />
          <text x={2} y={y(b) + 3} fontSize={7} fill={PAL.ink}>
            {b}
          </text>
        </g>
      ))}
      {[0, 100, 200, 300].map((e) => (
        <text key={e} x={x(e) - 6} y={H - 4} fontSize={7} fill={PAL.ink}>
          {e}
        </text>
      ))}
      {runs.map((r) => (
        <polyline
          key={r.label}
          fill="none"
          stroke={r.color}
          strokeWidth={1.5}
          points={r.result.steps.map((s) => `${x(s.efpd).toFixed(1)},${y(Math.max(0, s.ppm)).toFixed(1)}`).join(" ")}
        />
      ))}
      {measured.map(([e, b]) => (
        <rect key={e} x={x(e) - 1.5} y={y(b) - 1.5} width={3} height={3} fill={PAL.ink} />
      ))}
      <text x={W - 120} y={14} fontSize={7} fill={PAL.ink}>
        ■ measured, plant (Cycle 2)
      </text>
      {runs.map((r, k) => (
        <text key={r.label} x={W - 120} y={24 + k * 9} fontSize={7} fill={r.color}>
          — {r.label}
        </text>
      ))}
    </svg>
  );
}

function DischargePick({ eoc, onConfirm }: { eoc: Core; onConfirm: (ids: number[]) => void }) {
  const [sel, setSel] = useState<number[]>([]);
  const on = new Set(sel);
  const toggle = (i: number) => {
    setSel((cur) => {
      if (cur.includes(i)) return cur.filter((x) => x !== i);
      if (cur.length >= DISCHARGE_COUNT) return cur;
      return [...cur, i];
    });
  };
  return (
    <div data-testid="outage-discharge" style={SPLIT}>
      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(15, minmax(0, 1fr))", gap: 1, width: "min(100%, 420px)", background: PAL.cream, padding: 4, border: `2px solid ${PAL.steel}` }}
        data-testid="outage-discharge-grid"
      >
        {eoc.map((a, i) => {
          if (!a) return <div key={i} style={{ aspectRatio: "1" }} />;
          const marked = on.has(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              data-testid={`outage-out-${posName(i)}`}
              aria-pressed={marked}
              aria-label={`${posName(i)} ${a.e}% ${a.burnup.toFixed(1)} GWd per tonne${marked ? ", discharging" : ""}`}
              style={{
                aspectRatio: "1",
                minWidth: 0,
                padding: 0,
                fontSize: 8,
                fontFamily: "var(--font-mono, monospace)",
                background: marked ? PAL.copper : a.e <= 1.6 ? PAL.steelD : a.e <= 2.4 ? PAL.steel : PAL.gold,
                color: marked || a.e <= 2.4 ? PAL.cream : PAL.ink,
                border: marked ? `1px solid ${PAL.white}` : `1px solid ${PAL.outline}`,
                cursor: "pointer",
              }}
            >
              {marked ? "·" : a.burnup >= 10 ? a.burnup.toFixed(0) : a.e.toFixed(1)}
            </button>
          );
        })}
      </div>
      <div style={SIDE}>
        <p style={SMALL}>
          Cycle 1 ran 327 effective full-power days. {DISCHARGE_FACT}
        </p>
        <p style={SMALL} data-testid="outage-rule">
          {DISCHARGE_RULE}
        </p>
        <p style={SMALL}>
          Selected {sel.length} of {DISCHARGE_COUNT}. Dark grey is 1.6%. The number is burnup, in GWd/t, once it is past 10.
        </p>
        <div style={{ marginTop: 8 }}>
          <Btn primary disabled={sel.length !== DISCHARGE_COUNT} onClick={() => onConfirm(sel)} testId="outage-discharge-confirm">
            {sel.length === DISCHARGE_COUNT ? "Discharge these 64" : `Choose ${DISCHARGE_COUNT - sel.length} more`}
          </Btn>
        </div>
      </div>
    </div>
  );
}

export function OutageApp({ s }: { s: GameState }) {
  const [saved, setSaved] = useState<Saved>(readSaved);
  const set: LatticeSet = saved.useCustom && saved.custom ? saved.custom : PRESET;
  const [pick, setPick] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CycleResult | null>(null);
  const [view, setView] = useState<"fuel" | "power">("fuel");
  const [paste, setPaste] = useState("");
  const [pasteMsg, setPasteMsg] = useState("");
  const [freshPick, setFreshPick] = useState(0);

  // End of Cycle 1 as the plant ran it (327.2 EFPD). Precomputed for the preset; worked out here for a player's set.
  const presetEoc1 = useMemo(() => beavrsCycle1().map((a, i) => (a ? { ...a, burnup: PRESET_EOC1[i] } : null)), []);
  const [eoc1, setEoc1] = useState<Core | null>(set === PRESET ? presetEoc1 : null);
  useEffect(() => {
    if (set === PRESET) return setEoc1(presetEoc1);
    setEoc1(null);
    const id = setTimeout(() => setEoc1(runCycle(beavrsCycle1(), set, 0.5, 40, MEASURED.eocEfpd.cycle1).eoc), 30);
    return () => clearTimeout(id);
  }, [set, presetEoc1]);
  const plantLoaded = useMemo(() => (eoc1 ? beavrsCycle2(endCycle(eoc1)) : null), [eoc1]);
  const [plantRun, setPlantRun] = useState<CycleResult | null>(null);
  useEffect(() => setPlantRun(null), [plantLoaded]);
  const cycle1 = useMemo(() => beavrsCycle1(), []);
  const batches = useMemo(() => cycle1Batches(), []);

  // Clear a stale result when the loading changes.
  useEffect(() => setResult(null), [saved.draft, set]);

  const update = (patch: Partial<Saved>) => {
    const next = { ...saved, ...patch };
    setSaved(next);
    writeSaved(next);
  };

  if (!saved.tutorialSeen && !saved.draft && saved.history.length === 0) {
    return (
      <div className="app-pad" style={FIELD} data-testid="outage-tutorial">
        <p style={{ margin: 0 }}>Refuelling Outage · Cycle 1</p>
        {CYCLE1_TUTORIAL.slice(0, 3).map((line) => (
          <p key={line} style={SMALL}>
            {line}
          </p>
        ))}
        <p style={SMALL} data-testid="outage-tutorial-count">
          {cycle1FuelCount()} assemblies on the map.
        </p>
        <ul style={{ ...SMALL, margin: "4px 0", paddingLeft: 18 }}>
          {batches.map((b) => (
            <li key={`${b.e}/${b.ba}`}>
              {b.e}% · {b.ba} rods · {b.n}
            </li>
          ))}
        </ul>
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(8, 38px)", gap: 2, padding: 6, background: PAL.cream, border: `2px solid ${PAL.steel}`, width: "fit-content" }}
          data-testid="outage-tutorial-grid"
        >
          {QUARTER_ROWS.flat().map((i, k) => {
            if (i === null) return <div key={`x${k}`} style={{ width: 38, height: 30 }} />;
            const a = cycle1[i];
            return (
              <div
                key={i}
                data-testid={`tutorial-cell-${posName(i)}`}
                style={{
                  width: 38,
                  height: 30,
                  background: cellColor(a),
                  color: PAL.ink,
                  border: `1px solid ${PAL.outline}`,
                  fontSize: 10,
                  fontFamily: "var(--font-mono, monospace)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {cellText(a)}
              </div>
            );
          })}
        </div>
        <p style={{ ...SMALL, marginTop: 4 }}>{CYCLE1_TUTORIAL[3]}</p>
        <div style={{ marginTop: 8 }}>
          <Btn primary onClick={() => update({ tutorialSeen: true })} testId="outage-tutorial-done">
            On to Cycle 2
          </Btn>
        </div>
      </div>
    );
  }

  if (!plantLoaded) {
    return (
      <div className="app-pad" style={FIELD} data-testid="app-outage">
        <p style={{ margin: 0 }}>Refuelling Outage</p>
        <p style={SMALL}>Running Cycle 1 with your lattice data, to find where the burned fuel stands…</p>
      </div>
    );
  }
  const plant = { loaded: plantLoaded };
  const draft: Core = saved.draft ?? plant.loaded;
  const cycle = saved.draftCycle;

  const choose = (i: number) => {
    if (busy) return;
    if (pick === null) return setPick(i);
    if (pick === i) return setPick(null);
    const next = swapOrbits(draft, pick, i);
    setPick(null);
    if (next) update({ draft: next });
  };

  const run = () => {
    setBusy(true);
    // Let the "Running" line paint before the solver takes the thread.
    setTimeout(() => {
      const mine = runCycle(draft, set, 0.5);
      let reference = plantRun;
      if (cycle === 2 && !reference) {
        reference = runCycle(plant.loaded, set, 0.5);
        setPlantRun(reference);
      }
      setResult(mine);
      setBusy(false);
      if (cycle === 2) {
        s.flags["outage:c2:done"] = true;
        if (reference && mine.efpd >= reference.efpd - 2 && mine.peak <= reference.peak + 0.005) s.flags["outage:c2:beat"] = true;
      }
      s.flags[`outage:c${cycle}:done`] = true;
    }, 30);
  };

  const accept = () => {
    if (!result) return;
    const history = [...saved.history, { cycle, loaded: draft, efpd: result.efpd, peak: result.peak }];
    const types = freshTypes(set);
    const fresh = types[freshPick] ?? types[types.length - 1];
    update({ history, draft: nextOutage(result.eoc, fresh, cycle + 1), draftCycle: cycle + 1 });
    setResult(null);
  };

  const usePaste = () => {
    const p = parseLatticeSet(paste, PRESET);
    if (!p.ok) return setPasteMsg(p.error);
    const need = new Set(draft.filter(Boolean).map((a) => `${a!.e}/${a!.cycles === 0 ? a!.ba : 0}`));
    const missing = [...need].filter((k) => !p.set.curves.some((c) => `${c.e}/${c.ba}` === k));
    if (missing.length) return setPasteMsg(`Your set has no curve for: ${missing.join(", ")} (enrichment/absorber rods).`);
    update({ custom: p.set, useCustom: true });
    setPasteMsg(`Using "${p.set.name}".`);
  };

  const power = result?.bocPower;
  const reference = cycle === 2 ? plantRun : null;
  const prev = saved.history.length ? saved.history[saved.history.length - 1] : null;
  const types = freshTypes(set);
  const discharging = cycle === 2 && !saved.discharged;

  return (
    <div className="app-pad" style={FIELD} data-testid="app-outage">
      <p style={{ margin: 0, fontSize: "var(--text-body)" }}>Refuelling Outage · Cycle {cycle}</p>

      {discharging && eoc1 ? (
        <DischargePick
          eoc={eoc1}
          onConfirm={(ids) => {
            s.flags["outage:discharged"] = true;
            if (dischargeScore(ids) === DISCHARGE_COUNT) s.flags["outage:discharge:match"] = true;
            else delete s.flags["outage:discharge:match"];
            update({ discharged: ids, draft: afterDischarge(eoc1, ids) });
            setPick(null);
          }}
        />
      ) : (
      <div style={SPLIT}>
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
            <Btn on={view === "fuel"} onClick={() => setView("fuel")} testId="outage-view-fuel">Fuel</Btn>
            <Btn on={view === "power"} onClick={() => setView("power")} disabled={!power} testId="outage-view-power">Power</Btn>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(8, 38px)", gap: 2, padding: 6, background: PAL.cream, border: `2px solid ${PAL.steel}`, width: "fit-content" }}
            data-testid="outage-grid"
          >
            {QUARTER_ROWS.flat().map((i, k) => {
              if (i === null) return <div key={`x${k}`} style={{ width: 38, height: 30 }} />;
              const a = draft[i];
              const shown = view === "power" && power ? power[i] : null;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => choose(i)}
                  data-testid={`outage-cell-${posName(i)}`}
                  aria-label={`${posName(i)}: ${a ? (a.cycles === 0 ? `fresh ${a.e}% with ${a.ba} absorber rods` : `burned, ${a.burnup.toFixed(1)} GWd per tonne`) : "empty"}${shown ? `, power ${shown.toFixed(2)}` : ""}`}
                  style={{
                    width: 38,
                    height: 30,
                    background: shown !== null ? powerColor(shown) : cellColor(a),
                    // Light text on the two darker greys (burned past 12 GWd/t), dark text elsewhere.
                    color: shown === null && a && a.cycles > 0 && a.burnup >= 12 ? PAL.cream : PAL.ink,
                    border: pick !== null && orbit(pick).includes(i) ? `2px solid ${PAL.white}` : `1px solid ${PAL.outline}`,
                    fontSize: 10,
                    fontFamily: "var(--font-mono, monospace)",
                    padding: 0,
                    cursor: busy ? "wait" : "pointer",
                  }}
                >
                  {shown !== null ? shown.toFixed(2) : cellText(a)}
                </button>
              );
            })}
          </div>
          <p style={{ ...SMALL, marginTop: 4 }}>
            {view === "fuel" ? "Gold: fresh (% enrichment · absorber rods). Grey: burned (GWd/t). Lower-right quarter; the centre is top-left." : "Assembly power at the start of the cycle, core average 1.00."}
          </p>
        </div>

        <div style={SIDE}>
          <p style={SMALL}>
            {cycle === 2
              ? `Cycle 1 ran 327 effective full-power days. ${DISCHARGE_FACT}`
              : `Your Cycle ${cycle - 1} is done. The most burned fuel came out and fresh fuel went in. Load it again.`}
          </p>
          {cycle === 2 ? (
            <p style={SMALL} data-testid="outage-rule">
              {DISCHARGE_RULE}
            </p>
          ) : null}
          {cycle === 2 && saved.discharged ? (
            <p style={SMALL} data-testid="outage-discharge-score">
              Your discharge matches {dischargeScore(saved.discharged)} of 64. The vacated positions are fresh fuel. Move fuel a quarter-core at a time: tap one position, then another, and the four rotated copies swap together.
            </p>
          ) : null}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <Btn primary onClick={run} disabled={busy} testId="outage-run">{busy ? "Running the cycle…" : `Run Cycle ${cycle}`}</Btn>
            {cycle === 2 && saved.draft ? <Btn onClick={() => update({ draft: null })} testId="outage-reset">Back to the plant's pattern</Btn> : null}
          </div>
          {cycle === 2 && !saved.draft ? <p style={SMALL}>This is the plant's own Cycle 2 loading. Run it as it is, or move fuel first.</p> : null}
          {result ? (
            <div style={{ marginTop: 8 }} data-testid="outage-result">
              <p style={{ margin: 0 }}>
                Cycle length <b>{result.efpd.toFixed(0)} EFPD</b> · peak assembly <b>{result.peak.toFixed(2)}</b> at {posName(result.peakAt)} · start boron {result.bocPpm.toFixed(0)} ppm
              </p>
              {reference ? (
                <p style={{ margin: 0 }}>
                  The plant's pattern, same simulator: {reference.efpd.toFixed(0)} EFPD, peak {reference.peak.toFixed(2)}. The plant really ran {MEASURED.eocEfpd.cycle2} EFPD.{" "}
                  <b data-testid="outage-verdict">
                    {result.efpd >= reference.efpd - 2 && result.peak <= reference.peak + 0.005
                      ? "Yours is as long or longer, and no more peaked."
                      : result.peak > reference.peak + 0.005
                        ? "Yours peaks higher than the plant's."
                        : "Yours runs shorter than the plant's."}
                  </b>
                </p>
              ) : prev ? (
                <p style={{ margin: 0 }}>
                  Your Cycle {prev.cycle}: {prev.efpd.toFixed(0)} EFPD, peak {prev.peak.toFixed(2)}.
                </p>
              ) : null}
              <p style={SMALL}>
                FΔH estimate {result.fdh.toFixed(2)} (assembly peak × {PIN_FACTOR}, pins not modelled); the plant's limit is {FDH_LIMIT}. Read it against the plant's pattern in the same simulator, not as a licence check.
              </p>
              <Letdown
                runs={[
                  { label: "yours", color: PAL.copper, result },
                  ...(reference ? [{ label: "plant pattern, this simulator", color: PAL.steelD, result: reference }] : []),
                ]}
              />
              <div style={{ marginTop: 8 }}>
                <label style={SMALL}>
                  Fresh fuel for Cycle {cycle + 1}:{" "}
                  <select value={freshPick} onChange={(e) => setFreshPick(Number(e.target.value))} data-testid="outage-fresh">
                    {types.map((t, k) => (
                      <option key={`${t.e}/${t.ba}`} value={k}>
                        {t.e}%{t.ba ? `, ${t.ba} absorber rods` : ", no absorbers"}
                      </option>
                    ))}
                  </select>
                </label>{" "}
                <Btn onClick={accept} testId="outage-next">Close the cycle, start outage {cycle + 1}</Btn>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      )}

      <details style={{ marginTop: 12 }}>
        <summary style={{ cursor: "pointer" }}>Data: {set === PRESET ? "BEAVRS preset" : set.name}</summary>
        <p style={SMALL}>{set.source}</p>
        <p style={SMALL}>
          Simulator: one-group diffusion, 4×4 cells per assembly, real 193-assembly core and reflector, local power feedback, boron search, burnup by assembly. Fitted to the
          plant's measured data: M² {CORE.m2.toFixed(1)} cm², feedback {CORE.feedback}. It does not model pins, height, control rods or two energy groups.
        </p>
        <p style={SMALL}>
          Use your own: run <code>tools/openmc/beavrs_lattice.py</code> (OpenMC with ENDF/B data, about an hour per assembly type on a laptop), then paste the JSON it writes. Any code
          works if it writes the same JSON: version, name, source, reference, refBoronPpm, hfpShift, boronWorth, and curves of [burnup, k∞] for each enrichment and absorber count.
        </p>
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={4}
          style={{ width: "100%", fontFamily: "monospace", fontSize: 11 }}
          placeholder='{"version": 1, "name": "...", "curves": [...]}'
          data-testid="outage-paste"
        />
        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
          <Btn onClick={usePaste} testId="outage-use-paste">Use this data</Btn>
          {saved.useCustom ? (
            <Btn onClick={() => update({ useCustom: false })} testId="outage-use-preset">Back to the preset</Btn>
          ) : null}
        </div>
        {pasteMsg ? <p style={SMALL}>{pasteMsg}</p> : null}
      </details>
    </div>
  );
}
