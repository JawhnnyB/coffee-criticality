import {
  ACADEMY,
  ACADEMY_FUEL,
  CAFE_SPAWN,
  INCIDENT,
  INTRO,
  NPCS,
  NPC_SCHEDULE,
  ROOMS,
  clockLabel,
  periodFromMinutes,
  periodLabel,
  talkLines,
  type Choice,
  type Line,
  type NpcId,
  type NpcSlot,
  type Period,
  type Rect,
  type RoleId,
  type RoomId,
} from "./content";
import { RADIUS, SPEED, WALL } from "./const";
import { type PlantDesign, type ShuffleCell } from "./plant";
import { DEFAULT_PLAYER_LOOK, type PlayerLook } from "./artSpec";
import { INCIDENTS, occupancyOverlay, dayDef, COMMUTE_SPAWN, DUSK_SPAWN, type WeekLogEntry } from "./week";
import { writeSave, wipeSave } from "./save";
import { playCatch, playDoor, playFoot, playHide, playReport, playSit, playStand, playTalk } from "./audio";
import { isRevealing, requestSkip } from "./chatter";
import type { CabId } from "./Arcade";
import { doorCardinal, spawnInside } from "./site";

export type Mode =
  | "splash"
  | "menu"
  | "how"
  | "credits"
  | "role"
  | "build"
  | "intro"
  | "brief"
  | "play"
  | "dialogue"
  | "incident"
  | "academy"
  | "arcade"
  | "reactor"
  | "still"
  | "pause"
  | "eod"
  | "ending"
  | "shuffle"
  | "maint"
  | "cabs"
  | "fish"
  | "plot"
  | "floor"
  | "horde"
  | "delay"
  | "golf"
  | "rods"
  | "pebble"
  | "bowl"
  | "phys"
  | "load";

export interface NpcLive {
  room: RoomId;
  x: number;
  y: number;
  tx: number;
  ty: number;
  wait: number;
  phase: number;
  facing: "left" | "right" | "up" | "down";
  moving: boolean;
  emote: "bang" | "dots" | "mug" | null;
}

export interface Actions {
  moveX: number;
  moveY: number;
  interact: boolean;
  peer: boolean;
  report: boolean;
  hide: boolean;
  confirm: boolean;
  /** Space or Enter is still down. Skips the typewriter; does not advance. */
  heldConfirm: boolean;
  back: boolean;
  pause: boolean;
}

export interface GameState {
  mode: Mode;
  prevMode: Mode;
  role: RoleId | null;
  playerName: string;
  playerLook: PlayerLook;
  room: RoomId;
  x: number;
  y: number;
  facing: "left" | "right" | "up" | "down";
  moving: boolean;
  walkPhase: number;
  culture: number;
  trust: Record<NpcId, number>;
  flags: Record<string, boolean>;
  goals: { id: string; label: string; done: boolean }[];
  messages: { id: number; text: string; t: number }[];
  msgSeq: number;
  dialogue: Line[];
  dialogueI: number;
  academyI: number;
  incidentOpen: boolean;
  incidentResolved: boolean;
  nearLabel: string;
  nearId: string;
  nearNpc: NpcId | null;
  day: number;
  minutes: number;
  period: Period;
  timeLabel: string;
  catches: number;
  hides: number;
  reports: number;
  toast: string;
  toastT: number;
  shake: number;
  hitStop: number;
  ended: "a" | "c" | null;
  doorCd: number;
  edgeCd: number;
  fade: number;
  pendingRoom: RoomId | null;
  pendingSpawn: { x: number; y: number } | null;
  pendingFacing: "left" | "right" | "up" | "down" | null;
  announce: string;
  announceT: number;
  introI: number;
  introJ: number;
  introLock: number;
  dwell: Record<string, number>;
  objective: string;
  stillId: string | null;
  talkNpc: NpcId | null;
  stillsSeen: number;
  closePrompt: boolean;
  plant: PlantDesign | null;
  academyDone: boolean[];
  shuffleDone: boolean;
  maintDone: boolean;
  returnMode: Mode;
  fq: number;
  npcLive: Partial<Record<NpcId, NpcLive>>;
  sitting: boolean;
  poseHold: number;
  weekLog: WeekLogEntry[];
  scores: ParlorScores;
}

export interface ParlorScores {
  catchBest: number;
  catchTime: number;
  hordeBest: number;
  golfBest: number;
  delayEvents: number;
  physBest: number;
  loadBest: number;
}

export const EMPTY_SCORES: ParlorScores = {
  catchBest: 0,
  catchTime: 0,
  hordeBest: 0,
  golfBest: 0,
  delayEvents: 0,
  physBest: 0,
  loadBest: 0,
};

export function createState(): GameState {
  const trust = {} as Record<NpcId, number>;
  (Object.keys(NPCS) as NpcId[]).forEach((id) => {
    trust[id] = NPCS[id].startTrust;
  });
  return {
    mode: "splash",
    prevMode: "splash",
    role: null,
    playerName: "Alex",
    playerLook: { ...DEFAULT_PLAYER_LOOK },
    room: "cafe",
    x: CAFE_SPAWN.x,
    y: CAFE_SPAWN.y,
    facing: CAFE_SPAWN.facing,
    moving: false,
    walkPhase: 0,
    culture: 28,
    trust,
    flags: { "seen:cafe": true },
    goals: [
      {
        id: "mabel",
        label: "Sit with Mabel",
        done: false
      },
      {
        id: "arcade",
        label: "Catch cabinet (optional)",
        done: false
      },
      {
        id: "plant",
        label: "Walk onto the floor",
        done: false
      },
      {
        id: "study",
        label: "Academy or ΔT bench",
        done: false
      },
      {
        id: "see",
        label: "Notice the mismatch",
        done: false
      },
      {
        id: "truth",
        label: "Handle valve 14 (R / P / H)",
        done: false
      },
      {
        id: "holt2",
        label: "Afternoon check-in with Holt",
        done: false
      }
    ],
    messages: [],
    msgSeq: 0,
    dialogue: [],
    dialogueI: 0,
    academyI: 0,
    incidentOpen: false,
    incidentResolved: false,
    nearLabel: "",
    nearId: "",
    nearNpc: null,
    day: 1,
    minutes: 412,
    period: "morning",
    timeLabel: "06:52",
    catches: 0,
    hides: 0,
    reports: 0,
    toast: "",
    toastT: 0,
    shake: 0,
    hitStop: 0,
    ended: null,
    doorCd: 0,
    edgeCd: 0,
    fade: 0,
    pendingRoom: null,
    pendingSpawn: null,
    pendingFacing: null,
    announce: "",
    announceT: 0,
    introI: 0,
    introJ: 0,
    introLock: 0,
    dwell: {},
    objective: "Talk to Mabel before the floor takes you.",
    stillId: null,
    talkNpc: null,
    stillsSeen: 0,
    closePrompt: false,
    plant: null,
    academyDone: ACADEMY.map(() => false),
    shuffleDone: false,
    maintDone: false,
    returnMode: "play",
    fq: 0,
    npcLive: {},
    sitting: false,
    poseHold: 0,
    weekLog: [],
    scores: { ...EMPTY_SCORES }
  };
}
export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
export function overlap(ax: number, ay: number, ar: number, r: Rect) {
  const nx = clamp(ax, r.x, r.x + r.w);
  const ny = clamp(ay, r.y, r.y + r.h);
  const dx = ax - nx;
  const dy = ay - ny;
  return dx * dx + dy * dy < ar * ar;
}
/** Doorways punch a walkable lane through the mural / outer walls. */
export function inDoorLane(x: number, y: number, roomId: RoomId) {
  const room = ROOMS[roomId];
  for (const d of room.doors) {
    const north = d.rect.y <= 58;
    const south = d.rect.y + d.rect.h >= room.h - 24;
    const west = d.rect.x <= 24;
    const east = d.rect.x + d.rect.w >= room.w - 24;
    let lx = d.rect.x - 10;
    let ly = d.rect.y - 10;
    let lw = d.rect.w + 20;
    let lh = d.rect.h + 20;
    if (north) {
      ly = 0;
      lh = Math.max(d.rect.y + d.rect.h + 16, 68);
    }
    if (south) {
      ly = d.rect.y - 30;
      lh = room.h - ly + 6;
    }
    if (west) {
      lx = 0;
      lw = d.rect.x + d.rect.w + 30;
    }
    if (east) {
      lx = d.rect.x - 30;
      lw = room.w - lx + 6;
    }
    if (x >= lx && x <= lx + lw && y >= ly && y <= ly + lh) return true;
  }
  return false;
}
export function npcsHere(s: GameState) {
  const out: Array<{ id: NpcId } & NpcLive> = [];
  for (const id of Object.keys(NPCS) as NpcId[]) {
    const live = ensureNpc(s, id);
    if (live.room === s.room) out.push({
      id,
      ...live
    });
  }
  return out;
}
export function slotOf(s: GameState, id: NpcId) {
  const overlay = occupancyOverlay(s.day, s.period, id);
  if (overlay) return overlay;
  return NPC_SCHEDULE[s.period][id] ?? {
    room: "cafe",
    x: 96,
    y: 128,
    face: "down",
    radius: 8
  };
}
export function ensureNpc(s: GameState, id: NpcId) {
  const home = slotOf(s, id);
  let live = s.npcLive[id];
  if (!live || live.room !== home.room) {
    live = {
      room: home.room,
      x: home.x,
      y: home.y,
      tx: home.x,
      ty: home.y,
      wait: 1 + Math.random() * 3,
      phase: 0,
      facing: home.face ?? "down",
      moving: false,
      emote: null
    };
    s.npcLive[id] = live;
  }
  return live;
}
export function pickWander(s: GameState, id: NpcId, live: NpcLive) {
  const home = slotOf(s, id);
  const rad = home.radius ?? 40;
  if (rad <= 12) {
    live.tx = home.x;
    live.ty = home.y;
    live.wait = 6;
    return;
  }
  for (let i = 0; i < 16; i++) {
    const ang = Math.random() * Math.PI * 2;
    const r = 8 + Math.random() * rad;
    const x = home.x + Math.cos(ang) * r;
    const y = home.y + Math.sin(ang) * r;
    if (!solidAt(x, y, s, live.room, false)) {
      live.tx = x;
      live.ty = y;
      live.wait = 3 + Math.random() * 5;
      return;
    }
  }
  live.tx = home.x;
  live.ty = home.y;
  live.wait = 3;
}
export function tickNpcs(s: GameState, dt: number) {
  const talking = s.mode === "dialogue" ? s.talkNpc : null;
  for (const id of Object.keys(NPCS) as NpcId[]) {
    const home = slotOf(s, id);
    const live = ensureNpc(s, id);
    const rad = home.radius ?? 40;
    if (talking === id) {
      live.moving = false;
      live.phase += dt * 2;
      if (live.room === s.room) {
        const dx = s.x - live.x;
        const dy = s.y - live.y;
        live.facing = Math.abs(dx) > Math.abs(dy) ? dx < 0 ? "left" : "right" : dy < 0 ? "up" : "down";
      }
    } else if (rad <= 12) {
      live.moving = false;
      live.phase += dt * 2;
      const pdx = home.x - live.x;
      const pdy = home.y - live.y;
      const pd = Math.hypot(pdx, pdy);
      if (pd > 2) {
        const step = Math.min(pd, 40 * dt);
        live.x += pdx / pd * step;
        live.y += pdy / pd * step;
      } else if (home.face) live.facing = home.face;
    } else {
      const pdx = live.x - s.x;
      const pdy = live.y - s.y;
      if (live.room === s.room && pdx * pdx + pdy * pdy < 400) {
        live.moving = false;
        live.wait = Math.max(live.wait, .6);
        live.phase += dt * 2;
      } else {
        live.wait -= dt;
        const tdx = live.tx - live.x;
        const tdy = live.ty - live.y;
        const td = Math.hypot(tdx, tdy);
        if (td < 4 || live.wait <= 0) {
          pickWander(s, id, live);
          live.moving = false;
          live.phase += dt * 2;
          if (td < 4 && home.face) live.facing = home.face;
        } else {
          const step = 28 * dt;
          const nx = live.x + tdx / td * step;
          const ny = live.y + tdy / td * step;
          if (solidAt(nx, ny, s, live.room, false)) {
            pickWander(s, id, live);
            live.moving = false;
            live.phase += dt * 2;
          } else {
            live.moving = true;
            live.facing = Math.abs(tdx) > Math.abs(tdy) ? tdx < 0 ? "left" : "right" : tdy < 0 ? "up" : "down";
            live.x = nx;
            live.y = ny;
            live.phase += dt * 8;
          }
        }
      }
    }
    if (live.room !== s.room || s.mode !== "play") live.emote = null;
    else if (id === "mabel" && s.flags.hid) live.emote = "dots";
    else if (id === "mabel") live.emote = s.flags.mabelTalked ? null : "mug";
    else if (!s.flags[`${id}Talked`]) live.emote = "bang";
    else live.emote = null;
  }
}
export function solidAt(x: number, y: number, s: GameState, roomId: RoomId = s.room, hitPeople = true) {
  const room = ROOMS[roomId];
  const pad = 12;
  if (!inDoorLane(x, y, roomId)) {
    if (x < pad || x > room.w - pad) return true;
    if (y < 66 || y > room.h - pad) return true;
  } else {
    if (x < 6 || x > room.w - 6) return true;
    if (y < 6 || y > room.h - 6) return true;
  }
  for (const p of room.props) {
    if (p.block === false) continue;
    const boxes = p.hit && p.hit.length ? p.hit : [p.rect];
    for (const box of boxes) if (overlap(x, y, 9, box)) return true;
  }
  if (hitPeople && roomId === s.room) for (const n of npcsHere(s)) {
    const dx = x - n.x;
    const dy = y - n.y;
    if (dx * dx + dy * dy < 196) return true;
  }
  return false;
}
export function unstick(s: GameState) {
  if (!solidAt(s.x, s.y, s)) return;
  const room = ROOMS[s.room];
  s.x = clamp(s.x, 16, room.w - 16);
  s.y = clamp(s.y, 68, room.h - 16);
  if (!solidAt(s.x, s.y, s)) return;
  const dirs: Array<[number, number]> = [
    [0, 4], [4, 0], [0, -4], [-4, 0],
    [4, 4], [-4, 4], [4, -4], [-4, -4],
  ];
  for (let r = 1; r <= 24; r++) {
    for (const [dx, dy] of dirs) {
      const nx = clamp(s.x + dx * r, 16, room.w - 16);
      const ny = clamp(s.y + dy * r, 68, room.h - 16);
      if (!solidAt(nx, ny, s)) {
        s.x = nx;
        s.y = ny;
        return;
      }
    }
  }
}
export function pushLog(s: GameState, kind: WeekLogEntry['kind'], text: string) {
  s.weekLog.push({
    day: s.day,
    kind,
    text
  });
  if (s.weekLog.length > 24) s.weekLog.shift();
}
export function pushMsg(s: GameState, text: string) {
  s.msgSeq += 1;
  s.messages.unshift({
    id: s.msgSeq,
    text,
    t: 5.4
  });
  if (s.messages.length > 5) s.messages.pop();
  s.toast = text;
  s.toastT = 3.6;
}
export function setGoal(s: GameState, id: string) {
  const g = s.goals.find((x) => x.id === id);
  if (g && !g.done) g.done = true;
  refreshObjective(s);
}
export function bumpCulture(s: GameState, n: number) {
  s.culture = clamp(s.culture + n, 0, 100);
}
export function bumpTrust(s: GameState, id: NpcId, n: number) {
  s.trust[id] = clamp(s.trust[id] + n, -100, 100);
}
var DAY_CAP = 1008;
export function addMinutes(s: GameState, n: number) {
  if (n <= 0) return;
  if (s.flags.endingWalk) return;
  const prev = s.period;
  s.minutes = clamp(s.minutes + n, 400, DAY_CAP);
  s.period = periodFromMinutes(s.minutes);
  s.timeLabel = clockLabel(s.minutes);
  if (s.period !== prev) {
    pushMsg(s, s.period === "midday" ? "Midday. Light goes white in the corridor. People change rooms." : "Afternoon. The stack's shadow is long. Holt will want a real answer.");
    s.announce = periodLabel(s.period);
    s.announceT = 2.6;
    if (s.period === "afternoon") s.flags.afternoon = true;
    unstick(s);
  }
  if (s.minutes >= 980) s.closePrompt = true;
  if (s.minutes >= DAY_CAP && s.mode === "play") {
    pushMsg(s, "The floor is dimming. The shift is closing whether you like the handwriting or not.");
    finishDay(s);
  }
}
export function refreshObjective(s: GameState) {
  const d = dayDef(s.day);
  if (s.flags.endingWalk) {
    s.objective = "Walk the lot. Lake north. The stack is still breathing.";
    s.closePrompt = true;
    return;
  }
  if (s.day === 5 && !s.shuffleDone) {
    s.objective = "Reactor hall — fuel shuffle desk. Program the core.";
    return;
  }
  if (s.day === 5 && s.shuffleDone) {
    if (!s.flags.priyaMap) {
      s.objective = "Show Priya the map. She will not sign a peak she cannot explain.";
      return;
    }
    if (!s.flags.holtAfternoon) {
      s.objective = "Close the week with Holt.";
      return;
    }
    s.closePrompt = true;
    s.objective = "The week can close. K, or walk the lot at dusk.";
    return;
  }
  if (!s.flags.mabelTalked && s.day === 1) {
    s.objective = "Sit with Mabel. Don't rush the coffee.";
    return;
  }
  if (s.day === 1 && !s.flags.plantEntered) {
    s.objective = s.room === "gate" ? "East through Plant. The floor is waiting." : "East to the lot, then east onto the floor.";
    return;
  }
  if (s.day === 1 && !s.flags.holtTalked) {
    s.objective = "Control Room — Holt wants volume, not a speech.";
    return;
  }
  if (s.day === 1 && !s.goals.find((g) => g.id === "meet")?.done) {
    s.objective = "Meet the floor — Elena, Tommy, Priya, Marcus, Jordan.";
    return;
  }
  if (!s.flags.academy && !s.flags.trainer && s.day <= 2) {
    s.objective = "Academy in Control, or Priya's ΔT bench in Engineering.";
    return;
  }
  if (d.incident && !s.incidentResolved) {
    if (d.incident === "valve") s.objective = "Board A vs the paper log. Valve 14.";
    else if (d.incident === "lockout") s.objective = "Maintenance — LOTOTO board. Pump 2A.";
    else if (d.incident === "dose") s.objective = "Dose sticker in Maintenance. Decimal walked.";
    else s.objective = "Control — the shift log has no initials.";
    return;
  }
  if (s.day === 2 && !s.maintDone) {
    s.objective = "Hang the lockout on Tommy's board.";
    return;
  }
  if (s.period !== "afternoon") {
    s.objective = d.items[0] ?? "Walk the floor. Look.";
    return;
  }
  if (!s.flags.holtAfternoon) {
    s.objective = "Find Holt. Afternoon check-in.";
    return;
  }
  s.closePrompt = true;
  s.objective = "The shift can close. K, Pause, or the prompt.";
}
export function facingOut(from: RoomId, to: RoomId) {
  const side = doorCardinal(from, to);
  if (side === "e") return "right";
  if (side === "w") return "left";
  if (side === "n") return "up";
  return "down";
}
export function markSeen(s: GameState, room: RoomId) {
  s.flags[`seen:${room}`] = true;
}
export function beginTransition(s: GameState, to: RoomId, spawn: { x: number; y: number }, facing: GameState['facing']) {
  if (to !== "cafe" && to !== "gate" && to !== "parlor" && !s.flags.mabelTalked) {
    pushMsg(s, "Mabel's eyes follow you. Sit first. The plant will still be there.");
    return;
  }
  s.pendingRoom = to;
  s.pendingSpawn = spawn;
  s.pendingFacing = facing ?? s.facing;
  s.fade = .02;
  s.doorCd = .85;
  playDoor();
}
export function applyTransition(s: GameState) {
  if (!s.pendingRoom || !s.pendingSpawn) return;
  const to = s.pendingRoom;
  s.room = to;
  s.x = s.pendingSpawn.x;
  s.y = s.pendingSpawn.y;
  if (s.pendingFacing) s.facing = s.pendingFacing;
  s.pendingRoom = null;
  s.pendingSpawn = null;
  s.pendingFacing = null;
  markSeen(s, to);
  s.sitting = false;
  unstick(s);
  s.announce = ROOMS[to].name;
  s.announceT = 2.1;
  addMinutes(s, 2);
  if (to !== "cafe" && to !== "gate" && to !== "parlor") {
    s.flags.plantEntered = true;
    setGoal(s, "plant");
  }
  refreshObjective(s);
}
/** Pause-map hop. Only rooms you have already stood in. Mabel still gates the island. */
export function travelTo(s: GameState, to: RoomId) {
  if (s.mode !== "pause" && s.mode !== "play") return;
  if (to === s.room) {
    s.mode = "play";
    return;
  }
  if (!s.flags[`seen:${to}`]) {
    pushMsg(s, "Walk there first. The map is a memory, not a warp.");
    return;
  }
  if (to !== "cafe" && to !== "gate" && to !== "parlor" && !s.flags.mabelTalked) {
    pushMsg(s, "Mabel's eyes follow you. Sit first. The plant will still be there.");
    return;
  }
  s.mode = "play";
  beginTransition(s, to, spawnInside(to, s.room), facingOut(s.room, to));
}
export function finishDay(s: GameState) {
  if (s.flags.catchMiss) {
    s.hides += 1;
    s.flags.hid = true;
    bumpCulture(s, -4);
    pushLog(s, "hide", `Day ${s.day} · CATCH boards left uncaught. Eyes looked away.`);
    pushMsg(s, "Mabel: You left a lie on the glass. The week remembers.");
  }
  const honest = s.reports + s.catches > s.hides;
  if (s.hides >= 3) s.ended = "c";
  else s.ended = honest && s.culture >= 28 ? "a" : "c";
  s.mode = "eod";
  writeSave(s);
}
export function startShift(s: GameState, role: RoleId, look: PlayerLook = DEFAULT_PLAYER_LOOK) {
  wipeSave();
  const fresh = createState();
  Object.assign(s, fresh);
  s.role = role;
  s.playerLook = { ...look };
  s.mode = "build";
  s.introI = 0;
  s.introJ = 0;
  s.introLock = .4;
  s.goals = dayDef(1).goals.map((g) => ({
    ...g,
    done: false
  }));
}
export function finishBuilder(s: GameState, plant: PlantDesign) {
  s.plant = plant;
  s.flags.built = true;
  s.flags.priyaTalked = true;
  bumpTrust(s, "priya", 10);
  s.mode = "intro";
  s.introI = 0;
  s.introJ = 0;
  s.introLock = 1.05;
}
export function beginDay(s: GameState) {
  const d = dayDef(s.day);
  s.goals = d.goals.map((g) => ({
    ...g,
    done: false
  }));
  s.incidentResolved = false;
  s.incidentOpen = false;
  s.flags.glitchSeen = false;
  s.flags.glitchVisible = false;
  s.flags.holtAfternoon = false;
  s.flags.afternoon = false;
  s.flags.endingWalk = false;
  s.closePrompt = false;
  s.minutes = 412;
  s.period = "morning";
  s.timeLabel = "06:52";
  s.dwell = {};
  s.npcLive = {};
  s.sitting = false;
  s.poseHold = 0;
  if (s.day <= 1) {
    s.room = "cafe";
    s.x = CAFE_SPAWN.x;
    s.y = CAFE_SPAWN.y;
    s.facing = CAFE_SPAWN.facing;
    markSeen(s, "cafe");
    unstick(s);
  } else {
    s.room = COMMUTE_SPAWN.room;
    s.x = COMMUTE_SPAWN.x;
    s.y = COMMUTE_SPAWN.y;
    s.facing = COMMUTE_SPAWN.facing;
    markSeen(s, "cafe");
    markSeen(s, "gate");
    unstick(s);
  }
  s.mode = "brief";
  s.introLock = 1.05;
  s.announce = d.name;
  s.announceT = 2;
  refreshObjective(s);
}
export function beginEndingWalk(s: GameState) {
  if (!s.ended) {
    const honest = s.reports + s.catches > s.hides;
    s.ended = s.hides >= 3 ? "c" : honest && s.culture >= 28 ? "a" : "c";
  }
  s.flags.endingWalk = true;
  s.minutes = 1030;
  s.period = "afternoon";
  s.timeLabel = "17:10";
  s.room = DUSK_SPAWN.room;
  s.x = DUSK_SPAWN.x;
  s.y = DUSK_SPAWN.y;
  s.facing = DUSK_SPAWN.facing;
  s.mode = "play";
  s.closePrompt = true;
  s.sitting = false;
  s.poseHold = 0;
  s.dwell = { ending: 0 };
  s.npcLive = {};
  markSeen(s, "gate");
  unstick(s);
  s.announce = "Dusk · Lot";
  s.announceT = 2.6;
  s.objective = "Walk the lot. Lake north. The stack is still breathing.";
  pushMsg(s, s.ended === "a" ? "The stack is still breathing. Walk once. Lake north." : "The lot is quiet. The hiss is not. Walk once.");
}
export function nextDay(s: GameState) {
  if (s.day >= 5) {
    beginEndingWalk(s);
    return;
  }
  s.day += 1;
  beginDay(s);
}
export function openTalk(s: GameState, npc: NpcId) {
  s.dialogue = talkLines(npc, s.flags, s.culture, s.period, s.day);
  s.dialogueI = 0;
  s.mode = "dialogue";
  s.talkNpc = npc;
  s.nearNpc = npc;
  const first = !s.flags[`${npc}Talked`];
  s.flags[`${npc}Talked`] = true;
  bumpTrust(s, npc, first ? 4 : 1);
  if (npc === "holt") {
    const quoted = [...s.weekLog].reverse().find((e) => /CATCH/.test(e.text));
    if (quoted) s.dialogue.splice(1, 0, {
      speaker: "Holt",
      text: `Parlor board. ${quoted.text} Volume I can use.`,
      mood: "even"
    });
  }
  if (npc === "mabel") setGoal(s, "mabel");
  if (npc === "marcus") setGoal(s, "marcus");
  if (npc === "priya") {
    if (s.day === 5 && s.shuffleDone) {
      s.flags.priyaMap = true;
      setGoal(s, "priya");
    } else if (s.day !== 5) setGoal(s, "priya");
  }
  if (Object.keys(NPCS).filter((id) => s.flags[`${id}Talked`]).length >= 4) setGoal(s, "meet");
  if (npc === "holt" && s.period === "afternoon") {
    s.flags.holtAfternoon = true;
    setGoal(s, "holt2");
  }
  refreshObjective(s);
  playTalk();
}
export function resolveNear(s: GameState) {
  const room = ROOMS[s.room];
  s.nearLabel = "";
  s.nearId = "";
  s.nearNpc = null;
  if (s.sitting) {
    s.nearLabel = "Stand";
    s.nearId = "stand";
    return;
  }
  for (const it of room.interacts) if (overlap(s.x, s.y, 14, it.rect)) {
    s.nearLabel = interactLabel(s, it.id, it.label);
    s.nearId = it.id;
    s.nearNpc = it.npc ?? null;
    return;
  }
  for (const n of npcsHere(s)) {
    const dx = s.x - n.x;
    const dy = s.y - n.y;
    if (dx * dx + dy * dy < 784) {
      const met = s.flags[`${n.id}Talked`];
      const last = NPCS[n.id].name.split(" ").slice(-1)[0];
      s.nearLabel = met ? `Greet ${last}` : `Meet ${last}`;
      s.nearId = `npc-${n.id}`;
      s.nearNpc = n.id;
      return;
    }
  }
}
export function interactLabel(s: GameState, id: string, fallback: string) {
  if (id === "valve") {
    if (s.day === 1) return "Valve 14 — hissing";
    if (s.day === 2) return "Pump 2A line";
    if (s.day === 3) return "Dose sticker";
    return "Line 14";
  }
  if (id === "shuffle") return s.day >= 5 ? "Fuel shuffle desk" : "Fuel desk — Friday";
  if (id === "board") {
    if (s.day === 1) return "Board A";
    if (s.day === 4) return "Board A — unsigned log";
    return "Board A";
  }
  if (id === "shift-log") return s.day === 4 ? "Unsigned shift log" : "Paper shift log";
  if (id === "dose") return s.day === 3 ? "Dose sticker — 40" : "Dose sticker";
  return fallback;
}
export function noticeGlitch(s: GameState) {
  if (s.flags.glitchSeen) return;
  s.flags.glitchSeen = true;
  s.flags.glitchVisible = true;
  setGoal(s, "see");
  s.shake = .18;
  pushMsg(s, dayIncident(s).title);
}
export function useInteract(s: GameState) {
  if (s.sitting || s.nearId === "stand") {
    s.sitting = false;
    s.y = Math.min(ROOMS[s.room].h - 16, s.y + 16);
    playStand();
    return;
  }
  if (s.nearNpc) {
    openTalk(s, s.nearNpc);
    return;
  }
  if (s.nearId.startsWith("still-") || ROOMS[s.room].interacts.find((it) => it.id === s.nearId)?.kind === "still") {
    const it = ROOMS[s.room].interacts.find((x) => x.id === s.nearId);
    if (it?.still) {
      openStill(s, it.still);
      return;
    }
  }
  if (s.nearId === "arcade" || s.nearId.startsWith("cab-")) {
    s.returnMode = "play";
    if (s.nearId === "cab-catch") s.mode = "arcade";
    else if (s.nearId === "cab-fish") s.mode = "fish";
    else if (s.nearId === "cab-plot") s.mode = "plot";
    else if (s.nearId === "cab-horde") s.mode = "horde";
    else if (s.nearId === "cab-delay") s.mode = "delay";
    else if (s.nearId === "cab-golf") s.mode = "golf";
    else if (s.nearId === "cab-rods") s.mode = "rods";
    else if (s.nearId === "cab-pebble") s.mode = "pebble";
    else if (s.nearId === "cab-bowl") s.mode = "bowl";
    else if (s.nearId === "cab-phys") s.mode = "phys";
    else if (s.nearId === "cab-load") s.mode = "load";
    else if (s.nearId === "cab-floor") {
      openStill(s, "scores");
      return;
    } else s.mode = "cabs";
    return;
  }
  const kind = ROOMS[s.room].interacts.find((x) => x.id === s.nearId)?.kind;
  if (kind === "sit") {
    const it = ROOMS[s.room].interacts.find((x) => x.id === s.nearId);
    if (!it) return;
    s.sitting = true;
    s.x = it.rect.x + it.rect.w / 2;
    s.y = it.rect.y + it.rect.h - 2;
    s.facing = "down";
    s.moving = false;
    addMinutes(s, 1);
    playSit();
    pushMsg(s, "Sit. The floor will still be there.");
    return;
  }
  if (kind === "fish") {
    s.returnMode = "play";
    s.mode = "fish";
    return;
  }
  if (kind === "plot") {
    s.returnMode = "play";
    s.mode = "plot";
    return;
  }
  if (kind === "horde") {
    s.returnMode = "play";
    s.mode = "horde";
    return;
  }
  if (kind === "delay") {
    s.returnMode = "play";
    s.mode = "delay";
    return;
  }
  if (kind === "golf") {
    s.returnMode = "play";
    s.mode = "golf";
    return;
  }
  if (kind === "rods") {
    s.returnMode = "play";
    s.mode = "rods";
    return;
  }
  if (kind === "pebble") {
    s.returnMode = "play";
    s.mode = "pebble";
    return;
  }
  if (kind === "bowl") {
    s.returnMode = "play";
    s.mode = "bowl";
    return;
  }
  if (kind === "phys") {
    s.returnMode = "play";
    s.mode = "phys";
    return;
  }
  if (kind === "load") {
    s.returnMode = "play";
    s.mode = "load";
    return;
  }
  if (kind === "scores") {
    openStill(s, "scores");
    return;
  }
  if (kind === "floor") {
    openStill(s, "scores");
    return;
  }
  if (s.nearId === "trainer") {
    s.returnMode = "play";
    s.mode = "reactor";
    return;
  }
  if (s.nearId === "shuffle") {
    if (s.day < 5) {
      s.academyI = ACADEMY_FUEL;
      s.mode = "academy";
      s.flags.academy = true;
      setGoal(s, "study");
      pushMsg(s, "Priya: Outage is Friday. Study the fuel page. Do not sign a shuffle yet.");
      refreshObjective(s);
      return;
    }
    s.returnMode = "play";
    s.mode = "shuffle";
    return;
  }
  if (s.nearId === "maint") {
    s.returnMode = "play";
    s.mode = "maint";
    return;
  }
  if (s.nearId === "academy") {
    s.mode = "academy";
    s.flags.academy = true;
    setGoal(s, "study");
    pushMsg(s, "Academy. Teaching only — not a license.");
    refreshObjective(s);
    return;
  }
  if (s.nearId === "coffee") {
    s.flags.coffee = true;
    bumpTrust(s, "mabel", 4);
    addMinutes(s, 3);
    pushMsg(s, "Mabel: On the house. Don't spill it on a board. And don't use it as courage.");
    return;
  }
  if (s.nearId === "core") {
    openStill(s, "pwr");
    return;
  }
  if (s.nearId === "board" || s.nearId === "shift-log" || s.nearId === "valve" || s.nearId === "dose") {
    const d = dayDef(s.day);
    if (d.incident === "lockout") {
      s.returnMode = "play";
      s.mode = "maint";
      return;
    }
    if (d.incident) {
      noticeGlitch(s);
      if (s.nearId === "valve") s.flags.sawValve = true;
      if (s.nearId === "dose") s.flags.doseSeen = true;
      if (!s.incidentResolved) {
        s.incidentOpen = true;
        s.mode = "incident";
      }
    } else if (s.nearId === "dose") {
      s.flags.doseSeen = true;
      pushMsg(s, "Area sticker. Time, distance, shielding — and still seeing.");
    }
    return;
  }
  if (s.nearId === "commute") {
    if (s.flags.endingWalk) {
      s.mode = "ending";
      return;
    }
    pushMsg(s, "Child seat. Cold coffee. Elena was here before dawn. You are not the only one carrying a life into this gate.");
    openStill(s, "gate");
    return;
  }
}
export function openStill(s: GameState, id: string) {
  s.stillId = id;
  s.mode = "still";
  s.stillsSeen += 1;
  s.flags.looked = true;
}
export function closeStill(s: GameState) {
  s.stillId = null;
  s.mode = "play";
  addMinutes(s, 2);
  refreshObjective(s);
}
export function finishArcade(s: GameState, score: number, leftover = 0) {
  const back = s.returnMode === "eod" ? "eod" : "play";
  s.mode = back;
  s.returnMode = "play";
  s.flags.arcade = true;
  setGoal(s, "arcade");
  if (back === "play") addMinutes(s, 8);
  if (score > s.scores.catchBest || score === s.scores.catchBest && leftover > s.scores.catchTime) {
    s.scores.catchBest = score;
    s.scores.catchTime = leftover;
  }
  pushLog(s, score >= 4 ? "peer" : "note", `Day ${s.day} · CATCH.CAB ${score}/5. ${score >= 4 ? "Eyes first." : "A lie walked."}`);
  if (score >= 4) {
    bumpCulture(s, 6);
    s.catches += 1;
    s.flags.catchMiss = false;
    pushMsg(s, "Mabel: Eyes like that belong on a live board. I'll chalk it.");
  } else {
    s.flags.catchMiss = true;
    bumpCulture(s, 2);
    pushMsg(s, "Mabel: You left a lie on the glass. Clock out and it becomes a hide.");
  }
  refreshObjective(s);
}
export function openArcade(s: GameState, from: Mode = "play") {
  s.returnMode = from === "eod" ? "eod" : "play";
  s.mode = "cabs";
}
export function openCab(s: GameState, id: CabId | "floor", from: Mode = "play") {
  s.returnMode = from === "eod" ? "eod" : "play";
  s.mode = id === "catch" ? "arcade" : id === "floor" ? "cabs" : id;
}
export function finishLeisure(s: GameState, score: number) {
  const from = s.mode;
  const delayRun = from === "delay";
  const physRun = from === "phys";
  const loadRun = from === "load";
  const back = s.returnMode === "eod" ? "eod" : s.returnMode === "academy" ? "academy" : "play";
  if (from === "horde") s.scores.hordeBest = Math.max(s.scores.hordeBest, score);
  if (from === "golf") {
    if (s.scores.golfBest <= 0 || (score > 0 && score < s.scores.golfBest)) s.scores.golfBest = score;
  }
  if (from === "phys") s.scores.physBest = Math.max(s.scores.physBest, score);
  if (from === "load") s.scores.loadBest = Math.max(s.scores.loadBest, score);
  if (delayRun) {
    if (score >= 9) {
      s.scores.delayEvents = Math.max(s.scores.delayEvents, 2);
      pushLog(s, "note", `Day ${s.day} · DELAY.CAB survived two transients.`);
      pushMsg(s, "Mabel: The slope punched. You stayed on it.");
      bumpCulture(s, 6);
    } else if (score === 0) {
      s.flags.delayPrompt = true;
      pushLog(s, "note", `Day ${s.day} · DELAY.CAB went $1. The delay was spent.`);
      pushMsg(s, "Mabel: $1 is a cliff. The parlor does not pretend it isn't.");
    } else if (score === 1) {
      s.flags.delayBuried = true;
      pushLog(s, "note", `Day ${s.day} · DELAY.CAB buried the core. Nothing left to feed.`);
      pushMsg(s, "Mabel: You buried it. Delayed neutrons still sitting. Come back.");
    } else pushMsg(s, "Mabel: The parlor does what a speech cannot.");
  } else if (physRun) {
    s.flags.physMc = false;
    if (score >= 9) {
      s.flags.physPlayed = true;
      s.flags.physMcHeld = true;
      pushLog(s, "note", `Day ${s.day} · PHYS.CAB analog MC held k ± σ.`);
      pushMsg(s, "Priya: Analog k. Fission bank. σ falls with G. OpenMC stays a letter.");
      bumpCulture(s, 6);
    } else if (score >= 8) {
      s.flags.physPlayed = true;
      pushLog(s, "note", `Day ${s.day} · PHYS.CAB held the pin and the hill.`);
      pushMsg(s, "Priya: A pin is not a plant. You watched why.");
      bumpCulture(s, 6);
    } else if (score === 0) {
      pushMsg(s, "Priya: k ran. Same cliff as DELAY — this time it had a shape.");
    } else if (score === 1) {
      pushMsg(s, "Priya: The chain died in the pellet. Come back.");
    } else {
      pushMsg(s, "Priya: Analog k still wandering. Come back.");
    }
  } else if (loadRun) {
    if (score >= 9) {
      pushLog(s, "note", `Day ${s.day} · LOAD.CAB held five pulses. The load was the opponent.`);
      pushMsg(s, "Mabel: You saw the pulse. You placed one catch. I'll chalk it.");
      bumpCulture(s, 6);
    } else if (score >= 7) {
      pushLog(s, "note", `Day ${s.day} · LOAD.CAB held the night.`);
      pushMsg(s, "Mabel: The load moved. You placed.");
      bumpCulture(s, 4);
    } else {
      pushMsg(s, "Mabel: The load walked. Catch is cheaper than a search.");
    }
  } else if (back === "academy") pushMsg(s, "Priya: The delay is the clock. The cards still have no time.");
  else pushMsg(s, score >= 3 ? "Mabel: The parlor does what a speech cannot." : "Mabel: Come back when the eyes are tired.");
  s.mode = back;
  s.returnMode = "play";
  s.flags.arcade = true;
  setGoal(s, "arcade");
  if (back === "play") addMinutes(s, 6);
  if (score >= 3 && !delayRun && !physRun && !loadRun) bumpCulture(s, 4);
  refreshObjective(s);
}
export function abortOverlay(s: GameState) {
  if (
    s.mode === "play" ||
    s.mode === "menu" ||
    s.mode === "eod" ||
    s.mode === "ending" ||
    s.mode === "brief" ||
    s.mode === "splash"
  ) {
    s.stillId = null;
    return;
  }
  const back = s.returnMode === "eod" || s.returnMode === "academy" ? s.returnMode : "play";
  s.stillId = null;
  s.flags.physMc = false;
  s.mode = back;
  s.returnMode = "play";
  if (back === "play") addMinutes(s, 1);
  refreshObjective(s);
}
export function finishTrainer(s: GameState) {
  const back = s.returnMode === "academy" ? "academy" : "play";
  s.mode = back;
  s.returnMode = "play";
  s.flags.trainer = true;
  setGoal(s, "study");
  if (back === "play") addMinutes(s, 12);
  bumpTrust(s, "priya", 10);
  bumpCulture(s, 4);
  pushMsg(s, "Priya: Heat left. Teaching model only. Now go see if the paper agrees with the board.");
  refreshObjective(s);
}
export function closeAcademy(s: GameState) {
  s.mode = "play";
  s.flags.academy = true;
  s.academyDone[s.academyI] = true;
  setGoal(s, "study");
  addMinutes(s, 7);
  refreshObjective(s);
}
export function openAcademy(s: GameState) {
  s.mode = "academy";
  s.flags.academy = true;
  setGoal(s, "study");
  refreshObjective(s);
}
export function openShufflePractice(s: GameState) {
  s.returnMode = "academy";
  s.mode = "shuffle";
}
export function finishShuffle(s: GameState, fq: number, map: ShuffleCell[]) {
  const official = s.day >= 5 && s.returnMode !== "academy";
  const back = s.returnMode === "academy" ? "academy" : "play";
  s.mode = back;
  s.returnMode = "play";
  s.fq = fq;
  if (map && s.plant) s.plant.shuffleMap = map;
  if (official) {
    s.shuffleDone = true;
    s.flags.shuffle = true;
    setGoal(s, "shuffle");
    addMinutes(s, 18);
    bumpTrust(s, "priya", 12);
    bumpCulture(s, 8);
    pushLog(s, "shuffle", `Day 5 · Fuel map Fq ${fq.toFixed(2)}. Teaching model only.`);
    pushMsg(s, `Priya: Fq ${fq.toFixed(2)}. Teaching model only. Now tell Holt.`);
  } else {
    if (back === "play") addMinutes(s, 8);
    pushMsg(s, "Priya: That's practice. Friday is the signature. Teaching only.");
  }
  refreshObjective(s);
}
export function finishMaint(s: GameState, score: number) {
  s.mode = "play";
  s.maintDone = true;
  s.flags.maint = true;
  setGoal(s, "maint");
  addMinutes(s, 10);
  if (score >= 1) {
    bumpCulture(s, 6);
    bumpTrust(s, "tommy", 10);
    s.catches += 1;
    if (s.day === 2) s.incidentResolved = true;
    pushLog(s, "report", "Day 2 · LOTOTO hunt. The orange tag did not belong.");
  }
  pushMsg(s, score >= 1 ? "Tommy: That's a lockout. The pump can stay quiet." : "Tommy: Look again. IN SERVICE does not hang here.");
  refreshObjective(s);
}
export function resolveIncident(s: GameState, how: "report" | "peer" | "hide") {
  s.incidentOpen = false;
  s.incidentResolved = true;
  s.mode = "play";
  setGoal(s, "truth");
  addMinutes(s, 8);
  const pack = dayIncident(s);
  if (how === "report") {
    s.reports += 1;
    s.catches += 1;
    s.flags.reported = true;
    bumpCulture(s, 10);
    bumpTrust(s, "elena", 8);
    bumpTrust(s, "holt", 6);
    playReport();
    pushLog(s, "report", `Day ${s.day} · Reported. ${pack.title}`);
    pushMsg(s, pack.report);
  } else if (how === "peer") {
    s.catches += 1;
    s.flags.peered = true;
    s.flags.reported = true;
    bumpCulture(s, 12);
    bumpTrust(s, "elena", 12);
    setGoal(s, "peer");
    if (s.flags.jordanTalked) s.flags.jordanCredit = true;
    playCatch();
    pushLog(s, "peer", `Day ${s.day} · Shared catch. ${pack.title}`);
    pushMsg(s, pack.peer);
  } else {
    s.hides += 1;
    s.flags.hid = true;
    bumpCulture(s, -8);
    bumpTrust(s, "elena", -6);
    bumpTrust(s, "holt", -4);
    playHide();
    pushLog(s, "hide", `Day ${s.day} · Hid. ${pack.title}`);
    pushMsg(s, pack.hide);
    if (s.hides >= 3) pushMsg(s, "Mabel: Three hides is a week I will not pretend was honest.");
  }
  refreshObjective(s);
}
export function dayIncident(s: GameState) {
  const id = dayDef(s.day).incident;
  if (id && INCIDENTS[id]) return INCIDENTS[id];
  return INCIDENT;
}
export function pickChoice(s: GameState, choice: Choice) {
  const who = s.talkNpc ?? s.nearNpc;
  if (choice.trust && who) bumpTrust(s, who, choice.trust);
  if (choice.culture) bumpCulture(s, choice.culture);
  s.flags[`choice:${choice.id}`] = true;
  if (choice.flag) s.flags[choice.flag] = true;
  s.dialogue.splice(s.dialogueI + 1, 0, {
    speaker: s.dialogue[s.dialogueI]?.speaker ?? "",
    text: choice.reply,
    mood: "soft"
  });
  s.dialogueI += 1;
  refreshObjective(s);
}
export function movePlayer(s: GameState, a: Actions, dt: number) {
  if (s.fade > .04) return;
  if (s.poseHold > 0) {
    s.poseHold = Math.max(0, s.poseHold - dt);
    return;
  }
  let mx = a.moveX;
  let my = a.moveY;
  const mag = Math.hypot(mx, my);
  if (s.sitting) {
    s.moving = false;
    s.walkPhase += dt * 2;
    if (mag > .08) {
      s.sitting = false;
      s.y = Math.min(ROOMS[s.room].h - 16, s.y + 16);
      playStand();
      unstick(s);
    }
    return;
  }
  if (mag > 1) {
    mx /= mag;
    my /= mag;
  }
  s.moving = mag > .08;
  if (!s.moving) {
    s.walkPhase += dt * 2;
    return;
  }
  if (s.hitStop > 0) return;
  if (Math.abs(mx) > Math.abs(my)) s.facing = mx < 0 ? "left" : "right";
  else s.facing = my < 0 ? "up" : "down";
  s.walkPhase += dt * 8;
  playFoot(ROOMS[s.room].floorKind, s.walkPhase);
  addMinutes(s, dt * .36);
  const step = 70 * dt;
  const ox = s.x;
  const oy = s.y;
  const nx = s.x + mx * step;
  const ny = s.y + my * step;
  if (!solidAt(nx, s.y, s)) s.x = nx;
  if (!solidAt(s.x, ny, s)) s.y = ny;
  if (s.x === ox && s.y === oy) {
    if (!solidAt(nx, oy, s)) s.x = nx;
    else if (!solidAt(ox, ny, s)) s.y = ny;
  }
  if (s.doorCd > 0) return;
  const room = ROOMS[s.room];
  for (const d of room.doors) if (overlap(s.x, s.y, 8, d.rect)) {
    beginTransition(s, d.to, spawnInside(d.to, s.room), facingOut(s.room, d.to));
    break;
  }
}
export function update(s: GameState, a: Actions, dt: number) {
  const t = Math.min(dt, .1);
  s.shake = Math.max(0, s.shake - t);
  s.hitStop = Math.max(0, s.hitStop - t);
  s.toastT = Math.max(0, s.toastT - t);
  s.doorCd = Math.max(0, s.doorCd - t);
  s.edgeCd = Math.max(0, s.edgeCd - t);
  s.announceT = Math.max(0, s.announceT - t);
  s.introLock = Math.max(0, s.introLock - t);
  for (const m of s.messages) m.t -= t;
  s.messages = s.messages.filter((m) => m.t > 0);
  if (s.pendingRoom) {
    s.fade = Math.min(1, s.fade + t * 3.5);
    if (s.fade >= 1) applyTransition(s);
  } else if (s.fade > 0) s.fade = Math.max(0, s.fade - t * 2.9);
  if (s.mode === "splash") {
    if (a.confirm || a.interact) s.mode = "menu";
    return;
  }
  if (s.mode === "menu" || s.mode === "how" || s.mode === "credits") {
    if (s.mode !== "menu" && a.back) s.mode = "menu";
    return;
  }
  if (s.mode === "role") return;
  if (s.mode === "build" || s.mode === "shuffle" || s.mode === "maint" || s.mode === "cabs" || s.mode === "fish" || s.mode === "plot" || s.mode === "floor" || s.mode === "horde" || s.mode === "delay" || s.mode === "golf" || s.mode === "rods" || s.mode === "pebble" || s.mode === "bowl" || s.mode === "phys" || s.mode === "load") {
    if (a.back && s.mode !== "build") abortOverlay(s);
    return;
  }
  if (s.mode === "intro") {
    if ((a.confirm || a.interact || a.heldConfirm) && isRevealing()) {
      requestSkip();
      return;
    }
    if (s.introLock <= 0 && (a.confirm || a.interact)) {
      const beat = INTRO[s.introI];
      const lastLine = !beat || s.introJ >= beat.exchanges.length - 1;
      if (!lastLine) {
        s.introJ += 1;
        s.introLock = 1.05;
      } else if (s.introI < INTRO.length - 1) {
        s.introI += 1;
        s.introJ = 0;
        s.introLock = 1.05;
      } else {
        s.mode = "brief";
        s.introLock = 1.05;
      }
    }
    return;
  }
  if (s.mode === "brief") {
    if ((a.confirm || a.interact || a.heldConfirm) && isRevealing()) {
      requestSkip();
      return;
    }
    if (s.introLock <= 0 && (a.confirm || a.interact)) {
      s.mode = "play";
      s.announce = ROOMS[s.room].name;
      s.announceT = 2.2;
      pushMsg(s, s.day === 1 ? "Mabel is already looking at you. Don't walk past her." : dayDef(s.day).holt);
      refreshObjective(s);
    }
    return;
  }
  if (s.mode === "still") {
    if (a.back || a.confirm) closeStill(s);
    return;
  }
  if (s.mode === "arcade" || s.mode === "reactor") {
    if (a.back) abortOverlay(s);
    return;
  }
  if (s.mode === "pause") {
    if (a.back || a.pause) s.mode = "play";
    return;
  }
  if (s.mode === "eod") return;
  if (s.mode === "ending") return;
  if (s.mode === "dialogue") {
    if ((a.confirm || a.interact || a.heldConfirm) && isRevealing()) {
      requestSkip();
      return;
    }
    const line = s.dialogue[s.dialogueI];
    if (!!line?.choices?.length && !line.choices.some((c) => s.flags[`choice:${c.id}`])) {
      if (a.back) s.mode = "play";
      return;
    }
    if (a.confirm || a.interact) {
      if (s.dialogueI < s.dialogue.length - 1) {
        s.dialogueI += 1;
        playTalk();
      } else {
        s.mode = "play";
        addMinutes(s, 1.6);
        refreshObjective(s);
      }
    }
    if (a.back) {
      s.mode = "play";
      addMinutes(s, 1);
      refreshObjective(s);
    }
    return;
  }
  if (s.mode === "academy") {
    if (s.edgeCd <= 0 && (a.moveX > .5 || a.moveY > .5)) {
      s.academyI = (s.academyI + 1) % ACADEMY.length;
      s.edgeCd = .22;
    }
    if (s.edgeCd <= 0 && (a.moveX < -.5 || a.moveY < -.5)) {
      s.academyI = (s.academyI + ACADEMY.length - 1) % ACADEMY.length;
      s.edgeCd = .22;
    }
    if (a.back) closeAcademy(s);
    return;
  }
  if (s.mode === "incident") {
    if (a.report) resolveIncident(s, "report");
    else if (a.peer) resolveIncident(s, "peer");
    else if (a.hide) resolveIncident(s, "hide");
    else if (a.back) {
      s.mode = "play";
      s.incidentOpen = false;
    }
    return;
  }
  if (s.mode !== "play") return;
  if (a.pause) {
    s.mode = "pause";
    return;
  }
  movePlayer(s, a, t);
  tickNpcs(s, t);
  resolveNear(s);
  const key = s.room;
  s.dwell[key] = (s.dwell[key] ?? 0) + t;
  if (s.room === "control" && (s.dwell.control ?? 0) > 7 && s.flags.holtTalked) {
    if (s.day === 1 || s.day === 4) noticeGlitch(s);
  }
  if (s.room === "maintenance" && (s.dwell.maintenance ?? 0) > 2) {
    if (s.day === 1 && !s.flags.hissHeard) {
      s.flags.hissHeard = true;
      pushMsg(s, "A thin hiss. Valve 14. Not loud. The kind you can pretend is 'settling.'");
    }
    if (s.day === 3 && !s.flags.doseSeen) {
      s.flags.doseSeen = true;
      pushMsg(s, "The area sticker. Forty. The others say 0.04.");
    }
    if (s.day === 1 || s.day === 2 || s.day === 3) s.flags.glitchVisible = true;
  }
  if (!s.moving) addMinutes(s, t * .05);
  if (s.flags.endingWalk) {
    s.dwell.ending = (s.dwell.ending ?? 0) + t;
    if (s.dwell.ending > 5) s.closePrompt = true;
    if (a.interact && (s.nearId === "commute" || (s.dwell.ending ?? 0) > 4)) {
      s.mode = "ending";
      return;
    }
  }
  if (a.interact) useInteract(s);
  if (a.peer) {
    if (s.nearId === "shift-log" || s.nearId === "valve" || s.nearId === "board" || s.nearId === "dose") {
      noticeGlitch(s);
      if (!s.incidentResolved) {
        resolveIncident(s, "peer");
        return;
      }
    }
    if (s.nearNpc || s.nearId) {
      s.catches += 1;
      bumpCulture(s, 4);
      if (s.nearNpc) bumpTrust(s, s.nearNpc, 6);
      s.shake = .1;
      addMinutes(s, 4);
      pushMsg(s, "Peer-check. Two sets of eyes. You both look away a little after, because it mattered.");
    } else pushMsg(s, "Stand near a person or a board to peer-check.");
  }
  if (a.report && !s.incidentResolved && (s.nearId === "shift-log" || s.nearId === "valve" || s.nearId === "board" || s.nearId === "dose")) {
    noticeGlitch(s);
    s.incidentOpen = true;
    s.mode = "incident";
  }
  refreshObjective(s);
}
export function canCloseShift(s: GameState) {
  if (!(s.period === "afternoon" || s.minutes >= 920) && s.minutes < 980) return false;
  if (s.day === 1) return s.incidentResolved && (s.flags.academy || s.flags.trainer);
  if (s.day === 2) return s.maintDone || s.incidentResolved;
  if (s.day === 3) return s.incidentResolved;
  if (s.day === 4) return s.incidentResolved && (s.flags.holtAfternoon || s.minutes >= 980);
  if (s.day === 5) return s.shuffleDone;
  return s.minutes >= 980;
}
export function tryCloseShift(s: GameState) {
  if (s.flags.endingWalk) {
    s.mode = "ending";
    return;
  }
  if (s.mode !== "play" && s.mode !== "pause") return;
  if (!canCloseShift(s)) {
    s.mode = "play";
    pushMsg(s, `Not yet. ${s.objective}`);
    return;
  }
  finishDay(s);
}
export function emptyActions() {
  return {
    moveX: 0,
    moveY: 0,
    interact: false,
    peer: false,
    report: false,
    hide: false,
    confirm: false,
    heldConfirm: false,
    back: false,
    pause: false
  };
}