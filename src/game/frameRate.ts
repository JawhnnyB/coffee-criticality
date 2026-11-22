import type { DesktopSave } from "./sim";

/** Saved on the desktop object. Old saves omit it and mean Auto. */
export type FrameChoice = "auto" | "60" | "30";

export function frameChoice(d: DesktopSave): FrameChoice {
  const v = (d as DesktopSave & { frameRate?: unknown }).frameRate;
  return v === "60" || v === "30" ? v : "auto";
}

export function framePatch(v: FrameChoice): Partial<DesktopSave> {
  return { frameRate: v } as Partial<DesktopSave>;
}
