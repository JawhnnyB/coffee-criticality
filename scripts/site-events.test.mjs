import assert from "node:assert/strict";
import test from "node:test";
import { panelFor } from "../src/game/siteControls.ts";
import { eventsFor, paintEvent, pickEvent, resolveEvent } from "../src/game/siteEvents.ts";

test("each type has at least three events and a wrong response is worse", () => {
  for (const kind of ["pwr", "bwr", "pebble", "msr"]) {
    const list = eventsFor(kind);
    assert.ok(list.length >= 3, kind);
    const ev = pickEvent(kind, 0);
    const good = resolveEvent(ev, true);
    const bad = resolveEvent(ev, false);
    assert.equal(bad.ended, true);
    assert.equal(good.ended, false);
    assert.notEqual(bad.panel, good.panel);
  }
});

test("a tripped recirc pump stops the hall arrows", () => {
  const ev = eventsFor("bwr").find((e) => e.id === "recirc-trip");
  const view = resolveEvent(ev, true);
  const panel = panelFor(
    "bwr",
    { rodsWithdrawnPct: 70, flowPct: 100, drain: false, drainSeconds: 0, passes: 0 },
    { powerPct: 70, flowPct: 100, rodsWithdrawnPct: 70, scram: false },
  );
  const painted = paintEvent(panel, view);
  assert.equal(painted.flow, 0);
  assert.equal(painted.arrows, false);
});

test("a steam-generator tube leak leaves a mark", () => {
  const ev = eventsFor("pwr").find((e) => e.id === "sg-tube");
  const view = resolveEvent(ev, true);
  const panel = panelFor(
    "pwr",
    { rodsWithdrawnPct: 70, flowPct: 100, drain: false, drainSeconds: 0, passes: 0 },
    { powerPct: 70, flowPct: 100, rodsWithdrawnPct: 70, scram: false },
  );
  const painted = paintEvent(panel, view);
  assert.equal(painted.tubeMark, true);
  assert.equal(view.ended, false);
  assert.equal(resolveEvent(ev, false).ended, true);
});
