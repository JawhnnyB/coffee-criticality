/**
 * Shift persistence.
 * Read cc.save.v1. Write cc.save.v2. A version 1 save is migrated in memory and is not overwritten.
 * Overlay modes collapse to play. Dialogue is never snapshotted.
 * Teaching plant is stored as JSON — not a license.
 */
import { ROOMS, emptyResidue, type NpcId, type Residue, type RoleId, type RoomId } from "./content";
import type { PlantDesign, RunState } from "./plant";
import { DEFAULT_PLANT, emptyRun } from "./plant";
import { sanitizeCoreMap } from "./coreMapMemory";
import { DEFAULT_PLAYER_LOOK, type PlayerLook } from "./artSpec";
import {
  defaultDesktop,
  defaultNews,
  defaultResults,
  defaultSetup,
  type DesktopSave,
  type GameState,
  type Mode,
  type NewsSave,
  type ParlorScores,
  type ResultsSave,
  type SetupSave,
} from "./sim";
import type { WeekLogEntry } from "./week";

export const SAVE_KEY = "cc.save.v1";
export const SAVE_KEY_V2 = "cc.save.v2";
/** Unreadable version 2 bytes. Kept so a bad save is not thrown away. */
export const SAVE_KEY_V2_CORRUPT = "cc.save.v2.corrupt";
export const SAVE_VERSION = 2;

const OVERLAY: Mode[] = [
  "dialogue",
  "incident",
  "academy",
  "arcade",
  "reactor",
  "still",
  "pause",
  "shuffle",
  "maint",
  "cabs",
  "fish",
  "plot",
  "floor",
  "horde",
  "delay",
  "golf",
  "rods",
  "pebble",
  "bowl",
  "phys",
  "load",
  "desktop",
  "setup",
];

export interface SaveV1 {
  version: 1;
  savedAt: number;
  mode: Mode;
  role: RoleId | null;
  playerName: string;
  playerLook?: PlayerLook;
  day: number;
  minutes: number;
  room: RoomId;
  x: number;
  y: number;
  facing: "left" | "right" | "up" | "down";
  culture: number;
  trust: Record<NpcId, number>;
  flags: Record<string, boolean>;
  plant: PlantDesign | null;
  catches: number;
  hides: number;
  reports: number;
  academyDone: boolean[];
  shuffleDone: boolean;
  maintDone: boolean;
  ended: "a" | "c" | null;
  incidentResolved: boolean;
  residue?: Residue;
  closePrompt: boolean;
  fq: number;
  stillsSeen: number;
  goals: { id: string; label: string; done: boolean }[];
  weekLog?: WeekLogEntry[];
  scores?: ParlorScores;
}

function persistMode(mode: Mode): Mode {
  if (OVERLAY.includes(mode)) return "play";
  if (mode === "splash" || mode === "menu" || mode === "how" || mode === "credits" || mode === "role") return "play";
  return mode;
}

/** Every Academy page is tier 1 until the tiers exist. The array lines up with academyDone. */
export function tiersFromDone(done: boolean[]): number[] {
  return done.map(() => 1);
}

export interface SaveV2 extends Omit<SaveV1, "version"> {
  version: 2;
  setup: SetupSave;
  run: RunState;
  desktop: DesktopSave;
  results: ResultsSave;
  news: NewsSave;
  academyTiers: number[];
  /** Set only while a v1 file is being read. snapshot does not write it. */
  migratedFrom?: 1;
}

export function snapshot(s: GameState): SaveV2 {
  return {
    version: 2,
    savedAt: Date.now(),
    mode: persistMode(s.mode),
    role: s.role,
    playerName: s.playerName,
    playerLook: s.playerLook,
    day: s.day,
    minutes: s.minutes,
    room: s.room,
    x: s.x,
    y: s.y,
    facing: s.facing,
    culture: s.culture,
    trust: { ...s.trust },
    flags: { ...s.flags },
    plant: s.plant ? ({ ...s.plant, shuffleMap: s.plant.shuffleMap ? s.plant.shuffleMap.map((c) => ({ ...c })) : undefined } satisfies PlantDesign) : null,
    catches: s.catches,
    hides: s.hides,
    reports: s.reports,
    academyDone: [...s.academyDone],
    academyTiers: [...s.academyTiers],
    shuffleDone: s.shuffleDone,
    maintDone: s.maintDone,
    ended: s.ended,
    incidentResolved: s.incidentResolved,
    residue: { ...s.residue },
    closePrompt: s.closePrompt,
    fq: s.fq,
    stillsSeen: s.stillsSeen,
    goals: s.goals.map((g) => ({ ...g })),
    weekLog: s.weekLog.map((e) => ({ ...e })),
    scores: { ...s.scores },
    setup: { ...s.setup },
    run: { ...s.run, history: s.run.history.map((h) => ({ ...h })) },
    desktop: { ...s.desktop, pinned: [...s.desktop.pinned] },
    results: {
      daily: [...s.results.daily],
      shuffleBest: s.results.shuffleBest,
      coreMap: s.results.coreMap ? { grid: [...s.results.coreMap.grid], swaps: s.results.coreMap.swaps } : null,
    },
    news: { seenIds: [...s.news.seenIds] },
  };
}

function parseV1(raw: unknown): SaveV1 | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as { version?: number };
  if (v.version !== 1) return null;
  const s = raw as SaveV1;
  if (!s.room || !s.playerName) return null;
  if (!s.plant) s.plant = null;
  else s.plant = { ...DEFAULT_PLANT, ...s.plant };
  return s;
}

/** A version 1 save becomes version 2 in memory. The v1 object is not the one written back. */
export function migrateV1(raw: unknown): SaveV2 | null {
  const v1 = parseV1(raw);
  if (!v1) return null;
  const done = v1.academyDone ?? [];
  return {
    ...v1,
    version: 2,
    setup: defaultSetup(),
    run: emptyRun(),
    desktop: defaultDesktop(),
    results: defaultResults(),
    news: defaultNews(),
    academyTiers: tiersFromDone(done),
    residue: { ...emptyResidue(), ...v1.residue },
    migratedFrom: 1,
  };
}

function parseV2(raw: unknown): SaveV2 | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as SaveV2;
  if (s.version !== 2 || !s.room || !s.playerName) return null;
  if (!s.plant) s.plant = null;
  else s.plant = { ...DEFAULT_PLANT, ...s.plant };
  s.setup = { ...defaultSetup(), ...s.setup };
  s.desktop = { ...defaultDesktop(), ...s.desktop, pinned: [...(s.desktop?.pinned ?? [])] };
  s.results = { daily: [...(s.results?.daily ?? [])], shuffleBest: s.results?.shuffleBest ?? null };
  s.news = { seenIds: [...(s.news?.seenIds ?? [])] };
  s.run = s.run ? { ...emptyRun(), ...s.run, history: s.run.history ?? [] } : emptyRun();
  s.residue = { ...emptyResidue(), ...s.residue };
  s.academyTiers = Array.isArray(s.academyTiers) ? s.academyTiers : tiersFromDone(s.academyDone ?? []);
  return s;
}

export function peekSave(): SaveV2 | null {
  if (typeof localStorage === "undefined") return null;
  const v2 = localStorage.getItem(SAVE_KEY_V2);
  if (v2 !== null) {
    try {
      const parsed = parseV2(JSON.parse(v2) as unknown);
      if (parsed) return parsed;
    } catch {
      /* The bytes are not JSON. Keep them, and do not read version 1. */
    }
    localStorage.setItem(SAVE_KEY_V2_CORRUPT, v2);
    return null;
  }
  try {
    const v1 = localStorage.getItem(SAVE_KEY);
    if (!v1) return null;
    const migrated = migrateV1(JSON.parse(v1) as unknown);
    if (!migrated) {
      localStorage.removeItem(SAVE_KEY);
      return null;
    }
    return migrated;
  } catch {
    return null;
  }
}

export function hasSave(): boolean {
  return peekSave() !== null;
}

export function wipeSave() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(SAVE_KEY_V2);
  localStorage.removeItem(SAVE_KEY_V2_CORRUPT);
}

export function canAutosave(s: GameState): boolean {
  if (OVERLAY.includes(s.mode)) return false;
  if (s.mode === "splash" || s.mode === "menu" || s.mode === "how" || s.mode === "credits" || s.mode === "role") return false;
  if (s.mode === "build" && !s.plant) return false;
  return true;
}

/**
 * The desktop may write once a shift has started, so settings made there survive a reload.
 * Before a shift there is no save to write to, and settings stay in memory until one exists.
 */
export function canWriteSettings(s: GameState): boolean {
  return s.mode === "desktop" && s.role !== null;
}

export function writeSave(s: GameState, quiet = true): boolean {
  if (typeof localStorage === "undefined") return false;
  if (!canAutosave(s) && s.mode !== "pause" && !canWriteSettings(s)) return false;
  try {
    const snap = snapshot(s);
    localStorage.setItem(SAVE_KEY_V2, JSON.stringify(snap));
    if (!quiet) {
      s.toast = "Shift saved.";
      s.toastT = 2.2;
    }
    return true;
  } catch {
    return false;
  }
}

export function hydrateSave(s: GameState): boolean {
  const data = peekSave();
  if (!data) return false;
  s.mode = persistMode(data.mode);
  s.prevMode = s.mode;
  s.role = data.role;
  s.playerName = data.playerName || "Alex";
  s.playerLook = data.playerLook ? { ...DEFAULT_PLAYER_LOOK, ...data.playerLook } : { ...DEFAULT_PLAYER_LOOK };
  s.day = data.day;
  s.minutes = data.minutes;
  s.room = data.room in ROOMS ? data.room : "cafe";
  s.x = Number.isFinite(data.x) ? data.x : 160;
  s.y = Number.isFinite(data.y) ? data.y : 160;
  s.facing = data.facing === "left" || data.facing === "right" || data.facing === "up" || data.facing === "down" ? data.facing : "down";
  s.culture = Number.isFinite(data.culture) ? data.culture : 0;
  s.trust = { ...s.trust, ...data.trust };
  s.flags = { ...data.flags };
  // A version 1 file stored the seed flag but not the run. Seeding again is the v1 rule.
  if (data.migratedFrom === 1) delete s.flags["run:seeded"];
  s.run = data.migratedFrom === 1 ? emptyRun() : { ...emptyRun(), ...data.run, history: data.run?.history ? data.run.history.map((h) => ({ ...h })) : [] };
  s.setup = { ...defaultSetup(), ...data.setup };
  s.desktop = { ...defaultDesktop(), ...data.desktop, pinned: [...(data.desktop?.pinned ?? [])] };
  s.results = {
    daily: [...(data.results?.daily ?? [])],
    shuffleBest: data.results?.shuffleBest ?? null,
    coreMap: sanitizeCoreMap(data.results?.coreMap),
  };
  s.news = { seenIds: [...(data.news?.seenIds ?? [])] };
  s.plant = data.plant;
  s.catches = data.catches;
  s.hides = data.hides;
  s.reports = data.reports;
  const prevDone = data.academyDone ?? [];
  s.academyDone = s.academyDone.map((_, i) => !!prevDone[i]);
  s.academyTiers = Array.isArray(data.academyTiers) ? [...data.academyTiers] : s.academyDone.map(() => 1);
  s.shuffleDone = data.shuffleDone;
  s.maintDone = data.maintDone;
  s.ended = data.ended;
  s.incidentResolved = data.incidentResolved;
  s.residue = { ...emptyResidue(), ...data.residue };
  s.closePrompt = data.closePrompt;
  s.fq = data.fq;
  s.stillsSeen = data.stillsSeen;
  s.goals = data.goals?.length ? data.goals.map((g) => ({ ...g })) : s.goals;
  s.weekLog = Array.isArray(data.weekLog) ? data.weekLog.map((e) => ({ ...e })) : [];
  s.scores = {
    catchBest: data.scores?.catchBest ?? 0,
    catchTime: data.scores?.catchTime ?? 0,
    hordeBest: data.scores?.hordeBest ?? 0,
    golfBest: data.scores?.golfBest ?? 0,
    delayEvents: data.scores?.delayEvents ?? 0,
    physBest: data.scores?.physBest ?? 0,
    loadBest: data.scores?.loadBest ?? 0,
  };
  s.dialogue = [];
  s.dialogueI = 0;
  s.talkNpc = null;
  s.incidentOpen = false;
  s.stillId = null;
  s.pendingRoom = null;
  s.pendingSpawn = null;
  s.pendingFacing = null;
  s.fade = 0;
  s.sitting = false;
  s.poseHold = 0;
  s.flags[`seen:${s.room}`] = true;
  if (!s.flags["seen:cafe"]) s.flags["seen:cafe"] = true;
  const open = s.goals.find((g) => !g.done);
  s.objective = open ? open.label : "Close the shift (EOD)";
  if (!open) s.closePrompt = true;
  return true;
}
