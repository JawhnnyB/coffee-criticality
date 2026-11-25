/**
 * Parlor tokens and the prize shelf.
 *
 * The owner, 25 November 2026: tokens earned in the mini games, and a special gift toy for each person, earned
 * through the mini games, for a deeper connection with everyone except the boss.
 *
 * Tokens: brass, stamped "MABEL'S", earned on the eight levelled cabinets. A finished run pays 1, clearing the
 * level's score pays 1 more, at most 3 a cabinet a day (so a good week of play fills the jar, grinding doesn't).
 * The jar is kept in the machine profile, so it survives a new week, like the crew does.
 *
 * Toys: one per person, each tied to the cabinet that is theirs (Mabel's golf, Jordan's lanes, and so on). It goes
 * on Mabel's shelf once you've cleared level 1 of that cabinet, costs tokens, and goes in your pocket. The next time
 * you talk to them, you give it to them: a short scene, and they keep it ("gift:<npc>", carried across weeks).
 * Holt has no toy. Mabel says why.
 */
import type { Line, NpcId } from "./content";
import { profileGet, profileSet } from "./profile";

export const TOKENS_PER_DAY_PER_CAB = 3;

export interface Toy {
  npc: Exclude<NpcId, "holt">;
  /** The cabinet that's theirs. Clearing its level 1 puts the toy on the shelf. */
  cab: "golf" | "bowl" | "fish" | "catch" | "rods" | "pebble";
  cabTitle: string;
  name: string;
  /** On the shelf. */
  blurb: string;
  cost: number;
  /** Crew page, once given. */
  known: string;
  scene: Line[];
}

export const NO_TOY_FOR_HOLT = "Reggie doesn't take presents. Never has. He'd only file it under \"gifts, declared\".";

export const TOYS: Toy[] = [
  {
    npc: "mabel",
    cab: "golf",
    cabTitle: "GOLF.CAB",
    name: "Tin kettle",
    blurb: "A wind-up tin kettle that whistles. The lid has a little dent in it.",
    cost: 6,
    known: "You gave Mabel a tin kettle with a dent in the lid. It sits next to the real one.",
    scene: [
      { speaker: "Mabel", text: "Oh. Oh, look at that. Does it whistle?", mood: "warm" },
      { speaker: "Mabel", text: "The old control room kettle had a dent just there. You couldn't have known that.", mood: "soft" },
      { speaker: "Mabel", text: "It's going next to the real one. Thank you, love. Truly.", mood: "warm" },
      {
        speaker: "Mabel",
        text: "Did you know about the dent?",
        mood: "wry",
        choices: [
          { id: "gift-mabel-a", label: "I didn't. Lucky guess.", reply: "Then the dent found its way home. That's a better story anyway.", trust: 2 },
          { id: "gift-mabel-b", label: "I asked Tommy.", reply: "Tommy Reyes remembers the dent in my kettle? I will never let him live that down.", trust: 2 },
        ],
      },
    ],
  },
  {
    npc: "jordan",
    cab: "bowl",
    cabTitle: "BOWL.CAB",
    name: "Lane-two pin",
    blurb: "A wooden bowling pin, hand-painted \"LANE 2\". It leans slightly left.",
    cost: 6,
    known: "You gave Jordan a pin painted LANE 2. It's on his locker, where he sees it before every shift.",
    scene: [
      { speaker: "Jordan", text: "No way. Lane two. It even leans left, like the real lane.", mood: "warm" },
      { speaker: "Jordan", text: "Honestly, nobody's given me anything since I left my last plant. I don't know what to say.", mood: "soft" },
      { speaker: "Jordan", text: "It's going on my locker. Right where I'll see it before every shift.", mood: "warm" },
      {
        speaker: "Jordan",
        text: "Seriously. Thank you.",
        mood: "soft",
        choices: [
          { id: "gift-jordan-a", label: "You don't have to say anything.", reply: "Okay. Then I'll just bowl better on Thursday. That's my thank-you.", trust: 2 },
          { id: "gift-jordan-b", label: "You earned it on lane two.", reply: "I lost to you on lane two. Twice. You're a menace, and I love this pin.", trust: 2 },
        ],
      },
    ],
  },
  {
    npc: "elena",
    cab: "fish",
    cabTitle: "FISH.CAB",
    name: "Camper van",
    blurb: "A die-cast camper van with a fishing rod on the roof and a child seat the size of a thumbnail.",
    cost: 7,
    known: "You gave Elena a toy camper van with a tiny child seat. It rides on her dashboard.",
    scene: [
      { speaker: "Elena", text: "There's a car seat in it. A tiny one.", mood: "soft" },
      { speaker: "Elena", text: "My daughter's going to steal this the moment she sees it. You know that, right?", mood: "wry" },
      { speaker: "Elena", text: "Thank you. I'm not good at gifts. I'm better at schedules. But thank you.", mood: "warm" },
      {
        speaker: "Elena",
        text: "Should I let her have it?",
        mood: "even",
        choices: [
          { id: "gift-elena-a", label: "Let her steal it.", reply: "She will. She'll take it fishing. She takes everything fishing.", trust: 2 },
          { id: "gift-elena-b", label: "It's yours, not hers.", reply: "Then it rides on my dashboard, where she can see it and can't reach it. Fair.", trust: 2 },
        ],
      },
    ],
  },
  {
    npc: "tommy",
    cab: "catch",
    cabTitle: "CATCH.CAB",
    name: "Toy padlock",
    blurb: "A brass toy padlock with a key that really works, and a tag that says MINE in tiny letters.",
    cost: 6,
    known: "You gave Tommy a toy padlock that really locks. It's on his keychain, next to the little wrench.",
    scene: [
      { speaker: "Tommy", text: "Ha. A lock. With a key that actually works.", mood: "warm" },
      { speaker: "Tommy", text: "My kid's going to want this. Too bad, kid. This one's mine.", mood: "wry" },
      { speaker: "Tommy", text: "Thanks, boss. Really. It's going on the keychain, next to the little wrench.", mood: "soft" },
      {
        speaker: "Tommy",
        text: "Go on, then. Say it.",
        mood: "wry",
        choices: [
          { id: "gift-tommy-a", label: "Isolate. Lock. Tag. Try.", reply: "Four words, even on a toy. You're one of us now, heaven help you.", trust: 2 },
          { id: "gift-tommy-b", label: "Your kid can borrow it.", reply: "Borrow, sure. Under supervision. With a sign-out sheet.", trust: 2 },
        ],
      },
    ],
  },
  {
    npc: "marcus",
    cab: "rods",
    cabTitle: "ROD.BANK",
    name: "Tin gauge",
    blurb: "A tin pressure gauge with a needle you set by hand. It comes set to forty.",
    cost: 7,
    known: "You gave Marcus a tin gauge set to forty. He moves the needle every morning, to the real number.",
    scene: [
      { speaker: "Marcus", text: "It's set to forty. Very funny.", mood: "wry" },
      { speaker: "Marcus", text: "...Actually, it is funny. I'm keeping it on my desk.", mood: "soft" },
      { speaker: "Marcus", text: "As a reminder to say the number first. Thank you. I mean that.", mood: "warm" },
      {
        speaker: "Marcus",
        text: "Where should I set it?",
        mood: "even",
        choices: [
          { id: "gift-marcus-a", label: "Wherever's true that day.", reply: "That's the idea. I'll move it every morning, to the real number.", trust: 2 },
          { id: "gift-marcus-b", label: "Leave it at forty.", reply: "Forty it stays. A monument to being wrong in public. I've earned it.", trust: 2 },
        ],
      },
    ],
  },
  {
    npc: "priya",
    cab: "pebble",
    cabTitle: "PEBBLE.CAB",
    name: "Tiny work boots",
    blurb: "A pair of rubber work boots small enough to stand on a monitor. The soles are scuffed on purpose.",
    cost: 6,
    known: "You gave Priya tiny scuffed work boots. They stand on her monitor, to remind her to go and look.",
    scene: [
      { speaker: "Priya", text: "Boots! Tiny boots. And they're already scuffed.", mood: "warm" },
      { speaker: "Priya", text: "You scuffed them on purpose, didn't you. So they'd look walked in.", mood: "wry" },
      { speaker: "Priya", text: "They're going on my monitor. Every time I read the screen, I'll remember to go and stand next to the thing.", mood: "soft" },
      {
        speaker: "Priya",
        text: "Is that why you chose them?",
        mood: "even",
        choices: [
          { id: "gift-priya-a", label: "That's exactly why.", reply: "Then they'll do their job. Thank you. Truly.", trust: 2 },
          { id: "gift-priya-b", label: "They walked the whole hall to get here.", reply: "Then they've done more walkdowns than most of engineering. I love them.", trust: 2 },
        ],
      },
    ],
  },
];

export const giftKey = (npc: NpcId) => `gift:${npc}`;

export interface Jar {
  tokens: number;
  /** Toys bought and not yet given. */
  pocket: string[];
}

export function readJar(): Jar {
  try {
    const o = (profileGet("tokens") ?? {}) as Partial<Jar>;
    return {
      tokens: typeof o.tokens === "number" && o.tokens >= 0 ? Math.floor(o.tokens) : 0,
      pocket: Array.isArray(o.pocket) ? o.pocket.filter((x): x is string => typeof x === "string") : [],
    };
  } catch {
    return { tokens: 0, pocket: [] };
  }
}

export function writeJar(j: Jar): void {
  profileSet("tokens", j);
}

/** Tokens for one cabinet run. Sets the day's count flags; returns what was paid. */
export function tokensForRun(flags: Record<string, boolean>, cab: string, day: number, score: number, cleared: boolean): number {
  if (score <= 0) return 0;
  let paid = 0;
  for (let n = 1; n <= TOKENS_PER_DAY_PER_CAB; n++) if (flags[`tok:${cab}:d${day}:${n}`]) paid = n;
  const want = Math.min(TOKENS_PER_DAY_PER_CAB - paid, cleared ? 2 : 1);
  for (let k = 1; k <= want; k++) flags[`tok:${cab}:d${day}:${paid + k}`] = true;
  return Math.max(0, want);
}

export type ToyState = "locked" | "shelf" | "pocket" | "given";

export function toyState(toy: Toy, flags: Record<string, boolean>, jar: Jar): ToyState {
  if (flags[giftKey(toy.npc)]) return "given";
  if (jar.pocket.includes(toy.npc)) return "pocket";
  if (!flags[`cab:${toy.cab}:2`]) return "locked";
  return "shelf";
}

/** Buy a toy off the shelf. Returns the new jar, or null if it can't be bought. */
export function buyToy(toy: Toy, flags: Record<string, boolean>, jar: Jar): Jar | null {
  if (toyState(toy, flags, jar) !== "shelf" || jar.tokens < toy.cost) return null;
  return { tokens: jar.tokens - toy.cost, pocket: [...jar.pocket, toy.npc] };
}

/** The toy to give this person now, if it's in your pocket. */
export function giftDue(npc: NpcId, flags: Record<string, boolean>, jar: Jar): Toy | null {
  if (npc === "holt" || flags[giftKey(npc)]) return null;
  return TOYS.find((t) => t.npc === npc && jar.pocket.includes(npc)) ?? null;
}

/** Hand it over: the gift flag is set, and the toy leaves your pocket. */
export function giveToy(toy: Toy, flags: Record<string, boolean>, jar: Jar): Jar {
  flags[giftKey(toy.npc)] = true;
  return { ...jar, pocket: jar.pocket.filter((n) => n !== toy.npc) };
}
