/**
 * The long game: ten weeks, two plants, the stand-down and the transfer.
 *
 * The owner, 25 November 2026:
 *   - Ten weeks, with fuel shuffles at weeks 3, 6 and 9. Each three-week block is one fuel cycle in miniature:
 *     start of cycle, middle, end, then the reload. Each assembly lives three cycles, so by week 10 none of the
 *     fuel you started with is left in the core: the whole core is fuel you placed. That's the equilibrium core,
 *     and week 10 is the finale.
 *   - Holt's plant is the main game. If the floor's culture ends a week in Fear, Holt calls a stand-down: work
 *     stops, everyone's called in, and you get one week to rebuild. If the stand-down week ends in Fear too, you
 *     request a transfer. That's an honest ending, and it opens Colt's plant as a new game.
 *   - Colt's plant is the lighter game, and is open from the title screen too: the same crew and reactor, a good
 *     boss, a floor that starts with goodwill to spare. Your choices still matter there. It shows that a good
 *     culture is something people choose, and a bad one is something they choose too.
 *
 * Stored in the machine profile ("campaign"), never in the shift save. The shift carries its plant and week as
 * flags (plant:colt, cw:<n>, standdown:active) so a saved shift knows where it is.
 *
 * Cycle numbers are teaching numbers, typical of a large pressurised-water reactor on an 18-month cycle, not any
 * real plant's. Teaching model, not a license.
 */
import type { ShuffleCell } from "./plant";
import type { DayDef } from "./week";
import { COLT_FULL, PLANT_FLAG, plantOf, type PlantId } from "./coltVoice";
import { profileGet, profileSet } from "./profile";

export { PLANT_FLAG, plantOf, type PlantId };

export const CAMPAIGN_WEEKS = 10;
export const OUTAGE_WEEKS: readonly number[] = [3, 6, 9];
export const STANDDOWN_FLAG = "standdown:active";

export type Verdict = "held" | "regroup" | "standdown" | "lifted" | "transfer" | "finale";

export interface PlantRun {
  /** The week being played, 1–10. */
  week: number;
  standDown: boolean;
  standDowns: number;
  /** The last fuel map you signed at an outage: what Flux map Fridays measure. */
  lastMap: ShuffleCell[] | null;
  /** The verdict for the week that reached its ending. A week that's abandoned part-way replays. */
  decided: { week: number; verdict: Verdict } | null;
}

export interface Campaign {
  plant: PlantId;
  /** You left Holt's plant by transfer at least once. */
  transferred: boolean;
  holt: PlantRun;
  colt: PlantRun;
}

export function freshRun(): PlantRun {
  return { week: 1, standDown: false, standDowns: 0, lastMap: null, decided: null };
}

export function freshCampaign(): Campaign {
  return { plant: "holt", transferred: false, holt: freshRun(), colt: freshRun() };
}

function validRun(o: unknown): PlantRun {
  const r = (o ?? {}) as Partial<PlantRun>;
  const week = typeof r.week === "number" && r.week >= 1 ? Math.min(CAMPAIGN_WEEKS, Math.floor(r.week)) : 1;
  const d = r.decided as PlantRun["decided"];
  return {
    week,
    standDown: !!r.standDown,
    standDowns: typeof r.standDowns === "number" ? r.standDowns : 0,
    lastMap: Array.isArray(r.lastMap) ? (r.lastMap as ShuffleCell[]) : null,
    decided: d && typeof d.week === "number" && typeof d.verdict === "string" ? d : null,
  };
}

export function readCampaign(): Campaign {
  try {
    const o = profileGet("campaign") as Partial<Campaign> | undefined;
    if (!o || typeof o !== "object") return freshCampaign();
    return {
      plant: o.plant === "colt" ? "colt" : "holt",
      transferred: !!o.transferred,
      holt: validRun(o.holt),
      colt: validRun(o.colt),
    };
  } catch {
    return freshCampaign();
  }
}

export function writeCampaign(c: Campaign): void {
  profileSet("campaign", c);
}

export function runOf(c: Campaign, plant: PlantId = c.plant): PlantRun {
  return plant === "colt" ? c.colt : c.holt;
}

// ---------------------------------------------------------------------------------------------------------------
// The shift's own flags

export function weekFlag(week: number) {
  return `cw:${week}`;
}

/**
 * The campaign week a shift is in, from its flags. 0 when none is set: a save from before the campaign, or a test.
 * Week 0 plays exactly as the original single week did, shuffle and all.
 */
export function weekOf(flags: Record<string, boolean> | undefined): number {
  if (!flags) return 0;
  for (let w = CAMPAIGN_WEEKS; w >= 1; w--) if (flags[weekFlag(w)]) return w;
  return 0;
}

/** A Friday with no outage: the flux map instead of the shuffle. Never in week 0. */
export function fluxFriday(week: number) {
  return week >= 1 && !isOutageWeek(week);
}

/** Put the plant, the week and any stand-down on a fresh shift. */
export function stampShift(flags: Record<string, boolean>, c: Campaign): void {
  const run = runOf(c);
  for (let w = 1; w <= CAMPAIGN_WEEKS; w++) delete flags[weekFlag(w)];
  flags[weekFlag(run.week)] = true;
  if (c.plant === "colt") flags[PLANT_FLAG] = true;
  else delete flags[PLANT_FLAG];
  if (c.plant === "holt" && run.standDown) flags[STANDDOWN_FLAG] = true;
  else delete flags[STANDDOWN_FLAG];
}

// ---------------------------------------------------------------------------------------------------------------
// The verdict at the end of a week

export function weekVerdict(a: { plant: PlantId; fear: boolean; standDown: boolean; week: number }): Verdict {
  if (a.plant === "holt" && a.standDown) return a.fear ? "transfer" : a.week >= CAMPAIGN_WEEKS ? "finale" : "lifted";
  if (a.fear) return a.plant === "holt" ? "standdown" : "regroup";
  if (a.week >= CAMPAIGN_WEEKS) return "finale";
  return "held";
}

/** Record the verdict once, when the week's ending is shown. Returns the (possibly unchanged) campaign. */
export function decideWeek(c: Campaign, flags: Record<string, boolean>, fear: boolean): { c: Campaign; verdict: Verdict } {
  const plant = plantOf(flags);
  const run = runOf(c, plant);
  const week = Math.max(1, weekOf(flags));
  if (run.decided && run.decided.week === week) return { c, verdict: run.decided.verdict };
  const verdict = weekVerdict({ plant, fear, standDown: !!flags[STANDDOWN_FLAG], week });
  const next: PlantRun = { ...run, week, decided: { week, verdict } };
  return { c: plant === "colt" ? { ...c, colt: next } : { ...c, holt: next }, verdict };
}

/**
 * A new week. If the last one reached its ending, move on (week 10 rolls round to a new campaign, the crew still
 * remembering you); a stand-down verdict makes the next week a stand-down. A week abandoned part-way replays.
 */
export function advanceWeek(c: Campaign): Campaign {
  return { ...c, holt: advanceRun(c.holt), colt: advanceRun(c.colt) };
}

function advanceRun(run: PlantRun): PlantRun {
  if (!run.decided || run.decided.week !== run.week) return run;
  const v = run.decided.verdict;
  if (v === "transfer") return run; // transferTo() handles it.
  return {
    ...run,
    week: v === "finale" ? 1 : Math.min(CAMPAIGN_WEEKS, run.week + 1),
    standDown: v === "standdown",
    standDowns: run.standDowns + (v === "standdown" ? 1 : 0),
    lastMap: v === "finale" ? null : run.lastMap,
    decided: null,
  };
}

/** Leave Holt's plant. Colt's crew don't know you yet; Holt's plant starts over if you ever go back. */
export function transferTo(c: Campaign): Campaign {
  return { plant: "colt", transferred: true, holt: freshRun(), colt: { ...freshRun(), lastMap: null } };
}

export function choosePlant(c: Campaign, plant: PlantId): Campaign {
  return { ...c, plant };
}

// ---------------------------------------------------------------------------------------------------------------
// The fuel cycle, week by week

export type Phase = "boc" | "moc" | "eoc" | "eq";

export interface CycleWeek {
  week: number;
  cycle: number;
  phase: Phase;
  /** "Cycle 2 · Middle of cycle" */
  label: string;
  /** Teaching numbers. */
  boronPpm: number;
  efpd: number;
  mtcPcmPerF: number;
  /** The share of the fuel you started with that's still in the core, in thirds. */
  startingFuelThirds: number;
  outageFriday: boolean;
  restart: boolean;
  /** One line for the morning brief. */
  line: string;
}

const PHASE_NAME: Record<Phase, string> = { boc: "Start of cycle", moc: "Middle of cycle", eoc: "End of cycle", eq: "Equilibrium core" };

export function isOutageWeek(week: number) {
  return OUTAGE_WEEKS.includes(week);
}

export function cycleWeek(week: number): CycleWeek {
  const w = Math.max(1, Math.min(CAMPAIGN_WEEKS, Math.floor(week)));
  const cycle = Math.min(4, Math.ceil(w / 3));
  const pos = w === CAMPAIGN_WEEKS ? 0 : (w - 1) % 3;
  const phase: Phase = w === CAMPAIGN_WEEKS ? "eq" : (["boc", "moc", "eoc"] as const)[pos];
  const boronPpm = [1200, 620, 40][pos];
  const efpd = [15, 250, 480][pos];
  const mtcPcmPerF = [-8, -20, -34][pos];
  const startingFuelThirds = Math.max(0, 3 - (cycle - 1));
  const restart = w > 1 && pos === 0;
  const outageFriday = isOutageWeek(w);
  const line =
    phase === "eq"
      ? "Equilibrium. Three reloads have taken out every assembly you started with. This core is entirely fuel you placed, and the loading pattern now looks like last cycle's. That's what equilibrium means."
      : phase === "boc"
        ? restart
          ? `Restart week. The core went critical again after the reload. Boron is back up near ${boronPpm} ppm to hold the fresh fuel down, and xenon is still building, so expect rods and boron to move more than usual for a couple of days.`
          : `Start of cycle ${cycle}. Boron near ${boronPpm} ppm holds the fresh fuel down. The moderator temperature coefficient is only slightly negative, so a temperature swing moves power less than it will later.`
        : phase === "moc"
          ? `Middle of cycle. Boron is down to about ${boronPpm} ppm and falling a couple of ppm a day as the fuel burns. The quiet week, and the best one for getting to know people.`
          : `End of cycle. Boron is nearly gone, about ${boronPpm} ppm. Temperature does most of the work now, and the coefficient is at its most negative. Friday the reactor comes down for refuelling.`;
  return {
    week: w,
    cycle,
    phase,
    label: `Week ${w} of ${CAMPAIGN_WEEKS} · ${phase === "eq" ? PHASE_NAME.eq : `Cycle ${cycle} · ${PHASE_NAME[phase]}`}`,
    boronPpm,
    efpd,
    mtcPcmPerF,
    startingFuelThirds,
    outageFriday,
    restart,
    line,
  };
}

/** How much of the starting core is left, for the brief. */
export function fuelLine(week: number): string {
  const t = cycleWeek(week).startingFuelThirds;
  if (t >= 3) return "All of the fuel in the core is the fuel the plant started with.";
  if (t === 2) return "A third of the core is fuel you placed at the last outage.";
  if (t === 1) return "Two thirds of the core is fuel you placed.";
  return "None of the starting fuel is left. Every assembly in the core is one you placed.";
}

// ---------------------------------------------------------------------------------------------------------------
// How the week reads: day 5 and the stand-down

export interface WeekContext {
  week: number;
  plant: PlantId;
  standDown: boolean;
}

export function contextOf(flags: Record<string, boolean> | undefined): WeekContext {
  // Week 0 is the original single week (weekOf).
  return { week: weekOf(flags), plant: plantOf(flags), standDown: !!flags?.[STANDDOWN_FLAG] };
}

const FLUX_DAY: Pick<DayDef, "name" | "title" | "holt" | "items"> = {
  name: "Day 5 · Flux map",
  title: "Measure the core you built.",
  holt: "Holt: Flux map today. Find where the power actually peaks, and tell Priya before she tells you.",
  items: [
    "Reactor hall — the flux map desk. The detectors are in.",
    "Find the hottest assembly from what you know about the loading.",
    "Close the week when Priya agrees with your read.",
  ],
};

const STANDDOWN_TITLE = [
  "Stand-down. Nothing moves until we've talked.",
  "Stand-down, day two. Say the small things.",
  "Stand-down, day three. Nobody's in trouble for speaking.",
  "Stand-down, day four. The log is the floor's voice.",
  "Stand-down, last day. Show me it's different.",
];

const STANDDOWN_HOLT = [
  "Holt: Last week ended with heads down. That starts with me. Work stops. Everyone to the break room.",
  "Holt: Yesterday people talked. Keep going. Say it to the person first, then to me.",
  "Holt: I'm not counting catches this week. I'm counting who'd tell me what I don't want to hear.",
  "Holt: Every blank gets a name or a reason. Not to punish anyone. So we know what happened.",
  "Holt: Last day. If the floor's still afraid tonight, I'll understand if you ask to go.",
];

/** Day text for this week. Week 0 (no campaign) is exactly the original week. */
export function dayVariant(d: DayDef, ctx: WeekContext): DayDef {
  let out = d;
  if (d.n === 5 && d.shuffle && fluxFriday(ctx.week)) {
    out = { ...out, ...FLUX_DAY, goals: out.goals.map((g) => (g.id === "shuffle" ? { ...g, label: "Read the flux map" } : g)) };
  }
  if (d.n === 4 && fluxFriday(ctx.week)) {
    out = { ...out, items: out.items.map((i) => (i.startsWith("Tomorrow is the shuffle") ? "Tomorrow is the flux map. Priya wants the fuel map in your hands." : i)) };
  }
  if (ctx.standDown && ctx.plant === "holt") {
    const i = Math.max(0, Math.min(4, d.n - 1));
    out = { ...out, kicker: out.kicker.replace("Morning brief", "Stand-down"), title: STANDDOWN_TITLE[i], holt: STANDDOWN_HOLT[i] };
  }
  return out;
}

/** Sim's own day-5 strings, read for a Flux map Friday. */
export const FLUX_TEXT: Record<string, string> = {
  "Outage week. Everyone's tired, and tired people round numbers. Please don't round numbers.":
    "End of the week. Everyone's tired, and tired people round numbers. Please don't round numbers.",
  "Outage week. Everyone's tired. If you're tired enough to round a number, come and tell me, and I'll find you a relief.":
    "End of the week. Everyone's tired. If you're tired enough to round a number, come and tell me, and I'll find you a relief.",
  "Reactor hall — fuel shuffle desk. Program the core.": "Reactor hall — flux map desk. Find where the power peaks.",
  "Show Priya the map. She will not sign a peak she cannot explain.": "Show Priya your read of the map. She'll want to know why it peaks there.",
};

export function weekText(t: string, ctx: WeekContext): string {
  if (!t) return t;
  if (fluxFriday(ctx.week) && Object.prototype.hasOwnProperty.call(FLUX_TEXT, t)) return FLUX_TEXT[t];
  return t;
}

// ---------------------------------------------------------------------------------------------------------------
// The ending card

export interface VerdictCard {
  title: string;
  body: string[];
  /** The main button. */
  next: string;
}

export function verdictCard(v: Verdict, week: number, plant: PlantId): VerdictCard {
  const boss = plant === "colt" ? "Colt" : "Holt";
  switch (v) {
    case "standdown":
      return {
        title: "Holt calls a stand-down",
        body: [
          "Monday, 06:30. Every phone on site rings at once. Work stops. Holt is standing in the break room with Mabel's coffee urn and no slides.",
          "Holt: I've read the week. People stopped saying things out loud, and that's how plants get hurt. That starts with me. This week we rebuild it, or we stop pretending.",
          "One week. If the floor is still afraid when it ends, you can ask to go somewhere it isn't.",
        ],
        next: "Begin the stand-down week",
      };
    case "lifted":
      return {
        title: "The stand-down is lifted",
        body: [
          "Holt takes the notice off the board himself. He doesn't make a speech.",
          "Holt: Thank you. I mean all of you, and I mean you. It's not fixed. It's moving the right way, and that's the only way it ever gets fixed.",
        ],
        next: `Week ${Math.min(CAMPAIGN_WEEKS, week + 1)}`,
      };
    case "transfer":
      return {
        title: "You request a transfer",
        body: [
          "Friday evening. You write it by hand, because that's how you'd want someone to tell you.",
          "Holt reads it twice. Holt: I won't argue. You gave this floor two weeks of chances it didn't give you back. That's on us. I'll sign it.",
          "Mabel walks you to the car park and doesn't say goodbye. Mabel: There's a plant up the coast. Same kind of people. Different man in the chair. Go and see what you build there, love.",
          "This is an ending. The floor stayed afraid, and you chose not to stay with it. That's a real choice people make, and it's an honest one.",
        ],
        next: "Start at Colt's plant",
      };
    case "regroup":
      return {
        title: "Colt calls everyone in",
        body: [
          "Colt doesn't call it a stand-down. He calls it coffee, and he buys it.",
          "Colt: Heads went down this week. When that happens here, it's usually something I did or didn't do. So, tell me. Then we go again.",
        ],
        next: `Week ${Math.min(CAMPAIGN_WEEKS, week + 1)}`,
      };
    case "finale":
      return {
        title: "The equilibrium core",
        body: [
          "Ten weeks. Three outages. Every assembly in the core now is one you placed, and the loading pattern has settled into the same shape it'll keep, cycle after cycle.",
          `${boss === "Colt" ? "Colt" : "Holt"} walks the reactor hall with you and Priya one last time this rotation. Nobody says much. The flux map is flat enough to sign.`,
          "The core repeats now. So does the floor: whatever you built with these people is what the next engineer walks into.",
        ],
        next: "Begin again from week 1",
      };
    default:
      return { title: "", body: [], next: `Week ${Math.min(CAMPAIGN_WEEKS, week + 1)}` };
  }
}

/** Who sits in the director's chair, for the title screen. */
export const PLANTS: { id: PlantId; title: string; line: string; boss: string }[] = [
  {
    id: "holt",
    title: "Holt's plant",
    line: "The full story. A careful, cold director, a floor that's quick to go quiet, and a culture you build or break with every choice.",
    boss: "Mr. Reginald Holt",
  },
  {
    id: "colt",
    title: "Colt's plant",
    line: "The lighter game. The same crew and reactor, and a good boss. The floor starts with goodwill to spare. Your choices still matter.",
    boss: COLT_FULL,
  },
];
