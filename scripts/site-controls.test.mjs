import assert from "node:assert/strict";
import test from "node:test";
import { bwrPower, commandFor, panelFor, pebbleOutletC, pebblePass, saltBetaEff, saltDrain } from "../src/game/siteControls.ts";

test("BWR power rises when recirc flow rises at the same rods", () => {
  const low = bwrPower(40, 80);
  const high = bwrPower(100, 80);
  assert.ok(high > low, `${high} should beat ${low}`);
});

test("draining a salt core ends fission heat", () => {
  const shut = saltDrain(0);
  const gone = saltDrain(40);
  assert.equal(shut.fission, 1);
  assert.equal(gone.plug, "open");
  assert.equal(gone.fission, 0);
  const sim = commandFor("msr", 80, { rodsWithdrawnPct: 50, flowPct: 100, drain: true, drainSeconds: 40, passes: 0 }, false);
  assert.equal(sim.powerPct, 0);
  assert.equal(sim.scram, true);
});

test("pebble burnup rises on each pass and the outlet stays near 750", () => {
  const a = pebblePass(10);
  const b = pebblePass(a.burnupMWd);
  assert.ok(b.burnupMWd > a.burnupMWd);
  assert.equal(pebbleOutletC(), 750);
  assert.equal(pebblePass(82).discharged, true);
});

test("salt panel shows βeff smaller than β and helium does not glow", () => {
  const b = saltBetaEff();
  assert.ok(b.betaEff < b.beta);
  const panel = panelFor(
    "pebble",
    { rodsWithdrawnPct: 80, flowPct: 100, drain: false, drainSeconds: 0, passes: 2 },
    { powerPct: 90, flowPct: 100, rodsWithdrawnPct: 80, scram: false },
  );
  assert.equal(panel.glow, 0);
  assert.match(panel.lines.join(" "), /750/);
  const salt = panelFor(
    "msr",
    { rodsWithdrawnPct: 50, flowPct: 80, drain: false, drainSeconds: 0, passes: 0 },
    { powerPct: 40, flowPct: 80, rodsWithdrawnPct: 50, scram: false },
  );
  assert.match(salt.lines.join(" "), /βeff/);
  assert.equal(salt.glow, 0);
});
