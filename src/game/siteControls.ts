/**
 * Operator inputs for the site, mapped onto the sim's power, flow and rods.
 * The sim is not edited. What it cannot express is computed here and shown on the panel.
 *
 * Sources, beside the rule they justify:
 * - BWR recirc: US NRC Reactor Concepts Manual, Boiling Water Reactor Systems.
 *   In the power range, recirculation flow is the main power control. More flow
 *   sweeps steam voids out of the core, which adds reactivity, so power rises.
 *   Control rods are for large changes and for startup, and they enter from below.
 *   The bench kinetics (benchStep.ts) already carry this: the BWR coolant coefficient
 *   stands in for voids, so more flow runs the core cooler and power climbs to a new
 *   rest point, with the delayed-neutron lag. This layer does not replace that power.
 * - Pebble outlet: Zhang et al., HTR-PM demonstration plant, Engineering (2016).
 *   Helium enters near 250 °C and leaves near 750 °C at full power. The outlet is
 *   inlet plus Q / (ṁ cp), so it rises with power and falls with blower flow. The
 *   game's thermal model (plant.ts thermalState) gives that number. Online refuelling
 *   discharges a pebble when its burnup is high enough. Helium does not boil, so there
 *   is no pressurizer.
 * - Salt drain: Haubenreich and Engel, Experience with the Molten-Salt Reactor
 *   Experiment, ORNL (also ORNL-TM-728, MSRE design). Thawing the freeze valve
 *   drains the fuel salt to the drain tank and fission heat in the vessel ends.
 * - βeff: the same MSRE operating reports. Delayed-neutron precursors circulate
 *   out of the core, so the effective delayed-neutron fraction is smaller than β.
 *   This layer only displays that. It does not change the sim's kinetics.
 */
import { thermalState } from "./plant";
import type { SiteKind } from "./plantLoops";

export interface OperatorMove {
  /** 0 is inserted, 100 is withdrawn. */
  rodsWithdrawnPct: number;
  /** Pump, recirc, or blower command, percent. */
  flowPct: number;
  /** Salt only. The freeze valve has been told to open. */
  drain: boolean;
  /** Seconds since the drain was ordered. */
  drainSeconds: number;
  /** Pebble only. Completed passes through the core. */
  passes: number;
}

export interface SimCommand {
  powerPct: number;
  flowPct: number;
  rodsWithdrawnPct: number;
  scram: boolean;
}

export interface SitePanel {
  title: string;
  lines: string[];
  /** 0 to 1. Pipe arrows in the hall and the cutaway. */
  flow: number;
  /** 0 to 1. Core glow. Helium and fuel salt stay at 0 so they are not drawn blue. */
  glow: number;
  /** A tripped or drained machine stops the arrows. */
  arrows: boolean;
  /** Mark on a steam-generator tube, or none. */
  tubeMark: boolean;
}

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

/** PWR: the bench already owns the numbers. This layer passes them through. */
export function pwrCommand(powerPct: number, move: OperatorMove, scram: boolean): SimCommand {
  return {
    powerPct: scram ? 0 : powerPct,
    flowPct: move.flowPct,
    rodsWithdrawnPct: move.rodsWithdrawnPct,
    scram,
  };
}

/** One pass through the pebble core. Burnup rises. High burnup discharges the pebble. */
export function pebblePass(burnupMWd: number): { burnupMWd: number; discharged: boolean } {
  const burnup = burnupMWd + 8;
  return { burnupMWd: burnup, discharged: burnup >= 90 };
}

/** Helium outlet, °C: inlet plus the rise the heat gives at this blower flow. */
export function pebbleOutletC(powerPct: number, flowPct: number): number {
  return Math.round(thermalState("pebble", { powerPct, flowPct }).tHot);
}

/**
 * Freeze valve. Frozen, then melting, then the level falls.
 * Fission heat in the vessel is zero once the salt has left.
 */
export function saltDrain(seconds: number): { plug: "frozen" | "melting" | "open"; level: number; fission: number } {
  if (seconds <= 0) return { plug: "frozen", level: 1, fission: 1 };
  if (seconds < 8) return { plug: "melting", level: 1, fission: 1 };
  const level = clamp(1 - (seconds - 8) / 20, 0, 1);
  return { plug: "open", level, fission: level < 0.05 ? 0 : level };
}

/** Display only. Precursors leave the core, so βeff is smaller than β. */
export function saltBetaEff(beta = 0.0065): { beta: number; betaEff: number } {
  return { beta, betaEff: Math.round(beta * 0.55 * 10000) / 10000 };
}

export function commandFor(kind: SiteKind, powerPct: number, move: OperatorMove, scram: boolean): SimCommand {
  if (kind === "msr" && move.drain) {
    const d = saltDrain(move.drainSeconds);
    return {
      powerPct: scram ? 0 : powerPct * d.fission,
      flowPct: d.fission === 0 ? 0 : move.flowPct,
      rodsWithdrawnPct: move.rodsWithdrawnPct,
      scram: scram || d.fission === 0,
    };
  }
  if (kind === "pebble" || kind === "bwr") {
    return {
      powerPct: scram ? 0 : powerPct,
      flowPct: move.flowPct,
      rodsWithdrawnPct: move.rodsWithdrawnPct,
      scram,
    };
  }
  return pwrCommand(powerPct, move, scram);
}

export function panelFor(kind: SiteKind, move: OperatorMove, sim: SimCommand, burnupMWd = 0): SitePanel {
  const flow = sim.scram ? 0 : clamp(sim.flowPct / 100, 0, 1.4);
  const glow = kind === "pwr" || kind === "bwr" ? (sim.scram ? 0.05 : clamp(sim.powerPct / 100, 0, 1)) : 0;
  if (kind === "bwr") {
    return {
      title: "Recirc",
      lines: [
        `Recirc ${move.flowPct.toFixed(0)}%`,
        `Rods from below ${move.rodsWithdrawnPct.toFixed(0)}% out`,
        `Power ${sim.powerPct.toFixed(0)}%`,
      ],
      flow,
      glow,
      arrows: flow > 0.02 && !sim.scram,
      tubeMark: false,
    };
  }
  if (kind === "pebble") {
    const pass = pebblePass(burnupMWd);
    return {
      title: "Helium",
      lines: [
        `Blower ${move.flowPct.toFixed(0)}%`,
        `Outlet ${pebbleOutletC(sim.powerPct, sim.flowPct)} °C`,
        `Passes ${move.passes}`,
        pass.discharged ? "Pebble discharged" : `Burnup ${burnupMWd.toFixed(0)} MWd/kg`,
      ],
      flow,
      glow: 0,
      arrows: flow > 0.02 && !sim.scram,
      tubeMark: false,
    };
  }
  if (kind === "msr") {
    const d = saltDrain(move.drain ? move.drainSeconds : 0);
    const b = saltBetaEff();
    return {
      title: "Salt",
      lines: [
        `Pump ${move.flowPct.toFixed(0)}%`,
        `Plug ${d.plug}`,
        `Salt level ${(d.level * 100).toFixed(0)}%`,
        `β ${b.beta.toFixed(4)}  βeff ${b.betaEff.toFixed(4)}`,
        d.fission === 0 ? "Fission heat ended" : `Fission heat ${(d.fission * 100).toFixed(0)}%`,
      ],
      flow: d.fission === 0 ? 0 : flow,
      glow: 0,
      arrows: d.fission > 0 && flow > 0.02 && !sim.scram,
      tubeMark: false,
    };
  }
  return {
    title: "PWR",
    lines: [`Rods ${move.rodsWithdrawnPct.toFixed(0)}% out`, `Flow ${move.flowPct.toFixed(0)}%`, `Power ${sim.powerPct.toFixed(0)}%`],
    flow,
    glow,
    arrows: flow > 0.02 && !sim.scram,
    tubeMark: false,
  };
}

/** What the bench step decided this frame, before the site layer. */
export interface BenchOutcome {
  power: number;
  hold: number;
  scram: boolean;
  passed: boolean;
  msg: string | null;
}

export interface SiteOutcome extends BenchOutcome {
  /** Salt only. The fuel has left the core. */
  drained: boolean;
}

/** Shown when the drain finishes. Listed for the owner in docs/decisions-pending.md. */
export const DRAINED_MSG = "Fuel salt drained. Fission stopped. Decay heat goes to the drain tank. Teaching only.";

/**
 * One frame, after the bench kinetics. Every reader (band hold, panel, shared run) uses the power this returns.
 * - PWR, BWR, pebble: the bench decides. BWR recirc already moves power through the bench's void feedback.
 * - Salt with the freeze valve ordered open: this is a shutdown, so the band hold stops counting and cannot
 *   pass. Fission heat in the vessel falls with the salt level. When the salt is gone, the run ends as a scram.
 */
export function siteStep(kind: SiteKind, bench: BenchOutcome, move: OperatorMove): SiteOutcome {
  if (bench.scram || kind !== "msr" || !move.drain) return { ...bench, drained: false };
  const d = saltDrain(move.drainSeconds);
  if (d.fission === 0) {
    return { power: 0, hold: 0, scram: true, passed: false, msg: DRAINED_MSG, drained: true };
  }
  return { power: bench.power * d.fission, hold: 0, scram: false, passed: false, msg: null, drained: false };
}
