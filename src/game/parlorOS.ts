/**
 * Parlor OS: the name, the app registry, the seasons, and the rules for what is visible.
 * Pure data and pure functions. No React and no sim here, so the rules can be tested in node.
 */
import { PHONE_VIEW_W } from "./artScale";

/** The one place the placeholder name lives. Rename here. */
export const PARLOR_OS = "Parlor OS";

/** Below this width an app is full screen and the home grid replaces the desktop. */
export const PHONE_BREAKPOINT = PHONE_VIEW_W;

export const SEASONS = ["spring", "summer", "fall", "winter"] as const;
export type Season = (typeof SEASONS)[number];

export const STANCES = ["cautious", "steady", "bold"] as const;
export type Stance = (typeof STANCES)[number];

export const DEFAULT_SEASON: Season = "fall";
export const DEFAULT_STANCE: Stance = "steady";

export type ParticleKind = "rain" | "heat" | "leaves" | "snow";

/** Palette tokens only (src/game/palette.ts). Each season is CSS tokens plus one particle layer. */
export const SEASON_INFO: Record<
  Season,
  {
    label: string;
    particle: ParticleKind;
    /** Desktop wallpaper colour, the taskbar, and the window body. */
    wall: string;
    taskbar: string;
    window: string;
    /** Glow and accent that the season's particles use. */
    spark: string;
    /** Multiply tint for lot scenes, through the existing day-tint path in render.ts. */
    lotTint: string;
    /** One sentence for the setup screen. */
    change: string;
  }
> = {
  spring: {
    label: "Spring",
    particle: "rain",
    wall: "#3d5c66",
    taskbar: "#243840",
    window: "#f3e6d0",
    spark: "#8cb094",
    lotTint: "rgba(107,143,113,0.12)",
    change: "Rain on the window edges, leaf accents, the spring playlist, and a cool green lot tint.",
  },
  summer: {
    label: "Summer",
    particle: "heat",
    wall: "#c9a227",
    taskbar: "#785018",
    window: "#f3e6d0",
    spark: "#e8c450",
    lotTint: "rgba(201,162,39,0.14)",
    change: "Warm sun glare, heat shimmer off the taskbar, gold accents, the summer playlist, and a warm lot tint.",
  },
  fall: {
    label: "Fall",
    particle: "leaves",
    wall: "#6a4a32",
    taskbar: "#3a2818",
    window: "#f3e6d0",
    spark: "#e8a860",
    lotTint: "rgba(196,120,58,0.16)",
    change: "Leaves across the wallpaper, copper accents, the fall playlist, and an amber lot tint with long shadows.",
  },
  winter: {
    label: "Winter",
    particle: "snow",
    wall: "#243840",
    taskbar: "#16110d",
    window: "#f3e6d0",
    spark: "#f8f4ec",
    lotTint: "rgba(61,92,102,0.18)",
    change: "Slow snow, frost at the window corners, steel accents, the winter playlist, and a cool lot tint.",
  },
};

export const STANCE_INFO: Record<Stance, { label: string; change: string }> = {
  cautious: {
    label: "Cautious",
    change: "The news and the Academy's suggestions will lean toward safety and rules. Trust and culture do not change.",
  },
  steady: {
    label: "Steady",
    change: "The news and the Academy's suggestions stay balanced between safety and output. Trust and culture do not change.",
  },
  bold: {
    label: "Bold",
    change: "The news and the Academy's suggestions will lean toward output and efficiency. Trust and culture do not change.",
  },
};

/** The accents the player can pick. Palette only. */
export const ACCENTS = [
  { id: "copper", label: "Copper", hex: "#c4783a" },
  { id: "leaf", label: "Leaf", hex: "#6b8f71" },
  { id: "gold", label: "Gold", hex: "#c9a227" },
] as const;

/** Three text sizes, applied through one root scale variable. */
export const TEXT_SCALES = [
  { id: "small", label: "Small", value: 0.9 },
  { id: "medium", label: "Medium", value: 1 },
  { id: "large", label: "Large", value: 1.2 },
] as const;

export type AppKind = "static" | "sim" | "mini" | "placeholder";

export interface AppDef {
  id: AppId;
  title: string;
  /** Short label for the icon. Four characters at most. */
  short: string;
  kind: AppKind;
  /** The sim mode a sim or mini app runs in. */
  mode?: string;
  /** Hidden until the reactor is designed. */
  needsDesign?: boolean;
  /** Mini games appear only after their cabinet is found. */
  needsFound?: boolean;
  /** The line a placeholder shows. */
  note?: string;
}

export const APP_IDS = [
  "settings",
  "music",
  "design",
  "control",
  "academy",
  "news",
  "radiation",
  "nrc",
  "results",
  "coremap",
  "cam",
  "catch",
  "fish",
  "plot",
  "horde",
  "delay",
  "golf",
  "rods",
  "pebble",
  "bowl",
  "phys",
  "load",
  "lototo",
] as const;
export type AppId = (typeof APP_IDS)[number];

export const NOT_BUILT = "Not in this build.";

export const APPS: Record<AppId, AppDef> = {
  settings: { id: "settings", title: "Settings", short: "SET", kind: "static" },
  music: { id: "music", title: "Music", short: "MUS", kind: "static" },
  design: { id: "design", title: "Reactor Design", short: "DSN", kind: "static" },
  control: { id: "control", title: "Reactor Control", short: "CTL", kind: "sim", mode: "reactor", needsDesign: true },
  academy: { id: "academy", title: "Academy", short: "ACA", kind: "sim", mode: "academy" },
  news: { id: "news", title: "News", short: "NEW", kind: "static" },
  radiation: { id: "radiation", title: "Radiation", short: "RAD", kind: "static" },
  nrc: { id: "nrc", title: "NRC Regulations", short: "NRC", kind: "static" },
  results: { id: "results", title: "Results", short: "RES", kind: "static", needsDesign: true },
  coremap: { id: "coremap", title: "Core Map", short: "MAP", kind: "static", needsDesign: true },
  cam: { id: "cam", title: "CORE CAM", short: "CAM", kind: "static", needsDesign: true },
  catch: { id: "catch", title: "CATCH.CAB", short: "CAT", kind: "mini", mode: "arcade", needsFound: true },
  fish: { id: "fish", title: "FISH.CAB", short: "FSH", kind: "mini", mode: "fish", needsFound: true },
  plot: { id: "plot", title: "PLOT.CAB", short: "PLT", kind: "mini", mode: "plot", needsFound: true },
  horde: { id: "horde", title: "HORDE.CAB", short: "HRD", kind: "mini", mode: "horde", needsFound: true },
  delay: { id: "delay", title: "DELAY.CAB", short: "DLY", kind: "mini", mode: "delay", needsFound: true },
  golf: { id: "golf", title: "GOLF.CAB", short: "GLF", kind: "mini", mode: "golf", needsFound: true },
  rods: { id: "rods", title: "ROD.BANK", short: "ROD", kind: "mini", mode: "rods", needsFound: true },
  pebble: { id: "pebble", title: "PEBBLE.CAB", short: "PBL", kind: "mini", mode: "pebble", needsFound: true },
  bowl: { id: "bowl", title: "BOWL.CAB", short: "BWL", kind: "mini", mode: "bowl", needsFound: true },
  phys: { id: "phys", title: "PHYS.CAB", short: "PHY", kind: "mini", mode: "phys", needsFound: true },
  load: { id: "load", title: "LOAD.CAB", short: "LOD", kind: "mini", mode: "load", needsFound: true },
  lototo: { id: "lototo", title: "LOTOTO", short: "LOT", kind: "mini", mode: "maint", needsFound: true },
};

/** The desktop's first icons, before the player pins anything. */
export const DEFAULT_PINNED: AppId[] = ["design", "academy", "music", "settings"];

/** The room flag that means "the parlor, and its cabinets, have been found". Same flag the world already sets. */
export const CABINET_FOUND_FLAG = "seen:parlor";

/** Sim modes that run inside a desktop window. Mini games are the subset the key router treats as games. */
export const SIM_APP_MODES = ["reactor", "academy", "shuffle", ...APP_IDS.map((id) => APPS[id].mode).filter((m): m is string => !!m)];
export const MINI_MODES = APP_IDS.map((id) => APPS[id]).filter((a) => a.kind === "mini").map((a) => a.mode as string);

export interface VisibilityInput {
  hasPlant: boolean;
  foundCabinets: boolean;
  /** Settings "Show all apps". Honoured only in a dev build. */
  showAll: boolean;
}

/** Which apps the start menu and the home grid show. Rules are in the spec, section 4.4 and phase 1 item 15. */
export function visibleApps(input: VisibilityInput): AppDef[] {
  return APP_IDS.map((id) => APPS[id]).filter((app) => {
    if (input.showAll) return true;
    if (app.needsDesign && !input.hasPlant) return false;
    if (app.needsFound && !input.foundCabinets) return false;
    return true;
  });
}

/** Pinned icons, in the player's order, limited to apps that are visible now. */
export function pinnedVisible(pinned: string[], input: VisibilityInput): AppDef[] {
  const shown = new Set(visibleApps(input).map((a) => a.id));
  return pinned.filter((id): id is AppId => (APP_IDS as readonly string[]).includes(id) && shown.has(id as AppId)).map((id) => APPS[id]);
}

/** Which registry app a sim mode belongs to, if any. */
export function appForMode(mode: string): AppDef | null {
  return APP_IDS.map((id) => APPS[id]).find((a) => a.mode === mode) ?? null;
}

export function seasonOrDefault(s: string | null | undefined): Season {
  return (SEASONS as readonly string[]).includes(s ?? "") ? (s as Season) : DEFAULT_SEASON;
}

export function stanceOrDefault(s: string | null | undefined): Stance {
  return (STANCES as readonly string[]).includes(s ?? "") ? (s as Stance) : DEFAULT_STANCE;
}

/** The theme follows the setup season, unless the player picked a season for the theme. */
export function themeSeason(followSeason: boolean, wallpaper: string, setupSeason: string | null): Season {
  if (followSeason) return seasonOrDefault(setupSeason);
  return (SEASONS as readonly string[]).includes(wallpaper) ? (wallpaper as Season) : seasonOrDefault(setupSeason);
}

/** The in-game clock. Minutes past midnight, in 12 or 24 hour form. */
export function clockText(minutes: number, clock24: boolean): string {
  const m = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, "0");
  if (clock24) return `${String(h).padStart(2, "0")}:${mm}`;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm} ${h < 12 ? "AM" : "PM"}`;
}

/** Region is not chosen in this build. Every region line says this. */
export const REGION_PENDING = "Pending verification";
