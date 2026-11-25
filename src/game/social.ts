/**
 * The crew warms up over the week. Each person has a tier, worked out from how far their trust has moved since
 * the first morning, with day gates so nobody is close by Tuesday. Reaching a tier makes one scene available;
 * it plays the next time you talk to them, after what they would have said anyway.
 *
 * Nothing here edits the frozen sim. Trust already moves in sim.ts (talking, choices, cabinets, reports). Scene
 * choices carry trust and flags, and sim's own pickChoice applies them. "Seen" is a flag ("social:<npc>:<n>"),
 * so the save format does not change.
 *
 * Every line of scene text is in socialScenes.ts, drafted by Claude and listed for owner approval.
 */
import { RETURNING_FLAG } from "./crewCarry";
import { NPCS, type Line, type NpcId } from "./content";
import { SCENES, type Scene } from "./socialScenes";
import { A_ROTATION_NPC, A_ROTATION_SCENE, readCrew, takeARotationScene } from "./nightwatch/crewUnlock";
import { dueMoment, knownMoments, markMoment, type MomentState } from "./crewMoments";
import { dueFloorTalk, floorKey, floorLines, saysAbout, talkKey } from "./floorTalks";
import { cultureOf, type Culture } from "./floorCulture";
import { TOYS, giftDue, giftKey, giveToy, readJar, writeJar } from "./parlorPrizes";

export type Tier = 0 | 1 | 2 | 3;

export const TIER_NAME: Record<Tier, string> = { 0: "New", 1: "Colleague", 2: "Trusted", 3: "Close" };

/** Trust gained since the first morning, and the day it first counts. */
export const TIER_RULE: { gain: number; day: number }[] = [
  { gain: 0, day: 1 },
  { gain: 6, day: 1 },
  { gain: 14, day: 2 },
  { gain: 24, day: 4 },
];

export function socialTier(trust: number, start: number, day: number): Tier {
  const gain = trust - start;
  let t: Tier = 0;
  for (let n = 1; n <= 3; n++) if (gain >= TIER_RULE[n].gain && day >= TIER_RULE[n].day) t = n as Tier;
  return t;
}

export function tierOf(s: { trust: Record<NpcId, number>; day: number; flags?: Record<string, boolean> }, npc: NpcId): Tier {
  // A returning week: they already know you. The day gates were for strangers, so they no longer hold you back.
  const day = s.flags?.[RETURNING_FLAG] ? 5 : s.day;
  return socialTier(s.trust[npc] ?? NPCS[npc].startTrust, NPCS[npc].startTrust, day);
}

const seenKey = (npc: NpcId, n: number) => `social:${npc}:${n}`;

/** The scene that should play now for this person, if any: the lowest unseen one at or below their tier. */
export function dueScene(s: { trust: Record<NpcId, number>; day: number; flags: Record<string, boolean> }, npc: NpcId): Scene | null {
  const tier = tierOf(s, npc);
  for (const scene of SCENES[npc]) {
    if (scene.tier > tier) break;
    if (s.flags[seenKey(npc, scene.tier)]) continue;
    if (scene.needs && !scene.needs.every((f) => s.flags[f])) continue;
    return scene;
  }
  return null;
}

export interface TalkState {
  mode: string;
  talkNpc: NpcId | null;
  dialogue: Line[];
  day: number;
  trust: Record<NpcId, number>;
  flags: Record<string, boolean>;
  ended: unknown;
}

/**
 * Called once each time a conversation opens. Counts the talk, then adds at most one thing, in this order:
 * a toy you're giving them, Elena's four-A scene, what you walk in on (floorTalks.ts, the 2nd and 3rd talk),
 * their due relationship scene, a crew moment. Not during the ending walk, and nothing on the first meeting (that's the introduction).
 */
export function addScene(s: TalkState, firstMeeting: boolean): Scene | null {
  // Not on the walk to the shore. (sim's finishDay sets s.ended at the end of every day, not only the last, so it
  // can't be the test here: it used to silence every scene and moment from day 2 on.)
  if (s.mode !== "dialogue" || !s.talkNpc || s.flags.endingWalk) return null;
  const npc = s.talkNpc;
  // Count this week's talks with them (floorTalks.ts opens the 2nd and 3rd).
  let n = 1;
  while (s.flags[talkKey(npc, n)]) n += 1;
  s.flags[talkKey(npc, n)] = true;
  if (firstMeeting) return null;
  const copy = (lines: Line[]) => lines.map((l) => ({ ...l, choices: l.choices?.map((c) => ({ ...c })) }));

  // A toy in your pocket for them (parlorPrizes.ts): you give it now, after they've said hello. Nothing else plays.
  const jar = readJar();
  const toy = giftDue(npc, s.flags, jar);
  if (toy) {
    s.dialogue.push(...copy(toy.scene));
    writeJar(giveToy(toy, s.flags, jar));
    s.trust[npc] = Math.min(100, (s.trust[npc] ?? 0) + 4);
    return { tier: 1, title: toy.name, known: toy.known, lines: toy.scene };
  }

  // Elena's four-A scene, earned in an earlier rotation: rare, and it doesn't wait.
  const extra = takeARotationScene(s.talkNpc);
  if (extra) {
    s.dialogue.push(...copy(extra.lines));
    return extra;
  }
  // What you walk in on (floorTalks.ts): the 2nd and 3rd talk of the week open with two of the crew, in the floor's
  // culture right now. The owner asked for exactly those talks, so the relationship scene waits for the next one.
  const floor = dueFloorTalk(s.flags, npc, n);
  if (floor) {
    s.dialogue.unshift(...floorLines(floor, cultureNow(s)));
    s.flags[floorKey(floor.id)] = true;
    return { tier: 1, title: floor.title, known: floor.says.text, lines: [] };
  }
  const scene = dueScene(s, s.talkNpc);
  if (scene) {
    s.dialogue.push(...copy(scene.lines));
    s.flags[seenKey(s.talkNpc, scene.tier)] = true;
    return scene;
  }
  // A crew moment (crewMoments.ts) only when nothing else played, so a conversation never runs long.
  if (hasRecord(s)) {
    const m = dueMoment(s, s.talkNpc);
    if (m) {
      s.dialogue.push(...copy(m.lines));
      markMoment(s.flags, m.id);
      return { tier: 1, title: m.title, known: m.known, lines: m.lines };
    }
  }
  return null;
}

/** The floor's culture (floorCulture.ts) from the talk state, or guarded when the record isn't there. */
export function cultureNow(s: TalkState): Culture {
  const r = s as Partial<{ reports: number; catches: number; hides: number }>;
  if (typeof r.reports !== "number" || typeof r.catches !== "number" || typeof r.hides !== "number") return "guarded";
  return cultureOf({ flags: s.flags, reports: r.reports, catches: r.catches, hides: r.hides });
}

function hasRecord(s: TalkState): s is TalkState & MomentState {
  const r = s as Partial<MomentState>;
  return !!r.residue && typeof r.hides === "number" && typeof r.catches === "number" && typeof r.maintDone === "boolean";
}

/** What the player knows about someone: their note, then the title of each scene they have heard. */
export function knownAbout(s: { flags: Record<string, boolean> }, npc: NpcId): string[] {
  const lines = [NPCS[npc].note, ...SCENES[npc].filter((sc) => s.flags[seenKey(npc, sc.tier)]).map((sc) => sc.known)];
  if (npc === A_ROTATION_NPC && readCrew().seen) lines.push(A_ROTATION_SCENE.known);
  lines.push(...knownMoments(s.flags, npc));
  // How others talk about them (floorTalks.ts), and the toy you gave them (parlorPrizes.ts).
  lines.push(...saysAbout(s.flags, npc));
  const toy = TOYS.find((t) => t.npc === npc);
  if (toy && s.flags[giftKey(npc)]) lines.push(toy.known);
  return lines;
}

/** A plain hint toward the next scene. */
export function nextHint(s: { trust: Record<NpcId, number>; day: number; flags: Record<string, boolean> }, npc: NpcId): string {
  const tier = tierOf(s, npc);
  const next = SCENES[npc].find((sc) => !s.flags[seenKey(npc, sc.tier)]);
  if (!next) return "You have heard what they have to say this week.";
  if (next.tier <= tier) {
    if (next.needs && !next.needs.every((f) => s.flags[f])) return next.needsHint ?? "Something else has to happen first.";
    return "They have something to tell you. Go and talk.";
  }
  const rule = TIER_RULE[next.tier];
  if (s.day < rule.day) return `Not before day ${rule.day}.`;
  return "Talk with them, take their side when it is right, and catch things where they can see it.";
}
