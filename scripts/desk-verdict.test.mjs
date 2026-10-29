#!/usr/bin/env node
// The desk's sign-off sentence must match the core k it reports. A "holds" verdict at k 1.20 would
// tell the player a runaway core is fine, which is the one lie the desk must never tell.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(mkdtempSync(join(tmpdir(), "cc-desk-")), "nuclearLab.mjs");
const esb = await import(process.env.ESBUILD_PKG ? pathToFileURL(process.env.ESBUILD_PKG).href : "esbuild");
await esb.build({ entryPoints: [join(root, "src/game/nuclearLab.ts")], bundle: true, platform: "node", format: "esm", outfile: out, logLevel: "error" });
const { verdictWords } = await import(out);

test("a runaway core is never called holding", () => {
  assert.match(verdictWords(1.2, 1.3), /Runs away/);
  assert.doesNotMatch(verdictWords(1.2, 1.3), /Holds/);
});

test("the holding band reads as holding, with the number", () => {
  const v = verdictWords(1.0, 1.05);
  assert.match(v, /Holds\. k is 1\.000/);
});

test("below one the crowd shrinks, and far below it dies out", () => {
  assert.match(verdictWords(0.98, 1.0), /Creeping down/);
  assert.match(verdictWords(0.8, 1.0), /Dies out/);
});

test("the leakage line says what the edge takes", () => {
  // kCore = kInf * PNL, so the edge takes 1 - kCore/kInf of the crowd.
  assert.match(verdictWords(1.0, 1.25), /takes about 20% of the crowd/);
});
