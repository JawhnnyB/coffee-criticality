#!/usr/bin/env node
// The crew remembers you between weeks (src/game/crewCarry.ts), and a returning week reads like one.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-carry-"));
const entry = join(dir, "entry.ts");
const out = join(dir, "carry.mjs");
writeFileSync(
  entry,
  [
    `export * from ${JSON.stringify(join(root, "src/game/crewCarry.ts"))};`,
    `export { talkLines, emptyResidue, NPCS } from ${JSON.stringify(join(root, "src/game/content.ts"))};`,
    `export { tierOf } from ${JSON.stringify(join(root, "src/game/social.ts"))};`,
  ].join("\n"),
);
const bundled = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`, "--loader:.png=empty", "--external:@tauri-apps/*"],
  { encoding: "utf8", cwd: root },
);
if (bundled.status !== 0) throw new Error(bundled.stderr || bundled.stdout || "esbuild failed");
const C = await import(out);

const weekOne = {
  role: "transferred",
  trust: { mabel: 70, holt: 52, elena: 61, tommy: 66, marcus: 40, priya: 58, jordan: 63 },
  flags: {
    mabelTalked: true, tommyTalked: true, jordanTalked: true, tommyLock: true, mabelChalk: true, jordanTrust: true,
    "social:mabel:1": true, "social:tommy:3": true, "moment:valve-said": true, "outage:c2:done": true,
    elenaSecondEyes: true, holtAfternoon: true, hid: true, catchMiss: true, endingWalk: true, "rot:nights": true, "night:1:grade:A": true,
  },
};

test("a finished week leaves the people, not the week", () => {
  const c = C.snapshotCrew(weekOne, null);
  assert.equal(c.week, 1);
  assert.equal(c.trust.tommy, 66);
  for (const k of ["tommyLock", "mabelChalk", "jordanTrust", "social:tommy:3", "moment:valve-said", "outage:c2:done", "mabelTalked"]) assert.ok(c.flags.includes(k), k);
  for (const k of ["elenaSecondEyes", "holtAfternoon", "hid", "catchMiss", "endingWalk", "rot:nights", "night:1:grade:A"]) assert.ok(!c.flags.includes(k), k);
});

test("weeks count up, and no shift means nothing new to remember", () => {
  const one = C.snapshotCrew(weekOne, null);
  assert.equal(C.snapshotCrew(weekOne, one).week, 2);
  assert.equal(C.snapshotCrew({ role: null, trust: {}, flags: {} }, one), one);
  assert.equal(C.snapshotCrew({ role: null, trust: {}, flags: {} }, null), null);
});

test("a fresh shift gets the crew back, marked as a returning week", () => {
  const fresh = { trust: { mabel: 40, holt: 28, elena: 32, tommy: 34, marcus: 22, priya: 46, jordan: 30 }, flags: { priyaTalked: true } };
  const next = C.applyCrew(fresh, C.snapshotCrew(weekOne, null));
  assert.equal(next, 2);
  assert.equal(fresh.trust.tommy, 66);
  assert.equal(fresh.trust.priya, 58);
  assert.equal(fresh.flags.tommyLock, true);
  assert.equal(fresh.flags[C.RETURNING_FLAG], true);
  assert.equal(fresh.flags.hid, undefined);
  const cold = { trust: { priya: 46 }, flags: {} };
  C.applyCrew(cold, { week: 1, trust: { priya: 10 }, flags: [] });
  assert.equal(cold.trust.priya, 46, "never below where a week starts");
  const none = { trust: {}, flags: {} };
  assert.equal(C.applyCrew(none, null), 1);
  assert.equal(none.flags[C.RETURNING_FLAG], undefined);
});

test("a returning crew is not held back by the first week's day gates", () => {
  const s = { trust: { tommy: C.NPCS.tommy.startTrust + 30 }, day: 1, flags: {} };
  assert.ok(C.tierOf(s, "tommy") < 3);
  s.flags[C.RETURNING_FLAG] = true;
  assert.equal(C.tierOf(s, "tommy"), 3);
});

test("day one of a returning week says welcome back, in each voice, and remembers the gifts", () => {
  const flags = { [C.RETURNING_FLAG]: true, tommyLock: true, elenaVan: true };
  for (const id of Object.keys(C.NPCS)) flags[`${id}Talked`] = true;
  const seen = new Set();
  for (const id of Object.keys(C.NPCS)) {
    const lines = C.talkLines(id, flags, 30, "morning", 1, null, C.emptyResidue(), false, null);
    assert.ok(lines.length >= 2, id);
    for (const l of lines) assert.ok(l.text.length <= 125, l.text);
    seen.add(lines[0].text);
  }
  assert.equal(seen.size, 7, "nobody says the same welcome");
  const tommy = C.talkLines("tommy", flags, 30, "morning", 1, null, C.emptyResidue(), false, null);
  assert.match(tommy[0].text, /lock/);
  const second = C.talkLines("tommy", flags, 30, "morning", 2, null, C.emptyResidue(), false, null);
  assert.doesNotMatch(second[0].text, /Look who's back/, "only on day one");
});
