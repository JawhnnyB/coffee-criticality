/**
 * Numbers for the hall loop. audio.ts turns them into oscillators.
 * No samples.
 *
 * PWR and BWR: a pump hum and a steam hiss. Pitch and level follow power.
 * Pebble: a blower whine. Salt: an air-cooler drone plus a heater tick.
 * After a scram only a low decay-heat fan remains.
 * Gain falls with distance from the reactor hall (0 beside it, 1 far away).
 */
import type { SiteKind } from "./plantLoops";

export interface HallTone {
  humHz: number;
  hissHz: number;
  tickHz: number;
  gain: number;
  label: string;
}

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

/** 0 beside the reactor, 1 in rooms that should not hear the hall. */
export function hallDistance(room: string): number {
  if (room === "reactor") return 0;
  if (room === "control") return 0.25;
  if (room === "corridor" || room === "maintenance" || room === "engineering") return 0.55;
  if (room === "gate") return 0.8;
  return 1;
}

export function hallTone(kind: SiteKind, power: number, scram: boolean, distance: number, soundOn: boolean): HallTone {
  if (!soundOn) return { humHz: 0, hissHz: 0, tickHz: 0, gain: 0, label: "muted" };
  const far = clamp(distance, 0, 1);
  const p = clamp(power, 0, 1);
  const near = 1 - far;
  if (scram || p < 0.08) {
    return { humHz: 42, hissHz: 0, tickHz: 0, gain: 0.04 * near, label: "decay fan" };
  }
  if (kind === "pebble") {
    return { humHz: 280 + 220 * p, hissHz: 0, tickHz: 0, gain: (0.05 + 0.12 * p) * near, label: "blower" };
  }
  if (kind === "msr") {
    return { humHz: 70 + 30 * p, hissHz: 0, tickHz: 8 + 6 * p, gain: (0.04 + 0.08 * p) * near, label: "cooler" };
  }
  return {
    humHz: 55 + 40 * p,
    hissHz: 900 + 500 * p,
    tickHz: 0,
    gain: (0.05 + 0.1 * p) * near,
    label: "pump",
  };
}
