#!/usr/bin/env node
// The player's walker (public/art/gen/sprites/player_walk4.png, from tools/artkit/chibi.py) and the picker tint
// (src/game/pixel.ts recolorA6): the glasses read and come off cleanly, the hair takes the portrait's ramp and stays
// clear of the ink line, and the satchel survives every tint.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { inflateSync } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-player-"));
const entry = join(dir, "entry.ts");
const out = join(dir, "player.mjs");
writeFileSync(
  entry,
  [
    `export { recolorA6 } from ${JSON.stringify(join(root, "src/game/pixel.ts"))};`,
    `export { HAIR_RAMP, HAIR_HEX, HOODIE_HEX, WALK_W, WALK_H } from ${JSON.stringify(join(root, "src/game/artSpec.ts"))};`,
  ].join("\n"),
);
const b = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`, "--loader:.png=empty", "--external:@tauri-apps/*"], { encoding: "utf8", cwd: root });
if (b.status !== 0) throw new Error(b.stderr || b.stdout);
const L = await import(out);

/** 8-bit RGBA, non-interlaced: what PIL writes. */
function readPng(path) {
  const buf = readFileSync(path);
  let p = 8;
  let w = 0;
  let h = 0;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString("latin1", p + 4, p + 8);
    const body = buf.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") {
      w = body.readUInt32BE(0);
      h = body.readUInt32BE(4);
      assert.deepEqual([body[8], body[9], body[12]], [8, 6, 0], "8-bit RGBA, not interlaced");
    } else if (type === "IDAT") idat.push(body);
    p += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * 4;
  const px = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x];
      const a = x >= 4 ? px[y * stride + x - 4] : 0;
      const up = y > 0 ? px[(y - 1) * stride + x] : 0;
      const c = x >= 4 && y > 0 ? px[(y - 1) * stride + x - 4] : 0;
      let pred = 0;
      if (f === 1) pred = a;
      else if (f === 2) pred = up;
      else if (f === 3) pred = (a + up) >> 1;
      else if (f === 4) {
        const q = a + up - c;
        const pa = Math.abs(q - a);
        const pb = Math.abs(q - up);
        const pc = Math.abs(q - c);
        pred = pa <= pb && pa <= pc ? a : pb <= pc ? up : c;
      }
      px[y * stride + x] = (v + pred) & 255;
    }
  }
  return { w, h, px };
}

const sheet = readPng(join(root, "public/art/gen/sprites/player_walk4.png"));
const hex = (d, i) => "#" + [d[i], d[i + 1], d[i + 2]].map((v) => v.toString(16).padStart(2, "0")).join("");
const rgb = (h) => [1, 3, 5].map((k) => Number.parseInt(h.slice(k, k + 2), 16));
const dist = (a, c) => a.reduce((s, v, k) => s + Math.abs(v - c[k]), 0);

/** Opaque colours per row of the sheet: 0 front, 1 side, 2 back. */
function counts(d, row) {
  const m = new Map();
  for (let y = row * L.WALK_H; y < (row + 1) * L.WALK_H; y++) {
    for (let x = 0; x < sheet.w; x++) {
      const i = (y * sheet.w + x) * 4;
      if (d[i + 3] < 8) continue;
      const k = hex(d, i);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
  }
  return m;
}
const tinted = (look) => {
  const d = Uint8Array.from(sheet.px);
  L.recolorA6(d, look);
  return d;
};

const FRAME = "#3a2a2c";
const LENS = "#fbe6d2";
const OUTLINE = "#3b2318";
const EYE = "#2a1810";
const SKIN = "#f5c9a0";
const BAG = "#8a5a38";

test("sheet is the 4×3 chibi walker", () => {
  assert.deepEqual([sheet.w, sheet.h], [4 * L.WALK_W, 3 * L.WALK_H]);
});

test("glasses are real frames with lenses, front and side, and none from behind", () => {
  const [front, side, back] = [0, 1, 2].map((r) => counts(sheet.px, r));
  // Two boxes per front frame: 4 frames × (2 × 18 frame px + bridge) at least.
  assert.ok((front.get(FRAME) ?? 0) >= 4 * 36, `front frame px ${front.get(FRAME)}`);
  assert.ok((front.get(LENS) ?? 0) >= 4 * 2 * 4, `front lens px ${front.get(LENS)}`);
  assert.ok((side.get(FRAME) ?? 0) > 0 && (side.get(LENS) ?? 0) > 0);
  assert.equal(back.get(FRAME) ?? 0, 0);
  assert.equal(back.get(LENS) ?? 0, 0);
});

test("glasses off: frame and lens go to skin; eyes and the ink line are untouched", () => {
  const on = tinted({ hoodie: "copper", hair: "brown", glasses: true });
  const off = tinted({ hoodie: "copper", hair: "brown", glasses: false });
  for (const r of [0, 1, 2]) {
    const a = counts(on, r);
    const z = counts(off, r);
    assert.equal(z.get(FRAME) ?? 0, 0);
    assert.equal(z.get(LENS) ?? 0, 0);
    assert.equal(z.get(EYE) ?? 0, a.get(EYE) ?? 0, `eyes kept, row ${r}`);
    assert.equal(z.get(OUTLINE) ?? 0, a.get(OUTLINE) ?? 0, `silhouette kept, row ${r}`);
    assert.equal((z.get(SKIN) ?? 0) - (a.get(SKIN) ?? 0), (a.get(FRAME) ?? 0) + (a.get(LENS) ?? 0));
  }
});

test("hair takes the portrait's ramp and never sinks into the ink line", () => {
  for (const id of Object.keys(L.HAIR_RAMP)) {
    assert.equal(L.HAIR_HEX[id], L.HAIR_RAMP[id][0], `${id}: swatch is the ramp base`);
    const d = tinted({ hoodie: "copper", hair: id, glasses: true });
    const front = counts(d, 0);
    assert.ok((front.get(L.HAIR_RAMP[id][0]) ?? 0) > 40, `${id}: base hair on the head`);
  }
  // The default brown was #4a3424, a step off the outline; the ramp keeps the whole head clear of it.
  for (const tone of L.HAIR_RAMP.brown) assert.ok(dist(rgb(tone), rgb(OUTLINE)) >= 40, `${tone} vs outline`);
  const d = tinted({ hoodie: "copper", hair: "brown", glasses: true });
  for (const r of [0, 1, 2]) assert.equal(counts(d, r).get("#4a3424") ?? 0, 0);
});

test("the satchel shows from every side and no tint touches it", () => {
  const raw = [0, 1, 2].map((r) => counts(sheet.px, r).get(BAG) ?? 0);
  for (const n of raw) assert.ok(n >= 4 * 10, `bag px per row ${raw}`);
  for (const hoodie of Object.keys(L.HOODIE_HEX)) {
    for (const hair of Object.keys(L.HAIR_RAMP)) {
      const d = tinted({ hoodie, hair, glasses: false });
      assert.deepEqual([0, 1, 2].map((r) => counts(d, r).get(BAG) ?? 0), raw, `${hoodie}/${hair}`);
    }
  }
});
