"use client";

import { useEffect, useRef } from "react";
import {
  BANDS,
  BAND_TICK,
  BWR_SHAPES,
  DRAWINGS,
  MSR_SHAPES,
  NATIVE_H,
  NATIVE_W,
  PEBBLE_SHAPES,
  PWR_SHAPES,
  SCALES,
  bandColor,
  type Label,
  type PlantKey,
  type Rect,
} from "./schematicMath";

/**
 * Reactor drawings at native pixel size (160 × 80), shown at whole-number scale (STYLE-STANDARD §2.4, §4).
 * Colour = temperature on the seven fixed bands. Every pipe has a flow arrow. Pressure, hot and cold
 * temperatures and the heat exit are labelled. The footer is required. Teaching drawing only.
 */

const OUTLINE = "#3b2318";
const CREAM = "#f3e6d0";
const STEEL = "#3d5c66";
const PANEL = "#2a261e";
const BG = "#1c1410";
const PUMP = "#2a3238";
const ORANGE = "#e8963a";
// Fixed colours from STYLE-STANDARD §4.
const STEAM = "#f4ecd8";
const COOLANT = "#d8b050";
const HELIUM = "#d4cce6";
const GRAPHITE = "#4e5560";
const FROZEN = "#b8e0f0";

/** Outlined box: 1 px outline, flat fill. Vessels, pipes and objects are all boxes. */
function box(g: CanvasRenderingContext2D, r: Rect, fill: string) {
  g.fillStyle = OUTLINE;
  g.fillRect(r.x, r.y, r.w, r.h);
  g.fillStyle = fill;
  g.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
}

/** Flow arrow, 5 px long, pointing right (dir 1) or left (dir -1). */
function arrow(g: CanvasRenderingContext2D, cx: number, cy: number, dir: 1 | -1, color: string) {
  g.fillStyle = color;
  for (let i = 0; i < 3; i++) {
    const half = i === 0 ? 2 : i === 1 ? 1 : 0;
    const x = dir === 1 ? cx - 2 + i : cx + 2 - i;
    g.fillRect(x, cy - half, 1, half * 2 + 1);
  }
}

/** Flow arrow, 5 px tall, pointing down (dir 1) or up (dir -1). */
function varrow(g: CanvasRenderingContext2D, cx: number, cy: number, dir: 1 | -1, color: string) {
  g.fillStyle = color;
  for (let i = 0; i < 3; i++) {
    const half = i === 0 ? 2 : i === 1 ? 1 : 0;
    const y = dir === 1 ? cy - 2 + i : cy + 2 - i;
    g.fillRect(cx - half, y, half * 2 + 1, 1);
  }
}

/** Single-pixel lattice inside a rect: steam (cream) or helium gas (lilac). Alternate rows are offset. */
function dots(g: CanvasRenderingContext2D, r: Rect, color: string) {
  g.fillStyle = color;
  let row = 0;
  for (let y = r.y + 2; y <= r.y + r.h - 2; y += 3, row++) {
    for (let x = r.x + 2 + (row % 2); x <= r.x + r.w - 2; x += 3) g.fillRect(x, y, 1, 1);
  }
}

/** Filled circle with a 1 px outline, drawn row by row so every edge is a hard pixel edge. */
function pixelCircle(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: string, edge: string) {
  for (let dy = -(r + 1); dy <= r + 1; dy++) {
    const inner = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)));
    const outer = Math.round(Math.sqrt(Math.max(0, (r + 1) * (r + 1) - dy * dy)));
    g.fillStyle = edge;
    g.fillRect(cx - outer, cy + dy, outer * 2 + 1, 1);
    g.fillStyle = fill;
    if (Math.abs(dy) <= r) g.fillRect(cx - inner, cy + dy, inner * 2 + 1, 1);
  }
}

/** Colour bar: seven 6 px bands, hot at the top, outlined. Colour-safe adds one tick per band (see BAND_TICK). */
function scaleBar(g: CanvasRenderingContext2D, r: Rect, safe: boolean) {
  const h = r.h / 7;
  for (let i = 0; i < 7; i++) {
    const band = 6 - i;
    g.fillStyle = BANDS[band];
    g.fillRect(r.x, r.y + i * h, r.w, h);
    if (safe) {
      g.fillStyle = BAND_TICK[band];
      for (let n = 0; n < Math.min(4, band + 1); n++) g.fillRect(r.x + 1, r.y + i * h + 1 + n, 2, 1);
    }
  }
  g.fillStyle = OUTLINE;
  g.fillRect(r.x, r.y, r.w, 1);
  g.fillRect(r.x, r.y + r.h - 1, r.w, 1);
}

function drawPwr(g: CanvasRenderingContext2D, hot: string, cold: string) {
  const S = PWR_SHAPES;
  // Hot leg, core top-right to the steam generator, with a flow arrow.
  box(g, S.hot, hot);
  arrow(g, 50, 18, 1, CREAM);
  // Cold leg with the pump on it and a flow arrow.
  box(g, S.cold, cold);
  arrow(g, 58, 52, -1, CREAM);
  pixelCircle(g, 42, 52, 4, PUMP, OUTLINE);
  box(g, S.core, hot);
  box(g, S.sg, STEEL);
  // Heat leaves the steam generator toward the turbine side.
  g.fillStyle = ORANGE;
  g.fillRect(86, 40, 4, 2);
  arrow(g, 91, 41, 1, ORANGE);
  box(g, S.pzr, PANEL);
  // Control rods enter from the top: three rods in the drive housing above the core.
  box(g, S.rods, PANEL);
  g.fillStyle = GRAPHITE;
  for (const x of [24, 26, 28]) g.fillRect(x, 3, 1, 9);
  // Secondary steam, shown by dots.
  g.fillStyle = PANEL;
  g.fillRect(S.steam.x, S.steam.y, S.steam.w, S.steam.h);
  dots(g, S.steam, STEAM);
}

function drawBwr(g: CanvasRenderingContext2D, hot: string, cold: string) {
  const S = BWR_SHAPES;
  box(g, S.vessel, PANEL);
  box(g, S.downL, cold);
  box(g, S.downR, cold);
  box(g, S.dome, PANEL);
  dots(g, S.dome, STEAM);
  box(g, S.core, hot);
  // Steam goes straight to the turbine. No steam generator.
  box(g, S.steamLine, PANEL);
  dots(g, S.steamLine, STEAM);
  arrow(g, 92, 9, 1, CREAM);
  box(g, S.turbine, STEEL);
  // Feedwater returns into the downcomer.
  box(g, S.feed, cold);
  arrow(g, 92, 41, -1, CREAM);
  // Recirculation loop and its pump.
  box(g, S.recirc, cold);
  arrow(g, 40, 53, -1, CREAM);
  pixelCircle(g, 30, 53, 4, PUMP, OUTLINE);
  // Control-rod drives enter from below.
  box(g, S.rods, PANEL);
  g.fillStyle = GRAPHITE;
  for (const x of [59, 63, 67]) g.fillRect(x, 57, 1, 5);
}

function drawPebble(g: CanvasRenderingContext2D, hot: string, cold: string) {
  const S = PEBBLE_SHAPES;
  box(g, S.vessel, PANEL);
  // Helium: cold at the top of the bed, hot at the bottom.
  box(g, S.bedTop, cold);
  box(g, S.bedBot, hot);
  for (const cy of [16, 23, 30, 37, 44, 51]) {
    for (const cx of [35, 42, 49]) pixelCircle(g, cx, cy, 2, GRAPHITE, OUTLINE);
  }
  // Helium rises in the side-reflector riser, reverses at the top, and flows down through the bed.
  box(g, S.riser, cold);
  varrow(g, 20, 30, -1, CREAM);
  box(g, S.plenum, cold);
  arrow(g, 40, 7, 1, CREAM);
  box(g, S.hotPipe, hot);
  arrow(g, 74, 51, 1, CREAM);
  box(g, S.sg, STEEL);
  box(g, S.coldRet, cold);
  arrow(g, 60, 62, -1, CREAM);
  g.fillStyle = ORANGE;
  g.fillRect(S.heat.x, S.heat.y, S.heat.w, S.heat.h);
  arrow(g, 122, 41, 1, ORANGE);
}

function drawMsr(g: CanvasRenderingContext2D, hot: string, cold: string) {
  const S = MSR_SHAPES;
  // Fuel salt through graphite channels.
  box(g, S.core, hot);
  for (const s of [S.str0, S.str1, S.str2, S.str3, S.str4]) box(g, s, GRAPHITE);
  // Pump bowl with helium cover gas above the salt.
  box(g, S.pumpBowl, PANEL);
  dots(g, { x: 55, y: 5, w: 12, h: 5 }, HELIUM);
  box(g, S.hotSalt, hot);
  arrow(g, 50, 12, 1, CREAM);
  box(g, S.toHx, hot);
  arrow(g, 72, 12, 1, CREAM);
  // Heat exchanger: fuel salt in, cooled fuel salt back to the core.
  box(g, S.hx, STEEL);
  box(g, S.retPipe, cold);
  arrow(g, 60, 37, -1, CREAM);
  // Separate coolant salt loop to the steam generator.
  box(g, S.coolOut, COOLANT);
  arrow(g, 96, 15, 1, OUTLINE);
  box(g, S.coolRet, COOLANT);
  arrow(g, 96, 31, -1, OUTLINE);
  box(g, S.sg, STEEL);
  g.fillStyle = ORANGE;
  g.fillRect(S.heat.x, S.heat.y, S.heat.w, S.heat.h);
  arrow(g, 122, 21, 1, ORANGE);
  // Freeze plug above the drain tank.
  box(g, S.freeze, FROZEN);
  box(g, S.drain, PANEL);
}

/** Draws one plant on the native grid. Colours come from that plant's scale. */
export function drawPlant(plant: PlantKey, g: CanvasRenderingContext2D, tHot: number, tCold: number, safe = false) {
  g.imageSmoothingEnabled = false;
  g.fillStyle = BG;
  g.fillRect(0, 0, NATIVE_W, NATIVE_H);
  const s = SCALES[plant];
  const hot = bandColor(tHot, s.lo, s.hi);
  const cold = bandColor(tCold, s.lo, s.hi);
  if (plant === "pwr") drawPwr(g, hot, cold);
  else if (plant === "bwr") drawBwr(g, hot, cold);
  else if (plant === "pebble") drawPebble(g, hot, cold);
  else drawMsr(g, hot, cold);
  scaleBar(g, DRAWINGS[plant].shapes.bar, safe);
}

const NAME: Record<PlantKey, string> = { pwr: "PWR", bwr: "BWR", pebble: "Pebble bed", msr: "Molten salt" };

export function PixelSchematic({ plant = "pwr", tHot, tCold, colorSafe = false }: { plant?: PlantKey; tHot: number; tCold: number; colorSafe?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    const g = c?.getContext("2d");
    if (!c || !g) return;
    drawPlant(plant, g, tHot, tCold, colorSafe);
  }, [plant, tHot, tCold, colorSafe]);

  const labels: Label[] = DRAWINGS[plant].labels(tHot, tCold);
  const tone: Record<Label["color"], string> = { cream: CREAM, dim: "#b5a48c", outline: OUTLINE, gold: "#c9a227", orange: ORANGE };
  return (
    <div
      className="schematic-stage relative mx-auto mt-4"
      role="img"
      aria-label={`${NAME[plant]} loop drawing. Hot leg ${tHot.toFixed(0)} degrees, cold leg ${tCold.toFixed(0)} degrees.`}
    >
      <canvas ref={ref} width={NATIVE_W} height={NATIVE_H} aria-hidden className="absolute inset-0 h-full w-full" style={{ imageRendering: "pixelated" }} />
      {labels.map((l) => (
        <span
          key={`${l.x}-${l.y}-${l.text}`}
          aria-hidden
          className={"schematic-label pointer-events-none absolute whitespace-nowrap" + (/MPA/.test(l.text) ? " schematic-label-mpa" : l.text === "HEAT" ? " schematic-label-heat" : "")}
          style={{
            left: `${(l.x / NATIVE_W) * 100}%`,
            top: `${(l.y / NATIVE_H) * 100}%`,
            color: tone[l.color],
          }}
        >
          {l.text}
        </span>
      ))}
    </div>
  );
}
