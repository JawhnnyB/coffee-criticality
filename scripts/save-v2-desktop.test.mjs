// Version 2 save with the desktop: setup, settings, the desktop and overlay return paths, and the freeze (spec 4.1, 4.2, save v2 fields).
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-save-desk-"));
const saveOut = join(dir, "save.mjs");
const simOut = join(dir, "sim.mjs");
for (const [src, o] of [
  ["src/game/save.ts", saveOut],
  ["src/game/sim.ts", simOut],
]) {
  const built = spawnSync(
    process.env.ESBUILD ?? "npx",
    [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, src), "--bundle", "--platform=node", "--format=esm", `--outfile=${o}`],
    { encoding: "utf8", cwd: root },
  );
  if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
}

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const Save = await import(saveOut);
const Sim = await import(simOut);

test("a new state starts outside the desktop, and the desktop has its defaults", () => {
  const s = Sim.createState();
  assert.equal(s.deskHost, false);
  assert.notEqual(s.mode, "desktop");
  assert.deepEqual(s.desktop.pinned, ["design", "academy", "music", "settings"]);
  assert.equal(s.setup.region, null);
});

test("opening the desktop freezes the clock, and leaving it returns to the world", () => {
  const s = Sim.createState();
  s.mode = "play";
  Sim.openDesktop(s);
  assert.equal(s.mode, "desktop");
  assert.equal(s.deskHost, true);
  assert.equal(Sim.homeMode(s), "desktop");
  const before = s.minutes;
  for (let i = 0; i < 60; i++) Sim.update(s, Sim.emptyActions(), 1);
  assert.equal(s.minutes, before, "no in-world time passes while the desktop is open");
  Sim.leaveDesktop(s);
  assert.equal(s.mode, "play");
  assert.equal(s.deskHost, false);
  assert.equal(Sim.homeMode(s), "play");
});

test("an overlay launched from the desktop returns to the desktop when it is closed", () => {
  const s = Sim.createState();
  s.mode = "play";
  Sim.openDesktop(s);
  Sim.launchFromDesk(s, "fish");
  assert.equal(s.mode, "fish");
  assert.equal(s.deskHost, true);
  Sim.abortOverlay(s);
  assert.equal(s.mode, "desktop", "back to the desktop, not the world");
});

test("Academy launched from the desktop sets its flag and goal, and returns to the desktop", () => {
  const s = Sim.createState();
  s.mode = "play";
  Sim.openDesktop(s);
  Sim.launchFromDesk(s, "academy");
  assert.equal(s.flags.academy, true);
  Sim.closeAcademy(s);
  assert.equal(s.mode, "desktop");
});

test("the setup is saved as the season and stance, with the region left unset", () => {
  const s = Sim.createState();
  Sim.applySetup(s, "spring", "bold");
  assert.equal(s.setup.season, "spring");
  assert.equal(s.setup.stance, "bold");
  assert.equal(s.setup.region, null);
});

test("a new shift keeps the setup and the desktop settings, and starts everything else over", () => {
  const s = Sim.createState();
  Sim.applySetup(s, "winter", "cautious");
  s.desktop.clock24 = true;
  s.desktop.accent = "leaf";
  s.culture = 88;
  s.role = "transferred";
  Sim.resetShift(s);
  assert.equal(s.setup.season, "winter");
  assert.equal(s.setup.stance, "cautious");
  assert.equal(s.desktop.clock24, true);
  assert.equal(s.desktop.accent, "leaf");
  assert.equal(s.role, null);
  assert.notEqual(s.culture, 88);
});

test("settings made in a shift survive a reload, with the setup and the desktop", () => {
  store.clear();
  const s = Sim.createState();
  Sim.applySetup(s, "summer", "bold");
  s.role = "transferred";
  s.mode = "desktop";
  s.deskHost = true;
  s.desktop.clock24 = true;
  s.desktop.accent = "gold";
  s.desktop.reducedMotion = true;
  s.desktop.pinned = ["settings", "music"];
  assert.equal(Save.writeSave(s, true), true);

  const back = Sim.createState();
  assert.equal(Save.hydrateSave(back), true);
  assert.equal(back.setup.season, "summer");
  assert.equal(back.setup.stance, "bold");
  assert.equal(back.desktop.clock24, true);
  assert.equal(back.desktop.accent, "gold");
  assert.equal(back.desktop.reducedMotion, true);
  assert.deepEqual(back.desktop.pinned, ["settings", "music"]);
  assert.notEqual(back.mode, "desktop", "a saved desktop reloads as the world");
});

test("with no shift started, settings are not written, so no save appears before a shift", () => {
  store.clear();
  const s = Sim.createState();
  Sim.applySetup(s, "fall", "steady");
  s.mode = "desktop";
  s.deskHost = true;
  assert.equal(Save.writeSave(s, true), false);
  assert.equal(store.has(Save.SAVE_KEY_V2), false);
});

test("the version 2 save carries the fields the spec names", () => {
  store.clear();
  const s = Sim.createState();
  s.role = "transferred";
  s.mode = "play";
  Save.writeSave(s, true);
  const data = JSON.parse(store.get(Save.SAVE_KEY_V2));
  assert.equal(data.version, 2);
  for (const k of ["setup", "run", "desktop", "results", "news", "academyTiers"]) {
    assert.ok(k in data, `${k} is in the save`);
  }
  assert.deepEqual(Object.keys(data.setup).sort(), ["region", "season", "seed", "stance"].sort());
});
