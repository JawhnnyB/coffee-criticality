import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(mkdtempSync(join(tmpdir(), "cc-schem-")), "schematicMath.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/schematicMath.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const M = await import(out);

test("seven bands, coldest first, hottest last", () => {
  assert.equal(M.BANDS.length, 7);
  assert.equal(M.bandIndex(285), 0);
  assert.equal(M.bandIndex(349.9), 6);
  assert.equal(M.bandIndex(350), 6);
});

test("values outside the scale are clamped to the end bands", () => {
  assert.equal(M.bandIndex(100), 0);
  assert.equal(M.bandIndex(900), 6);
  assert.equal(M.bandIndex(NaN), 0);
});

test("the designed plant's operating points land where the eye expects", () => {
  assert.equal(M.bandColor(292), M.BANDS[0]);
  assert.equal(M.bandColor(324), M.BANDS[4]);
});

test("the drawing carries the required labels: pressure, hot and cold, scale, and the footer", () => {
  const texts = M.pwrLabels(324, 292).map((l) => l.text);
  assert.ok(texts.some((t) => /MPA/.test(t)), "pressure label");
  assert.ok(texts.includes("HOT 324C") && texts.includes("COLD 292C"), "hot and cold temperatures");
  assert.ok(texts.includes("350") && texts.includes("285"), "scale ends");
  assert.ok(texts.includes("SIMPLIFIED TEACHING DRAWING.") && texts.includes("NOT A LICENSE."), "required footer");
});

test("every label fits on the 160 × 80 native grid", () => {
  for (const l of M.pwrLabels(350, 285)) {
    assert.ok(l.x >= 0 && l.x < 160, `x out of range: ${l.text}`);
    assert.ok(l.y >= 0 && l.y < 80, `y out of range: ${l.text}`);
  }
});
