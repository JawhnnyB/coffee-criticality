#!/usr/bin/env node
// The move to nights as moments with people (src/game/nightwatch/rotationScenes.ts).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(mkdtempSync(join(tmpdir(), "cc-rot-")), "rot.mjs");
const b = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/nightwatch/rotationScenes.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], { encoding: "utf8", cwd: root });
if (b.status !== 0) throw new Error(b.stderr || b.stdout);
const R = await import(out);

const held = { held: true, hides: 0, trust: { jordan: 60 }, returning: false };
const bad = { held: false, hides: 3, trust: { jordan: 20 }, returning: false };
const all = [];
for (const m of [held, bad, { ...held, returning: true }, { ...bad, hides: 1 }]) {
  all.push(R.vanScene(m), R.daysOffScene(m));
  for (let n = 1; n <= 4; n++) for (const again of [false, true]) all.push(R.openerScene(n, again, m));
}

test("every scene fits a phone and has someone in it", () => {
  for (const sc of all) {
    assert.ok(sc.lines.length >= 1 && sc.title && sc.where);
    for (const l of sc.lines) assert.ok(l.text.length <= 125, `${sc.title}: ${l.text.length}: ${l.text}`);
    assert.ok(sc.lines.some((l) => l.who), `${sc.title} has a person speaking`);
  }
});

test("each night opens with a different person", () => {
  const faces = [1, 2, 3, 4].map((n) => R.openerScene(n, false, held).face);
  assert.deepEqual(faces, ["elena", "jordan", "mabel", "holt"]);
  for (let n = 1; n <= 4; n++) assert.notEqual(R.openerScene(n, true, held).lines[0].text, R.openerScene(n, false, held).lines[0].text, `night ${n} again`);
});

test("the week colours the van, the days off and Jordan's radio", () => {
  assert.notEqual(R.vanScene(held).lines[1].text, R.vanScene(bad).lines[1].text);
  assert.match(R.vanScene(bad).lines[1].text, /Three things/);
  assert.ok(R.daysOffScene(held).lines.some((l) => l.who === "jordan"), "Jordan texts after a good week");
  assert.ok(!R.daysOffScene(bad).lines.some((l) => l.who === "jordan"), "not after three hides");
  assert.ok(R.openerScene(2, false, bad).lines[0].text.length < R.openerScene(2, false, held).lines[0].text.length, "a cooler radio check");
});
