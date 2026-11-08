// Desktop window math and key routing. The rules come from the Parlor OS spec, section 4.3.
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-desk-win-"));
const out = join(dir, "deskWindows.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/deskWindows.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const W = await import(out);

const screen = { w: 800, h: 600 };
const win = (id, extra = {}) => ({
  id,
  appId: id,
  title: id,
  x: 0,
  y: 0,
  w: 300,
  h: 200,
  z: 0,
  minimized: false,
  sim: false,
  game: false,
  ...extra,
});

test("a window is clamped so it stays on the screen above the taskbar", () => {
  const far = W.clampWin(win("a", { x: 790, y: 590 }), screen);
  assert.equal(far.x, screen.w - far.w);
  assert.equal(far.y, screen.h - W.TASKBAR_H - W.TITLE_H);
  const neg = W.clampWin(win("a", { x: -50, y: -50 }), screen);
  assert.equal(neg.x, 0);
  assert.equal(neg.y, 0);
});

test("dragging cannot take a window off any edge", () => {
  let w = win("a", { x: 100, y: 100 });
  for (let i = 0; i < 20; i++) w = W.dragWin(w, 500, 500, screen);
  assert.equal(w.x, screen.w - w.w);
  assert.equal(w.y, screen.h - W.TASKBAR_H - W.TITLE_H);
  for (let i = 0; i < 20; i++) w = W.dragWin(w, -500, -500, screen);
  assert.equal(w.x, 0);
  assert.equal(w.y, 0);
});

test("a window never goes below the minimum size, and never wider than a small screen", () => {
  const tiny = W.clampWin(win("a", { w: 10, h: 10 }), screen);
  assert.equal(tiny.w, W.MIN_W);
  assert.equal(tiny.h, W.MIN_H);
  const narrow = W.clampWin(win("a", { w: 900 }), { w: 200, h: 400 });
  assert.ok(narrow.w <= 200, "wider than the screen is clipped to the screen");
});

test("focus raises a window to the top and restores it from the taskbar", () => {
  let list = [win("a", { z: 1 }), win("b", { z: 2 })];
  assert.equal(W.focusedWin(list).id, "b");
  list = W.focusWin(list, "a");
  assert.equal(W.focusedWin(list).id, "a");
  list = W.minimizeWin(list, "a");
  assert.equal(W.focusedWin(list).id, "b", "a minimized window does not have focus");
  list = W.focusWin(list, "a");
  assert.equal(list.find((w) => w.id === "a").minimized, false, "focus from the taskbar restores it");
  assert.equal(W.focusedWin(list).id, "a");
});

test("opening a window that is already open focuses it instead of adding a second one", () => {
  let list = W.openWin([], win("a"), screen);
  list = W.openWin(list, win("b"), screen);
  list = W.openWin(list, win("a"), screen);
  assert.equal(list.length, 2);
  assert.equal(W.focusedWin(list).id, "a");
});

test("close removes the window", () => {
  const list = W.closeWin([win("a"), win("b")], "a");
  assert.deepEqual(list.map((w) => w.id), ["b"]);
});

test("a focused mini game gets game keys, and Escape closes nothing (the game handles it)", () => {
  assert.equal(W.keyRoute("mini", "KeyW"), "game");
  assert.equal(W.keyRoute("mini", "Space"), "game");
  assert.equal(W.keyRoute("mini", "Escape"), "game");
});

test("a focused sim app (Reactor Control, Academy) gets game keys, and Escape goes to the desktop", () => {
  assert.equal(W.keyRoute("sim-app", "KeyE"), "game");
  assert.equal(W.keyRoute("sim-app", "Escape"), "desktop");
});

test("with the desktop focused, game keys are blocked, and Escape belongs to the desktop", () => {
  assert.equal(W.keyRoute("none", "KeyW"), "block");
  assert.equal(W.keyRoute("none", "ArrowLeft"), "block");
  assert.equal(W.keyRoute("static", "KeyD"), "block");
  assert.equal(W.keyRoute("static", "Space"), "block");
  assert.equal(W.keyRoute("none", "Escape"), "desktop");
  assert.equal(W.keyRoute("static", "Escape"), "desktop");
});

test("keys that are not game keys always reach the desktop shell", () => {
  assert.equal(W.keyRoute("none", "KeyZ"), "desktop");
  assert.equal(W.keyRoute("mini", "KeyZ"), "desktop");
});

test("the focus kind follows the focused window", () => {
  assert.equal(W.focusKindOf(null), "none");
  assert.equal(W.focusKindOf(win("a")), "static");
  assert.equal(W.focusKindOf(win("a", { sim: true })), "sim-app");
  assert.equal(W.focusKindOf(win("a", { sim: true, game: true })), "mini");
});

test("a new window cascades and always opens on the screen", () => {
  let list = [];
  for (let i = 0; i < 20; i++) {
    const at = W.cascadeAt(list, screen, 470, 340);
    assert.ok(at.x >= 0 && at.x + 470 <= screen.w || screen.w < 470, `x in view at ${i}`);
    assert.ok(at.y >= 0 && at.y + 340 <= screen.h - W.TASKBAR_H || screen.h < 340, `y in view at ${i}`);
    list = [...list, win(`w${i}`)];
  }
});
