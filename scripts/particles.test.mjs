// The season particle layer: capped, empty under reduced motion, and deterministic under a seeded generator (spec 4.5).
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-particles-"));
const out = join(dir, "particles.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/particles.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const Pt = await import(out);

function seeded(seed) {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    return x / 4294967296;
  };
}

test("reduced motion gets no particles at all", () => {
  assert.equal(Pt.particleCount(1920, 1080, true), 0);
  assert.equal(Pt.makePool("snow", 1920, 1080, true, seeded(1)).length, 0);
});

test("the pool never holds more than 160 particles, however big the view", () => {
  assert.equal(Pt.MAX_PARTICLES, 160);
  assert.equal(Pt.particleCount(10000, 10000, false), 160);
  assert.ok(Pt.makePool("rain", 4000, 3000, false, seeded(2)).length <= 160);
});

test("an empty view has no particles", () => {
  assert.equal(Pt.particleCount(0, 0, false), 0);
});

test("the same seed makes the same pool, so the layer is testable", () => {
  const a = Pt.makePool("leaves", 640, 360, false, seeded(7));
  const b = Pt.makePool("leaves", 640, 360, false, seeded(7));
  assert.deepEqual(a, b);
  assert.equal(a.length, Pt.particleCount(640, 360, false));
});

test("stepping keeps the pool size and keeps particles near the view", () => {
  const w = 640;
  const h = 360;
  const random = seeded(3);
  for (const kind of ["rain", "heat", "leaves", "snow"]) {
    const pool = Pt.makePool(kind, w, h, false, random);
    const n = pool.length;
    for (let i = 0; i < 300; i++) Pt.stepPool(pool, kind, w, h, 1 / 30, random);
    assert.equal(pool.length, n, `${kind} keeps its size`);
    for (const p of pool) {
      assert.ok(p.x >= -16 && p.x <= w + 16, `${kind} x stays near the view`);
      assert.ok(p.y <= h + 24, `${kind} y stays near the view`);
    }
  }
});

test("particles are palette colours and pixel squares", () => {
  const pool = Pt.makePool("heat", 640, 360, false, seeded(4));
  for (const p of pool) {
    assert.match(p.color, /^#[0-9a-fA-F]{6}$/);
    assert.ok([1, 2, 3].includes(p.s), "a pixel-sized square");
  }
});
