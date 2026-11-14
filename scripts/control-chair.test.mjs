// The control-room chair is a collider. Cafe chairs stay walk-through.
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-chair-"));
const simOut = join(dir, "sim.mjs");
const contentOut = join(dir, "content.mjs");
for (const [src, out] of [["src/game/sim.ts", simOut], ["src/game/content.ts", contentOut]]) {
  const built = spawnSync(
    process.env.ESBUILD ?? "npx",
    [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, src), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
    { encoding: "utf8", cwd: root },
  );
  if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
}
const Sim = await import(simOut);
const Content = await import(contentOut);

function centerOf(roomId, kind) {
  const room = Content.ROOMS[roomId];
  const prop = room.props.find((p) => p.kind === kind);
  assert.ok(prop, `${roomId} ${kind}`);
  return { prop, x: prop.rect.x + prop.rect.w / 2, y: prop.rect.y + prop.rect.h / 2 };
}

test("the control-room chair blocks the player, and a cafe chair does not", () => {
  const control = centerOf("control", "chair");
  const cafe = centerOf("cafe", "chair");
  assert.notEqual(control.prop.block, false, "content.ts control chair must not set block: false");
  assert.equal(cafe.prop.block, false);

  const s = Sim.createState();
  s.room = "control";
  assert.equal(Sim.solidAt(control.x, control.y, s), true, "the player cannot stand in the control-room chair");

  s.room = "cafe";
  assert.equal(Sim.solidAt(cafe.x, cafe.y, s), false, "cafe chairs stay out of the way");
});
