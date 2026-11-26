/**
 * Each reactor type's Friday, and how its weeks read.
 *
 * The owner, 26 November 2026, approved docs/reactor-refuelling-by-type.md: the PWR keeps its fuel shuffle (weeks
 * 3, 6, 9) and flux maps; a BWR designs its reload bundle at each outage and reads TIP traces in between; a pebble
 * bed never shuts down to refuel, so every Friday is the pass-count review; a molten-salt site has no fuel elements
 * at all, so every Friday is the salt review.
 *
 * Week 0 (a save from before the campaign) stays exactly as the original single week: the PWR shuffle, whatever the
 * site. Teaching model, not a license.
 */
import type { PlantType } from "../plant";

export type FridayJob = "legacy" | "shuffle" | "fluxmap" | "bundle" | "tip" | "passes" | "salt";

export const OUTAGES: readonly number[] = [3, 6, 9];

/** Reactor types that shut down to refuel. */
export function hasOutages(kind: PlantType) {
  return kind === "pwr" || kind === "bwr";
}

export function fridayJob(week: number, kind: PlantType = "pwr"): FridayJob {
  if (week < 1) return "legacy";
  const outage = OUTAGES.includes(week);
  if (kind === "bwr") return outage ? "bundle" : "tip";
  if (kind === "pebble") return "passes";
  if (kind === "msr") return "salt";
  return outage ? "shuffle" : "fluxmap";
}

/** Fridays when the reactor comes down: the shuffle and the bundle bench. */
export function isOutageJob(job: FridayJob) {
  return job === "shuffle" || job === "bundle" || job === "legacy";
}

export interface FridayText {
  name: string;
  title: string;
  holt: string;
  items: string[];
  /** The week's shuffle goal, renamed. */
  goal: string;
  /** Thursday's reminder. */
  thursday: string;
}

export const FRIDAY: Record<Exclude<FridayJob, "legacy" | "shuffle">, FridayText> = {
  fluxmap: {
    name: "Day 5 · Flux map",
    title: "Measure the core you built.",
    holt: "Holt: Flux map today. Find where the power actually peaks, and tell Priya before she tells you.",
    items: [
      "Reactor hall — the flux map desk. The detectors are in.",
      "Find the hottest assembly from what you know about the loading.",
      "Close the week when Priya agrees with your read.",
    ],
    goal: "Read the flux map",
    thursday: "Tomorrow is the flux map. Priya wants the fuel map in your hands.",
  },
  bundle: {
    name: "Day 5 · Bundle bench",
    title: "Design the reload bundle.",
    holt: "Holt: Outage week. Design the reload bundle today: three layers, one boiling channel. Take your time.",
    items: [
      "Reactor hall — the bundle bench. Bottom, middle and top layers.",
      "Keep the axial and pin peaking under their limits.",
      "Close the week when Priya signs the bundle.",
    ],
    goal: "Sign the reload bundle",
    thursday: "Tomorrow is the bundle bench. Priya wants the lattice sheets in your hands.",
  },
  tip: {
    name: "Day 5 · TIP traces",
    title: "Trace the bundle you designed.",
    holt: "Holt: TIP traces today. Run the probe up the channel and find where the power peaks now.",
    items: [
      "Reactor hall — the TIP desk. The probes are ready.",
      "Find the axial peak from what you know about the bundle and the cycle.",
      "Close the week when Priya agrees with your read.",
    ],
    goal: "Read the TIP trace",
    thursday: "Tomorrow is the TIP trace. Priya wants the bundle sheet in your hands.",
  },
  passes: {
    name: "Day 5 · Pass count",
    title: "Set how the pebbles move.",
    holt: "Holt: Discharge review today. Set the pass count and the burnup that sends a pebble out.",
    items: [
      "Reactor hall — the pebble desk. The burnup meter's log is in.",
      "Keep the core critical and every pebble inside its limits.",
      "Close the week when Priya signs the settings.",
    ],
    goal: "Set the pass count",
    thursday: "Tomorrow is the pebble review. Priya wants the burnup meter's log in your hands.",
  },
  salt: {
    name: "Day 5 · Salt loop",
    title: "Balance the salt for the week.",
    holt: "Holt: Salt sample's back. Set the feed, the sparge and the cleanup for next week.",
    items: [
      "Reactor hall — the salt desk. This morning's sample is in.",
      "Keep the salt outlet in its band for seven days.",
      "Close the week when Priya signs the settings.",
    ],
    goal: "Balance the salt",
    thursday: "Tomorrow is the salt review. Priya wants the sample results in your hands.",
  },
};

/** The sim's own day-5 strings (sim.ts can't change), as each Friday reads them. */
const SIM_TEXT: Record<string, Partial<Record<FridayJob, string>>> = {
  "Reactor hall — fuel shuffle desk. Program the core.": {
    fluxmap: "Reactor hall — flux map desk. Find where the power peaks.",
    bundle: "Reactor hall — bundle bench. Design the reload bundle.",
    tip: "Reactor hall — TIP desk. Find where the power peaks.",
    passes: "Reactor hall — pebble desk. Set the pass count.",
    salt: "Reactor hall — salt desk. Balance the week.",
  },
  "Show Priya the map. She will not sign a peak she cannot explain.": {
    fluxmap: "Show Priya your read of the map. She'll want to know why it peaks there.",
    bundle: "Show Priya the bundle. She won't sign a pin she can't explain.",
    tip: "Show Priya your read of the trace. She'll want to know why it peaks there.",
    passes: "Show Priya the settings. She'll want every pebble inside its limits.",
    salt: "Show Priya the week. She'll want the salt in its band every hour.",
  },
  "Outage week. Everyone's tired, and tired people round numbers. Please don't round numbers.": {
    fluxmap: "End of the week. Everyone's tired, and tired people round numbers. Please don't round numbers.",
    tip: "End of the week. Everyone's tired, and tired people round numbers. Please don't round numbers.",
    passes: "End of the week. Everyone's tired, and tired people round numbers. Please don't round numbers.",
    salt: "End of the week. Everyone's tired, and tired people round numbers. Please don't round numbers.",
  },
  "Outage week. Everyone's tired. If you're tired enough to round a number, come and tell me, and I'll find you a relief.": {
    fluxmap: "End of the week. Everyone's tired. If you're tired enough to round a number, come and tell me, and I'll find you a relief.",
    tip: "End of the week. Everyone's tired. If you're tired enough to round a number, come and tell me, and I'll find you a relief.",
    passes: "End of the week. Everyone's tired. If you're tired enough to round a number, come and tell me, and I'll find you a relief.",
    salt: "End of the week. Everyone's tired. If you're tired enough to round a number, come and tell me, and I'll find you a relief.",
  },
};

const SIGNED = /^Priya: Fq ([\d.]+)\. Teaching model only\. Now tell (\w+)\.$/;
const SIGNED_AS: Partial<Record<FridayJob, (fig: string, boss: string) => string>> = {
  fluxmap: (f, b) => `Priya: Flux map signed. Fq ${f}. Teaching model only. Now tell ${b}.`,
  bundle: (f, b) => `Priya: Bundle signed. Hottest pin ${f}. Teaching model only. Now tell ${b}.`,
  tip: (f, b) => `Priya: Trace signed. Axial peak ${f}. Teaching model only. Now tell ${b}.`,
  passes: (f, b) => `Priya: Settings signed. Core k ${f}. Teaching model only. Now tell ${b}.`,
  salt: (f, b) => `Priya: Salt week signed. Hottest hour ${Math.round(Number(f))} °C. Teaching model only. Now tell ${b}.`,
};

/** A sim line as this Friday reads it. */
export function fridayText(t: string, job: FridayJob): string {
  if (!t || job === "legacy" || job === "shuffle") return t;
  const mapped = SIM_TEXT[t]?.[job];
  if (mapped) return mapped;
  const m = SIGNED.exec(t);
  if (m && SIGNED_AS[job]) return SIGNED_AS[job]!(m[1], m[2]);
  return t;
}

/** The week log line for the signed Friday job (the sim writes the shuffle's). */
export function fridayLog(job: FridayJob, figure: number): string | null {
  switch (job) {
    case "fluxmap":
      return `Day 5 · Flux map read, Fq ${figure.toFixed(2)}. Teaching model only.`;
    case "bundle":
      return `Day 5 · Reload bundle signed, hottest pin ${figure.toFixed(2)}. Teaching model only.`;
    case "tip":
      return `Day 5 · TIP trace read, axial peak ${figure.toFixed(2)}. Teaching model only.`;
    case "passes":
      return `Day 5 · Pass count signed, core k ${figure.toFixed(3)}. Teaching model only.`;
    case "salt":
      return `Day 5 · Salt week signed, hottest hour ${Math.round(figure)} °C. Teaching model only.`;
    default:
      return null;
  }
}
