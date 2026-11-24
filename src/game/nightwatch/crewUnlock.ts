/**
 * An A on all four rotation nights unlocks one crew scene on a later day.
 * localStorage only. A new week wipes cc.save.v2, so this must not live there.
 */
import type { NpcId, Line } from "../content";
import type { Scene } from "../socialScenes";
import { profileGet, profileSet } from "../profile";

export interface CrewUnlock {
  unlocked: boolean;
  seen: boolean;
}

const EMPTY: CrewUnlock = { unlocked: false, seen: false };

function write(next: CrewUnlock): CrewUnlock {
  profileSet("crew", next);
  return next;
}

export function readCrew(): CrewUnlock {
  try {
    const o = (profileGet("crew") ?? {}) as { unlocked?: unknown; seen?: unknown };
    return { unlocked: o.unlocked === true, seen: o.seen === true };
  } catch {
    return { ...EMPTY };
  }
}

export const A_ROTATION_NPC: NpcId = "elena";

/** Drafted for step 46. One scene, short, no exclamation marks. */
export const A_ROTATION_SCENE: Scene = {
  tier: 1,
  title: "The quiet nights",
  known: "Elena said the four quiet nights were the watch.",
  lines: [
    { speaker: "Elena", text: "Four quiet nights. That was the watch, not the plant.", mood: "even" },
    {
      speaker: "Elena",
      text: "Same standard next week.",
      mood: "even",
      choices: [
        { id: "crew-a-rot-a", label: "Same standard.", reply: "Then we start at eighteen hundred.", trust: 2 },
        { id: "crew-a-rot-b", label: "The plant helped.", reply: "The plant does what the log says it did.", trust: 1 },
      ],
    },
  ],
};

export const DAWN_CREW_LINE = "Four A's. Elena has a word next week.";

/** Unlock once. A later week does not play the scene again, and a B does not unlock it. */
export function noteARotation(letters: readonly string[]): CrewUnlock {
  const cur = readCrew();
  if (cur.unlocked) return cur;
  if (letters.length !== 4 || letters.some((l) => l !== "A")) return cur;
  return write({ unlocked: true, seen: false });
}

/** Dawn card. Null once the scene has been heard, or if the rotation was not all A. */
export function dawnCrewLine(letters: readonly string[], seen: boolean): string | null {
  if (seen) return null;
  if (letters.length !== 4 || letters.some((l) => l !== "A")) return null;
  return DAWN_CREW_LINE;
}

/**
 * Append-once scene for Elena. Marks seen in the profile, not in the week flags.
 * Returns null for anyone else, and null after the first talk that takes it.
 */
export function takeARotationScene(npc: string): Scene | null {
  if (npc !== A_ROTATION_NPC) return null;
  const cur = readCrew();
  if (!cur.unlocked || cur.seen) return null;
  write({ unlocked: true, seen: true });
  return A_ROTATION_SCENE;
}

export function aRotationLines(): Line[] {
  return A_ROTATION_SCENE.lines;
}
