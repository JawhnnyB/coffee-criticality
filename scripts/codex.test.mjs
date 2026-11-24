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
writeFileSync(entry, `export { CODEX, WATCHSTANDER, codexUnlocked, noteCodexCatch } from ${JSON.stringify(join(root, "src/game/codex.ts"))};\n`);
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

const blank = { flags: {}, valve: "open", tag: "open", dose: "open", plant: "", shuffleDone: false };

test("a steam leak opens the relief-valve note, and a fresh week does not", () => {
  assert.equal(W.codexUnlocked("relief-valve", blank), false);
  assert.equal(W.codexUnlocked("teaching-model", blank), true);
  assert.equal(W.codexUnlocked("cherenkov", blank), false);
  const day = { ...blank, valve: "caught" };
  assert.equal(W.codexUnlocked("relief-valve", day), true);
  assert.equal(W.codexUnlocked("pressurizer", day), true);
  const flags = {};
  W.noteCodexCatch(flags, "porv", ["leak"]);
  assert.equal(W.codexUnlocked("relief-valve", { ...blank, flags }), true);
  assert.equal(flags["codex:leak"], true);
  const full = {
    flags: {
      "codex:pool": true,
      "codex:freeze": true,
      outageOpen: true,
      "rot:nights": true,
      "night:1:grade:C": true,
      built: true,
      "codex:bwr": true,
      "codex:pebble": true,
      "codex:msr": true,
      "codex:porv": true,
      "codex:leak": true,
      "outage:c2:done": true,
      "outage:discharged": true,
      "cab:rods:d1": true,
      "cab:delay:d1": true,
      "cab:load:d1": true,
      "codex:rad": true,
      reported: true,
    },
    valve: "caught",
    tag: "caught",
    dose: "caught",
    plant: "pwr",
    shuffleDone: true,
  };
  for (const e of W.CODEX) assert.equal(W.codexUnlocked(e.id, full), true, e.id);
  for (const e of W.CODEX) {
    const note = W.WATCHSTANDER[e.id];
    assert.equal(typeof note, "string", e.id);
    assert.ok(note.length > 20 && note.length < 220, e.id);
  }
});
