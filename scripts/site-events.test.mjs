import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-events-"));
const entry = join(dir, "entry.ts");
writeFileSync(
  entry,
  [
    `export * from ${JSON.stringify(join(root, "src/game/siteEvents.ts"))};`,
    `export { panelFor, siteStep } from ${JSON.stringify(join(root, "src/game/siteControls.ts"))};`,
    `export { stepBench } from ${JSON.stringify(join(root, "src/game/benchStep.ts"))};`,
  ].join("\n"),
);
const out = join(dir, "events.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const E = await import(out);

const KINDS = ["pwr", "bwr", "pebble", "msr"];
const byId = (id) => E.SITE_EVENTS.find((e) => e.id === id);
const move = { rodsWithdrawnPct: 70, flowPct: 100, drain: false, drainSeconds: 0, passes: 0 };
const sim = { powerPct: 70, flowPct: 100, rodsWithdrawnPct: 70, scram: false };

test("every event has its own outcome row, and every row is an event", () => {
  assert.deepEqual([...E.OUTCOME_IDS].sort(), E.SITE_EVENTS.map((e) => e.id).sort());
  for (const kind of KINDS) assert.ok(E.eventsFor(kind).length >= 3, kind);
});

test("every event, both answers: the right one holds, the wrong one is worse, the panel says which", () => {
  for (const ev of E.SITE_EVENTS) {
    const good = E.resolveEvent(ev, true);
    const bad = E.resolveEvent(ev, false);
    assert.equal(good.ended, false, ev.id);
    assert.equal(bad.ended, true, ev.id);
    assert.equal(good.panel, ev.right, ev.id);
    assert.equal(bad.panel, ev.wrong, ev.id);
    // Worse means at least as bad on every axis the plant shows.
    assert.ok(bad.flow <= good.flow || bad.scram, `${ev.id}: wrong answer should not leave more flow`);
    for (const v of [good, bad]) {
      assert.ok(v.flow >= 0 && v.flow <= 1, ev.id);
      if (v.benchFlow !== undefined) assert.ok(v.benchFlow >= 50 && v.benchFlow <= 120, `${ev.id}: bench flow in slider range`);
      const painted = E.paintEvent(E.panelFor(ev.kind, move, sim), v);
      assert.equal(painted.lines[0], v.panel, ev.id);
      if (v.scram || v.flow === 0) assert.equal(painted.arrows, false, `${ev.id}: arrows stop`);
      if (v.scram) assert.ok(painted.glow <= 0.05, `${ev.id}: only decay glow after a scram`);
    }
  }
});

test("one pump tripping halves the flow, it does not stop the loop", () => {
  for (const id of ["rcp-trip", "recirc-trip"]) {
    const v = E.resolveEvent(byId(id), true);
    assert.equal(v.benchFlow, 50, id);
    assert.equal(v.flow, 0.5, id);
    assert.equal(v.scram, false, id);
  }
});

test("BWR recirc trip, rods left alone: power falls with the voids and the plant does not scram", () => {
  let st = { power: 80, hold: 0, precursors: undefined, rodPos: undefined, lastWritten: null };
  let step;
  for (let t = 0; t < 120; t += 0.05) {
    step = E.stepBench({ ...st, rods: 80, flow: 50, dt: 0.05, plant: "bwr", flowRef: 100 });
    assert.equal(step.scram, false, `scrammed at ${t.toFixed(1)} s, power ${step.power}`);
    st = { power: step.power, hold: step.hold, precursors: step.precursors, rodPos: step.rodPos, lastWritten: step.lastWritten };
  }
  assert.ok(step.power < 75, `power settled at ${step.power}`);
});

test("trips at power scram: RCP held at full power, MSIV, blower, frozen salt line, lost freeze-valve cooling", () => {
  assert.equal(E.resolveEvent(byId("rcp-trip"), false).scram, true);
  for (const id of ["msiv", "blower-trip"]) {
    assert.equal(E.resolveEvent(byId(id), true).scram, true, id);
    assert.equal(E.resolveEvent(byId(id), false).scram, true, id);
  }
  assert.equal(E.resolveEvent(byId("salt-freeze"), false).scram, true);
  assert.equal(E.resolveEvent(byId("freeze-cooling"), false).scram, true);
  assert.equal(E.resolveEvent(byId("freeze-cooling"), true).scram, false);
});

test("leaks mark the steam generator: PWR tube leak and pebble-bed moisture", () => {
  for (const id of ["sg-tube", "helium-moisture"]) {
    for (const right of [true, false]) {
      const painted = E.paintEvent(E.panelFor(byId(id).kind, move, sim), E.resolveEvent(byId(id), right));
      assert.equal(painted.tubeMark, true, `${id} ${right}`);
    }
  }
});

test("the freeze valve is held frozen by cooling air: losing it warms the plug", () => {
  const ev = byId("freeze-cooling");
  assert.match(ev.panel, /cooling air/i);
  assert.match(ev.panel, /rising/i);
  assert.equal(E.SITE_EVENTS.some((e) => /heater fault/i.test(e.title)), false);
});

test("picks only from the plant's own list", () => {
  for (const kind of KINDS) {
    for (const roll of [0, 0.34, 0.67, 0.999]) assert.equal(E.pickEvent(kind, roll).kind, kind);
  }
});
