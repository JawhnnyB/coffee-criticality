import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-teach-"));
const entry = join(dir, "entry.ts");
writeFileSync(
  entry,
  `export * from ${JSON.stringify(join(root, "src/game/nightwatch/model.ts"))};\nexport { nightCoachLine } from ${JSON.stringify(join(root, "src/game/nightwatch/nightCoach.ts"))};\n`,
);
const out = join(dir, "teach.mjs");
const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], {
  encoding: "utf8",
  cwd: root,
});
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
const W = await import(out);

function coach(n, extra = {}) {
  const lit = new Set(W.alarms(n));
  return W.nightCoachLine({
    night: n.night,
    minute: n.minute,
    tablet: n.tablet,
    camera: n.camera,
    falseReports: n.falseReports,
    oddityHere: W.oddityOn(n, n.camera) !== null,
    liveHere: W.liveOn(n, n.camera) !== null,
    events: n.events.map((e) => ({
      id: e.def.id,
      camera: e.def.camera,
      start: e.start,
      open: e.caughtAt === null && e.doneAt === null,
      flashing: e.caughtAt === null && e.doneAt === null && n.minute >= e.start && Object.keys(e.def.effect).some((id) => lit.has(id)),
    })),
    ...extra,
  });
}

test("night 1 is a silent door, a gull, and one camera that can flash", () => {
  const n = W.newNight("pwr", 1, 3);
  assert.equal(n.events.length, 3);
  const door = n.events.find((e) => e.def.id === "lhra-door");
  assert.ok(door);
  assert.equal(door.start, 70);
  assert.equal(Object.keys(door.def.effect).length, 0);
  const pump = n.events.find((e) => e.def.id === "feed-pump");
  assert.ok(pump);
  assert.equal(pump.start, 150);
  assert.ok(Object.keys(pump.def.effect).length > 0);
  const gull = n.oddities.find((o) => o.def.visual === "gull");
  assert.ok(gull);
  assert.equal(gull.start, 45);
  assert.equal(gull.end, 110);
  n.minute = 76;
  assert.ok(W.radio(n).some((l) => l.includes("aux corridor door")));
  n.minute = 0;
  n.tablet = false;
  assert.equal(coach(n), "Space opens the tablet.");
  n.minute = 50;
  n.tablet = true;
  n.camera = "intake";
  assert.equal(coach(n), "That is an oddity. Leave it.");
  n.minute = 80;
  n.camera = "turbine";
  assert.equal(coach(n), "Jordan named a camera. Check it.");
  n.minute = 156;
  n.camera = "yard";
  assert.equal(coach(n), "A flash is an alarm. Open that camera.");
  n.camera = "turbine";
  assert.equal(coach(n), "Report the kind that fits.");
  const later = W.newNight("pwr", 2, 3);
  later.minute = 10;
  assert.equal(coach(later), null);
  for (const line of ["Space opens the tablet.", "That is an oddity. Leave it.", "Jordan named a camera. Check it.", "A flash is an alarm. Open that camera.", "Report the kind that fits."]) {
    assert.equal(line.includes("!"), false);
    assert.ok(line.length <= 78, line);
  }
});
