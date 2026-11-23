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

export type TextSize = "small" | "normal" | "large";

export interface Mix {
  master: number;
  music: number;
  sound: number;
  ambience: number;
}

const TEXT: TextSize[] = ["small", "normal", "large"];

function unit(v: unknown, fallback: number) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function textOf(v: unknown): TextSize {
  return v === "small" || v === "large" || v === "normal" ? v : "normal";
}

let cached: { mix: Mix; text: TextSize; reduced: boolean; shake: boolean } | null = null;

function current() {
  if (cached) return cached;
  const s = readStore();
  cached = {
    mix: {
      master: unit(s.master, 1),
      music: unit(s.music, 1),
      sound: unit(s.sound, 1),
      ambience: unit(s.ambience, 1),
    },
    text: textOf(s.text),
    reduced: s.reducedMotion === true,
    shake: s.shake !== false,
  };
  return cached;
}

function patch(extra: Store) {
  writeStore({ ...readStore(), ...extra });
  cached = null;
}

/** Volumes are 0 to 1. Text size, less motion, and screen shake are saved with the frame rate. */
export function mixLevels(): Mix {
  return current().mix;
}

export function textSize(): TextSize {
  return current().text;
}

export function reducedMotionOn(): boolean {
  return current().reduced;
}

/** Screen shake is on unless the player turned it off. */
export function shakeOn(): boolean {
  return current().shake;
}

export function setMixLevel(key: keyof Mix, value: number) {
  patch({ [key]: unit(value, 1) });
}

export function setTextSize(v: TextSize) {
  const next = textOf(v);
  patch({ text: next });
  applyText(next);
}

export function setReducedMotion(on: boolean) {
  patch({ reducedMotion: on });
  applyMotion(on);
}

export function setShakeOn(on: boolean) {
  patch({ shake: on });
}

function applyText(v: TextSize) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.text = v;
}

function applyMotion(on: boolean) {
  if (typeof document === "undefined") return;
  if (on) document.documentElement.dataset.motion = "reduce";
  else delete document.documentElement.dataset.motion;
  if (typeof window !== "undefined") window.dispatchEvent(new Event("cc-settings"));
}

/** Paint the saved text size and motion onto the page. Call once at startup. */
export function bootSettings() {
  applyText(textSize());
  applyMotion(reducedMotionOn());
}

export { TEXT };
