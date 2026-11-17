/**
 * What each plant is made of and where its fluids go. The cutaway drawings are painted from this,
 * and scripts/plant-loops.test.mjs checks the physics rules against it.
 *
 * Coordinates are pixels on a 320 x 180 picture. Pipes run only across and down.
 * Teaching drawings, not license drawings. One loop is drawn where a plant has several.
 *
 * Sources for the flow paths:
 * - PWR: NRC Westinghouse and EPR system descriptions. Hot leg from the vessel to the SG, crossover
 *   leg from the SG to the RCP suction, cold leg from the RCP to the vessel. Pressurizer on one hot leg
 *   by its surge line. Coolant goes down the downcomer and up through the core.
 * - BWR: NRC Reactor Concepts Manual. Direct cycle: steam from separators and dryers to the turbine,
 *   condenser, feed pumps, back to the vessel. Recirculation pumps drive jet pumps in the downcomer.
 * - Pebble bed: HTR-PM. Side-by-side reactor and SG joined by a hot gas duct. Helium blower on the SG.
 *   Cold helium rises in the side reflector and goes down through the pebble bed.
 * - MSR: MSRE. Fuel salt pump, shell-and-tube primary heat exchanger with fuel on the shell side,
 *   a second salt loop, drain tanks behind a freeze valve.
 * - MSFR: CNRS reference design. No graphite. Fuel salt up through an open cavity, back down through
 *   pumps and heat exchangers around it. Fertile blanket around the core. Draining tank below.
 * - FHR: Kairos KP-FHR. Pebbles float in FLiBe and are taken out at the top. FLiBe heats a nitrate
 *   salt loop, and the nitrate salt makes the steam.
 */

export type CutawayKind = "pwr" | "bwr" | "pebble" | "msr" | "msfr" | "fhr";

export type Medium = "water" | "helium" | "fuelSalt" | "flibe" | "nitrate";

export type CompKind =
  | "vessel"
  | "sg"
  | "pump"
  | "pressurizer"
  | "turbine"
  | "generator"
  | "condenser"
  | "hx"
  | "drain"
  | "blower";

export interface Comp {
  id: string;
  kind: CompKind;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** hot and cold are the same liquid or gas at two temperatures. steam is the vapour going to the turbine. */
export type PipeTemp = "hot" | "cold" | "steam";

export interface Pipe {
  id: string;
  loop: string;
  from: string;
  to: string;
  temp: PipeTemp;
  /** Corner points, from the `from` end to the `to` end. Every segment is horizontal or vertical. */
  pts: [number, number][];
}

/** A pipe that is not part of a circulating loop: the pressurizer surge line, a freeze valve, river water. */
export interface Branch {
  id: string;
  from: string;
  /** A component id, or "edge" for a pipe that leaves the picture. */
  to: string;
  medium: Medium;
  temp: PipeTemp;
  pts: [number, number][];
}

export interface Loop {
  id: string;
  medium: Medium;
  /** Components in flow order. The first and last are the same component: a loop closes. */
  path: string[];
}

export interface PlantDrawing {
  kind: CutawayKind;
  /** The fluid that touches the fuel. */
  coreMedium: Medium;
  /** Which way the coolant moves through the fuel. */
  coreFlow: "up" | "down";
  moderator: "water" | "graphite" | "none";
  comps: Comp[];
  pipes: Pipe[];
  branches: Branch[];
  loops: Loop[];
  /** The containment boundary, for the plants that draw one. */
  containment?: { x: number; y: number; w: number; h: number };
}

/** Media you can see through. Cherenkov light needs a clear medium with a refractive index well above 1. */
const CLEAR_LIQUID: Medium[] = ["water", "flibe"];

/**
 * Whether the core glows Cherenkov blue in the drawing.
 * Water and FLiBe are clear liquids. Helium's refractive index is so close to 1 that a beta
 * electron never outruns light in it. Fuel salt carries the fuel and its fission products, so it is
 * drawn hot rather than blue. A cool core is drawn without the glow, as the game's own copy says.
 */
export function cherenkov(plant: PlantDrawing, hot: boolean): boolean {
  return hot && CLEAR_LIQUID.includes(plant.coreMedium);
}

// The steam cycle is the same block on every plant, on the right of the picture.
const BOP: Comp[] = [
  { id: "turbine", kind: "turbine", x: 214, y: 18, w: 50, h: 30 },
  { id: "generator", kind: "generator", x: 270, y: 22, w: 34, h: 22 },
  { id: "condenser", kind: "condenser", x: 214, y: 66, w: 58, h: 38 },
  { id: "fwpump", kind: "pump", x: 234, y: 120, w: 18, h: 18 },
];

const BOP_PIPES: Pipe[] = [
  { id: "exhaust", loop: "steam", from: "turbine", to: "condenser", temp: "steam", pts: [[239, 48], [239, 66]] },
  { id: "condensate", loop: "steam", from: "condenser", to: "fwpump", temp: "cold", pts: [[243, 104], [243, 120]] },
];

const RIVER: Branch[] = [
  { id: "river-in", from: "condenser", to: "edge", medium: "water", temp: "cold", pts: [[272, 76], [318, 76]] },
  { id: "river-out", from: "condenser", to: "edge", medium: "water", temp: "cold", pts: [[272, 94], [318, 94]] },
];

const STEAM_LOOP = (from: string): Loop => ({ id: "steam", medium: "water", path: [from, "turbine", "condenser", "fwpump", from] });

const PWR: PlantDrawing = {
  kind: "pwr",
  coreMedium: "water",
  coreFlow: "up",
  moderator: "water",
  containment: { x: 6, y: 4, w: 184, h: 170 },
  comps: [
    { id: "vessel", kind: "vessel", x: 20, y: 30, w: 42, h: 122 },
    { id: "pzr", kind: "pressurizer", x: 76, y: 14, w: 16, h: 46 },
    { id: "sg", kind: "sg", x: 104, y: 16, w: 34, h: 70 },
    { id: "rcp", kind: "pump", x: 88, y: 122, w: 20, h: 20 },
    ...BOP,
  ],
  pipes: [
    { id: "hot-leg", loop: "primary", from: "vessel", to: "sg", temp: "hot", pts: [[62, 78], [104, 78]] },
    { id: "crossover", loop: "primary", from: "sg", to: "rcp", temp: "cold", pts: [[128, 86], [128, 154], [98, 154], [98, 142]] },
    { id: "cold-leg", loop: "primary", from: "rcp", to: "vessel", temp: "cold", pts: [[88, 132], [72, 132], [72, 86], [62, 86]] },
    { id: "steam-line", loop: "steam", from: "sg", to: "turbine", temp: "steam", pts: [[121, 16], [121, 6], [222, 6], [222, 18]] },
    ...BOP_PIPES,
    { id: "feedwater", loop: "steam", from: "fwpump", to: "sg", temp: "cold", pts: [[234, 129], [160, 129], [160, 50], [138, 50]] },
  ],
  branches: [{ id: "surge", from: "pzr", to: "hot-leg", medium: "water", temp: "hot", pts: [[84, 60], [84, 76]] }, ...RIVER],
  loops: [{ id: "primary", medium: "water", path: ["vessel", "sg", "rcp", "vessel"] }, STEAM_LOOP("sg")],
};

const BWR: PlantDrawing = {
  kind: "bwr",
  coreMedium: "water",
  coreFlow: "up",
  moderator: "water",
  containment: { x: 6, y: 14, w: 150, h: 160 },
  comps: [
    { id: "vessel", kind: "vessel", x: 30, y: 26, w: 56, h: 128 },
    { id: "recirc", kind: "pump", x: 108, y: 128, w: 20, h: 20 },
    ...BOP,
  ],
  pipes: [
    { id: "main-steam", loop: "steam", from: "vessel", to: "turbine", temp: "steam", pts: [[86, 44], [180, 44], [180, 6], [222, 6], [222, 18]] },
    ...BOP_PIPES,
    { id: "feedwater", loop: "steam", from: "fwpump", to: "vessel", temp: "cold", pts: [[234, 129], [140, 129], [140, 74], [86, 74]] },
    { id: "recirc-suction", loop: "recirc", from: "vessel", to: "recirc", temp: "cold", pts: [[86, 112], [118, 112], [118, 128]] },
    { id: "recirc-drive", loop: "recirc", from: "recirc", to: "vessel", temp: "cold", pts: [[118, 148], [118, 160], [96, 160], [96, 140], [86, 140]] },
  ],
  branches: [...RIVER],
  loops: [
    { id: "steam", medium: "water", path: ["vessel", "turbine", "condenser", "fwpump", "vessel"] },
    { id: "recirc", medium: "water", path: ["vessel", "recirc", "vessel"] },
  ],
};

const PEBBLE: PlantDrawing = {
  kind: "pebble",
  coreMedium: "helium",
  coreFlow: "down",
  moderator: "graphite",
  comps: [
    { id: "vessel", kind: "vessel", x: 18, y: 22, w: 50, h: 136 },
    { id: "sg", kind: "sg", x: 116, y: 34, w: 36, h: 116 },
    { id: "blower", kind: "blower", x: 122, y: 14, w: 24, h: 20 },
    ...BOP,
  ],
  pipes: [
    { id: "hot-duct", loop: "primary", from: "vessel", to: "sg", temp: "hot", pts: [[68, 142], [116, 142]] },
    { id: "sg-to-blower", loop: "primary", from: "sg", to: "blower", temp: "cold", pts: [[134, 34], [134, 34]] },
    { id: "cold-duct", loop: "primary", from: "blower", to: "vessel", temp: "cold", pts: [[122, 24], [96, 24], [96, 130], [68, 130]] },
    { id: "steam-line", loop: "steam", from: "sg", to: "turbine", temp: "steam", pts: [[152, 50], [190, 50], [190, 6], [222, 6], [222, 18]] },
    ...BOP_PIPES,
    { id: "feedwater", loop: "steam", from: "fwpump", to: "sg", temp: "cold", pts: [[234, 129], [170, 129], [170, 120], [152, 120]] },
  ],
  branches: [...RIVER],
  loops: [{ id: "primary", medium: "helium", path: ["vessel", "sg", "blower", "vessel"] }, STEAM_LOOP("sg")],
};

const MSR: PlantDrawing = {
  kind: "msr",
  coreMedium: "fuelSalt",
  coreFlow: "up",
  moderator: "graphite",
  comps: [
    { id: "vessel", kind: "vessel", x: 16, y: 38, w: 42, h: 92 },
    { id: "drain", kind: "drain", x: 14, y: 150, w: 46, h: 22 },
    { id: "fuelpump", kind: "pump", x: 64, y: 14, w: 20, h: 20 },
    { id: "phx", kind: "hx", x: 82, y: 64, w: 50, h: 22 },
    { id: "coolpump", kind: "pump", x: 140, y: 14, w: 20, h: 20 },
    { id: "sg", kind: "sg", x: 166, y: 40, w: 30, h: 100 },
    ...BOP,
  ],
  pipes: [
    { id: "fuel-out", loop: "fuel", from: "vessel", to: "fuelpump", temp: "hot", pts: [[37, 38], [37, 24], [64, 24]] },
    { id: "fuel-to-phx", loop: "fuel", from: "fuelpump", to: "phx", temp: "hot", pts: [[74, 34], [74, 75], [82, 75]] },
    { id: "fuel-return", loop: "fuel", from: "phx", to: "vessel", temp: "cold", pts: [[107, 86], [107, 118], [58, 118]] },
    { id: "salt-hot", loop: "coolant", from: "phx", to: "coolpump", temp: "hot", pts: [[132, 70], [150, 70], [150, 34]] },
    { id: "salt-to-sg", loop: "coolant", from: "coolpump", to: "sg", temp: "hot", pts: [[160, 24], [181, 24], [181, 40]] },
    { id: "salt-cold", loop: "coolant", from: "sg", to: "phx", temp: "cold", pts: [[181, 140], [181, 150], [124, 150], [124, 86]] },
    { id: "steam-line", loop: "steam", from: "sg", to: "turbine", temp: "steam", pts: [[196, 52], [204, 52], [204, 6], [222, 6], [222, 18]] },
    ...BOP_PIPES,
    { id: "feedwater", loop: "steam", from: "fwpump", to: "sg", temp: "cold", pts: [[234, 129], [196, 129]] },
  ],
  branches: [{ id: "freeze-valve", from: "vessel", to: "drain", medium: "fuelSalt", temp: "cold", pts: [[37, 130], [37, 150]] }, ...RIVER],
  loops: [
    { id: "fuel", medium: "fuelSalt", path: ["vessel", "fuelpump", "phx", "vessel"] },
    { id: "coolant", medium: "flibe", path: ["phx", "coolpump", "sg", "phx"] },
    STEAM_LOOP("sg"),
  ],
};

const MSFR: PlantDrawing = {
  kind: "msfr",
  coreMedium: "fuelSalt",
  coreFlow: "up",
  moderator: "none",
  comps: [
    { id: "vessel", kind: "vessel", x: 14, y: 30, w: 58, h: 96 },
    { id: "drain", kind: "drain", x: 20, y: 148, w: 46, h: 24 },
    { id: "fuelpump", kind: "pump", x: 80, y: 14, w: 20, h: 20 },
    { id: "phx", kind: "hx", x: 92, y: 70, w: 22, h: 50 },
    { id: "intpump", kind: "pump", x: 132, y: 14, w: 20, h: 20 },
    { id: "sg", kind: "sg", x: 166, y: 40, w: 30, h: 100 },
    ...BOP,
  ],
  pipes: [
    { id: "fuel-out", loop: "fuel", from: "vessel", to: "fuelpump", temp: "hot", pts: [[43, 30], [43, 24], [80, 24]] },
    { id: "fuel-to-phx", loop: "fuel", from: "fuelpump", to: "phx", temp: "hot", pts: [[90, 34], [90, 52], [103, 52], [103, 70]] },
    { id: "fuel-return", loop: "fuel", from: "phx", to: "vessel", temp: "cold", pts: [[103, 120], [103, 134], [43, 134], [43, 126]] },
    { id: "salt-hot", loop: "intermediate", from: "phx", to: "intpump", temp: "hot", pts: [[114, 80], [142, 80], [142, 34]] },
    { id: "salt-to-sg", loop: "intermediate", from: "intpump", to: "sg", temp: "hot", pts: [[152, 24], [181, 24], [181, 40]] },
    { id: "salt-cold", loop: "intermediate", from: "sg", to: "phx", temp: "cold", pts: [[181, 140], [181, 150], [124, 150], [124, 110], [114, 110]] },
    { id: "steam-line", loop: "steam", from: "sg", to: "turbine", temp: "steam", pts: [[196, 52], [204, 52], [204, 6], [222, 6], [222, 18]] },
    ...BOP_PIPES,
    { id: "feedwater", loop: "steam", from: "fwpump", to: "sg", temp: "cold", pts: [[234, 129], [196, 129]] },
  ],
  branches: [{ id: "drain-line", from: "vessel", to: "drain", medium: "fuelSalt", temp: "cold", pts: [[34, 126], [34, 148]] }, ...RIVER],
  loops: [
    { id: "fuel", medium: "fuelSalt", path: ["vessel", "fuelpump", "phx", "vessel"] },
    { id: "intermediate", medium: "flibe", path: ["phx", "intpump", "sg", "phx"] },
    STEAM_LOOP("sg"),
  ],
};

const FHR: PlantDrawing = {
  kind: "fhr",
  coreMedium: "flibe",
  coreFlow: "up",
  moderator: "graphite",
  comps: [
    { id: "vessel", kind: "vessel", x: 16, y: 34, w: 48, h: 120 },
    { id: "primpump", kind: "pump", x: 70, y: 14, w: 20, h: 20 },
    { id: "ihx", kind: "hx", x: 86, y: 64, w: 22, h: 52 },
    { id: "intpump", kind: "pump", x: 132, y: 14, w: 20, h: 20 },
    { id: "sg", kind: "sg", x: 166, y: 40, w: 30, h: 100 },
    ...BOP,
  ],
  pipes: [
    { id: "flibe-out", loop: "primary", from: "vessel", to: "primpump", temp: "hot", pts: [[52, 34], [52, 24], [70, 24]] },
    { id: "flibe-to-ihx", loop: "primary", from: "primpump", to: "ihx", temp: "hot", pts: [[80, 34], [80, 50], [97, 50], [97, 64]] },
    { id: "flibe-return", loop: "primary", from: "ihx", to: "vessel", temp: "cold", pts: [[97, 116], [97, 140], [64, 140]] },
    { id: "nitrate-hot", loop: "intermediate", from: "ihx", to: "intpump", temp: "hot", pts: [[108, 74], [142, 74], [142, 34]] },
    { id: "nitrate-to-sg", loop: "intermediate", from: "intpump", to: "sg", temp: "hot", pts: [[152, 24], [181, 24], [181, 40]] },
    { id: "nitrate-cold", loop: "intermediate", from: "sg", to: "ihx", temp: "cold", pts: [[181, 140], [181, 150], [124, 150], [124, 106], [108, 106]] },
    { id: "steam-line", loop: "steam", from: "sg", to: "turbine", temp: "steam", pts: [[196, 52], [204, 52], [204, 6], [222, 6], [222, 18]] },
    ...BOP_PIPES,
    { id: "feedwater", loop: "steam", from: "fwpump", to: "sg", temp: "cold", pts: [[234, 129], [196, 129]] },
  ],
  branches: [...RIVER],
  loops: [
    { id: "primary", medium: "flibe", path: ["vessel", "primpump", "ihx", "vessel"] },
    { id: "intermediate", medium: "nitrate", path: ["ihx", "intpump", "sg", "ihx"] },
    STEAM_LOOP("sg"),
  ],
};

export const PLANTS: Record<CutawayKind, PlantDrawing> = { pwr: PWR, bwr: BWR, pebble: PEBBLE, msr: MSR, msfr: MSFR, fhr: FHR };

/** The plant this site runs: the type picked in Reactor Design, or a PWR before one is picked. */
export function siteKind(plant: { type: "pwr" | "bwr" | "pebble" | "msr" } | null | undefined): CutawayKind {
  return plant?.type ?? "pwr";
}

export const CUTAWAY_W = 320;
export const CUTAWAY_H = 180;
