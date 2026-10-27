import { TILE } from "./const";

export const TITLE = "Coffee & Criticality";
export const TAGLINE = "A week on Unit 1. Catch greater than heroics.";
export const THESIS = "A reactor only makes power in the right environment. People are the same. Teaching model — not a license.";
export const SITE = "Lake Master teaching plant";

export type Period = "morning" | "midday" | "afternoon";

export type ResidueHow = "open" | "caught" | "hid";

export interface Residue {
  valve: ResidueHow;
  tag: ResidueHow;
  dose: ResidueHow;
  log: ResidueHow;
}

export function emptyResidue(): Residue {
  return { valve: "open", tag: "open", dose: "open", log: "open" };
}

export function residueKey(day: number): keyof Residue | null {
  if (day === 1) return "valve";
  if (day === 2) return "tag";
  if (day === 3) return "dose";
  if (day === 4) return "log";
  return null;
}

export function anyHid(r: Residue) {
  return r.valve === "hid" || r.tag === "hid" || r.dose === "hid" || r.log === "hid";
}
export type RoomId =
  | "cafe"
  | "parlor"
  | "gate"
  | "security"
  | "corridor"
  | "control"
  | "engineering"
  | "breakroom"
  | "reactor"
  | "maintenance";
export type NpcId = "mabel" | "holt" | "elena" | "tommy" | "marcus" | "priya" | "jordan";
export type RoleId = "transferred" | "promoted" | "military" | "veteran";
export type Mood = "warm" | "soft" | "tired" | "sharp" | "even" | "wry";
export type FloorKind = "wood" | "stone" | "grass" | "asphalt" | "metal" | "curb" | "stripe" | "water";
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
    | "scores"
    | "guard"
    | "badge"
    | "tld"
    | "xray"
    | "portal"
    | "desk";
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
  doors: { to: RoomId; rect: Rect; spawn?: { x: number; y: number }; label: string }[];
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

/** Day-2, once, in Mabel's mouth. The menu keeps ROLES.line. She does not recite the poster. */
export function roleMouth(role: RoleId): string {
  if (role === "promoted") return "The title is new. The hiss is not. I am listening for the catch.";
  if (role === "military") return "The catch is the order here. Not the rank.";
  if (role === "veteran") return "You have seen a hide. I am watching whether you do it again.";
  return "New site. I'll know you by what you say out loud.";
}

export const NPCS: Record<NpcId, NpcDef> = {
  mabel: {
    id: "mabel",
    name: "Dr. Mabel Quinn",
    role: "Cafe / retired floor",
    startTrust: 40,
    note: "Retired floor manager. Grandma warmth, doctorate steel.",
    portrait: { src: "/art/ui/portraits/portrait-mabel-smile.png", pos: "center" },
    meet: "Sit. The kettle is the last board I still touch.",
  },
  holt: {
    id: "holt",
    name: "Mr. Reginald Holt",
    role: "Director",
    startTrust: 28,
    note: "Funds reviews, not mythology. Volume, not a speech.",
    portrait: { src: "/art/ui/portraits/portrait-holt-smile.png", pos: "center" },
    meet: "You designed the core. Now walk it. Catch. I fund reviews, not mythology.",
  },
  elena: {
    id: "elena",
    name: "Elena Voss",
    role: "Shift supervisor",
    startTrust: 32,
    note: "Two sets of eyes. The van was here before dawn.",
    portrait: { src: "/art/ui/portraits/portrait-elena-smile.png", pos: "center" },
    meet: "I will back a catch if you stand where I can see you.",
  },
  tommy: {
    id: "tommy",
    name: "Tommy Reyes",
    role: "Maintenance",
    startTrust: 34,
    note: "LOTOTO is a sentence. Finish it.",
    portrait: { src: "/art/ui/portraits/portrait-tommy-smile.png", pos: "center" },
    meet: "Isolate. Lock. Tag. Try. IN SERVICE does not hang on a dead pump.",
  },
  marcus: {
    id: "marcus",
    name: "Marcus Hale",
    role: "Senior engineer",
    startTrust: 22,
    note: "Youngest senior once. Hates being wrong in public.",
    portrait: { src: "/art/ui/portraits/portrait-marcus-smile.png", pos: "center" },
    meet: "Two instruments. I was the youngest senior on this floor. That is not a compliment.",
  },
  priya: {
    id: "priya",
    name: "Dr. Priya Sharma",
    role: "Reactor engineering",
    startTrust: 36,
    note: "A peak on a screen is a rumor until you stand next to the tank.",
    portrait: { src: "/art/ui/portraits/portrait-priya-smile.png", pos: "center" },
    meet: "Teaching model — not a license. Heat has to leave.",
  },
  jordan: {
    id: "jordan",
    name: "Jordan Peck",
    role: "Floor tech",
    startTrust: 30,
    note: "Notices who shares a win. Wants distance from a hide.",
    portrait: { src: "/art/ui/portraits/portrait-jordan-smile.png", pos: "center" },
    meet: "I want distance. That was the deal. Share a catch if you have one.",
  },
};

export const NPC_INTRO: Record<NpcId, { who: string; meet: string; beat: string }> = {
  mabel: { who: "She poured before you spoke. Chalk only moves for a catch.", meet: NPCS.mabel.meet, beat: "Cup, then chalk." },
  holt: { who: "He funds the line. He will not fund the introduction.", meet: NPCS.holt.meet, beat: "Ink already spent." },
  elena: { who: "She places boots. The van door has been open since before dawn.", meet: NPCS.elena.meet, beat: "The van counts too." },
  tommy: { who: "He talks to flanges. People get the short version.", meet: NPCS.tommy.meet, beat: "Dead flange." },
  marcus: { who: "Youngest senior once. He still won't turn for a soft number.", meet: NPCS.marcus.meet, beat: "The ugly number." },
  priya: { who: "A peak is a rumor until her shoes are next to the tank.", meet: NPCS.priya.meet, beat: "Feet, then the peak." },
  jordan: { who: "He remembers who said the win where the door could hear it.", meet: NPCS.jordan.meet, beat: "The door keeps score." },
};

function slot(room: RoomId, x: number, y: number): NpcSlot {
  return { room, x, y };
}

export const NPC_SCHEDULE: Record<Period, Record<NpcId, NpcSlot>> = {
  morning: {
    mabel: slot("cafe", 210, 150),
    holt: slot("control", 120, 140),
    elena: slot("gate", 400, 280),
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
    elena: slot("gate", 380, 300),
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
    scene: "/art/intro/scene-core.png",
    portrait: "/art/ui/portraits/portrait-priya-talk.png",
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
    scene: "/art/intro/scene-cafe.png",
    portrait: "/art/ui/portraits/portrait-mabel-talk.png",
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
    scene: "/art/intro/scene-lot.png",
    portrait: "/art/ui/portraits/portrait-elena-talk.png",
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
    scene: "/art/intro/scene-wing.png",
    portrait: "/art/ui/portraits/portrait-tommy-talk.png",
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
    scene: "/art/intro/scene-bench.png",
    portrait: "/art/ui/portraits/portrait-marcus-talk.png",
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
    scene: "/art/intro/scene-break.png",
    portrait: "/art/ui/portraits/portrait-jordan-talk.png",
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
    scene: "/art/intro/scene-control.png",
    portrait: "/art/ui/portraits/portrait-holt-talk.png",
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
    scene: "/art/intro/scene-threshold.png",
    portrait: "/art/ui/portraits/portrait-player-talk.png",
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
  /* Stage 2c, Site Access. Not part of the opening: the game plays these in the lobby (see security.ts). */
  {
    scene: "/art/intro/scene-security.png",
    portrait: "/art/ui/portraits/portrait-dee-talk.png",
    kicker: "Site Access  ·  Dee",
    title: "Nobody walks past me without a badge.",
    body: "Site security. The plant manager waits in the same line.",
    exchanges: [
      { line: "Dee, not looking up. “Morning. Not you, not the plant manager. Three stops: badge, dosimeter, portal. Follow the blue line.”", focus: "50% 0%", zoom: 1.1, lean: 0 },
    ],
  },
  {
    scene: "/art/intro/scene-kiosk.png",
    portrait: "/art/ui/portraits/portrait-dee-smile.png",
    kicker: "Badges  ·  Dee",
    title: "Look at the lens. Do not smile.",
    body: "The kiosk takes one photo. It keeps it for years.",
    exchanges: [
      { line: "“It is a badge, not a yearbook. Your picture, your number, your dosimeter slot. Lose it and you write a report.”", focus: "50% 0%", zoom: 1.1, lean: 0 },
    ],
  },
  {
    scene: "/art/intro/scene-iris.png",
    portrait: "/art/ui/portraits/portrait-dee-talk.png",
    kicker: "The Portal  ·  Dee",
    title: "Look at the light. Hold still.",
    body: "It reads the pattern in the iris, not the colour.",
    exchanges: [
      { line: "“It reads the pattern in your iris, not the colour. Enroll once. After that it takes a second.”", focus: "50% 15%", zoom: 1.1, lean: 0 },
    ],
  },
  {
    scene: "/art/intro/scene-desk.png",
    portrait: "/art/ui/portraits/portrait-priya-smile.png",
    kicker: "Engineering  ·  Priya",
    title: "That one is yours.",
    body: "The nameplate is brand new. The CRT is not.",
    exchanges: [
      { line: "“The nameplate is brand new. The CRT is not. The drawings are honest if the people are.”", focus: "50% 23%", zoom: 1.1, lean: 0 },
    ],
  },
];

/** INTRO[0 .. INTRO_STORY-1] is the opening. The rest are Site Access beats, played in the lobby and the Engineering office. */
export const INTRO_STORY = 8;
export const SITE_BEAT = { security: 8, badge: 9, iris: 10, desk: 11 } as const;

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

/** How two people stand with each other. Only after you have met both. Does not move trust. */
export function floorTies(residue: Residue, flags: Record<string, boolean>): { pair: string; line: string }[] {
  const met = (id: NpcId) => !!flags[`${id}Talked`];
  const ties: { pair: string; line: string }[] = [];
  const push = (a: NpcId, b: NpcId, pair: string, line: string) => {
    if (met(a) && met(b)) ties.push({ pair, line });
  };
  const hid = anyHid(residue);

  push(
    "elena",
    "jordan",
    "Elena · Jordan",
    hid
      ? "Jordan took the far side. Elena is still counting hands."
      : residue.valve === "caught"
        ? "Elena saw the hands. Jordan will take the same row."
        : "Elena wants the hands. Jordan wants it said at the door.",
  );
  push(
    "mabel",
    "jordan",
    "Mabel · Jordan",
    hid ? "Mabel watched the chair. Jordan left it." : "Mabel keeps the chalk. Jordan keeps the row.",
  );
  push(
    "holt",
    "elena",
    "Holt · Elena",
    residue.valve === "hid"
      ? "Elena is on the van. Holt will not fund what she did not see."
      : residue.valve === "caught"
        ? "Elena saw the hands. Holt can read that line."
        : "Elena has not called it. Holt has nothing to buy.",
  );
  push(
    "mabel",
    "elena",
    "Mabel · Elena",
    residue.valve === "caught"
      ? "Elena left the van. Mabel can chalk the hands."
      : residue.valve === "hid"
        ? "Elena stayed on the van. Mabel watched you not sit."
        : "Elena counts hands. Mabel waits for one said out loud.",
  );
  push(
    "tommy",
    "marcus",
    "Tommy · Marcus",
    residue.tag === "hid" || residue.dose === "hid"
      ? "A lie is still on the wall. They will not dress it."
      : residue.tag === "caught" && residue.dose === "caught"
        ? "Tag down. Forty said. They will both turn."
        : "Tommy wants the sentence. Marcus wants the number.",
  );
  push(
    "priya",
    "marcus",
    "Priya · Marcus",
    residue.dose === "hid"
      ? "The sticker still says 40. Priya will not sign past it."
      : residue.dose === "caught"
        ? "Marcus said forty. Priya still wants the rail."
        : "Marcus has not turned. Priya has not walked it.",
  );
  push(
    "priya",
    "holt",
    "Priya · Holt",
    hid
      ? "Priya will not sign. Holt will not fund the blank."
      : residue.log === "caught"
        ? "Holt will read the line. Priya still walks it."
        : "Holt wants a line. Priya wants feet on the metal.",
  );
  return ties;
}

export interface WeekVoice {
  catches: number;
  hides: number;
  reports: number;
  trust: number;
}

const QUIET_WEEK: WeekVoice = { catches: 0, hides: 0, reports: 0, trust: 0 };

function spin(day: number, lines: readonly string[]) {
  return lines[(Math.max(1, day) - 1) % lines.length] ?? lines[0];
}

export function talkLines(
  npc: NpcId,
  flags: Record<string, boolean>,
  culture: number,
  _period: Period,
  day: number,
  role: RoleId | null,
  residue: Residue,
  ending: boolean,
  ended: "a" | "c" | null,
  week: WeekVoice = QUIET_WEEK,
): Line[] {
  if (ending) return endingLines(npc, residue, ended, week);
  const first = !flags[`${npc}Talked`];
  const hid = anyHid(residue) || !!flags.hid || !!flags.catchMiss;
  if (npc === "mabel") {
    if (!first) {
      const caughtWeek = residue.valve === "caught" || residue.tag === "caught" || residue.dose === "caught" || residue.log === "caught";
      const lines: Line[] = [
        {
          speaker: "Mabel",
          text: hid
            ? "You left a lie on the glass. I watched you not sit with it."
            : day >= 3 && caughtWeek
              ? "You sat with the last one. The kettle is still on."
              : spin(day, [
                  "The chair remembers who used the cup as courage.",
                  "Kettle's on. The chair is empty.",
                  "North wall still wants the catch out loud.",
                ]),
          mood: hid ? "sharp" : "warm",
        },
      ];
      if (day === 2 && role && !flags.roleHeard) {
        lines.push({ speaker: "Mabel", text: roleMouth(role), mood: "even" });
      } else if (!hid) {
        lines.push({
          speaker: "Mabel",
          text: "What do you need?",
          mood: "soft",
          choices: [
            { id: "mabel-sit", label: "Just the coffee.", reply: "On the house. The night shift already paid for the heat.", trust: 2, culture: 1 },
            { id: "mabel-catch", label: "Who wouldn't sit today?", reply: "The ones with a catch in their pocket. North wall is Unit 1. I'll chalk it if you say it out loud.", flag: "arcade" },
            { id: "mabel-load", label: "The load on the north wall.", reply: "You see the pulse. One rod, or one catch. The load is the opponent. I keep the score.", flag: "arcade" },
          ],
        });
      }
      return lines;
    }
    return [
      { speaker: "Mabel", text: "Cup's poured. Sit before the name.", mood: "warm" },
      { speaker: "Mabel", text: "Dr. Mabel Quinn. I ran this floor — the kettle is what's left of the board.", mood: "soft" },
      { speaker: "Mabel", text: "Say one catch out loud today. I chalk what gets said — a pocket does not.", mood: "even" },
      {
        speaker: "Mabel",
        text: "Coffee, or the chalk?",
        mood: "warm",
        choices: [
          { id: "mabel-sit", label: "Just the coffee.", reply: "On the house. Don't use it as courage.", trust: 2, culture: 1 },
          { id: "mabel-catch", label: "Who won't sit?", reply: "The ones carrying a catch in their pocket. I'll chalk it if you say it.", trust: 1, flag: "arcade" },
          { id: "mabel-load", label: "I'll say one out loud.", reply: "Then the chalk moves. North wall is Unit 1.", trust: 2, flag: "arcade" },
        ],
      },
      { speaker: "Mabel", text: "Chalk's for this room. Pockets don't get a mark.", mood: "even" },
    ];
  }
  if (npc === "holt") {
    if (!first) {
      if (residue.log === "hid") return [{ speaker: "Holt", text: "Your initials are on a blank. I will not fund that.", mood: "sharp" }];
      if (residue.log === "caught") {
        const lines: Line[] = [{ speaker: "Holt", text: "I will read the line. My hand stays off it.", mood: "even" }];
        if (culture >= 28) lines.push({ speaker: "Holt", text: "Honest catches. That is a review I can fund.", mood: "even" });
        return lines;
      }
      return [
        {
          speaker: "Holt",
          text: spin(day, [
            `Day ${day}. Stand next to a line I can fund.`,
            "The log is still blank. So is the check.",
            "Volume. Not a speech. I am still waiting.",
          ]),
          mood: "sharp",
        },
        {
          speaker: "Holt",
          text: spin(day, [
            "A blank does not get a signature from me.",
            "I fund the line. Not the story around it.",
            `Day ${day}. Still no line.`,
          ]),
          mood: "even",
        },
      ];
    }
    return [
      { speaker: "Holt", text: "Skip the hello. The org chart already spent the ink.", mood: "sharp" },
      { speaker: "Holt", text: "Reginald Holt. I direct the site, and I buy the line, not the person.", mood: "even" },
      { speaker: "Holt", text: "Stand next to a number today. That is the only thing I can fund.", mood: "sharp" },
      {
        speaker: "Holt",
        text: "Well?",
        mood: "sharp",
        choices: [
          { id: "holt-line", label: "Here's the line.", reply: "Then I will read it. Not the speech around it.", trust: 2 },
          { id: "holt-review", label: "I need a review.", reply: "Bring the volume. Then we talk about the check.", trust: 1 },
          { id: "holt-later", label: "Not today.", reply: "Then the log stays blank. I do not fund a blank.", flag: "holtDeferred" },
        ],
      },
      { speaker: "Holt", text: "Leave the speech in the hall.", mood: "even" },
    ];
  }
  if (npc === "elena") {
    if (!first) {
      if (residue.valve === "hid") return [{ speaker: "Elena", text: "I'm still looking at the van.", mood: "even" }];
      if (residue.valve === "caught" || flags.elenaSecondEyes) {
        const lines: Line[] = [{ speaker: "Elena", text: "I saw your hands. I'll back that catch.", mood: "soft" }];
        if (day >= 2) lines.push({ speaker: "Elena", text: "I am not looking at the van anymore.", mood: "soft" });
        return lines;
      }
      return [
        {
          speaker: "Elena",
          text: spin(day, [
            "Stand where I can see your hands.",
            "The van hasn't moved. Neither have I.",
            "Eyes on you. That's the job today.",
          ]),
          mood: "even",
        },
        {
          speaker: "Elena",
          text: spin(day, ["Not the pocket. The hands.", "Door's open. I stayed.", "I count the hands. Not the stories."]),
          mood: "even",
        },
      ];
    }
    return [
      { speaker: "Elena", text: "Boots on the paint. I don't do doorways.", mood: "even" },
      { speaker: "Elena", text: "Elena Voss. I put people where they can be seen. That's the whole job.", mood: "even" },
      { speaker: "Elena", text: "That van's been open since before dawn. Cupholder's cold. Somebody sat there and left.", mood: "soft" },
      {
        speaker: "Elena",
        text: "Look at it.",
        mood: "even",
        choices: [
          { id: "elena-seat", label: "The child seat.", reply: "Good. Eyes before opinions.", trust: 2 },
          { id: "elena-whose", label: "Whose van is it?", reply: "Mine. Next question, you'll like it less.", trust: 1 },
          { id: "elena-reactor", label: "I'm here for the reactor.", reply: "Everybody is. Today the van is the reactor.", flag: "elenaReactor" },
        ],
      },
      { speaker: "Elena", text: "Both hands where the van can see them. Then it's a catch.", mood: "even" },
    ];
  }
  if (npc === "tommy") {
    if (!first) {
      if (residue.tag === "caught") {
        const lines: Line[] = [{ speaker: "Tommy", text: "The tag is down. Pump two can stay quiet.", mood: "even" }];
        if (day >= 3) lines.push({ speaker: "Tommy", text: "You can ask for the wrench.", mood: "even" });
        return lines;
      }
      if (residue.tag === "hid") return [{ speaker: "Tommy", text: "IN SERVICE is still on the flange.", mood: "sharp" }];
      if (day === 2) {
        return [
          { speaker: "Tommy", text: "Pump 2A. The hunt is on the board.", mood: "sharp" },
          { speaker: "Tommy", text: "The tag is still the sentence.", mood: "even" },
        ];
      }
      return [
        {
          speaker: "Tommy",
          text: spin(day, [
            "Finish the sentence before you ask me for a wrench.",
            "The tag's still where you left it.",
            "Pump two doesn't care what day it is. Neither do I.",
          ]),
          mood: "even",
        },
        {
          speaker: "Tommy",
          text: spin(day, ["Isolate. Lock. Tag. Try.", "IN SERVICE is not a sentence.", "Wrench stays on the hook."]),
          mood: "even",
        },
      ];
    }
    return [
      { speaker: "Tommy", text: "Pump two's dressed for a shift it isn't working.", mood: "even" },
      { speaker: "Tommy", text: "Tommy Reyes, maintenance. I finish the sentence the pump can't.", mood: "sharp" },
      { speaker: "Tommy", text: "IN SERVICE is zip-tied to a dead flange. Take the lie off before you ask for a wrench.", mood: "sharp" },
      {
        speaker: "Tommy",
        text: "Four words. Or don't.",
        mood: "even",
        choices: [
          { id: "tommy-four", label: "Isolate. Lock. Tag. Try.", reply: "Four words. Now the wrench can come off the hook.", trust: 2 },
          { id: "tommy-where", label: "Where's the tag?", reply: "On the board. It does not walk itself over.", trust: 1 },
          { id: "tommy-leave", label: "I'll leave it.", reply: "Then the pump keeps your hands. That's the deal.", flag: "tommyLeft" },
        ],
      },
      { speaker: "Tommy", text: "I'm not your audience. The flange is.", mood: "even" },
    ];
  }
  if (npc === "marcus") {
    if (!first) {
      if (residue.dose === "caught") {
        const lines: Line[] = [{ speaker: "Marcus", text: "You said forty out loud. That is the number.", mood: "tired" }];
        lines.push({
          speaker: "Marcus",
          text: day >= 4 ? "I will turn around for the next one." : "I turned. That was the number, not me.",
          mood: "tired",
        });
        return lines;
      }
      if (residue.dose === "hid") return [{ speaker: "Marcus", text: "The sticker still says 40. I am not turning around.", mood: "sharp" }];
      return [
        {
          speaker: "Marcus",
          text: spin(day, [
            "Say the number before you defend it.",
            "The sticker is still 40. The mouth isn't.",
            "Left gauge. Under the hand. Not the wall.",
          ]),
          mood: "even",
        },
        {
          speaker: "Marcus",
          text: spin(day, ["The number. Then the defense.", "I have not turned.", "Out loud. Then we can argue."]),
          mood: "tired",
        },
      ];
    }
    return [
      { speaker: "Marcus", text: "Stay on that side of the bench. I'm not turning for a name.", mood: "tired" },
      { speaker: "Marcus", text: "Marcus Hale, senior engineer. The room kept the day I was wrong.", mood: "sharp" },
      { speaker: "Marcus", text: "Say the number before you defend it. The wall gauge is the crowd.", mood: "even" },
      {
        speaker: "Marcus",
        text: "Well. The number.",
        mood: "tired",
        choices: [
          { id: "marcus-forty", label: "Forty.", reply: "Out loud. That's the number. I can turn for that.", trust: 2 },
          { id: "marcus-which", label: "Which gauge?", reply: "The one under the hand. Not the one on the wall.", trust: 1 },
          { id: "marcus-sheet", label: "I'll check the sheet.", reply: "The sheet is the crowd. Come back with a mouth.", flag: "marcusSheet" },
        ],
      },
      { speaker: "Marcus", text: "Don't dress the next one up.", mood: "even" },
    ];
  }
  if (npc === "priya") {
    if (!first) {
      if (anyHid(residue)) return [{ speaker: "Priya", text: "I will not sign. The rail is empty.", mood: "sharp" }];
      if (day >= 5) {
        const lines: Line[] = [{ speaker: "Priya", text: "I will walk that peak to the rail.", mood: "soft" }];
        if (flags.shuffle) lines.push({ speaker: "Priya", text: "You stood next to the tank. So will I.", mood: "soft" });
        return lines;
      }
      if (flags.physMcHeld) return [{ speaker: "Priya", text: "You ran analog MC. k ± σ. The bank is the clock. OpenMC stays a letter, and I still will not sign a peak I have not walked.", mood: "soft" }];
      if (flags.physPlayed) return [{ speaker: "Priya", text: "You watched the pin. Leakage is the last two doors. Teaching analog — not a license.", mood: "even" }];
      return [
        {
          speaker: "Priya",
          text: spin(day, [
            "The sheet is still a rumor until you stand next to the tank.",
            "I have not walked it. I will not sign it.",
            "Screen peak. Floor empty. I am still here.",
          ]),
          mood: "even",
        },
        { speaker: "Priya", text: "Stand next to it. Then talk.", mood: "even" },
      ];
    }
    return [
      { speaker: "Priya", text: "No handshake. A schematic doesn't have a pulse.", mood: "soft" },
      { speaker: "Priya", text: "Priya Sharma, reactor engineering. I walk what I sign.", mood: "even" },
      { speaker: "Priya", text: "You signed from a chair. Stand at the tank today — heat leaves through the metal.", mood: "soft" },
      {
        speaker: "Priya",
        text: "Teaching model. Not a license.",
        mood: "even",
        choices: [
          { id: "priya-walk", label: "I'll walk it.", reply: "Then I will meet you at the rail.", trust: 2, flag: "priyaWalk" },
          { id: "priya-sheet", label: "The sheet is enough.", reply: "A sheet is a rumor. I will not sign it.", flag: "priyaSheet" },
          { id: "priya-peak", label: "Show me the peak.", reply: "After your feet. Not before.", trust: 1 },
        ],
      },
      { speaker: "Priya", text: "Stand at the metal. Then we can use the word peak.", mood: "soft" },
    ];
  }
  if (!first) {
    if (hid) return [{ speaker: "Jordan", text: "Distance.", mood: "even" }];
    if (flags.peered || flags.jordanCredit) {
      const lines: Line[] = [{ speaker: "Jordan", text: "The catch was said. The chair is yours.", mood: "soft" }];
      if (day >= 3 && !anyHid(residue)) lines.push({ speaker: "Jordan", text: "I'll sit the same row.", mood: "soft" });
      return lines;
    }
    return [
      {
        speaker: "Jordan",
        text: spin(day, ["Say the catch out here.", "The door sees it. I do too.", "Pocket stays empty. Mouth doesn't."]),
        mood: "even",
      },
      {
        speaker: "Jordan",
        text: spin(day, ["Out here. Not later.", "Same row if you say it.", "I watch the door."]),
        mood: "even",
        choices: [
          { id: "jordan-say", label: "The catch is out here.", reply: "Then the chair is still in play.", trust: 1 },
        ],
      },
    ];
  }
  return [
    { speaker: "Jordan", text: "Door, then you. I like that order.", mood: "even" },
    { speaker: "Jordan", text: "Jordan Peck, floor tech. I keep the row for a catch the door can hear.", mood: "soft" },
    { speaker: "Jordan", text: "Say one out loud today. A win in a pocket does not get split.", mood: "even" },
    {
      speaker: "Jordan",
      text: "Your call.",
      mood: "even",
      choices: [
        { id: "jordan-out", label: "The catch is out here.", reply: "Then the chair is still in play.", trust: 2, flag: "jordanSaid" },
        { id: "jordan-quiet", label: "Not in front of them.", reply: "Then I'm three tiles off. That was the deal.", flag: "jordanQuiet" },
        { id: "jordan-later", label: "After the shift.", reply: "Bowl only if it is already said.", flag: "jordanLater" },
      ],
    },
    { speaker: "Jordan", text: "Same row if you say it. Distance if you don't.", mood: "even" },
  ];
}

function endingLines(npc: NpcId, residue: Residue, ended: "a" | "c" | null, week: WeekVoice): Line[] {
  const held = ended === "a";
  const scraped = week.hides >= 2 || anyHid(residue);
  if (!held) {
    if (npc === "jordan") {
      return [{ speaker: "Jordan", text: week.hides >= 3 ? "Three hides. Distance was the deal." : "Distance. The board stayed wrong.", mood: "even" }];
    }
    if (npc === "elena") return [{ speaker: "Elena", text: "The van. I'm looking at it.", mood: "even" }];
    if (npc === "tommy") return [{ speaker: "Tommy", text: residue.tag === "hid" ? "IN SERVICE stayed up. I heard it all week." : "Pump two never got the sentence.", mood: "sharp" }];
    if (npc === "marcus") return [{ speaker: "Marcus", text: residue.dose === "hid" ? "The sticker still says 40. So does the week." : "The number never got said.", mood: "tired" }];
    if (npc === "holt") return [{ speaker: "Holt", text: week.hides >= 3 ? "Three hides. I will not fund a blank." : "I will not fund this week.", mood: "sharp" }];
    if (npc === "priya") return [{ speaker: "Priya", text: "The rail stayed empty. So did my name.", mood: "sharp" }];
    return [{ speaker: "Mabel", text: week.hides >= 3 ? "Three hides. I will not chalk this week." : "I will not pretend this week was honest.", mood: "sharp" }];
  }
  if (npc === "elena") {
    if (scraped) return [{ speaker: "Elena", text: `${week.hides} hides. I still watched the hands that stayed.`, mood: "even" }];
    if (residue.valve === "caught" && week.trust >= 40) return [{ speaker: "Elena", text: "Every day, hands where I could see them.", mood: "soft" }];
    if (residue.valve === "caught") return [{ speaker: "Elena", text: "I saw your hands on the valve. That was the catch.", mood: "soft" }];
    if (week.catches > 0) return [{ speaker: "Elena", text: `${week.catches} catches. I watched the hands, not the van.`, mood: "even" }];
    return [{ speaker: "Elena", text: "I stayed. The hands did too.", mood: "even" }];
  }
  if (npc === "tommy") {
    if (residue.tag === "hid") return [{ speaker: "Tommy", text: "IN SERVICE stayed up. I heard it all week.", mood: "sharp" }];
    if (scraped) return [{ speaker: "Tommy", text: `${week.hides} hides. The wrench stayed on the hook.`, mood: "even" }];
    if (residue.tag === "caught" && week.catches >= 4) return [{ speaker: "Tommy", text: `${week.catches} catches. Pump two stayed quiet.`, mood: "even" }];
    if (residue.tag === "caught") return [{ speaker: "Tommy", text: "The tag is down. Pump two is quiet on purpose.", mood: "even" }];
    return [{ speaker: "Tommy", text: week.catches > 0 ? `${week.catches} catches. Pump two still wants the sentence.` : "Pump two still wants the sentence.", mood: "even" }];
  }
  if (npc === "marcus") {
    if (residue.dose === "hid") return [{ speaker: "Marcus", text: "The sticker still says 40. So does the week.", mood: "tired" }];
    if (scraped) return [{ speaker: "Marcus", text: `Forty got said. ${week.hides} hides did not.`, mood: "tired" }];
    if (residue.dose === "caught" && week.catches >= 4) return [{ speaker: "Marcus", text: `${week.catches} numbers. Forty was the first.`, mood: "tired" }];
    if (residue.dose === "caught") return [{ speaker: "Marcus", text: "You said forty out loud.", mood: "tired" }];
    return [{ speaker: "Marcus", text: "The number is still waiting.", mood: "tired" }];
  }
  if (npc === "holt") {
    if (residue.log === "hid") return [{ speaker: "Holt", text: "Your initials are on a blank. The week is too.", mood: "sharp" }];
    if (scraped) return [{ speaker: "Holt", text: "I can fund the catches. Not the hides.", mood: "even" }];
    if (week.reports > 0 && week.catches >= 4) return [{ speaker: "Holt", text: `${week.reports} signed. ${week.catches} I can fund.`, mood: "even" }];
    if (residue.log === "caught") return [{ speaker: "Holt", text: "I will read the line. I will not fund a blank.", mood: "even" }];
    return [{ speaker: "Holt", text: "No blank. Still not a speech.", mood: "even" }];
  }
  if (npc === "priya") {
    if (scraped) return [{ speaker: "Priya", text: `${week.hides} hides. I will not sign the week.`, mood: "sharp" }];
    if (week.catches >= 4) return [{ speaker: "Priya", text: `${week.catches} catches on the floor. I will walk the peak.`, mood: "soft" }];
    return [{ speaker: "Priya", text: "I will walk that peak to the rail.", mood: "soft" }];
  }
  if (npc === "jordan") {
    if (scraped) return [{ speaker: "Jordan", text: `${week.hides} hides. I kept the distance on those.`, mood: "even" }];
    if (week.catches >= 4) return [{ speaker: "Jordan", text: `${week.catches} catches. Same row.`, mood: "soft" }];
    return [{ speaker: "Jordan", text: "The catch was said. I'll stand here.", mood: "soft" }];
  }
  if (week.hides >= 2) return [{ speaker: "Mabel", text: `${week.hides} hides. I watched you not sit with those.`, mood: "sharp" }];
  if (week.catches >= 4 && week.reports > 0) return [{ speaker: "Mabel", text: `${week.reports} signed. ${week.catches} said out loud. The kettle can rest.`, mood: "warm" }];
  if (week.catches >= 4) return [{ speaker: "Mabel", text: `${week.catches} catches. The kettle can rest.`, mood: "warm" }];
  return [{ speaker: "Mabel", text: "You sat with it. The kettle can rest.", mood: "warm" }];
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

function fenceLine(): { rect: Rect; kind: string; block?: boolean }[] {
  const out: { rect: Rect; kind: string; block?: boolean }[] = [];
  for (let c = 14; c <= 40; c += 2) {
    if (c >= 22 && c <= 26) continue;
    out.push({ rect: t(c, 21, 1, 1), kind: "fence" });
  }
  return out;
}

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
      { to: "gate", rect: t(19, 6, 1, 4), label: "Lot" },
      { to: "parlor", rect: t(8, 15, 4, 1), label: "Parlor" },
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
    doors: [{ to: "cafe", rect: t(10, 0, 4, 1), label: "Cafe" }],
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
    w: 96 * TILE,
    h: 40 * TILE,
    muralH: 48,
    art: "/art/gen/stills/glimpse_gate.png?v=eval1",
    floor: "#7aaa58",
    accent: "#c9a227",
    grout: "#5e8a40",
    tile: TILE,
    floorKind: "grass",
    floorPatches: [
      { rect: t(0, 3, 96, 3), kind: "water" },
      { rect: t(12, 9, 41, 4), kind: "asphalt" },
      { rect: t(14, 13, 22, 8), kind: "asphalt" },
      { rect: t(14, 21, 22, 1), kind: "curb" },
      { rect: t(22, 20, 4, 1), kind: "stripe" },
    ],
    windows: [],
    doors: [
      { to: "cafe", rect: t(12, 9, 1, 4), label: "Cafe" },
      { to: "security", rect: t(52, 9, 1, 4), label: "Site Access" },
    ],
    props: [
      { rect: t(2, 7, 10, 8), kind: "roof", label: "Cafe" },
      { rect: t(2, 16, 10, 8), kind: "roof", label: "Arcade" },
      { rect: t(53, 8, 12, 10), kind: "roof", label: "Hall" },
      { rect: t(56, 4, 12, 4), kind: "roof", label: "Control" },
      { rect: t(52, 20, 14, 8), kind: "roof", label: "Eng" },
      { rect: t(68, 12, 10, 8), kind: "roof", label: "Break" },
      { rect: t(78, 6, 12, 6), kind: "roof", label: "Core" },
      { rect: t(70, 22, 16, 8), kind: "roof", label: "Maint" },
      { rect: t(70, 6, 3, 4), kind: "stack", label: "Stack" },
      { rect: t(74, 6, 3, 4), kind: "stack", label: "Stack" },
      { rect: t(16, 14, 6, 3), kind: "van", label: "Elena's van" },
      { rect: t(23, 19, 1, 2), kind: "boom", block: false },
      { rect: t(20, 12, 1, 2), kind: "lamp", block: false },
      { rect: t(36, 12, 1, 2), kind: "lamp", block: false },
      { rect: t(8, 6, 2, 2), kind: "plant", block: false },
      ...fenceLine(),
    ],
    interacts: [{ id: "commute", rect: t(16, 14, 6, 3), label: "The van", kind: "still", still: "gate" }],
  },
  security: {
    id: "security",
    name: "Site Access",
    w: 22 * TILE,
    h: 16 * TILE,
    muralH: 48,
    art: "/art/gen/stills/glimpse_security.png?v=2c",
    floor: "#c2c4be",
    accent: "#3aa0c0",
    grout: "#9a9c96",
    tile: TILE,
    floorKind: "stone",
    windows: [],
    doors: [
      { to: "gate", rect: t(0, 6, 1, 4), label: "Lot" },
      { to: "corridor", rect: t(21, 6, 1, 4), label: "Hall" },
    ],
    props: [
      { rect: t(2, 4, 5, 2), kind: "guarddesk", label: "Security desk" },
      { rect: t(8, 3, 2, 2), kind: "kiosk", label: "Badge kiosk" },
      { rect: t(11, 3, 2, 2), kind: "dosirack", label: "Dosimeter rack" },
      { rect: t(5, 10, 5, 3), kind: "xray", label: "Bag scanner" },
      { rect: t(14, 3, 2, 4), kind: "barrier" },
      { rect: t(14, 9, 2, 7), kind: "barrier" },
      { rect: t(14.5, 5, 1, 2), kind: "irispost", label: "Iris scanner", block: false },
      { rect: t(14.5, 9, 1, 2), kind: "irispost", label: "Iris scanner", block: false },
      { rect: t(15, 7, 1, 2), kind: "laneflap", label: "Portal", block: false },
      { rect: t(1, 11, 3, 2), kind: "bench_s" },
      { rect: t(1, 14, 2, 2), kind: "plant", block: false },
      { rect: t(20, 3, 2, 2), kind: "plant" },
      { rect: t(17, 3, 2, 2), kind: "cabinet", label: "Visitor lockers" },
      { rect: t(17, 11, 3, 2), kind: "bench_s" },
      { rect: t(11, 13, 1, 1), kind: "trash" },
    ],
    interacts: [
      { id: "dee", rect: t(2, 4, 5, 3), label: "Dee", kind: "guard" },
      { id: "kiosk", rect: t(8, 3, 2, 3), label: "Badge kiosk", kind: "badge" },
      { id: "tld", rect: t(11, 3, 2, 3), label: "Dosimeter rack", kind: "tld" },
      { id: "xray", rect: t(5, 9, 5, 1), label: "Bag scanner", kind: "xray" },
      { id: "portal", rect: t(13, 7, 3, 2), label: "Portal", kind: "portal" },
    ],
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
      { to: "security", rect: t(0, 6, 1, 4), label: "Site Access" },
      { to: "control", rect: t(10, 0, 4, 1), label: "Control" },
      { to: "engineering", rect: t(10, 15, 4, 1), label: "Eng" },
      { to: "breakroom", rect: t(23, 6, 1, 4), label: "Break" },
    ],
    props: [
      { rect: t(4, 8, 2, 2), kind: "lamp" },
      { rect: t(18, 1, 2, 2), kind: "poster", block: false },
      { rect: t(18, 8, 2, 3), kind: "cabinet" },
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
      { to: "corridor", rect: t(9, 15, 4, 1), label: "Hall" },
      { to: "reactor", rect: t(21, 6, 1, 4), label: "Core" },
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
      { to: "corridor", rect: t(9, 0, 4, 1), label: "Hall" },
      { to: "maintenance", rect: t(21, 6, 1, 4), label: "Maint" },
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
      { rect: t(10, 10, 4, 3), kind: "mydesk", label: "Your desk" },
      { rect: t(11, 13, 2, 2), kind: "chair", block: false },
    ],
    interacts: [
      { id: "mydesk", rect: t(10, 10, 4, 4), label: "Your desk", kind: "desk" },
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
      { to: "corridor", rect: t(0, 5, 1, 4), label: "Hall" },
      { to: "reactor", rect: t(13, 0, 4, 1), label: "Core" },
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
      { to: "control", rect: t(0, 6, 1, 4), label: "Control" },
      { to: "breakroom", rect: t(1, 15, 3, 1), label: "Break" },
      { to: "maintenance", rect: t(9, 15, 4, 1), label: "Maint" },
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
      { to: "reactor", rect: t(9, 0, 4, 1), label: "Core" },
      { to: "engineering", rect: t(0, 6, 1, 4), label: "Eng" },
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

/** Tile under a point. Matches the floor painter, which tests the tile origin. */
export function floorKindAt(roomId: RoomId, x: number, y: number): FloorKind {
  const room = ROOMS[roomId];
  const tx = Math.floor(x / TILE) * TILE;
  const ty = Math.floor(y / TILE) * TILE;
  let kind: FloorKind = room.floorKind;
  for (const p of room.floorPatches ?? []) {
    const r = p.rect;
    if (tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h) kind = p.kind;
  }
  return kind;
}
