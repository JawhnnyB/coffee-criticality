"use client";

import { useEffect, useRef, useState } from "react";
import { PAL } from "./palette";
import { DEFAULT_PLANT, plantTitle, type PlantDesign } from "./plant";
import { computeKeff } from "./nuclearLab";
import { fluxOf, passes, startMap, type Burn } from "./shuffleModel";
import {
  BURNUP_PENDING,
  camFrame,
  cellCount,
  coreHealth,
  easeScram,
  glowColor,
  inBandFraction,
  lookLine,
  particleCount,
  stepFlow,
  type CamFrame,
  type FlowDot,
  type Health,
} from "./reactorReadout";
import type { GameState, ResultsSave } from "./sim";

const FIELD = { fontFamily: "CCPixel3x5, monospace", color: PAL.ink } as const;

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
  const live = useRef({ plant, run: s.run, reduced: s.desktop.reducedMotion, health: health.score });
  live.current = { plant, run: s.run, reduced: s.desktop.reducedMotion, health: health.score };

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
    const tick = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (c.offsetParent !== null) {
        const cur = live.current;
        factor = easeScram(factor, !!cur.run.scram, dt);
        const shot = camFrame(cur.plant, cur.run, factor);
        const next = shot.glow;
        if (!seen || !cur.reduced || Math.abs(next - shown) / Math.max(shown, 0.05) > 0.05) {
          shown = next;
          seen = true;
        }
        const stop = cur.reduced || shot.scram;
        const count = particleCount(shot.count, stop);
        stepFlow(dots, count, shot.speed, cur.plant.type, dt, stop);
        drawCam(g, cur.plant, shot, cellCount(cur.plant.scale, cur.plant.sizeClass, cur.plant.fullCore), dots, shown, cur.health);
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
      <p style={{ margin: "4px 0 8px", fontSize: 12, color: "#5c4636" }}>
        Teaching view. Glow shows fuel activity and core temperature. Not a measurement.
      </p>
      {missing ? <p style={{ fontSize: 12 }}>Using the default design.</p> : null}
      <canvas
        ref={ref}
        width={160}
        height={96}
        aria-hidden
        style={{ width: 320, height: 192, imageRendering: "pixelated", background: "#1c1410", display: "block" }}
      />
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

function drawCam(
  g: CanvasRenderingContext2D,
  plant: PlantDesign,
  frame: CamFrame,
  cells: number,
  dots: readonly FlowDot[],
  glowValue: number,
  health: number,
) {
  g.imageSmoothingEnabled = false;
  g.fillStyle = "#1c1410";
  g.fillRect(0, 0, 160, 96);
  const edge = frame.scram ? "#3d5c66" : frame.band === "in" ? "#c9a227" : frame.band === "low" ? "#3d5c66" : "#c4783a";
  g.fillStyle = edge;
  g.fillRect(8, 8, 144, 80);
  g.fillStyle = "#2a241c";
  g.fillRect(10, 10, 140, 76);
  const glow = glowColor(glowValue);
  if (plant.scale === "rod") drawRod(g, glow);
  else if (plant.type === "pebble") drawPebbles(g, cells, glow);
  else drawLattice(g, plant, cells, glow);
  if (plant.type === "pwr" || plant.type === "msr") drawChevrons(g);
  if (plant.type === "bwr") {
    g.fillStyle = "#f4ecd8";
    const bubbles = Math.round(frame.voidFrac * 8);
    for (let i = 0; i < bubbles; i++) g.fillRect(22 + i * 8, 22 + (i % 3) * 6, 2, 2);
  }
  g.fillStyle = "#f3e6d0";
  for (const p of dots) g.fillRect(p.x, p.y, 1, 1);
  g.fillStyle = "#f3e6d0";
  g.font = "8px monospace";
  g.fillText(String(health), 126, 18);
}

function drawRod(g: CanvasRenderingContext2D, glow: string) {
  g.fillStyle = "#4e5560";
  g.fillRect(68, 18, 24, 60);
  g.fillStyle = "#1c1410";
  g.fillRect(70, 20, 20, 56);
  g.fillStyle = glow;
  for (let i = 0; i < 7; i++) g.fillRect(72, 22 + i * 8, 16, 6);
  g.fillStyle = "#2a241c";
  g.fillRect(79, 22, 2, 52);
}

function drawLattice(g: CanvasRenderingContext2D, plant: PlantDesign, cells: number, glow: string) {
  const cols = Math.ceil(Math.sqrt(cells));
  const rows = Math.ceil(cells / cols);
  const cw = Math.floor(120 / cols);
  const ch = Math.floor(60 / rows);
  for (let i = 0; i < cells; i++) {
    const x = 18 + (i % cols) * cw;
    const y = 16 + Math.floor(i / cols) * ch;
    const w = Math.max(2, cw - 2);
    const h = Math.max(2, ch - 2);
    if (plant.type === "msr") {
      g.fillStyle = "#4e5560";
      g.fillRect(x, y, w, h);
      g.fillStyle = glow;
      g.fillRect(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 2));
    } else {
      g.fillStyle = "#4e5560";
      g.fillRect(x, y, w, h);
      g.fillStyle = "#1c1410";
      g.fillRect(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 2));
      g.fillStyle = glow;
      g.fillRect(x + 2, y + 1, Math.max(1, w - 4), Math.max(1, h - 2));
    }
  }
}

function drawPebbles(g: CanvasRenderingContext2D, cells: number, glow: string) {
  const cols = Math.ceil(Math.sqrt(cells));
  const rows = Math.ceil(cells / cols);
  const cw = Math.floor(120 / cols);
  const ch = Math.floor(60 / rows);
  for (let i = 0; i < cells; i++) {
    const x = 20 + (i % cols) * cw;
    const y = 18 + Math.floor(i / cols) * ch;
    const r = Math.max(1, Math.floor(Math.min(cw, ch) / 2) - 1);
    g.fillStyle = glow;
    g.fillRect(x, y, r, r);
    g.fillStyle = "#3d5c66";
    g.fillRect(x + r, y, 1, 1);
  }
}

/** Down the outside, up the middle. The dots carry the motion. */
function drawChevrons(g: CanvasRenderingContext2D) {
  g.fillStyle = "#8a8070";
  g.fillRect(14, 28, 2, 2);
  g.fillRect(13, 30, 4, 1);
  g.fillRect(14, 48, 2, 2);
  g.fillRect(13, 50, 4, 1);
  g.fillRect(78, 58, 2, 2);
  g.fillRect(77, 56, 4, 1);
  g.fillRect(78, 40, 2, 2);
  g.fillRect(77, 38, 4, 1);
}

export function ResultsApp({ s }: { s: GameState }) {
  const plant = s.plant ?? DEFAULT_PLANT;
  const health = healthOf(s, plant);
  const rows = (s.results.daily as { day: number; coreHealth: number; incidentCount: number }[]) ?? [];
  return (
    <div className="p-3" style={FIELD} data-testid="app-results">
      <p style={{ margin: 0, fontSize: 14 }}>Results</p>
      <p style={{ fontSize: 28, margin: "6px 0" }}>{health.score}</p>
      <table style={{ fontSize: 12, borderCollapse: "collapse" }}>
        <tbody>
          {health.parts.map((p) => (
            <tr key={p.id}>
              <td style={{ paddingRight: 12 }}>{p.label}</td>
              <td>{Math.round(p.weight * 100)}%</td>
              <td style={{ paddingLeft: 12 }}>{Math.round(p.value * 100)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 12, marginTop: 8 }}>{lookLine(s.setup.stance, health.parts)}</p>
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
  const h = 78;
  const pts = rows.map((r, i) => {
    const x = rows.length === 1 ? w / 2 : 20 + (i * (w - 40)) / (rows.length - 1);
    const y = 14 + (1 - r.coreHealth / 100) * 42;
    return { x, y, r };
  });
  const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} role="img" aria-label="Core health by day. Numbers sit on the points. The table repeats them." data-testid="results-trend">
      <polyline fill="none" stroke="#c9a227" strokeWidth="1.5" points={line} />
      {pts.map((p) => (
        <g key={p.r.day}>
          <circle cx={p.x} cy={p.y} r="2" fill="#f3e6d0" />
          <text x={p.x} y={p.y - 4} fontSize="8" textAnchor="middle" fill="#16110d">
            {p.r.coreHealth}
          </text>
          <text x={p.x} y={h - 2} fontSize="8" textAnchor="middle" fill="#5c4636">
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
  const [grid, setGrid] = useState<Burn[]>(() => startMap());
  const [swaps, setSwaps] = useState(0);
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
              border: "1px solid #3b2318",
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
