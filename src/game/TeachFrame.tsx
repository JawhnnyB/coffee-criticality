"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ART } from "./artFlags";
import { Chatter } from "./Chatter";
import { isRevealing, subscribeReveal } from "./chatter";

/** Shared teaching chrome for Priya's designer and Academy. Visual only. */
export function TeachMeta({ children }: { children: ReactNode }) {
  return <p className="teach-meta">{children}</p>;
}

export function TeachPriya({ line, size = 96 }: { line: string; size?: 64 | 96 | 128 }) {
  const [talk, setTalk] = useState(isRevealing);
  useEffect(() => subscribeReveal(setTalk), []);
  if (ART.menu) {
    const zoom = 6;
    return (
      <div className="teach-paper flex flex-wrap items-start gap-3">
        <img
          src={talk ? "/art/ui/priya-talk.png" : "/art/ui/priya-48.png"}
          alt="Dr. Priya Sharma"
          width={48}
          height={48}
          className="shrink-0"
          style={{ width: 48 * zoom, height: 48 * zoom, imageRendering: "pixelated" }}
        />
        <Chatter key={line} text={line} voice="priya" className="teach-body cc-prose min-w-0 flex-1" />
      </div>
    );
  }
  const px = size === 64 ? "h-16 w-16" : size === 128 ? "h-32 w-32" : "h-24 w-24";
  return (
    <div className="teach-paper flex gap-3">
      <img
        src={talk ? "/art/ui/priya-talk.png" : "/art/ui/priya-48.png"}
        alt="Dr. Priya Sharma"
        width={size}
        height={size}
        className={`${px} shrink-0 object-cover`}
        style={{ imageRendering: "pixelated" }}
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
