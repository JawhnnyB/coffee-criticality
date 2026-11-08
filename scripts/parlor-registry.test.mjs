// The app registry drives the start menu, the pinned icons, and the phone home grid (spec 4.4).
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-desk-reg-"));
const out = join(dir, "parlorOS.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/parlorOS.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const P = await import(out);

const none = { hasPlant: false, foundCabinets: false, showAll: false };
const ids = (list) => list.map((a) => a.id);

test("before the design, Reactor Control, Results, Core Map and CORE CAM are hidden; the design and academy show", () => {
  const shown = ids(P.visibleApps(none));
  for (const id of ["control", "results", "coremap", "cam"]) assert.ok(!shown.includes(id), `${id} hidden before design`);
  for (const id of ["design", "academy", "music", "settings"]) assert.ok(shown.includes(id), `${id} visible`);
});

test("the mini games are hidden until a cabinet is found, then they show", () => {
  const shown = ids(P.visibleApps(none));
  for (const id of ["catch", "fish", "plot", "horde", "delay", "golf", "rods", "pebble", "bowl", "phys", "load", "lototo"]) {
    assert.ok(!shown.includes(id), `${id} hidden before a cabinet`);
  }
  const found = ids(P.visibleApps({ ...none, foundCabinets: true }));
  assert.ok(found.includes("fish") && found.includes("lototo"));
});

test("a design shows Reactor Control and the three design-gated apps", () => {
  const shown = ids(P.visibleApps({ ...none, hasPlant: true }));
  for (const id of ["control", "results", "coremap", "cam"]) assert.ok(shown.includes(id), `${id} visible with a design`);
});

test("Show all apps (dev only) shows everything", () => {
  assert.equal(P.visibleApps({ ...none, showAll: true }).length, P.APP_IDS.length);
});

test("pinned icons keep the player's order, skip unknown ids, and hide apps that are not visible", () => {
  const pinned = P.pinnedVisible(["design", "bogus", "catch", "academy"], none);
  assert.deepEqual(ids(pinned), ["design", "academy"]);
  const withFound = P.pinnedVisible(["catch", "design"], { ...none, foundCabinets: true });
  assert.deepEqual(ids(withFound), ["catch", "design"]);
});

test("every sim mode maps back to its registry app", () => {
  assert.equal(P.appForMode("reactor").id, "control");
  assert.equal(P.appForMode("academy").id, "academy");
  assert.equal(P.appForMode("fish").id, "fish");
  assert.equal(P.appForMode("maint").id, "lototo");
  assert.equal(P.appForMode("nope"), null);
});

test("the clock shows 12 or 24 hours", () => {
  assert.equal(P.clockText(13 * 60 + 5, true), "13:05");
  assert.equal(P.clockText(13 * 60 + 5, false), "1:05 PM");
  assert.equal(P.clockText(0, false), "12:00 AM");
  assert.equal(P.clockText(12 * 60, false), "12:00 PM");
});

test("the theme follows the setup season unless a season is picked for it", () => {
  assert.equal(P.themeSeason(true, "spring", "winter"), "winter");
  assert.equal(P.themeSeason(false, "spring", "winter"), "spring");
  assert.equal(P.themeSeason(false, "follow", "winter"), "winter");
});

test("missing or unknown setup values fall back to the defaults, Fall and Steady", () => {
  assert.equal(P.seasonOrDefault(null), "fall");
  assert.equal(P.seasonOrDefault("monsoon"), "fall");
  assert.equal(P.stanceOrDefault(undefined), "steady");
  assert.equal(P.stanceOrDefault("reckless"), "steady");
  assert.equal(P.DEFAULT_SEASON, "fall");
  assert.equal(P.DEFAULT_STANCE, "steady");
});

test("the region is never a choice in this build, and says so", () => {
  assert.equal(P.REGION_PENDING, "Pending verification");
});

test("the registry uses no real site name and no radiation number", () => {
  const text = JSON.stringify(P.APPS);
  assert.ok(!/Harrow/i.test(text), "no Harrow Bend");
  assert.ok(!/\d+\s*(mrem|mSv|µSv|uSv)/i.test(text), "no radiation dose number");
});
