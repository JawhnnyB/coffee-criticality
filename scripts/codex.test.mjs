import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-codex-"));
const entry = join(dir, "entry.ts");
writeFileSync(entry, `export { CODEX } from ${JSON.stringify(join(root, "src/game/codex.ts"))};\n`);
const out = join(dir, "codex.mjs");
const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], {
  encoding: "utf8",
  cwd: root,
});
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
const W = await import(out);

test("the codex is thirty short drafts, and none of them is a procedure", () => {
  assert.equal(W.CODEX.length, 30);
  const ids = new Set(W.CODEX.map((e) => e.id));
  assert.equal(ids.size, 30);
  for (const e of W.CODEX) {
    assert.ok(e.title.length > 0 && e.title.length < 40, e.id);
    assert.ok(e.body.length > 40 && e.body.length < 320, `${e.id} ${e.body.length}`);
    assert.equal(/you must|shall /i.test(e.body), false, e.id);
  }
  for (const id of ["cherenkov", "freeze-valve", "beavrs", "rounds", "turnover", "relief-valve"]) {
    assert.ok(ids.has(id), id);
  }
});
