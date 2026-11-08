// Fixture scripts/fixtures/save-v1.json was produced by snapshot() on origin/main at 59876ae.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = JSON.parse(readFileSync(join(root, "scripts/fixtures/save-v1.json"), "utf8"));
const dir = mkdtempSync(join(tmpdir(), "cc-save-"));
const saveOut = join(dir, "save.mjs");
const simOut = join(dir, "sim.mjs");
for (const [src, out] of [["src/game/save.ts", saveOut], ["src/game/sim.ts", simOut]]) {
  const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, src), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], { encoding: "utf8", cwd: root });
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

test("a real version 1 fixture migrates without changing residue, flags, plant, academy, trust, or culture", () => {
  const v2 = Save.migrateV1(fixture);
  assert.equal(v2.version, 2);
  assert.equal(v2.migratedFrom, 1);
  assert.deepEqual(v2.residue, fixture.residue);
  assert.equal(v2.residue.valve, "hid");
  assert.equal(v2.flags.hid, true);
  assert.equal(v2.plant.type, fixture.plant.type);
  assert.deepEqual(v2.academyDone, fixture.academyDone);
  assert.equal(v2.trust.mabel, fixture.trust.mabel);
  assert.equal(v2.culture, fixture.culture);
  assert.equal(v2.setup.region, null);
  assert.equal(v2.setup.season, null);
  assert.deepEqual(v2.run.history, []);
  assert.equal(v2.academyTiers.length, v2.academyDone.length);
  assert.ok(v2.academyTiers.every((t) => t === 1));
  assert.deepEqual(v2.news.seenIds, []);
});

test("a version 2 save round-trips, and writing it does not change the version 1 key", () => {
  const original = JSON.stringify(fixture);
  store.set(Save.SAVE_KEY, original);
  const read = Save.peekSave();
  assert.equal(read.residue.valve, "hid");
  assert.equal(store.get(Save.SAVE_KEY), original);

  const s = Sim.createState();
  s.mode = "play";
  s.culture = read.culture;
  s.trust = { ...read.trust };
  s.flags = { ...read.flags };
  s.residue = { ...read.residue };
  s.plant = read.plant;
  s.academyDone = [...read.academyDone];
  s.academyTiers = [...read.academyTiers];
  s.run.powerPct = 62;
  s.desktop.clock24 = true;
  s.news.seenIds = ["item-a"];
  assert.equal(Save.writeSave(s, true), true);

  assert.equal(store.get(Save.SAVE_KEY), original, "v1 key was not rewritten");
  const again = JSON.parse(store.get(Save.SAVE_KEY_V2));
  assert.equal(again.version, 2);
  assert.equal(again.residue.valve, "hid");
  assert.equal(again.flags.hid, true);
  assert.equal(again.culture, fixture.culture);
  assert.equal(again.run.powerPct, 62);
  assert.equal(again.desktop.clock24, true);
  assert.deepEqual(again.news.seenIds, ["item-a"]);
  assert.equal(again.migratedFrom, undefined);

  store.delete(Save.SAVE_KEY);
  const fresh = Sim.createState();
  assert.equal(Save.hydrateSave(fresh), true);
  assert.equal(fresh.residue.valve, "hid");
  assert.equal(fresh.run.powerPct, 62);
  assert.equal(fresh.desktop.clock24, true);
  assert.equal(fresh.setup.region, null);
});
