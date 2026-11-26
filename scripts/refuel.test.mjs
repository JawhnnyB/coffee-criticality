#!/usr/bin/env node
// Each reactor type's Friday (src/game/refuel/): the BWR bundle bench and TIP traces, the pebble bed's pass count,
// the molten-salt loop, and how the campaign reads for each type.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-refuel-"));
const entry = join(dir, "entry.ts");
const out = join(dir, "refuel.mjs");
const mods = { B: "refuel/bwrBundle", P: "refuel/pebbleBed", S: "refuel/saltLoop", T: "refuel/byType", K: "campaign", W: "week", V: "coltVoice" };
writeFileSync(entry, Object.entries(mods).map(([k, f]) => `export * as ${k} from ${JSON.stringify(join(root, `src/game/${f}.ts`))};`).join("\n"));
const b = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`, "--loader:.png=empty", "--external:@tauri-apps/*"], { encoding: "utf8", cwd: root });
if (b.status !== 0) throw new Error(b.stderr || b.stdout);
const { B, P, S, T, K, W, V } = await import(out);

const failing = (list) => list.filter((c) => !c.ok).map((c) => c.id).sort();

test("each type's Friday, week by week; week 0 stays the original shuffle", () => {
  const row = (kind) => [0, 1, 2, 3, 4, 6, 9, 10].map((w) => T.fridayJob(w, kind)).join(" ");
  assert.equal(row("pwr"), "legacy fluxmap fluxmap shuffle fluxmap shuffle shuffle fluxmap");
  assert.equal(row("bwr"), "legacy tip tip bundle tip bundle bundle tip");
  assert.equal(row("pebble"), "legacy passes passes passes passes passes passes passes");
  assert.equal(row("msr"), "legacy salt salt salt salt salt salt salt");
  assert.equal(K.isOutageWeek(3, "pebble"), false);
  assert.equal(K.isOutageWeek(3, "msr"), false);
  assert.equal(K.isOutageWeek(3, "bwr"), true);
});

test("the brief and the sim's own lines read as each type's Friday", () => {
  const day5 = W.WEEK[4];
  const day4 = W.WEEK[3];
  const at = (week, kind) => K.dayVariant(day5, { week, plant: "holt", standDown: false, kind });
  assert.equal(at(3, "bwr").name, "Day 5 · Bundle bench");
  assert.equal(at(2, "bwr").name, "Day 5 · TIP traces");
  assert.equal(at(3, "pebble").name, "Day 5 · Pass count");
  assert.equal(at(3, "msr").name, "Day 5 · Salt loop");
  assert.equal(at(3, "pwr").name, day5.name);
  assert.equal(at(0, "msr"), day5, "week 0 is the original");
  assert.ok(K.dayVariant(day4, { week: 5, plant: "holt", standDown: false, kind: "msr" }).items.some((i) => i.startsWith("Tomorrow is the salt review")));
  const ctx = { week: 4, plant: "holt", standDown: false, kind: "pebble" };
  assert.equal(K.weekText("Reactor hall — fuel shuffle desk. Program the core.", ctx), "Reactor hall — pebble desk. Set the pass count.");
  assert.equal(K.weekText("Priya: Fq 1.004. Teaching model only. Now tell Holt.", ctx).startsWith("Priya: Settings signed. Core k 1.004."), true);
  const salt = K.weekText(V.plantText("Priya: Fq 652.30. Teaching model only. Now tell Holt.", "colt"), { ...ctx, kind: "msr", plant: "colt" });
  assert.equal(salt, "Priya: Salt week signed. Hottest hour 652 °C. Teaching model only. Now tell Colt.");
  assert.equal(T.fridayLog("bundle", 1.62), "Day 5 · Reload bundle signed, hottest pin 1.62. Teaching model only.");
});

test("the weeks read for each type: no boron in a BWR, no outages for a pebble bed or salt", () => {
  assert.match(K.cycleWeek(2, "bwr").numbers, /No soluble boron/);
  assert.match(K.cycleWeek(2, "bwr").line, /gadolinia/i);
  assert.match(K.cycleWeek(2, "pwr").numbers, /Boron ≈ 620 ppm/);
  assert.match(K.cycleWeek(3, "pebble").friday, /pass-count review/);
  assert.equal(K.cycleWeek(3, "pebble").outageFriday, false);
  assert.match(K.cycleWeek(10, "msr").label, /Equilibrium salt/);
  assert.match(K.fuelLine(10, "bwr"), /one you designed/);
  assert.match(K.fuelLine(4, "msr"), /fuel is in the salt/);
  assert.match(K.verdictCard("finale", 10, "holt", "pebble").body[0], /not one outage/);
  assert.equal(K.verdictCard("finale", 10, "colt", "msr").title, "The equilibrium salt");
});

test("BWR bench: each design lesson is a check that fails until it's learned", () => {
  const edges = (pin) => {
    const x = B.uniformBundle("H");
    for (const l of x) for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) if (r === 0 || c === 0 || r === 9 || c === 9) l[r * 10 + c] = pin;
    return x;
  };
  const ev = (x) => failing(B.checks(B.evaluate(x)));
  assert.deepEqual(ev(B.uniformBundle("H")), ["enrich", "fz", "hot", "kboc"], "the all-high start fails four ways");
  assert.deepEqual(ev(edges("L")), ["fz", "hot", "kboc"], "low edges fix the enrichment, but no gadolinia leaves the bottom peak");
  const gadTop = edges("L");
  for (const [r, c] of [[2, 2], [2, 7], [7, 2], [7, 7], [4, 2], [2, 4], [7, 5], [5, 7]]) gadTop[2][r * 10 + c] = gadTop[1][r * 10 + c] = "G";
  assert.ok(ev(gadTop).includes("fz"), "gadolinia at the top makes the bottom peak worse");
  assert.deepEqual(ev(B.referenceBundle()), [], "gadolinia low, edges low: it passes");
  const hotCorners = B.referenceBundle();
  for (const l of hotCorners) l[0] = l[9] = "H";
  assert.deepEqual(ev(hotCorners), ["local"], "high enrichment in the corners: pin peaking");
});

test("BWR physics: void climbs the channel, power leans down, part-length rods help the top", () => {
  const r = B.evaluate(B.uniformBundle("H"));
  for (let i = 1; i < B.NODES; i++) assert.ok(r.voidFrac[i] >= r.voidFrac[i - 1]);
  assert.ok(r.voidFrac[B.NODES - 1] > 0.6 && r.voidFrac[0] < 0.25);
  assert.ok(r.power.indexOf(r.fz) < 4, "plain bundle peaks in the bottom third");
  const gain = B.TUNE.vacatedGain;
  const top = (x) => x.power.slice(8).reduce((a, v) => a + v, 0);
  const withRods = top(B.evaluate(B.referenceBundle()));
  B.TUNE.vacatedGain = 0;
  const without = top(B.evaluate(B.referenceBundle()));
  B.TUNE.vacatedGain = gain;
  assert.ok(withRods > without, "the water above the part-length rods lifts the top");
});

test("TIP traces: the axial peak climbs through the cycle", () => {
  const at = (phase) => {
    const r = B.evaluate(B.referenceBundle(), B.cycleState(phase));
    return r.power.reduce((s, p, i) => s + p * i, 0) / B.NODES;
  };
  assert.ok(at("boc") < at("moc") && at("moc") < at("eoc"), "the power's centre of mass rises");
  assert.equal(B.validBundle(B.referenceBundle()) !== null, true);
  assert.equal(B.validBundle([["X"]]), null);
});

test("pebble bed: HTR-PM's own settings pass, and each wrong choice fails its own check", () => {
  const ev = (plan) => failing(P.checks(P.evaluate(plan), plan));
  const r = P.evaluate(P.HTR_PM);
  assert.ok(Math.abs(r.daysPerPass - 70.5) < 1.5, `about 70.5 days a pass, as HTR-PM's benchmark (${r.daysPerPass.toFixed(1)})`);
  assert.ok(Math.abs(r.freshPerDay - 400) < 20);
  assert.deepEqual(ev(P.HTR_PM), []);
  assert.deepEqual(ev({ passes: 1, burnup: 90 }), ["burnup", "pebbleKw"], "once through: hot top, pebbles overshoot");
  assert.deepEqual(ev({ passes: 22, burnup: 90 }), ["handling"], "too many trips for the burnup meter");
  assert.deepEqual(ev({ passes: 15, burnup: 98 }), ["burnup", "k"], "burned too far: the core can not stay critical, and the outliers overshoot");
  assert.deepEqual(ev({ passes: 15, burnup: 70 }), ["economy", "handling"]);
  const once = P.evaluate({ passes: 1, burnup: 90 });
  assert.ok(once.power.indexOf(Math.max(...once.power)) <= 1, "once through, power peaks at the top");
  assert.ok(r.peakFuelC < P.LIMITS.fuelC);
});

test("salt loop: last month's settings drift cold; the week has an answer; old salt needs cleanup", () => {
  for (const w of [1, 5, 10]) {
    const start = S.weekStart(w);
    assert.equal(S.runWeek(S.START_PLAN, start).inBand, false, `week ${w}: the old settings fail`);
    let found = null;
    for (let feed = 0; feed <= 4 && !found; feed += 0.1) for (let sparge = 0.3; sparge <= 0.71 && !found; sparge += 0.05) for (const cleanup of [0, 0.01, 0.02, 0.03]) {
      const plan = { feed: Math.round(feed * 10) / 10, sparge, cleanup };
      if (S.runWeek(plan, start).inBand) {
        found = plan;
        break;
      }
    }
    assert.ok(found, `week ${w} has a plan that holds the band`);
  }
  assert.ok(S.weekStart(10).lanth > S.weekStart(1).lanth, "the salt ages");
  const plan = { feed: 3, sparge: 0.5, cleanup: 0 };
  const end = (w, c) => S.runWeek({ ...plan, cleanup: c }, S.weekStart(w)).end.lanth - S.weekStart(w).lanth;
  assert.ok(end(10, 0.03) < end(10, 0), "cleanup pulls lanthanides out");
  const xe = (sp) => S.runWeek({ ...plan, sparge: sp }, S.weekStart(1)).end.xenon;
  assert.ok(xe(0.9) < xe(0.3), "stripping more in the pump bowl leaves less xenon");
});
