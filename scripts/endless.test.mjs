import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-end-"));
const entry = join(dir, "entry.ts");
writeFileSync(
  entry,
  `export * from ${JSON.stringify(join(root, "src/game/nightwatch/model.ts"))};\nexport { noteEndless, readEndless } from ${JSON.stringify(join(root, "src/game/nightwatch/endless.ts"))};\n`,
);
const out = join(dir, "end.mjs");
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

test("endless nights get harder, and the high score stays out of the week save", () => {
  assert.equal(W.nightPlan(1).events, W.NIGHTS[0].events);
  assert.equal(W.nightPlan(4).brews, 1);
  assert.equal(W.nightPlan(5).events, 7);
  assert.equal(W.nightPlan(5).brews, 1);
  assert.ok(W.nightPlan(5).escalateScale < W.nightPlan(4).escalateScale);
  assert.equal(W.nightPlan(20).escalateScale, 0.45);
  assert.equal(W.newNight("pwr", 5, 2).events.length, 7);
  assert.equal(W.noteEndless(1, 82).nights, 1);
  assert.equal(W.noteEndless(3, 70).nights, 3);
  assert.equal(W.noteEndless(2, 90).points, 90);
  assert.equal(W.readEndless().nights, 3);
  assert.equal(store.has("cc.save.v2"), false);
  assert.ok(store.has("cc.endless"));
});
