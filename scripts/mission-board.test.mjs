#!/usr/bin/env node
// The corner mission board (src/game/missionBoard.ts) and the walk in to a night watch (week.ts): the next thing is
// marked, optional things wait at the end, and at night the crew has gone home except Mabel and Jordan.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-mission-"));
const entry = join(dir, "entry.ts");
const out = join(dir, "mission.mjs");
writeFileSync(
  entry,
  [
    `export * from ${JSON.stringify(join(root, "src/game/missionBoard.ts"))};`,
    `export { setNightWalk, nightWalkOn, nightPost, nightWalkDirection, occupancyOverlay } from ${JSON.stringify(join(root, "src/game/week.ts"))};`,
    `export { emptyResidue, ROOMS } from ${JSON.stringify(join(root, "src/game/content.ts"))};`,
    `export { NIGHT_WALK_MINUTES, daylightAt } from ${JSON.stringify(join(root, "src/game/daylight.ts"))};`,
  ].join("\n"),
);
const b = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`, "--loader:.png=empty"], { encoding: "utf8", cwd: root });
if (b.status !== 0) throw new Error(b.stderr || b.stdout);
const M = await import(out);

test("the board marks the first thing still to do, ticks the done, and puts optional things last", () => {
  const board = M.missionBoard([
    { id: "a", label: "Sit with Mabel", done: true },
    { id: "b", label: "Catch cabinet (optional)", done: false },
    { id: "c", label: "Walk onto the floor", done: false },
    { id: "d", label: "Academy or ΔT bench", done: false },
  ]);
  assert.deepEqual(board.map((m) => `${m.id}:${m.state}`), ["a:done", "c:now", "d:todo", "b:optional"]);
  assert.equal(board.find((m) => m.id === "b").label, "Catch cabinet", "the (optional) tag becomes the quiet note");
  assert.deepEqual(M.missionBoard([{ id: "x", label: "Done", done: true }]).map((m) => m.state), ["done"]);
  assert.equal(M.missionBoard([]).length, 0);
});

test("tonight's board: walk to the desk, then take the watch", () => {
  assert.deepEqual(M.nightMissions(false).map((m) => m.state), ["now", "todo"]);
  assert.deepEqual(M.nightMissions(true).map((m) => m.state), ["done", "now"]);
});

test("on the walk in, the day crew has gone home: Mabel closes the café, Jordan starts his rounds on the lot", () => {
  const r = M.emptyResidue();
  M.setNightWalk(true);
  try {
    assert.equal(M.nightWalkOn(), true);
    const mabel = M.occupancyOverlay(3, "mabel", r, false, null, false, false);
    assert.equal(mabel.room, "cafe");
    assert.ok(mabel.y < 96, "behind her counter");
    assert.equal(M.occupancyOverlay(3, "jordan", r, true, "a", false, false).room, "gate", "even after a dusk walk");
    for (const id of ["holt", "elena", "tommy", "marcus", "priya"]) {
      const post = M.occupancyOverlay(4, id, r, false, null, false, false);
      assert.ok(post.x < 0 && post.y < 0, `${id} is off the map`);
    }
  } finally {
    M.setNightWalk(false);
  }
  assert.equal(M.nightWalkOn(), false);
  assert.notEqual(M.occupancyOverlay(2, "tommy", r, false, null, false, false)?.x, -400, "the day goes back to its own posts");
});

test("the walk's directions lead from the café to Control, and it's night out", () => {
  const route = ["cafe", "gate", "corridor", "control"].map(M.nightWalkDirection);
  assert.match(route[0], /East/);
  assert.match(route[1], /plant door/);
  assert.match(route[2], /North.*Control/);
  assert.match(M.nightWalkDirection("engineering"), /Control/);
  for (const [from, to] of [["cafe", "gate"], ["gate", "corridor"], ["corridor", "control"]]) {
    assert.ok(M.ROOMS[from].doors.some((d) => d.to === to), `${from} has a door to ${to}`);
  }
  const d = M.daylightAt(M.NIGHT_WALK_MINUTES);
  assert.ok(d.lamps > 0.9 && d.stars > 0.5, "18:00: lamps up, stars out");
});
