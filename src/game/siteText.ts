/**
 * Every line that changes with the reactor this site is.
 * PWR strings are the lines that were already on the floor. Do not paraphrase them.
 * The owner rewrites the other three columns in this file.
 */
import type { SiteKind } from "./plantLoops";

export type SiteLineKey =
  | "heatLeaves"
  | "windowReactor"
  | "loopHeader"
  | "loopCaption"
  | "anatomy"
  | "fluids"
  | "vesselPlain"
  | "coolantStepPwr"
  | "steamPath"
  | "fastSalt"
  | "hallFloor"
  | "vesselNames"
  | "whyThermal"
  | "voidStep";

export const SITE_TEXT: Record<SiteKind, Record<SiteLineKey, string>> = {
  pwr: {
    whyThermal: "It is why this site is a PWR and not a fast reactor, and why steam in a BWR is not just a heat story. The thing that carries heat is also the thing that slows neutrons. One law.",
    voidStep: "BWR void is the same sentence in steam. This site is a PWR. Void is not a knob here.",
    heatLeaves:
      "On this site (PWR): Q = ṁ × cp × ΔT. Cold leg in, downcomer down, core up, hot leg out. Primary stays liquid at ~16 MPa classroom. Teaching model — not a license.",
    windowReactor: "The vessel has names. CRDMs from above.",
    loopHeader: "PRIMARY LOOP  ·  PWR  ·  teaching only",
    loopCaption:
      "Vessel. Core. Hot leg. SG. PZR. RCP. Cold leg · downcomer. Q = ṁ × cp × ΔT. ~16 MPa liquid. CRDM from above. Not a license.",
    anatomy:
      "Reactor pressure vessel — thick steel, ~16 MPa classroom\nCRDMs on the head — rods from above\nDowncomer annulus · core barrel · fuel assemblies\nHot leg · steam generator U-tubes (heat leaves here)\nCold leg · reactor coolant pump\nPressurizer — keeps the primary from boiling",
    fluids:
      "IN cold leg → downcomer → lower plenum → core up → OUT hot leg → steam generator. PWR classroom ~16 MPa, liquid. BWR boils in-vessel instead. Teaching only.",
    vesselPlain:
      "The reactor pressure vessel is steel thick enough to hold the courier at temperature and pressure. Low-alloy carbon steel, stainless-clad on the wet face (a few millimetres — corrosion, not strength). Coolant hits the core barrel, down the downcomer, up the fuel, out the hot-leg nozzle. That path is the loop. Fast neutrons embrittle the beltline; plants treat the tank as irreplaceable. We draw a teaching cutaway. Not a license drawing. You do not walk into it.",
    coolantStepPwr: "PWR: keep it liquid. Pressure is a promise.",
    steamPath:
      "Fragments dump kinetic energy as heat in the pellet. That heat has to reach the clad, then the water, then the steam generator. Q = ṁ cp ΔT still applies.",
    fastSalt: "Fuel dissolved in fluoride salt. Compact pool. Freeze plug if circulating. Teaching only.",
    hallFloor: "CRDMs on the head. Insulated legs. Polar crane. Teaching only.",
    vesselNames:
      "A PWR pressure vessel holds the fuel, the water, and the control rods. Inlet nozzle, core barrel, downcomer, lower plenum, fuel, upper internals, outlet nozzle. Not a design basis.",
  },
  bwr: {
    whyThermal: "It is why this site is a thermal BWR and not a fast reactor, and why steam in this core is not just a heat story. The thing that carries heat is also the thing that slows neutrons. One law.",
    voidStep: "BWR void is the same sentence in steam. This site is a BWR. Void is the knob here: recirc flow sweeps voids out, k rises, power follows.",
    heatLeaves:
      "On this site (BWR): the core boils. Recirc flow sets the voids. Steam goes up the risers and out to the turbine. No steam generator. Rods come in from below. ~7 MPa classroom. Teaching model — not a license.",
    windowReactor: "The vessel has names. No CRDMs on the head. Rods from below.",
    loopHeader: "PRIMARY LOOP  ·  BWR  ·  teaching only",
    loopCaption:
      "Vessel. Core. Steam to the turbine. Feedwater back. No steam generator. No pressurizer. Rods from below. Not a license.",
    anatomy:
      "Reactor vessel — boils inside, ~7 MPa classroom\nNo CRDMs on the head — rods from below\nSteam separators and dryers above the core\nMain steam line to the turbine\nFeedwater back to the downcomer\nRecirc pumps — the power knob in the power range",
    fluids:
      "Feedwater in → downcomer → core up, boiling → steam out the main steam line. No steam generator. Teaching only.",
    vesselPlain:
      "This tank is the boiler. Water goes up through the core and some of it becomes steam. There is no separate steam generator and no pressurizer. The rods enter from the bottom. Recirc flow changes how many voids sit in the core, and that is how the board moves power. Teaching cutaway. Not a license drawing.",
    coolantStepPwr: "BWR: let it boil. Recirc flow is the fine knob.",
    steamPath:
      "Heat leaves the clad into water that is allowed to boil. The steam is the product. It does not stop at a steam generator. Q uses the latent heat. Teaching only.",
    fastSalt: "Fuel dissolved in fluoride salt. Compact pool. Freeze plug if circulating. Teaching only.",
    hallFloor: "The core boils in the vessel. Rods from below. No steam generator. Teaching only.",
    vesselNames:
      "A BWR vessel holds the fuel and the water that boils in it. No CRDMs on the head. Rods from below. Steam out the top, feedwater back. Not a design basis.",
  },
  pebble: {
    whyThermal: "It is why this site is thermal: graphite slows the neutrons, and helium only carries the heat. Change the courier and this term barely moves. Change the graphite and it does.",
    voidStep: "BWR void is the same sentence in steam. This site is a pebble bed. Helium has no void and barely moderates. The graphite's own temperature carries the feedback here.",
    heatLeaves:
      "On this site (pebble bed): helium carries the heat. Blower speed is the flow. Core outlet near 750 °C at full power. No boiling. No pressurizer. Pebbles pass through and leave when their burnup is high enough. Teaching model — not a license.",
    windowReactor: "The vessel has names. A ring of rod drives. A pebble tube. Helium, not water.",
    loopHeader: "PRIMARY LOOP  ·  PEBBLE  ·  teaching only",
    loopCaption:
      "Vessel. Pebble core. Hot gas duct. Steam generator on the helium side. Cold helium back. Blower. No pressurizer. Not a license.",
    anatomy:
      "Steel vessel — helium, a few MPa, not a water boiler\nRod drives in the side reflector\nPebble loading tube and discharge line\nHot gas duct out, near 750 °C\nSteam generator on the secondary side of the helium\nBlower — the flow you can walk to",
    fluids:
      "Cold helium in at the top → down through the pebbles → hot gas duct out. No downcomer full of water. No pressurizer. Teaching only.",
    vesselPlain:
      "The vessel holds pebbles and helium. Helium does not boil, so there is no pressurizer and no water downcomer. The blower pushes the gas. Outlet temperature is the number the steam generator sees, near 750 °C on this teaching plant. You do not walk into it.",
    coolantStepPwr: "Pebble: helium. The blower is the flow. It does not boil.",
    steamPath:
      "Heat leaves the TRISO layers into helium. The helium carries it to the steam generator. There is no hot-leg pipe full of water. Teaching only.",
    fastSalt: "Fuel dissolved in fluoride salt. Compact pool. Freeze plug if circulating. Teaching only.",
    hallFloor: "Helium and pebbles. No boiling. Outlet near 750 °C. Teaching only.",
    vesselNames:
      "A pebble vessel holds pebbles and helium. Rod drives sit in the side reflector. A loading tube and a discharge line. No water downcomer. Not a design basis.",
  },
  msr: {
    whyThermal: "It is why this site is thermal: graphite in the core slows the neutrons, and the salt carries both the fuel and the heat. A fast salt reactor leaves the graphite out on purpose.",
    voidStep: "BWR void is the same sentence in steam. This site is a salt reactor. The salt expands as it heats and pushes fuel out of the core. That is the fast feedback here.",
    heatLeaves:
      "On this site (salt): the fuel is in the salt. A pump moves it. Heat leaves in a heat exchanger, not a water downcomer. The emergency path is the freeze valve and the drain tank. Teaching model — not a license.",
    windowReactor: "The cell has names. Roof plugs. A freeze-valve hatch. No CRDM forest.",
    loopHeader: "PRIMARY LOOP  ·  SALT  ·  teaching only",
    loopCaption:
      "Core. Pump. Heat exchanger. Freeze valve. Drain tank. Fuel salt out and back. No pressurizer. Not a license.",
    anatomy:
      "Reactor vessel — fuel dissolved in salt, near atmospheric\nPump bowl under one roof plug\nHeat exchanger — heat leaves here\nFreeze valve on the drain line\nDrain tank below the cell\nOff-gas line — fission gas does not stay in the salt",
    fluids:
      "Fuel salt out of the core → pump → heat exchanger → back. The freeze valve is the drain, not a cold leg. Teaching only.",
    vesselPlain:
      "The vessel holds salt with the fuel already in it. There is no water downcomer and no pressurizer. A pump circulates the salt. If the freeze valve opens, the salt runs to the drain tank and the core stops making fission heat. Teaching cutaway. Not a license drawing.",
    coolantStepPwr: "Salt: the fuel moves. The pump is the flow. It does not boil.",
    steamPath:
      "Heat is born in the salt, not in a pellet stacked in a water core. The pump takes that salt to the heat exchanger. There is no steam generator on the fuel itself. Teaching only.",
    fastSalt:
      "Fuel dissolved in fluoride salt, the CNRS MSFR teaching card. Thorium blanket. Freeze plug if circulating. Not a chloride pool. Teaching only.",
    hallFloor: "Fuel salt, a pump, a freeze valve, a drain tank. No pressurizer. Teaching only.",
    vesselNames:
      "A salt vessel holds fuel already dissolved in the salt. Pump, heat exchanger, freeze valve, drain tank. No CRDM forest. Not a design basis.",
  },
};

export function siteLine(kind: SiteKind, key: SiteLineKey): string {
  return SITE_TEXT[kind][key];
}

export function anatomyLines(kind: SiteKind): string[] {
  return SITE_TEXT[kind].anatomy.split("\n");
}

/** Swap a stored PWR sentence for this site's line. Anything else is returned unchanged. */
export function speak(kind: SiteKind, text: string): string {
  const pwr = SITE_TEXT.pwr;
  if (text === pwr.vesselPlain) return siteLine(kind, "vesselPlain");
  if (text === pwr.coolantStepPwr) return siteLine(kind, "coolantStepPwr");
  if (text === pwr.steamPath) return siteLine(kind, "steamPath");
  if (text === pwr.heatLeaves) return siteLine(kind, "heatLeaves");
  if (text === pwr.windowReactor) return siteLine(kind, "windowReactor");
  if (text === pwr.fluids) return siteLine(kind, "fluids");
  if (text === pwr.hallFloor) return siteLine(kind, "hallFloor");
  if (text === pwr.whyThermal) return siteLine(kind, "whyThermal");
  if (text === pwr.voidStep) return siteLine(kind, "voidStep");
  return text;
}

/** The pause-map line for the reactor hall. Other rooms stay as written. */
export function hallBlurb(kind: SiteKind, room: string, written: string): string {
  if (room !== "reactor") return written;
  if (kind === "pwr") return written;
  if (kind === "bwr") return "Operating floor. The core boils. Rods from below. West to control, south to break and maint.";
  if (kind === "pebble") return "Operating floor. Helium and pebbles. Outlet near 750 °C. West to control, south to break and maint.";
  return "Operating floor. Fuel salt, pump, freeze valve. West to control, south to break and maint.";
}
