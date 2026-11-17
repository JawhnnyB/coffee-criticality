"use client";

import { useEffect, useRef } from "react";
import { CUTAWAY_H, CUTAWAY_W, paintCutaway, type LiveRun } from "./cutawayPaint";
import { sitePower, type CutawayKind } from "./plantLoops";

export { sitePower };

/** The still ids that show a plant cutaway, and which plant each one shows. */
export const STILL_CUTAWAY: Record<string, CutawayKind> = {
  pwr: "pwr",
  mural_criticality: "pwr",
  bwr: "bwr",
  pebble: "pebble",
  msr: "msr",
  msr_fhr: "fhr",
  msr_fast: "msfr",
};

/** Frames a second for the moving parts. Low on purpose: pixel art moves in steps. */
const FPS = 12;

/**
 * A plant cutaway that fills its parent at a whole-number scale and animates its flows.
 * With reduced motion it paints one frame and stops.
 * fit "width": as wide as the parent allows. fit "contain": the largest size inside the parent.
 */
export function PlantCutaway({
  kind,
  hot = true,
  fit = "width",
  className = "",
  testId = "plant-cutaway",
  live,
  maxScale = 6,
}: {
  kind: CutawayKind;
  hot?: boolean;
  /** A run to follow. Read on every frame, so changing it does not restart the drawing. */
  live?: LiveRun;
  /** The largest whole-number scale to draw at. */
  maxScale?: number;
  fit?: "width" | "contain";
  className?: string;
  testId?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLCanvasElement>(null);
  const liveRef = useRef(live);
  liveRef.current = live;
  useEffect(() => {
    const c = ref.current;
    const host = hostRef.current;
    if (!c || !host) return;
    c.width = CUTAWAY_W;
    c.height = CUTAWAY_H;
    const g = c.getContext("2d");
    if (!g) return;
    const size = () => {
      const byW = host.clientWidth / CUTAWAY_W;
      const byH = fit === "contain" ? host.clientHeight / CUTAWAY_H : byW;
      const scale = Math.max(1, Math.min(maxScale, Math.floor(Math.min(byW, byH))));
      c.style.width = `${CUTAWAY_W * scale}px`;
      c.style.height = `${CUTAWAY_H * scale}px`;
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(host);
    let still = false;
    try {
      still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      still = false;
    }
    let raf = 0;
    let last = -1;
    const start = performance.now();
    const tick = (now: number) => {
      const frame = Math.floor(((now - start) / 1000) * FPS);
      if (frame !== last) {
        last = frame;
        paintCutaway(g, kind, { hot, t: frame / FPS, live: liveRef.current });
      }
      raf = requestAnimationFrame(tick);
    };
    let stillTimer = 0;
    if (still) {
      // Reduced motion: one frame, repainted twice a second so a live run still shows its state.
      const once = () => paintCutaway(g, kind, { hot, t: 0.7, live: liveRef.current });
      once();
      stillTimer = window.setInterval(once, 500);
    } else raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(stillTimer);
      ro.disconnect();
    };
  }, [kind, hot, fit, maxScale]);
  return (
    <div ref={hostRef} className={"flex items-center justify-center overflow-hidden " + className}>
      <canvas ref={ref} aria-hidden data-testid={testId} data-kind={kind} data-hot={hot ? "1" : "0"} style={{ imageRendering: "pixelated", maxWidth: "none" }} />
    </div>
  );
}
