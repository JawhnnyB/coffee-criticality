// Chrome lines live in one file. None is over two phone rows. A short denylist catches typos.
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-ui-"));
const out = join(dir, "ui.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/uiStrings.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const ui = await import(out);

const BAD = ["seperate", "recieve", "occured", "untill", "teh", "alot", "definately", "enviroment"];

test("every chrome line fits two phone rows and is not a known misspelling", () => {
  const lines = ui.chromeLines();
  assert.ok(lines.length > 20);
  for (const line of lines) {
    assert.ok(line.length <= 78, line);
    const low = line.toLowerCase();
    for (const bad of BAD) assert.equal(low.includes(bad), false, `${bad} in ${line}`);
  }
});
