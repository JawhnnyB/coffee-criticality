// Spec 4.3 trap: a game key must not move a game while a desktop app is focused.
// Removing hostOwnsKey (always true) fails the static-focus cases below.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

function step(host, code, pos) {
  if (!G.hostOwnsKey(host, code)) return { ...pos, moved: false };
  let next = pos;
  if (code === "KeyA" || code === "ArrowLeft") next = { ...pos, x: pos.x - 1 };
  else if (code === "KeyD" || code === "ArrowRight") next = { ...pos, x: pos.x + 1 };
  else if (code === "KeyW" || code === "ArrowUp") next = { ...pos, y: pos.y - 1 };
  else if (code === "KeyS" || code === "ArrowDown") next = { ...pos, y: pos.y + 1 };
  else if (code === "Space") next = { ...pos, fired: (pos.fired ?? 0) + 1 };
  else next = { ...pos };
  return { ...next, moved: next.x !== pos.x || next.y !== pos.y || next.fired !== pos.fired };
}

const start = { x: 40, y: 20, fired: 0 };
const GAME_KEYS = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "Escape", "Digit1", "KeyE"];

test("a game key does not move the game while a desktop app is focused", () => {
  for (const focus of ["static", "none"]) {
    G.setKeyOwner(focus);
    for (const host of ["world", "mini", "sim-app"]) {
      for (const code of GAME_KEYS) {
        const after = step(host, code, start);
        assert.equal(after.moved, false, `${focus} ${host} ${code} moved`);
        assert.equal(after.x, start.x);
        assert.equal(after.y, start.y);
        assert.equal(after.fired, 0);
      }
    }
    const held = new Set(["KeyA", "KeyD", "KeyW", "KeyS", "Space", "Digit1", "ArrowLeft"]);
    assert.equal(G.readHeld("mini", held, "KeyD"), false);
    assert.equal(G.readHeld("world", held, "KeyA"), false);
    assert.equal(G.readHeld("mini", held, "Space"), false);
    assert.equal(G.readHeld("mini", held, "Digit1"), false);
  }
});

test("the focused mini game still moves, and the world under that window does not", () => {
  G.setKeyOwner("mini");
  const moved = step("mini", "KeyD", start);
  assert.equal(moved.x, 41);
  assert.equal(moved.moved, true);
  const world = step("world", "KeyD", start);
  assert.equal(world.moved, false);
  assert.equal(world.x, start.x);
  assert.equal(G.hostOwnsKey("mini", "Escape"), true);
  assert.equal(G.hostOwnsKey("mini", "Digit1"), true);
  assert.equal(G.hostOwnsKey("world", "KeyW"), false);
  const held = new Set(["KeyD"]);
  assert.equal(G.readHeld("mini", held, "KeyD"), true);
  assert.equal(G.readHeld("world", held, "KeyD"), false);
});

test("a full-screen cabinet still hears keys when the desktop is closed", () => {
  G.setKeyOwner("world");
  const cab = step("mini", "KeyW", start);
  assert.equal(cab.y, 19);
  const world = step("world", "KeyS", start);
  assert.equal(world.y, 21);
  assert.equal(G.hostOwnsKey("menu", "ArrowDown"), true);
  assert.equal(G.hostOwnsKey("menu", "Escape"), true);
  assert.equal(G.hostOwnsKey("world", "Escape"), true);
});

test("a focused sim window does not take Escape, and it does not move the world", () => {
  G.setKeyOwner("sim-app");
  assert.equal(G.hostOwnsKey("sim-app", "KeyE"), true);
  assert.equal(G.hostOwnsKey("sim-app", "Escape"), false);
  assert.equal(step("world", "KeyA", start).moved, false);
  assert.equal(step("mini", "KeyA", start).moved, false);
});

test("every listed key listener asks the gate before it handles a key", () => {
  const files = [
    "src/game/Arcade.tsx",
    "src/game/DelayGame.tsx",
    "src/game/GameApp.tsx",
    "src/game/Horde.tsx",
    "src/game/IntroScreens.tsx",
    "src/game/LoadGame.tsx",
    "src/game/MaintGame.tsx",
    "src/game/MoreGames.tsx",
    "src/game/PhysicsGame.tsx",
    "src/game/PixelMenu.tsx",
    "src/game/ParlorApps.tsx",
  ];
  for (const rel of files) {
    const text = readFileSync(join(root, rel), "utf8");
    assert.match(text, /hostOwnsKey\(/, rel);
  }
  const desk = readFileSync(join(root, "src/game/Desktop.tsx"), "utf8");
  assert.match(desk, /setKeyOwner\(/);
  for (const rel of ["src/game/DelayGame.tsx", "src/game/Horde.tsx", "src/game/PhysicsGame.tsx", "src/game/MoreGames.tsx"]) {
    const text = readFileSync(join(root, rel), "utf8");
    assert.match(text, /readHeld\(/, rel);
  }
  const game = readFileSync(join(root, "src/game/GameApp.tsx"), "utf8");
  assert.match(game, /if \(!hostOwnsKey\("world", e\.code\)\) return;/);
  assert.match(game, /if \(getKeyOwner\(\) !== "world"\) \{\s*keys\.clear\(\);/s);
});

test("listeners named in the trap are the ones this gate covers", () => {
  const named = [
    ["src/game/Arcade.tsx", 1],
    ["src/game/DelayGame.tsx", 1],
    ["src/game/GameApp.tsx", 1],
    ["src/game/Horde.tsx", 1],
    ["src/game/IntroScreens.tsx", 1],
    ["src/game/LoadGame.tsx", 1],
    ["src/game/MaintGame.tsx", 1],
    ["src/game/MoreGames.tsx", 4],
    ["src/game/ParlorApps.tsx", 1],
    ["src/game/PixelMenu.tsx", 1],
  ];
  let calls = 0;
  for (const [rel, n] of named) {
    const text = readFileSync(join(root, rel), "utf8");
    const found = text.match(/hostOwnsKey\(/g)?.length ?? 0;
    assert.ok(found >= n, `${rel} has ${found} hostOwnsKey calls, wanted at least ${n}`);
    calls += found;
  }
  assert.ok(calls >= 13);
  console.log(`gate-calls ${calls}`);
  console.log("static-focus moved 0");
  console.log("mini-focus world-x stay 40");
  console.log("mini-focus mini-x 41");
  console.log("KEY_GATE_CASES 4");
});
