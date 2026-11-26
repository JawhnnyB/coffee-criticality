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
import type { PlantType, ShuffleCell } from "./plant";
import { FRIDAY, fridayJob, fridayText, hasOutages, type FridayJob } from "./refuel/byType";
import { weekStart as saltWeekStart } from "./refuel/saltLoop";

export { fridayJob, type FridayJob };
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
  /** The other types' last signed Friday (refuel/): a BWR bundle, a pebble pass plan, a salt plan. */
  lastDesk?: { bundle?: string[][]; passes?: { passes: number; burnup: number }; salt?: { feed: number; sparge: number; cleanup: number } };
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
    lastDesk: r.lastDesk && typeof r.lastDesk === "object" ? r.lastDesk : undefined,
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

/** A PWR Friday with no outage: the flux map instead of the shuffle. Never in week 0. */
export function fluxFriday(week: number, kind: PlantType = "pwr") {
  return fridayJob(week, kind) === "fluxmap";
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
    lastDesk: v === "finale" ? undefined : run.lastDesk,
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
  /** The teaching numbers, one line, for the strip above the brief. */
  numbers: string;
  /** What Friday is this week. */
  friday: string;
}

const PHASE_NAME: Record<Phase, string> = { boc: "Start of cycle", moc: "Middle of cycle", eoc: "End of cycle", eq: "Equilibrium core" };

export function isOutageWeek(week: number, kind: PlantType = "pwr") {
  return hasOutages(kind) && OUTAGE_WEEKS.includes(week);
}

const FRIDAY_NAME: Record<FridayJob, string> = {
  legacy: "Friday: fuel shuffle",
  shuffle: "Friday: refuelling outage",
  fluxmap: "Friday: flux map",
  bundle: "Friday: refuelling outage, bundle bench",
  tip: "Friday: TIP traces",
  passes: "Friday: pass-count review",
  salt: "Friday: salt review",
};

export function cycleWeek(week: number, kind: PlantType = "pwr"): CycleWeek {
  const base = pwrWeek(week);
  const friday = FRIDAY_NAME[fridayJob(base.week, kind)];
  if (kind === "bwr") return { ...base, ...bwrWeek(base), friday };
  if (kind === "pebble") return { ...base, ...pebbleWeek(base.week), outageFriday: false, restart: false, friday };
  if (kind === "msr") return { ...base, ...saltWeek(base.week), outageFriday: false, restart: false, friday };
  return { ...base, friday };
}

/** A BWR has no soluble boron: blades and gadolinia hold the fresh fuel down, and the power shape climbs the core. */
function bwrWeek(b: CycleWeek): Pick<CycleWeek, "line" | "numbers"> {
  const gad = b.phase === "moc" ? 35 : b.phase === "eoc" ? 0 : 100;
  const line =
    b.phase === "eq"
      ? "Equilibrium. Three reloads have taken out every bundle you started with. Every bundle in the core is one you designed, and the loading now looks like last cycle's."
      : b.phase === "boc"
        ? b.restart
          ? "Restart week. The reload is in, and the blades come out in sequence. Gadolinia in the new bundles holds them down while xenon builds."
          : `Start of cycle ${b.cycle}. No boron in a BWR: control blades and gadolinia hold the fresh fuel down. Power leans to the bottom, where the water hasn't boiled yet.`
        : b.phase === "moc"
          ? "Middle of cycle. The gadolinia is burning out and the bottom burns first, so the power shape climbs the core. The blade pattern is swapped every few weeks so no bundle burns unevenly beside a blade."
          : "End of cycle. The blades are nearly all out and the bottom is well burned, so power sits higher in the core. Friday the reactor comes down for refuelling.";
  return { line, numbers: `Core void ≈ 40% · Blades: A/B sequence · Gadolinia left ≈ ${gad}% · No soluble boron` };
}

/** A pebble bed refuels every day at full power: the weeks are the core running in toward its equilibrium mix. */
function pebbleWeek(week: number): Pick<CycleWeek, "line" | "numbers" | "label" | "phase"> {
  const eq = week >= CAMPAIGN_WEEKS;
  const line = eq
    ? "Equilibrium. The pebbles in the core are the mix your pass count makes, and it stays that way as long as the settings hold."
    : week <= 3
      ? "Running in. The core started on its first load of pebbles. Each week more of them are on their second, third or fourth trip through."
      : week <= 6
        ? "Half the pebbles have been round more than once. At the bottom, the burnup meter decides one pebble at a time which go back in."
        : "Nearly at equilibrium: fresh pebbles in at the top, spent ones out at the bottom, every day, at full power.";
  return {
    line,
    phase: eq ? "eq" : "moc",
    label: `Week ${week} of ${CAMPAIGN_WEEKS} · ${eq ? "Equilibrium core" : "Running in"}`,
    numbers: "Helium 250 → 750 °C · About 400 fresh pebbles a day · No outages",
  };
}

/** A molten-salt core has no fuel elements: the weeks are the salt ageing toward its equilibrium. */
function saltWeek(week: number): Pick<CycleWeek, "line" | "numbers" | "label" | "phase"> {
  const eq = week >= CAMPAIGN_WEEKS;
  const line = eq
    ? "Equilibrium salt. What you feed in, what the pump bowl strips out and what cleanup removes now balance, week after week."
    : week <= 3
      ? "Fresh salt. Fission products are only starting to build. Xenon leaves as a gas in the pump bowl, so it matters far less than in a solid-fuel core."
      : week <= 6
        ? "The salt is ageing. Lanthanides, fission products that soak up neutrons and don't leave as gas, are building. Cleanup is how they come out."
        : "Old salt. Without cleanup, the lanthanides now take more fresh fuel every day just to stand still.";
  return {
    line,
    phase: eq ? "eq" : "moc",
    label: `Week ${week} of ${CAMPAIGN_WEEKS} · ${eq ? "Equilibrium salt" : `Salt week ${week}`}`,
    numbers: `Salt outlet ≈ 650 °C · Lanthanides ≈ ${Math.round(saltWeekStart(week).lanth)} pcm · No outages`,
  };
}

function pwrWeek(week: number): CycleWeek {
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
    numbers: `Boron ≈ ${boronPpm} ppm · ≈ ${efpd} EFPD · MTC ≈ ${mtcPcmPerF} pcm/°F`,
    friday: "",
  };
}

/** How much of the starting core is left, for the brief. */
export function fuelLine(week: number, kind: PlantType = "pwr"): string {
  if (kind === "pebble") return "Fresh pebbles go in every day. Nothing waits for an outage.";
  if (kind === "msr") return "There's no fuel to place. The fuel is in the salt.";
  const t = cycleWeek(week).startingFuelThirds;
  if (kind === "bwr") {
    if (t >= 3) return "Every bundle in the core is one the plant started with.";
    if (t === 2) return "A third of the core is bundles you designed at the last outage.";
    if (t === 1) return "Two thirds of the core is bundles you designed.";
    return "None of the starting bundles are left. Every bundle in the core is one you designed.";
  }
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
  /** The site's reactor type. Missing means a PWR. */
  kind?: PlantType;
}

export function contextOf(flags: Record<string, boolean> | undefined, kind: PlantType = "pwr"): WeekContext {
  // Week 0 is the original single week (weekOf).
  return { week: weekOf(flags), plant: plantOf(flags), standDown: !!flags?.[STANDDOWN_FLAG], kind };
}

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
  const job = fridayJob(ctx.week, ctx.kind ?? "pwr");
  const f = job === "legacy" || job === "shuffle" ? null : FRIDAY[job];
  if (f && d.n === 5 && d.shuffle) {
    out = {
      ...out,
      name: f.name,
      title: f.title,
      holt: f.holt,
      items: f.items,
      goals: out.goals.map((g) => (g.id === "shuffle" ? { ...g, label: f.goal } : g)),
    };
  }
  if (f && d.n === 4) {
    out = { ...out, items: out.items.map((i) => (i.startsWith("Tomorrow is the shuffle") ? f.thursday : i)) };
  }
  if (ctx.standDown && ctx.plant === "holt") {
    const i = Math.max(0, Math.min(4, d.n - 1));
    out = { ...out, kicker: out.kicker.replace("Morning brief", "Stand-down"), title: STANDDOWN_TITLE[i], holt: STANDDOWN_HOLT[i] };
  }
  return out;
}

/** A sim or dialogue line as this week's Friday reads it (refuel/byType.ts). */
export function weekText(t: string, ctx: WeekContext): string {
  return fridayText(t, fridayJob(ctx.week, ctx.kind ?? "pwr"));
}

// ---------------------------------------------------------------------------------------------------------------
// The ending card

export interface VerdictCard {
  title: string;
  body: string[];
  /** The main button. */
  next: string;
}

export function verdictCard(v: Verdict, week: number, plant: PlantId, kind: PlantType = "pwr"): VerdictCard {
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
    case "finale": {
      const first: Record<PlantType, string> = {
        pwr: "Ten weeks. Three outages. Every assembly in the core now is one you placed, and the loading pattern has settled into the same shape it'll keep, cycle after cycle.",
        bwr: "Ten weeks. Three outages. Every bundle in the core now is one you designed, and the loading has settled into the shape it'll keep, cycle after cycle.",
        pebble: "Ten weeks, and not one outage. The running-in is over: the pebbles in the core are the equilibrium mix your pass count makes.",
        msr: "Ten weeks. The salt has reached equilibrium: what you feed in balances what the pump bowl strips and what cleanup takes out.",
      };
      const sign: Record<PlantType, string> = {
        pwr: "The flux map is flat enough to sign.",
        bwr: "The TIP traces are flat enough to sign.",
        pebble: "The burnup meter clicks over at the bottom of the core.",
        msr: "The salt temperature trace is flat enough to sign.",
      };
      return {
        title: kind === "msr" ? "The equilibrium salt" : "The equilibrium core",
        body: [
          first[kind],
          `${boss} walks the reactor hall with you and Priya one last time this rotation. Nobody says much. ${sign[kind]}`,
          `The ${kind === "msr" ? "salt" : "core"} repeats now. So does the floor: whatever you built with these people is what the next engineer walks into.`,
        ],
        next: "Begin again from week 1",
      };
    }
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
