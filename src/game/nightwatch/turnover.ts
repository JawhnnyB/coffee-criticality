/**
 * Elena's 06:00 turnover. Five lines in her voice, and five cooler ones when the day log was hidden: she is still
 * fair about the night, but she has not let the day log go. Voice: docs/characters.md.
 */
import { clock, grade, looksAfter, type EventDef, type GradeLetter, type Night } from "./model";

export const ELENA: Record<GradeLetter, string> = {
  A: "You caught them before the board did. Thank you. That's exactly why I asked for you.",
  B: "A good night, and a clean log. Keep walking the quiet cameras. They're the ones that fool you.",
  C: "You made six. The ones you missed were already on a camera. Let's look at them together.",
  D: "I'm taking the chair. You're not in trouble. You're tired, and this one needs standing again.",
  F: "The plant doesn't get a second board, and neither do we. Go home, sleep, and we'll stand it again.",
};

export const ELENA_CURT: Record<GradeLetter, string> = {
  A: "Good catches. Logged. We still need to talk about the day log.",
  B: "Acceptable. I won't pretend I'm not still bothered about the day log.",
  C: "You reached six. The misses stand. So does the day log.",
  D: "Not good enough tonight. Stand it again. Then we'll talk.",
  F: "I've relieved you. The night isn't done, and neither are we.",
};

export const TRUST_DELTA: Record<GradeLetter, number> = { A: 3, B: 2, C: 1, D: 0, F: -2 };

const RANK: Record<GradeLetter, number> = { F: 0, D: 1, C: 2, B: 3, A: 4 };

export const ELENA_RELIEVED = "I've got the chair. This night won't count against you. Get some sleep.";
export const ELENA_RELIEVED_CURT = "I've got the chair. The night isn't done.";

export function openerLine(night: number, again: boolean): string {
  return again ? `Night ${night}, again. Elena wants it stood properly.` : "18:00 turnover. Quiet board. At midnight the watch desk is yours.";
}

/** An A where every catch came after the alarm: true, but not the line about beating the board. */
export const ELENA_A_LATE = "Everything caught, but every one after the alarm. Next time, find one before the board does. You will.";

export function elenaLine(letter: GradeLetter, curt: boolean, why?: string, early?: number): string {
  if (why === "relieved") return curt ? ELENA_RELIEVED_CURT : ELENA_RELIEVED;
  if (letter === "C" && why != null && why !== "dawn") return curt ? "You didn't make it to six." : "Six is the end of the night. This one ended early. We'll stand it again together.";
  if (letter === "A" && !curt && early === 0) return ELENA_A_LATE;
  return (curt ? ELENA_CURT : ELENA)[letter];
}

/** Store the best grade. A night is done only at C or better. Replays change nothing. */
export function recordNight(flags: Record<string, boolean>, n: Night, nightNo: number, replay: boolean) {
  const g = grade(n);
  if (replay) return { ...g, trust: 0, done: false };
  let best = -1;
  for (const letter of Object.keys(RANK) as GradeLetter[]) {
    if (flags[`night:${nightNo}:grade:${letter}`]) best = Math.max(best, RANK[letter]);
  }
  if (RANK[g.letter] > best) flags[`night:${nightNo}:grade:${g.letter}`] = true;
  const done = g.letter === "A" || g.letter === "B" || g.letter === "C";
  if (done) flags[`night:${nightNo}:done`] = true;
  return { ...g, trust: TRUST_DELTA[g.letter], done };
}

export interface TurnRow {
  time: string;
  camera: string;
  title: string;
  how: string;
  missed: boolean;
  fromDays: boolean;
  stillMinute: number;
  looks: number;
  camIndex: number;
  /** Set when this picture can be two reports. Names the tile that splits them. */
  tile: string | null;
}

export function boardTile(n: Night, def: EventDef): string | null {
  const pool = new Map<string, EventDef>();
  for (const e of n.watch.events) pool.set(e.id, e);
  for (const e of n.events) pool.set(e.def.id, e.def);
  const mine = new Set(Object.keys(def.effect));
  const diff = new Set<string>();
  let shared = false;
  for (const other of pool.values()) {
    if (other.id === def.id || other.camera !== def.camera || other.visual !== def.visual) continue;
    shared = true;
    const theirs = new Set(Object.keys(other.effect));
    for (const k of mine) if (!theirs.has(k)) diff.add(k);
    for (const k of theirs) if (!mine.has(k)) diff.add(k);
  }
  if (!shared || diff.size === 0) return null;
  const labels = [...diff].map((id) => n.watch.metrics.find((m) => m.id === id)?.label ?? id);
  return `What tells it apart on the board: ${labels.join(", ")}.`;
}

export function turnoverRows(n: Night): TurnRow[] {
  const cams = n.watch.cameras;
  return [...n.events]
    .sort((a, b) => a.start - b.start)
    .map((e) => {
      const how = e.caughtAt === null ? (e.def.consequence === "finding" && e.doneAt !== null ? "finding" : e.doneAt !== null ? "missed" : "open") : e.early ? "caught early" : "caught late";
      const idx = Math.max(0, cams.findIndex((c) => c.id === e.def.camera));
      return {
        time: clock(e.start),
        camera: cams[idx]?.name ?? e.def.camera,
        title: e.finale ? `Finale. ${e.def.title}` : e.def.title,
        how,
        missed: e.caughtAt === null && e.doneAt !== null,
        fromDays: !!e.fromDays,
        stillMinute: e.start,
        looks: looksAfter(n, e.def.camera, e.start),
        camIndex: idx,
        tile: boardTile(n, e.def),
      };
    });
}

export function oddityNotes(n: Night): string[] {
  const name: Record<string, string> = {
    chair: "the chair",
    hardhat: "the hard hat",
    gull: "the gull",
    fog: "the fog",
    flicker: "the flicker",
    moth: "the moth",
    glove: "the glove",
    bulb: "the bulb",
    cup: "the cup",
    hangtag: "the tag",
    boot: "the print",
    clipboard: "the clipboard",
    cable: "the cable",
  };
  return n.oddities
    .filter((o) => n.minute >= o.start)
    .map((o) => `You left ${name[o.def.visual] ?? "it"}. Good.`);
}
