/**
 * One profile keeps crew, paper, endless, and the daily board across a reload.
 * The desktop bridge copies that key and does not rotate it with the week file.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-profile-"));
const entry = join(dir, "entry.ts");
writeFileSync(
  entry,
  [
    `export { noteARotation, readCrew } from ${JSON.stringify(join(root, "src/game/nightwatch/crewUnlock.ts"))};`,
    `export { writePaper, readPaper } from ${JSON.stringify(join(root, "src/game/nightwatch/paper.ts"))};`,
    `export { noteEndless, readEndless } from ${JSON.stringify(join(root, "src/game/nightwatch/endless.ts"))};`,
    `export { recordDaily, readDaily } from ${JSON.stringify(join(root, "src/game/nightwatch/daily.ts"))};`,
    `export { PROFILE_SAVE, DESK_PLAIN, LIVE_SAVE } from ${JSON.stringify(join(root, "src/game/deskSave.ts"))};`,
    `export { PROFILE_KEY } from ${JSON.stringify(join(root, "src/game/profile.ts"))};`,
  ].join("\n"),
);
const out = join(dir, "profile.mjs");
const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], {
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
const W = await import(out);
const day = new Date("2026-11-23T15:00:00Z");

test("a reload of the profile keeps crew, paper, endless, and the daily board", () => {
  store.clear();
  assert.equal(W.noteARotation(["A", "A", "A", "A"]).unlocked, true);
  W.writePaper(["Nights A A A A."]);
  assert.equal(W.noteEndless(4, 90).nights, 4);
  W.recordDaily(88, "B", day);

  assert.equal(store.has("cc.crew"), false);
  assert.equal(store.has("cc.paper"), false);
  assert.equal(store.has("cc.endless"), false);
  assert.equal(store.has("cc.daily"), false);
  assert.equal(store.has(W.LIVE_SAVE), false);
  const raw = store.get(W.PROFILE_KEY);
  assert.equal(typeof raw, "string");

  store.clear();
  store.set(W.PROFILE_KEY, raw);

  assert.equal(W.readCrew().unlocked, true);
  assert.equal(W.readCrew().seen, false);
  assert.deepEqual(W.readPaper(), ["Nights A A A A."]);
  assert.equal(W.readEndless().nights, 4);
  assert.equal(W.readEndless().points, 90);
  const board = W.readDaily(day);
  assert.equal(board.rows.length, 1);
  assert.equal(board.rows[0].points, 88);
  assert.equal(board.rows[0].letter, "B");
  assert.ok(W.DESK_PLAIN.includes(W.PROFILE_SAVE));
  assert.equal(W.PROFILE_SAVE, W.PROFILE_KEY);
});

test("an old key moves into the profile on the next read", () => {
  store.clear();
  store.set("cc.endless", JSON.stringify({ nights: 2, points: 70 }));
  assert.equal(W.readEndless().nights, 2);
  assert.equal(store.has("cc.endless"), false);
  assert.equal(JSON.parse(store.get(W.PROFILE_KEY)).endless.points, 70);
});
