"use client";

import { useEffect, useRef } from "react";
import { BANDS, bandColor, pwrLabels, type Label } from "./schematicMath";

/**
 * PWR loop, drawn at native pixel size and shown at whole-number scale (STYLE-STANDARD §2.4).
 * Colour = temperature on the seven fixed bands (§4). Every pipe has a flow arrow. Pressure and
 * hot and cold temperatures are labelled. The footer is required (§4). Teaching drawing only.
 */

const W = 160;
const H = 80;
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

export function drawPwr(g: CanvasRenderingContext2D, tHot: number, tCold: number) {
  g.imageSmoothingEnabled = false;
  g.fillStyle = "#1c1410";
  g.fillRect(0, 0, W, H);

  const hot = bandColor(tHot);
  const cold = bandColor(tCold);

  // Hot leg (core top to steam generator), then cold leg (steam generator back to core).
  g.fillStyle = hot;
  g.fillRect(31, 14, 38, 4);
  g.fillStyle = OUTLINE;
  g.fillRect(31, 13, 38, 1);
  g.fillRect(31, 18, 38, 1);
  g.fillStyle = cold;
  g.fillRect(31, 46, 56, 4);
  g.fillStyle = OUTLINE;
  g.fillRect(31, 45, 56, 1);
  g.fillRect(31, 50, 56, 1);
  arrow(g, 50, 16, 1, CREAM);
  arrow(g, 72, 48, -1, CREAM);

  // Core, filled with the hot-leg temperature.
  rect(g, 4, 8, 28, 44, hot);

  // Steam generator.
  rect(g, 68, 6, 18, 44, STEEL);

  // Heat leaves the steam generator to the turbine side.
  arrow(g, 89, 28, 1, "#e8963a");
  g.fillStyle = "#e8963a";
  g.fillRect(86, 28, 2, 1);

  // Pump on the cold leg.
  g.fillStyle = OUTLINE;
  g.beginPath();
  g.arc(44, 48, 5, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#2a3238";
  g.beginPath();
  g.arc(44, 48, 4, 0, Math.PI * 2);
  g.fill();

  // Pressurizer, with its pressure printed beside it.
  rect(g, 88, 2, 9, 10, PANEL, GOLD);

  // Temperature labels on each leg.

  // Colour scale, hot at the top.
  const barX = 137;
  const barY = 6;
  const bandH = 6;
  for (let i = 0; i < 7; i++) {
    g.fillStyle = BANDS[6 - i];
    g.fillRect(barX, barY + i * bandH, 5, bandH);
  }
  g.fillStyle = OUTLINE;
  g.fillRect(barX, barY, 5, 1);
  g.fillRect(barX, barY + 7 * bandH - 1, 5, 1);

  // Required footer, two lines (§4).
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
          className="pointer-events-none absolute whitespace-nowrap font-pixel-label text-[10px] leading-none sm:text-[12px]"
          style={{
            left: `${(l.x / W) * 100}%`,
            top: `${(l.y / H) * 100}%`,
            color: tone[l.color],
            fontFamily: '"CCPixel3x5", monospace',
          }}
        >
          {l.text}
        </span>
      ))}
    </div>
  );
}
