import { PAL } from "./palette";

/** Native pixel sizes. Person 32×64 (2×4 tiles). Props sized to the kettle ruler. */
export const WALK_W = 32;
export const WALK_H = 64;
export const WINDOW_W = 48;
export const WINDOW_H = 32;
export const RAIL_H = 8;
export const HEART = 8;
export const DEBUG_ART = false;

export type HoodieId = "copper" | "leaf" | "steel" | "gold";
export type HairId = "brown" | "ink" | "silver" | "copper";
export interface PlayerLook {
  hoodie: HoodieId;
  hair: HairId;
  glasses: boolean;
}
export const DEFAULT_PLAYER_LOOK: PlayerLook = { hoodie: "copper", hair: "brown", glasses: true };
export const HOODIE_HEX: Record<HoodieId, string> = {
  copper: PAL.copper,
  leaf: PAL.leaf,
  steel: PAL.steel,
  gold: PAL.gold,
};
export const HAIR_HEX: Record<HairId, string> = {
  brown: PAL.woodMid,
  ink: PAL.outline,
  silver: "#c8c0b4",
  copper: PAL.copperD,
};

export const PROP_NATIVE: Record<string, { w: number; h: number }> = {
  counter: { w: 80, h: 48 },
  chair: { w: 16, h: 24 },
  bench: { w: 48, h: 24 },
  arcade: { w: 32, h: 48 },
  cab_catch: { w: 32, h: 48 },
  cab_delay: { w: 32, h: 48 },
  cab_rods: { w: 32, h: 48 },
  cab_load: { w: 32, h: 48 },
  cab_phys: { w: 32, h: 48 },
  cab_pebble: { w: 32, h: 48 },
  cab_fish: { w: 32, h: 48 },
  cab_golf: { w: 32, h: 48 },
  cab_bowl: { w: 32, h: 48 },
  cab_horde: { w: 32, h: 48 },
  cab_plot: { w: 32, h: 48 },
  cab_floor: { w: 32, h: 48 },
  plant: { w: 16, h: 24 },
  rug: { w: 80, h: 48 },
  van: { w: 96, h: 48 },
  desk: { w: 48, h: 24 },
  console: { w: 48, h: 24 },
  cabinet: { w: 24, h: 32 },
  core: { w: 80, h: 80 },
  valve: { w: 16, h: 24 },
  pipe_h: { w: 32, h: 16 },
  pipe_v: { w: 16, h: 32 },
  pipe_corner: { w: 16, h: 16 },
  pipe_run: { w: 48, h: 16 },
  railing: { w: 48, h: 16 },
  crane: { w: 96, h: 16 },
  kettle: { w: 16, h: 16 },
  boom: { w: 16, h: 32 },
  poster: { w: 16, h: 24 },
  lamp: { w: 16, h: 32 },
  microwave: { w: 16, h: 16 },
  couch: { w: 48, h: 24 },
  vending: { w: 16, h: 32 },
  board: { w: 80, h: 24 },
  dose: { w: 16, h: 16 },
  prints: { w: 16, h: 24 },
};

export function isTileSource(nw: number, nh: number, tile = 16) {
  return nw >= tile && nh >= tile && nw % tile === 0 && nh % tile === 0;
}

export function isWindowSource(nw: number, nh: number) {
  return nw > 0 && nh > 0 && nw % WINDOW_W === 0 && nh % WINDOW_H === 0 && nw / nh === WINDOW_W / WINDOW_H;
}
