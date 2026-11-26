/**
 * The floor's culture, from what the player does.
 *
 * The owner, 25 November 2026: the culture and the way people talk to each other should change with every choice,
 * toward more trust or toward more calling each other out, and show fear, respect and distrust.
 *
 * Two axes, worked out fresh from the shift's state each time (nothing new is saved):
 *   - trust: people feel safe with each other. Sitting with people, peer checks, backing someone up, gifts.
 *   - candor: people say the hard thing out loud. Reports, catches, naming a problem, telling someone they're wrong.
 * Hiding something costs both.
 *
 * Five cultures:
 *   guarded   nobody's sure of each other yet (where every week starts)
 *   respect   high trust, high candor: people call each other out because they trust each other
 *   comfort   high trust, low candor: everyone's kind, and nobody says the hard thing
 *   distrust  high candor, low trust: calling out becomes blame, and people keep receipts
 *   fear      low on both, or things hidden: heads down, nobody says it
 *
 * Comfort is the fifth one the owner didn't name: too much trust without candor is its own hazard on a plant floor.
 */
export type Culture = "guarded" | "respect" | "comfort" | "distrust" | "fear";

export const CULTURE_INFO: Record<Culture, { name: string; line: string }> = {
  guarded: { name: "Guarded", line: "Nobody's sure of each other yet. People are polite and careful." },
  respect: { name: "Respect", line: "People call each other out because they trust each other. It lands, and nobody holds a grudge." },
  comfort: { name: "Comfort", line: "Everyone's kind. Nobody says the hard thing. It feels good, and that's the danger." },
  distrust: { name: "Distrust", line: "People say what's wrong, but as blame. Everyone keeps receipts." },
  fear: { name: "Fear", line: "Heads down. Things go unsaid, and people go quiet when someone walks in." },
};

/**
 * What each choice says about the floor you're building. Choice ids are the ones in content.ts,
 * socialScenes.ts and floorTalks.ts; sim's pickChoice records each as a "choice:<id>" flag.
 * t: trust, c: candor. Choices not listed lean neither way.
 */
export const CHOICE_AXES: Record<string, { t?: number; c?: number }> = {
  // First meetings and everyday talk.
  "mabel-sit": { t: 1 },
  "mabel-catch": { c: 1 },
  "holt-line": { c: 1 },
  "holt-later": { c: -1 },
  "elena-seat": { t: 1 },
  "elena-whose": { t: 1 },
  "tommy-four": { c: 1 },
  "tommy-leave": { c: -1 },
  "marcus-forty": { c: 1 },
  "priya-walk": { t: 1, c: 1 },
  "priya-sheet": { c: -1 },
  "jordan-out": { c: 1 },
  "jordan-quiet": { c: -1 },
  "jordan-say": { c: 1 },
  // Trust scenes.
  "soc-mabel-1a": { t: 1 },
  "soc-mabel-2a": { t: 1, c: 1 },
  "soc-mabel-2b": { c: -1 },
  "soc-mabel-3a": { c: 1 },
  "soc-holt-1a": { c: 1 },
  "soc-holt-3b": { c: 1 },
  "soc-elena-1a": { t: 1, c: 1 },
  "soc-elena-1b": { t: -1 },
  "soc-elena-2a": { t: 2 },
  "soc-elena-3a": { c: 1 },
  "soc-elena-3b": { t: 1 },
  "soc-tommy-1a": { c: 1 },
  "soc-tommy-2a": { t: 1 },
  "soc-tommy-3a": { t: 1 },
  "soc-marcus-1a": { c: 1 },
  "soc-marcus-2a": { c: 2 },
  "soc-marcus-2b": { t: 1, c: -2 },
  "soc-marcus-3a": { t: 1, c: 1 },
  "soc-priya-1a": { t: 1 },
  "soc-jordan-1a": { c: 1 },
  "soc-jordan-2a": { t: 2 },
  "soc-jordan-3a": { t: 1 },
};

/** Floor-talk choices: every "-t" backs someone up, every "-c" names the problem. */
function floorChoice(id: string): { t?: number; c?: number } | null {
  if (!id.startsWith("floor-")) return null;
  if (id.endsWith("-t")) return { t: 1 };
  if (id.endsWith("-c")) return { c: 1 };
  return null;
}

export interface CultureInput {
  flags: Record<string, boolean>;
  reports: number;
  catches: number;
  hides: number;
}

/** Trust and candor, from the week so far. */
export function cultureAxes(s: CultureInput): { trust: number; candor: number } {
  let trust = 0;
  let candor = 0;
  for (const key of Object.keys(s.flags)) {
    if (!s.flags[key]) continue;
    if (key.startsWith("choice:")) {
      const id = key.slice(7);
      const w = CHOICE_AXES[id] ?? floorChoice(id);
      if (w) {
        trust += w.t ?? 0;
        candor += w.c ?? 0;
      }
    } else if (key.startsWith("gift:")) {
      trust += 1;
    }
  }
  // Colt's plant: the floor starts with goodwill to spare (coltVoice.ts). A couple of good choices reach Respect.
  if (s.flags["plant:colt"]) {
    trust += COLT_HEADSTART;
    candor += COLT_HEADSTART;
  }
  candor += 2 * s.reports;
  trust += s.catches;
  candor += s.catches;
  trust -= 2 * s.hides;
  candor -= 2 * s.hides;
  return { trust, candor };
}

/** How far ahead Colt's floor starts on both axes. */
export const COLT_HEADSTART = 3;

export function cultureOf(s: CultureInput): Culture {
  const { trust, candor } = cultureAxes(s);
  // At Colt's plant one hide doesn't send heads down: it takes three, as it would anywhere people feel safe.
  const hideLimit = s.flags["plant:colt"] ? 3 : 2;
  if (s.hides >= hideLimit || trust <= -2 || candor <= -2) return "fear";
  if (trust >= 4 && candor >= 4) return "respect";
  if (trust >= 4 && candor <= 1) return "comfort";
  if (candor >= 4 && trust <= 1) return "distrust";
  return "guarded";
}
