import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(mkdtempSync(join(tmpdir(), "cc-host-")), "host.mjs");
const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/hostTrust.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], {
  encoding: "utf8",
  cwd: root,
});
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
const H = await import(out);

test("a good bowl or golf pays its host once per day, and a replay does not", () => {
  const flags = {};
  assert.deepEqual(H.hostDayTrust(flags, "bowl", 1, 4), { npc: "jordan", trust: 2 });
  assert.equal(H.hostDayTrust(flags, "bowl", 1, 9), null);
  assert.deepEqual(H.hostDayTrust(flags, "golf", 1, 3), { npc: "mabel", trust: 2 });
  assert.equal(H.hostDayTrust(flags, "golf", 1, 8), null);
  assert.deepEqual(H.hostDayTrust(flags, "bowl", 2, 4), { npc: "jordan", trust: 2 });
  assert.equal(H.hostDayTrust(flags, "bowl", 1, 2), null);
  assert.equal(H.hostDayTrust(flags, "fish", 1, 9), null);
});
