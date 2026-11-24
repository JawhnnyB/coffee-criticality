// Crew moments (Claude, 23 November 2026): each plays only on its own record, once, never with a tier scene.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "moments-"));
const entry = join(dir, "entry.ts");
writeFileSync(
  entry,
  `export * from ${JSON.stringify(join(root, "src/game/crewMoments.ts"))};\n` +
    `export { addScene, dueScene } from ${JSON.stringify(join(root, "src/game/social.ts"))};\n` +
    `export { SCENES } from ${JSON.stringify(join(root, "src/game/socialScenes.ts"))};\n` +
    `export { NPCS } from ${JSON.stringify(join(root, "src/game/content.ts"))};\n`,
);
const out = join(dir, "bundle.cjs");
const esbuild = process.env.ESBUILD || join(root, "node_modules/.bin/esbuild");
// The social module reads localStorage for the crew profile; give node a stand-in.
writeFileSync(join(dir, "shim.js"), "globalThis.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};globalThis.window=globalThis;");
execFileSync(esbuild, [entry, "--bundle", "--platform=node", `--outfile=${out}`, "--log-level=error", `--inject:${join(dir, "shim.js")}`]);
const M = createRequire(import.meta.url)(out);

const npcs = Object.keys(M.NPCS);
const trustAtStart = () => Object.fromEntries(npcs.map((n) => [n, M.NPCS[n].startTrust]));
const week = (over = {}) => ({
  mode: "dialogue",
  talkNpc: null,
  dialogue: [],
  day: 5,
  trust: trustAtStart(),
  flags: {},
  ended: null,
  residue: { valve: "open", tag: "open", dose: "open", log: "open" },
  hides: 0,
  catches: 0,
  maintDone: false,
  ...over,
});

test("ten moments, unique ids and choice ids, every speaker is the person", () => {
  assert.equal(M.MOMENTS.length, 10);
  const ids = new Set(M.MOMENTS.map((m) => m.id));
  assert.equal(ids.size, 10);
  const choiceIds = new Set();
  for (const sc of Object.values(M.SCENES).flat()) for (const l of sc.lines) for (const c of l.choices ?? []) choiceIds.add(c.id);
  for (const m of M.MOMENTS) {
    assert.ok(npcs.includes(m.npc), m.id);
    const name = M.NPCS[m.npc].name;
    for (const l of m.lines) {
      assert.ok(name.includes(l.speaker), `${m.id}: ${l.speaker} is not ${name}`);
      assert.ok(l.text.length <= 125, `${m.id}: line over 125 characters (keep it phone-sized)`);
      for (const c of l.choices ?? []) {
        assert.ok(!choiceIds.has(c.id), `duplicate choice id ${c.id}`);
        assert.ok(c.label.length <= 90 && c.reply.length <= 150, `${c.id}: choice or reply too long for a phone`);
        choiceIds.add(c.id);
      }
    }
    assert.ok(m.lines.at(-1).choices?.length >= 2, `${m.id} ends with a choice`);
    assert.ok(m.lines.length >= 4, `${m.id} is a conversation, not a one-liner`);
  }
});

test("each moment plays only on its own record and its day", () => {
  const cases = [
    ["valve-said", { residue: { valve: "caught", tag: "open", dose: "open", log: "open" } }],
    ["valve-hid", { residue: { valve: "hid", tag: "open", dose: "open", log: "open" } }],
    ["tag-moved", { residue: { valve: "open", tag: "hid", dose: "open", log: "open" } }],
    ["dose-said", { residue: { valve: "open", tag: "open", dose: "caught", log: "open" } }],
    ["log-unedited", { residue: { valve: "open", tag: "open", dose: "open", log: "caught" } }],
    ["marcus-check", { catches: 4 }],
    ["jordan-distance", { hides: 2 }],
    ["mabel-maint", { maintDone: true }],
    ["elena-nights", { catches: 3 }],
  ];
  for (const [id, rec] of cases) {
    const m = M.MOMENTS.find((x) => x.id === id);
    const quiet = week({ day: 5 });
    if (id !== "jordan-rounds") assert.equal(m.when(quiet), false, `${id} fires on an empty week`);
    assert.equal(m.when(week(rec)), true, `${id} does not fire on its record`);
    assert.equal(M.dueMoment(week({ ...rec, day: m.day - 1 }), m.npc)?.id === id, false, `${id} fires before day ${m.day}`);
  }
  assert.equal(M.MOMENTS.find((x) => x.id === "elena-nights").when(week({ catches: 3, hides: 1 })), false, "a hide keeps Elena's nights talk back");
});

test("a moment plays once, and never in the same conversation as a tier scene", () => {
  const s = week({ day: 5, residue: { valve: "caught", tag: "open", dose: "open", log: "open" } });
  s.talkNpc = "tommy";
  // Tommy has no tier yet (trust at start), so the moment plays.
  const first = M.addScene(s, false);
  assert.equal(first?.title, "The repack");
  assert.ok(s.flags["moment:valve-said"]);
  const n = s.dialogue.length;
  s.dialogue = [];
  assert.equal(M.addScene(s, false), null, "heard moments do not repeat");
  assert.equal(s.dialogue.length, 0);
  // Raise Tommy to tier 1: the tier scene plays and the next moment waits.
  const t = week({ day: 5, maintDone: true, residue: { valve: "hid", tag: "open", dose: "open", log: "open" } });
  t.talkNpc = "tommy";
  t.trust.tommy += 7;
  const got = M.addScene(t, false);
  assert.equal(got?.title, M.SCENES.tommy[0].title, "the tier scene goes first");
  assert.equal(t.flags["moment:valve-hid"], undefined, "the moment waits for the next conversation");
  assert.ok(n > 0);
});

test("the first meeting and the ending walk never get a moment", () => {
  const s = week({ day: 5, maintDone: true });
  s.talkNpc = "mabel";
  assert.equal(M.addScene(s, true), null);
  s.flags.endingWalk = true;
  assert.equal(M.addScene(s, false), null);
});
