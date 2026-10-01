"use client";

import type { ReactNode } from "react";

/** Shared teaching chrome for Priya's designer and Academy. Visual only. */
export function TeachMeta({ children }: { children: ReactNode }) {
  return <p className="teach-meta">{children}</p>;
}

export function TeachPriya({ line, size = 96 }: { line: string; size?: 64 | 96 | 128 }) {
  const px = size === 64 ? "h-16 w-16" : size === 128 ? "h-32 w-32" : "h-24 w-24";
  return (
    <div className="teach-paper flex gap-3">
      <img
        src="/art/gen/portraits/priya_talk.png?v=eval1"
        alt="Dr. Priya Sharma"
        width={size}
        height={size}
        className={`${px} shrink-0 object-contain teach-pixel`}
      />
      <p className="teach-body min-w-0">{line}</p>
    </div>
  );
}

export function TeachReadout({ k, v }: { k: string; v: string }) {
  return (
    <div className="border border-[#3a2818] bg-[#16110d] px-2 py-2">
      <div className="teach-kicker">{k}</div>
      <div className="teach-value mt-1">{v}</div>
    </div>
  );
}

export const TYPE_THUMB: Record<string, string> = {
  pwr: "/art/gen/stills/thumb_pwr.png?v=gauge",
  bwr: "/art/gen/stills/thumb_bwr.png?v=gauge",
  pebble: "/art/gen/stills/thumb_pebble.png",
  msr: "/art/gen/stills/thumb_msr.png",
};
