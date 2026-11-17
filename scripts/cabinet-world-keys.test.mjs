// A cabinet open with the desk closed must not store a movement key, and update must not walk.
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-cab-keys-"));

function bundle(name) {
  const out = join(dir, name + ".mjs");
  const built = spawnSync(
    process.env.ESBUILD ?? "npx",
    [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/" + name + ".ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
    { encoding: "utf8", cwd: root },
  );
  if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
  return import(out);
}

const G = await bundle("keyGate");
const Sim = await bundle("sim");
const GAME = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "Enter", "Escape"]);

function press(mode, code) {
  const keys = new Set();
  const edges = new Set();
  const event = {
    code,
    target: { tagName: "BODY" },
    prevented: false,
    preventDefault() {
      this.prevented = true;
    },
  };
  const took = G.applyWorldKey(event, mode, keys, edges, GAME);
  return { took, keyCount: keys.size, prevented: event.prevented };
}

test("a movement key is not stored while a cabinet is open and the desk is closed", () => {
  G.setKeyOwner("world");
  const row = press("delay", "KeyD");
  console.log(JSON.stringify({ check: "cabinet-keydown", mode: "delay", code: "KeyD", owner: G.getKeyOwner(), ...row }));
  assert.equal(row.took, false);
  assert.equal(row.keyCount, 0);
  const leave = press("delay", "Escape");
  console.log(JSON.stringify({ check: "cabinet-escape", mode: "delay", code: "Escape", ...leave }));
  assert.equal(leave.took, true);
});

test("the same key is stored while walking", () => {
  G.setKeyOwner("world");
  const row = press("play", "KeyD");
  console.log(JSON.stringify({ check: "walk-keydown", mode: "play", code: "KeyD", owner: G.getKeyOwner(), ...row }));
  assert.equal(row.took, true);
  assert.equal(row.keyCount, 1);
});

test("update does not change x while the mode is a cabinet", () => {
  const s = Sim.createState();
  s.mode = "delay";
  s.x = 80;
  s.y = 90;
  const a = Sim.emptyActions();
  a.moveX = 1;
  a.moveY = 1;
  Sim.update(s, a, 0.5);
  console.log(JSON.stringify({ check: "update-cabinet", mode: s.mode, x: s.x, y: s.y }));
  assert.equal(s.mode, "delay");
  assert.equal(s.x, 80);
  assert.equal(s.y, 90);
});
