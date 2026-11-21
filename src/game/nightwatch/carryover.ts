/**
 * The day week follows onto nights. Reads existing state only. No new rules:
 * extra or moved events the night already knows how to draw.
 */
import type { Residue } from "../content";
import { siteWatch, type EventDef, type Night } from "./model";

export interface CarryInput {
  residue: Residue;
  maintDone: boolean;
  shuffleDone: boolean;
  ended: string | null;
  weekLog?: { text: string }[];
}

export interface NightSeed {
  extras: { def: EventDef; start: number }[];
  /** Force an existing event id to this start minute. */
  pin: { id: string; start: number }[];
  /** Shift a matching event earlier, in minutes. */
  earlier: { match: (e: EventDef) => boolean; minutes: number }[];
  radios: { at: number; text: string }[];
  voice: Night["voice"];
  curt: boolean;
}

const valve = (scale: number): EventDef => ({
  id: "valve-14",
  title: "Valve 14 packing weeping",
  camera: "aux",
  accept: ["leak"],
  effect: { gAux: 3 },
  develop: 18,
  escalate: Math.round(50 / 1.3 * scale),
  consequence: "finding",
  visual: "puddle",
  log: "Valve 14 packing weeping on the aux header. Packing nuts tightened on the night shift.",
});

const missingTag: EventDef = {
  id: "tag-missing",
  title: "Clearance tag missing on feed pump B",
  camera: "turbine",
  accept: ["access"],
  effect: {},
  develop: 1,
  escalate: 50,
  consequence: "finding",
  visual: "missingTag",
  log: "Clearance tag missing on feed pump B. Tag hung, pump left tagged out.",
};

function isRadiation(e: EventDef): boolean {
  return e.accept.includes("radiation") || Object.keys(e.effect).some((id) => id.startsWith("g"));
}

/** What this night inherits. Deterministic for the same save. */
export function carryover(s: CarryInput, night: number): NightSeed {
  const seed: NightSeed = { extras: [], pin: [], earlier: [], radios: [], voice: "plain", curt: false };
  if (s.ended === "a") seed.voice = "warm";
  else if (s.ended === "c") seed.voice = "terse";
  if (s.residue.log === "hid") seed.curt = true;
  if (night === 1 && s.residue.log === "caught") {
    const line = s.weekLog?.slice().reverse().find((e) => e.text)?.text ?? "the day log";
    const short = line.length > 80 ? `${line.slice(0, 77)}...` : line;
    seed.radios.push({ at: 12, text: `00:12 Elena: From your day log. ${short}` });
  }
  if (night === 1 && s.residue.valve === "hid") seed.extras.push({ def: valve(1), start: 100 });
  if (night === 1 && s.residue.valve === "caught") seed.radios.push({ at: 20, text: "00:20 Jordan: Valve 14 repack is holding." });
  if (night === 2 && s.residue.tag === "hid") seed.extras.push({ def: missingTag, start: 95 });
  if (night === 2 && !s.maintDone) seed.pin.push({ id: "feed-pump", start: 150 });
  if (night === 3 && s.residue.dose === "hid") {
    seed.earlier.push({ match: isRadiation, minutes: 45 });
    seed.radios.push({ at: 30, text: "00:30 Jordan: Dosimeter's been chirping near the aux stairs." });
  }
  if (night === 4 && s.shuffleDone) seed.radios.push({ at: 5, text: "00:05 Plant Monitor: First nights on the new core." });
  return seed;
}

/** Apply a seed to a night that was just dealt. Same save, same night. */
export function applyCarry(n: Night, seed: NightSeed): void {
  n.voice = seed.voice;
  n.curt = seed.curt;
  n.carriedRadio.push(...seed.radios);
  for (const pin of seed.pin) {
    let hit = n.events.find((e) => e.def.id === pin.id);
    if (!hit) {
      const def = n.watch.events.find((e) => e.id === pin.id) ?? siteWatch(n.site).events.find((e) => e.id === pin.id);
      if (def) {
        hit = { def: { ...def }, start: pin.start, caughtAt: null, early: false, doneAt: null, fromDays: true };
        n.events.push(hit);
      }
    }
    if (hit) {
      hit.start = pin.start;
      hit.fromDays = true;
    }
  }
  for (const shift of seed.earlier) {
    const hit = n.events.find((e) => shift.match(e.def));
    if (hit) {
      hit.start = Math.max(15, hit.start - shift.minutes);
      hit.fromDays = true;
    }
  }
  for (const extra of seed.extras) {
    n.events.push({ def: extra.def, start: extra.start, caughtAt: null, early: false, doneAt: null, fromDays: true });
  }
  n.events.sort((a, b) => a.start - b.start);
}
