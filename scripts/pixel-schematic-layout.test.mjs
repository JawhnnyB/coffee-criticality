import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(mkdtempSync(join(tmpdir(), "cc-schem-")), "schematicMath-layout.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/schematicMath.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const M = await import(out);

function hit(a, b) {
  return a.x0 < b.x0 + b.w && b.x0 < a.x1 && a.y0 < b.y0 + b.h && b.y0 < a.y1;
}
function boxOf(r) {
  return { x0: r.x, y0: r.y, x1: r.x + r.w, y1: r.y + r.h };
}
function inside(a, r) {
  return a.x0 >= r.x && a.y0 >= r.y && a.x1 <= r.x + r.w && a.y1 <= r.y + r.h;
}

// Labels at the two operating points the game uses, plus the seed and the worst case in the band.
for (const [hotT, coldT] of [[324, 292], [350, 285], [285, 285]]) {
  test(`PWR labels at ${hotT}/${coldT} sit clear of every drawn object`, () => {
    const labels = M.pwrLabels(hotT, coldT);
    for (const l of labels) {
      const box = M.labelBox(l);
      assert.ok(box.x0 >= 0 && box.y0 >= 0 && box.x1 <= 160 && box.y1 <= 80, `${l.text} is inside the 160x80 drawing`);
      if (l.inside) {
        const host = l.text === "CORE" ? M.PWR_SHAPES.core : M.PWR_SHAPES.sg;
        assert.ok(inside(box, host), `${l.text} sits inside its object`);
        continue;
      }
      for (const [name, r] of Object.entries(M.PWR_SHAPES)) {
        assert.ok(!hit(box, boxOf(r)), `${l.text} does not touch ${name}`);
      }
    }
  });
}

test("PWR labels do not overlap each other", () => {
  const labels = M.pwrLabels(324, 292);
  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) {
      assert.ok(!hit(M.labelBox(labels[i]), M.labelBox(labels[j])), `${labels[i].text} / ${labels[j].text}`);
    }
  }
});

test("the drawn objects stay inside the native drawing", () => {
  for (const [name, r] of Object.entries(M.PWR_SHAPES)) {
    assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= 160 && r.y + r.h <= 80, name);
  }
});
