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

import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-text-"));
const entry = join(dir, "entry.ts");
writeFileSync(
  entry,
  `export { TERM_LESSONS } from ${JSON.stringify(join(root, "src/game/nuclearLab.ts"))};\nexport { speak, SITE_TEXT as TEXT } from ${JSON.stringify(join(root, "src/game/siteText.ts"))};\n`,
);
const out = join(dir, "text.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const L = await import(out);

const PWR_SITE = /this site is a PWR|On this site \(PWR\)|This site is a PWR/i;

test("no lesson tells a BWR, pebble or salt site that it is a PWR", () => {
  let checked = 0;
  for (const kind of ["bwr", "pebble", "msr"]) {
    for (const [id, lesson] of Object.entries(L.TERM_LESSONS)) {
      for (const text of [lesson.plain, ...lesson.steps, lesson.what, lesson.where, lesson.why]) {
        checked++;
        assert.doesNotMatch(L.speak(kind, text), PWR_SITE, `${kind} · ${id}: ${text.slice(0, 60)}`);
      }
    }
  }
  assert.ok(checked > 100, `checked ${checked} lines`);
});

test("on a PWR site the lessons read exactly as written", () => {
  for (const lesson of Object.values(L.TERM_LESSONS)) {
    for (const text of [lesson.plain, ...lesson.steps, lesson.what, lesson.where, lesson.why]) {
      assert.equal(L.speak("pwr", text), text);
    }
  }
});

test("every PWR line that speak() swaps is a real sentence in the lessons or the stills", () => {
  const lessons = Object.values(L.TERM_LESSONS).flatMap((l) => [l.plain, ...l.steps, l.what, l.where, l.why]);
  for (const key of ["coolantStepPwr", "steamPath", "vesselPlain", "whyThermal", "voidStep"]) {
    assert.ok(lessons.includes(L.TEXT.pwr[key]), `${key} must match a lesson sentence word for word, or the swap never fires`);
  }
});
