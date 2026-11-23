// Desktop saves rotate three backups. A second process still sees the week.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const here = fileURLToPath(import.meta.url);
const dir = mkdtempSync(join(tmpdir(), "cc-desk-"));
const out = join(dir, "desk.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [
    ...(process.env.ESBUILD ? [] : ["esbuild"]),
    join(root, "src/game/deskSave.ts"),
    "--bundle",
    "--platform=node",
    "--format=esm",
    `--outfile=${out}`,
  ],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const desk = await import(out);

const NAMES = [desk.LIVE_SAVE, ...desk.SAVE_BACKUPS];

function loadDir(folder) {
  const files = new Map();
  for (const name of NAMES) {
    const path = join(folder, name);
    if (existsSync(path)) files.set(name, readFileSync(path, "utf8"));
  }
  return files;
}

function storeDir(folder, next) {
  for (const name of next.drop) rmSync(join(folder, name), { force: true });
  for (const [name, body] of next.files) writeFileSync(join(folder, name), body);
}

if (process.argv[2] === "write") {
  const folder = process.argv[3];
  let files = loadDir(folder);
  for (const text of ["week-a", "week-b", "week-c", "week-d"]) {
    const next = desk.rotateSaves(files, text);
    storeDir(folder, next);
    files = next.files;
  }
  const same = desk.rotateSaves(files, "week-d");
  storeDir(folder, same);
  process.exit(0);
}

if (process.argv[2] === "read") {
  const folder = process.argv[3];
  const live = readFileSync(join(folder, desk.LIVE_SAVE), "utf8");
  const b1 = readFileSync(join(folder, desk.SAVE_BACKUPS[0]), "utf8");
  const b2 = readFileSync(join(folder, desk.SAVE_BACKUPS[1]), "utf8");
  const b3 = readFileSync(join(folder, desk.SAVE_BACKUPS[2]), "utf8");
  if (live !== "week-d" || b1 !== "week-c" || b2 !== "week-b" || b3 !== "week-a") process.exit(2);
  process.exit(0);
}

test("three backups and a new process reads the week", () => {
  const folder = mkdtempSync(join(tmpdir(), "cc-week-"));
  const write = spawnSync(process.execPath, [here, "write", folder], { encoding: "utf8" });
  assert.equal(write.status, 0, write.stderr || write.stdout);
  const read = spawnSync(process.execPath, [here, "read", folder], { encoding: "utf8" });
  assert.equal(read.status, 0, read.stderr || read.stdout);
  assert.equal(readFileSync(join(folder, desk.LIVE_SAVE), "utf8"), "week-d");
});
