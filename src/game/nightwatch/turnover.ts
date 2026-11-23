/**
 * Elena's 06:00 turnover. Five lines in her voice, and five curt ones when the day log was hidden.
 */
import { clock, grade, looksAfter, type GradeLetter, type Night } from "./model";

export const ELENA: Record<GradeLetter, string> = {
  A: "You caught them before the board did. That is the job.",
  B: "The log is clean enough. Keep walking the quiet cameras.",
  C: "You made six. The ones you missed were already on a camera.",
  D: "I am taking the chair. Stand this night again.",
  F: "The plant does not get a second board. Stand the night again.",
};

export const ELENA_CURT: Record<GradeLetter, string> = {
  A: "Logged. The board agrees.",
  B: "Acceptable. Do not get comfortable.",
  C: "You reached six. The misses stand.",
  D: "Not good enough. Again.",
  F: "Relieved. The night is not done.",
};

export const TRUST_DELTA: Record<GradeLetter, number> = { A: 3, B: 2, C: 1, D: 0, F: -2 };

const RANK: Record<GradeLetter, number> = { F: 0, D: 1, C: 2, B: 3, A: 4 };

export const ELENA_RELIEVED = "I have the chair. This night does not count.";
export const ELENA_RELIEVED_CURT = "Relieved. The night is not done.";

export function openerLine(night: number, again: boolean): string {
  return again ? `Night ${night}, again. Elena wants it stood properly.` : "18:00 turnover. Quiet board. At midnight the watch desk is yours.";
}

export function elenaLine(letter: GradeLetter, curt: boolean, why?: string): string {
  if (why === "relieved") return curt ? ELENA_RELIEVED_CURT : ELENA_RELIEVED;
  if (letter === "C" && why != null && why !== "dawn") return curt ? "You did not reach six." : "Six is the end of the night. This one ended early.";
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
