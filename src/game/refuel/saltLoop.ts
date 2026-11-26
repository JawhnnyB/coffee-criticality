/**
 * The molten-salt site's cleanup loop: the Friday job on a molten-salt site.
 *
 * The owner, 26 November 2026, approved: a molten-salt reactor has no fuel elements to move. The fuel is dissolved
 * in the salt, so "refuelling" is bookkeeping: how much fresh fuel you feed in, how hard you strip xenon out as a
 * gas, and how much salt you send through cleanup to pull out the fission products that soak up neutrons.
 *
 * Teaching numbers, in the spirit of ORNL's Molten-Salt Reactor Experiment (8 MWt, fuel salt around 650 °C, which
 * sprayed salt into its pump bowl so xenon and krypton could escape). The reactor follows its salt: with a strongly
 * negative temperature coefficient, any reactivity left over just moves the salt temperature. Keep the outlet in
 * its band for a whole week. Teaching model, not a license.
 */
export const BAND = { lowC: 645, highC: 655, setC: 650 };

export interface SaltPlan {
  /** Fresh fuel fed per day, in teaching units (each worth the same reactivity). */
  feed: number;
  /** Share of the xenon stripped out as gas, 0–0.9. */
  sparge: number;
  /** Share of the salt inventory sent through cleanup each day, 0–0.03. */
  cleanup: number;
}

export const LIMITS = { feedMax: 4, spargeMax: 0.9, cleanupMax: 0.03 };

/** Teaching temperature coefficient, pcm per °C: strongly negative, which is why the salt temperature is the readout. */
const ALPHA = -20;
/** Reactivity burned out of the salt each day at full power, pcm. */
const BURN = 55;
/** Each unit of daily feed adds this much a day, pcm. */
const PER_FEED = 25;
/** Xenon's worth with no stripping at all, pcm (teaching: much is lost to the graphite and the pump bowl anyway). */
const XE_FULL = 900;
/** Xenon settles to its new level over about this many hours. */
const XE_TAU_H = 30;
/** Lanthanides (the fission products cleanup removes) build this much a day, pcm. */
const LANTH_RATE = 18;

export interface WeekStart {
  /** Spare fuel reactivity at the start of the week, pcm. */
  fuel: number;
  xenon: number;
  lanth: number;
}

/** The salt ages: each campaign week starts with more lanthanides in it. Week 0 or 1 is a fresh salt. */
export function weekStart(week: number): WeekStart {
  const w = Math.max(1, Math.min(10, week));
  const lanth = 120 + 70 * (w - 1);
  // Last week's sparging (assumed half) left xenon at its settled level; fuel was topped up to hold the set point.
  const xenon = XE_FULL * (1 - 0.5);
  return { fuel: xenon + lanth, xenon, lanth };
}

export interface WeekRun {
  /** Hours from the start of the week. */
  hours: number[];
  tempC: number[];
  minC: number;
  maxC: number;
  /** Where the three ledgers ended, pcm. */
  end: WeekStart;
  inBand: boolean;
}

export function runWeek(plan: SaltPlan, start: WeekStart, stepH = 2): WeekRun {
  const feed = Math.max(0, Math.min(LIMITS.feedMax, plan.feed));
  const sparge = Math.max(0, Math.min(LIMITS.spargeMax, plan.sparge));
  const cleanup = Math.max(0, Math.min(LIMITS.cleanupMax, plan.cleanup));
  let { fuel, xenon, lanth } = start;
  const xeTarget = XE_FULL * (1 - sparge);
  const hours: number[] = [];
  const tempC: number[] = [];
  for (let h = 0; h <= 7 * 24; h += stepH) {
    const rho = fuel - xenon - lanth;
    hours.push(h);
    tempC.push(BAND.setC + rho / -ALPHA);
    const dtDays = stepH / 24;
    fuel += (feed * PER_FEED - BURN) * dtDays;
    xenon += (xeTarget - xenon) * (1 - Math.exp(-stepH / XE_TAU_H));
    lanth += (LANTH_RATE - cleanup * lanth) * dtDays;
  }
  const minC = Math.min(...tempC);
  const maxC = Math.max(...tempC);
  return { hours, tempC, minC, maxC, end: { fuel, xenon, lanth }, inBand: minC >= BAND.lowC && maxC <= BAND.highC };
}

export interface Check {
  id: "band" | "fuel";
  label: string;
  value: string;
  ok: boolean;
  why: string;
}

export function checks(run: WeekRun, plan: SaltPlan): Check[] {
  return [
    {
      id: "band",
      label: "Salt outlet all week",
      value: `${Math.round(run.minC)}–${Math.round(run.maxC)} °C`,
      ok: run.inBand,
      why: `Between ${BAND.lowC} and ${BAND.highC} °C for all seven days. Leftover reactivity shows up as temperature.`,
    },
    {
      id: "fuel",
      label: "Fresh fuel fed",
      value: `${plan.feed.toFixed(1)} a day`,
      ok: plan.feed <= LIMITS.feedMax,
      why: `At most ${LIMITS.feedMax} a day: that's what the feed line can add.`,
    },
  ];
}

export function passes(run: WeekRun, plan: SaltPlan) {
  return checks(run, plan).every((c) => c.ok);
}

/** Where the desk starts: last month's settings, which no longer keep up with an ageing salt. */
export const START_PLAN: SaltPlan = { feed: 1.2, sparge: 0.3, cleanup: 0 };
