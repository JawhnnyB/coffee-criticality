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

// Operating points for each plant, with three-digit temperatures (the longest labels the game prints).
const POINTS = {
  pwr: [[324, 292], [350, 285], [285, 285]],
  bwr: [[287, 275], [330, 275], [200, 200]],
  pebble: [[735, 260], [750, 250], [250, 250]],
  msr: [[678, 620], [680, 620], [620, 620]],
};

for (const plant of Object.keys(M.DRAWINGS)) {
  const D = M.DRAWINGS[plant];
  for (const [hotT, coldT] of POINTS[plant]) {
    test(`${plant} labels at ${hotT}/${coldT} sit inside the drawing and clear of every object`, () => {
      for (const l of D.labels(hotT, coldT)) {
        const box = M.labelBox(l);
        assert.ok(box.x0 >= 0 && box.y0 >= 0 && box.x1 <= M.NATIVE_W && box.y1 <= M.NATIVE_H, `${l.text} is inside the 160x80 drawing`);
        if (l.inside) {
          assert.ok(D.shapes[l.inside], `${l.text} names a real object (${l.inside})`);
          assert.ok(inside(box, D.shapes[l.inside]), `${l.text} sits inside ${l.inside}`);
          for (const [name, s] of Object.entries(D.shapes)) {
            if (name !== l.inside) assert.ok(!hit(box, boxOf(s)), `${l.text} does not touch ${name}`);
          }
          continue;
        }
        for (const [name, s] of Object.entries(D.shapes)) {
          assert.ok(!hit(box, boxOf(s)), `${l.text} does not touch ${name}`);
        }
      }
    });
  }

  test(`${plant} labels do not overlap each other`, () => {
    const labels = D.labels(POINTS[plant][0][0], POINTS[plant][0][1]);
    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        assert.ok(!hit(M.labelBox(labels[i]), M.labelBox(labels[j])), `${labels[i].text} / ${labels[j].text}`);
      }
    }
  });

  test(`${plant} drawn objects stay inside the native grid`, () => {
    for (const [name, s] of Object.entries(D.shapes)) {
      assert.ok(s.x >= 0 && s.y >= 0 && s.x + s.w <= M.NATIVE_W && s.y + s.h <= M.NATIVE_H, name);
    }
  });

  test(`${plant} carries the required facts: pressure, hot and cold, scale ends, and the footer`, () => {
    const texts = D.labels(POINTS[plant][0][0], POINTS[plant][0][1]).map((l) => l.text);
    assert.ok(texts.some((t) => /MPA/.test(t)), "pressure label");
    assert.ok(texts.some((t) => t.startsWith("HOT ")) && texts.some((t) => t.startsWith("COLD ")), "hot and cold temperatures");
    assert.ok(texts.includes(`${D.scale.hi}`) && texts.includes(`${D.scale.lo}`), "scale ends match the drawing's scale");
    assert.ok(texts.includes("SIMPLIFIED TEACHING DRAWING.") && texts.includes("NOT A LICENSE."), "required footer");
  });

  test(`${plant} scale bar colours the operating points inside the seven bands`, () => {
    for (const [hotT, coldT] of POINTS[plant]) {
      for (const t of [hotT, coldT]) {
        assert.ok(M.BANDS.includes(M.bandColor(t, D.scale.lo, D.scale.hi)), `${t} is coloured`);
      }
    }
    assert.ok(M.bandIndex(D.scale.hi, D.scale.lo, D.scale.hi) === 6 && M.bandIndex(D.scale.lo, D.scale.lo, D.scale.hi) === 0);
  });
}

test("PWR: control rods enter the core from the top", () => {
  const { rods, core } = M.PWR_SHAPES;
  assert.ok(rods.y + rods.h <= core.y, "the rod housing sits above the core");
  assert.ok(rods.x >= core.x && rods.x + rods.w <= core.x + core.w, "the rod housing is over the core");
});

test("PWR: steam is drawn as dots on the secondary side, clear of the core and steam generator", () => {
  const { steam, core, sg } = M.PWR_SHAPES;
  assert.ok(steam.w > 0 && steam.h > 0, "steam region exists");
  assert.ok(!hit(boxOf(steam), boxOf(core)) && !hit(boxOf(steam), boxOf(sg)), "steam is not on the primary side");
});

test("MSR scale covers the model's full-power hot leg (620 + 58 = 678 °C)", () => {
  assert.ok(M.MSR_SCALE.lo <= 678 && M.MSR_SCALE.hi >= 678, "678 is inside the printed scale");
});
