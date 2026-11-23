import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-day-"));
const entry = join(dir, "entry.ts");
writeFileSync(entry, `export * from ${JSON.stringify(join(root, "src/game/nightwatch/daily.ts"))};\nexport { newNight } from ${JSON.stringify(join(root, "src/game/nightwatch/model.ts"))};\n`);
const out = join(dir, "day.mjs");
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
const next = new Date("2026-11-24T01:00:00Z");

test("one UTC day is one seed, and the board is local", () => {
  assert.equal(W.dailySeed(day), W.dailySeed(new Date("2026-11-23T23:00:00Z")));
  assert.notEqual(W.dailySeed(day), W.dailySeed(next));
  const a = W.newNight("pwr", 2, W.dailySeed(day));
  const b = W.newNight("pwr", 2, W.dailySeed(day));
  assert.equal(a.events.map((e) => `${e.def.id}@${e.start}`).join(), b.events.map((e) => `${e.def.id}@${e.start}`).join());
  W.recordDaily(70, "C", day);
  W.recordDaily(92, "B", day);
  const board = W.readDaily(day);
  assert.equal(board.rows[0].points, 92);
  assert.equal(board.rows[0].letter, "B");
  assert.equal(W.readDaily(next).rows.length, 0);
  assert.equal(store.has("cc.save.v2"), false);
  assert.ok(store.has("cc.daily"));
});
