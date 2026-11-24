#!/usr/bin/env node
// Every everyday conversation, ending line and trust scene fits a phone and is spoken by the right person.
// Walks talkLines over first meetings, every day, every residue outcome and the ending walk.
// Limits match crew-moments.test.mjs: line 125, choice label 90, reply 150.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-fit-"));
const entry = join(dir, "entry.ts");
const out = join(dir, "fit.mjs");
writeFileSync(entry, `export * from ${JSON.stringify(join(root, "src/game/content.ts"))};\nexport { SCENES } from ${JSON.stringify(join(root, "src/game/socialScenes.ts"))};\n`);
const bundled = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (bundled.status !== 0) throw new Error(bundled.stderr || bundled.stdout || "esbuild failed");
const C = await import(out);

const NAME = { mabel: "Mabel", holt: "Holt", elena: "Elena", tommy: "Tommy", marcus: "Marcus", priya: "Priya", jordan: "Jordan" };
const HOW = ["open", "caught", "hid"];

function everyTalk() {
  const out = [];
  for (const npc of Object.keys(C.NPCS)) {
    for (const first of [true, false]) {
      for (const day of [1, 2, 3, 4, 5]) {
        for (const key of ["valve", "tag", "dose", "log"]) {
          for (const how of HOW) {
            const residue = { ...C.emptyResidue(), [key]: how };
            const flags = first ? {} : { [`${npc}Talked`]: true, shuffle: true };
            out.push({ npc, lines: C.talkLines(npc, flags, 30, "morning", day, "veteran", residue, false, null) });
          }
        }
      }
    }
    for (const ended of ["a", "c"]) {
      for (const hides of [0, 1, 3]) {
        for (const catches of [0, 1, 5]) {
          const residue = { ...C.emptyResidue(), valve: hides ? "hid" : "caught", tag: "caught", dose: "caught", log: "caught" };
          const week = { catches, hides, reports: catches ? 2 : 0, trust: 50 };
          out.push({ npc, lines: C.talkLines(npc, { [`${npc}Talked`]: true }, 30, "afternoon", 5, null, residue, true, ended, week) });
        }
      }
    }
  }
  return out;
}

function check(npc, lines, where) {
  for (const l of lines) {
    assert.equal(l.speaker, NAME[npc], `${where}: ${npc} line spoken by ${l.speaker}`);
    assert.ok(l.text.length > 0 && l.text.length <= 125, `${where}: line over 125 (${l.text.length}): ${l.text}`);
    assert.doesNotMatch(l.text, /\b1 (things|catches|hides)\b|undefined|NaN/, `${where}: bad count: ${l.text}`);
    for (const c of l.choices ?? []) {
      assert.ok(c.label.length <= 90, `${where}: label over 90: ${c.label}`);
      assert.ok(c.reply.length <= 150, `${where}: reply over 150: ${c.reply}`);
    }
  }
}

test("everyday talk and the ending walk fit a phone, in the speaker's own name", () => {
  const all = everyTalk();
  assert.ok(all.length > 900);
  for (const { npc, lines } of all) {
    assert.ok(lines.length >= 1, `${npc}: no lines`);
    check(npc, lines, "talk");
  }
});

test("trust scenes fit a phone, in the speaker's own name", () => {
  for (const [npc, scenes] of Object.entries(C.SCENES)) for (const sc of scenes) check(npc, sc.lines, `${npc} tier ${sc.tier}`);
});

test("the role line Mabel says on day 2 is the one sim listens for", () => {
  for (const role of ["transferred", "promoted", "military", "veteran"]) {
    const lines = C.talkLines("mabel", { mabelTalked: true }, 30, "morning", 2, role, C.emptyResidue(), false, null);
    assert.ok(lines.some((l) => l.text === C.roleMouth(role)), role);
  }
});
