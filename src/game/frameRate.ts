import type { DesktopSave } from "./sim";

/**
 * Picture rate and the other global settings. They live in localStorage next to mute,
 * so a new week does not clear them. An old save may still have frameRate on the desktop.
 */
export type FrameChoice = "auto" | "60" | "30";

const KEY = "cc.settings";

type Store = { frameRate?: FrameChoice; [k: string]: unknown };

let mem: FrameChoice | null = null;

function readStore(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const o = JSON.parse(raw) as Store;
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
}

function writeStore(next: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
}

function asChoice(v: unknown): FrameChoice | null {
  return v === "60" || v === "30" || v === "auto" ? v : null;
}

/** The saved picture rate. Pass the desktop so an old desktop-only choice is copied across. */
export function frameChoice(d?: DesktopSave): FrameChoice {
  if (mem) return mem;
  const stored = asChoice(readStore().frameRate);
  if (stored) {
    mem = stored;
    return mem;
  }
  const legacy = d ? asChoice((d as DesktopSave & { frameRate?: unknown }).frameRate) : null;
  if (legacy && legacy !== "auto") {
    mem = legacy;
    writeStore({ ...readStore(), frameRate: legacy });
    return mem;
  }
  if (d) mem = "auto";
  return "auto";
}

export function setFrameChoice(v: FrameChoice) {
  mem = v;
  writeStore({ ...readStore(), frameRate: v });
}
