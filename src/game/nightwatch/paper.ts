/**
 * End-of-rotation paper. Headlines are the week's flags, not a city and not a licence.
 * Stored beside the week save so a new week can wipe cc.save.v2 and leave the sheet.
 */
import type { ResidueHow } from "../content";

const KEY = "cc.paper";

export interface PaperInput {
  grades: readonly string[];
  hides: number;
  ended: "a" | "c" | null;
  shuffleDone: boolean;
  discharged: boolean;
  dischargeMatch: boolean;
  valve: ResidueHow;
  tag: ResidueHow;
  dose: ResidueHow;
  log: ResidueHow;
}

export function paperLines(p: PaperInput): string[] {
  const lines: string[] = [];
  const grades = p.grades.filter(Boolean);
  if (grades.length) lines.push(`Nights ${grades.join(" ")}.`);
  if (grades.length === 4 && grades.every((g) => g === "A")) lines.push("Four quiet nights.");
  if (grades.some((g) => g === "D" || g === "F")) lines.push("A night was stood again.");
  if (p.hides >= 3) lines.push("Three things were not said.");
  else if (p.hides === 1) lines.push("One report stayed in a pocket.");
  else if (p.hides > 1) lines.push(`${p.hides} reports stayed in a pocket.`);
  if (p.log === "hid") lines.push("The day log had no initials.");
  if (p.valve === "hid") lines.push("A valve was left unsaid.");
  if (p.tag === "hid") lines.push("A tag was left unsaid.");
  if (p.dose === "hid") lines.push("A reading was left unsaid.");
  if (p.shuffleDone && p.dischargeMatch) lines.push("The map was signed. The discharge matched.");
  else if (p.shuffleDone && p.discharged) lines.push("The map was signed. The discharge did not match.");
  else if (p.shuffleDone) lines.push("The map was signed.");
  if (p.ended === "a") lines.push("The week held.");
  if (p.ended === "c") lines.push("The week ended early.");
  if (!lines.length) lines.push("A thin paper. Not much was written down.");
  return lines.slice(0, 6);
}

export function writePaper(lines: readonly string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ lines }));
  } catch {
    /* private mode */
  }
}

export function readPaper(): string[] {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || "{}") as { lines?: unknown };
    if (!Array.isArray(o.lines)) return [];
    return o.lines.filter((l) => typeof l === "string");
  } catch {
    return [];
  }
}
