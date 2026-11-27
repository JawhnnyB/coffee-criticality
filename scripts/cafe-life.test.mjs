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
    for (const m of L.dustMotes(t)) {
      const x0 = 96 + ((m.y - 36) / 114) * 54;
      const x1 = 176 + ((m.y - 36) / 114) * 70;
      assert.ok(m.y >= 44 && m.y <= 141 && m.x >= x0 - 3 && m.x <= x1 + 3, `mote ${m.x},${m.y}`);
    }
  }
});

test("every live pixel lands whole, inside the room, still or moving", () => {
  for (const still of [false, true]) {
    for (let t = 0; t < 12; t += 0.53) {
      const p = pen();
      L.drawCafeBack(p.g, t, 412, still);
      L.drawCafeFront(p.g, t, still);
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
  for (const k of ["light", "shade"]) assert.ok(existsSync(join(root, "public", L.ROOM_LIGHT.cafe[k].split("?")[0])), k);
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
