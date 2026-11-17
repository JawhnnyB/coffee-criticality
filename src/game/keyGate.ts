/**
 * Who may act on a key. The desktop writes the owner every render.
 * Each window listener asks before it moves anything, so a key that
 * gets past the capture-phase router still does not move an unfocused game.
 * Pure aside from the one owner variable. Node tests import this file.
 */
import { keyRoute, type FocusKind } from "./deskWindows";

/** world: the walking game, or a full-screen cabinet while the desk is closed.
 *  mini: a cabinet window. sim-app: Reactor Control or Academy.
 *  menu: title, role card, and the boot log. */
export type KeyHost = "world" | "mini" | "sim-app" | "menu";

let owner: FocusKind = "world";

export function setKeyOwner(next: FocusKind): void {
  owner = next;
}

export function getKeyOwner(): FocusKind {
  return owner;
}

/**
 * True when this listener is the one the router assigned the key to.
 * A static desktop app (Settings, Music, News) owns no game key.
 * A full-screen cabinet still hears keys: the desk is closed, so the owner stays "world".
 */
export function hostOwnsKey(host: KeyHost, code: string): boolean {
  const focus = owner;
  const route = keyRoute(focus, code);
  if (route === "block") return false;

  if (host === "menu") return focus === "world";

  if (host === "world") {
    if (focus !== "world") return false;
    return route === "game" || code === "Escape";
  }

  if (host === "mini") {
    if (focus === "static" || focus === "none" || focus === "sim-app") return false;
    if (code === "Escape" && route === "desktop") return false;
    return focus === "mini" || focus === "world";
  }

  if (host === "sim-app") {
    if (focus !== "sim-app" && focus !== "world") return false;
    if (code === "Escape" && route === "desktop") return false;
    return true;
  }

  return false;
}

/** A held key moves only while this host still owns that key. */
export function readHeld(host: KeyHost, keys: { has(code: string): boolean }, code: string): boolean {
  return hostOwnsKey(host, code) && keys.has(code);
}

/**
 * Cabinets that run with the desk closed. The cabinet hears the keys.
 * The walking listener does not, except Escape, which leaves the cabinet.
 */
export const CABINET_MODES: ReadonlySet<string> = new Set([
  "arcade",
  "cabs",
  "fish",
  "plot",
  "floor",
  "horde",
  "delay",
  "golf",
  "rods",
  "pebble",
  "bowl",
  "phys",
  "load",
  "maint",
  "shuffle",
]);

/** Movement stays off while a cabinet is the screen. Escape still leaves it. */
export function takeWorldKey(mode: string, code: string): boolean {
  if (CABINET_MODES.has(mode) && code !== "Escape") return false;
  return hostOwnsKey("world", code);
}

type KeyEvent = {
  code: string;
  target?: (EventTarget & { tagName?: string }) | { tagName?: string } | null;
  preventDefault?: () => void;
};

/**
 * The world key listener. GameApp calls this and nothing else.
 * Returns whether the key was stored.
 */
export function applyWorldKey(
  e: KeyEvent,
  mode: string,
  keys: { has(code: string): boolean; add(code: string): void },
  edges: { add(code: string): void },
  gameCodes: { has(code: string): boolean },
): boolean {
  const target = e.target as { tagName?: string } | null | undefined;
  const tag = target?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return false;
  if (!takeWorldKey(mode, e.code)) return false;
  if (gameCodes.has(e.code)) e.preventDefault?.();
  if (!keys.has(e.code)) edges.add(e.code);
  keys.add(e.code);
  return true;
}
