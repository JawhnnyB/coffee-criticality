/**
 * Night 1 teaches one thing at a time, on top of Jordan's radio nudge.
 * Later nights say nothing.
 */

export interface NightCoachEvent {
  id: string;
  camera: string;
  start: number;
  /** Still open: not caught, not finished. */
  open: boolean;
  /** A reading from this event is outside its band. */
  flashing: boolean;
}

export interface NightCoachInput {
  night: number;
  minute: number;
  tablet: boolean;
  camera: string;
  falseReports: number;
  /** An oddity is on the camera being watched, and no real event is. */
  oddityHere: boolean;
  liveHere: boolean;
  events: NightCoachEvent[];
}

export function nightCoachLine(s: NightCoachInput): string | null {
  if (s.night !== 1) return null;
  if (!s.tablet && s.minute < 25) return "Space opens the tablet.";
  // The gull lesson comes before Jordan, so it can be seen.
  if (s.tablet && s.oddityHere && !s.liveHere && s.falseReports === 0) return "That is an oddity. Leave it.";
  const silent = s.events.find((e) => e.open && (e.id === "lhra-door" || e.id === "pool-fme"));
  if (silent && s.minute >= silent.start + 6 && s.minute < silent.start + 50) return "Jordan named a camera. Check it.";
  const flash = s.events.find((e) => e.open && e.flashing);
  if (!flash) return null;
  if (s.tablet && flash.camera === s.camera) return "Report the kind that fits.";
  return "A flash is an alarm. Open that camera.";
}
