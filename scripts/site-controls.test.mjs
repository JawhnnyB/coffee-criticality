import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Bundle the real modules: siteControls imports plant.ts without an extension.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-site-"));
const entry = join(dir, "entry.ts");
writeFileSync(entry, `export * from ${JSON.stringify(join(root, "src/game/siteControls.ts"))};\nexport { stepBench, BENCH_HOLD } from ${JSON.stringify(join(root, "src/game/benchStep.ts"))};\n`);
const out = join(dir, "site.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const { commandFor, panelFor, pebbleOutletC, pebblePass, saltBetaEff, saltDrain, siteStep, DRAINED_MSG, stepBench, BENCH_HOLD } = await import(out);

/** Run the real bench for `seconds` at fixed rods and flow, through the site layer, like the trainer does. */
function settle(plant, { rods, flow, seconds = 120, power = rods, drainAt = null }) {
  let st = { power, hold: 0, precursors: undefined, rodPos: undefined, lastWritten: null };
  let t = 0;
  let passed = false;
  let out = null;
  const dt = 0.05;
  while (t < seconds) {
    const drain = drainAt !== null && t >= drainAt;
    const move = { rodsWithdrawnPct: rods, flowPct: flow, drain, drainSeconds: drain ? t - drainAt : 0, passes: 0 };
    const step = stepBench({ ...st, rods, flow, dt, plant, flowRef: 100 });
    out = siteStep(plant, step, move);
    st = { power: out.power, hold: out.hold, precursors: step.precursors, rodPos: step.rodPos, lastWritten: step.lastWritten };
    passed ||= out.passed;
    t += dt;
    if (out.scram) break;
  }
  return { ...out, passedAny: passed, t };
}

test("BWR power rises when recirc flow rises at the same rods (bench kinetics, not a formula)", () => {
  const low = settle("bwr", { rods: 80, flow: 90 }).power;
  const mid = settle("bwr", { rods: 80, flow: 100 }).power;
  const high = settle("bwr", { rods: 80, flow: 110 }).power;
  assert.ok(low < mid && mid < high, `90%: ${low}  100%: ${mid}  110%: ${high}`);
  assert.ok(Math.abs(mid - 80) < 1, `rest point at design flow is the rod percent, got ${mid}`);
});

test("BWR panel shows the bench power, the same number the band hold uses", () => {
  const move = { rodsWithdrawnPct: 62, flowPct: 75, drain: false, drainSeconds: 0, passes: 0 };
  const sim = commandFor("bwr", 57.3, move, false);
  assert.equal(sim.powerPct, 57.3);
  assert.match(panelFor("bwr", move, sim).lines.join(" "), /Power 57%/);
});

test("draining a salt core ends fission heat", () => {
  const shut = saltDrain(0);
  const gone = saltDrain(40);
  assert.equal(shut.fission, 1);
  assert.equal(gone.plug, "open");
  assert.equal(gone.fission, 0);
  const sim = commandFor("msr", 80, { rodsWithdrawnPct: 50, flowPct: 100, drain: true, drainSeconds: 40, passes: 0 }, false);
  assert.equal(sim.powerPct, 0);
  assert.equal(sim.scram, true);
});

test("pebble burnup rises on each pass", () => {
  const a = pebblePass(10);
  const b = pebblePass(a.burnupMWd);
  assert.ok(b.burnupMWd > a.burnupMWd);
  assert.equal(pebblePass(82).discharged, true);
});

test("pebble outlet is near 750 °C at full power and follows power and blower flow", () => {
  const full = pebbleOutletC(100, 100);
  assert.ok(full >= 700 && full <= 780, `full power outlet ${full}`);
  assert.ok(pebbleOutletC(50, 100) < full, "less power, cooler outlet");
  assert.ok(pebbleOutletC(100, 120) < full, "more helium flow, cooler outlet");
  assert.ok(pebbleOutletC(100, 80) > full, "less helium flow, hotter outlet");
});

test("opening the freeze valve can never pass the band, and ends as a scram with fission at zero", () => {
  // Hold the band at steady power, open the valve two seconds in. Without the valve this run passes.
  const control = settle("msr", { rods: 80, flow: 100, seconds: BENCH_HOLD.msr + 4 });
  assert.equal(control.passedAny, true, "control run should pass");
  const r = settle("msr", { rods: 80, flow: 100, seconds: 60, drainAt: 2 });
  assert.equal(r.passedAny, false, "a drain must not pass the band");
  assert.equal(r.scram, true);
  assert.equal(r.drained, true);
  assert.equal(r.power, 0);
  assert.equal(r.msg, DRAINED_MSG);
  assert.ok(r.t > 2 + 8 && r.t < 2 + 30, `drained after the plug melted and the level fell, at ${r.t.toFixed(1)} s`);
});

test("while the salt drains, power falls with the level and the hold stays at zero", () => {
  const bench = { power: 80, hold: 5, scram: false, passed: true, msg: "Band held." };
  const move = (sec) => ({ rodsWithdrawnPct: 80, flowPct: 100, drain: true, drainSeconds: sec, passes: 0 });
  const melting = siteStep("msr", bench, move(3));
  assert.deepEqual([melting.power, melting.hold, melting.passed], [80, 0, false]);
  const half = siteStep("msr", bench, move(18));
  assert.ok(Math.abs(half.power - 40) < 0.01 && half.hold === 0 && !half.passed);
  // Other types and an un-ordered drain pass straight through.
  assert.deepEqual(siteStep("pwr", bench, move(18)), { ...bench, drained: false });
  assert.deepEqual(siteStep("msr", bench, { ...move(0), drain: false }), { ...bench, drained: false });
});

test("salt panel shows βeff smaller than β and helium does not glow", () => {
  const b = saltBetaEff();
  assert.ok(b.betaEff < b.beta);
  const panel = panelFor(
    "pebble",
    { rodsWithdrawnPct: 80, flowPct: 100, drain: false, drainSeconds: 0, passes: 2 },
    { powerPct: 90, flowPct: 100, rodsWithdrawnPct: 80, scram: false },
  );
  assert.equal(panel.glow, 0);
  assert.match(panel.lines.join(" "), /Outlet 6[0-9]{2} °C/); // 90% power, full blower: below the 750 °C full-power outlet
  const salt = panelFor(
    "msr",
    { rodsWithdrawnPct: 50, flowPct: 80, drain: false, drainSeconds: 0, passes: 0 },
    { powerPct: 40, flowPct: 80, rodsWithdrawnPct: 50, scram: false },
  );
  assert.match(salt.lines.join(" "), /βeff/);
  assert.equal(salt.glow, 0);
});
