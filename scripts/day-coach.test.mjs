// Day 1 shows one control, then the next, and only after the player has done the last.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-coach-"));
const out = join(dir, "coach.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/dayCoach.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const coach = await import(out);

const base = { day: 1, mode: "play", moved: false, mabel: false, entered: false, holt: false, resolved: false };

test("day 1 teaches one control at a time and stops", () => {
  assert.equal(coach.coachLine(base), "Walk. WASD or the arrows.");
  assert.equal(coach.coachLine({ ...base, moved: true }), "E sits with Mabel.");
  assert.equal(coach.coachLine({ ...base, moved: true, mabel: true }), "Walk east to the gate.");
  assert.equal(coach.coachLine({ ...base, moved: true, mabel: true, entered: true }), "E talks to Holt.");
  assert.equal(coach.coachLine({ ...base, moved: true, mabel: true, entered: true, holt: true }), "P looks closer at what is wrong.");
  assert.equal(coach.coachLine({ ...base, mode: "incident", holt: true }), "R reports. H hides. P looks with you.");
  assert.equal(coach.coachLine({ ...base, moved: true, mabel: true, entered: true, holt: true, resolved: true }), null);
  assert.equal(coach.coachLine({ ...base, day: 2, moved: false }), null);
  assert.equal(coach.coachLine({ ...base, mode: "dialogue", moved: true }), null);
  for (const line of ["Walk. WASD or the arrows.", "E sits with Mabel.", "Walk east to the gate.", "E talks to Holt.", "P looks closer at what is wrong.", "R reports. H hides. P looks with you."]) {
    assert.ok(line.length <= 78, line);
    assert.equal(line.includes("!"), false);
  }
});
