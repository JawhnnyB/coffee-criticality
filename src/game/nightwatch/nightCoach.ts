/**
 * Night 1 teaches one thing at a time, on top of Jordan's radio nudge.
 * Night 2, on a camera whose picture can be two reports, points at the board.
 * Later nights say nothing.
 */

export interface PictureRef {
  id: string;
  camera: string;
  visual: string;
  /** Effect keys, the board tiles this event moves. */
  tiles: string[];
}

export interface NightCoachEvent {
  id: string;
  camera: string;
  start: number;
  /** Still open: not caught, not finished. */
  open: boolean;
  /** A reading from this event is outside its band. */
  flashing: boolean;
  visual?: string;
  tiles?: string[];
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
  /** Every event this site can draw, so a shared picture can be named. */
  catalog?: PictureRef[];
}

function tileKey(tiles: string[] | undefined): string {
  return [...(tiles ?? [])].sort().join(",");
}

function sharedPicture(e: NightCoachEvent, catalog: PictureRef[]): boolean {
  if (!e.visual) return false;
  const mine = tileKey(e.tiles);
  return catalog.some((o) => o.id !== e.id && o.camera === e.camera && o.visual === e.visual && tileKey(o.tiles) !== mine);
}

export function nightCoachLine(s: NightCoachInput): string | null {
  if (s.night === 2) {
    if (!s.tablet) return null;
    const here = s.events.find((e) => e.open && e.camera === s.camera && s.minute >= e.start && sharedPicture(e, s.catalog ?? []));
    return here ? "The board tells you what kind." : null;
  }
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
