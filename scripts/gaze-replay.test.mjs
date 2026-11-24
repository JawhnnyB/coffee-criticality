import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-gaze-"));
const entry = join(dir, "entry.ts");
writeFileSync(entry, `export { gazeReplay } from ${JSON.stringify(join(root, "src/game/nightwatch/gazeReplay.ts"))};\nexport { SECONDS_PER_MINUTE } from ${JSON.stringify(join(root, "src/game/nightwatch/model.ts"))};\n`);
const out = join(dir, "gaze.mjs");
const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], {
  encoding: "utf8",
  cwd: root,
});
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
const M = await import(out);

test("the turnover replay is the gaze log at 10×, and an empty log stays empty", () => {
  assert.deepEqual(M.gazeReplay([]), []);
  const frames = M.gazeReplay([{ camera: "yard", from: 10, to: 20 }, { camera: "intake", from: 20, to: 22 }]);
  assert.equal(frames[0].camera, "yard");
  assert.equal(frames[0].from, 10);
  assert.equal(frames[0].holdMs, (10 * M.SECONDS_PER_MINUTE * 1000) / 10);
  assert.equal(frames[1].holdMs, (2 * M.SECONDS_PER_MINUTE * 1000) / 10);
  assert.equal(M.gazeReplay([{ camera: "aux", from: 5, to: 5 }])[0].holdMs, 0);
  const ui = readFileSync(join(root, "src/game/NightWatch.tsx"), "utf8");
  assert.ok(ui.includes('data-testid="nw-replay"'));
  assert.ok(ui.includes("gazeReplay(n.gaze)"));
  assert.equal("Replay at 10×".includes("!"), false);
});
