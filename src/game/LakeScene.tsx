"use client";

import { useEffect, useRef } from "react";
import type { Season } from "./parlorOS";
import type { CutawayKind } from "./plantLoops";
import { WALL_NATIVE_H, WALL_NATIVE_W, paintWallpaper } from "./wallpaper";

/**
 * The lake and the plant, painted by code at a whole-number scale. It fills its parent.
 * The desktop uses it as the wallpaper. The screens outside a room use it as the backdrop.
 */
/** site: the reactor this plant runs. power: 0 to 1, for the cooling tower plume. */
export function LakeScene({ season, testId, site = "pwr", power = 1 }: { season: Season; testId?: string; site?: CutawayKind; power?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const host = c?.parentElement;
    if (!c || !host) return;
    const paint = () => {
      // Layout size, not the on-screen box: the parent can be mid-transition when this runs.
      const w = Math.max(1, host.clientWidth);
      const hgt = Math.max(1, host.clientHeight);
      // Whole-number scale: every painted pixel covers the same number of screen pixels.
      const scale = Math.max(1, Math.round(Math.min(hgt / WALL_NATIVE_H, w / WALL_NATIVE_W)));
      const nw = Math.ceil(w / scale);
      const nh = Math.ceil(hgt / scale);
      c.width = nw;
      c.height = nh;
      c.style.width = `${nw * scale}px`;
      c.style.height = `${nh * scale}px`;
      const g = c.getContext("2d");
      if (!g) return;
      g.imageSmoothingEnabled = false;
      paintWallpaper(g, nw, nh, season, site, power);
    };
    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(host);
    return () => ro.disconnect();
  }, [season, site, Math.round(power * 10)]);
  return <canvas ref={ref} aria-hidden data-testid={testId} data-site={site} className="pointer-events-none absolute left-0 top-0 max-w-none" style={{ imageRendering: "pixelated" }} />;
}
