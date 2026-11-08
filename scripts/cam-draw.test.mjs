// CORE CAM drawing: one snapshot per plant type, palette only, hard pixels, no text, reduced motion,
// full core versus window, and the mapping. Spec sections 6.1, 6.2, 6.4, 6.5.
//
// The drawing is recorded as a list of fillRect calls (colour, x, y, w, h). The snapshot is a hash of
// that list. A later edit that changes any pixel changes the hash and fails here. To accept a change on
// purpose, run with CC_UPDATE_SNAPSHOTS=1 and commit the new files in scripts/snapshots/.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-camdraw-"));
const snapDir = join(root, "scripts", "snapshots");

function bundle(name) {
  const out = join(dir, name + ".mjs");
  const built = spawnSync(
    process.env.ESBUILD ?? "npx",
    [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/" + name + ".ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
    { encoding: "utf8", cwd: root },
  );
  if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
  return import(out);
}

const D = await bundle("camDraw");
const R = await bundle("reactorReadout");

// The listed palette (STYLE-STANDARD §3–4, GROK_PHASES 2.2). Nothing else may be drawn, except the glow ramp.
const LISTED = new Set(["#1c1410", "#16110d", "#3d5c66", "#4e5560", "#c9a227", "#c4783a", "#f3e6d0", "#f4ecd8", "#d4cce6", "#6a4a32"]);

const base = {
  powerMW: 1100,
  dT: 32,
  flow: 100,
  enrich: 4.5,
  fuelTempK: 900,
  coolantTempK: 580,
  fuelDensity: 10.97,
  coolantDensity: 0.7,
  depletion: false,
  reflector: false,
  burnupMWd_kg: 0,
};

function plantFor(type, kind, { fullCore = false, sizeClass = 1 } = {}) {
  return { ...base, type, scale: kind === "core" ? "core" : kind, fullCore, sizeClass };
}

/** Builds one frame the way CoreCamApp does, with fixed inputs. */
function build(type, kind, opts = {}) {
  const { powerPct = 80, flowPct = 100, scram = false, reduced = false, fullCore = false, sizeClass = 1 } = opts;
  const plant = plantFor(type, kind, { fullCore, sizeClass });
  const run = { powerPct, flowPct, scram };
  const frame = R.camFrame(plant, run);
  const dots = [];
  const bubbles = [];
  const stop = reduced || frame.scram;
  for (let i = 0; i < 3; i++) {
    R.stepFlow(dots, R.particleCount(frame.count, stop), frame.speed, type, 0.05, stop);
    R.stepBubbles(bubbles, type === "bwr" ? R.bubbleCount(frame.voidFrac, stop) : 0, R.bubbleSpeed(frame.voidFrac), 0.05, stop);
  }
  const scene = {
    type,
    kind: kind === "rod" ? "rod" : kind === "assembly" ? "assembly" : "core",
    cells: R.cellCount(plant.scale, sizeClass, fullCore),
    glow: R.glowColor(frame.glow),
    edge: frame.scram ? "#3d5c66" : frame.band === "in" ? "#c9a227" : frame.band === "low" ? "#3d5c66" : "#c4783a",
    dots,
    bubbles,
  };
  return { frame, scene };
}

/** Runs the scene through a recording pen. The pen has no fillText, so any text call throws. */
function record(scene) {
  const ops = [];
  let fill = "#000000";
  const pen = {
    imageSmoothingEnabled: true,
    get fillStyle() {
      return fill;
    },
    set fillStyle(v) {
      fill = v;
    },
    fillRect(x, y, w, h) {
      ops.push({ c: fill, x, y, w, h });
    },
  };
  D.drawCamScene(pen, scene);
  return ops;
}

function digest(ops) {
  return createHash("sha256").update(JSON.stringify(ops)).digest("hex");
}

const CASES = [
  { name: "pwr", type: "pwr", kind: "core" },
  { name: "bwr", type: "bwr", kind: "core" },
  { name: "pebble", type: "pebble", kind: "core" },
  { name: "msr", type: "msr", kind: "core" },
  { name: "rod", type: "pwr", kind: "rod" },
  { name: "assembly", type: "pwr", kind: "assembly" },
];

test("one snapshot per plant type, with fixed inputs", () => {
  mkdirSync(snapDir, { recursive: true });
  for (const c of CASES) {
    const { scene } = build(c.type, c.kind);
    const ops = record(scene);
    const file = join(snapDir, `cam-${c.name}.json`);
    const now = { ops: ops.length, sha256: digest(ops) };
    if (process.env.CC_UPDATE_SNAPSHOTS === "1") {
      writeFileSync(file, JSON.stringify(now, null, 2) + "\n");
      continue;
    }
    assert.ok(existsSync(file), `${file} is missing. Run CC_UPDATE_SNAPSHOTS=1 once and commit it.`);
    const saved = JSON.parse(readFileSync(file, "utf8"));
    assert.deepEqual(now, saved, `${c.name} drawing changed. Run CC_UPDATE_SNAPSHOTS=1 if the change is intended.`);
  }
});

test("every drawn colour is a listed token, or a step on the glow ramp", () => {
  for (const tok of Object.values(D.COL)) assert.ok(LISTED.has(tok), `${tok} is listed`);
  for (const c of CASES) {
    for (const flags of [{}, { scram: true }, { reduced: true }]) {
      const { frame, scene } = build(c.type, c.kind, flags);
      const ramp = R.glowColor(frame.glow);
      for (const op of record(scene)) {
        const ok = LISTED.has(op.c) || op.c === ramp;
        assert.ok(ok, `${c.name} ${JSON.stringify(flags)} draws ${op.c}`);
      }
    }
  }
});

test("hard pixel edges: every rectangle sits on whole pixels", () => {
  for (const c of CASES) {
    for (const op of record(build(c.type, c.kind).scene)) {
      assert.ok(Number.isInteger(op.x) && Number.isInteger(op.y) && Number.isInteger(op.w) && Number.isInteger(op.h), `${c.name}`);
      assert.ok(op.x >= 0 && op.y >= 0 && op.x + op.w <= D.CAM_W && op.y + op.h <= D.CAM_H, `${c.name} stays on the 160×96 grid`);
    }
  }
});

test("no text on the canvas: the pen has no text call and drawing never needs one", () => {
  for (const c of CASES) assert.doesNotThrow(() => record(build(c.type, c.kind).scene));
});

test("fullCore draws more assemblies than the 3×3 window", () => {
  const outlines = (ops) => ops.filter((o) => o.c === D.COL.graphite).length;
  const win = record(build("pwr", "core", { fullCore: false, sizeClass: 1 }).scene);
  const full = record(build("pwr", "core", { fullCore: true, sizeClass: 1 }).scene);
  assert.ok(outlines(full) > outlines(win), `${outlines(full)} > ${outlines(win)}`);
  assert.equal(R.cellCount("core", 1, false), 9);
  assert.equal(R.cellCount("core", 1, true), 25);
});

test("reduced motion draws zero particles and zero bubbles", () => {
  for (const type of ["pwr", "bwr", "pebble", "msr"]) {
    const { scene } = build(type, "core", { reduced: true });
    assert.equal(scene.dots.length, 0, `${type} dots`);
    assert.equal(scene.bubbles.length, 0, `${type} bubbles`);
  }
  assert.equal(R.particleCount(40, true), 0);
  assert.equal(R.bubbleCount(0.9, true), 0);
});

test("scram stops the particles and the bubbles", () => {
  const { scene } = build("bwr", "core", { scram: true });
  assert.equal(scene.dots.length, 0);
  assert.equal(scene.bubbles.length, 0);
});

test("the mapping is monotone: more power, more glow and particles; more flow, faster particles", () => {
  const low = build("pwr", "core", { powerPct: 20 }).frame;
  const high = build("pwr", "core", { powerPct: 100 }).frame;
  const fast = build("pwr", "core", { powerPct: 100, flowPct: 140 }).frame;
  assert.ok(high.glow > low.glow, "glow rises with power");
  assert.ok(high.count > low.count, "particle count rises with power");
  assert.ok(fast.speed > high.speed, "particle speed rises with flow");
});

test("the boiling proxy is monotone: more void, more bubbles and faster rise", () => {
  const a = R.bubbleCount(0.1, false);
  const b = R.bubbleCount(0.9, false);
  assert.ok(b > a, "more void, more bubbles");
  assert.ok(R.bubbleSpeed(0.9) > R.bubbleSpeed(0.1), "more void, faster rise");
  const bwr = build("bwr", "core", { powerPct: 100, flowPct: 60 }).frame;
  assert.ok(bwr.voidFrac > 0.4, "low flow at full power boils more");
});

test("the drawings carry their geometry: pebbles are circles with helium, BWR has bubbles, PWR and MSR have arrows", () => {
  const helium = (ops) => ops.filter((o) => o.c === D.COL.helium).length;
  const steam = (ops) => ops.filter((o) => o.c === D.COL.steam && o.w === 2 && o.h === 2).length;
  const arrows = (ops) => ops.filter((o) => o.c === D.COL.cream && o.w <= 5 && o.h <= 7 && (o.x === 12 || o.x === 141)).length;

  const pebble = record(build("pebble", "core").scene);
  assert.ok(helium(pebble) > 0, "helium stipple between pebbles");

  const bwr = build("bwr", "core", { powerPct: 100, flowPct: 100 });
  assert.equal(steam(record(bwr.scene)), bwr.scene.bubbles.length, "one steam dot per bubble");
  assert.ok(bwr.scene.bubbles.length > 0);

  assert.ok(arrows(record(build("pwr", "core").scene)) > 0, "PWR arrows");
  assert.ok(arrows(record(build("msr", "core").scene)) > 0, "MSR arrows");
  assert.equal(arrows(record(build("bwr", "core").scene)), 0, "no arrows on the BWR");
});

test("camScale is an integer from 1 to 4, from the window width", () => {
  assert.equal(D.camScale(366), 2);
  assert.equal(D.camScale(390), 2);
  assert.equal(D.camScale(480), 3);
  assert.equal(D.camScale(1000), 4);
  assert.equal(D.camScale(120), 1);
  assert.equal(D.camScale(Number.NaN), 1);
});

test("the glow moves only past a 5 percent change under reduced motion, and always under normal motion", () => {
  assert.equal(R.glowMoved(0.5, 0.5, true, false), false);
  assert.equal(R.glowMoved(0.52, 0.5, true, false), false);
  assert.equal(R.glowMoved(0.6, 0.5, true, false), true);
  assert.equal(R.glowMoved(0.501, 0.5, false, false), true);
  assert.equal(R.glowMoved(0.5, 0.5, true, true), true, "the first frame always draws");
});
