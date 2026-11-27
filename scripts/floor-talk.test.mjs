#!/usr/bin/env node
// Floor culture (floorCulture.ts), overheard exchanges (floorTalks.ts), tokens and toys (parlorPrizes.ts),
// and how they open a conversation (social.ts addScene).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-floor-"));
const entry = join(dir, "entry.ts");
const out = join(dir, "floor.mjs");
writeFileSync(entry, ["floorCulture", "floorTalks", "parlorPrizes", "social"].map((f) => `export * from ${JSON.stringify(join(root, `src/game/${f}.ts`))};`).join("\n") + `\nexport { NPCS, emptyResidue } from ${JSON.stringify(join(root, "src/game/content.ts"))};`);
const b = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`, "--loader:.png=empty", "--external:@tauri-apps/*"], { encoding: "utf8", cwd: root });
if (b.status !== 0) throw new Error(b.stderr || b.stdout);
const F = await import(out);
const CULTURES = ["guarded", "respect", "comfort", "distrust", "fear"];
const base = { reports: 0, catches: 0, hides: 0 };
const pick = (...ids) => Object.fromEntries(ids.map((id) => [`choice:${id}`, true]));

test("every week starts guarded, and each kind of choice pulls the floor its own way", () => {
  assert.equal(F.cultureOf({ ...base, flags: {} }), "guarded");
  const trusting = pick("mabel-sit", "elena-seat", "soc-elena-2a", "floor-mabel-holt-t");
  assert.equal(F.cultureOf({ ...base, flags: trusting }), "comfort");
  const calling = pick("marcus-forty", "jordan-out", "floor-tommy-marcus-c");
  assert.equal(F.cultureOf({ reports: 1, catches: 0, hides: 0, flags: calling }), "distrust");
  assert.equal(F.cultureOf({ reports: 1, catches: 1, hides: 0, flags: { ...trusting, ...calling } }), "respect");
  assert.equal(F.cultureOf({ reports: 3, catches: 2, hides: 2, flags: { ...trusting, ...calling } }), "fear", "two hides and heads go down");
});

test("fourteen exchanges: two per person, each with someone else, every culture written", () => {
  assert.equal(F.FLOOR_TALKS.length, 14);
  for (const id of Object.keys(F.NPCS)) {
    const mine = F.FLOOR_TALKS.filter((t) => t.npc === id);
    assert.deepEqual(mine.map((t) => t.n).sort(), [2, 3], id);
    for (const t of mine) assert.notEqual(t.with, id);
  }
  const ids = new Set();
  for (const t of F.FLOOR_TALKS) {
    assert.ok(!ids.has(t.id)); ids.add(t.id);
    for (const c of CULTURES) {
      const lines = F.floorLines(t, c);
      assert.ok(lines.length >= 5, `${t.id} ${c}`);
      const spoken = new Set(lines.filter((l) => l.speaker).map((l) => l.speaker));
      assert.ok(spoken.has(F.SPEAKER[t.npc]) && spoken.has(F.SPEAKER[t.with]), `${t.id} ${c}: both of them speak`);
      for (const l of lines) assert.ok(l.text.length <= 125, `${t.id} ${c}: ${l.text}`);
      const ask = lines[lines.length - 1];
      assert.deepEqual(ask.choices.map((ch) => ch.id), [`floor-${t.id}-t`, `floor-${t.id}-c`]);
      for (const ch of ask.choices) { assert.ok(ch.label.length <= 90, ch.label); assert.ok(ch.reply.length <= 150, ch.reply); }
    }
    const texts = CULTURES.map((c) => t.lines[c].map((x) => x[1]).join(" "));
    assert.equal(new Set(texts).size, 5, `${t.id}: five different floors`);
  }
  for (const id of Object.keys(F.NPCS)) assert.equal(F.FLOOR_TALKS.filter((t) => t.says.about === id).length, 2, `two others talk about ${id}`);
});

test("conversations: the 2nd and 3rd talk open with what you walk in on, in the floor's culture", () => {
  const s = { mode: "dialogue", talkNpc: "tommy", dialogue: [{ speaker: "Tommy", text: "Morning, boss.", mood: "wry" }], day: 2, trust: { tommy: F.NPCS.tommy.startTrust }, flags: { tommyTalked: true }, ended: null, reports: 0, catches: 0, hides: 0, residue: F.emptyResidue(), maintDone: false };
  F.addScene(s, true); // first meeting: counted, nothing added
  assert.equal(s.dialogue.length, 1);
  s.dialogue = [{ speaker: "Tommy", text: "Morning, boss.", mood: "wry" }];
  F.addScene(s, false);
  assert.equal(s.dialogue[0].speaker, "", "starts with what you walk in on");
  assert.ok(s.dialogue.some((l) => l.speaker === "Marcus"));
  assert.equal(s.flags["floor:tommy-marcus"], true);
  assert.equal(F.saysAbout(s.flags, "marcus").length, 1);
  s.dialogue = [{ speaker: "Tommy", text: "Morning.", mood: "wry" }];
  Object.assign(s.flags, pick("mabel-sit", "elena-seat", "soc-elena-2a", "floor-x-t"));
  F.addScene(s, false);
  assert.ok(s.dialogue.some((l) => l.speaker === "Mabel" && l.text === F.FLOOR_TALKS.find((t) => t.id === "tommy-mabel").lines.comfort[0][1]), "the comfortable floor's version");
});

test("tokens: a run pays 1, a cleared level 2, and no more than 3 a cabinet a day", () => {
  const flags = {};
  assert.equal(F.tokensForRun(flags, "golf", 1, 0, false), 0);
  assert.equal(F.tokensForRun(flags, "golf", 1, 5, true), 2);
  assert.equal(F.tokensForRun(flags, "golf", 1, 9, true), 1);
  assert.equal(F.tokensForRun(flags, "golf", 1, 9, true), 0);
  assert.equal(F.tokensForRun(flags, "bowl", 1, 3, false), 1);
  assert.equal(F.tokensForRun(flags, "golf", 2, 3, false), 1, "a new day");
});

test("six toys, one per person but Holt; each earned through their own cabinet", () => {
  assert.equal(F.TOYS.length, 6);
  assert.ok(!F.TOYS.some((t) => t.npc === "holt"));
  assert.equal(new Set(F.TOYS.map((t) => t.cab)).size, 6);
  const toy = F.TOYS.find((t) => t.npc === "jordan");
  const flags = {};
  let jar = { tokens: 20, pocket: [] };
  assert.equal(F.toyState(toy, flags, jar), "locked");
  assert.equal(F.buyToy(toy, flags, jar), null);
  flags["cab:bowl:2"] = true;
  assert.equal(F.toyState(toy, flags, jar), "shelf");
  assert.equal(F.buyToy(toy, flags, { tokens: toy.cost - 1, pocket: [] }), null, "not enough tokens");
  jar = F.buyToy(toy, flags, jar);
  assert.equal(jar.tokens, 20 - toy.cost);
  assert.equal(F.toyState(toy, flags, jar), "pocket");
  assert.equal(F.giftDue("jordan", flags, jar), toy);
  assert.equal(F.giftDue("holt", flags, jar), null);
  jar = F.giveToy(toy, flags, jar);
  assert.equal(flags["gift:jordan"], true);
  assert.equal(F.toyState(toy, flags, jar), "given");
  for (const t of F.TOYS) {
    const ask = t.scene[t.scene.length - 1];
    assert.equal(ask.choices.length, 2);
    for (const l of t.scene) { assert.equal(l.speaker, F.SPEAKER[t.npc]); assert.ok(l.text.length <= 125, l.text); }
  }
});

test("every toy has its 24x24 pixel art, and the gift scene holds it up", () => {
  for (const t of F.TOYS) {
    const path = F.toyArt(t.npc);
    assert.equal(path, `/art/ui/toys/toy-${t.npc}.png`);
    const png = readFileSync(join(root, "public", path));
    assert.equal(png.toString("latin1", 1, 4), "PNG");
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [24, 24], t.npc);
  }
  if (!globalThis.localStorage) {
    const m = new Map();
    globalThis.localStorage = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
  }
  const toy = F.TOYS.find((t) => t.npc === "tommy");
  F.writeJar({ tokens: 0, pocket: ["tommy"] });
  const s = { mode: "dialogue", talkNpc: "tommy", dialogue: [{ speaker: "Tommy", text: "Hey." }], day: 2, trust: { tommy: F.NPCS.tommy.startTrust }, flags: { tommyTalked: true }, ended: null, reports: 0, catches: 0, hides: 0, residue: F.emptyResidue(), maintDone: false };
  const scene = F.addScene(s, false);
  assert.equal(scene?.title, toy.name);
  const gift = s.dialogue.slice(1);
  assert.equal(gift.length, toy.scene.length);
  assert.ok(gift.every((l) => l.item === "/art/ui/toys/toy-tommy.png"), "every gift line carries the toy");
  assert.equal(s.dialogue[0].item, undefined, "the hello before it doesn't");
  assert.equal(toy.scene[0].item, undefined, "the shelf's own scene isn't changed");
});

test("day 2 onward: the end of day 1 doesn't silence scenes, exchanges or gifts", () => {
  // sim's finishDay sets s.ended at every day's end. Only the walk to the shore should stop extra scenes.
  const s = { mode: "dialogue", talkNpc: "priya", dialogue: [{ speaker: "Priya", text: "Morning.", mood: "even" }], day: 2, trust: { priya: F.NPCS.priya.startTrust }, flags: { priyaTalked: true, "social:met:priya": true, "talks:priya:1": true }, ended: "c", reports: 0, catches: 0, hides: 0, residue: F.emptyResidue(), maintDone: false };
  assert.ok(F.addScene(s, false), "day 2's talk still opens with the exchange");
  s.flags.endingWalk = true;
  s.dialogue = [];
  assert.equal(F.addScene(s, false), null, "the walk to the shore stays quiet");
});

test("each fuel cycle has its own fourteen exchanges, built to the same rules", () => {
  const ids = new Set();
  assert.equal(F.FLOOR_TALK_SETS.length, 3);
  for (const { talks } of F.FLOOR_TALK_SETS) {
    assert.equal(talks.length, 14);
    for (const id of Object.keys(F.NPCS)) {
      const mine = talks.filter((t) => t.npc === id);
      assert.deepEqual(mine.map((t) => t.n).sort(), [2, 3], id);
      for (const t of mine) assert.notEqual(t.with, id);
      assert.equal(talks.filter((t) => t.says.about === id).length, 2, `${id} is talked about twice`);
    }
    for (const t of talks) {
      assert.ok(!ids.has(t.id), `unique id ${t.id}`);
      ids.add(t.id);
      for (const c of CULTURES) {
        assert.ok(t.lines[c]?.length >= 3, `${t.id} ${c}`);
        for (const [, text] of t.lines[c]) assert.ok(text.length <= 125, `${t.id} ${c}: ${text}`);
      }
      assert.ok(t.trust.label.length <= 90 && t.callout.label.length <= 90, t.id);
      assert.ok(t.trust.reply.length <= 150 && t.callout.reply.length <= 150, t.id);
    }
  }
});

test("the week picks the cycle's exchanges; old saves keep the first set", () => {
  assert.equal(F.talksForWeek(0), F.FLOOR_TALKS);
  assert.equal(F.talksForWeek(3), F.FLOOR_TALKS);
  assert.equal(F.talksForWeek(4)[0].id.startsWith("c2-"), true);
  assert.equal(F.talksForWeek(6)[0].id.startsWith("c2-"), true);
  assert.equal(F.talksForWeek(7)[0].id.startsWith("c3-"), true);
  assert.equal(F.talksForWeek(10)[0].id.startsWith("c3-"), true);
  const due = F.dueFloorTalk({ "cw:5": true }, "tommy", 2);
  assert.equal(due.id, "c2-tommy-jordan");
  assert.equal(F.dueFloorTalk({}, "tommy", 2).id.startsWith("c2-"), false);
});
