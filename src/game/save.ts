/**
 * Shift persistence. localStorage cc.save.v1.
 * Overlay modes collapse to play. Dialogue is never snapshotted.
 * Teaching plant is stored as JSON — not a license.
 */
import { ROOMS, type NpcId, type RoleId, type RoomId } from "./content";
import type { PlantDesign } from "./plant";
import { DEFAULT_PLANT } from "./plant";
import { DEFAULT_PLAYER_LOOK, type PlayerLook } from "./artSpec";
import type { GameState, Mode, ParlorScores } from "./sim";
import type { WeekLogEntry } from "./week";

export const SAVE_KEY = "cc.save.v1";
export const SAVE_VERSION = 1;

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

export function snapshot(s: GameState): SaveV1 {
  return {
    version: 1,
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
    shuffleDone: s.shuffleDone,
    maintDone: s.maintDone,
    ended: s.ended,
    incidentResolved: s.incidentResolved,
    closePrompt: s.closePrompt,
    fq: s.fq,
    stillsSeen: s.stillsSeen,
    goals: s.goals.map((g) => ({ ...g })),
    weekLog: s.weekLog.map((e) => ({ ...e })),
    scores: { ...s.scores },
  };
}

function migrate(raw: unknown): SaveV1 | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as { version?: number };
  if (v.version !== 1) return null;
  const s = raw as SaveV1;
  if (!s.room || !s.playerName) return null;
  if (!s.plant) s.plant = null;
  else s.plant = { ...DEFAULT_PLANT, ...s.plant };
  return s;
}

export function peekSave(): SaveV1 | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const txt = localStorage.getItem(SAVE_KEY);
    if (!txt) return null;
    const migrated = migrate(JSON.parse(txt) as unknown);
    if (!migrated) {
      wipeSave();
      return null;
    }
    return migrated;
  } catch {
    wipeSave();
    return null;
  }
}

export function hasSave(): boolean {
  return peekSave() !== null;
}

export function wipeSave() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(SAVE_KEY);
}

export function canAutosave(s: GameState): boolean {
  if (OVERLAY.includes(s.mode)) return false;
  if (s.mode === "splash" || s.mode === "menu" || s.mode === "how" || s.mode === "credits" || s.mode === "role") return false;
  if (s.mode === "build" && !s.plant) return false;
  return true;
}

export function writeSave(s: GameState, quiet = true): boolean {
  if (typeof localStorage === "undefined") return false;
  if (!canAutosave(s) && s.mode !== "pause") return false;
  try {
    const snap = snapshot(s);
    localStorage.setItem(SAVE_KEY, JSON.stringify(snap));
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
  s.plant = data.plant;
  s.catches = data.catches;
  s.hides = data.hides;
  s.reports = data.reports;
  const prevDone = data.academyDone ?? [];
  s.academyDone = s.academyDone.map((_, i) => !!prevDone[i]);
  s.shuffleDone = data.shuffleDone;
  s.maintDone = data.maintDone;
  s.ended = data.ended;
  s.incidentResolved = data.incidentResolved;
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
