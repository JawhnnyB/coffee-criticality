import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-crew-"));
const entry = join(dir, "entry.ts");
writeFileSync(
  entry,
  [
    `export { noteARotation, readCrew, dawnCrewLine, takeARotationScene, A_ROTATION_SCENE, DAWN_CREW_LINE } from ${JSON.stringify(join(root, "src/game/nightwatch/crewUnlock.ts"))};`,
    `export { addScene, knownAbout } from ${JSON.stringify(join(root, "src/game/social.ts"))};`,
    `export { createState, openTalk } from ${JSON.stringify(join(root, "src/game/sim.ts"))};`,
    `export { setMuted } from ${JSON.stringify(join(root, "src/game/audio.ts"))};`,
  ].join("\n"),
);
const out = join(dir, "crew.mjs");
const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`, "--loader:.png=empty"], {
  encoding: "utf8",
  cwd: root,
});
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
const any = new Proxy(function () {}, {
  get: (_t, k) => (k === "currentTime" || k === "sampleRate" ? 44100 : k === Symbol.toPrimitive ? () => 0 : any),
  apply: () => any,
  construct: () => any,
  set: () => true,
});
globalThis.window ??= { AudioContext: any };
const W = await import(out);
W.setMuted(true);

function texts(scene) {
  const lines = [];
  for (const line of scene.lines) {
    lines.push(line.text);
    for (const c of line.choices ?? []) lines.push(c.label, c.reply);
  }
  lines.push(scene.known, W.DAWN_CREW_LINE);
  return lines;
}

test("four A's unlock one Elena scene, once, outside the week save", () => {
  store.clear();
  assert.equal(W.noteARotation(["A", "A", "A", "B"]).unlocked, false);
  assert.equal(W.noteARotation(["A", "A", "A"]).unlocked, false);
  assert.equal(W.noteARotation(["A", "A", "A", "A"]).unlocked, true);
  assert.equal(W.readCrew().seen, false);
  assert.equal(store.has("cc.save.v2"), false);
  assert.equal(store.has("cc.profile"), true);
  assert.equal(store.has("cc.crew"), false);
  assert.equal(W.dawnCrewLine(["A", "A", "A", "A"], false), W.DAWN_CREW_LINE);
  assert.equal(W.dawnCrewLine(["A", "A", "A", "B"], false), null);

  const s = W.createState();
  s.mode = "play";
  s.day = 1;
  W.openTalk(s, "elena");
  assert.equal(W.addScene(s, true), null);
  assert.equal(W.readCrew().seen, false);

  W.openTalk(s, "mabel");
  assert.equal(W.addScene(s, false), null);
  assert.equal(W.readCrew().seen, false);

  W.openTalk(s, "elena");
  const scene = W.addScene(s, false);
  assert.equal(scene.title, "The quiet nights");
  assert.equal(s.dialogue.some((l) => l.text.startsWith("Four quiet nights")), true);
  assert.equal(s.flags["social:elena:1"], undefined);
  assert.equal(W.readCrew().seen, true);
  assert.equal(W.dawnCrewLine(["A", "A", "A", "A"], true), null);
  assert.ok(W.knownAbout(s, "elena").includes(W.A_ROTATION_SCENE.known));

  W.openTalk(s, "elena");
  const again = W.addScene(s, false);
  assert.equal(again?.title, "Two sets of eyes");
  assert.equal(s.dialogue.some((l) => l.text.startsWith("Four quiet nights")), false);

  const kept = store.get("cc.profile");
  store.delete("cc.save.v2");
  assert.equal(store.get("cc.profile"), kept);
  assert.equal(W.noteARotation(["A", "A", "A", "A"]).seen, true);
});

test("the scene lines are short and have no exclamation mark", () => {
  for (const line of texts(W.A_ROTATION_SCENE)) {
    assert.ok(line.length <= 78, line);
    assert.equal(line.includes("!"), false, line);
  }
});
