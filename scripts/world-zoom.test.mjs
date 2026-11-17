import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(mkdtempSync(join(tmpdir(), "cc-zoom-")), "artScale.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/artScale.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const M = await import(out);

test("a wide cafe uses the smallest whole zoom that covers the view", () => {
  // 1100 / 320 = 3.44. Zoom 3 would leave 70px bars on each side, so the cover zoom is 4.
  assert.equal(M.worldZoom(1100, 720, 320, 256), 4);
  assert.ok(320 * 4 >= 1100 && 256 * 4 >= 720);
});

test("rooms of different widths get the same zoom at one view size, so people do not change size between rooms", () => {
  const cafe = M.worldZoom(1280, 720, 320, 256);
  const control = M.worldZoom(1280, 720, 352, 256);
  const parlor = M.worldZoom(1280, 720, 384, 256);
  assert.equal(cafe, 4);
  assert.equal(control, 4);
  assert.equal(parlor, 4);
});

test("the cover zoom stops at 5", () => {
  assert.equal(M.worldZoom(3840, 2160, 320, 256), 5);
});

test("a phone-width view is zoom 2, and the camera pans because the room is bigger than the view", () => {
  assert.equal(M.worldZoom(390, 844, 320, 256), 2);
  // At zoom 2 the 320×256 room is 640×512 device pixels: wider than the 390px phone view, so it must pan.
  assert.ok(320 * 2 > 390);
});

test("a phone at the PHONE_VIEW_W threshold is still zoom 2", () => {
  assert.equal(M.worldZoom(M.PHONE_VIEW_W - 1, 720, 160, 256), 2);
  // At exactly PHONE_VIEW_W the cover law applies again: 720 / 160 = 4.5, and the next whole zoom is 5.
  assert.equal(M.worldZoom(M.PHONE_VIEW_W, 720, 160, 256), 5);
});

test("the lot is walked at a zoom from the view height, not shown whole at zoom 1", () => {
  // 96 by 40 tiles. At zoom 1 a person there was 8 screen pixels wide on a 1280 view.
  assert.equal(M.worldZoom(1280, 720, 1536, 640), 3);
  assert.equal(M.worldZoom(1100, 720, 1536, 640), 3);
  assert.equal(M.worldZoom(1920, 1080, 1536, 640), 4);
  assert.ok(M.worldZoom(800, 480, 1536, 640) >= 2);
});
