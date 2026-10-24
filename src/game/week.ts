import type { NpcId, NpcSlot, Residue } from "./content";
import { anyHid } from "./content";

export interface DayDef {
  n: number;
  name: string;
  kicker: string;
  title: string;
  holt: string;
  items: string[];
  incident: "valve" | "lockout" | "dose" | "log" | null;
  shuffle: boolean;
  goals: { id: string; label: string }[];
}

export type WeekLogKind = "report" | "peer" | "hide" | "shuffle" | "note";

export interface WeekLogEntry {
  day: number;
  kind: WeekLogKind;
  text: string;
}

/** Days 2–5: on the lot, east of the cafe door and west of the van, facing the hall. */
export const COMMUTE_SPAWN = { room: "gate" as const, x: 240, y: 200, facing: "right" as const };
/** Friday close: east shore, facing the lake. The stacks are further east. */
export const DUSK_SPAWN = { room: "gate" as const, x: 1100, y: 180, facing: "up" as const };

export const WEEK: DayDef[] = [
  {
    n: 1,
    name: "Day 1 · First floor",
    kicker: "06:52  ·  Morning brief  ·  Holt",
    title: "Unit 1 is holding. You are not a hero today.",
    holt: "Holt: You designed the core. Now walk it. Catch. I fund reviews, not mythology.",
    items: [
      "Sit with Mabel. The cup is already poured.",
      "You have seen their faces. Stand where they work.",
      "Academy in Control. Priya's ΔT bench in Engineering.",
      "Board A and the paper log should agree. They might not.",
    ],
    incident: "valve",
    shuffle: false,
    goals: [
      { id: "mabel", label: "Sit with Mabel" },
      { id: "meet", label: "Meet the floor" },
      { id: "study", label: "Academy or ΔT bench" },
      { id: "truth", label: "Handle valve 14 (R / P / H)" },
    ],
  },
  {
    n: 2,
    name: "Day 2 · Tags",
    kicker: "06:50  ·  Morning brief  ·  Holt",
    title: "LOTOTO is a sentence. Finish it.",
    holt: "Holt: Yesterday was a valve. Today is a tag. Tommy's board. Academy is still not optional.",
    items: [
      "Maintenance wing — hang the lockout right. Teaching model only.",
      "Finish at least one Academy module you skipped.",
      "Greet people. Trust is a daily, not a trophy.",
    ],
    incident: "lockout",
    shuffle: false,
    goals: [
      { id: "maint", label: "Hang LOTOTO on pump 2A" },
      { id: "study", label: "Academy module" },
      { id: "meet", label: "Talk to someone you already met" },
    ],
  },
  {
    n: 3,
    name: "Day 3 · Dose and ego",
    kicker: "06:48  ·  Morning brief  ·  Holt",
    title: "The sticker is a liar or a prayer. Decide which.",
    holt: "Holt: Area dose. Marcus will want it to be 'a print error.' Volume. Not a duel.",
    items: [
      "Look at the dose sticker in Maintenance. 40 mSv/h is not a paperwork thing.",
      "Marcus is in Engineering. Data, not vibes — but still catch.",
      "Jordan notices who shares a win.",
    ],
    incident: "dose",
    shuffle: false,
    goals: [
      { id: "truth", label: "Handle the dose sticker (R / P / H)" },
      { id: "marcus", label: "Talk to Marcus" },
      { id: "study", label: "Academy or ΔT" },
    ],
  },
  {
    n: 4,
    name: "Day 4 · Volume",
    kicker: "06:51  ·  Morning brief  ·  Holt",
    title: "One catch is a rumor. Three is a budget line.",
    holt: "Holt: The log has no initials this morning. I need volume before the outage. Walk. Look. Close with me.",
    items: [
      "Unsigned shift log in Control. Catch it.",
      "Afternoon check-in with Holt.",
      "Tomorrow is the shuffle. Priya wants the multi-scale page and the fuel map in your hands.",
    ],
    incident: "log",
    shuffle: false,
    goals: [
      { id: "truth", label: "Catch the unsigned log" },
      { id: "holt2", label: "Afternoon check-in with Holt" },
      { id: "study", label: "Multi-scale or fuel Academy page" },
    ],
  },
  {
    n: 5,
    name: "Day 5 · Shuffle",
    kicker: "06:40  ·  Morning brief  ·  Holt",
    title: "Outage week. You program the core.",
    holt: "Holt: Fuel shuffle on the reactor hall desk. Flux has to live in your hands. Teaching model — not a license.",
    items: [
      "Reactor hall — program the fuel shuffle. Watch the flux map.",
      "Priya will not sign a peak she cannot explain.",
      "Close the week when the heatmap is honest.",
    ],
    incident: null,
    shuffle: true,
    goals: [
      { id: "shuffle", label: "Program the fuel shuffle" },
      { id: "priya", label: "Show Priya the map" },
      { id: "holt2", label: "Close the week with Holt" },
    ],
  },
];

export const INCIDENTS: Record<
  "valve" | "lockout" | "dose" | "log",
  { title: string; body: string; report: string; peer: string; hide: string }
> = {
  valve: {
    title: "Valve 14 does not match the paper",
    body: "Board A shows 14-B OPEN. The paper log initials 14-R CLOSED. Steam is talking in Maintenance. The easy path is to initial the paper and keep walking. That is how quiet plants fail.",
    report: "You write it up with your ugly handwriting and a time. Uncomfortable. Correct. The board now agrees with the paper.",
    peer: "You pull Elena in. Two sets of eyes. The tag is wrong; the catch is shared. She mutters 'thank you' like it costs her, which means it is real.",
    hide: "The log looks like church. The hiss in Maintenance does not care. Hide paths grow later, in people you like.",
  },
  lockout: {
    title: "Pump 2A reads IN SERVICE",
    body: "Tommy's board has two LOTOTO tags and one IN SERVICE hung on a pump that is supposed to be dead. Someone will call it a leftover. Leftovers spin.",
    report: "You log the wrong tag. Tommy initials next to you without making a speech. That is respect.",
    peer: "You and Tommy hang the lockout together. Two sets of eyes. The pump stays quiet on purpose.",
    hide: "You leave IN SERVICE up. The pump looks busy. So does the next mistake.",
  },
  dose: {
    title: "Area sticker says 40 mSv/h",
    body: "The other stickers say 0.04. A decimal walked. Marcus will want it to be print. Print still shines.",
    report: "You write 40 mSv/h with a circle around the decimal. ALARA is a verb today.",
    peer: "Elena looks once and swears under her breath. Shared catch. You both step back from the shine.",
    hide: "You stick a new label over it. The shine does not care about paper.",
  },
  log: {
    title: "The shift log has no initials",
    body: "Times. Valves. A blank where a person should be. An unsigned log is a room pretending it was empty.",
    report: "You refuse to initial someone else's blank. Holt gets a sentence with a time on it.",
    peer: "You find Elena. She laughs once, no humor, and signs what she actually did. The blank dies.",
    hide: "You initial it because the line looks lonely. Lonely lines become incidents with your name already on them.",
  },
};

export const MAP_ROOMS: { id: string; x: number; y: number; w: number; h: number; label: string }[] = [
  { id: "cafe", x: 8, y: 72, w: 46, h: 30, label: "Cafe" },
  { id: "parlor", x: 8, y: 106, w: 46, h: 22, label: "Arcade" },
  { id: "gate", x: 56, y: 72, w: 48, h: 30, label: "Lot" },
  { id: "corridor", x: 108, y: 80, w: 70, h: 16, label: "Hall" },
  { id: "control", x: 118, y: 18, w: 50, h: 58, label: "Control" },
  { id: "reactor", x: 172, y: 18, w: 56, h: 58, label: "Reactor" },
  { id: "maintenance", x: 172, y: 100, w: 56, h: 40, label: "Maint." },
  { id: "engineering", x: 108, y: 100, w: 56, h: 40, label: "Eng." },
  { id: "breakroom", x: 182, y: 80, w: 44, h: 16, label: "Break" },
];

export const MAP_LINKS: [string, string][] = [
  ["cafe", "gate"],
  ["cafe", "parlor"],
  ["gate", "corridor"],
  ["corridor", "control"],
  ["corridor", "engineering"],
  ["corridor", "breakroom"],
  ["control", "reactor"],
  ["reactor", "maintenance"],
  ["engineering", "maintenance"],
];

export const DEPARTMENTS: { id: string; label: string; members: NpcId[] }[] = [
  { id: "ops", label: "Operations", members: ["holt", "elena"] },
  { id: "eng", label: "Engineering", members: ["priya", "marcus"] },
  { id: "maint", label: "Maintenance", members: ["tommy"] },
  { id: "floor", label: "Floor / Cafe", members: ["mabel", "jordan"] },
];

export function dayDef(n: number) {
  return WEEK[Math.max(0, Math.min(WEEK.length - 1, n - 1))];
}

export function incidentRooms(kind: DayDef["incident"]): string[] {
  if (kind === "valve") return ["control", "maintenance"];
  if (kind === "lockout") return ["maintenance"];
  if (kind === "dose") return ["maintenance"];
  if (kind === "log") return ["control"];
  return [];
}

export function eodNpcLine(args: {
  hides: number;
  ended: "a" | "c" | null;
  flags: Record<string, boolean>;
}): string {
  if (args.hides >= 3) return "Mabel: Three hides is a week I will not pretend was honest.";
  if (args.ended === "a") {
    if (args.flags.elenaSecondEyes) return "Elena: I'll back a catch. You stood where I could see you.";
    if (args.flags.holtVolume) return "Holt: Volume. That's a review I can fund.";
    if (args.flags.tommySentence) return "Tommy: You finished the sentence. Boring on purpose. That's respect.";
    if (args.flags.priyaPeak) return "Priya: You said the line. Teaching model — not a license.";
    return "Mabel: You sat. You looked. That's the job.";
  }
  if (args.flags.delayPrompt) return "Mabel: $1 is a cliff. The parlor does not pretend it isn't.";
  if (args.flags.catchMiss) return "Mabel: You left a lie on the glass. The week remembers.";
  if (args.flags.hid) return "Jordan: You hid. I want distance. That was the deal.";
  return "Holt: Skill without a safe floor is unfinished power.";
}

export function shoreLine(ended: "a" | "c" | null, residue: Residue, shuffleDone: boolean, elenaSecondEyes: boolean) {
  if (ended !== "a") return "The shore is empty except Mabel and Jordan. The hiss kept talking.";
  const names = ["Mabel"];
  if (residue.log === "caught") names.push("Holt");
  if (residue.valve === "caught" || elenaSecondEyes) names.push("Elena");
  if (!anyHid(residue)) names.push("Jordan");
  if (residue.tag === "caught") names.push("Tommy");
  if (residue.dose === "caught") names.push("Marcus");
  if (shuffleDone && !anyHid(residue)) names.push("Priya");
  return `${names.join(", ")} came to the shore. The floor held because they saw the catches.`;
}

/** Yesterday's last catch or hide, for the morning brief. Names the object that is still in the room. */
export function yesterdayLine(day: number, log: WeekLogEntry[], residue: Residue): string | null {
  if (day <= 1) return null;
  const prev = day - 1;
  const how = prev === 1 ? residue.valve : prev === 2 ? residue.tag : prev === 3 ? residue.dose : prev === 4 ? residue.log : "open";
  if (how === "hid") {
    if (prev === 1) return "Yesterday you hid. The paper still disagrees with the board.";
    if (prev === 2) return "Yesterday you hid. The tag is still up.";
    if (prev === 3) return "Yesterday you hid. The sticker still says 40.";
    return "Yesterday you hid. The log has your name on a blank.";
  }
  if (how === "caught") {
    if (prev === 1) return "Yesterday the board and the paper agreed.";
    if (prev === 2) return "Yesterday the tag came down.";
    if (prev === 3) return "Yesterday someone said 40 out loud.";
    return "Yesterday the log got a real signature.";
  }
  const yest = log.filter((e) => e.day === day - 1);
  if (!yest.length) return "Yesterday the floor was quiet. Today it will not be.";
  const hide = [...yest].reverse().find((e) => e.kind === "hide");
  const catchish = [...yest].reverse().find((e) => e.kind === "report" || e.kind === "peer");
  if (hide && !catchish) return `Yesterday you hid. ${hide.text}`;
  if (catchish) return `Yesterday · ${catchish.text}`;
  return `Yesterday · ${yest[yest.length - 1].text}`;
}

/**
 * Posts that hold a face. Radius 12 so they do not wander off it.
 * Day posts ignore the clock. The dusk lot ignores the day.
 */
export function occupancyOverlay(
  day: number,
  id: NpcId,
  residue: Residue,
  ending: boolean,
  ended: "a" | "c" | null,
  shuffleDone: boolean,
  elenaSecondEyes: boolean,
): NpcSlot | undefined {
  if (ending) return duskPost(id, residue, ended, shuffleDone, elenaSecondEyes) ?? OFFSTAGE;
  if (id === "jordan" && anyHid(residue)) return { room: "breakroom", x: 248, y: 160, face: "right", radius: 12 };
  if (day === 1 && id === "elena") {
    if (residue.valve === "caught") return { room: "gate", x: 368, y: 248, face: "left", radius: 12 };
    return { room: "gate", x: 220, y: 248, face: "right", radius: 12 };
  }
  if (day === 2 && id === "tommy") {
    return { room: "maintenance", x: 208, y: 160, face: residue.tag === "caught" ? "down" : "up", radius: 12 };
  }
  if (day === 3 && id === "marcus") {
    return { room: "maintenance", x: 232, y: 168, face: residue.dose === "caught" ? "left" : "up", radius: 12 };
  }
  if (day === 4 && id === "holt") {
    if (residue.log === "caught") return { room: "control", x: 112, y: 140, face: "up", radius: 12 };
    return { room: "control", x: 140, y: 236, face: "up", radius: 12 };
  }
  if (day === 5 && id === "priya" && shuffleDone && !anyHid(residue)) {
    return { room: "reactor", x: 88, y: 196, face: "up", radius: 12 };
  }
  return undefined;
}

const OFFSTAGE: NpcSlot = { room: "engineering", x: 96, y: 160, face: "down", radius: 12 };

function duskPost(id: NpcId, residue: Residue, ended: "a" | "c" | null, shuffleDone: boolean, elenaSecondEyes: boolean): NpcSlot | undefined {
  const hid = anyHid(residue);
  if (ended !== "a") {
    if (id === "mabel") return { room: "gate", x: 1048, y: 172, face: "left", radius: 12 };
    if (id === "jordan") return { room: "gate", x: 1224, y: 172, face: "right", radius: 12 };
    return undefined;
  }
  if (id === "mabel") return { room: "gate", x: 1058, y: 172, face: "up", radius: 12 };
  if (id === "holt" && residue.log === "caught") return { room: "gate", x: 1094, y: 172, face: "up", radius: 12 };
  if (id === "elena" && (residue.valve === "caught" || elenaSecondEyes)) return { room: "gate", x: 1130, y: 172, face: "up", radius: 12 };
  if (id === "jordan" && !hid) return { room: "gate", x: 1166, y: 172, face: "up", radius: 12 };
  if (id === "tommy" && residue.tag === "caught") return { room: "gate", x: 1202, y: 172, face: "up", radius: 12 };
  if (id === "marcus" && residue.dose === "caught") return { room: "gate", x: 1230, y: 172, face: "up", radius: 12 };
  if (id === "priya" && shuffleDone && !hid) return { room: "gate", x: 1112, y: 142, face: "up", radius: 12 };
  return undefined;
}
