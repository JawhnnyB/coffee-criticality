// Spec 4.3. The world listener is applyWorldKey. Cabinet loops call readHeld.
// This file does not define its own movement model and does not grep source.
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-key-gate-"));
const out = join(dir, "keyGate.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/keyGate.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const G = await import(out);

const GAME = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "Enter", "Escape", "KeyE"]);

function press(owner, mode, code) {
  G.setKeyOwner(owner);
  const keys = new Set();
  const edges = new Set();
  const event = {
    code,
    target: { tagName: "DIV" },
    prevented: false,
    preventDefault() {
      this.prevented = true;
    },
  };
  const took = G.applyWorldKey(event, mode, keys, edges, GAME);
  return { owner, mode, code, took, keyCount: keys.size };
}

test("a desktop app focused does not store a world movement key", () => {
  for (const owner of ["static", "none"]) {
    for (const code of ["KeyW", "KeyA", "KeyS", "KeyD", "Space", "Digit1"]) {
      const row = press(owner, "play", code);
      console.log(JSON.stringify({ check: "static-world", ...row }));
      assert.equal(row.took, false, `${owner} ${code}`);
      assert.equal(row.keyCount, 0);
    }
  }
  G.setKeyOwner("static");
  const held = new Set(["KeyD", "Space", "Digit1"]);
  const miniD = G.readHeld("mini", held, "KeyD");
  const worldD = G.readHeld("world", held, "KeyD");
  const miniDigit = G.readHeld("mini", held, "Digit1");
  console.log(JSON.stringify({ check: "static-held", owner: G.getKeyOwner(), miniD, worldD, miniDigit }));
  assert.equal(miniD, false);
  assert.equal(worldD, false);
  assert.equal(miniDigit, false);
});

test("a focused cabinet stores its own held key and the world listener does not", () => {
  G.setKeyOwner("mini");
  const held = new Set(["KeyD"]);
  const mini = G.readHeld("mini", held, "KeyD");
  const worldPress = press("mini", "play", "KeyD");
  console.log(JSON.stringify({ check: "mini-focus", mini, worldTook: worldPress.took, worldKeys: worldPress.keyCount }));
  assert.equal(mini, true);
  assert.equal(worldPress.took, false);
  assert.equal(worldPress.keyCount, 0);
});

test("an input inside a desktop app does not store the key", () => {
  G.setKeyOwner("world");
  const keys = new Set();
  const edges = new Set();
  const took = G.applyWorldKey({ code: "KeyD", target: { tagName: "INPUT" }, preventDefault() {} }, "play", keys, edges, GAME);
  console.log(JSON.stringify({ check: "input", took, keyCount: keys.size }));
  assert.equal(took, false);
  assert.equal(keys.size, 0);
});
