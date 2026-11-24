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
import { NPCS, type Line, type NpcId } from "./content";
import { SCENES, type Scene } from "./socialScenes";
import { A_ROTATION_NPC, A_ROTATION_SCENE, readCrew, takeARotationScene } from "./nightwatch/crewUnlock";
import { dueMoment, knownMoments, markMoment, type MomentState } from "./crewMoments";

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

export function tierOf(s: { trust: Record<NpcId, number>; day: number }, npc: NpcId): Tier {
  return socialTier(s.trust[npc] ?? NPCS[npc].startTrust, NPCS[npc].startTrust, s.day);
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
 * Called once each time a conversation opens. Appends the due scene, if any, and marks it seen.
 * Not during the ending walk, and not on the first meeting (that conversation belongs to the introduction).
 */
export function addScene(s: TalkState, firstMeeting: boolean): Scene | null {
  if (s.mode !== "dialogue" || !s.talkNpc || s.flags.endingWalk || s.ended || firstMeeting) return null;
  const scene = dueScene(s, s.talkNpc);
  if (scene) {
    s.dialogue.push(...scene.lines.map((l) => ({ ...l, choices: l.choices?.map((c) => ({ ...c })) })));
    s.flags[seenKey(s.talkNpc, scene.tier)] = true;
  }
  const extra = takeARotationScene(s.talkNpc);
  if (extra) {
    s.dialogue.push(...extra.lines.map((l) => ({ ...l, choices: l.choices?.map((c) => ({ ...c })) })));
  }
  // A crew moment (crewMoments.ts) only when nothing else played, so a conversation never runs long.
  if (!scene && !extra && hasRecord(s)) {
    const m = dueMoment(s, s.talkNpc);
    if (m) {
      s.dialogue.push(...m.lines.map((l) => ({ ...l, choices: l.choices?.map((c) => ({ ...c })) })));
      markMoment(s.flags, m.id);
      return { tier: 1, title: m.title, known: m.known, lines: m.lines };
    }
  }
  return scene ?? extra;
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
