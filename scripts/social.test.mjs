import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-social-"));
const entry = join(dir, "entry.ts");
writeFileSync(
  entry,
  [
    `export * from ${JSON.stringify(join(root, "src/game/social.ts"))};`,
    `export * from ${JSON.stringify(join(root, "src/game/cabLevels.ts"))};`,
    `export { SCENES } from ${JSON.stringify(join(root, "src/game/socialScenes.ts"))};`,
    `export { NPCS } from ${JSON.stringify(join(root, "src/game/content.ts"))};`,
    `export { createState, openTalk, pickChoice, bumpTrust } from ${JSON.stringify(join(root, "src/game/sim.ts"))};`,
    `export { setMuted } from ${JSON.stringify(join(root, "src/game/audio.ts"))};`,
  ].join("\n"),
);
const out = join(dir, "s.mjs");
const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`, "--loader:.png=empty"], {
  encoding: "utf8",
  cwd: root,
});
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
globalThis.localStorage ??= { getItem: () => null, setItem() {}, removeItem() {} };
// No speakers in a test. A stand-in Web Audio context: every call returns another stand-in.
const any = new Proxy(function () {}, {
  get: (_t, k) => (k === "currentTime" || k === "sampleRate" ? 44100 : k === Symbol.toPrimitive ? () => 0 : any),
  apply: () => any,
  construct: () => any,
  set: () => true,
});
globalThis.window ??= { AudioContext: any };
const S = await import(out);
S.setMuted(true);
const IDS = Object.keys(S.NPCS);

test("tiers follow trust gained since the first morning, with day gates", () => {
  assert.equal(S.socialTier(40, 40, 1), 0);
  assert.equal(S.socialTier(46, 40, 1), 1);
  assert.equal(S.socialTier(60, 40, 1), 1, "tier 2 waits for day 2");
  assert.equal(S.socialTier(60, 40, 2), 2);
  assert.equal(S.socialTier(80, 40, 3), 2, "tier 3 waits for day 4");
  assert.equal(S.socialTier(80, 40, 4), 3);
  assert.equal(S.socialTier(30, 40, 5), 0, "lost trust is tier 0");
});

test("every person has one scene per tier, each ending in a choice with unique ids", () => {
  const ids = new Set();
  for (const npc of IDS) {
    assert.deepEqual(S.SCENES[npc].map((sc) => sc.tier), [1, 2, 3], npc);
    for (const sc of S.SCENES[npc]) {
      assert.ok(sc.lines.length >= 2, `${npc} ${sc.tier}`);
      const last = sc.lines[sc.lines.length - 1];
      assert.ok(last.choices && last.choices.length >= 2, `${npc} ${sc.tier} ends in a choice`);
      for (const c of last.choices) {
        assert.ok(!ids.has(c.id), `duplicate choice id ${c.id}`);
        ids.add(c.id);
        assert.ok(c.reply.length > 0 && c.label.length > 0);
      }
      assert.ok(sc.known.length > 0 && sc.known.length < 140, `${npc} ${sc.tier} known line`);
    }
  }
});


// Overheard exchanges (floorTalks.ts) take a talk of their own; these tests are about scenes and moments.
const HEARD_FLOOR = Object.fromEntries(["mabel-holt", "mabel-jordan", "holt-elena", "holt-priya", "elena-jordan", "elena-tommy", "tommy-marcus", "tommy-mabel", "marcus-priya", "marcus-jordan", "priya-tommy", "priya-elena", "jordan-tommy", "jordan-holt"].map((id) => [`floor:${id}`, true]));

test("the real conversation path: a scene plays once, after the normal lines, and its choice moves trust", () => {
  const s = S.createState();
  s.mode = "play";
  s.day = 2;
  const npc = "elena";
  Object.assign(s.flags, HEARD_FLOOR);
  S.openTalk(s, npc); // first meeting
  const firstLen = s.dialogue.length;
  assert.equal(S.addScene(s, true), null, "no scene on the first meeting");
  assert.equal(s.dialogue.length, firstLen);
  S.bumpTrust(s, npc, 20); // gain enough for tier 2 on day 2
  S.openTalk(s, npc);
  const normal = s.dialogue.length;
  const scene = S.addScene(s, false);
  assert.equal(scene?.tier, 1, "lowest unseen scene first");
  assert.equal(s.dialogue.length, normal + scene.lines.length);
  assert.equal(s.flags["social:elena:1"], true);
  // The choice on the scene's last line, through sim's own pickChoice.
  s.dialogueI = s.dialogue.length - 1;
  const before = s.trust[npc];
  S.pickChoice(s, s.dialogue[s.dialogueI].choices[0]);
  assert.equal(s.trust[npc], before + scene.lines[scene.lines.length - 1].choices[0].trust);
  S.openTalk(s, npc);
  assert.equal(S.addScene(s, false)?.tier, 2, "next talk plays tier 2");
  S.openTalk(s, npc);
  assert.equal(S.addScene(s, false), null, "tier 3 waits for day 4");
});

test("a scene with a precondition waits for it and says what is missing", () => {
  const s = S.createState();
  s.day = 4;
  S.bumpTrust(s, "marcus", 40);
  s.flags["social:marcus:1"] = true;
  s.flags["social:marcus:2"] = true;
  assert.equal(S.dueScene(s, "marcus"), null);
  assert.match(S.nextHint(s, "marcus"), /hasn't told the floor/);
  s.flags.marcusSay = true;
  assert.equal(S.dueScene(s, "marcus")?.tier, 3);
});

test("cabinet ladder: clearing unlocks the next level once; level 3 at a hosted cabinet waits on the host", () => {
  const flags = {};
  assert.equal(S.cabLevel(flags, "fish"), 1);
  assert.deepEqual(S.recordCab(flags, "fish", 1, 3), { unlocked: null, waitsOn: null }, "below the clear score");
  assert.deepEqual(S.recordCab(flags, "fish", 1, 4), { unlocked: 2, waitsOn: null });
  assert.equal(S.cabLevel(flags, "fish"), 2);
  assert.deepEqual(S.recordCab(flags, "fish", 1, 6), { unlocked: null, waitsOn: null }, "no double unlock");
  assert.deepEqual(S.recordCab(flags, "fish", 2, 5), { unlocked: 3, waitsOn: null }, "unhosted: score is enough");
  const g = { "cab:golf:2": true };
  assert.deepEqual(S.recordCab(g, "golf", 2, 9, { trust: 45, start: 40 }), { unlocked: null, waitsOn: "mabel" });
  assert.equal(S.cabLevel(g, "golf"), 2);
  assert.deepEqual(S.recordCab(g, "golf", 2, 9, { trust: 55, start: 40 }), { unlocked: 3, waitsOn: null });
  assert.equal(S.cabLevel({}, "delay"), 1, "unlevelled cabinets stay at 1");
});

test("every ladder's tuning has three levels and gets harder in the expected direction", () => {
  const T = S.TUNE;
  for (const [k, v] of Object.entries(T)) assert.equal(v.length, 3, k);
  assert.ok(T.catchClock[2] < T.catchClock[0] && T.rodsBand[2] < T.rodsBand[0] && T.pebbleGate[2] < T.pebbleGate[0]);
  assert.ok(T.fishSpeed[2] > T.fishSpeed[0] && T.golfDamp[2] < T.golfDamp[0] && T.bowlDrift[2] > T.bowlDrift[0]);
  assert.ok(T.hordeStartRound[2] > T.hordeStartRound[0] && T.plotClock[2] < T.plotClock[0] && T.plotPest[2] > T.plotPest[0]);
});
