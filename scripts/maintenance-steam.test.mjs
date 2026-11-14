import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-steam-"));
const out = join(dir, "steamRule.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/steamRule.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const { maintenanceSteamOn } = await import(out);

test("day 1 steam stays until the valve is caught, and later days draw none", () => {
  assert.equal(maintenanceSteamOn(1, "open"), true);
  assert.equal(maintenanceSteamOn(1, "hid"), true);
  assert.equal(maintenanceSteamOn(1, "caught"), false);
  assert.equal(maintenanceSteamOn(2, "open"), false);
  assert.equal(maintenanceSteamOn(2, "hid"), false);
  assert.equal(maintenanceSteamOn(2, "caught"), false);
});
