/**
 * Stage 2c · Site Access. Pure helpers for the security lobby: geometry, the Day-1 gate, lamp
 * states and Dee's lines. No state lives here; sim.ts owns the flags and render.ts draws from these.
 *
 * Why it exists (design note, not decoration): a nuclear site does not let you walk from the lot to
 * your desk. The player does it once, slowly, so the badge screen has a payoff, movement/interaction/HUD
 * get taught in about a minute, and the dosimeter (TLD #07) is planted for Day 3 (dose and ego).
 * Days 2-5 are frictionless: the gate is a ritual, not a tax.
 */
import { ROLES, type Line, type Rect, type RoleId } from "./content";
import { TILE } from "./const";

const t = (c: number, r: number, w: number, h: number): Rect => ({ x: c * TILE, y: r * TILE, w: w * TILE, h: h * TILE });

export const SEC = {
  /** The open lane through the barriers. */
  lane: t(14, 7, 2, 2),
  /** Walking into this zone fires the portal logic. No E needed. */
  zone: t(13, 7, 3, 2),
  /** The glass flap. Solid while the portal is locked on Day 1. */
  flap: t(15, 7, 1, 2),
  /** Iris post sprites are 16x32 at their prop rects. */
  posts: [t(14.5, 5, 1, 2), t(14.5, 9, 1, 2)],
  /** Dee stands behind her desk. x is the sprite centre, y the feet. */
  dee: { x: 80, y: 78 },
  /** Blue guide line, room space. Day 1 only; gone once the portal opens. */
  guide: [
    [8, 128],
    [40, 128],
    [40, 108],
    [192, 108],
    [192, 128],
    [344, 128],
  ] as const,
};

/** Engineering: the nameplate on YOUR DESK blinks until the player interacts with it (Day 1). */
export const MY_DESK = {
  rect: t(10, 10, 4, 3),
  nameplate: { x: 10 * TILE + 32 - 21, y: 10 * TILE + 48 - 20, w: 42, h: 9 },
};

export type SecView = { day: number; flags: Record<string, boolean>; x: number; y: number };

/** Full ceremony only on Day 1. Saves from before Stage 2c that are already past the portal are not sent back. */
export function secRequired(s: Pick<SecView, "day" | "flags">): boolean {
  return s.day === 1 && !s.flags["sec:portal"] && !s.flags.plantEntered;
}

/** Old saves: on the floor on Day 1 without ever passing the portal. Do not nag them about a desk. */
export function secLegacy(s: Pick<SecView, "day" | "flags">): boolean {
  return s.day === 1 && !!s.flags.plantEntered && !s.flags["sec:portal"];
}

export type Lamp = "red" | "amber" | "green";

function nearLane(s: Pick<SecView, "x" | "y">): boolean {
  const l = SEC.lane;
  const dx = Math.max(l.x - s.x, 0, s.x - (l.x + l.w));
  const dy = Math.max(l.y - s.y, 0, s.y - (l.y + l.h));
  return Math.hypot(dx, dy) < 2 * TILE;
}

/** red = locked, amber = reading, green = open. */
export function portalLamp(s: SecView, irisActive: boolean): Lamp {
  if (secRequired(s)) {
    if (irisActive) return "amber";
    return s.flags["sec:badge"] && s.flags["sec:tld"] ? "amber" : "red";
  }
  if (s.flags["sec:portal"]) return "green";
  return nearLane(s) ? "green" : "red";
}

export function flapOpen(s: SecView): boolean {
  return !secRequired(s) && (!!s.flags["sec:portal"] || nearLane(s));
}

/** Dee's repeat lines, by how far the player has got. */
export function deeRepeat(flags: Record<string, boolean>): string {
  if (flags["sec:portal"]) return "Welcome to Unit 1. Badge on, dosimeter on, eyes open.";
  if (!flags["sec:badge"]) return "Kiosk first. Look at the lens. Do not smile.";
  if (!flags["sec:tld"]) return "Dosimeter rack. Number seven is yours. Chest height, not a pocket.";
  return "Portal's through there. Look at the light and hold still.";
}

export function roleTitle(role: RoleId | null): string {
  return ROLES.find((r) => r.id === role)?.title ?? "Transferred Engineer";
}

/** First visit: three exchanges, the player's in the middle. Later visits: one line. */
export function deeLines(flags: Record<string, boolean>, role: RoleId | null): Line[] {
  if (flags["sec:checkin"]) return [{ speaker: "Dee", text: deeRepeat(flags), mood: "even" }];
  return [
    { speaker: "Dee", text: "Name's Dee. Nobody walks past me without a badge. Not you, not the plant manager.", mood: "even" },
    { speaker: "You", text: `${roleTitle(role)}. Day one.`, mood: "soft" },
    {
      speaker: "Dee",
      text: "Then you're on my list. Badge kiosk, dosimeter rack, portal. Follow the blue line. Don't tailgate, don't prop doors, don't clip your dosimeter in a pocket.",
      mood: "wry",
    },
  ];
}

/** Days 2-5: one flavour line per day as the player crosses the portal. */
export const DEE_DAY: Record<number, string> = {
  2: "Morning.",
  3: "Dosimeter on? Good.",
  4: "Badge photo's better than you today.",
  5: "Friday. Walk safe.",
};

export const IRIS_SECONDS = 1.2;

export function irisState(irisT: number): "align" | "scan" | "match" {
  if (irisT >= IRIS_SECONDS) return "match";
  return irisT > 0 ? "scan" : "align";
}
