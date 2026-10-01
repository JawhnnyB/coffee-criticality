"use client";

import { linearHeat, pressureMPa, type PlantDesign, type PlantType } from "./plant";
import { TeachReadout } from "./TeachFrame";

const COPY: Record<PlantType, string> = {
  pwr: "Hot core is Cherenkov blue. Cool core is stainless. Pipes are pipes. Teaching only — not a license.",
  bwr: "Boils in the vessel. Separators and dryer above. Steam to the turbine — no SG. Rods from below. ~7 MPa. Not a license.",
  pebble: "Helium down through a packed pebble bed. Graphite reflector. TRISO is the onion. Pebbles recirculate. Not a license.",
  msr: "Fuel is the salt in graphite channels. Pump, heat exchanger, freeze plug, drain tank. Near-atm. Xenon leaves in the off-gas. Not a license.",
};

const LEGEND: Record<PlantType, string[]> = {
  pwr: ["CRDMs on the head", "Hot leg → steam generator", "Cold leg · downcomer", "~16 MPa liquid"],
  bwr: ["Boils in the vessel", "Rods from below", "No steam generator", "~7 MPa"],
  pebble: ["Helium courier", "Packed pebbles", "Graphite reflector", "TRISO onion"],
  msr: ["Fuel is the salt", "Graphite channels", "Freeze plug / drain", "Near-atm"],
};

const SITE: Record<PlantType, string> = {
  pwr: "PWR — this site",
  bwr: "BWR — comparison",
  pebble: "Pebble / TRISO — comparison",
  msr: "MSR / salt — comparison",
};

/** Classroom: ΔT in the hold band means the core is making heat. */
export function coreIsHot(plant: PlantDesign) {
  if (plant.type === "bwr") return plant.dT >= 8;
  if (plant.type === "pebble") return plant.dT >= 120;
  if (plant.type === "msr") return plant.dT >= 35;
  return plant.dT >= 22 && plant.flow >= 70;
}

export function cutawayStill(type: PlantType, hot = true) {
  if (type === "pwr") return "/art/gen/stills/plate_pwr.png?v=gauge";
  if (type === "bwr") return "/art/gen/stills/plate_bwr.png?v=gauge";
  if (type === "pebble") return "/art/gen/stills/plate_pebble.png?v=metal";
  return "/art/gen/stills/plate_msr.png?v=metal";
}

export function cutawayVideo(type: PlantType, hot = true) {
  if (type === "pwr" && !hot) return "/art/gen/video/pwr_cool.mp4?v=cherenkov";
  return `/art/gen/video/${type}.mp4?v=cherenkov`;
}

export function CutawayLoop({
  type,
  hot = true,
  className = "aspect-video w-full object-contain teach-pixel",
}: {
  type: PlantType;
  hot?: boolean;
  className?: string;
}) {
  return (
    <img
      src={cutawayStill(type, hot)}
      alt=""
      className={className}
      style={{ imageRendering: "pixelated" }}
    />
  );
}

export function PlantHud({ plant }: { plant: PlantDesign }) {
  const p = pressureMPa(plant);
  const q = linearHeat(plant);
  const hot = coreIsHot(plant);
  return (
    <div className="teach-ink" data-testid="plant-hud">
      <p className="teach-kicker">This site · {SITE[plant.type]} · teaching only</p>
      <CutawayLoop type={plant.type} hot={hot} className="mt-2 aspect-video w-full object-contain teach-pixel" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <TeachReadout k="ΔT" v={`${plant.dT} °C`} />
        <TeachReadout k="Flow" v={`${plant.flow} %`} />
        <TeachReadout k="P" v={`${p.toFixed(1)} MPa`} />
        <TeachReadout
          k={plant.type === "pebble" || plant.type === "msr" ? "q" : "q′"}
          v={`${q}${plant.type === "pwr" || plant.type === "bwr" ? " kW/m" : ""}`}
        />
      </div>
      <p className="teach-kicker mt-3">Why this drawing</p>
      <ul className="mt-1 space-y-0.5 font-mono text-[12px] leading-relaxed text-[#f3e6d0]">
        {LEGEND[plant.type].map((line) => (
          <li key={line}>· {line}</li>
        ))}
      </ul>
      <p className="mt-2 text-[12px] leading-relaxed text-[#b5a48c]">
        {plant.type === "pwr" ? (hot ? "Core HOT — Cherenkov blue. " : "Core COOL — stainless. ") : null}
        {COPY[plant.type]}
      </p>
    </div>
  );
}
