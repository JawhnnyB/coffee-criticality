import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-nw-"));
const entry = join(dir, "entry.ts");
writeFileSync(entry, `export * from ${JSON.stringify(join(root, "src/game/nightwatch/model.ts"))};\nexport * from ${JSON.stringify(join(root, "src/game/nightwatch/turnover.ts"))};\nexport * from ${JSON.stringify(join(root, "src/game/nightwatch/carryover.ts"))};\n`);
const out = join(dir, "nw.mjs");
const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], { encoding: "utf8", cwd: root });
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
const W = await import(out);
const SITES = ["pwr", "bwr", "pebble", "msr"];

test("every site: eight cameras, readings inside their bands at rest, events on real cameras", () => {
  for (const site of SITES) {
    const w = W.siteWatch(site);
    assert.equal(w.cameras.length, 8, site);
    assert.equal(new Set(w.cameras.map((c) => c.id)).size, 8);
    const n = W.newNight(site, 1);
    for (let m = 0; m < 15; m++) {
      n.minute = m;
      assert.deepEqual(W.alarms({ ...n, events: [] }), [], `${site} quiet board at minute ${m}`);
    }
    for (const e of w.events) {
      assert.ok(w.cameras.some((c) => c.id === e.camera), `${site} ${e.id} camera`);
      for (const id of Object.keys(e.effect)) assert.ok(w.metrics.some((m) => m.id === id), `${site} ${e.id} reads ${id}`);
      assert.ok(e.accept.length > 0 && e.escalate > e.develop * 0.5);
    }
    for (const o of w.oddities) assert.ok(w.cameras.some((c) => c.id === o.camera), `${site} oddity ${o.id}`);
  }
});

test("the PWR board shows the owner's list: hot and cold legs, pressure, primary and secondary flow, power, gamma", () => {
  const ids = W.siteWatch("pwr").metrics.map((m) => m.id);
  for (const id of ["hot", "cold", "press", "pflow", "feed", "steam", "power", "gMsl", "gAux"]) assert.ok(ids.includes(id), id);
  const w = W.siteWatch("pwr");
  const hot = w.metrics.find((m) => m.id === "hot").base;
  const cold = w.metrics.find((m) => m.id === "cold").base;
  assert.ok(hot > cold, "hot leg hotter than cold leg");
  assert.equal(w.metrics.find((m) => m.id === "press").base, 15.5);
});

test("every event with readings crosses an alarm when fully developed; door and left-behind events show only on camera", () => {
  for (const site of SITES) {
    const w = W.siteWatch(site);
    for (const def of w.events) {
      const n = W.newNight(site, 1);
      n.events = [{ def, start: 0, caughtAt: null, early: false, doneAt: null }];
      n.minute = def.develop;
      const a = W.alarms(n);
      if (Object.keys(def.effect).length) assert.ok(a.some((id) => id in def.effect), `${site} ${def.id} alarms (got ${a.join(",") || "none"})`);
      else assert.deepEqual(a, [], `${site} ${def.id} is camera-only`);
      assert.ok(W.visualsOn(n, def.camera).includes(def.visual), `${site} ${def.id} shows on its camera`);
    }
  }
});

test("a night is the same every time it is replayed, and nights get harder", () => {
  const a = W.newNight("pwr", 3);
  const b = W.newNight("pwr", 3);
  assert.deepEqual(a.events.map((e) => [e.def.id, e.def.start]), b.events.map((e) => [e.def.id, e.def.start]));
  const counts = [1, 2, 3, 4].map((k) => W.newNight("pwr", k).events.length);
  assert.ok(counts.every((c, i) => i === 0 || c >= counts[i - 1]), counts.join(","));
  assert.equal(W.NIGHTS.length, 4);
  assert.ok(W.NIGHTS[3].brews < W.NIGHTS[0].brews && W.NIGHTS[3].escalateScale < W.NIGHTS[0].escalateScale);
});

test("the right report on the right camera catches the event, early if before the alarm, and the readings recover", () => {
  const n = W.newNight("pwr", 1);
  const def = W.siteWatch("pwr").events.find((e) => e.id === "rcp-seal");
  n.events = [{ def, start: 10, caughtAt: null, early: false, doneAt: null }];
  W.tick(n, 14);
  assert.deepEqual(W.alarms(n), [], "not alarming yet");
  n.camera = "pzr";
  assert.deepEqual(W.report(n, "leak"), { ok: false, reason: "nothing" }, "wrong camera is a false report");
  n.camera = "core";
  assert.deepEqual(W.report(n, "electrical"), { ok: false, reason: "wrong-kind" });
  const r = W.report(n, "leak");
  assert.equal(r.ok, true);
  assert.equal(r.early, true);
  assert.equal(n.falseReports, 2);
  W.tick(n, 10);
  assert.equal(W.development(n.events[0], n.minute), 0, "readings back to normal 8 minutes after the catch");
  W.tick(n, 200);
  assert.equal(n.over, null, "a caught event never trips the plant");
});

test("an unreported trip event ends the night with a reactor trip; a finding only counts against you", () => {
  const n = W.newNight("pwr", 1);
  const trip = W.siteWatch("pwr").events.find((e) => e.id === "porv");
  const finding = W.siteWatch("pwr").events.find((e) => e.id === "lhra-door");
  n.events = [
    { def: finding, start: 5, caughtAt: null, early: false, doneAt: null },
    { def: trip, start: 30, caughtAt: null, early: false, doneAt: null },
  ];
  for (let m = 0; m < 200 && !n.over; m++) W.tick(n, 1);
  assert.equal(n.over?.why, "trip");
  assert.equal(n.over.at, 30 + trip.escalate);
  assert.equal(n.findings, 1);
  const r = W.readings(n);
  assert.equal(r.power, 0, "power reads zero after the trip");
});

test("three false reports and the supervisor relieves you; oddities are not events", () => {
  const n = W.newNight("pwr", 1);
  n.events = [];
  n.oddities = [{ def: { id: "chair", camera: "aux", visual: "chair" }, start: 0, end: 50 }];
  n.camera = "aux";
  W.tick(n, 5);
  assert.ok(W.visualsOn(n, "aux").includes("chair"), "the oddity is on camera");
  for (let k = 0; k < 3; k++) W.report(n, "foreign");
  assert.equal(n.over?.why, "relieved");
});

test("coffee: the tablet drains it, an empty cup drops the tablet, a brew refills it and costs a brew", () => {
  const n = W.newNight("pwr", 5);
  n.events = [];
  assert.equal(W.setTablet(n, true), true);
  W.tick(n, W.COFFEE.max / W.COFFEE.tablet + 1);
  assert.equal(n.coffee, 0);
  assert.equal(n.tablet, false, "tablet drops when the cup is empty");
  assert.equal(W.setTablet(n, true), false);
  const brews = n.brewsLeft;
  assert.equal(W.brew(n), true);
  assert.equal(W.setTablet(n, true), false, "no tablet while brewing");
  W.tick(n, W.COFFEE.brewMinutes);
  assert.equal(n.coffee, W.COFFEE.max);
  assert.equal(n.brewsLeft, brews - 1);
  assert.equal(W.brew(n), false, "night 5 has one brew");
});

test("night 1 always has a silent event at 01:10 and one nudge; later nights do not nudge", () => {
  for (const site of SITES) {
    const n = W.newNight(site, 1, 3);
    const silent = n.events.find((e) => e.def.id === "lhra-door" || e.def.id === "pool-fme");
    assert.ok(silent, site);
    assert.equal(silent.start, 70);
    n.minute = 76;
    const lines = W.radio(n);
    assert.ok(lines.some((l) => l.includes("Jordan:") && l.includes("01:16")), lines.join(" | "));
    const later = W.newNight(site, 2, 3);
    later.minute = 200;
    assert.equal(W.radio(later).some((l) => l.includes("looked wrong")), false);
  }
  const fin = W.newNight("pwr", 4, 1);
  const stacked = fin.events.filter((e) => e.finale);
  assert.equal(stacked.length, 2);
  assert.ok(stacked.every((e) => e.start === 270));
});

test("a grade is stored once, C or better counts as done, a replay does not move trust", () => {
  const flags = {};
  const n = W.newNight("pwr", 1);
  n.events = [];
  n.over = { why: "dawn", at: 360 };
  const a = W.recordNight(flags, n, 1, false);
  assert.equal(a.letter, "A");
  assert.equal(a.trust, 3);
  assert.equal(flags["night:1:done"], true);
  assert.equal(flags["night:1:grade:A"], true);
  const again = W.recordNight(flags, n, 1, true);
  assert.equal(again.trust, 0);
  assert.equal(flags["night:1:grade:A"], true);
  const bad = W.newNight("pwr", 1);
  bad.events = [];
  bad.falseReports = 6;
  bad.over = { why: "dawn", at: 360 };
  const flags2 = {};
  const d = W.recordNight(flags2, bad, 2, false);
  assert.ok(d.letter === "D" || d.letter === "F");
  assert.equal(flags2["night:2:done"], undefined);
});

test("carryover follows the day week and a fresh week does not", () => {
  const plain = { residue: { valve: "open", tag: "open", dose: "open", log: "open" }, maintDone: true, shuffleDone: false, ended: null, weekLog: [] };
  const base = W.newNight("pwr", 1, 4);
  const copy = W.newNight("pwr", 1, 4);
  W.applyCarry(copy, W.carryover(plain, 1));
  const ids = (n) => n.events.map((e) => e.def.id).sort();
  assert.deepEqual(ids(copy), ids(base));
  const hid = { ...plain, residue: { ...plain.residue, valve: "hid" } };
  const n1 = W.newNight("pwr", 1, 4);
  W.applyCarry(n1, W.carryover(hid, 1));
  const weep = n1.events.find((e) => e.def.id === "valve-14");
  assert.ok(weep);
  assert.equal(weep.start, 100);
  assert.equal(weep.fromDays, true);
  assert.ok(weep.def.escalate < 50);
  const held = W.carryover({ ...plain, residue: { ...plain.residue, valve: "caught" } }, 1);
  assert.ok(held.radios.some((r) => r.text.includes("Valve 14 repack is holding")));
  const n2 = W.newNight("pwr", 2, 4);
  W.applyCarry(n2, W.carryover({ ...plain, residue: { ...plain.residue, tag: "hid" }, maintDone: false }, 2));
  assert.ok(n2.events.some((e) => e.def.id === "tag-missing" && e.def.camera === "turbine"));
  assert.ok(n2.events.some((e) => e.def.id === "feed-pump" && e.start === 150));
  const n3 = W.newNight("pwr", 3, 9);
  const before = n3.events.find((e) => e.def.accept.includes("radiation"));
  const start = before?.start;
  W.applyCarry(n3, W.carryover({ ...plain, residue: { ...plain.residue, dose: "hid" } }, 3));
  const after = n3.events.find((e) => e.def.accept.includes("radiation"));
  if (start !== undefined) assert.equal(after.start, Math.max(15, start - 45));
  assert.ok(n3.carriedRadio.some((r) => r.text.includes("Dosimeter")));
  const curt = W.carryover({ ...plain, residue: { ...plain.residue, log: "hid" } }, 1);
  assert.equal(curt.curt, true);
  const read = W.carryover({ ...plain, residue: { ...plain.residue, log: "caught" }, weekLog: [{ text: "Caught the valve." }] }, 1);
  assert.ok(read.radios.some((r) => r.text.includes("Caught the valve.")));
  const warm = W.carryover({ ...plain, ended: "a", shuffleDone: true }, 4);
  assert.equal(warm.voice, "warm");
  assert.ok(warm.radios.some((r) => r.text.includes("new core")));
  const terse = W.carryover({ ...plain, ended: "c" }, 1);
  assert.equal(terse.voice, "terse");
  const again = W.carryover(hid, 1);
  assert.deepEqual(again, W.carryover(hid, 1));
});

test("night grade: the worked check, the bands, and a trip", () => {
  const bare = () => {
    const n = W.newNight("pwr", 1);
    n.events = [];
    n.falseReports = 0;
    n.findings = 0;
    n.over = { why: "dawn", at: 360 };
    return n;
  };
  const ev = (id, extra) => {
    const def = W.siteWatch("pwr").events.find((e) => e.id === id);
    return { def, start: 20, caughtAt: null, early: false, doneAt: null, ...extra };
  };
  const flash = bare();
  flash.events = [ev("rcp-seal", { caughtAt: 40, early: false }), ev("porv", { caughtAt: 50, early: false }), ev("lhra-door", { doneAt: 70 })];
  flash.findings = 1;
  const g = W.grade(flash);
  assert.equal(g.points, 76);
  assert.equal(g.letter, "C");
  const sweep = bare();
  sweep.events = [ev("rcp-seal", { caughtAt: 16, early: true }), ev("porv", { caughtAt: 18, early: true }), ev("lhra-door", { caughtAt: 22, early: true })];
  const a = W.grade(sweep);
  assert.equal(a.points, 100);
  assert.equal(a.letter, "A");
  const trip = bare();
  trip.over = { why: "trip", at: 40, cause: "x" };
  assert.deepEqual(W.grade(trip), { points: 0, letter: "F" });
  assert.equal(W.gradeLetter(95), "A");
  assert.equal(W.gradeLetter(94), "B");
  assert.equal(W.gradeLetter(85), "B");
  assert.equal(W.gradeLetter(84), "C");
  assert.equal(W.gradeLetter(72), "C");
  assert.equal(W.gradeLetter(71), "D");
  assert.equal(W.gradeLetter(60), "D");
  assert.equal(W.gradeLetter(59), "F");
  const low = bare();
  low.falseReports = 20;
  assert.equal(W.grade(low).points, 0);
});

test("being relieved is an F, an open event is a miss, and the C line is only at 06:00", () => {
  const n = W.newNight("pwr", 1);
  const open = W.siteWatch("pwr").events.find((e) => e.id === "porv");
  const later = W.siteWatch("pwr").events.find((e) => e.id === "pool-fme");
  n.events = [
    { def: open, start: 10, caughtAt: null, early: false, doneAt: null },
    { def: later, start: 200, caughtAt: null, early: false, doneAt: null },
  ];
  n.minute = 40;
  n.camera = "yard";
  for (let k = 0; k < 3; k++) W.report(n, "leak");
  assert.equal(n.over?.why, "relieved");
  assert.equal(n.events[0].doneAt, 40);
  assert.equal(n.events[1].doneAt, null);
  assert.deepEqual(W.grade(n), { points: 0, letter: "F" });
  const flags = {};
  const g = W.recordNight(flags, n, 1, false);
  assert.equal(g.letter, "F");
  assert.equal(g.done, false);
  assert.equal(g.trust, -2);
  assert.equal(flags["night:1:done"], undefined);
  assert.equal(flags["night:1:grade:F"], true);
  const row = W.turnoverRows(n).find((r) => r.title.includes("relief"));
  assert.equal(row.missed, true);
  assert.equal(row.how, "missed");
  assert.equal(W.elenaLine("C", false, "dawn"), "You made six. The ones you missed were already on a camera.");
  assert.equal(W.elenaLine("C", false).includes("You made six"), true);
  assert.equal(W.elenaLine("C", false, "relieved").includes("You made six"), false);
  assert.equal(W.elenaLine("A", false, "dawn", 0).includes("before the board did"), false, "an all-late A does not claim early catches");
  assert.equal(W.elenaLine("A", false, "dawn", 2).includes("before the board did"), true);
  assert.equal(W.elenaLine("F", false, "relieved").includes("!"), false);
  assert.equal(W.elenaLine("F", true, "relieved"), "Relieved. The night is not done.");
});

test("a pending seed is used for one night only", () => {
  const ids = (n) => n.events.map((e) => `${e.def.id}@${e.start}`).join(",");
  const a = W.newNight("pwr", 1, 1);
  W.setNextNightSeed(99);
  const b = W.newNight("pwr", 1);
  const c = W.newNight("pwr", 1, 1);
  assert.notEqual(ids(a), ids(b));
  assert.equal(ids(a), ids(c));
});

test("an 8× clock covers the same coffee, brew, fatigue and escalation as 1×", () => {
  const close = (a, b, label) => assert.ok(Math.abs(a - b) < 1e-6, `${label} ${a} vs ${b}`);
  assert.equal(W.gameMinutes(W.SECONDS_PER_MINUTE, 1), 1);
  assert.equal(W.gameMinutes(W.SECONDS_PER_MINUTE, 8), 8);
  const make = () => {
    const n = W.newNight("pwr", 1);
    const trip = W.siteWatch("pwr").events.find((e) => e.id === "porv");
    const def = { ...trip, escalate: 5, consequence: "finding" };
    n.events = [{ def, start: 0, caughtAt: null, early: false, doneAt: null }];
    n.tablet = true;
    n.camera = "pzr";
    return n;
  };
  const slow = make();
  const fast = make();
  for (let i = 0; i < 80; i++) W.tick(slow, W.gameMinutes(0.125, 1));
  for (let i = 0; i < 10; i++) W.tick(fast, W.gameMinutes(0.125, 8));
  close(fast.minute, slow.minute, "minute");
  close(fast.coffee, slow.coffee, "coffee");
  close(W.fatigueOf(fast), W.fatigueOf(slow), "fatigue");
  assert.ok(fast.events[0].doneAt != null && slow.events[0].doneAt != null);
  assert.equal(fast.findings, slow.findings);
  assert.equal(fast.over, null);
  W.brew(slow);
  W.brew(fast);
  for (let i = 0; i < 40; i++) W.tick(slow, W.gameMinutes(0.125, 1));
  for (let i = 0; i < 5; i++) W.tick(fast, W.gameMinutes(0.125, 8));
  close(fast.brewing, slow.brewing, "brew");
  close(fast.coffee, slow.coffee, "coffee after brew");
  assert.equal(fast.tablet, slow.tablet);
});

test("a report on a camera just logged is not a false report", () => {
  const n = W.newNight("pwr", 1);
  const bag = W.siteWatch("pwr").events.find((e) => e.id === "pool-fme");
  const later = W.siteWatch("pwr").events.find((e) => e.id === "pool-level");
  n.events = [{ def: bag, start: 10, caughtAt: null, early: false, doneAt: null }];
  n.minute = 12;
  n.camera = "pool";
  assert.equal(W.report(n, "foreign").ok, true);
  const second = W.report(n, "equipment");
  assert.equal(second.ok, false);
  assert.equal(second.reason, "logged");
  assert.equal(n.falseReports, 0);
  n.minute = 12 + 30;
  assert.equal(W.report(n, "equipment").reason, "logged");
  assert.equal(n.falseReports, 0);
  n.minute = 12 + 41;
  assert.equal(W.report(n, "equipment").reason, "nothing");
  assert.equal(n.falseReports, 1);
  n.events.push({ def: later, start: 40, caughtAt: null, early: false, doneAt: null });
  n.minute = 41;
  const next = W.report(n, later.accept[0]);
  assert.equal(next.ok, true);
  assert.equal(n.falseReports, 1);
});

test("a D or an F opens the night again", () => {
  assert.equal(W.openerLine(2, true), "Night 2, again. Elena wants it stood properly.");
  assert.equal(W.openerLine(1, false).includes("again"), false);
});

test("leaving the watch is the same as being relieved", () => {
  const n = W.newNight("pwr", 1);
  const open = W.siteWatch("pwr").events.find((e) => e.id === "porv");
  n.events = [{ def: open, start: 10, caughtAt: null, early: false, doneAt: null }];
  n.minute = 20;
  W.relieve(n);
  assert.equal(n.over?.why, "relieved");
  assert.equal(n.events[0].doneAt, 20);
  assert.equal(W.grade(n).letter, "F");
  const flags = {};
  const g = W.recordNight(flags, n, 1, false);
  assert.equal(g.done, false);
  assert.equal(g.trust, -2);
});

test("surviving to 06:00 is dawn, with the score", () => {
  const n = W.newNight("bwr", 2);
  for (const e of n.events) e.caughtAt = e.def.start;
  for (let m = 0; m < W.NIGHT_MINUTES + 5 && !n.over; m++) {
    W.tick(n, 1);
    for (const e of n.events) if (n.minute >= e.def.start && e.caughtAt === null) e.caughtAt = n.minute;
  }
  assert.equal(n.over?.why, "dawn");
  const s = W.score(n);
  assert.equal(s.survived, true);
  assert.equal(s.missed, 0);
});

// ---- cameras and the passive monitor
const dir2 = mkdtempSync(join(tmpdir(), "cc-nwc-"));
const entry2 = join(dir2, "entry.ts");
writeFileSync(
  entry2,
  [
    `export * from ${JSON.stringify(join(root, "src/game/nightwatch/cameras.ts"))};`,
    `export * from ${JSON.stringify(join(root, "src/game/nightwatch/monitor.ts"))};`,
  ].join("\n"),
);
const out2 = join(dir2, "c.mjs");
const built2 = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry2, "--bundle", "--platform=node", "--format=esm", `--outfile=${out2}`], { encoding: "utf8", cwd: root });
if (built2.status !== 0) throw new Error(built2.stderr || built2.stdout);
const C = await import(out2);

/**
 * A stand-in 2D context that records every call and every property it is given. The camera feeds are drawn
 * with gradients, paths and compositing (the owner's realism exception), so the record is the whole call log.
 */
function recorder() {
  const ops = [];
  const props = { globalAlpha: 1, globalCompositeOperation: "source-over", fillStyle: "", strokeStyle: "", lineWidth: 1, font: "", textAlign: "start", textBaseline: "alphabetic" };
  let grads = 0;
  const g = new Proxy(props, {
    get(target, key) {
      if (key in target) return target[key];
      if (key === "createLinearGradient" || key === "createRadialGradient")
        return (...args) => {
          const id = `grad${grads++}`;
          ops.push(`${String(key)}(${args.map((x) => Math.round(x)).join(",")})`);
          return { id, toString: () => id, addColorStop: (o, c) => ops.push(`${id}.stop(${o},${c})`) };
        };
      return (...args) => ops.push(`${String(key)}(${args.map((x) => (typeof x === "number" ? Math.round(x * 10) / 10 : String(x))).join(",")})`);
    },
    set(target, key, value) {
      target[key] = value;
      ops.push(`${String(key)}=${typeof value === "object" ? value.id : value}`);
      return true;
    },
  });
  return { g, ops };
}

test("every event's, oddity's and visitor's visual changes its camera's picture", () => {
  for (const site of SITES) {
    const w = W.siteWatch(site);
    for (const cam of w.cameras) {
      const base = recorder();
      C.paintCamera(base.g, cam.scene, [], 3.21);
      assert.ok(base.ops.length > 200, `${cam.scene} draws a real picture`);
      const layers = new Set([...w.events.filter((e) => e.camera === cam.id).map((e) => e.visual), ...w.oddities.filter((o) => o.camera === cam.id).map((o) => o.visual)]);
      if (cam.scene !== "cell") layers.add("rover:0.5");
      if (cam.id === "yard") layers.add("van:0.5");
      for (const visual of layers) {
        // Some layers flicker: the layer must show in at least one of a few frames.
        const shows = [3.21, 0.4, 1.7, 2.9, 5.05, 7.3].some((t) => {
          const b = recorder();
          C.paintCamera(b.g, cam.scene, [], t);
          const with_ = recorder();
          C.paintCamera(with_.g, cam.scene, [visual], t);
          return JSON.stringify(with_.ops) !== JSON.stringify(b.ops);
        });
        assert.ok(shows, `${site} ${cam.id}: "${visual}" draws nothing`);
      }
    }
  }
});

test("camera feeds: Cherenkov blue only in the fuel pool, infrared in the dark spaces, static while switching, red after a trip", () => {
  for (const scene of C.SCENE_NAMES) {
    const r = recorder();
    C.paintCamera(r.g, scene, [], 1.5);
    const blue = r.ops.some((op) => op.includes("rgba(80,160,255"));
    assert.equal(blue, scene === "pool", `${scene}: Cherenkov glow`);
  }
  assert.equal(C.lookOf("tunnel"), "ir", "dark spaces: infrared");
  assert.equal(C.lookOf("containment"), "fluor", "lit plant spaces: colour");
  assert.equal(C.lookOf("corridor"), "sodium");
  assert.equal(C.lookOf("pool"), "pool");
  const calm = recorder();
  C.paintCamera(calm.g, "turbine", [], 2);
  const sw = recorder();
  C.paintCamera(sw.g, "turbine", [], 2, { switching: 1 });
  assert.ok(sw.ops.length > calm.ops.length, "switching adds static");
  const trip = recorder();
  C.paintCamera(trip.g, "turbine", [], 2, { tripped: true });
  assert.ok(trip.ops.some((op) => op.startsWith("fillStyle=rgba(200,20,10")), "emergency lighting after a trip");
  const odd = recorder();
  assert.doesNotThrow(() => C.paintCamera(odd.g, "no-such-room", [], 0));
});

test("the rover walks two rounds a night, calls them in, and is not an anomaly; the day supervisor arrives before six", () => {
  const n = W.newNight("pwr", 1);
  assert.ok(n.rounds.length >= 10, "two passes along the route");
  for (const rd of n.rounds) {
    assert.ok(n.watch.cameras.some((c) => c.id === rd.camera), `${rd.camera} is a camera`);
    assert.ok(rd.end > rd.start);
  }
  for (let k = 1; k < n.rounds.length; k++) assert.ok(n.rounds[k].start >= n.rounds[k - 1].end, "one place at a time");
  assert.deepEqual(W.newNight("pwr", 1).rounds, n.rounds, "replayable");
  assert.deepEqual(W.radio(n), ["00:00 Control, night watch on station."]);
  n.events = [];
  n.oddities = [];
  const rd = n.rounds[0];
  W.tick(n, rd.start + 1);
  n.camera = rd.camera;
  const v = W.visualsOn(n, rd.camera);
  assert.ok(v.some((x) => x.startsWith("rover:")), "he is on camera");
  assert.ok(W.radio(n).some((l) => l.includes(`${W.ROVER}: starting rounds`)));
  const before = n.falseReports;
  W.report(n, "foreign");
  assert.equal(n.falseReports, before + 1, "reporting the rover is a false report");
  W.tick(n, W.VAN_AT - n.minute + 6);
  assert.ok(W.visualsOn(n, "yard").some((x) => x.startsWith("van:")), "headlights on the yard camera");
  assert.match(W.radio(n).at(-1), /day shift supervisor/);
});

test("the passive monitor alarms on a trip and on high ΔT, never on plain low power", () => {
  const run = (o) => ({ powerPct: 100, flowPct: 100, rodsWithdrawnPct: 80, scram: false, history: [{ t: 0, dT: 30, inBand: true, k: 1 }], ...o });
  assert.equal(C.monitorAlarm("pwr", run({}), 600), false);
  assert.equal(C.monitorAlarm("pwr", run({ powerPct: 40, flowPct: 50 }), 600), false, "40% power: ΔT below the band is normal, not an alarm");
  const trip = C.monitorState("pwr", run({ scram: true }), 600);
  assert.ok(trip.tripped && trip.alarms.includes("trip"));
  assert.equal(trip.values.find((x) => x.m.id === "power").v, 0);
  const hot = C.monitorState("pwr", run({ powerPct: 100, flowPct: 55 }), 600);
  assert.ok(hot.alarms.includes("dT"), "full power on 55% flow: ΔT above the band");
  assert.ok(hot.values.find((x) => x.m.id === "hot").v > hot.values.find((x) => x.m.id === "cold").v);
  assert.equal(C.shiftAt(23 * 60), "Night");
  assert.equal(C.shiftAt(7 * 60), "Day");
  assert.equal(C.shiftAt(15 * 60), "Swing");
});
