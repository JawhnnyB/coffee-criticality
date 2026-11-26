/**
 * The pebble bed's pass count: the Friday job on a pebble-bed site.
 *
 * The owner, 26 November 2026, approved: a pebble bed never shuts down to refuel. Pebbles fall slowly through the
 * core; at the bottom each one is measured, and it either goes back in on top for another pass or, once it has
 * burned enough, it's discharged and replaced by a fresh one. The player sets the two numbers that decide
 * everything: how many passes a pebble gets, and the burnup that sends it out.
 *
 * Teaching numbers from HTR-PM's published design: a 250 MWt module, about 420,000 pebbles, fuel enriched to 8.5%,
 * 7 g of heavy metal per pebble, helium in at 250 °C and out at 750 °C, an average of 15 passes and a discharge
 * burnup of 90 GWd/tHM. The equilibrium below reproduces HTR-PM's 70-day pass with those settings. Limits are
 * teaching limits. Teaching model, not a license.
 */
import { solveAxial } from "./axial";

export const MODULE = {
  powerMW: 250,
  pebbles: 420_000,
  hmKgPerPebble: 0.007,
  enrichment: 8.5,
  inletC: 250,
  outletC: 750,
  heightCm: 1100,
};

export const ZONES = 10;

export const LIMITS = {
  /** What the burnup measurement and fuel handling line can pass, pebbles a day. */
  handlingPerDay: 6500,
  /** No single pebble past this burnup, GWd/tHM. */
  maxPebbleBurnup: 105,
  /** Hottest pebble's power, kW. */
  pebbleKw: 1.6,
  /** Hottest fuel in normal running, °C. */
  fuelC: 1000,
  /** The fuel budget wants at least this much out of every pebble, GWd/tHM. */
  minBurnup: 80,
};

export interface PassPlan {
  passes: number;
  /** GWd/tHM at discharge. */
  burnup: number;
}

export const HTR_PM: PassPlan = { passes: 15, burnup: 90 };

export interface PassResult {
  k: number;
  freshPerDay: number;
  handledPerDay: number;
  daysPerPass: number;
  /** Burnup of the most-burned pebble that comes out. */
  maxBurnup: number;
  /** Zone power, top to bottom, average 1. */
  power: number[];
  /** Helium temperature in each zone, °C. */
  gasC: number[];
  /** Hottest fuel in each zone, °C. */
  fuelC: number[];
  peakKw: number;
  peakFuelC: number;
}

/** k∞ of a pebble at a burnup, a straight-line teaching fit for 8.5% fuel. */
export function kInfAt(burnup: number) {
  return 1.52 - 0.0062 * burnup;
}

/** Non-leakage for the module: neutrons that don't escape through the reflectors. */
const NON_LEAKAGE = 0.81;

export function evaluate(plan: PassPlan): PassResult {
  const n = Math.max(1, Math.round(plan.passes));
  const B = plan.burnup;
  // Every pebble in the core is on one of n passes; on pass j, in zone i, it has burned about (j + depth) / n of B.
  const kZone: number[] = [];
  for (let i = 0; i < ZONES; i++) {
    const depth = (i + 0.5) / ZONES;
    let sum = 0;
    for (let j = 0; j < n; j++) sum += kInfAt(((j + depth) / n) * B);
    kZone.push(sum / n);
  }
  const mean = kZone.reduce((x, y) => x + y, 0) / ZONES;
  const k = NON_LEAKAGE * mean;
  // Graphite moderates slowly and the core is tall: a large migration area for the axial coupling.
  const r = solveAxial(kZone, new Array(ZONES).fill(2400), MODULE.heightCm / ZONES, 0.5);
  const power = r.power;
  // Helium flows down: it's coldest at the top.
  const total = power.reduce((x, y) => x + y, 0);
  let above = 0;
  const gasC = power.map((p) => {
    const mid = (above + p / 2) / total;
    above += p;
    return MODULE.inletC + (MODULE.outletC - MODULE.inletC) * mid;
  });
  const avgKw = (MODULE.powerMW * 1000) / MODULE.pebbles;
  const RADIAL = 1.4;
  const fuelC = power.map((p, i) => gasC[i] + 110 * p * RADIAL);
  const energyPerPebbleMWd = B * MODULE.hmKgPerPebble; // GWd/t = MWd/kg
  const freshPerDay = MODULE.powerMW / energyPerPebbleMWd;
  const handledPerDay = freshPerDay * n;
  const daysPerPass = MODULE.pebbles / handledPerDay;
  // Pebbles take different paths down: a pebble measured just under the target goes round once more. With one
  // pass there's no measurement to stop it, and the path spread lands straight on the discharge burnup.
  const spread = n === 1 ? 0.45 : 0.6 / n + 0.35 / Math.sqrt(n * 4);
  const maxBurnup = B * (1 + spread);
  return {
    k,
    freshPerDay,
    handledPerDay,
    daysPerPass,
    maxBurnup,
    power,
    gasC,
    fuelC,
    peakKw: avgKw * Math.max(...power) * RADIAL,
    peakFuelC: Math.max(...fuelC),
  };
}

export interface Check {
  id: "k" | "handling" | "burnup" | "economy" | "pebbleKw" | "fuelC";
  label: string;
  value: string;
  ok: boolean;
  why: string;
}

export function checks(r: PassResult, plan: PassPlan): Check[] {
  return [
    { id: "k", label: "Core stays critical", value: r.k.toFixed(3), ok: r.k >= 1.0, why: "k at or above 1.000. Burn pebbles too far and the core can't keep itself going." },
    {
      id: "economy",
      label: "Discharge burnup",
      value: `${plan.burnup.toFixed(0)} GWd/t`,
      ok: plan.burnup >= LIMITS.minBurnup,
      why: `At least ${LIMITS.minBurnup}. Below that you're throwing away fuel the budget paid for.`,
    },
    {
      id: "burnup",
      label: "Most-burned pebble",
      value: `${r.maxBurnup.toFixed(0)} GWd/t`,
      ok: r.maxBurnup <= LIMITS.maxPebbleBurnup,
      why: `At or under ${LIMITS.maxPebbleBurnup}. Every pass is a measurement; with few passes, some pebbles overshoot before you can catch them.`,
    },
    {
      id: "handling",
      label: "Pebbles handled a day",
      value: Math.round(r.handledPerDay).toLocaleString("en-US"),
      ok: r.handledPerDay <= LIMITS.handlingPerDay,
      why: `At or under ${LIMITS.handlingPerDay.toLocaleString("en-US")}. Every pass goes through the burnup meter, and it only runs so fast.`,
    },
    {
      id: "pebbleKw",
      label: "Hottest pebble",
      value: `${r.peakKw.toFixed(2)} kW`,
      ok: r.peakKw <= LIMITS.pebbleKw,
      why: `At or under ${LIMITS.pebbleKw} kW. Fresh pebbles all at the top make a hot top; more passes mix fresh and burned at every height.`,
    },
    {
      id: "fuelC",
      label: "Hottest fuel",
      value: `${Math.round(r.peakFuelC)} °C`,
      ok: r.peakFuelC <= LIMITS.fuelC,
      why: `At or under ${LIMITS.fuelC} °C in normal running. Helium flows down, so the bottom runs hottest; there's a lot of margin.`,
    },
  ];
}

export function passes(r: PassResult, plan: PassPlan) {
  return checks(r, plan).every((c) => c.ok);
}
