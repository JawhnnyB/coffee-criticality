/**
 * The night's own gaze log, played back at 10×. Duration is the look, divided by the speed.
 * An empty log stays empty. This does not invent looks.
 */
import { SECONDS_PER_MINUTE } from "./model";

export interface GazeLook {
  camera: string;
  from: number;
  to: number;
}

export function gazeReplay(gaze: readonly GazeLook[], speed = 10): { camera: string; from: number; holdMs: number }[] {
  const rate = speed > 0 ? speed : 10;
  return gaze.map((g) => ({
    camera: g.camera,
    from: g.from,
    holdMs: (Math.max(0, g.to - g.from) * SECONDS_PER_MINUTE * 1000) / rate,
  }));
}
