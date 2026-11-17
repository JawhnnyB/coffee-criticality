import assert from "node:assert/strict";
import test from "node:test";
import { hallDistance, hallTone } from "../src/game/siteAudio.ts";

test("hall tone follows power, goes quiet on a scram, and dies when sound is off", () => {
  const quiet = hallTone("pwr", 0.2, false, 0, true);
  const loud = hallTone("pwr", 1, false, 0, true);
  assert.ok(loud.gain > quiet.gain);
  assert.ok(loud.humHz > quiet.humHz);
  assert.ok(loud.hissHz > 0);
  const scram = hallTone("bwr", 1, true, 0, true);
  assert.equal(scram.label, "decay fan");
  assert.ok(scram.gain < loud.gain);
  assert.equal(hallTone("pebble", 1, false, 0, false).gain, 0);
  assert.equal(hallTone("pebble", 1, false, 0, true).label, "blower");
  const salt = hallTone("msr", 1, false, 0, true);
  assert.equal(salt.label, "cooler");
  assert.ok(salt.tickHz > 0);
  const far = hallTone("pwr", 1, false, 1, true);
  assert.equal(far.gain, 0);
  assert.equal(hallDistance("reactor"), 0);
  assert.ok(hallDistance("cafe") > hallDistance("control"));
});
