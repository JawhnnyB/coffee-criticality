// Rebinds live in cc.settings and do not take Escape. A new load reads them back.
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-binds-"));
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
};

function load(name) {
  const out = join(dir, name);
  const built = spawnSync(
    process.env.ESBUILD ?? "npx",
    [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/binds.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
    { encoding: "utf8", cwd: root },
  );
  if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
  return import(out);
}

const first = await load("a.mjs");

test("defaults and a saved bind", () => {
  assert.equal(first.binds().interact, "KeyE");
  assert.equal(first.isBound("KeyE"), true);
  first.setBind("interact", "Escape");
  assert.equal(first.binds().interact, "KeyE");
  first.setBind("interact", "KeyF");
  assert.equal(first.binds().interact, "KeyF");
  assert.equal(first.isBound("KeyF"), true);
  assert.equal(first.actHeld((c) => c === "KeyF", "interact", "Enter"), true);
  assert.equal(JSON.parse(store.get("cc.settings")).binds.interact, "KeyF");
});

test("a new load keeps the bind and drops a duplicate", async () => {
  const second = await load("b.mjs");
  assert.equal(second.binds().interact, "KeyF");
  second.setBind("report", "KeyF");
  assert.equal(second.binds().report, "KeyF");
  assert.notEqual(second.binds().interact, "KeyF");
});
