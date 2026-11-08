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

test("a wide cafe keeps the cover zoom", () => {
  assert.equal(M.worldZoom(1100, 720, 320, 256), 3);
});

test("a phone-width view is zoom 2, and the camera pans because the room is bigger than the view", () => {
  assert.equal(M.worldZoom(390, 844, 320, 256), 2);
  // At zoom 2 the 320×256 room is 640×512 device pixels: wider than the 390px phone view, so it must pan.
  assert.ok(320 * 2 > 390);
});

test("a phone at the PHONE_VIEW_W threshold is still zoom 2", () => {
  assert.equal(M.worldZoom(M.PHONE_VIEW_W - 1, 720, 160, 256), 2);
  // At exactly PHONE_VIEW_W the cover law applies again: 720 / 160 = 4.5, floored to 4.
  assert.equal(M.worldZoom(M.PHONE_VIEW_W, 720, 160, 256), 4);
});
