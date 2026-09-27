/** Locked Lake Master palette. People/props snap here. Photographs do not. */

export const PAL = {
  cream: "#f3e6d0",
  creamD: "#dcc8aa",
  muted: "#b5a48c",
  ash: "#8a7864",
  copper: "#c4783a",
  copperL: "#e8a860",
  copperD: "#8a4820",
  leaf: "#6b8f71",
  leafL: "#8cb094",
  leafD: "#3d5c44",
  ink: "#16110d",
  outline: "#1a1410",
  steel: "#3d5c66",
  steelL: "#5a7a84",
  steelD: "#243840",
  gold: "#c9a227",
  goldL: "#e8c450",
  goldD: "#785018",
  wood: "#6a4a32",
  woodMid: "#4a3424",
  woodDark: "#3a2818",
  woodL: "#8a6242",
  bad: "#b85c4a",
  badD: "#783028",
  wine: "#704060",
  sky: "#6a9aaa",
  skyDusk: "#5a4a58",
  white: "#f8f4ec",
  surface: "#2a221b",
  elevated: "#221c16",
  skin: "#e8c4a0",
  skin2: "#e0ba94",
  skinTan: "#c49468",
  skinBrown: "#a86c44",
  skinBlush: "#b46058",
} as const;

export type PalKey = keyof typeof PAL;

export const CAST_SKIN: Record<string, string> = {
  player: PAL.skin2,
  mabel: PAL.skin,
  holt: PAL.skin2,
  elena: PAL.skinTan,
  tommy: PAL.skinTan,
  marcus: PAL.skin2,
  priya: PAL.skinBrown,
  jordan: PAL.skinTan,
};

export const CAST_HAIR: Record<string, string> = {
  player: PAL.woodMid,
  mabel: "#c8c0b4",
  holt: "#9a9488",
  elena: PAL.outline,
  tommy: "#5a5048",
  marcus: "#7a3a28",
  priya: PAL.outline,
  jordan: "#6a4a28",
};

/** Warm flesh. Steel/navy never qualify. */
export function isWarmSkin(r: number, g: number, b: number, a = 255) {
  if (a < 80 || r < 78) return false;
  if (r <= b + 12) return false;
  if (r < g - 12) return false;
  if (g < b - 18) return false;
  if (Math.abs(r - g) < 16 && Math.abs(g - b) < 16) return false;
  return true;
}
