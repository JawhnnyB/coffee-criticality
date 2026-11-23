// Pad edges are one press, not a hold. Directions come from the hat or the stick.
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-nav-"));
const out = join(dir, "nav.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/screenNav.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const nav = await import(out);

function pad(buttons, axes = [0, 0]) {
  return { axes, buttons };
}

test("a held face button edges once", () => {
  let mem = nav.emptyPad();
  const buttons = Array(16).fill(false);
  buttons[0] = true;
  const first = nav.stepPad(mem, pad(buttons));
  assert.equal(first.edge.confirm, true);
  mem = first.mem;
  const second = nav.stepPad(mem, pad(buttons));
  assert.equal(second.edge.confirm, false);
  assert.equal(second.confirmHeld, true);
});

test("the stick and the hat both count as a direction edge", () => {
  const down = nav.stepPad(nav.emptyPad(), pad(Array(16).fill(false), [0, 0.8]));
  assert.equal(down.edge.down, true);
  assert.equal(down.heldDir.down, true);
  const hat = Array(16).fill(false);
  hat[14] = true;
  const left = nav.stepPad(nav.emptyPad(), pad(hat));
  assert.equal(left.edge.left, true);
});

test("menus take arrows, a cabinet does not, night does", () => {
  assert.equal(nav.arrowNav("pause", false), true);
  assert.equal(nav.arrowNav("menu", false), true);
  assert.equal(nav.arrowNav("splash", false), true);
  assert.equal(nav.arrowNav("play", false), false);
  assert.equal(nav.arrowNav("play", true), true);
  assert.equal(nav.isKeyMode("golf"), true);
  assert.equal(nav.isKeyMode("plot"), false);
  assert.equal(nav.dirOf("KeyA"), "left");
});
