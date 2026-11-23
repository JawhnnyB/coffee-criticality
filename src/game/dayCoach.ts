/**
 * Day 1 teaches one control at a time. The line goes away when the player does it.
 * Later days say nothing. Story text stays where it is.
 */

export interface CoachInput {
  day: number;
  mode: string;
  moved: boolean;
  mabel: boolean;
  entered: boolean;
  holt: boolean;
  resolved: boolean;
}

export function coachLine(s: CoachInput): string | null {
  if (s.day !== 1) return null;
  if (s.mode === "incident") return "R reports. H hides. P looks with you.";
  if (s.mode !== "play") return null;
  if (!s.moved) return "Walk. WASD or the arrows.";
  if (!s.mabel) return "E sits with Mabel.";
  if (!s.entered) return "Walk east to the gate.";
  if (!s.holt) return "E talks to Holt.";
  if (!s.resolved) return "P looks closer at what is wrong.";
  return null;
}
