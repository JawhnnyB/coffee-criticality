import { talkLines, emptyResidue, NPCS, type NpcId } from "/home/claude/coffee-criticality/src/game/content";
import { RETURNING_FLAG } from "/home/claude/coffee-criticality/src/game/crewCarry";
import { vanScene, daysOffScene, openerScene, type RotationScene } from "/home/claude/coffee-criticality/src/game/nightwatch/rotationScenes";
import { shoreLine, NOT_HELD_SHORE } from "/home/claude/coffee-criticality/src/game/week";
const out: string[] = [];
const scene = (sc: RotationScene) => { out.push(`**${sc.title}** · _${sc.where}_`, ""); for (const l of sc.lines) out.push(l.who ? `> **${l.who[0].toUpperCase() + l.who.slice(1)}:** ${l.text}` : `> _${l.text}_`); out.push(""); };
out.push("# Tying the game together: new lines for the owner's approval", "",
  "Written by Claude, 25 November 2026. Generated from the code, so it is exactly what plays. Nothing here is approved yet.", "",
  "Voices follow `docs/characters.md`. Browser runs: `docs/audit/2026-11-25-cohesion/`.", "",
  "## 1. The crew remembers you (new week)", "",
  "The new-week dialog now says: _The crew remembers you: who you've met, what you've been through together, and what they gave you._ It has a second button, **New week, as a stranger**, which starts everyone from scratch.", "",
  "Carried: trust, who you've met, trust scenes and crew moments seen, gifts (Mabel's chalk, Tommy's lock, Holt's board seat, Elena's van, Jordan's trust), choices made with them, outage progress. Not carried: the plant, the incidents, culture, catches, hides. A returning week skips the opening introductions, and the trust day-gates no longer hold the crew back.", "",
  "**Day 1 of a returning week** (with the gifts; without them each person has a plainer line):", "");
const flags: Record<string, boolean> = { [RETURNING_FLAG]: true, tommyLock: true, elenaVan: true, mabelChalk: true, holtBoard: true, marcusSay: true, priyaWalk: true, jordanTrust: true };
const plain: Record<string, boolean> = { [RETURNING_FLAG]: true };
for (const id of Object.keys(NPCS) as NpcId[]) { flags[`${id}Talked`] = true; plain[`${id}Talked`] = true; }
for (const id of Object.keys(NPCS) as NpcId[]) {
  const a = talkLines(id, flags, 30, "morning", 1, null, emptyResidue(), false, null);
  const b = talkLines(id, plain, 30, "morning", 1, null, emptyResidue(), false, null);
  out.push(`- **${id[0].toUpperCase() + id.slice(1)}:** ${a.map((l) => l.text).join(" / ")}`);
  const diff = b.map((l) => l.text).filter((t) => !a.some((x) => x.text === t));
  if (diff.length) out.push(`  - _without the gift:_ ${diff.join(" / ")}`);
}
out.push("", "## 2. The move to nights", "", "### A good week", "");
const good = { held: true, hides: 0, trust: { jordan: 60 }, returning: false };
const poor = { held: false, hides: 1, trust: { jordan: 30 }, returning: false };
const worst = { held: false, hides: 3, trust: { jordan: 20 }, returning: false };
scene(vanScene(good)); scene(daysOffScene(good));
for (let n = 1; n <= 4; n++) scene(openerScene(n, false, good));
out.push("### A week that didn't hold (only the lines that change)", "");
out.push(`- Van: ${vanScene(poor).lines[1].text}`, `- Van, three hides: ${vanScene(worst).lines[1].text}`, `- Returning, good week: ${vanScene({ ...good, returning: true }).lines[1].text}`);
out.push(`- Days off: ${daysOffScene(poor).lines.slice(1).map((l) => l.text).join(" / ")}`, `- Days off, three hides: ${daysOffScene(worst).lines.slice(1).map((l) => l.text).join(" / ")}`);
out.push(`- Jordan's radio check: ${openerScene(2, false, poor).lines.map((l) => l.text).join(" / ")}`, "");
out.push("### A night stood again", "");
for (let n = 1; n <= 4; n++) out.push(`- Night ${n}: ${openerScene(n, true, good).lines.map((l) => (l.who ? `${l.who[0].toUpperCase() + l.who.slice(1)}: ` : "") + l.text).join(" / ")}`);
out.push("", "## 3. The two reloads", "",
  "- **Friday's fuel desk** (not practice): _This small core is where you work out the plan. Once you sign it, the Refuelling Outage on the desk lays the real 193-assembly core out the same way, and runs the cycle to see if your plan holds._ Signing it now opens the outage.",
  "- **The outage, Cycle 2:** shows Friday's map beside the real core, with **Lay out by Friday's plan**. The plan is read as freshness by distance from the centre; the real core's fuel is ranked by k∞ in Friday's thirds; the liveliest third goes where Friday put fresh fuel, never side by side; the quietest goes toward the fence. Only four-fold orbits move, so symmetry and burnups are kept.",
  "- **After the run:** _Friday's plan holds on the real core: peak … under the 1.37 limit, … days of power._ or _Friday's plan peaks at … on the real core, over the 1.37 limit. The hall's core is small and forgiving at the edge; a real core loses more there, so the outer fuel has to work harder and the liveliest fuel can't all crowd the middle. Swap orbits until it holds._",
  "- **What actually happens:** a signed Friday plan laid onto the real core peaks at about 2.2 to 2.4 against the 1.37 limit (the plant's own pattern: 1.45, 290 days). That's honest physics in this model: the classroom core rewards crowding fresh fuel inward; the real core doesn't. It's left as the lesson, not tuned away. If you'd rather the button produce a pattern that holds, that's a design choice for you.",
  "", "## 4. Moving between screens", "",
  "Stepping out to the desk shrinks the plant into its taskbar tab (0.2 s); coming back grows it out again. The desk, mini games, end-of-day and ending cards fade in; scene lines arrive one by one with the buttons ready from the start. Reduced motion (Settings or the system) turns all of it off. The day's room card no longer shows behind the night scenes.",
  "", "## 5. Narration", "",
  `- **Shore, the week held:** ${shoreLine("a", { valve: "caught", tag: "caught", dose: "open", log: "open" }, false, true)} _(fewer or more names change the last sentence)_`,
  `- **Shore, the week didn't hold:** ${NOT_HELD_SHORE}`,
  "- **Ending card title:** The floor holds / The week didn't hold (was \"Unfinished power\").",
  "- **End-of-day footer:** _Three things went unsaid. However good the numbers look, a week can't hold on that._ / _More got said out loud than kept quiet. That's something Holt can take to a review._ / _You're good at the work. The floor isn't safe enough yet for that to be enough._ Then: _Teaching model, not a license._",
  "- **Dawn:** _The lot is pale and cold. Elena passes you on her way in and puts a hand on your shoulder, just for a second._ / _Dawn on the lot. The log says what it says, and you wrote it straight._ / _The lot is empty. A night like that has to be stood again, and you knew it before anyone said so._",
  "", "## Still in the old voice", "",
  "- `sim.ts` is frozen: Mabel's \"You left a lie on the glass\" and \"Three hides is a week I will not pretend was honest\", Tommy's lockout result lines, the ending-walk objective (\"They came. Walk once.\").",
  "- The title-screen tagline and thesis (\"Catch greater than heroics\") are the game's own slogan, so they were left alone.",
  "- The plant paper at dawn keeps its newspaper style on purpose.", "");
process.stdout.write(out.join("\n"));
