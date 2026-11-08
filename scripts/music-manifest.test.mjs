// The Music app's four tracks are generated in code. The manifest says how, and must match the code (spec 4.6).
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-music-"));
const out = join(dir, "parlorMusic.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/parlorMusic.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const M = await import(out);

const manifest = JSON.parse(readFileSync(join(root, "public/music/manifest.json"), "utf8"));

test("the manifest lists one track per season, in calendar order", () => {
  assert.deepEqual(
    manifest.tracks.map((t) => t.season),
    ["spring", "summer", "fall", "winter"],
  );
});

test("each manifest track matches the generator's track definition", () => {
  for (const t of manifest.tracks) {
    const code = M.TRACKS[t.season];
    assert.ok(code, `code has ${t.season}`);
    for (const k of ["title", "bpm", "root", "scale", "progression", "lead", "pad", "density"]) {
      assert.deepEqual(code[k], t[k], `${t.season}.${k}`);
    }
  }
});

test("the manifest says the music is original and generated, with no samples", () => {
  assert.match(manifest.license, /original/i);
  assert.match(manifest.license, /no samples/i);
  assert.deepEqual(manifest.files, []);
});

test("no audio file is shipped in public/music", () => {
  const dirPath = join(root, "public/music");
  assert.ok(existsSync(dirPath));
  const audio = readdirSync(dirPath).filter((f) => /\.(mp3|ogg|wav|m4a|aac|flac|webm)$/i.test(f));
  assert.deepEqual(audio, []);
});

test("the same track and bar give the same notes", () => {
  for (const season of ["spring", "summer", "fall", "winter"]) {
    const track = M.TRACKS[season];
    for (let bar = 0; bar < 8; bar++) {
      assert.deepEqual(M.barEvents(track, bar, 1), M.barEvents(track, bar, 1));
    }
  }
});

test("every note is inside a playable range and inside its bar", () => {
  const track = M.TRACKS.summer;
  for (let bar = 0; bar < 8; bar++) {
    const base = bar * M.EIGHTHS_PER_BAR;
    for (const e of M.barEvents(track, bar, 1)) {
      assert.ok(e.midi >= 24 && e.midi <= 96, `midi ${e.midi} is playable`);
      assert.ok(e.at >= base && e.at < base + M.EIGHTHS_PER_BAR, "the note starts in its bar");
    }
  }
});

test("timing and pitch helpers are correct", () => {
  assert.equal(M.freqOf(69), 440);
  assert.ok(Math.abs(M.freqOf(81) - 880) < 1e-9);
  assert.ok(Math.abs(M.eighthSeconds(120) - 0.25) < 1e-12);
});
