import { TILE } from "./const";

export const TITLE = "Coffee & Criticality";
export const TAGLINE = "A week on Unit 1. Catch greater than heroics.";
export const THESIS = "A reactor only makes power in the right environment. People are the same. Teaching model — not a license.";
export const SITE = "Lake Master teaching plant";

export type Period = "morning" | "midday" | "afternoon";
export type RoomId =
  | "cafe"
  | "parlor"
  | "gate"
  | "corridor"
  | "control"
  | "engineering"
  | "breakroom"
  | "reactor"
  | "maintenance";
export type NpcId = "mabel" | "holt" | "elena" | "tommy" | "marcus" | "priya" | "jordan";
export type RoleId = "transferred" | "promoted" | "military" | "veteran";
export type Mood = "warm" | "soft" | "tired" | "sharp" | "even" | "wry";
export type FloorKind = "wood" | "stone" | "grass" | "asphalt" | "metal" | "curb" | "stripe";
export type PropKind = string;

export type AcademyExtra =
  | "trainer"
  | "shuffle"
  | "fluids"
  | "alara"
  | "types"
  | "lab"
  | "export"
  | "anatomy"
  | "barriers"
  | "star"
  | "comms"
  | "reactivity"
  | "six"
  | "feedback"
  | "xenon"
  | "lototo"
  | "verify"
  | "conservative"
  | "period"
  | "beta"
  | "delay"
  | "rods"
  | "msr"
  | "phys"
  | "mc";
export type AcademyTrack = "culture" | "heat" | "safety" | "physics" | "fuel";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Choice {
  id: string;
  label: string;
  reply: string;
  trust?: number;
  culture?: number;
  flag?: string;
}

export interface Line {
  speaker: string;
  text: string;
  mood?: Mood;
  choices?: Choice[];
}

export interface AcademyPage {
  title: string;
  body: string;
  still: string;
  extra?: AcademyExtra;
  track?: AcademyTrack;
}

export interface Interactable {
  id: string;
  rect: Rect;
  label: string;
  kind:
    | "talk"
    | "academy"
    | "job"
    | "core"
    | "coffee"
    | "log"
    | "still"
    | "arcade"
    | "trainer"
    | "maint"
    | "shuffle"
    | "fish"
    | "plot"
    | "floor"
    | "horde"
    | "sit"
    | "delay"
    | "golf"
    | "rods"
    | "pebble"
    | "bowl"
    | "phys"
    | "load"
    | "scores";
  npc?: NpcId;
  still?: string;
}

export interface RoomDef {
  id: RoomId;
  name: string;
  w: number;
  h: number;
  muralH: number;
  art: string;
  floor: string;
  accent: string;
  grout: string;
  tile: number;
  floorKind: FloorKind;
  floorPatches?: { rect: Rect; kind: FloorKind }[];
  windows?: { rect: Rect; still: string }[];
  doors: { to: RoomId; rect: Rect; spawn: { x: number; y: number }; label: string }[];
  props: { rect: Rect; kind: string; label?: string; block?: boolean; hit?: Rect[] }[];
  interacts: Interactable[];
}

export interface NpcSlot {
  room: RoomId;
  x: number;
  y: number;
  face?: "left" | "right" | "up" | "down";
  radius?: number;
}

export interface NpcDef {
  id: NpcId;
  name: string;
  role: string;
  startTrust: number;
  note: string;
  portrait: { src: string; pos: string };
  meet: string;
}

function t(c: number, r: number, w: number, h: number): Rect {
  return { x: c * TILE, y: r * TILE, w: w * TILE, h: h * TILE };
}

/** Day-1 cafe spawn. South of the chairs so the player is not born inside a collider. */
export const CAFE_SPAWN = { x: 152, y: 220, facing: "up" as const };

export const ROLES: { id: RoleId; title: string; line: string }[] = [
  { id: "transferred", title: "Transferred Engineer", line: "New site, same physics. Watch the floor; grow where truth can be spoken." },
  { id: "promoted", title: "Recently Promoted", line: "The title is new. The hiss is not. Catch it cheap." },
  { id: "military", title: "Former Military", line: "Orders were a language. Here the catch is the order." },
  { id: "veteran", title: "Cautious Veteran", line: "You have seen a hide path. You did not like where it went." },
];

export const NPCS: Record<NpcId, NpcDef> = {
  mabel: {
    id: "mabel",
    name: "Dr. Mabel Quinn",
    role: "Cafe / retired floor",
    startTrust: 40,
    note: "Retired floor manager. Grandma warmth, doctorate steel.",
    portrait: { src: "/art/gen/portraits/mabel_talk.jpg?v=paint3", pos: "center" },
    meet: "Sit. The kettle is the last board I still touch.",
  },
  holt: {
    id: "holt",
    name: "Mr. Reginald Holt",
    role: "Director",
    startTrust: 28,
    note: "Funds reviews, not mythology. Volume, not a speech.",
    portrait: { src: "/art/gen/portraits/holt_talk.jpg?v=paint3", pos: "center" },
    meet: "You designed the core. Now walk it. Catch. I fund reviews, not mythology.",
  },
  elena: {
    id: "elena",
    name: "Elena Voss",
    role: "Shift supervisor",
    startTrust: 32,
    note: "Two sets of eyes. The van was here before dawn.",
    portrait: { src: "/art/gen/portraits/elena_talk.jpg?v=paint3", pos: "center" },
    meet: "I will back a catch if you stand where I can see you.",
  },
  tommy: {
    id: "tommy",
    name: "Tommy Reyes",
    role: "Maintenance",
    startTrust: 34,
    note: "LOTOTO is a sentence. Finish it.",
    portrait: { src: "/art/gen/portraits/tommy_talk.jpg?v=paint3", pos: "center" },
    meet: "Isolate. Lock. Tag. Try. IN SERVICE does not hang on a dead pump.",
  },
  marcus: {
    id: "marcus",
    name: "Marcus Hale",
    role: "Senior engineer",
    startTrust: 22,
    note: "Youngest senior once. Hates being wrong in public.",
    portrait: { src: "/art/gen/portraits/marcus_talk.jpg?v=paint3", pos: "center" },
    meet: "Two instruments. I was the youngest senior on this floor. That is not a compliment.",
  },
  priya: {
    id: "priya",
    name: "Dr. Priya Sharma",
    role: "Reactor engineering",
    startTrust: 36,
    note: "A peak on a screen is a rumor until you stand next to the tank.",
    portrait: { src: "/art/gen/portraits/priya_talk.jpg?v=paint3", pos: "center" },
    meet: "Teaching model — not a license. Heat has to leave.",
  },
  jordan: {
    id: "jordan",
    name: "Jordan Peck",
    role: "Floor tech",
    startTrust: 30,
    note: "Notices who shares a win. Wants distance from a hide.",
    portrait: { src: "/art/gen/portraits/jordan_talk.jpg?v=paint3", pos: "center" },
    meet: "I want distance. That was the deal. Share a catch if you have one.",
  },
};

export const NPC_INTRO: Record<NpcId, { who: string; meet: string; beat: string }> = {
  mabel: { who: "Dr. Mabel Quinn. Retired floor manager. Doctorate steel, grandma warmth. The cafe is the last board she still touches — kettle, cabinet, and the rule on the wall.", meet: NPCS.mabel.meet, beat: "Kettle. Cabinet. Catch." },
  holt: { who: "Mr. Reginald Holt. Director. He funds reviews, not mythology.", meet: NPCS.holt.meet, beat: "Volume. Not a speech." },
  elena: { who: "Elena Voss. Shift supervisor. Child seat. Cold coffee. She was here before dawn.", meet: NPCS.elena.meet, beat: "Two sets of eyes." },
  tommy: { who: "Tommy Reyes. Maintenance. LOTOTO is a sentence he will make you finish.", meet: NPCS.tommy.meet, beat: "Finish the sentence." },
  marcus: { who: "Marcus Hale. Senior engineer. Youngest senior on this floor once — that is not a compliment. Identity built on never being wrong in public.", meet: NPCS.marcus.meet, beat: "Two instruments." },
  priya: { who: "Dr. Priya Sharma. Reactor engineering. Still walks the floor. A peak on a screen is a rumor until she has stood next to the tank.", meet: NPCS.priya.meet, beat: "Heat has to leave." },
  jordan: { who: "Jordan Peck. Floor tech. Notices who shares a win.", meet: NPCS.jordan.meet, beat: "Share a catch." },
};

function slot(room: RoomId, x: number, y: number): NpcSlot {
  return { room, x, y };
}

export const NPC_SCHEDULE: Record<Period, Record<NpcId, NpcSlot>> = {
  morning: {
    mabel: slot("cafe", 210, 150),
    holt: slot("control", 120, 140),
    elena: slot("gate", 240, 200),
    tommy: slot("maintenance", 180, 160),
    marcus: slot("engineering", 160, 150),
    priya: slot("engineering", 240, 150),
    jordan: slot("breakroom", 140, 150),
  },
  midday: {
    mabel: slot("cafe", 210, 150),
    holt: slot("corridor", 160, 140),
    elena: slot("control", 200, 150),
    tommy: slot("maintenance", 180, 160),
    marcus: slot("engineering", 160, 150),
    priya: slot("control", 80, 150),
    jordan: slot("cafe", 100, 170),
  },
  afternoon: {
    mabel: slot("parlor", 80, 160),
    holt: slot("control", 120, 140),
    elena: slot("gate", 200, 220),
    tommy: slot("breakroom", 160, 150),
    marcus: slot("engineering", 200, 150),
    priya: slot("reactor", 64, 180),
    jordan: slot("parlor", 200, 170),
  },
};

export type IntroProp = "cup" | "lock" | "pencil";

export type IntroExchange = {
  line: string;
  /** object-position on the painted still */
  focus: string;
  zoom: number;
  /** small portrait lean, degrees */
  lean: number;
  prop?: IntroProp;
  /** This turn is the player. The named portrait stays for their replies. */
  you?: boolean;
};

export type IntroBeat = {
  scene: string;
  portrait: string;
  kicker: string;
  title: string;
  /** Persistent data footer. Does not change per exchange. */
  body: string;
  /** Use the badge the player just picked, not a baked bust. */
  you?: boolean;
  exchanges: IntroExchange[];
};

export const INTRO: IntroBeat[] = [
  {
    scene: "/art/gen/stills/intro_core.jpg",
    portrait: "/art/gen/portraits/priya_talk.jpg?v=paint3",
    kicker: "The core  ·  Priya",
    title: "You signed a core. Now it has to live.",
    body: "Teaching model — not a license. Heat still has to leave.",
    exchanges: [
      { you: true, line: "I signed Unit 1 on the sheet. I have not stood at the tank.", focus: "42% 78%", zoom: 1.14, lean: -2 },
      { line: "Priya, not looking up. “I will not sign a peak I cannot walk. You already did.”", focus: "22% 68%", zoom: 1.22, lean: 0 },
      { you: true, line: "Then walk me to the rail. I want the heat, not the plot.", focus: "74% 28%", zoom: 1.08, lean: 3 },
      { line: "She turns the sheet a quarter. “The stack is dark from here. Stand next to it. The heat still has to leave.”", focus: "50% 62%", zoom: 1.16, lean: 1 },
    ],
  },
  {
    scene: "/art/gen/stills/intro_cafe.jpg",
    portrait: "/art/gen/portraits/mabel_talk.jpg?v=paint3",
    kicker: "The cafe  ·  Mabel",
    title: "The kettle is still on from the night shift.",
    body: "Retired floor manager. The cafe is the last board she touches.",
    exchanges: [
      { line: "“Sit. Two-to-ten left this chair warm. I'm Mabel. I ran this floor twenty years.”", focus: "36% 48%", zoom: 1.06, lean: 0 },
      { you: true, line: "You're not on the board. Why is the kettle still yours?", focus: "58% 72%", zoom: 1.1, lean: 1 },
      { line: "The cup meets the tile. “I don't ask the board. I watch who won't sit.”", focus: "48% 40%", zoom: 1.2, lean: 2, prop: "cup" },
      { you: true, line: "Then I'll sit. Tell me who wouldn't.", focus: "22% 55%", zoom: 1.08, lean: -1 },
      { line: "“The ones with a catch in their pocket. The kettle is the last board I still touch.”", focus: "18% 32%", zoom: 1.12, lean: -2 },
    ],
  },
  {
    scene: "/art/gen/stills/intro_lot.jpg",
    portrait: "/art/gen/portraits/elena_talk.jpg?v=paint3",
    kicker: "The lot  ·  Elena",
    title: "Child seat first.",
    body: "Shift supervisor. The van was cold. The seat was not empty.",
    exchanges: [
      { line: "Elena, van door open. A nod. “Two sets of eyes. Or it isn't a catch.”", focus: "32% 64%", zoom: 1.1, lean: 2 },
      { you: true, line: "The child seat is still in the back. You didn't take it out.", focus: "70% 58%", zoom: 1.16, lean: -1 },
      { line: "She looks at the child seat, not at you. “Cold.”", focus: "46% 46%", zoom: 1.24, lean: -3 },
      { you: true, line: "You came from home. Then the gate.", focus: "78% 34%", zoom: 1.06, lean: 0 },
      { line: "“Child seat first. Then I was here. Stand where I can see your hands.”", focus: "28% 70%", zoom: 1.12, lean: 1 },
    ],
  },
  {
    scene: "/art/gen/stills/intro_wing.jpg",
    portrait: "/art/gen/portraits/tommy_talk.jpg?v=paint3",
    kicker: "The wing  ·  Tommy",
    title: "Finish the sentence.",
    body: "Maintenance. Pump two. The tag is the rest of the sentence.",
    exchanges: [
      { line: "Tommy taps the lock. “Pump two. Say LOTOTO out loud.”", focus: "72% 42%", zoom: 1.16, lean: 1, prop: "lock" },
      { you: true, line: "Lock. Tag. Try. The IN SERVICE card is still on the flange.", focus: "28% 50%", zoom: 1.08, lean: -1 },
      { line: "The tag turns on its ring. “Then pump two still thinks your hands are on it.”", focus: "64% 58%", zoom: 1.22, lean: -1 },
      { you: true, line: "I won't touch it until that sentence is finished.", focus: "18% 48%", zoom: 1.05, lean: 0 },
      { line: "“Good. Boring on purpose. That's how I keep a hand.”", focus: "80% 36%", zoom: 1.1, lean: 2 },
    ],
  },
  {
    scene: "/art/gen/stills/intro_bench.jpg",
    portrait: "/art/gen/portraits/marcus_talk.jpg?v=paint3",
    kicker: "The bench  ·  Marcus",
    title: "Two instruments.",
    body: "Senior engineer. Youngest on this floor, once. He was wrong out loud.",
    exchanges: [
      { line: "Marcus does not turn. “Left gauge. I trust the one under my hand.”", focus: "36% 38%", zoom: 1.14, lean: 0 },
      { you: true, line: "The one on the wall doesn't agree with it.", focus: "62% 42%", zoom: 1.08, lean: -1 },
      { line: "The pencil finds the grid. “I was wrong on this floor once. Out loud. Youngest senior.”", focus: "72% 68%", zoom: 1.18, lean: 2, prop: "pencil" },
      { you: true, line: "So I say the number before I defend it.", focus: "40% 30%", zoom: 1.08, lean: -2 },
      { line: "“That is not a compliment. If the two argue, do not pick the polite one.”", focus: "24% 55%", zoom: 1.12, lean: 1 },
    ],
  },
  {
    scene: "/art/gen/stills/intro_break.jpg",
    portrait: "/art/gen/portraits/jordan_talk.jpg?v=paint3",
    kicker: "The break  ·  Jordan",
    title: "Three tiles off the hide.",
    body: "Floor tech. He remembers who kept the catch.",
    exchanges: [
      { line: "Jordan watches the door, not you. “Say the catch out here. Not in your pocket.”", focus: "58% 42%", zoom: 1.1, lean: 3 },
      { you: true, line: "Three tiles off the hide. Is that still where we say it?", focus: "16% 40%", zoom: 1.12, lean: -2 },
      { line: "“That was the deal. I remember who kept the win. Same row as me.”", focus: "40% 62%", zoom: 1.14, lean: 1 },
      { you: true, line: "If I hide it, you won't sit next to me.", focus: "84% 38%", zoom: 1.06, lean: 1 },
      { line: "He does not look at the chair. “Distance. Bowl after shift only if the catch is already said.”", focus: "22% 48%", zoom: 1.08, lean: -1 },
    ],
  },
  {
    scene: "/art/gen/stills/intro_control.jpg",
    portrait: "/art/gen/portraits/holt_talk.jpg?v=paint3",
    kicker: "The board  ·  Holt",
    title: "Unit 1 is holding. You are not a hero today.",
    body: "Director. He funds the review. He does not fund the speech.",
    exchanges: [
      { line: "The lights are already up. He doesn't turn. “Unit 1 is already lit.”", focus: "34% 72%", zoom: 1.1, lean: 0 },
      { you: true, line: "I'm not here to be the hero of the board.", focus: "64% 70%", zoom: 1.16, lean: -2 },
      { line: "“Then don't give me a speech. A catch I can fund.”", focus: "48% 40%", zoom: 1.2, lean: 1 },
      { you: true, line: "I'll stand next to the line before I ask you to read it.", focus: "82% 28%", zoom: 1.06, lean: 1 },
      { line: "His hand stays off the log. “I'll read the line you stood next to. Not the one you performed.”", focus: "30% 55%", zoom: 1.1, lean: -1 },
    ],
  },
  {
    scene: "/art/gen/stills/intro_threshold.jpg?v=paint2",
    portrait: "/art/gen/portraits/player_talk.jpg?v=paint3",
    kicker: "The door  ·  You",
    title: "The hook is empty.",
    body: "Flavor. The floor does not care what the hoodie is called.",
    you: true,
    exchanges: [
      { line: "Your coat is still on you. The hook by the door is empty.", focus: "28% 42%", zoom: 1.08, lean: -1 },
      { line: "Yellow hard hat on the other peg. Not yours. The floor started without your name.", focus: "62% 30%", zoom: 1.16, lean: 1 },
      { line: "The door was open before you. The board is already lit.", focus: "72% 48%", zoom: 1.14, lean: 2 },
    ],
  },
];

export const INCIDENT = {
  title: "Valve 14 is talking",
  body: "Board A and the paper log do not agree. The hiss is not a personality. Report, peer-check, or hide. Teaching model — not a license.",
  report: "Elena: Logged. Two sets of eyes. That's a catch.",
  peer: "Elena: I'll back it. You stood where I could see you.",
  hide: "Jordan: You hid. I want distance. That was the deal.",
};

export function clockLabel(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function periodFromMinutes(minutes: number): Period {
  if (minutes < 11 * 60) return "morning";
  if (minutes < 14 * 60) return "midday";
  return "afternoon";
}

export function periodLabel(p: Period) {
  return p === "morning" ? "Morning" : p === "midday" ? "Midday" : "Afternoon";
}

export function cultureStage(n: number) {
  if (n < 16) return "brittle";
  if (n < 28) return "careful";
  if (n < 42) return "honest";
  return "held";
}

export function trustState(n: number) {
  if (n < 20) return "Wary";
  if (n < 40) return "Watching";
  if (n < 60) return "Working";
  return "With you";
}

export function relationLine(id: NpcId, flags: Record<string, boolean>, trust: number) {
  if (id === "mabel" && flags.mabelTalked) return "She kept the cafe so the floor had a place to tell the truth.";
  if (id === "holt") return trust > 40 ? "He will fund a review if the volume is honest." : "He is waiting for a catch, not a speech.";
  if (id === "elena") return flags.elenaSecondEyes ? "She will back a catch she can see." : "Two sets of eyes. Stand where she can see you.";
  if (id === "tommy") return "LOTOTO is a sentence. Finish it.";
  if (id === "marcus") return "Do not make him wrong in public unless the sticker is a liar.";
  if (id === "priya") return "Heat has to leave. Teaching only.";
  if (id === "jordan") return flags.hid ? "He wants distance from a hide." : "He notices who shares a win.";
  return trustState(trust);
}

export function talkLines(npc: NpcId, flags: Record<string, boolean>, culture: number, period: Period, day: number): Line[] {
  const first = !flags[`${npc}Talked`];
  const hid = !!flags.hid || !!flags.catchMiss;
  if (npc === "mabel") {
    if (!first) {
      return [
        { speaker: "Mabel", text: hid ? "You left a lie on the glass. I watched you not sit with it." : "The kettle is still honest. The chair remembers who used it as courage.", mood: "warm" },
        { speaker: "Mabel", text: "Two-to-ten is gone. I'm still the one who sees who won't sit. What do you need?", mood: "soft",
          choices: [
            { id: "mabel-sit", label: "Just the coffee.", reply: "On the house. The night shift already paid for the heat.", trust: 2, culture: 1 },
            { id: "mabel-catch", label: "Who wouldn't sit today?", reply: "The ones with a catch in their pocket. North wall is Unit 1. I'll chalk it if you say it out loud.", flag: "arcade" },
            { id: "mabel-load", label: "The load on the north wall.", reply: "You see the pulse. One rod, or one catch. The load is the opponent. I keep the score.", flag: "arcade" },
          ],
        },
      ];
    }
    return [
      { speaker: "Mabel", text: "Sit. Two-to-ten left this chair warm. I'm Mabel Quinn. I ran this floor twenty years.", mood: "warm" },
      { speaker: "Mabel", text: "I don't ask the board anymore. I watch who won't sit. The kettle is the last board I still touch.", mood: "soft" },
      { speaker: "Mabel", text: "Don't use the cup as courage. North wall is Unit 1. South is the parlor. Same bezel. I chalk who says the catch out loud.", mood: "even" },
      { speaker: "Mabel", text: "What do you need?",
        choices: [
          { id: "mabel-sit", label: "Just the coffee.", reply: "On the house. The night shift already paid for the heat. Don't use it as courage.", trust: 2, culture: 1 },
          { id: "mabel-catch", label: "Who won't sit?", reply: "The ones carrying a catch in their pocket. Eyes first. Clock second. I'll chalk the score.", flag: "arcade" },
          { id: "mabel-load", label: "The load on the north wall.", reply: "You see the pulse. One rod, or one catch. The load is the opponent. I keep the score. Twenty years of that, then the kettle.", flag: "arcade" },
        ],
      },
    ];
  }
  if (npc === "holt") {
    if (!first) {
      return [
        { speaker: "Holt", text: `Day ${day}. I still have not turned for a speech.`, mood: "sharp" },
        { speaker: "Holt", text: culture < 28 ? "Skill without a catch I can fund is unfinished power. Stand next to the line." : "Honest catches. That is a review I can fund. My hand stays off the log.", mood: "even" },
      ];
    }
    return [
      { speaker: "Holt", text: "Reginald Holt. You designed the core. I did not ask you to narrate it.", mood: "sharp" },
      { speaker: "Holt", text: "Unit 1 is already lit. I fund a review when the volume is a catch. Not a speech.", mood: "even" },
      { speaker: "Holt", text: "My hand stays off the log. I'll read the line you stood next to. Day one is not a duel.", mood: "sharp" },
    ];
  }
  if (npc === "elena") {
    if (!first) {
      return [
        { speaker: "Elena", text: flags.elenaSecondEyes ? "I saw your hands. I'll back that catch." : "Two sets of eyes. Stand where I can see you, or it isn't a catch.", mood: "even" },
        { speaker: "Elena", text: "The seat was cold this morning too. You are not the only one who came through that gate carrying a life.", mood: "soft" },
      ];
    }
    return [
      { speaker: "Elena", text: "Elena Voss. The van was here before dawn. Door's still open.", mood: "even" },
      { speaker: "Elena", text: "Look at the child seat, not at me. Cold. I will back a catch if you stand where I can see your hands.", mood: "soft" },
      { speaker: "Elena", text: "Child seat first. Then I was here. Two sets of eyes, or it isn't a catch.", mood: "even" },
    ];
  }
  if (npc === "tommy") {
    if (!first) {
      return [
        { speaker: "Tommy", text: "Finish the sentence before you ask me for a wrench. Boring on purpose.", mood: "even" },
        { speaker: "Tommy", text: day === 2 ? "Pump 2A. The hunt is on the board, not a checklist. IN SERVICE does not hang on a dead pump." : "If the tag isn't yours, pump two still thinks your hands are on it.", mood: "sharp" },
      ];
    }
    return [
      { speaker: "Tommy", text: "Tommy Reyes. Pump two. Say it. Isolate. Lock. Tag. Try.", mood: "even" },
      { speaker: "Tommy", text: "The IN SERVICE card does not get to stay on a dead pump. No tag, and the pump still thinks your hands are on it.", mood: "sharp" },
      { speaker: "Tommy", text: "Finish the sentence out loud. Then the wrench. That's how I keep a hand.", mood: "even" },
    ];
  }
  if (npc === "marcus") {
    if (!first) {
      return [
        { speaker: "Marcus", text: "Don't make me wrong in the hallway. I already did that once, out loud.", mood: "tired" },
        { speaker: "Marcus", text: day === 3 ? "If the sticker says 40, it is not a print error until the gauge under my hand agrees." : "Two instruments. If they argue, do not pick the polite one.", mood: "sharp" },
      ];
    }
    return [
      { speaker: "Marcus", text: "Marcus Hale. Left gauge. I trust the one under my hand, not the one on the wall.", mood: "tired" },
      { speaker: "Marcus", text: "I was the youngest senior on this floor. That is not a compliment. I was wrong here once. Out loud.", mood: "sharp" },
      { speaker: "Marcus", text: "Say the number before you defend it. Data, not the story that keeps me looking senior.", mood: "even" },
    ];
  }
  if (npc === "priya") {
    if (!first) {
      return [
        { speaker: "Priya", text: flags.physMcHeld ? "You ran analog MC. k ± σ. The bank is the clock. OpenMC stays a letter, and I still will not sign a peak I have not walked." : flags.physPlayed ? "You watched the pin. Leakage is the last two doors. Teaching analog — not a license." : "Heat has to leave. I have not changed my mind about a signature I cannot walk.", mood: "soft" },
        { speaker: "Priya", text: day >= 5 ? "Outage is Friday. Do not sign a shuffle you cannot walk to the rail." : "Academy first. Then my bench. The sheet is still a rumor until you stand next to the tank.", mood: "even" },
      ];
    }
    return [
      { speaker: "Priya", text: "Priya Sharma. I still walk the floor. A peak on a screen is a rumor until you have stood next to the tank.", mood: "soft" },
      { speaker: "Priya", text: "You signed Unit 1. I will not sign a peak I cannot walk. Come to the rail before you call it yours.", mood: "even" },
      { speaker: "Priya", text: "The stack can look dark from the cafe. The heat still has to leave. Teaching model — not a license.", mood: "soft" },
    ];
  }
  if (!first) {
    return [
      { speaker: "Jordan", text: hid ? "You hid. I want the chair empty next to me. That was the deal." : "Bowl after shift if the eyes are tired and the catch is already said.", mood: "even" },
      { speaker: "Jordan", text: "Three tiles off the hide. I remember who kept the win. Same row as me.", mood: "soft" },
    ];
  }
  return [
    { speaker: "Jordan", text: "Jordan Peck. I watch the door, not your face. Say the catch out here. Not in your pocket.", mood: "even" },
    { speaker: "Jordan", text: "Three tiles off the hide. That was the deal. I remember who kept the win. Same row as me.", mood: "soft" },
    { speaker: "Jordan", text: "Hide it and I want distance. Bowl after shift only if the catch is already said.", mood: "even" },
  ];
}

function still(src: string, title: string, body: string, extra: { video?: string; photo?: boolean; teaching?: boolean } = {}) {
  return { src, title, body, teaching: extra.teaching ?? true, video: extra.video, photo: extra.photo };
}

export const STILLS: Record<string, { src: string; title: string; body: string; teaching?: boolean; video?: string; photo?: boolean }> = {
  lake: still("/art/gen/stills/plate_lake.png?v=key", "Lake Master", "The stack is still breathing. Teaching plant, not a licensed layout."),
  cafe: still("/art/gen/stills/cafe_plate.png?v=eval1", "Criticality Cafe", "Sit first. The floor will still be there."),
  culture: still("/art/gen/stills/plate_culture.png?v=beauty", "Just Culture", "Mistakes are expected. Hiding them is the hazard."),
  peer: still("/art/gen/stills/peer.png?v=key", "Peer-check", "Two sets of eyes. Teaching only."),
  gate: still("/art/gen/stills/gate_plate.png?v=gate2", "Gate / Parking", "Elena's van. Child seat. Cold coffee."),
  corridor: still("/art/gen/stills/corridor_plate.png?v=key", "Main Corridor", "The spine of Unit 1."),
  control: still("/art/gen/stills/control_plate.png?v=key", "Control Room", "Board A and the paper log should agree."),
  reactor: still("/art/gen/stills/reactor_plate.png?v=metal", "Reactor Hall — operating floor", "CRDMs on the head. Insulated legs. Polar crane. Teaching only."),
  engineering: still("/art/gen/stills/engineering_plate.png?v=key", "Engineering Offices", "Priya's bench. Drawings are honest if the people are."),
  breakroom: still("/art/gen/stills/breakroom_plate.png?v=key", "Break Room", "A pause is not a hide."),
  maintenance: still("/art/gen/stills/maintenance_plate.png?v=metal", "Maintenance Wing", "Insulated run. Flange. Handwheel. Finish the sentence."),
  window_lake: still("/art/gen/stills/plate_lake.png?v=key", "Master's Power Station", "North glass. The lake holds."),
  window_control: still("/art/gen/stills/control_win.png?v=key", "Control glass", "Board A from the hall."),
  window_reactor: still("/art/gen/stills/glimpse_reactor.png?v=eval1", "Core window", "The vessel has names. CRDMs from above."),
  pwr: still("/art/gen/stills/plate_pwr.png?v=gauge", "PWR loop (this site)", "CRDMs on the head. Cold down the downcomer, core up, hot to the steam generator. Primary stays liquid ~16 MPa. Teaching only."),
  bwr: still("/art/gen/stills/plate_bwr.png?v=gauge", "BWR — teaching comparison", "One vessel does the boiling. Rods from below. ~7 MPa. Teaching only."),
  pebble: still("/art/gen/stills/plate_pebble.png?v=metal", "Pebble / TRISO — teaching comparison", "Fuel as 6 cm pebbles. Helium is the courier. The SiC is the pressure vessel of the particle."),
  msr: still("/art/gen/stills/plate_msr.png?v=metal", "MSR — teaching comparison", "Thermal circulating fuel. FLiBe + UF4, 7Li, freeze plug, off-gas. β_eff is smaller than β. Teaching only."),
  msr_fhr: still("/art/gen/stills/plate_msr.png?v=metal", "FHR — salt cools solid fuel", "Not a liquid-fuel MSR. TRISO pebbles. Salt is only the courier. Kairos-family teaching card."),
  msr_fast: still("/art/gen/stills/plate_msr.png?v=metal", "Fast chloride — no graphite", "Fuel dissolved in chloride salt. Compact pool. Freeze plug if circulating. Teaching only."),
  mural_catch: still("/art/gen/stills/plate_culture.png?v=beauty", "Catch > heroics", "Two sets of eyes and a clipboard. The catch is shared."),
  mural_criticality: still("/art/gen/stills/plate_pwr.png?v=gauge", "The core holds", "A living claim. Heat is born here."),
  mural_openmc: still("/art/gen/stills/plate_assembly.png?v=metal", "Lattice (teaching)", "Pins and a couple of guide tubes. A map, not a license."),
  alara: still("/art/gen/stills/plate_alara.png?v=beauty", "ALARA with eyes open", "Time, distance, shielding — and still seeing."),
  scales: still("/art/gen/stills/plate_assembly.png?v=metal", "Rod, assembly, core", "A pin is not a plant. Leakage is how k comes down."),
  shuffle: still("/art/gen/stills/plate_shuffle.png?v=beauty", "Fuel as a map", "Fresh on the rim. Burned toward the middle. Fq is a personality."),
  export: still("/art/gen/stills/plate_export.png?v=beauty", "Export is a letter", "A teaching letter to a code. Not a design basis."),
  dt: still("/art/gen/stills/plate_dt.png?v=beauty", "ΔT with your hands", "Hot leg out. Cold leg home. Hold twenty-eight to thirty-six."),
  barriers: still("/art/gen/stills/plate_barriers.png?v=beauty", "Four walls before the weather", "Fuel ceramic. Clad. RCPB. Containment."),
  star: still("/art/gen/stills/plate_star.png?v=beauty", "STAR — two sets of eyes", "Stop. Think. Act. Review."),
  comms: still("/art/gen/stills/plate_comms.png?v=beauty", "Three-way communication", "Sender. Receiver. Sender. A nod is how blanks get initials."),
  delayed: still("/art/gen/stills/plate_period.png?v=metal", "Delayed neutrons", "The wait is why a core has a period you can walk."),
  period: still("/art/gen/stills/plate_period.png?v=metal", "Reactor period", "T is the slope. $1 is a cliff."),
  six: still("/art/gen/stills/plate_six.png?v=metal", "Six-factor formula", "k∞ is four doors. Leakage is the last two."),
  feedback: still("/art/gen/stills/plate_doppler.png?v=metal", "Doppler and temperature", "The pellet argues first. The water argues later."),
  xenon: still("/art/gen/stills/plate_xenon.png?v=metal", "Xenon-135", "The iodine pit is a clock you do not get to skip."),
  reactivity: still("/art/gen/stills/plate_reactivity.png?v=beauty", "Reactivity management", "Hold it in time. Teaching proxy."),
  lototo: still("/art/gen/stills/plate_lototo.png?v=beauty", "LOTOTO — finish the sentence", "Lock. Tag. Try. Zero energy."),
  verify: still("/art/gen/stills/plate_verify.png?v=beauty", "Independent verification", "A second set of eyes. Not a nod."),
  conservative: still("/art/gen/stills/plate_stop.png?v=beauty", "Stop when unsure", "Stop-work is allowed. Faster is how occurrence reports get born."),
  scores: still("/art/gen/stills/glimpse_parlor.png?v=eval1", "Mabel's board", "Chalk and high scores. The parlor remembers. Teaching only."),
};

export const ACADEMY: AcademyPage[] = [
  { title: "Just Culture", still: "culture", track: "culture", body: "Mistakes are expected. Hiding them is the hazard. A catch while it is cheap is the product. Heroics are a lagging indicator that the room went quiet. Teaching model — not a license." },
  { title: "Heat has to leave", still: "pwr", extra: "fluids", track: "heat", body: "On this site (PWR): Q = ṁ × cp × ΔT. Cold leg in, downcomer down, core up, hot leg out. Primary stays liquid at ~16 MPa classroom. Teaching model — not a license." },
  { title: "The vessel has names", still: "pwr", extra: "anatomy", track: "heat", body: "A PWR pressure vessel holds the fuel, the water, and the control rods. Inlet nozzle, core barrel, downcomer, lower plenum, fuel, upper internals, outlet nozzle. Not a design basis." },
  { title: "ALARA with eyes open", still: "alara", extra: "alara", track: "safety", body: "Time, distance, shielding — and still seeing. Infinite distance is how rooms go blind. Binoculars from the platform. Two minutes. Then leave." },
  { title: "Four ways heat leaves", still: "reactor", extra: "types", track: "heat", body: "PWR, BWR, pebble, salt. Different plumbing. Same law: heat leaves. Comparison decks, not a shopping list. Teaching only — not a design basis." },
  { title: "Salt, three ways", still: "msr", extra: "msr", track: "heat", body: "Call it molten salt and people hear one machine. There are three. Thermal circulating fuel (this classroom). FHR (solid TRISO). Fast chloride (no graphite). Circulating fuel: β_eff is smaller than β. Teaching only — not a license." },
  { title: "Rod, assembly, core", still: "scales", extra: "lab", track: "physics", body: "A pin in an infinite lattice is not a plant. Leakage is how k comes down from k∞. Play PHYS.CAB — fission in the pellet, P1 diffusion at the edge. Priya will not sign a peak she cannot explain at three scales." },
  { title: "Fuel as a map", still: "shuffle", extra: "shuffle", track: "fuel", body: "Fresh on the edge. Burned toward the middle. Fq is a personality, not a score. Outage is Friday. Do not sign a shuffle you cannot walk." },
  { title: "Export is a letter, not a license", still: "export", extra: "export", track: "fuel", body: "The OpenMC script is a teaching letter to a code. It is not a design basis. Watermark stays on." },
  { title: "ΔT with your hands", still: "dt", extra: "trainer", track: "heat", body: "Priya's bench. Put heat into coolant until the numbers and the feeling agree." },
  { title: "Four barriers", still: "barriers", extra: "barriers", track: "safety", body: "Fuel ceramic. Clad. Reactor coolant pressure boundary. Containment. A catch on a tag is the cheap layer." },
  { title: "STAR — stop before the twist", still: "star", extra: "star", track: "safety", body: "Stop. Think. Act. Review. Questioning attitude is a protocol, not a personality. Stop-work is allowed." },
  { title: "Three-way communication", still: "comms", extra: "comms", track: "safety", body: "Sender speaks. Receiver repeats. Sender acknowledges. A nod is how blanks get initials." },
  { title: "Reactivity — hold it in time", still: "reactivity", extra: "reactivity", track: "physics", body: "β is the delayed fraction. Dollars are ρ/β. $1 is prompt-critical. Play DELAY.CAB. The cards have no clock." },
  { title: "Six-factor formula", still: "six", extra: "six", track: "physics", body: "k∞ = ε p f η. k_eff = k∞ · PNL. A pin is not a plant. Play PHYS.CAB — fission in the pellet, leak at the edge." },
  { title: "Monte Carlo methods", still: "export", extra: "mc", track: "physics", body: "Analog generation k. Histories, fission bank, k ± σ. 1/√G is the wait. Implicit capture is a transient, not a quiz. OpenMC stays a letter. Play analog MC in PHYS.CAB." },
  { title: "Temperature is a catch", still: "feedback", extra: "feedback", track: "physics", body: "Doppler is the pellet. MTC is the water. Two temperatures, two timescales." },
  { title: "Xenon and the iodine pit", still: "xenon", extra: "xenon", track: "physics", body: "Xe-135 is a poison with a clock. You do not get to skip the pit. Play LOAD.CAB — xenon follows power, the load is the opponent." },
  { title: "LOTOTO — lock, tag, try", still: "lototo", extra: "lototo", track: "safety", body: "Lock out. Tag out. Try out. Zero energy. A leftover IN SERVICE tag is how people go home late." },
  { title: "Independent verification", still: "verify", extra: "verify", track: "safety", body: "A second set of eyes. Not a nod. Teaching only." },
  { title: "Stop when unsure", still: "conservative", extra: "conservative", track: "safety", body: "Stop-work is allowed. Faster is how occurrence reports get born." },
  { title: "Reactor period", still: "period", extra: "period", track: "physics", body: "T is the slope. Delayed neutrons buy you the second. $1 spends them." },
  { title: "β, dollars, the cliff", still: "delayed", extra: "beta", track: "physics", body: "β ≈ 0.0065 U-235 thermal. ρ($) = ρ/β. Prompt-critical at $1. Circulating MSR: β_eff < β." },
];

export const ACADEMY_FUEL = ACADEMY.findIndex((p) => p.extra === "shuffle");

export const ROOMS: Record<RoomId, RoomDef> = {
  cafe: {
    id: "cafe",
    name: "Criticality Cafe",
    w: 20 * TILE,
    h: 16 * TILE,
    muralH: 48,
    art: "/art/gen/stills/glimpse_cafe.png?v=eval1",
    floor: "#3a2a1c",
    accent: "#c4783a",
    grout: "#2a1c14",
    tile: TILE,
    floorKind: "wood",
    windows: [{ rect: t(6, 0.4, 5, 2), still: "window_lake" }],
    doors: [
      { to: "gate", rect: t(19, 6, 1, 4), spawn: { x: 32, y: 200 }, label: "Lot" },
      { to: "parlor", rect: t(8, 15, 4, 1), spawn: { x: 176, y: 64 }, label: "Parlor" },
    ],
    props: [
      { rect: t(3, 6, 6, 3), kind: "counter" },
      { rect: t(9, 10, 2, 2), kind: "chair", block: false },
      { rect: t(12, 10, 2, 2), kind: "chair", block: false },
      { rect: t(15, 11, 2, 2), kind: "chair", block: false },
      { rect: t(14, 6, 5, 3), kind: "rug", block: false },
      { rect: t(1, 4, 2, 3), kind: "poster" },
      { rect: t(1, 1, 2, 2), kind: "poster", block: false },
      { rect: t(16, 1, 2, 2), kind: "poster", block: false },
      { rect: t(17, 4, 2, 3), kind: "plant" },
      { rect: t(1, 10, 2, 2), kind: "plant" },
      { rect: t(17, 10, 2, 2), kind: "lamp", block: false },
    ],
    interacts: [
      { id: "coffee", rect: t(3, 6, 6, 3), label: "Kettle", kind: "coffee" },
      { id: "sit-cafe", rect: t(9, 10, 2, 2), label: "Sit", kind: "sit" },
      { id: "still-cafe", rect: t(1, 4, 2, 3), label: "Look", kind: "still", still: "cafe" },
    ],
  },
  parlor: {
    id: "parlor",
    name: "Mabel's parlor",
    w: 24 * TILE,
    h: 16 * TILE,
    muralH: 48,
    art: "/art/gen/stills/glimpse_parlor.png?v=eval1",
    floor: "#3a2a1c",
    accent: "#c4783a",
    grout: "#2a1c14",
    tile: TILE,
    floorKind: "wood",
    windows: [],
    doors: [{ to: "cafe", rect: t(10, 0, 4, 1), spawn: { x: 160, y: 200 }, label: "Cafe" }],
    props: [
      { rect: t(1, 4, 2, 3), kind: "cab_catch", label: "Catch" },
      { rect: t(5, 4, 2, 3), kind: "cab_delay", label: "Delay" },
      { rect: t(9, 4, 2, 3), kind: "cab_rods", label: "Rods" },
      { rect: t(13, 4, 2, 3), kind: "cab_load", label: "Load" },
      { rect: t(17, 4, 2, 3), kind: "cab_phys", label: "Phys" },
      { rect: t(21, 4, 2, 3), kind: "cab_pebble", label: "Pebble" },
      { rect: t(1, 9, 2, 3), kind: "cab_fish", label: "Fish" },
      { rect: t(5, 9, 2, 3), kind: "cab_golf", label: "Golf" },
      { rect: t(9, 9, 2, 3), kind: "cab_bowl", label: "Bowl" },
      { rect: t(13, 9, 2, 3), kind: "cab_horde", label: "Horde" },
      { rect: t(17, 9, 2, 3), kind: "cab_plot", label: "Plot" },
      { rect: t(21, 9, 2, 3), kind: "cab_floor", label: "Board" },
      { rect: t(10, 13, 2, 2), kind: "chair", block: false },
    ],
    interacts: [
      { id: "cab-catch", rect: t(1, 4, 2, 3), label: "CATCH.CAB", kind: "arcade" },
      { id: "cab-delay", rect: t(5, 4, 2, 3), label: "DELAY.CAB", kind: "delay" },
      { id: "cab-rods", rect: t(9, 4, 2, 3), label: "ROD.BANK", kind: "rods" },
      { id: "cab-load", rect: t(13, 4, 2, 3), label: "LOAD.CAB", kind: "load" },
      { id: "cab-phys", rect: t(17, 4, 2, 3), label: "PHYS.CAB", kind: "phys" },
      { id: "cab-pebble", rect: t(21, 4, 2, 3), label: "PEBBLE.CAB", kind: "pebble" },
      { id: "cab-fish", rect: t(1, 9, 2, 3), label: "FISH.CAB", kind: "fish" },
      { id: "cab-golf", rect: t(5, 9, 2, 3), label: "GOLF.CAB", kind: "golf" },
      { id: "cab-bowl", rect: t(9, 9, 2, 3), label: "BOWL.CAB", kind: "bowl" },
      { id: "cab-horde", rect: t(13, 9, 2, 3), label: "HORDE.CAB", kind: "horde" },
      { id: "cab-plot", rect: t(17, 9, 2, 3), label: "PLOT.CAB", kind: "plot" },
      { id: "cab-floor", rect: t(21, 9, 2, 3), label: "MABEL.BOARD", kind: "scores" },
      { id: "sit-parlor", rect: t(10, 13, 2, 2), label: "Sit", kind: "sit" },
    ],
  },
  gate: {
    id: "gate",
    name: "Lot / Campus",
    w: 42 * TILE,
    h: 24 * TILE,
    muralH: 48,
    art: "/art/gen/stills/glimpse_gate.png?v=eval1",
    floor: "#2a2926",
    accent: "#c9a227",
    grout: "#1a1916",
    tile: TILE,
    floorKind: "grass",
    floorPatches: [
      { rect: t(10, 8, 22, 12), kind: "asphalt" },
      { rect: t(10, 19, 22, 1), kind: "curb" },
    ],
    windows: [],
    doors: [
      { to: "cafe", rect: t(0, 10, 1, 4), spawn: { x: 280, y: 160 }, label: "Cafe" },
      { to: "corridor", rect: t(41, 10, 1, 4), spawn: { x: 48, y: 160 }, label: "Hall" },
    ],
    props: [
      { rect: t(14, 12, 5, 3), kind: "van", label: "Elena's van" },
      { rect: t(30, 6, 3, 4), kind: "plant" },
      { rect: t(4, 8, 2, 3), kind: "plant" },
      { rect: t(22, 6, 1, 2), kind: "lamp", block: false },
      { rect: t(36, 14, 2, 2), kind: "lamp", block: false },
      { rect: t(6, 16, 4, 2), kind: "bench", block: false },
    ],
    interacts: [{ id: "commute", rect: t(14, 12, 5, 3), label: "The van", kind: "still", still: "gate" }],
  },
  corridor: {
    id: "corridor",
    name: "Main corridor",
    w: 24 * TILE,
    h: 16 * TILE,
    muralH: 48,
    art: "/art/gen/stills/glimpse_corridor.png?v=eval1",
    floor: "#2c3036",
    accent: "#8a7864",
    grout: "#1a1c20",
    tile: TILE,
    floorKind: "stone",
    windows: [{ rect: t(10, 0.4, 4, 2), still: "window_control" }],
    doors: [
      { to: "gate", rect: t(0, 6, 1, 4), spawn: { x: 640, y: 200 }, label: "Lot" },
      { to: "control", rect: t(10, 0, 4, 1), spawn: { x: 160, y: 220 }, label: "Control" },
      { to: "engineering", rect: t(10, 15, 4, 1), spawn: { x: 160, y: 64 }, label: "Eng" },
      { to: "breakroom", rect: t(23, 6, 1, 4), spawn: { x: 48, y: 150 }, label: "Break" },
    ],
    props: [
      { rect: t(2, 8, 2, 2), kind: "lamp" },
      { rect: t(4, 1, 2, 2), kind: "poster", block: false },
      { rect: t(18, 1, 2, 2), kind: "poster", block: false },
      { rect: t(20, 8, 2, 3), kind: "cabinet" },
      { rect: t(2, 12, 2, 2), kind: "plant" },
      { rect: t(6, 11, 3, 2), kind: "bench", block: false },
    ],
    interacts: [{ id: "still-hall", rect: t(18, 4, 2, 3), label: "Look", kind: "still", still: "corridor" }],
  },
  control: {
    id: "control",
    name: "Control room",
    w: 22 * TILE,
    h: 16 * TILE,
    muralH: 48,
    art: "/art/gen/stills/glimpse_control.png?v=eval1",
    floor: "#2b261d",
    accent: "#c9a227",
    grout: "#1a1814",
    tile: TILE,
    floorKind: "stone",
    windows: [{ rect: t(8, 0.4, 6, 2), still: "window_reactor" }],
    doors: [
      { to: "corridor", rect: t(9, 15, 4, 1), spawn: { x: 192, y: 48 }, label: "Hall" },
      { to: "reactor", rect: t(21, 6, 1, 4), spawn: { x: 48, y: 160 }, label: "Core" },
    ],
    props: [
      { rect: t(4, 5, 6, 3), kind: "board", label: "Board A" },
      { rect: t(14, 5, 3, 3), kind: "console" },
      { rect: t(1, 10, 2, 1), kind: "pipe_h" },
      { rect: t(2, 9, 1, 2), kind: "valve", label: "14" },
      { rect: t(6, 9, 2, 2), kind: "chair", block: false },
      { rect: t(18, 9, 2, 3), kind: "cabinet" },
      { rect: t(1, 1, 2, 2), kind: "prints", block: false },
      { rect: t(18, 3, 1, 2), kind: "lamp", block: false },
    ],
    interacts: [
      { id: "academy", rect: t(14, 5, 3, 3), label: "Academy terminal", kind: "academy" },
      { id: "board", rect: t(4, 5, 6, 3), label: "Board A", kind: "log" },
      { id: "shift-log", rect: t(11, 8, 2, 2), label: "Paper log", kind: "log" },
      { id: "valve", rect: t(2, 9, 2, 3), label: "Valve 14", kind: "job" },
    ],
  },
  engineering: {
    id: "engineering",
    name: "Engineering",
    w: 22 * TILE,
    h: 16 * TILE,
    muralH: 48,
    art: "/art/gen/stills/glimpse_engineering.png?v=eval1",
    floor: "#2a221b",
    accent: "#6b8f71",
    grout: "#1a1410",
    tile: TILE,
    floorKind: "wood",
    windows: [{ rect: t(8, 0.4, 5, 2), still: "window_lake" }],
    doors: [
      { to: "corridor", rect: t(9, 0, 4, 1), spawn: { x: 192, y: 200 }, label: "Hall" },
      { to: "maintenance", rect: t(21, 6, 1, 4), spawn: { x: 48, y: 160 }, label: "Maint" },
    ],
    props: [
      { rect: t(4, 6, 4, 3), kind: "desk" },
      { rect: t(12, 6, 4, 3), kind: "bench" },
      { rect: t(18, 10, 2, 2), kind: "prints" },
      { rect: t(1, 5, 2, 3), kind: "cabinet" },
      { rect: t(6, 10, 2, 2), kind: "chair", block: false },
      { rect: t(15, 1, 4, 2), kind: "board", label: "Whiteboard", block: false },
      { rect: t(1, 1, 2, 2), kind: "poster", block: false },
      { rect: t(19, 4, 2, 2), kind: "plant" },
      { rect: t(8, 10, 2, 2), kind: "lamp", block: false },
    ],
    interacts: [
      { id: "trainer", rect: t(12, 6, 4, 3), label: "ΔT bench", kind: "trainer" },
      { id: "shuffle", rect: t(4, 6, 4, 3), label: "Fuel desk", kind: "shuffle" },
      { id: "phys", rect: t(18, 10, 2, 2), label: "Pin cell", kind: "phys" },
    ],
  },
  breakroom: {
    id: "breakroom",
    name: "Break room",
    w: 18 * TILE,
    h: 14 * TILE,
    muralH: 48,
    art: "/art/gen/stills/glimpse_breakroom.png?v=eval1",
    floor: "#3a2a1c",
    accent: "#c4783a",
    grout: "#2a1c14",
    tile: TILE,
    floorKind: "wood",
    windows: [{ rect: t(6, 0.4, 5, 2), still: "window_lake" }],
    doors: [
      { to: "corridor", rect: t(0, 5, 1, 4), spawn: { x: 340, y: 140 }, label: "Hall" },
      { to: "reactor", rect: t(17, 5, 1, 4), spawn: { x: 48, y: 180 }, label: "Core" },
    ],
    props: [
      { rect: t(6, 6, 3, 2), kind: "kettle" },
      { rect: t(10, 8, 2, 2), kind: "couch" },
      { rect: t(3, 8, 2, 2), kind: "vending" },
    ],
    interacts: [{ id: "coffee-break", rect: t(6, 6, 3, 2), label: "Kettle", kind: "coffee" }],
  },
  reactor: {
    id: "reactor",
    name: "Reactor hall",
    w: 22 * TILE,
    h: 16 * TILE,
    muralH: 48,
    art: "/art/gen/stills/reactor_plate.png?v=metal",
    floor: "#1c2a2c",
    accent: "#6b8f71",
    grout: "#0a1414",
    tile: TILE,
    floorKind: "metal",
    windows: [{ rect: t(8, 0.4, 6, 2), still: "window_reactor" }],
    doors: [
      { to: "control", rect: t(0, 6, 1, 4), spawn: { x: 300, y: 140 }, label: "Control" },
      { to: "breakroom", rect: t(0, 11, 1, 3), spawn: { x: 250, y: 140 }, label: "Break" },
      { to: "maintenance", rect: t(9, 15, 4, 1), spawn: { x: 160, y: 64 }, label: "Maint" },
    ],
    props: [
      { rect: t(4, 3, 14, 1), kind: "crane", label: "Polar crane", block: false },
      { rect: t(9, 4, 5, 5), kind: "core", label: "Vessel", hit: [
        // Opaque tower only. The 80×80 tile box's shoulders are empty floor.
        { x: 164, y: 64, w: 40, h: 28 },
        // Opaque base. Stops above the railing so the south lane stays a lane.
        { x: 146, y: 92, w: 74, h: 46 },
      ] },
      { rect: t(14, 6, 3, 1), kind: "pipe_run", label: "Hot leg" },
      { rect: t(17, 6, 1, 1), kind: "pipe_corner" },
      { rect: t(17, 7, 1, 4), kind: "pipe_v" },
      { rect: t(6, 7, 3, 1), kind: "pipe_run", label: "Cold leg" },
      { rect: t(5, 6, 1, 2), kind: "valve", label: "14", hit: [{ x: 80, y: 104, w: 16, h: 24 }] },
      { rect: t(9, 9, 3, 1), kind: "railing" },
      { rect: t(12, 9, 3, 1), kind: "railing" },
      { rect: t(16, 4, 1, 2), kind: "lamp" },
      { rect: t(2, 8, 2, 3), kind: "cabinet", hit: [{ x: 36, y: 144, w: 24, h: 32 }] },
      { rect: t(2, 1, 2, 2), kind: "poster", block: false },
      { rect: t(18, 10, 2, 2), kind: "console", block: false },
    ],
    interacts: [
      { id: "core", rect: t(9, 4, 5, 5), label: "The vessel", kind: "core" },
      { id: "hot-leg", rect: t(14, 6, 3, 1), label: "Hot leg", kind: "still", still: "pwr" },
      { id: "cold-leg", rect: t(6, 7, 3, 1), label: "Cold leg", kind: "still", still: "pwr" },
    ],
  },
  maintenance: {
    id: "maintenance",
    name: "Maintenance wing",
    w: 22 * TILE,
    h: 16 * TILE,
    muralH: 48,
    art: "/art/gen/stills/maintenance_plate.png?v=metal",
    floor: "#1e2a2e",
    accent: "#3d5c66",
    grout: "#0a1214",
    tile: TILE,
    floorKind: "metal",
    floorPatches: [{ rect: t(2, 8, 16, 1), kind: "asphalt" }],
    windows: [],
    doors: [
      { to: "reactor", rect: t(9, 0, 4, 1), spawn: { x: 176, y: 200 }, label: "Core" },
      { to: "engineering", rect: t(0, 6, 1, 4), spawn: { x: 300, y: 140 }, label: "Eng" },
    ],
    props: [
      { rect: t(3, 5, 6, 1), kind: "pipe_run", label: "Primary run" },
      { rect: t(9, 5, 2, 1), kind: "pipe_h" },
      { rect: t(11, 5, 1, 1), kind: "pipe_corner" },
      { rect: t(11, 6, 1, 4), kind: "pipe_v" },
      { rect: t(16, 5, 2, 3), kind: "cab_lototo", label: "LOTOTO" },
      { rect: t(14, 8, 1, 1), kind: "dose", label: "Sticker" },
      { rect: t(7, 8, 1, 2), kind: "valve", label: "14" },
      { rect: t(5, 10, 2, 1), kind: "pipe_h" },
      { rect: t(2, 10, 3, 1), kind: "railing" },
      { rect: t(18, 9, 2, 3), kind: "cabinet" },
      { rect: t(3, 12, 4, 2), kind: "bench" },
      { rect: t(14, 12, 2, 2), kind: "cabinet" },
      { rect: t(2, 1, 2, 2), kind: "poster", block: false },
      { rect: t(8, 1, 2, 2), kind: "prints", block: false },
      { rect: t(19, 3, 1, 2), kind: "lamp", block: false },
    ],
    interacts: [
      { id: "maint", rect: t(16, 5, 2, 3), label: "LOTOTO board", kind: "maint" },
      { id: "dose", rect: t(14, 8, 1, 1), label: "Dose sticker", kind: "job" },
      { id: "pipe-run", rect: t(3, 5, 6, 1), label: "Primary run", kind: "still", still: "pwr" },
    ],
  },
};
