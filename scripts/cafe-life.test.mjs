#!/usr/bin/env node
// The café's live layer (src/game/cafeLife.ts) and its collision (content.ts): the clock tells the shift's time, the
// bulbs hang on the painted wire, steam and dust stay where they belong, every pixel lands whole, and the new
// furniture blocks without boxing anyone in.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-cafe-"));
const entry = join(dir, "entry.ts");
const out = join(dir, "cafe.mjs");
writeFileSync(
  entry,
  [
    `export * from ${JSON.stringify(join(root, "src/game/cafeLife.ts"))};`,
    `export * as D from ${JSON.stringify(join(root, "src/game/daylight.ts"))};`,
    `export { ROOMS, CAFE_SPAWN } from ${JSON.stringify(join(root, "src/game/content.ts"))};`,
    `export { ROOM_ATLAS } from ${JSON.stringify(join(root, "src/game/roomAtlas.ts"))};`,
  ].join("\n"),
);
const b = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`, "--loader:.png=empty", "--external:@tauri-apps/*"], { encoding: "utf8", cwd: root });
if (b.status !== 0) throw new Error(b.stderr || b.stdout);
const L = await import(out);

function pen() {
  const calls = [];
  const g = { fillStyle: "", globalAlpha: 1, fillRect(x, y, w, h) { calls.push([x, y, w, h]); } };
  return { g, calls };
}

test("the clock tells the shift's time", () => {
  assert.deepEqual(L.clockHands(6 * 60), [[63, 19], [63, 11]], "six o'clock: hour hand down, minute hand up");
  assert.deepEqual(L.clockHands(9 * 60)[0], [60, 16], "nine: the hour hand points left");
  assert.deepEqual(L.clockHands(12 * 60 + 15)[1], [68, 16], "a quarter past: the minute hand points right");
});

test("bulbs hang on the painted wire, inside the room", () => {
  for (const x of L.BULB_X) {
    assert.ok(x >= 2 && x <= 316, `${x}`);
    const y = L.wireY(x);
    assert.ok(y >= 3 && y <= 6, `${x}: ${y}`);
  }
});

test("steam rises from its cup and fades; dust stays in the window light", () => {
  for (let t = 0; t < 10; t += 0.4) {
    const puffs = L.steamPuffs(t);
    assert.equal(puffs.length, L.STEAM.reduce((n, s) => n + s.n, 0));
    for (const p of puffs) {
      const src = L.STEAM.find((s) => Math.abs(s.x - p.x) <= 2 && p.y <= s.y && p.y >= s.y - 12);
      assert.ok(src, `puff at ${p.x},${p.y} belongs to a cup`);
      assert.ok(p.a > 0 && p.a <= 0.6);
    }
    for (const m of L.dustMotes(t)) assert.ok(m.y >= 38 && m.y <= 80 && m.x >= 101 && m.x <= 171, `mote ${m.x},${m.y}, just inside the window`);
  }
});

test("every live pixel lands whole, inside the room, still or moving", () => {
  for (const still of [false, true]) {
    for (let t = 0; t < 12; t += 0.53) {
      const p = pen();
      for (const minutes of [412, 720, 1000, 1290]) {
        L.drawCafeBack(p.g, t, minutes, still);
        L.drawCafeFront(p.g, t, still, minutes);
        L.drawCafeLights(p.g, t, minutes, still);
      }
      for (const [x, y, w, h] of p.calls) {
        assert.ok([x, y, w, h].every(Number.isInteger), `${[x, y, w, h]}`);
        assert.ok(x >= 0 && y >= 0 && x + w <= 320 && y + h <= 256, `${[x, y, w, h]}`);
      }
    }
  }
  const a = pen();
  const c = pen();
  L.drawCafeBack(a.g, 1.3, 412, true);
  L.drawCafeBack(c.g, 7.9, 412, true);
  assert.deepEqual(a.calls, c.calls, "reduced motion: the same frame at any time");
});

test("the painted room: light and shade exist, the atlas is the painted one, and you can still get everywhere", () => {
  for (const k of ["lamps", "window", "shade"]) assert.ok(existsSync(join(root, "public", L.ROOM_LIGHT.cafe[k].split("?")[0])), k);
  assert.match(L.ROOM_ATLAS.cafe.src, /candy\.png/);
  const kinds = L.ROOM_ATLAS.cafe.stamps.map((s) => s.kind);
  for (const k of ["counter", "chair-back", "chair", "table", "pendant"]) assert.ok(kinds.includes(k), k);
  const pend = L.ROOM_ATLAS.cafe.stamps.filter((s) => s.kind === "pendant");
  assert.ok(pend.every((s) => s.foot > 256), "pendants draw over everyone");
  // Flood the walkable floor from the spawn on a 2px grid; every interact and door must be reachable.
  const room = L.ROOMS.cafe;
  const blocks = room.props.filter((p) => p.block !== false).map((p) => p.rect);
  const R = 5; // a person's half-width at the feet
  const free = (x, y) => x >= R && x <= room.w - R && y >= 50 && y <= room.h - 2 && !blocks.some((r) => x > r.x - R && x < r.x + r.w + R && y > r.y - 2 && y < r.y + r.h + 2);
  const seen = new Set();
  const q = [[Math.round(L.CAFE_SPAWN.x / 2) * 2, Math.round(L.CAFE_SPAWN.y / 2) * 2]];
  while (q.length) {
    const [x, y] = q.pop();
    const k = `${x},${y}`;
    if (seen.has(k) || !free(x, y)) continue;
    seen.add(k);
    q.push([x + 2, y], [x - 2, y], [x, y + 2], [x, y - 2]);
  }
  const near = (r) => [...seen].some((k) => {
    const [x, y] = k.split(",").map(Number);
    return x >= r.x - 10 && x <= r.x + r.w + 10 && y >= r.y - 10 && y <= r.y + r.h + 12;
  });
  for (const it of room.interacts) assert.ok(near(it.rect), `can reach ${it.id}`);
  for (const d of room.doors) assert.ok(near(d.rect), `can reach the door to ${d.to}`);
  const png = readFileSync(join(root, "public/art/rooms/cafe/candy.png"));
  assert.deepEqual([png.readUInt32BE(16) >= 320, png.readUInt32BE(20)], [true, 256]);
});

const rgb = (h) => [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16));

test("daylight: gentle by day, warm at sunrise and sunset, blue night with the lamps up", () => {
  const D = L.D;
  const noon = D.daylightAt(720);
  const night = D.daylightAt(22 * 60);
  const sunset = D.daylightAt(1000);
  const sunrise = D.daylightAt(425);
  assert.equal(noon.key, "midday");
  assert.equal(noon.ambient, "#ffffff", "midday doesn't dim the room");
  assert.equal(night.key, "night");
  assert.ok(night.lamps > sunset.lamps && sunset.lamps > noon.lamps, "the lamps come up as it gets dark");
  const [nr, , nb] = rgb(night.outside);
  assert.ok(nb > nr, "moonlight through the window is cool");
  for (const d of [sunrise, sunset]) {
    const [r, , b] = rgb(d.outside);
    assert.ok(r - b > 60, `${d.key}: the window light is warm`);
    assert.ok(d.outsideStrength > noon.outsideStrength, `${d.key}: and stronger than at noon`);
  }
  assert.ok(noon.outsideStrength <= 0.6, "by day the window light stays gentle");
  assert.ok(rgb(night.ambient).every((v, i) => v < rgb(noon.ambient)[i]), "night dims the room");
  assert.deepEqual(D.daylightAt(722), D.daylightAt(720), "five-minute steps");
  assert.deepEqual(D.daylightAt(-60), D.daylightAt(23 * 60), "the day wraps");
});

test("the sun rises on the left as the shift starts and sets on the right as it ends; the moon at night", () => {
  const D = L.D;
  assert.equal(D.sunAt(300), null);
  assert.equal(D.sunAt(1300), null);
  const rise = D.sunAt(410);
  const noon = D.sunAt(Math.round((D.SUNRISE + D.SUNSET) / 2));
  const set = D.sunAt(1000);
  assert.ok(rise.x < 0.1 && rise.h < 0.2, "low on the left at 06:50");
  assert.ok(set.x > 0.9 && set.h < 0.2, "low on the right at 16:40");
  assert.ok(noon.h > 0.99);
  assert.ok(D.SUNRISE <= 400 + 15 && D.SUNSET >= 1008, "both ends fall inside a shift (06:40 to 16:48)");
  assert.equal(D.moonAt(720), null);
  assert.ok(D.moonAt(22 * 60) && D.moonAt(2 * 60));
  assert.equal(D.daylightAt(415).key === "dawn" || D.daylightAt(415).key === "sunrise", true);
  assert.equal(D.daylightAt(1000).key, "sunset");
});

test("the sky preview holds the sky without touching the clock, and lets go", () => {
  const D = L.D;
  assert.equal(D.skyMinutes(500), 500);
  D.setSkyOverride(1290);
  assert.equal(D.skyMinutes(500), 1290);
  D.setSkyOverride(null);
  assert.equal(D.skyMinutes(500), 500);
});
