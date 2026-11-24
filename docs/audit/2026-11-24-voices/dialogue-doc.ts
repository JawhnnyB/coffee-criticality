import { NPCS, NPC_INTRO, INTRO, talkLines, emptyResidue, roleMouth, relationLine, floorTies, type Line, type NpcId } from "/home/claude/work/plates/src/game/content.ts";
import { SCENES } from "/home/claude/work/plates/src/game/socialScenes.ts";
import { WEEK, eodNpcLine } from "/home/claude/work/plates/src/game/week.ts";
import { ELENA, ELENA_CURT, ELENA_RELIEVED, ELENA_RELIEVED_CURT, ELENA_A_LATE, elenaLine } from "/home/claude/work/plates/src/game/nightwatch/turnover.ts";
import { A_ROTATION_SCENE, DAWN_CREW_LINE } from "/home/claude/work/plates/src/game/nightwatch/crewUnlock.ts";
import { JORDAN_WARM, JORDAN_TERSE } from "/home/claude/work/plates/src/game/nightwatch/model.ts";

const out: string[] = [];
const fx = (c: { trust?: number; culture?: number; flag?: string }) =>
  [c.trust ? `trust ${c.trust > 0 ? "+" : ""}${c.trust}` : "", c.culture ? `culture +${c.culture}` : "", c.flag ? `flag ${c.flag}` : ""].filter(Boolean).join(", ");
function put(lines: Line[]) {
  for (const l of lines) {
    out.push(`> **${l.speaker}:** ${l.text}`);
    for (const c of l.choices ?? []) out.push(`> - *You:* "${c.label}" → ${c.reply}${fx(c) ? ` _(${fx(c)})_` : ""}`);
  }
  out.push("");
}
const seenText = new Set<string>();
function putNew(title: string, lines: Line[]) {
  const key = lines.map((l) => l.text).join("|");
  if (seenText.has(key)) return;
  seenText.add(key);
  out.push(`**${title}**`, "");
  put(lines);
}
const R = (k?: string, how?: string) => ({ ...emptyResidue(), ...(k ? { [k]: how } : {}) });

out.push(
  "# The crew, rewritten: draft for the owner's approval",
  "",
  "Written by Claude, 24 November 2026. Generated from the code, so it is exactly what plays. Nothing here is approved yet.",
  "",
  "Who each person is, what they want, what they're afraid of and what they got wrong: [`docs/characters.md`](characters.md). Every line below is written from that sheet. The crew moments from 23 November are in [`docs/crew-moments-draft.md`](crew-moments-draft.md) and are not repeated here.",
  "",
  "What did not change: every choice id, trust and culture number, and flag (checked by script: 65 choices, 0 differences), when each line plays, and what each scene teaches (the four words, two sets of eyes, say the number first, walk what you sign).",
  "",
  "Not rewritten, because the file is frozen: two lines in `sim.ts` (Mabel's \"Three hides is a week I will not pretend was honest\" and Tommy's lockout result lines). They still read in the old voice.",
  "",
  "To approve: edit or strike lines here or in the code, and tell Claude or Grok. Then this header changes to approved.",
  "",
  "## Opening scenes",
  "",
);
for (const b of INTRO) {
  out.push(`### ${b.kicker}: ${b.title}`, "", `_${b.body}_`, "");
  for (const ex of b.exchanges) out.push(ex.you ? `> *You:* ${ex.line}` : `> ${ex.line}`);
  out.push("");
}
out.push("## Holt's morning briefs", "");
for (const d of WEEK) out.push(`- **Day ${d.n}.** ${d.holt.replace(/^Holt: /, "")}`);
out.push("", "## Each person", "");
for (const id of Object.keys(NPCS) as NpcId[]) {
  const n = NPCS[id];
  out.push(`### ${n.name}`, "", `**Crew page:** ${n.note}`, "", `**Header tag:** ${NPC_INTRO[id].beat}  ·  **Narration on opening a talk:** ${NPC_INTRO[id].who}`, "", `**Crew page, how you stand:** ${relationLine(id, { [`${id}Talked`]: true }, 30)}`, "");
  putNew("First conversation", talkLines(id, {}, 30, "morning", 1, null, R(), false, null));
  for (const day of [1, 2, 3, 4, 5]) putNew(`Later talks, day ${day}`, talkLines(id, { [`${id}Talked`]: true }, 20, "morning", day, null, R(), false, null));
  for (const k of ["valve", "tag", "dose", "log"]) {
    for (const how of ["caught", "hid"]) {
      for (const day of [2, 4]) putNew(`After the ${k} was ${how === "caught" ? "caught" : "hidden"} (day ${day})`, talkLines(id, { [`${id}Talked`]: true, shuffle: true }, 30, "morning", day, null, R(k, how), false, null));
    }
  }
  if (id === "priya") {
    putNew("After the physics bench", talkLines(id, { priyaTalked: true, physPlayed: true }, 20, "morning", 2, null, R(), false, null));
    putNew("After the Monte Carlo bench", talkLines(id, { priyaTalked: true, physMcHeld: true }, 20, "morning", 2, null, R(), false, null));
  }
  if (id === "jordan") putNew("After you shared a catch with him", talkLines(id, { jordanTalked: true, peered: true }, 20, "morning", 3, null, R(), false, null));
  out.push("**The Friday shore walk** (one line, picked by how the week went)", "");
  const end = new Set<string>();
  for (const ended of ["a", "c"] as const) for (const hides of [0, 1, 3]) for (const catches of [0, 1, 5]) for (const k of ["valve", "tag", "dose", "log", ""]) {
    const res = hides ? R(k || "valve", "hid") : R(k || undefined, k ? "caught" : undefined);
    for (const l of talkLines(id, {}, 30, "afternoon", 5, null, res, true, ended, { catches, hides, reports: catches ? 2 : 0, trust: 50 })) end.add(`- ${ended === "a" ? "Week held" : "Week did not hold"}: ${l.text.replace(/\b[0-9]+\b/g, "N")}`);
  }
  out.push(...[...end].sort(), "");
  out.push("**Trust scenes**", "");
  for (const sc of SCENES[id]) {
    out.push(`*Tier ${sc.tier}: "${sc.title}"* — crew page after: ${sc.known}`, "");
    put(sc.lines);
  }
}
out.push("## Mabel on your background (day 2)", "");
for (const r of ["transferred", "promoted", "military", "veteran"] as const) out.push(`- **${r}:** ${roleMouth(r)}`);
out.push("", "## How two people stand with each other (crew page)", "");
const all = { mabelTalked: true, holtTalked: true, elenaTalked: true, tommyTalked: true, marcusTalked: true, priyaTalked: true, jordanTalked: true };
const ties = new Map<string, Set<string>>();
for (const res of [R(), { valve: "caught", tag: "caught", dose: "caught", log: "caught" }, { valve: "hid", tag: "hid", dose: "hid", log: "hid" }] as never[]) for (const t of floorTies(res, all)) { if (!ties.has(t.pair)) ties.set(t.pair, new Set()); ties.get(t.pair)!.add(t.line); }
for (const [pair, lines] of ties) out.push(`- **${pair}:** ${[...lines].join(" / ")}`);
out.push("", "## End-of-day card", "");
const eod = new Set<string>();
for (const hides of [0, 3]) for (const ended of ["a", "c", null] as const) for (const f of [{}, { elenaSecondEyes: true }, { holtVolume: true }, { tommySentence: true }, { priyaPeak: true }, { delayPrompt: true }, { catchMiss: true }, { hid: true }]) eod.add(eodNpcLine({ hides, ended, flags: f }));
out.push(...[...eod].map((l) => `- ${l}`), "");
out.push("## Night Watch", "", "**Elena at the 06:00 turnover**", "");
for (const g of ["A", "B", "C", "D", "F"] as const) out.push(`- **${g}:** ${ELENA[g]}  ·  _after a hidden day log:_ ${ELENA_CURT[g]}`);
out.push(`- **A, every catch after the alarm:** ${ELENA_A_LATE}`, `- **Relieved:** ${ELENA_RELIEVED}  ·  _after a hidden day log:_ ${ELENA_RELIEVED_CURT}`, `- **Night ended before six:** ${elenaLine("C", false, "trip")}  ·  _cool:_ ${elenaLine("C", true, "trip")}`, "");
out.push("**Jordan on the radio, good week**", "", ...JORDAN_WARM.map((l) => `- ${l}`), "", "**Jordan on the radio, bad week**", "", ...JORDAN_TERSE.map((l) => `- ${l}`), "");
out.push("**Elena after four A's**", "", `Dawn card: ${DAWN_CREW_LINE}`, "");
put(A_ROTATION_SCENE.lines);
out.push("Radio lines carried from the day week live in `src/game/nightwatch/carryover.ts`.", "");
process.stdout.write(out.join("\n"));
