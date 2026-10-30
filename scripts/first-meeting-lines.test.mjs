#!/usr/bin/env node
// Lint for first-meeting dialogue (content.ts INTRO). Spoken lines read as speech:
// quoted, a full sentence, not a fragment, not a stage direction, short enough to read in the box.
// See docs/first-meeting-dialogue.md for the reasoning behind each rule.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(mkdtempSync(join(tmpdir(), "cc-lines-")), "content.mjs");
const bundled = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/content.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (bundled.status !== 0) throw new Error(bundled.stderr || bundled.stdout || "esbuild failed");
const C = await import(out);

const MAX_CHARS = 120;
const MIN_WORDS = 4;
// Stage-direction tells: a body-language verb that names what someone does with their hands or eyes.
const STAGE = /\b(does not look|doesn't look|looks at|watches the|turns to|taps the|nods|picks up|finds the|sets down|pencil|cup meets|tag turns|sheet a quarter)\b/i;

// Beats or exchanges marked `you` are the player's own narration, not speech, so they are exempt.
function spoken(beat) {
  if (beat.you) return [];
  return beat.exchanges.filter((ex) => ex.line && !ex.you).map((ex) => ex.line);
}

test("every spoken line is quoted speech", () => {
  for (const beat of C.INTRO) {
    for (const ex of beat.exchanges) {
      if (beat.you || ex.you || !ex.line) continue;
      assert.match(ex.line, /^“.*”$/s, `not quoted: ${ex.line}`);
    }
  }
});

test("spoken lines fit the box and are whole sentences", () => {
  for (const beat of C.INTRO) {
    for (const ex of beat.exchanges) {
      if (beat.you || ex.you || !ex.line) continue;
      const body = ex.line.replace(/^“|”$/g, "");
      assert.ok(ex.line.length <= MAX_CHARS, `too long (${ex.line.length}): ${ex.line}`);
      assert.match(body, /[.?!]$/, `not a full sentence: ${ex.line}`);
      assert.ok(body.split(/\s+/).length >= MIN_WORDS, `fragment: ${ex.line}`);
    }
  }
});

test("no stage directions inside spoken lines", () => {
  for (const beat of C.INTRO) {
    for (const line of spoken(beat)) {
      assert.doesNotMatch(line, STAGE, `stage direction in: ${line}`);
    }
  }
});

test("no line repeats another character's line word-for-word", () => {
  const seen = new Map();
  for (const beat of C.INTRO) {
    for (const line of spoken(beat)) {
      assert.ok(!seen.has(line), `duplicate line: ${line}`);
      seen.set(line, true);
    }
  }
});
