/**
 * Window math and key routing for the desktop. Pure functions, so the rules are tested in node.
 * The desktop is the only caller. Nothing here touches the DOM.
 */

export const MIN_W = 240;
export const MIN_H = 160;
export const TITLE_H = 22;
export const TASKBAR_H = 34;

export interface Screen {
  w: number;
  h: number;
}

export interface WinState {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  /** True for a window that hosts a sim overlay (a mini game, Academy, or Reactor Control). */
  sim: boolean;
  /** The sim mode the window is running, when sim is true. */
  simMode?: string;
  /** Mini games. The key router treats these as games. */
  game: boolean;
}

/** A window never leaves the screen, and never goes below the minimum size (or the screen, if the screen is smaller). The bottom edge stays above the taskbar. */
export function clampWin(win: WinState, screen: Screen): WinState {
  const limitH = Math.max(0, screen.h - TASKBAR_H);
  const w = Math.max(Math.min(MIN_W, screen.w), Math.min(Math.max(win.w, MIN_W), screen.w));
  const h = Math.max(Math.min(MIN_H, limitH), Math.min(Math.max(win.h, MIN_H), limitH));
  const maxX = Math.max(0, screen.w - w);
  const maxY = Math.max(0, limitH - h);
  const x = Math.min(maxX, Math.max(0, win.x));
  const y = Math.min(maxY, Math.max(0, win.y));
  return { ...win, x, y, w, h };
}

/** Drag by a delta. The window cannot leave the screen. */
export function dragWin(win: WinState, dx: number, dy: number, screen: Screen): WinState {
  return clampWin({ ...win, x: win.x + dx, y: win.y + dy }, screen);
}

export function topZ(list: WinState[]): number {
  return list.reduce((n, w) => Math.max(n, w.z), 0);
}

/** Focus raises a window to the top of the z-order and restores it from the taskbar. */
export function focusWin(list: WinState[], id: string): WinState[] {
  const z = topZ(list) + 1;
  return list.map((w) => (w.id === id ? { ...w, z, minimized: false } : w));
}

/** Open a window. If one with the same id is already open, it is focused instead of duplicated. */
export function openWin(list: WinState[], win: WinState, screen: Screen): WinState[] {
  if (list.some((w) => w.id === win.id)) return focusWin(list, win.id);
  const z = topZ(list) + 1;
  return [...list, clampWin({ ...win, z, minimized: false }, screen)];
}

export function closeWin(list: WinState[], id: string): WinState[] {
  return list.filter((w) => w.id !== id);
}

export function minimizeWin(list: WinState[], id: string): WinState[] {
  return list.map((w) => (w.id === id ? { ...w, minimized: true } : w));
}

/** The window that has focus: the highest z among the windows that are not minimized. */
export function focusedWin(list: WinState[]): WinState | null {
  let best: WinState | null = null;
  for (const w of list) {
    if (w.minimized) continue;
    if (!best || w.z > best.z) best = w;
  }
  return best;
}

/** Where a new window opens: a small cascade, always on screen. */
export function cascadeAt(list: WinState[], screen: Screen, w: number, h: number): { x: number; y: number } {
  const n = list.length % 6;
  const x = Math.min(Math.max(0, screen.w - w), 40 + n * 24);
  const y = Math.min(Math.max(0, screen.h - TASKBAR_H - TITLE_H - h), 36 + n * 24);
  return { x, y };
}

/** Keys the games use. Only the focused app may receive them. */
export const GAME_CODES: ReadonlySet<string> = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyE",
  "KeyP",
  "KeyR",
  "KeyH",
  "KeyK",
  "Space",
  "Enter",
  "Escape",
]);

/** What has focus, for key routing. */
export type FocusKind = "none" | "static" | "sim-app" | "mini" | "world";

/**
 * Where a key goes.
 * - "game": the focused app (a mini game, Academy, or Reactor Control) gets it.
 * - "desktop": the desktop shell gets it. Escape closes a window, or leaves the desktop when none is open.
 * - "block": a game key that no game may see. The world is paused while the desktop is open,
 *   and a game in an unfocused window must not hear the key either.
 * Escape closes a window only when no mini game is focused (spec 4.3).
 */
export function keyRoute(focus: FocusKind, code: string): "game" | "desktop" | "block" {
  if (code === "Escape") return focus === "mini" ? "game" : "desktop";
  if (!GAME_CODES.has(code)) return "desktop";
  if (focus === "mini" || focus === "sim-app" || focus === "world") return "game";
  return "block";
}

/** Map a focused window onto a focus kind. */
export function focusKindOf(win: WinState | null): FocusKind {
  if (!win) return "none";
  if (win.game) return "mini";
  if (win.sim) return "sim-app";
  return "static";
}
