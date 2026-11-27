#!/usr/bin/env node
// The moving cutaways on the Friday desks (src/game/refuel/deskArt.ts): they follow the desk's numbers, and every
// rectangle lands on whole pixels inside the 96x72 picture.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-deskart-"));
const entry = join(dir, "entry.ts");
const out = join(dir, "deskart.mjs");
writeFileSync(
  entry,
  [
    `export * from ${JSON.stringify(join(root, "src/game/refuel/deskArt.ts"))};`,
    `export * as B from ${JSON.stringify(join(root, "src/game/refuel/bwrBundle.ts"))};`,
    `export * as S from ${JSON.stringify(join(root, "src/game/refuel/saltLoop.ts"))};`,
  ].join("\n"),
);
const b = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], { encoding: "utf8", cwd: root });
if (b.status !== 0) throw new Error(b.stderr || b.stdout);
const A = await import(out);

/** A pen that checks every rectangle and counts pixels by colour. */
function pen() {
  const calls = [];
  const g = {
    fillStyle: "",
    fillRect(x, y, w, h) {
      calls.push({ x, y, w, h, c: g.fillStyle });
    },
  };
  return { g, calls };
}
function whole(calls) {
  for (const { x, y, w, h } of calls) {
    assert.ok([x, y, w, h].every(Number.isInteger), `whole pixels: ${[x, y, w, h]}`);
    assert.ok(x >= 0 && y >= 0 && x + w <= A.ART_W && y + h <= A.ART_H, `inside the picture: ${[x, y, w, h]}`);
  }
}
const row = () => A.channelRow(A.B.WATER_RODS, A.B.PART_LENGTH);

test("the channel shows the bundle's own row: water rods in the middle, part-length rods at the edges", () => {
  const r = row();
  assert.equal(r.kind.length, 10);
  assert.ok(r.kind.filter((k) => k === "water").length >= 2);
  assert.ok(r.kind.includes("part"));
  assert.ok(A.PART_TOP > 4 && A.PART_TOP < 67, "part-length rods stop partway up");
});

test("steam: no void, no bubbles; more void, more bubbles; bubbles only where the water has boiled", () => {
  const r = row();
  const none = new Array(12).fill(0);
  const some = [0, 0, 0.1, 0.2, 0.3, 0.35, 0.4, 0.42, 0.45, 0.47, 0.5, 0.5];
  const lots = [0, 0, 0.3, 0.45, 0.55, 0.62, 0.68, 0.72, 0.76, 0.8, 0.82, 0.85];
  let n0 = 0, n1 = 0, n2 = 0, low = 0;
  for (let t = 0; t < 6; t += 0.1) {
    n0 += A.channelBubbles(r, none, t).length;
    const bs = A.channelBubbles(r, lots, t);
    n2 += bs.length;
    n1 += A.channelBubbles(r, some, t).length;
    low += bs.filter((bb) => A.nodeAt(bb.y) < 2).length;
  }
  assert.equal(n0, 0);
  assert.ok(n2 > n1 && n1 > 0, `${n0} < ${n1} < ${n2}`);
  assert.equal(low, 0, "nothing in the bottom two nodes, where the void is zero");
});

test("pebbles: one in every N leaves for good, and a once-through bed sends every one", () => {
  for (const n of [1, 2, 6, 15]) {
    let out = 0;
    for (let k = 0; k < n * 10; k++) if (A.pebbleLeaves(k, n)) out += 1;
    assert.equal(out, 10, `${n} passes`);
  }
  const m = A.pebbleMove(1, A.PEBBLE_CYCLE * 0.7);
  assert.equal(m.light, "out");
  assert.ok(m.fresh, "a fresh one drops in when one leaves");
  const again = A.pebbleMove(6, A.PEBBLE_CYCLE * 0.7);
  assert.equal(again.light, "again");
  assert.equal(again.fresh, null);
  assert.equal(A.pebbleMove(6, A.PEBBLE_CYCLE * 0.1).light, "off", "not read until it reaches the meter");
  assert.equal(A.shadeFor(0, 10), A.PEBBLE_SHADES[0]);
  assert.equal(A.shadeFor(9, 10), A.PEBBLE_SHADES[4]);
});

test("salt: colour is temperature on the seven bands, the spray follows the stripping slider, the week plays through", () => {
  assert.equal(A.saltColour(600), A.TEMP_BANDS[0]);
  assert.equal(A.saltColour(650), "#e8d070");
  assert.equal(A.saltColour(700), A.TEMP_BANDS[6]);
  assert.ok(A.TEMP_BANDS.indexOf(A.saltColour(A.S.BAND.highC + 8)) > A.TEMP_BANDS.indexOf(A.saltColour(A.S.BAND.setC)));
  assert.deepEqual(A.sprayCounts(0, A.S.LIMITS.spargeMax), { drops: 0, gas: 0 });
  const half = A.sprayCounts(A.S.LIMITS.spargeMax / 2, A.S.LIMITS.spargeMax);
  const full = A.sprayCounts(A.S.LIMITS.spargeMax, A.S.LIMITS.spargeMax);
  assert.ok(full.drops > half.drops && half.drops > 0 && full.gas > half.gas);
  assert.deepEqual(A.weekSample(85, 0), { i: 0, day: 0 });
  assert.equal(A.weekSample(85, A.WEEK_SECONDS * 0.999).day, 6);
});

test("every painter, every frame: whole pixels, inside the picture", () => {
  const r = A.B.evaluate(A.B.uniformBundle("H"));
  const run = A.S.runWeek(A.S.START_PLAN, A.S.weekStart(2));
  for (let t = 0; t < 20; t += 0.37) {
    let p = pen();
    A.paintChannel(p.g, row(), r.voidFrac, t);
    whole(p.calls);
    for (const n of [1, 3, 15, 25]) {
      p = pen();
      A.paintPebbles(p.g, n, t);
      whole(p.calls);
    }
    p = pen();
    A.paintSaltBowl(p.g, { sparge: 0.6, spargeMax: A.S.LIMITS.spargeMax, tempC: run.tempC, lowC: A.S.BAND.lowC, highC: A.S.BAND.highC }, t);
    whole(p.calls);
    assert.ok(p.calls.length > 100);
  }
});
