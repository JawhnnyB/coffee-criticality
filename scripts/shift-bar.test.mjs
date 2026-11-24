#!/usr/bin/env node
// The taskbar under the plant (src/game/barRules.ts): when it shows, what it offers, what it reads out.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(mkdtempSync(join(tmpdir(), "cc-bar-")), "bar.mjs");
const bundled = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/barRules.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (bundled.status !== 0) throw new Error(bundled.stderr || bundled.stdout || "esbuild failed");
const B = await import(out);

test("the bar sits under the plant, its talks and its decisions, and nowhere else", () => {
  for (const m of ["play", "dialogue", "incident"]) assert.equal(B.barShown(m, {}), true, m);
  for (const m of ["menu", "desktop", "academy", "reactor", "nightwatch", "eod", "brief", "intro", "shuffle"]) assert.equal(B.barShown(m, {}), false, m);
});

test("Settings can hide it, and the night rotation keeps its own screen", () => {
  assert.equal(B.barShown("play", { [B.BAR_OFF_FLAG]: true }), false);
  assert.equal(B.barShown("play", { "rot:nights": true }), false);
  assert.equal(B.BAR_OFF_FLAG.startsWith("ui:"), true);
});

test("stepping out waits for a conversation or a decision to finish", () => {
  assert.equal(B.canLaunch("play"), true);
  assert.equal(B.canLaunch("dialogue"), false);
  assert.equal(B.canLaunch("incident"), false);
});

test("cameras, data, Academy and music, in that order, once the plant is designed", () => {
  const all = B.barTasks({ hasPlant: true, foundCabinets: false, showAll: false });
  assert.deepEqual(all.map((t) => t.id), ["nightwatch", "monitor", "academy", "music"]);
  const before = B.barTasks({ hasPlant: false, foundCabinets: false, showAll: false });
  assert.deepEqual(before.map((t) => t.id), ["academy", "music"]);
  for (const t of B.BAR_TASKS) {
    assert.ok(t.short.length <= 4, t.short);
    assert.ok(t.label.length <= 12, t.label);
  }
});

test("the data tab reads power, and flashes on the Plant Monitor's alarm", () => {
  assert.deepEqual(B.dataChip({ power: 99.6, tripped: false, alarms: [] }), { text: "100%", alarm: false });
  assert.deepEqual(B.dataChip({ power: 106, tripped: false, alarms: ["power"] }), { text: "106%", alarm: true });
  assert.deepEqual(B.dataChip({ power: 0, tripped: true, alarms: ["trip"] }), { text: "TRIP", alarm: true });
});

test("the plant's tab names the day; your clock reads the room outside the game", () => {
  assert.equal(B.shiftTaskLabel(2, "Day 2 · Tags"), "Unit 1 · Day 2 · Tags");
  assert.equal(B.shiftTaskLabel(2, "Day 2 · Tags", true), "Unit 1 · D2");
  assert.equal(B.shiftTaskLabel(3, ""), "Unit 1 · Day 3");
  assert.equal(B.shiftTaskLabel(2, "Day 2 · Tags", true, true), "D2");
  const d = new Date(2026, 10, 24, 0, 5);
  assert.equal(B.realClock(d, false), "12:05 AM");
  assert.equal(B.realClock(d, true), "00:05");
  assert.equal(B.realClock(new Date(2026, 10, 24, 13, 40), false), "1:40 PM");
});
