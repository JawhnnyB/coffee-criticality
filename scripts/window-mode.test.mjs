// Window size is remembered beside the week save. Fullscreen does not replace it.
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-win-"));
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
};
globalThis.window = {};

const out = join(dir, "win.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [
    ...(process.env.ESBUILD ? [] : ["esbuild"]),
    join(root, "src/game/windowMode.ts"),
    "--bundle",
    "--platform=node",
    "--format=esm",
    "--external:@tauri-apps/api/window",
    `--outfile=${out}`,
  ],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const win = await import(out);

test("a windowed size is kept and fullscreen does not replace it", async () => {
  assert.equal(win.isDesktop(), false);
  assert.deepEqual(win.readWindow(), { mode: "windowed", width: 1280, height: 720 });
  const saved = await win.applyWindow({ mode: "windowed", width: 1600, height: 900 });
  assert.deepEqual(saved, { mode: "windowed", width: 1600, height: 900 });
  assert.equal(store.has("cc.save.v2"), false);
  const held = win.rememberResize(win.readWindow(), 1920, 1080);
  assert.deepEqual(held, { mode: "windowed", width: 1920, height: 1080 });
  const full = await win.applyWindow({ ...win.readWindow(), mode: "fullscreen" });
  assert.equal(full.mode, "fullscreen");
  assert.equal(full.width, 1920);
  const still = win.rememberResize(win.readWindow(), 800, 600);
  assert.deepEqual(still, { mode: "fullscreen", width: 1920, height: 1080 });
  const border = await win.applyWindow({ mode: "borderless", width: 1920, height: 1080 });
  assert.equal(border.mode, "borderless");
  assert.equal(JSON.parse(store.get("cc.window")).mode, "borderless");
});
