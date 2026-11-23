/**
 * Keyboard focus and the gamepad, for screens that are buttons and for
 * games that already read keys. The walking sim still reads the stick itself.
 */
import { binds } from "./binds";

export type PadSnap = { axes: number[]; buttons: boolean[] };

export type Dir = "up" | "down" | "left" | "right";

export type PadMem = {
  buttons: boolean[];
  dir: Record<Dir, boolean>;
  synth: string[];
};

const KEY_MODES = new Set([
  "fish", "horde", "delay", "golf", "rods", "pebble", "bowl", "phys", "load", "maint", "arcade",
]);

const ARROW_NAV = new Set([
  "setup", "eod", "dialogue", "pause", "how", "credits", "cabs", "plot", "shuffle",
  "still", "incident", "desktop", "outage", "reactor", "menu", "splash",
]);

const BACK_MODES = new Set(["pause", "still", "dialogue", "academy", "incident", "arcade", "reactor"]);

let echo = false;

export function emptyPad(): PadMem {
  return {
    buttons: Array.from({ length: 16 }, () => false),
    dir: { up: false, down: false, left: false, right: false },
    synth: [],
  };
}

export function isKeyMode(mode: string): boolean {
  return KEY_MODES.has(mode);
}

export function arrowNav(mode: string, nights: boolean): boolean {
  if (nights) return true;
  return ARROW_NAV.has(mode);
}

export function isPadEcho(): boolean {
  return echo;
}

export function dirOf(code: string): Dir | null {
  if (code === "ArrowUp" || code === "KeyW") return "up";
  if (code === "ArrowDown" || code === "KeyS") return "down";
  if (code === "ArrowLeft" || code === "KeyA") return "left";
  if (code === "ArrowRight" || code === "KeyD") return "right";
  return null;
}

export function readPad(): PadSnap | null {
  const injected = (typeof window !== "undefined" ? window.__padInject : null) ?? null;
  if (injected) return injected;
  if (typeof navigator === "undefined" || !navigator.getGamepads) return null;
  const pads = navigator.getGamepads();
  for (const pad of pads) {
    if (!pad) continue;
    return {
      axes: [pad.axes[0] ?? 0, pad.axes[1] ?? 0],
      buttons: Array.from({ length: 16 }, (_, i) => !!pad.buttons[i]?.pressed),
    };
  }
  return null;
}

type Step = {
  mem: PadMem;
  edge: Record<Dir | "confirm" | "back" | "start" | "report" | "hide" | "peer", boolean>;
  heldDir: Record<Dir, boolean>;
  confirmHeld: boolean;
};

export function stepPad(mem: PadMem, pad: PadSnap | null): Step {
  const b = (i: number) => !!pad?.buttons[i];
  const ax = pad?.axes[0] ?? 0;
  const ay = pad?.axes[1] ?? 0;
  const heldDir: Record<Dir, boolean> = {
    up: b(12) || ay < -0.5,
    down: b(13) || ay > 0.5,
    left: b(14) || ax < -0.5,
    right: b(15) || ax > 0.5,
  };
  const edgeDir = {
    up: heldDir.up && !mem.dir.up,
    down: heldDir.down && !mem.dir.down,
    left: heldDir.left && !mem.dir.left,
    right: heldDir.right && !mem.dir.right,
  };
  return {
    mem: { ...mem, buttons: Array.from({ length: 16 }, (_, i) => b(i)), dir: heldDir },
    edge: {
      ...edgeDir,
      confirm: b(0) && !mem.buttons[0],
      back: b(1) && !mem.buttons[1],
      start: b(9) && !mem.buttons[9],
      peer: b(4) && !mem.buttons[4],
      report: b(2) && !mem.buttons[2],
      hide: b(3) && !mem.buttons[3],
    },
    heldDir,
    confirmHeld: b(0),
  };
}

function emit(type: "keydown" | "keyup", code: string) {
  if (typeof window === "undefined") return;
  const key =
    code === "Space" ? " " : code === "Escape" ? "Escape" : code.startsWith("Key") ? code.slice(3).toLowerCase() : code.replace("Arrow", "");
  echo = true;
  window.dispatchEvent(new KeyboardEvent(type, { code, key, bubbles: true, cancelable: true }));
  echo = false;
}

function sync(list: string[], code: string, down: boolean): string[] {
  const has = list.includes(code);
  if (down && !has) {
    emit("keydown", code);
    return [...list, code];
  }
  if (!down && has) {
    emit("keyup", code);
    return list.filter((c) => c !== code);
  }
  return list;
}

function release(list: string[]): string[] {
  for (const code of list) emit("keyup", code);
  return [];
}

export function moveFocus(dir: Dir) {
  if (typeof document === "undefined") return;
  const list = focusables();
  if (!list.length) return;
  const cur = document.activeElement as HTMLElement | null;
  const i = cur ? list.indexOf(cur) : -1;
  if (i < 0) {
    list[0].focus();
    return;
  }
  const a = list[i].getBoundingClientRect();
  const ax = a.left + a.width / 2;
  const ay = a.top + a.height / 2;
  let best: HTMLElement | null = null;
  let bestScore = Infinity;
  for (const el of list) {
    if (el === cur) continue;
    const b = el.getBoundingClientRect();
    const dx = b.left + b.width / 2 - ax;
    const dy = b.top + b.height / 2 - ay;
    if (dir === "down" && dy < 8) continue;
    if (dir === "up" && dy > -8) continue;
    if (dir === "right" && dx < 8) continue;
    if (dir === "left" && dx > -8) continue;
    const primary = dir === "up" || dir === "down" ? Math.abs(dy) : Math.abs(dx);
    const secondary = dir === "up" || dir === "down" ? Math.abs(dx) : Math.abs(dy);
    const score = primary + secondary * 2;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  const fallback = list[(i + (dir === "up" || dir === "left" ? list.length - 1 : 1)) % list.length];
  (best ?? fallback).focus();
}

export function clickFocus() {
  if (typeof document === "undefined") return;
  const el = document.activeElement as HTMLElement | null;
  if (el && typeof el.click === "function" && el !== document.body && el !== document.documentElement) {
    el.click();
    return;
  }
  focusables()[0]?.focus();
}

function focusables(): HTMLElement[] {
  const all = Array.from(document.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea, [role='button']"));
  return all.filter((el) => {
    if ((el as HTMLButtonElement).disabled) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    let n: HTMLElement | null = el;
    while (n) {
      if (n.hidden) return false;
      n = n.parentElement;
    }
    return true;
  });
}

/** One frame of the pad. Adds world edges, or drives focus, or holds keys for a cabinet. */
export function applyPad(
  mem: PadMem,
  pad: PadSnap | null,
  ctx: { mode: string; nights: boolean; edges: { add(code: string): void } },
): PadMem {
  const step = stepPad(mem, pad);
  let synth = mem.synth;
  const ui = arrowNav(ctx.mode, ctx.nights);
  const keys = isKeyMode(ctx.mode) && !ctx.nights;
  if (!keys) synth = release(synth);

  if (ctx.nights) {
    for (const dir of ["up", "down", "left", "right"] as Dir[]) if (step.edge[dir]) moveFocus(dir);
    if (step.edge.confirm) clickFocus();
    if (step.edge.report) emit("keydown", "KeyR");
    if (step.edge.hide) emit("keydown", "KeyB");
    if (step.edge.back || step.edge.start) emit("keydown", "Escape");
  } else if (keys) {
    synth = sync(synth, "ArrowLeft", step.heldDir.left);
    synth = sync(synth, "ArrowRight", step.heldDir.right);
    synth = sync(synth, "ArrowUp", step.heldDir.up);
    synth = sync(synth, "ArrowDown", step.heldDir.down);
    synth = sync(synth, "Space", step.confirmHeld);
    if (step.edge.back || step.edge.start) emit("keydown", "Escape");
  } else if (ui) {
    for (const dir of ["up", "down", "left", "right"] as Dir[]) if (step.edge[dir]) moveFocus(dir);
    if (step.edge.confirm) clickFocus();
    if (step.edge.back || step.edge.start) {
      if (BACK_MODES.has(ctx.mode)) ctx.edges.add("Escape");
      else emit("keydown", "Escape");
    }
  } else if (ctx.mode === "play") {
    const b = binds();
    if (step.edge.confirm) ctx.edges.add(b.interact);
    if (step.edge.peer) ctx.edges.add(b.peer);
    if (step.edge.report) ctx.edges.add(b.report);
    if (step.edge.hide) ctx.edges.add(b.hide);
    if (step.edge.back || step.edge.start) ctx.edges.add("Escape");
  }

  return { ...step.mem, synth };
}

declare global {
  interface Window {
    __padInject?: PadSnap | null;
  }
}
