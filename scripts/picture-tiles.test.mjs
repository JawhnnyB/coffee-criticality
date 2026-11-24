import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-tiles-"));
const entry = join(dir, "entry.ts");
writeFileSync(
  entry,
  [
    `export { siteWatch, newNight } from ${JSON.stringify(join(root, "src/game/nightwatch/model.ts"))};`,
    `export { nightCoachLine } from ${JSON.stringify(join(root, "src/game/nightwatch/nightCoach.ts"))};`,
    `export { turnoverRows } from ${JSON.stringify(join(root, "src/game/nightwatch/turnover.ts"))};`,
    `export { carryover } from ${JSON.stringify(join(root, "src/game/nightwatch/carryover.ts"))};`,
  ].join("\n"),
);
const out = join(dir, "tiles.mjs");
const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], {
  encoding: "utf8",
  cwd: root,
});
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
const W = await import(out);

const SITES = ["pwr", "bwr", "pebble", "msr"];

function keys(effect) {
  return Object.keys(effect).sort().join(",");
}

function extras() {
  const residue = { valve: "hid", tag: "hid", dose: "open", log: "open" };
  const out = [];
  for (const night of [1, 2, 3, 4]) {
    const seed = W.carryover({ residue, maintDone: true, shuffleDone: false, ended: null }, night);
    for (const x of seed.extras) out.push(x.def);
  }
  return out;
}

test("no two events on the same site and camera share a picture unless their tiles differ", () => {
  const carried = extras();
  assert.ok(carried.some((e) => e.id === "valve-14"));
  assert.ok(carried.some((e) => e.id === "tag-sticker"));
  assert.ok(carried.some((e) => e.id === "tag-missing"));
  for (const site of SITES) {
    const events = [...W.siteWatch(site).events, ...carried];
    const groups = new Map();
    for (const e of events) {
      const k = `${e.camera}|${e.visual}`;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(e);
    }
    for (const [k, list] of groups) {
      const sigs = list.map((e) => keys(e.effect));
      assert.equal(new Set(sigs).size, list.length, `${site} ${k} shares a picture and the same tiles`);
    }
  }
});

test("night 2 says the board tells you what kind, and the turnover names that tile", () => {
  const watch = W.siteWatch("pwr");
  const tube = watch.events.find((e) => e.id === "sg-tube");
  const step = watch.events.find((e) => e.id === "msl-step");
  assert.equal(tube.visual, step.visual);
  assert.notEqual(keys(tube.effect), keys(step.effect));
  const catalog = watch.events.map((e) => ({ id: e.id, camera: e.camera, visual: e.visual, tiles: Object.keys(e.effect) }));
  const line = W.nightCoachLine({
    night: 2,
    minute: 40,
    tablet: true,
    camera: tube.camera,
    falseReports: 0,
    oddityHere: false,
    liveHere: true,
    events: [{ id: tube.id, camera: tube.camera, start: 20, open: true, flashing: true, visual: tube.visual, tiles: Object.keys(tube.effect) }],
    catalog,
  });
  assert.equal(line, "The board tells you what kind.");
  assert.equal(line.includes("!"), false);
  assert.ok(line.length <= 78);
  const quiet = W.nightCoachLine({
    night: 2,
    minute: 40,
    tablet: true,
    camera: "yard",
    falseReports: 0,
    oddityHere: false,
    liveHere: false,
    events: [{ id: "yard-arc", camera: "yard", start: 20, open: true, flashing: true, visual: "arc", tiles: ["grid"] }],
    catalog,
  });
  assert.equal(quiet, null);
  assert.equal(W.nightCoachLine({ night: 3, minute: 40, tablet: true, camera: tube.camera, falseReports: 0, oddityHere: false, liveHere: true, events: [], catalog }), null);

  const n = W.newNight("pwr", 2, 1);
  n.events = [{ def: tube, start: 30, caughtAt: 40, early: true, doneAt: null }];
  n.minute = 360;
  const row = W.turnoverRows(n).find((r) => r.title.includes("tube") || r.title.includes("Steam generator"));
  assert.ok(row);
  assert.equal(row.tile, "What tells it apart on the board: Pressurizer level.");
  assert.equal(row.tile.includes("!"), false);
  assert.ok(row.tile.length <= 78);
  const pump = watch.events.find((e) => e.id === "feed-pump");
  n.events = [{ def: pump, start: 30, caughtAt: 40, early: true, doneAt: null }];
  assert.equal(W.turnoverRows(n)[0].tile, null);
});
