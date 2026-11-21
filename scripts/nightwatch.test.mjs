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
writeFileSync(entry, `export * from ${JSON.stringify(join(root, "src/game/nightwatch/model.ts"))};\n`);
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
  const counts = [1, 2, 3, 4, 5].map((k) => W.newNight("pwr", k).events.length);
  assert.ok(counts.every((c, i) => i === 0 || c >= counts[i - 1]), counts.join(","));
  assert.ok(W.NIGHTS[4].brews < W.NIGHTS[0].brews && W.NIGHTS[4].escalateScale < W.NIGHTS[0].escalateScale);
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
    `export { PAL } from ${JSON.stringify(join(root, "src/game/palette.ts"))};`,
  ].join("\n"),
);
const out2 = join(dir2, "c.mjs");
const built2 = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry2, "--bundle", "--platform=node", "--format=esm", `--outfile=${out2}`], { encoding: "utf8", cwd: root });
if (built2.status !== 0) throw new Error(built2.stderr || built2.stdout);
const C = await import(out2);

/** A stand-in 2D context that records every rectangle and its colour. */
function recorder() {
  const ops = [];
  const g = { fillStyle: "", globalAlpha: 1, fillRect(x, y, w, h) { ops.push(`${this.fillStyle}@${this.globalAlpha.toFixed(2)}:${x},${y},${w},${h}`); } };
  return { g, ops };
}

test("every event's visual changes its camera's picture; scenes use the palette; Cherenkov blue only in the fuel pool", () => {
  const palette = new Set(Object.values(C.PAL).map((v) => String(v).toLowerCase()));
  const cherenkov = new Set([C.PAL.cherenkovD, C.PAL.cherenkov, C.PAL.cherenkovL].map((v) => v.toLowerCase()));
  for (const site of SITES) {
    const w = W.siteWatch(site);
    for (const cam of w.cameras) {
      const base = recorder();
      C.paintCamera(base.g, cam.scene, [], 3.21);
      for (const op of base.ops) {
        const col = op.split("@")[0].toLowerCase();
        assert.ok(palette.has(col), `${cam.scene} paints ${col}, not in the palette`);
        if (cherenkov.has(col)) assert.equal(cam.scene, "pool", `${cam.scene} uses a Cherenkov shade`);
      }
      for (const visual of new Set([...w.events.filter((e) => e.camera === cam.id).map((e) => e.visual), ...w.oddities.filter((o) => o.camera === cam.id).map((o) => o.visual)])) {
        const with_ = recorder();
        C.paintCamera(with_.g, cam.scene, [visual], 3.21);
        assert.notDeepEqual(with_.ops, base.ops, `${site} ${cam.id}: "${visual}" draws nothing`);
      }
    }
  }
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
