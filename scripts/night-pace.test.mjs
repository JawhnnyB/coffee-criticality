import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-pace-"));
const entry = join(dir, "entry.ts");
writeFileSync(
  entry,
  `export * from ${JSON.stringify(join(root, "src/game/nightwatch/model.ts"))};\nexport { setNightPace } from ${JSON.stringify(join(root, "src/game/frameRate.ts"))};\n`,
);
const out = join(dir, "pace.mjs");
const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], {
  encoding: "utf8",
  cwd: root,
});
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
const W = await import(out);

const pumpOf = (n) => n.events.find((e) => e.def.id === "feed-pump");

test("night pace changes pots, drain and escalation when the night is dealt", () => {
  W.setNightPace("standard");
  const std = W.newNight("pwr", 1, 3);
  assert.equal(std.brewsLeft, 3);
  assert.equal(std.drain, 1);
  assert.equal(pumpOf(std).def.escalate, Math.round(40 * 1.3));

  W.setNightPace("relaxed");
  const rel = W.newNight("pwr", 1, 3);
  assert.equal(rel.brewsLeft, 4);
  assert.equal(rel.drain, 0.7);
  assert.equal(pumpOf(rel).def.escalate, Math.round(40 * 1.3 * 1.35));

  W.setNightPace("nuke");
  const nuke = W.newNight("pwr", 1, 3);
  assert.equal(nuke.brewsLeft, 2);
  assert.equal(nuke.drain, 1.4);
  assert.equal(pumpOf(nuke).def.escalate, Math.round(40 * 1.3 * 0.72));
  assert.equal(W.newNight("pwr", 4, 1).brewsLeft, 1, "nuke never takes the last pot");

  W.setNightPace("relaxed");
  const slow = W.newNight("pwr", 2, 5);
  W.setNightPace("nuke");
  const fast = W.newNight("pwr", 2, 5);
  slow.events = [];
  fast.events = [];
  slow.tablet = true;
  fast.tablet = true;
  W.tick(slow, 20);
  W.tick(fast, 20);
  assert.ok(fast.coffee < slow.coffee, `${fast.coffee} vs ${slow.coffee}`);
  W.setNightPace("standard");
});
