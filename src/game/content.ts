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

/** 1: plain terms, one idea, no formula. 2: heat, physics or several ideas. 3: states an equation already in nuclearLab.ts. */
export type AcademyTier = 1 | 2 | 3;

export interface AcademyPage {
  title: string;
  tier: AcademyTier;
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
    | "desktop";
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
  if (role === "promoted") return "Newly promoted, aren't you? You still look at things. Don't stop when the title settles in.";
  if (role === "military") return "You were in the service. I can tell by how you stand. Here, nobody outranks whoever saw it first.";
  if (role === "veteran") return "You've worked somewhere people hid things. You've got the look. You're safe to say it here, love.";
  return "New site for you. Every plant has odd habits. Ask us why we do things. We should have to answer.";
}

/** Voices and histories: docs/characters.md. */
export const NPCS: Record<NpcId, NpcDef> = {
  mabel: {
    id: "mabel",
    name: "Dr. Mabel Quinn",
    role: "Cafe / retired floor",
    startTrust: 40,
    note: "Ran the floor for twenty years. Retired, couldn't stay away. Pours your cup before you ask.",
    portrait: { src: "/art/ui/portraits/portrait-mabel-smile.png", pos: "center" },
    meet: "Sit down, love. I poured before you came in. I always pour one extra.",
  },
  holt: {
    id: "holt",
    name: "Mr. Reginald Holt",
    role: "Director",
    startTrust: 28,
    note: "Runs the site. Wants times and places, not adjectives. Knows people are scared to tell him things, and hates it.",
    portrait: { src: "/art/ui/portraits/portrait-holt-smile.png", pos: "center" },
    meet: "You signed the core. Now go and meet it, and bring me what you see.",
  },
  elena: {
    id: "elena",
    name: "Elena Voss",
    role: "Shift supervisor",
    startTrust: 32,
    note: "Day shift supervisor. First in every morning. Her daughter's seat stays in the van. Nobody is alone with a problem on her floor.",
    portrait: { src: "/art/ui/portraits/portrait-elena-smile.png", pos: "center" },
    meet: "If you find something, come and get me. I'd rather see it with you.",
  },
  tommy: {
    id: "tommy",
    name: "Tommy Reyes",
    role: "Maintenance",
    startTrust: 34,
    note: "Maintenance, twenty-eight years. Talks to pumps. Wants his crew home with all ten fingers.",
    portrait: { src: "/art/ui/portraits/portrait-tommy-smile.png", pos: "center" },
    meet: "Before you touch anything in my shop, say the four words out loud.",
  },
  marcus: {
    id: "marcus",
    name: "Marcus Hale",
    role: "Senior engineer",
    startTrust: 22,
    note: "Youngest senior engineer the site has had. Brilliant, prickly, and harder on himself than anyone.",
    portrait: { src: "/art/ui/portraits/portrait-marcus-smile.png", pos: "center" },
    meet: "Yes, I'm young for a senior. Everyone mentions it, so I mention it first.",
  },
  priya: {
    id: "priya",
    name: "Dr. Priya Sharma",
    role: "Reactor engineering",
    startTrust: 36,
    note: "Reactor engineering. Walks everything she signs. Gets visibly excited about neutrons.",
    portrait: { src: "/art/ui/portraits/portrait-priya-smile.png", pos: "center" },
    meet: "I don't sign anything I haven't walked. Will you walk it with me?",
  },
  jordan: {
    id: "jordan",
    name: "Jordan Peck",
    role: "Floor tech",
    startTrust: 30,
    note: "Floor tech, bowling captain, finder of the good coffee. Keeps his distance from anything left unsaid.",
    portrait: { src: "/art/ui/portraits/portrait-jordan-smile.png", pos: "center" },
    meet: "When you catch something, say it out here, where people can hear.",
  },
};

export const NPC_INTRO: Record<NpcId, { who: string; meet: string; beat: string }> = {
  mabel: { who: "She poured your cup before you reached the counter.", meet: NPCS.mabel.meet, beat: "Pours before you ask." },
  holt: { who: "He stands up when you come in. Someone once told him he didn't.", meet: NPCS.holt.meet, beat: "Times and places, please." },
  elena: { who: "She's been here since five. The child seat is still in her van.", meet: NPCS.elena.meet, beat: "Two sets of eyes." },
  tommy: { who: "He's talking to the pump when you walk in, and finishes the sentence first.", meet: NPCS.tommy.meet, beat: "The four words." },
  marcus: { who: "He's halfway through a calculation and holds up one hand.", meet: NPCS.marcus.meet, beat: "The ugly number first." },
  priya: { who: "Her boots are scuffed. Her desk is spotless.", meet: NPCS.priya.meet, beat: "Walks what she signs." },
  jordan: { who: "He waves at you like he's known you for years.", meet: NPCS.jordan.meet, beat: "Where the door can hear." },
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
    title: "You signed a core. Now meet it.",
    body: "Teaching model, not a license. Heat still has to leave.",
    exchanges: [
      { you: true, line: "I signed Unit 1's core on paper. I've never stood next to it.", focus: "42% 78%", zoom: 1.14, lean: -2 },
      { line: "“Honestly, most designers haven't. That isn't a criticism. It's why I asked you down here.”", focus: "22% 68%", zoom: 1.22, lean: 0 },
      { you: true, line: "Then show me. I want to feel it, not just read it.", focus: "74% 28%", zoom: 1.08, lean: 3 },
      { line: "“It looks still from here. It's making heat for a whole city, and every bit of it has to leave.”", focus: "50% 62%", zoom: 1.16, lean: 1 },
    ],
  },
  {
    scene: "/art/intro/scene-cafe.png",
    portrait: "/art/ui/portraits/portrait-mabel-talk.png",
    kicker: "The cafe  ·  Mabel",
    title: "The kettle is still on from the night shift.",
    body: "Retired floor manager. She couldn't stay home, so she makes the coffee.",
    exchanges: [
      { line: "“Sit down, love. The night shift left that chair warm. I'm Mabel. I ran this floor for twenty years.”", focus: "36% 48%", zoom: 1.06, lean: 0 },
      { you: true, line: "You're retired. Why are you still making the coffee?", focus: "58% 72%", zoom: 1.1, lean: 1 },
      { line: "“Somebody should pour before anyone asks for anything. It gives people a minute to work up to the truth.”", focus: "48% 40%", zoom: 1.2, lean: 2, prop: "cup" },
      { you: true, line: "Then I'll sit. Who doesn't?", focus: "22% 55%", zoom: 1.08, lean: -1 },
      { line: "“The ones carrying something. They hover by the door and wait for someone else to say it first.”", focus: "18% 32%", zoom: 1.12, lean: -2 },
    ],
  },
  {
    scene: "/art/intro/scene-lot.png",
    portrait: "/art/ui/portraits/portrait-elena-talk.png",
    kicker: "The lot  ·  Elena",
    title: "Child seat first.",
    body: "Shift supervisor. First in every morning. The seat in the van is her daughter's.",
    exchanges: [
      { line: "“Morning. You're early. Good. I like two sets of eyes on the floor before the sun's up.”", focus: "32% 64%", zoom: 1.1, lean: 2 },
      { you: true, line: "There's a child seat in the back of your van.", focus: "70% 58%", zoom: 1.16, lean: -1 },
      { line: "“My daughter's. I drop her at my sister's at five. I leave the seat in. It reminds me who I work for.”", focus: "46% 46%", zoom: 1.24, lean: -3 },
      { you: true, line: "So that's why you're here before everyone else.", focus: "78% 34%", zoom: 1.06, lean: 0 },
      { line: "“Partly. Mostly it's because handovers are where things slip. If you see anything, come and get me.”", focus: "28% 70%", zoom: 1.12, lean: 1 },
    ],
  },
  {
    scene: "/art/intro/scene-wing.png",
    portrait: "/art/ui/portraits/portrait-tommy-talk.png",
    kicker: "The wing  ·  Tommy",
    title: "The four words.",
    body: "Maintenance, twenty-eight years. Pump two is dead on purpose this week.",
    exchanges: [
      { line: "“Hold up, that's pump two. Before you touch anything in my shop, say the four words out loud.”", focus: "72% 42%", zoom: 1.16, lean: 1, prop: "lock" },
      { you: true, line: "Isolate. Lock. Tag. Try. And there's an IN SERVICE card on the flange.", focus: "28% 50%", zoom: 1.08, lean: -1 },
      { line: "“Yeah. On a pump that's supposed to be dead. Somebody believes that card, it's their hands in there.”", focus: "64% 58%", zoom: 1.22, lean: -1 },
      { you: true, line: "Then I won't touch it until it's right.", focus: "18% 48%", zoom: 1.05, lean: 0 },
      { line: "“Thank you. Boring is how I've kept all ten fingers. People hate boring until the day it saves them.”", focus: "80% 36%", zoom: 1.1, lean: 2 },
    ],
  },
  {
    scene: "/art/intro/scene-bench.png",
    portrait: "/art/ui/portraits/portrait-marcus-talk.png",
    kicker: "The bench  ·  Marcus",
    title: "Two instruments.",
    body: "Senior engineer, the youngest the site has had. Harder on himself than anyone.",
    exchanges: [
      { line: "“Two gauges, and they disagree. I trust the one under my hand more than the one on the wall.”", focus: "36% 38%", zoom: 1.14, lean: 0 },
      { you: true, line: "The wall gauge reads lower.", focus: "62% 42%", zoom: 1.08, lean: -1 },
      { line: "“It does. Once, I defended a number before I'd said it out loud. It went badly. Very publicly.”", focus: "72% 68%", zoom: 1.18, lean: 2, prop: "pencil" },
      { you: true, line: "So say the number first, then defend it.", focus: "40% 30%", zoom: 1.08, lean: -2 },
      { line: "“Exactly that. Sorry, I'm lecturing. When two gauges argue, don't pick the polite one.”", focus: "24% 55%", zoom: 1.12, lean: 1 },
    ],
  },
  {
    scene: "/art/intro/scene-break.png",
    portrait: "/art/ui/portraits/portrait-jordan-talk.png",
    kicker: "The break  ·  Jordan",
    title: "Where the door can hear.",
    body: "Floor tech and bowling captain. He remembers who says it out loud.",
    exchanges: [
      { line: "“Hey, new face! Quick thing. When you catch something, say it out here. In your pocket, it helps nobody.”", focus: "58% 42%", zoom: 1.1, lean: 3 },
      { you: true, line: "Here? In the break room?", focus: "16% 40%", zoom: 1.12, lean: -2 },
      { line: "“Break room, board, anywhere people can hear. I remember who says it out loud. Not who's loudest.”", focus: "40% 62%", zoom: 1.14, lean: 1 },
      { you: true, line: "And if I keep one quiet?", focus: "84% 38%", zoom: 1.06, lean: 1 },
      { line: "“Then I'll still like you. I just won't sit next to it. Bowling after shift, though. Everyone's invited.”", focus: "22% 48%", zoom: 1.08, lean: -1 },
    ],
  },
  {
    scene: "/art/intro/scene-control.png",
    portrait: "/art/ui/portraits/portrait-holt-talk.png",
    kicker: "The board  ·  Holt",
    title: "Unit 1 is holding. You are not a hero today.",
    body: "Director. He wants a time, a place and what you saw.",
    exchanges: [
      { line: "“You're the core designer. Unit 1 is holding. I won't make a speech about it, and please don't.”", focus: "34% 72%", zoom: 1.1, lean: 0 },
      { you: true, line: "I'm not here to be the hero of the board.", focus: "64% 70%", zoom: 1.16, lean: -2 },
      { line: "“Good. I can't fund a hero. I can fund a catch. Bring me the time, the place, and what you saw.”", focus: "48% 40%", zoom: 1.2, lean: 1 },
      { you: true, line: "I'll stand next to the line before I bring it to you.", focus: "82% 28%", zoom: 1.06, lean: 1 },
      { line: "“Then I'll read it twice. Thank you. Most people bring me the version they think I want.”", focus: "30% 55%", zoom: 1.1, lean: -1 },
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
];

export const INCIDENT = {
  title: "Valve 14 is talking",
  body: "Board A and the paper log do not agree. The hiss is not a personality. Report, peer-check, or hide. Teaching model — not a license.",
  report: "Elena: Thank you for writing that up. I'll walk it down with you.",
  peer: "Elena: Thanks for calling me over. Two of us saw it, so it's real.",
  hide: "Jordan: I saw that didn't get written down. I can't stand next to that. I'm sorry.",
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
  if (id === "mabel" && flags.mabelTalked) return "She keeps the café so people have somewhere to say the hard thing.";
  if (id === "holt") return trust > 40 ? "He's started telling you things before he has to." : "He's waiting to see whether you bring him times and places.";
  if (id === "elena") return flags.elenaSecondEyes ? "She'll back any catch she saw with you." : "She'd rather see a problem with you than hear about it later.";
  if (id === "tommy") return "He'll teach you anything in the shop, once you've said the four words.";
  if (id === "marcus") return "Hardest on himself. Bring him the ugly number gently, but bring it.";
  if (id === "priya") return "She won't sign what she hasn't walked. She'd love you to walk it with her.";
  if (id === "jordan") return flags.hid ? "He's keeping a polite distance. It's about what went unsaid." : "He remembers who says things out loud, and he says thank you.";
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
      ? "Jordan's gone quiet this week. Elena keeps checking on him."
      : residue.valve === "caught"
        ? "Elena told Jordan you called her over on Valve 14. He was pleased."
        : "Elena gave Jordan this job when nobody else would. He'd walk through a wall for her.",
  );
  push(
    "mabel",
    "jordan",
    "Mabel · Jordan",
    hid ? "Jordan skipped his coffee at Mabel's. She noticed." : "Mabel saves Jordan the last pastry. He pretends not to know.",
  );
  push(
    "holt",
    "elena",
    "Holt · Elena",
    residue.valve === "hid"
      ? "Elena's uneasy about Valve 14. Holt can tell, and can't help until someone says it."
      : residue.valve === "caught"
        ? "Holt asked Elena how you did on Valve 14. She told him. It was good."
        : "Holt asks Elena's opinion before anyone else's. Neither of them mentions it.",
  );
  push(
    "mabel",
    "elena",
    "Mabel · Elena",
    residue.valve === "caught"
      ? "Mabel trained Elena. Elena told her about Valve 14, and Mabel chalked it."
      : residue.valve === "hid"
        ? "Mabel trained Elena. They've both noticed you avoiding the café."
        : "Mabel trained Elena. They still argue about how strong the coffee should be.",
  );
  push(
    "tommy",
    "marcus",
    "Tommy · Marcus",
    residue.tag === "hid" || residue.dose === "hid"
      ? "Something wrong is still hanging on the wall. Both of them know it. Neither will dress it up."
      : residue.tag === "caught" && residue.dose === "caught"
        ? "Marcus went down to the shop to say thanks. Tommy didn't know what to do with his hands."
        : "Tommy once sent back a work package Marcus signed. They've been careful with each other since.",
  );
  push(
    "priya",
    "marcus",
    "Priya · Marcus",
    residue.dose === "hid"
      ? "The sticker still says 40. Priya won't sign past it, and Marcus knows she's right."
      : residue.dose === "caught"
        ? "Priya told Marcus the sticker catch was a good one. He went quiet, then said thanks."
        : "Priya and Marcus started the same year. She's the only one who can tease him.",
  );
  push(
    "priya",
    "holt",
    "Priya · Holt",
    hid
      ? "Priya won't sign a week with a gap in it. Holt won't ask her to."
      : residue.log === "caught"
        ? "Holt read your signed log out to Priya. She's walking it anyway. He expected that."
        : "Priya keeps asking Holt for walkdown hours. He keeps saying yes, slowly.",
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

/** One line per day of the week: index 0 is day 1, the last entry covers day 5 and later. */
function spin(day: number, lines: readonly string[]) {
  return lines[Math.min(Math.max(1, day), lines.length) - 1] ?? lines[0];
}

/** "1 thing" / "3 things". */
function things(n: number, one = "thing", many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * Everyday conversations. Who these people are, how they talk and what each has been through: docs/characters.md.
 * Each person sounds like nobody else. Thanks and apologies say what for. Mistakes are told once, in the
 * place docs/characters.md lists. Choice ids, flags and trust values are unchanged from the earlier text.
 */
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
      const lines: Line[] = hid
        ? [
            { speaker: "Mabel", text: "Sit down a minute. Something got left unsaid this week, didn't it? People stop looking at the wall.", mood: "soft" },
            { speaker: "Mabel", text: "I'm not cross. I kept one to myself once, and it sat in me for years. Go and say it while it's small.", mood: "soft" },
          ]
        : [
            {
              speaker: "Mabel",
              text:
                day >= 3 && caughtWeek
                  ? "You said one out loud this week. I put a mark up for it. North wall, third row. Go and look."
                  : spin(day, [
                      "Back already? Good. The ones who come back for a second cup usually turn out fine.",
                      "Tommy's been in. He's in a mood, so be nice to him. His pump's playing up.",
                      "You look like you slept badly. Most of us did, our first week. Sit.",
                      "Reggie came in and asked how you were getting on. Don't tell him I call him Reggie.",
                      "Last day of the week. I always liked Fridays on the floor. Tired people are more honest.",
                    ]),
              mood: "warm",
            },
          ];
      if (day === 2 && role && !flags.roleHeard) {
        lines.push({ speaker: "Mabel", text: roleMouth(role), mood: "even" });
      } else if (!hid) {
        lines.push({
          speaker: "Mabel",
          text: "Now. What can I get you?",
          mood: "soft",
          choices: [
            { id: "mabel-sit", label: "Just the coffee, thanks.", reply: "Coming up. Night shift left it strong, so add milk or regret it.", trust: 2, culture: 1 },
            { id: "mabel-catch", label: "Who hasn't sat down today?", reply: "Whoever's carrying something they haven't said. They hover by the door. Say it out loud and I'll chalk it.", flag: "arcade" },
            { id: "mabel-load", label: "What's the score on the north wall?", reply: "Every mark's a catch somebody said out loud. Nobody's beaten the night shift yet. I don't let anyone cheat.", flag: "arcade" },
          ],
        });
      }
      return lines;
    }
    return [
      { speaker: "Mabel", text: "There you are. We only had a minute before. Sit, sit. I always pour one extra.", mood: "warm" },
      { speaker: "Mabel", text: "Mabel Quinn. I ran this floor for twenty years, retired, and couldn't stay home. So now I make the coffee.", mood: "soft" },
      { speaker: "Mabel", text: "See the chalk on the north wall? Every mark is a time someone caught a problem and said it out loud.", mood: "even" },
      { speaker: "Mabel", text: "I started that wall because of one I kept quiet about. I'll tell you sometime, if you keep coming back.", mood: "soft" },
      {
        speaker: "Mabel",
        text: "Now. What can I get you?",
        mood: "warm",
        choices: [
          { id: "mabel-sit", label: "Just the coffee, thanks.", reply: "On the house. The night shift paid for it with their sleep.", trust: 2, culture: 1 },
          { id: "mabel-catch", label: "Who doesn't sit down here?", reply: "The ones carrying something. They stand by the door. Say it out loud and I'll chalk it for you.", trust: 1, flag: "arcade" },
          { id: "mabel-load", label: "I'd like to earn a mark on that wall.", reply: "Don't try to earn it. Just say what you see, even if it's small. The marks take care of themselves.", trust: 2, flag: "arcade" },
        ],
      },
      { speaker: "Mabel", text: "And come back tomorrow. I like to see who comes back.", mood: "warm" },
    ];
  }
  if (npc === "holt") {
    if (!first) {
      if (residue.log === "hid") {
        return [
          { speaker: "Holt", text: "Your initials are on a log line for hours you didn't stand. I'd like to hear why from you first.", mood: "sharp" },
          { speaker: "Holt", text: "I'm not going to shout. I've sat on your side of this desk. Come and see me before the day's out.", mood: "even" },
        ];
      }
      if (residue.log === "caught") {
        const lines: Line[] = [
          { speaker: "Holt", text: "You wouldn't sign that blank log. It held up a turnover by twenty minutes. Thank you for those twenty minutes.", mood: "even" },
        ];
        if (culture >= 28) lines.push({ speaker: "Holt", text: "People are starting to say things out loud on this floor. I can see it in the reports. That isn't nothing.", mood: "warm" });
        return lines;
      }
      return [
        {
          speaker: "Holt",
          text: spin(day, [
            "How is the floor treating you? Specifics, please. 'Fine' doesn't tell me anything.",
            "Tommy has a lockout on 2A today. He'll teach you more about this site in ten minutes than I can in a week.",
            "Corporate wants a slide about our 'safety culture'. I'd rather have one honest page than twenty slides.",
            "There's a log in Control with a blank where a name should be. I'd like to know whose hours those were.",
            "Outage week. Everyone's tired, and tired people round numbers. Please don't round numbers.",
          ]),
          mood: "even",
        },
        {
          speaker: "Holt",
          text: spin(day, [
            "I mean that kindly, by the way. I'm told it doesn't always sound kind.",
            "Listen to him. I do, though he'd never believe it.",
            "If you see something today, that page is where it goes.",
            "Not to punish anyone. A blank is the one thing I can't investigate.",
            "When the week's done, come and tell me what I got wrong. I mean that.",
          ]),
          mood: day === 1 ? "soft" : "even",
        },
      ];
    }
    return [
      { speaker: "Holt", text: "Ah. The core designer. I've been meaning to find you. I'm bad at hellos, so I'll skip it.", mood: "even" },
      { speaker: "Holt", text: "Reginald Holt. I run the site. People tell me what they think I want to hear. It makes me expensive to talk to.", mood: "even" },
      { speaker: "Holt", text: "So, a favour on day one. If you see something wrong, bring me the time, the place, and what you saw.", mood: "even" },
      {
        speaker: "Holt",
        text: "Not how you feel about it. Can you do that?",
        mood: "sharp",
        choices: [
          { id: "holt-line", label: "Yes. Times and places.", reply: "Thank you. You'd be surprised how rare that is.", trust: 2 },
          { id: "holt-review", label: "What if I'm not sure yet?", reply: "Then tell me you're not sure. That's information too, and I'd rather have it early.", trust: 1 },
          { id: "holt-later", label: "I'd like to settle in first.", reply: "Fair. But the plant won't wait for you to settle in. Neither will the first thing you find.", flag: "holtDeferred" },
        ],
      },
      { speaker: "Holt", text: "Mabel will tell you I'm a cold man. She's known me since I was twenty-four. She's half right.", mood: "wry" },
    ];
  }
  if (npc === "elena") {
    if (!first) {
      if (residue.valve === "hid") {
        return [
          { speaker: "Elena", text: "Hey. How did your first day go? Really go.", mood: "even" },
          { speaker: "Elena", text: "If something didn't get written down, I'd rather hear it from you than find it. I've been there.", mood: "soft" },
        ];
      }
      if (residue.valve === "caught" || flags.elenaSecondEyes) {
        const lines: Line[] = [
          { speaker: "Elena", text: "Thank you for calling me over on that valve. You asked before you were sure. That's exactly the right time.", mood: "soft" },
        ];
        if (day >= 2) lines.push({ speaker: "Elena", text: "I told my sister about it last night. I never talk about work at home. So you know.", mood: "warm" });
        return lines;
      }
      return [
        {
          speaker: "Elena",
          text: spin(day, [
            "How are you holding up? First days are long. Have you eaten anything?",
            "Tommy's got a lockout on 2A today. If he asks you to check his tags, take it as a compliment.",
            "Long night. My daughter had a fever. She's fine. I'm running on Mabel's coffee.",
            "Somebody left the night log unsigned. I'm not pointing fingers. I'm just tired of blanks.",
            "Last day before the outage. Everybody's rushing. That's when I slow down on purpose.",
          ]),
          mood: day === 3 ? "tired" : "even",
        },
        {
          speaker: "Elena",
          text: spin(day, [
            "There's soup in the break room fridge. Nobody's going to claim it.",
            "He doesn't ask many people.",
            "So if I miss something today, tell me. Today especially.",
            "If you see one, don't fill it in for them. Bring it to me.",
            "Walk with me later if you like. Rushing is easier to spot from two angles.",
          ]),
          mood: "soft",
        },
      ];
    }
    return [
      { speaker: "Elena", text: "Mind the paint line, the forklift doesn't. We only said hello in the lot. I'm Elena, I run days.", mood: "even" },
      { speaker: "Elena", text: "My job is mostly putting people where someone else can see them. Nobody should be alone with a problem here.", mood: "even" },
      { speaker: "Elena", text: "You noticed the seat in my van. You're the first new person who's said anything.", mood: "soft" },
      {
        speaker: "Elena",
        text: "Go on, then. Ask.",
        mood: "even",
        choices: [
          { id: "elena-seat", label: "Everyone here has someone waiting at home.", reply: "Yes. That's the whole reason for two sets of eyes. Everybody here is somebody's ride home.", trust: 2 },
          { id: "elena-whose", label: "How old is she?", reply: "Six. She thinks I drive the reactor. I've stopped correcting her.", trust: 1 },
          { id: "elena-reactor", label: "I should get to the reactor.", reply: "Go on. But the reactor's the easy part. It's the people around it who need watching.", flag: "elenaReactor" },
        ],
      },
      { speaker: "Elena", text: "If you find something today, come and get me. I'd rather check it with you than hear about it later.", mood: "even" },
    ];
  }
  if (npc === "tommy") {
    if (!first) {
      if (residue.tag === "caught") {
        const lines: Line[] = [
          { speaker: "Tommy", text: "That IN SERVICE card's in my drawer now. Thank you. If someone had believed it, it'd be my guy's hands in there.", mood: "warm" },
        ];
        if (day >= 3) lines.push({ speaker: "Tommy", text: "Anything you want to learn in this shop, ask. My tools are your tools. I mean that.", mood: "warm" });
        return lines;
      }
      if (residue.tag === "hid") {
        return [
          { speaker: "Tommy", text: "That card's still hanging on 2A. I know it was on your list.", mood: "sharp" },
          { speaker: "Tommy", text: "I'm not going to chew you out. I just can't send my people near that pump till it's right. Help me fix it?", mood: "even" },
        ];
      }
      if (day === 2) {
        return [
          { speaker: "Tommy", text: "2A today. There's an IN SERVICE card on a dead pump. Find it before somebody believes it.", mood: "sharp" },
          { speaker: "Tommy", text: "Sorry. Short with you again. You find it, you call me, and we pull it together.", mood: "even" },
        ];
      }
      return [
        {
          speaker: "Tommy",
          text: spin(day, [
            "Morning, boss. Keep coming down here and people'll think you like it.",
            "Morning, boss.",
            "Marcus came down and actually asked me a question. I nearly dropped my coffee.",
            "Knees are bad today. Rain coming. Twenty-eight years on concrete does that.",
            "Outage week. Lots of new hands in my shop who don't know my pumps.",
          ]),
          mood: day === 4 ? "tired" : "wry",
        },
        {
          speaker: "Tommy",
          text: spin(day, [
            "Don't worry. I won't tell anyone you're an engineer.",
            "Say the four words for me. Isolate. Lock. Tag. Try.",
            "Don't tell him I said so. He's all right, underneath.",
            "Do me a favour. Wear the good boots. Not those.",
            "Keep an eye out for me, would you? I can't be everywhere.",
          ]),
          mood: "even",
        },
      ];
    }
    return [
      { speaker: "Tommy", text: "Hey, careful, she bites. Pump 2A. She's dead on purpose this week, and I want her to stay that way.", mood: "even" },
      { speaker: "Tommy", text: "Tommy Reyes, maintenance. Twenty-eight years of turning wrenches and filling in the forms nobody reads.", mood: "wry" },
      { speaker: "Tommy", text: "Somebody hung an IN SERVICE card on her. On a pump that's locked out. That's how people get hurt.", mood: "sharp" },
      {
        speaker: "Tommy",
        text: "Before you touch anything in my shop, I need four words. You know them?",
        mood: "even",
        choices: [
          { id: "tommy-four", label: "Isolate. Lock. Tag. Try.", reply: "There it is. You'd be amazed how many stop at tag. The try is the one that saves you.", trust: 2 },
          { id: "tommy-where", label: "Where's the wrong card?", reply: "On the board, by 2A. Go and see it yourself. You'll remember it better than if I tell you.", trust: 1 },
          { id: "tommy-leave", label: "I'll stay out of your way.", reply: "Appreciate it. But out of the way isn't the same as safe. Come back when you want to learn it.", flag: "tommyLeft" },
        ],
      },
      { speaker: "Tommy", text: "Sorry if I'm short. I'm not mad at you. I'm mad at the card.", mood: "soft" },
    ];
  }
  if (npc === "marcus") {
    if (!first) {
      if (residue.dose === "caught") {
        return [
          { speaker: "Marcus", text: "You said forty out loud on that sticker. In front of people. Before anyone could call it a typo.", mood: "even" },
          {
            speaker: "Marcus",
            text:
              day >= 4
                ? "I wanted it to be a typo because it came off my survey sheet. Thank you for not letting me hide behind that."
                : "I was annoyed with you for about an hour. Then I wasn't. Thank you.",
            mood: "soft",
          },
        ];
      }
      if (residue.dose === "hid") {
        return [
          { speaker: "Marcus", text: "That sticker still says forty. Whatever's stuck over it, the area doesn't read labels.", mood: "sharp" },
          { speaker: "Marcus", text: "And honestly? I was relieved when nobody said anything. That's the part that scares me.", mood: "soft" },
        ];
      }
      return [
        {
          speaker: "Marcus",
          text: spin(day, [
            "You again. That's a compliment, by the way. People usually avoid my bench.",
            "Tommy's got a bad tag on 2A, on a job I signed off. I'm going down to look at it myself.",
            "There's a sticker in Maintenance reading forty. The others say point oh four. I'd love it to be a typo.",
            "Sorry about yesterday, if I was short with you. I get prickly when a number might be mine.",
            "Outage week. A hundred numbers, and every one matters. I'm checking mine twice and asking someone for a third.",
          ]),
          mood: "even",
        },
        {
          speaker: "Marcus",
          text: spin(day, [
            "I'm told I'm a lot before lunch.",
            "Not because I have to. Because I should have the first time.",
            "Wanting something to be a typo is how you stop looking. I know. I know.",
            "It's not an excuse. I'm working on it.",
            "That last part's new. You can take some of the credit.",
          ]),
          mood: day === 3 ? "tired" : "soft",
        },
      ];
    }
    return [
      { speaker: "Marcus", text: "Hi. Sorry, one second. I'm mid-calculation, and if I stop now I lose the whole thing.", mood: "tired" },
      { speaker: "Marcus", text: "Okay. Marcus Hale, senior engineer. Yes, I'm young for it. Everyone mentions it, so I mention it first.", mood: "wry" },
      { speaker: "Marcus", text: "Two gauges on this bench. The one under my hand says forty. The one on the wall says thirty-eight.", mood: "even" },
      {
        speaker: "Marcus",
        text: "Quick test. Which number do you tell the board?",
        mood: "even",
        choices: [
          { id: "marcus-forty", label: "Forty. Then we find out why they disagree.", reply: "Good. Say the number out loud before you defend it. It took me years to learn that order.", trust: 2 },
          { id: "marcus-which", label: "Which one was calibrated last?", reply: "The one under my hand. Good question. Most people pick the one that makes them look right.", trust: 1 },
          { id: "marcus-sheet", label: "I'd check the data sheet first.", reply: "The sheet tells you what it should say. The gauge tells you what it does say. Think about that one.", flag: "marcusSheet" },
        ],
      },
      { speaker: "Marcus", text: "Sorry. I test people. It's a bad habit from being tested a lot.", mood: "soft" },
    ];
  }
  if (npc === "priya") {
    if (!first) {
      if (anyHid(residue)) {
        return [
          { speaker: "Priya", text: "Something this week didn't get written down. I can't sign a week with a hole in it, even a small one.", mood: "sharp" },
          { speaker: "Priya", text: "I'm not judging you. I've ignored a reading myself. I just can't put my name under it.", mood: "soft" },
        ];
      }
      if (day >= 5) {
        const lines: Line[] = [{ speaker: "Priya", text: "I walked your peak to the rail this morning. Your numbers held. I wanted to tell you in person.", mood: "warm" }];
        if (flags.shuffle) lines.push({ speaker: "Priya", text: "And you stood at the tank yourself. That's the part that'll make you good at this.", mood: "warm" });
        return lines;
      }
      if (flags.physMcHeld) {
        return [
          { speaker: "Priya", text: "You ran the Monte Carlo bench. k with its sigma, the bank as a clock. That's real physics. Nicely done.", mood: "warm" },
          { speaker: "Priya", text: "It's still a teaching model, and OpenMC is only a letter on the page here. I won't sign a peak I haven't walked.", mood: "even" },
        ];
      }
      if (flags.physPlayed) {
        return [
          { speaker: "Priya", text: "You watched a neutron leave on the bench. Leakage is just the last two doors it can walk out of.", mood: "warm" },
          { speaker: "Priya", text: "Teaching analog, not a license. I still get a little thrill every time, though.", mood: "wry" },
        ];
      }
      return [
        {
          speaker: "Priya",
          text: spin(day, [
            "How's day one? Overwhelming is normal. I cried in a stairwell on mine. Don't tell Marcus.",
            "Tommy's got a pump locked out. Go and watch him. It's like watching someone play an instrument.",
            "Marcus is in a mood about a sticker. Be patient with him. He's harder on himself than anyone else could be.",
            "I'm prepping the outage loading. Sixty-four new assemblies. I've redone the map three times.",
          ]),
          mood: "even",
        },
        {
          speaker: "Priya",
          text: spin(day, [
            "Come and find me at the tank. Everything's easier to understand standing next to it.",
            "Physics is my job. That's his. Both matter.",
            "And if the sticker's real, it's real. Say so.",
            "Come and look at it later. Fresh eyes catch the things mine have stopped seeing.",
          ]),
          mood: "soft",
        },
      ];
    }
    return [
      { speaker: "Priya", text: "You're the designer. I've read your loading sheet four times. It's good. Can I be honest about one thing?", mood: "warm" },
      { speaker: "Priya", text: "I'm Priya, reactor engineering. I don't sign anything I haven't walked. My shoes have more miles than my car.", mood: "wry" },
      { speaker: "Priya", text: "Your sheet was signed at a desk. That's normal. But heat doesn't read sheets. It leaves through real metal.", mood: "even" },
      {
        speaker: "Priya",
        text: "So, will you walk it with me?",
        mood: "soft",
        choices: [
          { id: "priya-walk", label: "Yes. Show me the real thing.", reply: "Wonderful. Meet me at the rail. Proper boots, the floor's warm.", trust: 2, flag: "priyaWalk" },
          { id: "priya-sheet", label: "The sheet should be enough.", reply: "It usually is. 'Usually' is the word that worries me. I won't sign until we've walked it.", flag: "priyaSheet" },
          { id: "priya-peak", label: "Show me the power peak first.", reply: "After we walk. I promise the peak makes more sense once you've stood next to it.", trust: 1 },
        ],
      },
      { speaker: "Priya", text: "And so it's said: this is a teaching model, not a license. We learn from it. We don't trust it blindly.", mood: "even" },
    ];
  }
  if (!first) {
    if (hid) {
      return [
        { speaker: "Jordan", text: "Hey.", mood: "even" },
        { speaker: "Jordan", text: "Sorry. I'm keeping to myself a bit this week. It's not you, exactly. It's what didn't get said.", mood: "soft" },
      ];
    }
    if (flags.peered || flags.jordanCredit) {
      const lines: Line[] = [{ speaker: "Jordan", text: "You said it out loud and put my name next to yours. You didn't have to. Thank you.", mood: "warm" }];
      if (day >= 3 && !anyHid(residue)) lines.push({ speaker: "Jordan", text: "Saved you a seat at lunch. And a lane on Thursday. Don't make me regret the lane.", mood: "wry" });
      return lines;
    }
    return [
      {
        speaker: "Jordan",
        text: spin(day, [
          "How's the first day? Survived Holt yet? He's not as scary as he looks. He's exactly as scary as he looks.",
          "Elena gave me this job when nobody else would look at me. If she asks you for a check, do it properly.",
          "Marcus snapped at me over a sticker this morning. Then he apologised. Twice. Weird day.",
          "Somebody left a log unsigned last night. That sort of thing makes my stomach go funny. Old reasons.",
          "Outage week. Everything's loud and everyone's tired. Perfect conditions for missing stuff.",
        ]),
        mood: day === 4 ? "soft" : "wry",
      },
      {
        speaker: "Jordan",
        text: "Caught anything today?",
        mood: "even",
        choices: [{ id: "jordan-say", label: "Yes, and I'll say it out loud.", reply: "Then say it where the room can hear. I'll back you.", trust: 1 }],
      },
    ];
  }
  return [
    { speaker: "Jordan", text: "Hey! You're the new one. Jordan. Floor tech, bowling captain, finder of the good coffee.", mood: "warm" },
    { speaker: "Jordan", text: "Honest question, I ask everyone. When you find something wrong, do you say it out loud?", mood: "even" },
    { speaker: "Jordan", text: "I came here from another plant. Somebody there kept quiet about a reading, and it landed on me. Long story.", mood: "soft" },
    {
      speaker: "Jordan",
      text: "So. Are you a say-it-out-loud person?",
      mood: "even",
      choices: [
        { id: "jordan-out", label: "Yes. Out loud, where people can hear.", reply: "Then we'll get along. Bowling's Thursdays. You're probably terrible. That's fine.", trust: 2, flag: "jordanSaid" },
        { id: "jordan-quiet", label: "Depends who's listening.", reply: "Fair. Just know I keep a bit of distance from quiet. It's not personal. It's history.", flag: "jordanQuiet" },
        { id: "jordan-later", label: "I'd want to be sure first.", reply: "Sure is good. Just don't be sure in your pocket for a week. Say it while it's small.", flag: "jordanLater" },
      ],
    },
    { speaker: "Jordan", text: "Anyway. Welcome. It's a good crew. Mostly.", mood: "wry" },
  ];
}

/** The Friday walk to the shore. One line each, from how the week went. */
function endingLines(npc: NpcId, residue: Residue, ended: "a" | "c" | null, week: WeekVoice): Line[] {
  const held = ended === "a";
  const scraped = week.hides >= 2 || anyHid(residue);
  const say = (speaker: string, text: string, mood: Line["mood"]): Line[] => [{ speaker, text, mood }];
  if (!held) {
    if (npc === "jordan") {
      return say("Jordan", week.hides >= 3 ? "Three things went unsaid this week. I can't be the name next to that again. I'm sorry. I mean it." : "I wanted this week to go differently. I think you did too.", "soft");
    }
    if (npc === "elena") return say("Elena", "I'll be straight, because I'd want you to be. This week didn't hold. Next week, call me early. Every time.", "even");
    if (npc === "tommy") return say("Tommy", residue.tag === "hid" ? "That card stayed up all week. I walked past it every morning. Hurt every time." : "We never finished the lockout on 2A together. Next week we do it start to finish.", "sharp");
    if (npc === "marcus") return say("Marcus", residue.dose === "hid" ? "The sticker still says forty. So does the part of my head I don't like. Let's both stop pretending." : "We never said the number out loud this week. That's on me as much as you.", "tired");
    if (npc === "holt") return say("Holt", week.hides >= 3 ? "Three hides. I can't build a review on blanks. I'd like to try again next week. With you." : "This week didn't hold. Come and see me Monday. I'd rather understand it than grade it.", "even");
    if (npc === "priya") return say("Priya", "I couldn't sign this week. That isn't a verdict on you. It's a promise I made a long time ago.", "soft");
    return say("Mabel", week.hides >= 3 ? "Three hides. I'm not chalking this week. But the cup's poured on Monday. It always is." : "I won't pretend this week was honest. But I'll pour you a cup Monday, and we'll start again.", "soft");
  }
  if (npc === "elena") {
    if (scraped) return say("Elena", `We held, with ${things(week.hides)} left unsaid. I saw how hard you worked on the rest. Next week, all of it.`, "even");
    if (residue.valve === "caught" && week.trust >= 40) return say("Elena", "Every day this week, you called me over before you were sure. Thank you. That's rarer than you'd think.", "warm");
    if (residue.valve === "caught") return say("Elena", "You called me over on Valve 14 on your first day. I've thought about that all week. Thank you.", "soft");
    if (week.catches > 0) return say("Elena", `You said ${things(week.catches, "catch", "catches")} out loud this week. I'm glad you're on my floor.`, "warm");
    return say("Elena", "We got through it, quietly. Next week I'd like to hear more from you. I mean that kindly.", "even");
  }
  if (npc === "tommy") {
    if (residue.tag === "hid") return say("Tommy", "We held, but that card stayed up all week. First thing Monday, we take it down together.", "sharp");
    if (scraped) return say("Tommy", `We held. But I heard about ${things(week.hides)} secondhand. Next time, come tell me first.`, "even");
    if (residue.tag === "caught" && week.catches >= 4) return say("Tommy", `${things(week.catches, "catch", "catches")}, and 2A stayed quiet all week. You made my crew's week easier. Thank you.`, "warm");
    if (residue.tag === "caught") return say("Tommy", "That card's still in my drawer. I'm keeping it. Reminds me somebody new got it right.", "warm");
    return say("Tommy", "Good week. Next week, come and hang a lockout with me. Start to finish.", "even");
  }
  if (npc === "marcus") {
    if (residue.dose === "hid") return say("Marcus", "We held. But the sticker still says forty, and I let it. I'm fixing it Monday. Will you come?", "tired");
    if (scraped) return say("Marcus", `You said the number on the sticker. The ${things(week.hides, "quiet one", "quiet ones")} bother me more than I'd like.`, "tired");
    if (residue.dose === "caught" && week.catches >= 4) return say("Marcus", `${things(week.catches, "number", "numbers")} said out loud this week. Forty was the first. I won't forget that one.`, "soft");
    if (residue.dose === "caught") return say("Marcus", "You said forty out loud when I wanted it to be a typo. Thank you. I mean that.", "soft");
    return say("Marcus", "Good week. I'm still waiting for you to tell me I'm wrong about something. It's coming.", "wry");
  }
  if (npc === "holt") {
    if (residue.log === "hid") return say("Holt", "Your initials are on a blank from this week. We held, but that's the line I'll be asked about.", "sharp");
    if (scraped) return say("Holt", "I can fund what you caught. The hides I have to explain. I'd rather we had none to explain.", "even");
    if (week.reports > 0 && week.catches >= 4) return say("Holt", `${week.reports} written up, ${things(week.catches, "catch", "catches")}. That's a review I can defend. Thank you.`, "warm");
    if (residue.log === "caught") return say("Holt", "You wouldn't sign a blank. That's the line I'll read out at the review, with your name on it.", "warm");
    return say("Holt", "A quiet week, and no blanks. I'll take it. Next week, bring me more times and places.", "even");
  }
  if (npc === "priya") {
    if (scraped) return say("Priya", `I can't sign this week, with ${things(week.hides)} unwritten. I'd like to sign the next one with you.`, "soft");
    if (week.catches >= 4) return say("Priya", `${things(week.catches, "catch", "catches")}, all on the floor, not on a screen. I'll walk your peak to the rail and sign it.`, "warm");
    return say("Priya", "I'll walk your peak to the rail. You've earned that walk. Thank you for coming down to the metal.", "soft");
  }
  if (npc === "jordan") {
    if (scraped) return say("Jordan", `We held. There were ${things(week.hides)} I wasn't part of, and I kept my distance on those. Not on you.`, "even");
    if (week.catches >= 4) return say("Jordan", `${things(week.catches, "catch", "catches")}, out loud, every one. Thursday. Lane two. You're coming.`, "warm");
    return say("Jordan", "You said it out loud this week. That's all I ever ask of anyone. Thank you.", "soft");
  }
  if (week.hides >= 2) return say("Mabel", `There were ${week.hides} you didn't sit with. I saw. But you're here, and that counts.`, "soft");
  if (week.catches >= 4 && week.reports > 0) return say("Mabel", `${week.catches} marks on my wall this week, and ${week.reports} written up properly. I'm proud of you. Sit.`, "warm");
  if (week.catches >= 4) return say("Mabel", `${week.catches} marks on my wall this week. My kettle can finally rest.`, "warm");
  return say("Mabel", "You sat with it all week. That's harder than it looks. Thank you, love.", "warm");
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
  pwr: still("/art/gen/stills/plate_pwr.png?v=loops", "PWR loop (this site)", "CRDMs on the head. Cold down the downcomer, core up, hot to the steam generator. Primary stays liquid ~16 MPa. Teaching only."),
  bwr: still("/art/gen/stills/plate_bwr.png?v=loops", "BWR — teaching comparison", "One vessel does the boiling. Rods from below. ~7 MPa. Teaching only."),
  pebble: still("/art/gen/stills/plate_pebble.png?v=loops", "Pebble / TRISO — teaching comparison", "Fuel as 6 cm pebbles. Helium is the courier. The SiC is the pressure vessel of the particle."),
  msr: still("/art/gen/stills/plate_msr.png?v=loops", "MSR — teaching comparison", "Thermal circulating fuel. FLiBe + UF4, 7Li, freeze plug, off-gas. β_eff is smaller than β. Teaching only."),
  msr_fhr: still("/art/gen/stills/plate_fhr.png?v=loops", "FHR — salt cools solid fuel", "Not a liquid-fuel MSR. TRISO pebbles. Salt is only the courier. Kairos-family teaching card."),
  msr_fast: still("/art/gen/stills/plate_msfr.png?v=loops", "Fast fluoride (MSFR) — no graphite", "Fuel dissolved in fluoride salt, the CNRS MSFR teaching card. Thorium blanket. Freeze plug if circulating. Not a chloride pool. Teaching only."),
  mural_catch: still("/art/gen/stills/plate_culture.png?v=beauty", "Catch > heroics", "Two sets of eyes and a clipboard. The catch is shared."),
  mural_criticality: still("/art/gen/stills/plate_pwr.png?v=loops", "The core holds", "A living claim. Heat is born here."),
  mural_openmc: still("/art/gen/stills/plate_assembly.png?v=metal", "Lattice (teaching)", "Pins and a couple of guide tubes. A map, not a license."),
  alara: still("/art/gen/stills/plate_alara.png?v=beauty", "ALARA with eyes open", "Time, distance, shielding — and still seeing."),
  scales: still("/art/gen/stills/plate_assembly.png?v=metal", "Rod, assembly, core", "A pin is not a plant. Leakage is how k comes down."),
  shuffle: still("/art/gen/stills/plate_shuffle.png?v=beauty", "Fuel as a map", "Burned toward the rim, fresh scattered inside. Flat power leaks; peaked power burns. Fq is a personality."),
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
  { title: "Just Culture", tier: 1, still: "culture", track: "culture", body: "Mistakes are expected. Hiding them is the hazard. A catch while it is cheap is the product. Heroics are a lagging indicator that the room went quiet. Teaching model — not a license." },
  { title: "Heat has to leave", tier: 3, still: "pwr", extra: "fluids", track: "heat", body: "On this site (PWR): Q = ṁ × cp × ΔT. Cold leg in, downcomer down, core up, hot leg out. Primary stays liquid at ~16 MPa classroom. Teaching model — not a license." },
  { title: "The vessel has names", tier: 2, still: "pwr", extra: "anatomy", track: "heat", body: "A PWR pressure vessel holds the fuel, the water, and the control rods. Inlet nozzle, core barrel, downcomer, lower plenum, fuel, upper internals, outlet nozzle. Not a design basis." },
  { title: "ALARA with eyes open", tier: 1, still: "alara", extra: "alara", track: "safety", body: "Time, distance, shielding — and still seeing. Infinite distance is how rooms go blind. Binoculars from the platform. Two minutes. Then leave." },
  { title: "Four ways heat leaves", tier: 2, still: "reactor", extra: "types", track: "heat", body: "PWR, BWR, pebble, salt. Different plumbing. Same law: heat leaves. Comparison decks, not a shopping list. Teaching only — not a design basis." },
  { title: "Salt, three ways", tier: 2, still: "msr", extra: "msr", track: "heat", body: "Call it molten salt and people hear one machine. There are three. Thermal circulating fuel (this classroom). FHR (solid TRISO). Fast fluoride, the MSFR (no graphite). Circulating fuel: β_eff is smaller than β. Teaching only — not a license." },
  { title: "Rod, assembly, core", tier: 2, still: "scales", extra: "lab", track: "physics", body: "A pin in an infinite lattice is not a plant. Leakage is how k comes down from k∞. Play PHYS.CAB — fission in the pellet, P1 diffusion at the edge. Priya will not sign a peak she cannot explain at three scales." },
  { title: "Fuel as a map", tier: 2, still: "shuffle", extra: "shuffle", track: "fuel", body: "Fresh in the middle peaks. Fresh on the rim flattens but leaks. Low-leakage loading puts burned fuel toward the rim and scatters fresh inside. Fq is a personality, not a score. Outage is Friday. Do not sign a shuffle you cannot walk." },
  { title: "Export is a letter, not a license", tier: 1, still: "export", extra: "export", track: "fuel", body: "The OpenMC script is a teaching letter to a code. It is not a design basis. Watermark stays on." },
  { title: "ΔT with your hands", tier: 2, still: "dt", extra: "trainer", track: "heat", body: "Priya's bench. Put heat into coolant until the numbers and the feeling agree." },
  { title: "Four barriers", tier: 2, still: "barriers", extra: "barriers", track: "safety", body: "Fuel ceramic. Clad. Reactor coolant pressure boundary. Containment. A catch on a tag is the cheap layer." },
  { title: "STAR — stop before the twist", tier: 2, still: "star", extra: "star", track: "safety", body: "Stop. Think. Act. Review. Questioning attitude is a protocol, not a personality. Stop-work is allowed." },
  { title: "Three-way communication", tier: 2, still: "comms", extra: "comms", track: "safety", body: "Sender speaks. Receiver repeats. Sender acknowledges. A nod is how blanks get initials." },
  { title: "Reactivity in three stages", tier: 3, still: "reactivity", extra: "reactivity", track: "physics", body: "Stage 1, the delay: about 0.65% of U-235 thermal neutrons come late, from fragments. That is β. Stage 2, the dollar: ρ($) = ρ/β, so $1 is prompt-critical, the cliff. Stage 3, the period: T is the slope. Delayed neutrons buy seconds. Past $1 the period collapses to the prompt lifetime. The cards have no clock." },
  { title: "Control rods are a spare absorber", tier: 2, still: "reactor", extra: "rods", track: "physics", body: "A rod is a block of absorber you can move. Pull it out and the pellet eats fewer neutrons, so k rises. Push it in and k falls. Operators hold k near 1 with rods and boron as spare Σ_a. Rods hold power; they are not a switch that makes it. Four banks, 228 steps, a cooldown between moves. Play ROD.BANK. Teaching model — not a license." },
  { title: "Six-factor formula", tier: 3, still: "six", extra: "six", track: "physics", body: "k∞ = ε p f η. k_eff = k∞ · PNL. A pin is not a plant. Play PHYS.CAB — fission in the pellet, leak at the edge." },
  { title: "Monte Carlo methods", tier: 2, still: "export", extra: "mc", track: "physics", body: "Analog generation k. Histories, fission bank, k ± σ. 1/√G is the wait. Implicit capture is a transient, not a quiz. OpenMC stays a letter. Play analog MC in PHYS.CAB." },
  { title: "Temperature is a catch", tier: 2, still: "feedback", extra: "feedback", track: "physics", body: "Doppler is the pellet. MTC is the water. Two temperatures, two timescales." },
  { title: "Xenon and the iodine pit", tier: 2, still: "xenon", extra: "xenon", track: "physics", body: "Xe-135 is a poison with a clock. You do not get to skip the pit. Play LOAD.CAB — xenon follows power, the load is the opponent." },
  { title: "LOTOTO — lock, tag, try", tier: 2, still: "lototo", extra: "lototo", track: "safety", body: "Lock out. Tag out. Try out. Zero energy. A leftover IN SERVICE tag is how people go home late." },
  { title: "Independent verification", tier: 1, still: "verify", extra: "verify", track: "safety", body: "A second set of eyes. Not a nod. Teaching only." },
  { title: "Stop when unsure", tier: 1, still: "conservative", extra: "conservative", track: "safety", body: "Stop-work is allowed. Faster is how occurrence reports get born." },
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
      // The laptop on the counter. Drawn in code (render.ts), not from the atlas. Opens the desktop.
      { rect: t(7, 6, 2, 2), kind: "laptop", block: false },
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
      { id: "laptop", rect: t(7, 9, 2, 1), label: "Laptop", kind: "desktop" },
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
      { to: "corridor", rect: t(52, 9, 1, 4), label: "Hall" },
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
      { to: "gate", rect: t(0, 6, 1, 4), label: "Lot" },
      { to: "control", rect: t(10, 0, 4, 1), label: "Control" },
      { to: "engineering", rect: t(10, 15, 4, 1), label: "Eng" },
      { to: "breakroom", rect: t(23, 6, 1, 4), label: "Break" },
    ],
    props: [
      { rect: t(4, 8, 2, 2), kind: "lamp" },
      { rect: t(4, 1, 2, 2), kind: "poster", block: false },
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
      { rect: t(6, 9, 2, 2), kind: "chair" },
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
