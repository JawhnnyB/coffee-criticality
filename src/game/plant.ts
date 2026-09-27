export type PlantType = "pwr" | "bwr" | "pebble" | "msr";
export type DesignScale = "rod" | "assembly" | "core";
export type CycleLabel = "F" | "1" | "2";

export interface ShuffleCell {
  i: number;
  j: number;
  cycle: CycleLabel;
}

export interface PlantDesign {
  type: PlantType;
  powerMW: number;
  dT: number;
  flow: number;
  enrich: number;
  fuelTempK: number;
  coolantTempK: number;
  fuelDensity: number;
  coolantDensity: number;
  scale: DesignScale;
  depletion: boolean;
  fullCore: boolean;
  reflector: boolean;
  burnupMWd_kg: number;
  sizeClass: 0 | 1 | 2;
  shuffleMap?: ShuffleCell[];
}

export const DEFAULT_PLANT: PlantDesign = {
  type: "pwr",
  powerMW: 1100,
  dT: 32,
  flow: 100,
  enrich: 4.5,
  fuelTempK: 900,
  coolantTempK: 580,
  fuelDensity: 10.97,
  coolantDensity: 0.7,
  scale: "rod",
  depletion: false,
  fullCore: false,
  reflector: false,
  burnupMWd_kg: 0,
  sizeClass: 1,
};

export function withTypeDefaults(p: PlantDesign, type: PlantType): PlantDesign {
  const next = { ...p, type };
  if (type === "bwr") {
    next.coolantDensity = 0.45;
    next.coolantTempK = 560;
    next.fuelTempK = 900;
    next.fuelDensity = 10.97;
    next.dT = 10;
    if (next.enrich > 5) next.enrich = 4.0;
  } else if (type === "pebble") {
    next.coolantDensity = 0.004;
    next.coolantTempK = 900;
    next.fuelTempK = 1200;
    next.fuelDensity = 10.97;
    next.dT = 200;
    if (next.enrich < 6) next.enrich = 8.5;
  } else if (type === "msr") {
    next.coolantDensity = 1.95;
    next.coolantTempK = 900;
    next.fuelTempK = 900;
    next.fuelDensity = 1.94;
    next.dT = 55;
    if (next.enrich > 7) next.enrich = 5.0;
  } else {
    next.coolantDensity = 0.7;
    next.coolantTempK = 580;
    next.fuelTempK = 900;
    next.fuelDensity = 10.97;
    next.dT = 32;
  }
  return next;
}

export function pressureMPa(p: PlantDesign) {
  if (p.type === "bwr") return 7.2;
  if (p.type === "pebble") return 6.0;
  if (p.type === "msr") return 0.1;
  return 15.5;
}

export function linearHeat(p: PlantDesign) {
  if (p.type === "pebble") return Math.round(p.powerMW * 0.004 * (p.enrich / 8.5) * 10) / 10;
  if (p.type === "msr") return Math.round(p.powerMW * 0.012 * 10) / 10;
  return Math.round((p.powerMW * 0.018 * (p.enrich / 4.5)) * 10) / 10;
}

export function courierName(p: PlantDesign) {
  if (p.type === "bwr") return "steam/water";
  if (p.type === "pebble") return "helium";
  if (p.type === "msr") return "fuel salt";
  return "liquid water";
}

export function plantTitle(p: PlantDesign) {
  const t =
    p.type === "pwr"
      ? "PWR"
      : p.type === "bwr"
        ? "BWR"
        : p.type === "pebble"
          ? "Pebble / TRISO"
          : "MSR / salt";
  return `${t}  ·  ${p.powerMW} MWe  ·  ΔT ${p.dT} °C  ·  ${pressureMPa(p).toFixed(1)} MPa  ·  ${courierName(p)}`;
}
