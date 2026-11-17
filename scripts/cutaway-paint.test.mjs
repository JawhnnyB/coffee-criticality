#!/usr/bin/env node
// The cutaway painter (src/game/cutawayPaint.ts), run on a stand-in canvas that counts painted area by colour.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-paint-"));
const bundle = (src, name) => {
  const out = join(dir, name);
  const r = spawnSync(
    process.env.ESBUILD ?? "npx",
    [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, src), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
    { encoding: "utf8", cwd: root },
  );
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || "esbuild failed");
  return out;
};
const P = await import(bundle("src/game/cutawayPaint.ts", "paint.mjs"));
const { PAL } = await import(bundle("src/game/palette.ts", "palette.mjs"));
const { thermalState } = await import(bundle("src/game/plant.ts", "plant.mjs"));

/** Paints one frame and returns painted area by colour. Later fills cover earlier ones only in count, which is enough to compare frames. */
function paint(kind, frame) {
  const area = new Map();
  let style = "";
  const g = {
    imageSmoothingEnabled: true,
    set fillStyle(v) {
      style = v;
    },
    get fillStyle() {
      return style;
    },
    fillRect(_x, _y, w, h) {
      area.set(style, (area.get(style) ?? 0) + Math.max(0, w) * Math.max(0, h));
    },
  };
  P.paintCutaway(g, kind, frame);
  return area;
}
const blue = (a) => (a.get(PAL.cherenkov) ?? 0) + (a.get(PAL.cherenkovL) ?? 0);
const live = (type, powerPct, flowPct = 100, scram = false, rods = 0.7) => {
  const ts = thermalState(type, { powerPct, flowPct });
  return { power: powerPct / 100, flow: flowPct / 100, rods, scram, tHot: ts.tHot, tCold: ts.tCold };
};
const KINDS = ["pwr", "bwr", "pebble", "msr", "msfr", "fhr"];

test("every colour painted is a palette colour", () => {
  const allowed = new Set(Object.values(PAL));
  for (const kind of KINDS) {
    for (const frame of [{ hot: true, t: 0.7 }, { hot: false, t: 0.7 }]) {
      for (const c of paint(kind, frame).keys()) assert.ok(allowed.has(c), `${kind} painted ${c}`);
    }
  }
});

test("Cherenkov light grows with power, and there is none at zero power", () => {
  for (const kind of ["pwr", "bwr"]) {
    const levels = [0, 20, 50, 100].map((p) => blue(paint(kind, { hot: true, t: 0.7, live: live(kind, p) })));
    console.log(JSON.stringify({ check: "glow-vs-power", kind, levels }));
    assert.equal(levels[0], 0, `${kind} glows at zero power`);
    for (let i = 1; i < levels.length; i++) assert.ok(levels[i] >= levels[i - 1], `${kind} glow fell from ${levels[i - 1]} to ${levels[i]}`);
    assert.ok(levels[3] > levels[1], kind);
  }
});

test("after a scram the core keeps only the dim decay glow", () => {
  const a = paint("pwr", { hot: true, t: 0.7, live: live("pwr", 100, 100, true) });
  console.log(JSON.stringify({ check: "scram", dim: a.get(PAL.cherenkovD) ?? 0, bright: blue(a) }));
  assert.equal(blue(a), 0, "no bright blue after a scram");
  assert.ok((a.get(PAL.cherenkovD) ?? 0) > 0, "decay heat still glows faintly");
});

test("gas and fuel salt never glow blue, at any power", () => {
  for (const kind of ["pebble", "msr", "msfr"]) {
    const a = paint(kind, { hot: true, t: 0.7 });
    assert.equal(blue(a) + (a.get(PAL.cherenkovD) ?? 0), 0, kind);
  }
});

test("the hot leg and cold leg differ in colour at full power, and match at zero power", () => {
  for (const type of ["pwr", "bwr", "pebble", "msr"]) {
    const full = thermalState(type, { powerPct: 100, flowPct: 100 });
    const zero = thermalState(type, { powerPct: 0, flowPct: 100 });
    const hot = P.tempColor(type, full.tHot);
    const cold = P.tempColor(type, full.tCold);
    console.log(JSON.stringify({ check: "legs", type, tHot: +full.tHot.toFixed(1), tCold: +full.tCold.toFixed(1), hot, cold }));
    assert.notEqual(hot, cold, `${type} legs look the same at full power`);
    assert.equal(P.tempColor(type, zero.tHot), P.tempColor(type, zero.tCold), `${type} legs differ with no heat`);
  }
});

test("the colour ramp only gets warmer as the temperature rises", () => {
  const order = [PAL.sky, PAL.muted, PAL.gold, PAL.copper, PAL.copperL];
  for (const kind of KINDS) {
    const { lo, hi } = P.TEMP_RANGE[kind];
    let last = -1;
    for (let T = lo - 20; T <= hi + 20; T += (hi - lo) / 40) {
      const i = order.indexOf(P.tempColor(kind, T));
      assert.ok(i >= last, `${kind} at ${T}`);
      last = i;
    }
  }
});

test("a scram trips the turbine; at power the steam side runs", () => {
  assert.equal(P.drive("pwr", { hot: true, t: 0, live: live("pwr", 100, 100, true) }).steam, false);
  assert.equal(P.drive("pwr", { hot: true, t: 0, live: live("pwr", 100) }).steam, true);
  assert.equal(P.drive("pwr", { hot: true, t: 0, live: live("pwr", 0) }).steam, false);
});
