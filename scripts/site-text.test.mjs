import assert from "node:assert/strict";
import test from "node:test";
import { SITE_TEXT, anatomyLines, siteLine } from "../src/game/siteText.ts";

test("PWR lines stay the original sentences", () => {
  assert.equal(
    siteLine("pwr", "heatLeaves"),
    "On this site (PWR): Q = ṁ × cp × ΔT. Cold leg in, downcomer down, core up, hot leg out. Primary stays liquid at ~16 MPa classroom. Teaching model — not a license.",
  );
  assert.equal(
    siteLine("pwr", "vesselNames"),
    "A PWR pressure vessel holds the fuel, the water, and the control rods. Inlet nozzle, core barrel, downcomer, lower plenum, fuel, upper internals, outlet nozzle. Not a design basis.",
  );
  assert.equal(siteLine("pwr", "windowReactor"), "The vessel has names. CRDMs from above.");
  assert.match(siteLine("bwr", "windowReactor"), /below/);
  assert.match(siteLine("msr", "fastSalt"), /fluoride/i);
  assert.match(siteLine("msr", "fastSalt"), /not a chloride/i);
  assert.equal(anatomyLines("bwr").some((l) => /below/.test(l)), true);
  for (const kind of ["pwr", "bwr", "pebble", "msr"]) {
    for (const key of Object.keys(SITE_TEXT.pwr)) {
      assert.equal(typeof SITE_TEXT[kind][key], "string");
      assert.ok(SITE_TEXT[kind][key].length > 0, `${kind}.${key}`);
    }
  }
});
