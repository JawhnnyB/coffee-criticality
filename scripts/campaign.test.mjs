#!/usr/bin/env node
// The long game (campaign.ts): ten weeks, outages at 3, 6 and 9, the stand-down, the transfer, Colt's plant.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-camp-"));
const entry = join(dir, "entry.ts");
const out = join(dir, "camp.mjs");
writeFileSync(
  entry,
  ["campaign", "week", "floorCulture", "coltVoice"].map((f) => `export * from ${JSON.stringify(join(root, `src/game/${f}.ts`))};`).join("\n"),
);
const b = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`, "--loader:.png=empty", "--external:@tauri-apps/*"], { encoding: "utf8", cwd: root });
if (b.status !== 0) throw new Error(b.stderr || b.stdout);
const K = await import(out);

const flagsFor = (c) => {
  const f = {};
  K.stampShift(f, c);
  return f;
};
/** Play one week to its ending with the given floor, then start the next. */
function week(c, fear) {
  const f = flagsFor(c);
  const r = K.decideWeek(c, f, fear);
  return { verdict: r.verdict, c: r.verdict === "transfer" ? r.c : K.advanceWeek(r.c), flags: f };
}

test("ten weeks: one cycle per three weeks, outages Friday of weeks 3, 6 and 9, week 10 the equilibrium core", () => {
  const phases = [];
  for (let w = 1; w <= 10; w++) phases.push(K.cycleWeek(w).phase);
  assert.deepEqual(phases, ["boc", "moc", "eoc", "boc", "moc", "eoc", "boc", "moc", "eoc", "eq"]);
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((w) => K.cycleWeek(w).outageFriday), [3, 6, 9]);
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((w) => K.cycleWeek(w).restart), [4, 7, 10]);
  // Each assembly lives three cycles: a third of the starting fuel leaves at each outage.
  assert.deepEqual([1, 3, 4, 6, 7, 9, 10].map((w) => K.cycleWeek(w).startingFuelThirds), [3, 3, 2, 2, 1, 1, 0]);
  assert.match(K.fuelLine(10), /None of the starting fuel/);
  // Boron falls through a cycle and the moderator coefficient gets more negative.
  for (const c of [0, 3, 6]) {
    const [a, m, e] = [1, 2, 3].map((i) => K.cycleWeek(c + i));
    assert.ok(a.boronPpm > m.boronPpm && m.boronPpm > e.boronPpm);
    assert.ok(a.mtcPcmPerF > m.mtcPcmPerF && m.mtcPcmPerF > e.mtcPcmPerF);
  }
});

test("a good run at Holt's plant walks weeks 1 to 10, then the finale starts week 1 again", () => {
  let c = K.freshCampaign();
  const seen = [];
  for (let i = 0; i < 10; i++) {
    seen.push(K.weekOf(flagsFor(c)));
    const r = week(c, false);
    if (i < 9) assert.equal(r.verdict, "held");
    else assert.equal(r.verdict, "finale");
    c = r.c;
  }
  assert.deepEqual(seen, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(c.holt.week, 1, "the finale rolls round to a new campaign");
});

test("a week abandoned before its ending replays: no skipping an outage by quitting", () => {
  let c = K.freshCampaign();
  c = week(c, false).c;
  c = week(c, false).c;
  assert.equal(c.holt.week, 3);
  c = K.advanceWeek(c); // New week without reaching the ending.
  assert.equal(c.holt.week, 3);
});

test("Fear at Holt's plant: stand-down; Fear again: transfer; otherwise lifted", () => {
  let c = K.freshCampaign();
  let r = week(c, true);
  assert.equal(r.verdict, "standdown");
  c = r.c;
  assert.equal(c.holt.week, 2);
  assert.equal(c.holt.standDown, true);
  const f = flagsFor(c);
  assert.ok(f[K.STANDDOWN_FLAG], "the stand-down week is stamped on the shift");
  // Lifted.
  r = week(c, false);
  assert.equal(r.verdict, "lifted");
  assert.equal(r.c.holt.standDown, false);
  assert.equal(r.c.holt.week, 3);
  // Or not.
  r = week(c, true);
  assert.equal(r.verdict, "transfer");
  const t = K.transferTo(r.c);
  assert.equal(t.plant, "colt");
  assert.equal(t.transferred, true);
  assert.equal(t.holt.week, 1, "Holt's plant starts over if you go back");
  assert.equal(t.colt.week, 1);
  assert.ok(flagsFor(t)[K.PLANT_FLAG]);
});

test("the verdict is decided once per week: reopening the ending can't change it", () => {
  const c = K.freshCampaign();
  const f = flagsFor(c);
  const a = K.decideWeek(c, f, true);
  const again = K.decideWeek(a.c, f, false);
  assert.equal(again.verdict, "standdown");
});

test("Colt's plant never transfers you: heads down there means Colt buys the coffee and asks", () => {
  let c = K.choosePlant(K.freshCampaign(), "colt");
  const r = week(c, true);
  assert.equal(r.verdict, "regroup");
  assert.equal(r.c.colt.week, 2);
  assert.equal(r.c.colt.standDown, false);
  assert.equal(r.c.holt.week, 1, "each plant keeps its own week");
});

test("Colt's floor starts with goodwill, but your choices still matter there", () => {
  const colt = { [K.PLANT_FLAG]: true };
  const base = { reports: 0, catches: 0, hides: 0 };
  assert.equal(K.cultureOf({ ...base, flags: {} }), "guarded");
  assert.equal(K.cultureOf({ ...base, flags: colt }), "guarded", "goodwill, not a free Respect");
  const good = { ...colt, "choice:mabel-sit": true, "choice:marcus-forty": true };
  assert.equal(K.cultureOf({ reports: 0, catches: 1, hides: 0, flags: good }), "respect", "one catch and two good choices reach Respect");
  assert.equal(K.cultureOf({ reports: 0, catches: 1, hides: 0, flags: { "choice:mabel-sit": true, "choice:marcus-forty": true } }), "guarded", "the same at Holt's plant doesn't");
  assert.equal(K.cultureOf({ ...base, hides: 2, flags: colt }), "guarded", "two hides don't send Colt's floor into fear");
  assert.equal(K.cultureOf({ ...base, hides: 3, flags: colt }), "fear", "three do");
});

test("Fridays: a shuffle in outage weeks, a flux map otherwise; week 0 (old saves) is the original week", () => {
  const day5 = K.WEEK[4];
  const day4 = K.WEEK[3];
  assert.equal(K.dayVariant(day5, { week: 0, plant: "holt", standDown: false }), day5);
  assert.equal(K.dayVariant(day5, { week: 3, plant: "holt", standDown: false }).name, day5.name);
  const flux = K.dayVariant(day5, { week: 2, plant: "holt", standDown: false });
  assert.equal(flux.name, "Day 5 · Flux map");
  assert.ok(flux.goals.some((g) => g.label === "Read the flux map"));
  assert.ok(K.dayVariant(day4, { week: 2, plant: "holt", standDown: false }).items.some((i) => i.startsWith("Tomorrow is the flux map")));
  assert.ok(K.dayVariant(day4, { week: 3, plant: "holt", standDown: false }).items.some((i) => i.startsWith("Tomorrow is the shuffle")));
  assert.equal(K.weekText("Reactor hall — fuel shuffle desk. Program the core.", { week: 5, plant: "holt", standDown: false }), "Reactor hall — flux map desk. Find where the power peaks.");
  assert.equal(K.weekText("Reactor hall — fuel shuffle desk. Program the core.", { week: 6, plant: "holt", standDown: false }), "Reactor hall — fuel shuffle desk. Program the core.");
});

test("dayDef follows the week the game sets, and defaults to the original", () => {
  assert.equal(K.dayDef(5).name, "Day 5 · Shuffle");
  K.setWeekContext({ week: 2, plant: "holt", standDown: true });
  assert.equal(K.dayDef(5).name, "Day 5 · Flux map");
  assert.match(K.dayDef(1).kicker, /Stand-down/);
  assert.match(K.dayDef(1).holt, /^Holt: Last week ended with heads down/);
  K.setWeekContext({ week: 2, plant: "colt", standDown: true });
  assert.doesNotMatch(K.dayDef(1).kicker, /Stand-down/, "no stand-downs at Colt's plant");
  K.setWeekContext({ week: 0, plant: "holt", standDown: false });
  assert.equal(K.dayDef(5).name, "Day 5 · Shuffle");
});

test("every verdict has a card, and the transfer is written as an ending, not a reward", () => {
  for (const v of ["standdown", "lifted", "transfer", "regroup", "finale"]) {
    const card = K.verdictCard(v, 4, v === "regroup" ? "colt" : "holt");
    assert.ok(card.title && card.body.length && card.next, v);
  }
  const t = K.verdictCard("transfer", 2, "holt");
  assert.match(t.body.join(" "), /This is an ending/);
  assert.equal(t.next, "Start at Colt's plant");
  assert.match(K.verdictCard("finale", 10, "colt").body.join(" "), /Colt walks/);
});

test("a saved campaign survives a bad read", () => {
  globalThis.localStorage = {
    m: {},
    getItem(k) {
      return k in this.m ? this.m[k] : null;
    },
    setItem(k, v) {
      this.m[k] = String(v);
    },
    removeItem(k) {
      delete this.m[k];
    },
  };
  assert.deepEqual(K.readCampaign(), K.freshCampaign());
  const c = week(K.freshCampaign(), true).c;
  K.writeCampaign(c);
  assert.equal(K.readCampaign().holt.standDown, true);
  localStorage.setItem("cc.profile", JSON.stringify({ campaign: { plant: "colt", holt: { week: 99 }, colt: "junk" } }));
  const r = K.readCampaign();
  assert.equal(r.plant, "colt");
  assert.equal(r.holt.week, 10);
  assert.equal(r.colt.week, 1);
  delete globalThis.localStorage;
});
