"use client";

import { useEffect, useRef } from "react";
import { BANDS, NATIVE_H, NATIVE_W, PWR_SHAPES, bandColor, pwrLabels, type Label } from "./schematicMath";

/**
 * PWR loop, drawn at native pixel size and shown at whole-number scale (STYLE-STANDARD §2.4).
 * Colour = temperature on the seven fixed bands (§4). Every pipe has a flow arrow. Pressure and
 * hot and cold temperatures are labelled. The footer is required (§4). Teaching drawing only.
 */

const W = NATIVE_W;
const H = NATIVE_H;
const OUTLINE = "#3b2318";
const CREAM = "#f3e6d0";
const DIM = "#b5a48c";
const STEEL = "#3d5c66";
const GOLD = "#c9a227";
const PANEL = "#2a261e";

function rect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, edge = OUTLINE) {
  g.fillStyle = fill;
  g.fillRect(x, y, w, h);
  g.fillStyle = edge;
  g.fillRect(x, y, w, 1);
  g.fillRect(x, y + h - 1, w, 1);
  g.fillRect(x, y, 1, h);
  g.fillRect(x + w - 1, y, 1, h);
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

export function drawPwr(g: CanvasRenderingContext2D, tHot: number, tCold: number) {
  g.imageSmoothingEnabled = false;
  g.fillStyle = "#1c1410";
  g.fillRect(0, 0, NATIVE_W, NATIVE_H);

  const hot = bandColor(tHot);
  const cold = bandColor(tCold);
  const ORANGE = "#e8963a";
  const S = PWR_SHAPES;

  // Hot leg: core top-right to the steam generator, with a flow arrow.
  g.fillStyle = OUTLINE;
  g.fillRect(S.hot.x, S.hot.y, S.hot.w, S.hot.h);
  g.fillStyle = hot;
  g.fillRect(S.hot.x, S.hot.y + 1, S.hot.w, S.hot.h - 2);
  arrow(g, 50, 18, 1, CREAM);

  // Cold leg: steam generator back to the core, with the pump on it and a flow arrow.
  g.fillStyle = OUTLINE;
  g.fillRect(S.cold.x, S.cold.y, S.cold.w, S.cold.h);
  g.fillStyle = cold;
  g.fillRect(S.cold.x, S.cold.y + 1, S.cold.w, S.cold.h - 2);
  arrow(g, 58, 52, -1, CREAM);
  pixelCircle(g, 42, 52, 4, "#2a3238", OUTLINE);

  // Core, filled with the hot-leg temperature.
  rect(g, S.core.x, S.core.y, S.core.w, S.core.h, hot);

  // Steam generator.
  rect(g, S.sg.x, S.sg.y, S.sg.w, S.sg.h, STEEL);

  // Heat leaves the steam generator toward the turbine side.
  g.fillStyle = ORANGE;
  g.fillRect(86, 40, 4, 2);
  arrow(g, 91, 41, 1, ORANGE);

  // Pressurizer, outlined like everything else.
  rect(g, S.pzr.x, S.pzr.y, S.pzr.w, S.pzr.h, PANEL);

  // Colour scale, hot at the top: seven bands, each 6 px, with a 1 px outline.
  const bandH = S.bar.h / 7;
  for (let i = 0; i < 7; i++) {
    g.fillStyle = BANDS[6 - i];
    g.fillRect(S.bar.x, S.bar.y + i * bandH, S.bar.w, bandH);
  }
  g.fillStyle = OUTLINE;
  g.fillRect(S.bar.x, S.bar.y, S.bar.w, 1);
  g.fillRect(S.bar.x, S.bar.y + S.bar.h - 1, S.bar.w, 1);
}

export function PixelSchematic({ tHot, tCold }: { tHot: number; tCold: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    const g = c?.getContext("2d");
    if (!c || !g) return;
    drawPwr(g, tHot, tCold);
  }, [tHot, tCold]);

  const labels = pwrLabels(tHot, tCold);
  const tone: Record<Label["color"], string> = { cream: CREAM, dim: DIM, outline: OUTLINE, gold: GOLD, orange: "#e8963a" };
  return (
    <div
      className="relative mx-auto mt-4 h-[160px] w-[320px] sm:h-[240px] sm:w-[480px]"
      role="img"
      aria-label={`PWR loop drawing. Hot leg ${tHot.toFixed(0)} degrees, cold leg ${tCold.toFixed(0)} degrees.`}
    >
      <canvas ref={ref} width={W} height={H} aria-hidden className="absolute inset-0 h-full w-full" style={{ imageRendering: "pixelated" }} />
      {labels.map((l) => (
        <span
          key={`${l.x}-${l.y}-${l.text}`}
          aria-hidden
          className="schematic-label pointer-events-none absolute whitespace-nowrap"
          style={{
            left: `${(l.x / W) * 100}%`,
            top: `${(l.y / H) * 100}%`,
            color: tone[l.color],
          }}
        >
          {l.text}
        </span>
      ))}
    </div>
  );
}
