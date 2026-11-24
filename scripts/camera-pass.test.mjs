import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(mkdtempSync(join(tmpdir(), "cc-pass-")), "pass.mjs");
const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/nightwatch/cameraPass.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], {
  encoding: "utf8",
  cwd: root,
});
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
const M = await import(out);

test("photo mode turns the camera pass off and the painter asks", () => {
  assert.deepEqual(M.cameraPass({}), { breathe: true, grain: true, bar: true, vignette: true });
  assert.deepEqual(M.cameraPass({ photo: true }), { breathe: false, grain: false, bar: false, vignette: false });
  const src = readFileSync(join(root, "src/game/nightwatch/cameras.ts"), "utf8");
  assert.ok(src.includes("cameraPass(opts)"));
  for (const key of ["pass.breathe", "pass.grain", "pass.bar", "pass.vignette"]) assert.ok(src.includes(key), key);
  const ui = readFileSync(join(root, "src/game/NightWatch.tsx"), "utf8");
  assert.ok(ui.includes('testId="nw-photo"'));
  assert.ok(ui.includes("photo: photo.current"));
});
