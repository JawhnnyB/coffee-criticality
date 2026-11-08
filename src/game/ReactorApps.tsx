"use client";

import { useEffect, useRef, useState } from "react";
import { PAL } from "./palette";
import { CAM_H, CAM_W, COL, camScale, drawCamScene } from "./camDraw";
import { DEFAULT_PLANT, plantTitle, type PlantDesign } from "./plant";
import { computeKeff } from "./nuclearLab";
import { fluxOf, passes, type Burn } from "./shuffleModel";
import { readCoreMap, rememberCoreMap } from "./coreMapMemory";
import {
  BURNUP_PENDING,
  bubbleCount,
  bubbleSpeed,
  camFrame,
  cellCount,
  coreHealth,
  easeScram,
  glowColor,
  glowMoved,
  inBandFraction,
  lookLine,
  partPercent,
  particleCount,
  stepBubbles,
  stepFlow,
  type FlowDot,
  type Health,
} from "./reactorReadout";
import type { GameState, ResultsSave } from "./sim";

const FIELD = { fontFamily: "CCPixel3x5, monospace", color: PAL.ink } as const;
/** Wood token. Contrast on cream is well above 4.5:1. */
const CAPTION = COL.wood;

function healthOf(s: GameState, plant: PlantDesign): Health {
  const k = computeKeff(plant).kCore;
  return coreHealth({
    inBandFrac: inBandFraction(s.run.history),
    incidentOpen: s.incidentOpen,
    residue: s.residue,
    k,
  });
}

export function CoreCamApp({ s }: { s: GameState }) {
  const plant = s.plant ?? DEFAULT_PLANT;
  const missing = !s.plant;
  const frame = camFrame(plant, s.run);
  const health = healthOf(s, plant);
  const ref = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(2);
  const live = useRef({ plant, run: s.run, reduced: s.desktop.reducedMotion });
  live.current = { plant, run: s.run, reduced: s.desktop.reducedMotion };

  // Integer scale, centred by the flex wrapper. Resize only changes the scale, never the grid.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    setScale(camScale(el.clientWidth));
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setScale(camScale(el.clientWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const c = ref.current;
    const g = c?.getContext("2d");
    if (!c || !g) return;
    let alive = true;
    let last = performance.now();
    let factor = live.current.run.scram ? 0.15 : 1;
    let shown = 0;
    let seen = false;
    const dots: FlowDot[] = [];
    const bubbles: FlowDot[] = [];
    const tick = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // Skip drawing while the window is minimized (the canvas is not laid out).
      if (c.offsetParent !== null) {
        const cur = live.current;
        factor = easeScram(factor, !!cur.run.scram, dt);
        const shot = camFrame(cur.plant, cur.run, factor);
        // Glow moves only when it changes by more than 5 %, and never under reduced motion unless it changes that much.
        if (glowMoved(shot.glow, shown, cur.reduced, !seen)) {
          shown = shot.glow;
          seen = true;
        }
        const stop = cur.reduced || shot.scram;
        stepFlow(dots, particleCount(shot.count, stop), shot.speed, cur.plant.type, dt, stop);
        const isBwr = cur.plant.type === "bwr";
        stepBubbles(
          bubbles,
          isBwr ? bubbleCount(shot.voidFrac, cur.reduced || shot.scram) : 0,
          bubbleSpeed(shot.voidFrac),
          dt,
          stop,
        );
        drawCamScene(g, {
          type: cur.plant.type,
          kind: cur.plant.scale === "rod" ? "rod" : cur.plant.scale === "assembly" ? "assembly" : "core",
          cells: cellCount(cur.plant.scale, cur.plant.sizeClass, cur.plant.fullCore),
          glow: glowColor(shown),
          edge: shot.scram ? COL.steel : shot.band === "in" ? COL.gold : shot.band === "low" ? COL.steel : COL.copper,
          dots,
          bubbles,
        });
      }
      requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(id);
    };
  }, []);

  const fault = frame.scram
    ? "Scrammed. Power falls. Reset to restart."
    : frame.band === "high"
      ? "Above band. Pull back on power or add flow."
      : frame.band === "low"
        ? "Below band. The hold is short."
        : "";

  return (
    <div className="p-3" style={FIELD} data-testid="app-cam">
      <p style={{ margin: 0, fontSize: 14 }}>{plantTitle(plant)}</p>
      <p style={{ margin: "4px 0 8px", fontSize: 12, color: CAPTION }}>
        Teaching view. Glow shows fuel activity and core temperature. Not a measurement.
      </p>
      {missing ? <p style={{ fontSize: 12 }}>Using the default design.</p> : null}
      <div ref={wrap} style={{ display: "flex", justifyContent: "center" }}>
        <canvas
          ref={ref}
          width={CAM_W}
          height={CAM_H}
          aria-hidden
          style={{
            width: CAM_W * scale,
            height: CAM_H * scale,
            imageRendering: "pixelated",
            background: COL.screen,
            display: "block",
          }}
        />
      </div>
      <p style={{ fontSize: 12, marginTop: 6 }}>
        Classroom proxy k {computeKeff(plant).kCore.toFixed(3)}. Core health {health.score}.
        {plant.type === "bwr" ? ` Boiling proxy ${frame.voidFrac.toFixed(2)}.` : ""}
      </p>
      {fault ? <p style={{ fontSize: 12 }}>{fault}</p> : null}
      {plant.scale === "core" && !plant.fullCore ? (
        <p style={{ fontSize: 12 }}>3×3 window, not the whole core.</p>
      ) : null}
    </div>
  );
}

export function ResultsApp({ s }: { s: GameState }) {
  const plant = s.plant ?? DEFAULT_PLANT;
  const health = healthOf(s, plant);
  const rows = (s.results.daily as { day: number; coreHealth: number; incidentCount: number }[]) ?? [];
  return (
    <div className="p-3" style={FIELD} data-testid="app-results">
      <p style={{ margin: 0, fontSize: 14 }}>Results</p>
      <p style={{ fontSize: 12, margin: "6px 0 0" }}>Core health</p>
      <p style={{ fontSize: 28, margin: "2px 0 6px" }}>{health.score}</p>
      <table style={{ fontSize: 12, borderCollapse: "collapse" }}>
        <tbody>
          {health.parts.map((p) => (
            <tr key={p.id}>
              <td style={{ paddingRight: 12 }}>{p.label}</td>
              <td>{Math.round(p.weight * 100)}%</td>
              <td style={{ paddingLeft: 12 }}>{partPercent(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>What to look at</p>
      <p style={{ fontSize: 12, marginTop: 4 }}>{lookLine(s.setup.stance, health.parts)}</p>
      <p style={{ fontSize: 12 }}>{BURNUP_PENDING}</p>
      <p style={{ fontSize: 12 }}>1 in-game day = 1 real day. Time-compressed burnup stays off until a fuel mass is cited.</p>
      <Trend rows={rows} />
      <table style={{ fontSize: 12, marginTop: 8 }} data-testid="results-table">
        <thead>
          <tr>
            <th>Day</th>
            <th>Health</th>
            <th>Incidents</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3}>No day closed yet.</td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.day}>
                <td>{r.day}</td>
                <td>{r.coreHealth}</td>
                <td>{r.incidentCount}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function Trend({ rows }: { rows: { day: number; coreHealth: number; incidentCount: number }[] }) {
  if (rows.length === 0) return null;
  const w = 280;
  const h = 96;
  const pts = rows.map((r, i) => {
    const x = rows.length === 1 ? w / 2 : 20 + (i * (w - 40)) / (rows.length - 1);
    const y = 22 + (1 - r.coreHealth / 100) * 46;
    return { x, y, r };
  });
  const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} role="img" aria-label="Core health by day. Numbers sit on the points. The table repeats them." data-testid="results-trend">
      <polyline fill="none" stroke={COL.gold} strokeWidth="1.5" points={line} />
      {pts.map((p) => (
        <g key={p.r.day}>
          <circle cx={p.x} cy={p.y} r="2" fill={COL.cream} />
          <text x={p.x} y={p.y - 5} fontSize="12" textAnchor="middle" fill={COL.ink}>
            {p.r.coreHealth}
          </text>
          <text x={p.x} y={h - 2} fontSize="12" textAnchor="middle" fill={CAPTION}>
            {p.r.day}
            {p.r.incidentCount > 0 ? " i" : ""}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function CoreMapApp({ s, onResults }: { s: GameState; onResults: (patch: Partial<ResultsSave>) => void }) {
  const plant = s.plant ?? DEFAULT_PLANT;
  // The grid and the count come from results, so closing and reopening the window keeps them.
  const [grid, setGrid] = useState<Burn[]>(() => readCoreMap(s.results.coreMap).grid);
  const [swaps, setSwaps] = useState(() => readCoreMap(s.results.coreMap).swaps);
  const [pick, setPick] = useState<number | null>(null);
  const flux = fluxOf(grid, plant.enrich);
  const ok = passes(flux, swaps);

  const choose = (i: number) => {
    if (pick === null) {
      setPick(i);
      return;
    }
    if (pick === i) {
      setPick(null);
      return;
    }
    const next = grid.slice();
    [next[pick], next[i]] = [next[i], next[pick]];
    const n = swaps + 1;
    setGrid(next);
    setSwaps(n);
    setPick(null);
    s.results.coreMap = rememberCoreMap(next, n);
    const f = fluxOf(next, plant.enrich);
    if (passes(f, n) && (s.results.shuffleBest === null || f.fq < s.results.shuffleBest)) {
      onResults({ shuffleBest: f.fq });
    }
  };

  return (
    <div className="p-3" style={FIELD} data-testid="app-coremap">
      <p style={{ margin: 0, fontSize: 14 }}>Core Map</p>
      <p style={{ fontSize: 12 }}>
        Enrichment {plant.enrich.toFixed(1)}%. {BURNUP_PENDING} Fq {flux.fq.toFixed(2)}. Swaps {swaps}.{" "}
        {ok ? "Pass." : "Not a pass yet."}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 28px)", gap: 4 }} data-testid="core-grid">
        {grid.map((cell, i) => (
          <button
            key={i}
            type="button"
            onClick={() => choose(i)}
            aria-label={`Assembly ${i + 1}, burn class ${cell}, enrichment ${plant.enrich.toFixed(1)} percent`}
            title={`Burn class ${cell}. Design enrichment ${plant.enrich.toFixed(1)}%. Per-assembly burnup is not cited.`}
            style={{
              width: 28,
              height: 28,
              background: pick === i ? "#c4783a" : cell === 0 ? "#f3e6d0" : cell === 1 ? "#c9a227" : "#6a4a32",
              color: "#16110d",
              border: `1px solid ${COL.ink}`,
              fontFamily: "inherit",
              fontSize: 12,
            }}
          >
            {cell}
          </button>
        ))}
      </div>
      {s.results.shuffleBest !== null ? (
        <p style={{ fontSize: 12 }}>Best Fq {s.results.shuffleBest.toFixed(2)}. This does not close the Day 5 shuffle.</p>
      ) : null}
    </div>
  );
}
