// Generates docs/floor-talk-draft.md from the code.
import { FLOOR_TALK_SETS, SPEAKER } from "../../../src/game/floorTalks";
import { CULTURE_INFO, CHOICE_AXES, type Culture } from "../../../src/game/floorCulture";
import { TOYS, NO_TOY_FOR_HOLT, TOKENS_PER_DAY_PER_CAB } from "../../../src/game/parlorPrizes";
const C: Culture[] = ["guarded", "respect", "comfort", "distrust", "fear"];
const out: string[] = [];
out.push("# The floor between them: draft for the owner's approval", "",
  "Written by Claude, 25 November 2026. Generated from the code, so it is exactly what plays. Nothing here is approved yet.", "",
  "Browser runs: `docs/audit/2026-11-25-floor/`. Voices: `docs/characters.md`.", "",
  "## How the floor's culture works", "",
  "Two things your choices move, worked out fresh from the week so far (nothing new is saved):", "",
  "- **Trust:** sitting with people, peer checks, backing someone up, giving a gift. Each catch adds 1.",
  "- **Calling each other out:** reports (2 each), catches, naming a problem, telling someone they're wrong.",
  "- **Hiding** costs 2 of each.", "", "Five cultures:", "");
for (const c of C) out.push(`- **${CULTURE_INFO[c].name}:** ${CULTURE_INFO[c].line}`);
out.push("", "Thresholds: Respect at trust 4 and calling-out 4; Comfort at trust 4 with calling-out 1 or less; Distrust at calling-out 4 with trust 1 or less; Fear at two hides, or either below −2; otherwise Guarded. Every week starts Guarded. Comfort is the one you didn't name: trust without calling out is its own hazard on a plant floor, so I added it.", "",
  `Existing choices that lean one way (${Object.keys(CHOICE_AXES).length}): ${Object.entries(CHOICE_AXES).map(([k, v]) => `\`${k}\` ${[v.t ? `trust ${v.t > 0 ? "+" : ""}${v.t}` : "", v.c ? `calling out ${v.c > 0 ? "+" : ""}${v.c}` : ""].filter(Boolean).join(", ")}`).join("; ")}.`, "",
  "The crew page shows the culture, both numbers and what moves them. The end-of-day card names the floor's culture that day.", "",
  "## What you walk in on", "",
  "Your 2nd and 3rd talk with each person each week opens with them and someone else. The same situation is written five ways, one per culture. It ends with them turning to you: back someone up (trust +1, and +1 trust with that person) or name the problem (calling out +1, culture +1). Afterward, the crew page shows what one of them said about the other.", "");
const SET_NAME = ["Cycle 1 (weeks 1–3): the first weeks", "Cycle 2 (weeks 4–6): after the first outage", "Cycle 3 and the equilibrium week (weeks 7–10): what you've built"];
for (const [k, set] of FLOOR_TALK_SETS.entries()) {
out.push(`## ${SET_NAME[k]}`, "");
for (const t of set.talks) {
  out.push(`### ${SPEAKER[t.npc]} and ${SPEAKER[t.with]}: "${t.title}" (talk ${t.n})`, "", `_${t.scene}_`, "");
  for (const c of C) {
    out.push(`**${CULTURE_INFO[c].name}**`, "");
    for (const [who, text] of t.lines[c]) out.push(`> **${who ? SPEAKER[who] : ""}:** ${text}`);
    out.push("");
  }
  out.push(`**${SPEAKER[t.npc]}, to you:** ${t.ask}`, "", `- *Back them up:* "${t.trust.label}" → ${t.trust.reply}`, `- *Name it:* "${t.callout.label}" → ${t.callout.reply}`, "", `**Crew page, about ${SPEAKER[t.says.about]}:** ${t.says.text}`, "");
}
}
out.push("## Tokens and toys", "",
  `Brass tokens from Mabel's jar. On the eight levelled cabinets, a finished run pays 1 and clearing the level's score pays 2, at most ${TOKENS_PER_DAY_PER_CAB} per cabinet per day. The jar survives a new week.`, "",
  "Each person but Holt has a toy, tied to the cabinet that's theirs. It goes on Mabel's prize shelf (under the cabinets in the arcade) when you clear that cabinet's level 1. Buy it with tokens, and you give it to them at your next talk: a short scene, +4 trust, a choice worth +2 more, and they keep it across weeks. It's listed on their crew entry.", "",
  `**Holt:** Mabel says, "${NO_TOY_FOR_HOLT}"`, "");
for (const toy of TOYS) {
  out.push(`### ${toy.name}, for ${SPEAKER[toy.npc]} · ${toy.cabTitle} · ${toy.cost} tokens`, "", `_${toy.blurb}_`, "");
  for (const l of toy.scene) {
    out.push(`> **${l.speaker}:** ${l.text}`);
    for (const ch of l.choices ?? []) out.push(`> - *You:* "${ch.label}" → ${ch.reply}`);
  }
  out.push("", `**Crew page:** ${toy.known}`, "");
}
process.stdout.write(out.join("\n"));
