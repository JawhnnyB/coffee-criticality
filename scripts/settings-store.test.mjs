// Settings live in cc.settings. A fresh load reads them back. Frame rate stays put.
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-settings-"));
const store = new Map();
const dataset = {};
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
};
globalThis.document = { documentElement: { dataset } };

function load(name) {
  const out = join(dir, name);
  const built = spawnSync(
    process.env.ESBUILD ?? "npx",
    [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/frameRate.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
    { encoding: "utf8", cwd: root },
  );
  if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
  return import(out);
}

const first = await load("a.mjs");

test("defaults are full volume, normal text, motion on, shake on", () => {
  assert.deepEqual(first.mixLevels(), { master: 1, music: 1, sound: 1, ambience: 1 });
  assert.equal(first.textSize(), "normal");
  assert.equal(first.reducedMotionOn(), false);
  assert.equal(first.shakeOn(), true);
});

test("sliders and switches write cc.settings and paint the page", () => {
  first.setFrameChoice("30");
  first.setMixLevel("master", 0.4);
  first.setMixLevel("music", 0);
  first.setMixLevel("sound", 2);
  first.setMixLevel("ambience", -0.2);
  first.setTextSize("large");
  first.setReducedMotion(true);
  first.setShakeOn(false);
  first.bootSettings();
  const saved = JSON.parse(store.get("cc.settings"));
  assert.equal(saved.frameRate, "30");
  assert.equal(saved.master, 0.4);
  assert.equal(saved.music, 0);
  assert.equal(saved.sound, 1);
  assert.equal(saved.ambience, 0);
  assert.equal(saved.text, "large");
  assert.equal(saved.reducedMotion, true);
  assert.equal(saved.shake, false);
  assert.equal(dataset.text, "large");
  assert.equal(dataset.motion, "reduce");
  assert.equal(first.shakeOn(), false);
});

test("a new load keeps the settings and can turn shake back on", async () => {
  const second = await load("b.mjs");
  assert.equal(second.frameChoice(), "30");
  assert.deepEqual(second.mixLevels(), { master: 0.4, music: 0, sound: 1, ambience: 0 });
  assert.equal(second.textSize(), "large");
  assert.equal(second.reducedMotionOn(), true);
  assert.equal(second.shakeOn(), false);
  second.setShakeOn(true);
  second.setReducedMotion(false);
  second.bootSettings();
  assert.equal(second.shakeOn(), true);
  assert.equal(dataset.motion, undefined);
  assert.equal(JSON.parse(store.get("cc.settings")).frameRate, "30");
});
