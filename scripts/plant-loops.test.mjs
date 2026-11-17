#!/usr/bin/env node
// Physics rules for the plant cutaways (src/game/plantLoops.ts). The drawings are painted from this data.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(mkdtempSync(join(tmpdir(), "cc-loops-")), "plantLoops.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/plantLoops.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const M = await import(out);
const KINDS = Object.keys(M.PLANTS);

const comp = (p, id) => p.comps.find((c) => c.id === id);
const loopsWith = (p, id) => p.loops.filter((l) => l.path.includes(id));
const onEdge = (c, [x, y]) => {
  const inX = x >= c.x - 1 && x <= c.x + c.w + 1;
  const inY = y >= c.y - 1 && y <= c.y + c.h + 1;
  const nearX = Math.abs(x - c.x) <= 1 || Math.abs(x - (c.x + c.w)) <= 1;
  const nearY = Math.abs(y - c.y) <= 1 || Math.abs(y - (c.y + c.h)) <= 1;
  return (inX && nearY) || (inY && nearX);
};

test("all six plants are drawn", () => {
  assert.deepEqual(KINDS.sort(), ["bwr", "fhr", "msfr", "msr", "pebble", "pwr"]);
});

test("every loop closes, and every step of every loop is one drawn pipe in the flow direction", () => {
  for (const kind of KINDS) {
    const p = M.PLANTS[kind];
    for (const loop of p.loops) {
      assert.equal(loop.path[0], loop.path.at(-1), `${kind} ${loop.id} does not close`);
      for (let i = 0; i + 1 < loop.path.length; i++) {
        const from = loop.path[i];
        const to = loop.path[i + 1];
        const pipes = p.pipes.filter((q) => q.loop === loop.id && q.from === from && q.to === to);
        assert.equal(pipes.length, 1, `${kind} ${loop.id}: ${from} -> ${to} has ${pipes.length} pipes`);
      }
    }
    for (const q of p.pipes) {
      const loop = p.loops.find((l) => l.id === q.loop);
      assert.ok(loop, `${kind} pipe ${q.id} has no loop`);
      const steps = loop.path.slice(0, -1).map((a, i) => `${a}>${loop.path[i + 1]}`);
      assert.ok(steps.includes(`${q.from}>${q.to}`), `${kind} pipe ${q.id} runs ${q.from} -> ${q.to}, against its loop`);
    }
  }
});

test("pipes run only across and down, and start and end on the parts they join", () => {
  for (const kind of KINDS) {
    const p = M.PLANTS[kind];
    for (const q of [...p.pipes, ...p.branches]) {
      for (let i = 0; i + 1 < q.pts.length; i++) {
        const [a, b] = [q.pts[i], q.pts[i + 1]];
        assert.ok(a[0] === b[0] || a[1] === b[1], `${kind} ${q.id} segment ${i} is diagonal`);
      }
      assert.ok(onEdge(comp(p, q.from), q.pts[0]), `${kind} ${q.id} does not start on ${q.from}`);
      if (q.to === "edge") assert.ok(q.pts.at(-1)[0] >= M.CUTAWAY_W - 2, `${kind} ${q.id} does not reach the edge`);
      else if (comp(p, q.to)) assert.ok(onEdge(comp(p, q.to), q.pts.at(-1)), `${kind} ${q.id} does not end on ${q.to}`);
    }
  }
});

test("every part and every pipe fits inside the picture", () => {
  for (const kind of KINDS) {
    const p = M.PLANTS[kind];
    for (const c of p.comps) assert.ok(c.x >= 0 && c.y >= 0 && c.x + c.w <= M.CUTAWAY_W && c.y + c.h <= M.CUTAWAY_H, `${kind} ${c.id}`);
    for (const q of [...p.pipes, ...p.branches]) for (const [x, y] of q.pts) assert.ok(x >= 0 && y >= 0 && x <= M.CUTAWAY_W && y <= M.CUTAWAY_H, `${kind} ${q.id}`);
  }
});

test("every plant makes steam for one turbine, and only steam pipes feed the turbine", () => {
  for (const kind of KINDS) {
    const p = M.PLANTS[kind];
    const withTurbine = loopsWith(p, "turbine");
    assert.equal(withTurbine.length, 1, kind);
    assert.equal(withTurbine[0].medium, "water", kind);
    for (const q of p.pipes.filter((q) => q.to === "turbine")) assert.equal(q.temp, "steam", `${kind} ${q.id}`);
  }
});

test("PWR: closed primary loop. Core, steam generator, pump and pressurizer. The turbine is on the secondary side.", () => {
  const p = M.PLANTS.pwr;
  for (const kind of ["vessel", "sg", "pump", "pressurizer"]) assert.ok(p.comps.some((c) => c.kind === kind), kind);
  const primary = loopsWith(p, "vessel");
  assert.equal(primary.length, 1);
  assert.deepEqual(primary[0].path, ["vessel", "sg", "rcp", "vessel"], "hot leg to the SG, crossover to the RCP, cold leg to the vessel");
  assert.ok(!primary[0].path.includes("turbine"), "primary water never reaches the turbine");
  const surge = p.branches.find((b) => b.from === "pzr");
  const hotLeg = p.pipes.find((q) => q.id === surge.to);
  assert.equal(hotLeg.from, "vessel");
  assert.equal(hotLeg.to, "sg", "the pressurizer surge line joins a hot leg");
  assert.equal(p.coreFlow, "up");
});

test("BWR: one open loop from the vessel to the turbine, no steam generator, recirculation through the vessel", () => {
  const p = M.PLANTS.bwr;
  assert.ok(!p.comps.some((c) => c.kind === "sg"), "no steam generator");
  const main = loopsWith(p, "vessel").find((l) => l.path.includes("turbine"));
  assert.ok(main, "the water that cools the core drives the turbine");
  assert.deepEqual(main.path, ["vessel", "turbine", "condenser", "fwpump", "vessel"]);
  assert.ok(p.loops.some((l) => l.id === "recirc" && l.path.includes("vessel")));
});

test("only the BWR sends core coolant to the turbine", () => {
  for (const kind of KINDS) {
    const p = M.PLANTS[kind];
    const coreLoops = loopsWith(p, "vessel");
    const direct = coreLoops.some((l) => l.path.includes("turbine"));
    assert.equal(direct, kind === "bwr", kind);
  }
});

test("radioactive salt never reaches the steam generator: salt plants have an intermediate loop", () => {
  for (const kind of ["msr", "msfr", "fhr"]) {
    const p = M.PLANTS[kind];
    const core = loopsWith(p, "vessel");
    assert.equal(core.length, 1, kind);
    assert.ok(!core[0].path.includes("sg"), `${kind} core loop reaches the SG`);
    const sgLoops = loopsWith(p, "sg").filter((l) => !l.path.includes("turbine"));
    assert.equal(sgLoops.length, 1, `${kind} has one salt loop into the SG`);
    const shared = core[0].path.filter((id) => sgLoops[0].path.includes(id));
    assert.equal(shared.length, 1, `${kind} the two salt loops meet at one heat exchanger`);
    assert.equal(comp(p, shared[0]).kind, "hx");
  }
});

test("pebble bed: helium goes down through the bed, through a separate steam generator, back by the blower", () => {
  const p = M.PLANTS.pebble;
  assert.equal(p.coreMedium, "helium");
  assert.equal(p.coreFlow, "down");
  assert.deepEqual(loopsWith(p, "vessel")[0].path, ["vessel", "sg", "blower", "vessel"]);
});

test("MSR and MSFR carry fuel in the salt and can drain it: the MSR through a freeze valve", () => {
  for (const kind of ["msr", "msfr"]) {
    const p = M.PLANTS[kind];
    assert.equal(p.coreMedium, "fuelSalt");
    assert.ok(p.comps.some((c) => c.kind === "drain"), kind);
    assert.ok(p.branches.some((b) => b.from === "vessel" && b.to === "drain"), kind);
  }
  assert.equal(M.PLANTS.msr.moderator, "graphite");
  assert.equal(M.PLANTS.msfr.moderator, "none", "the fast reactor has no graphite");
});

test("Cherenkov blue only in a hot core cooled by a clear liquid", () => {
  const want = { pwr: true, bwr: true, fhr: true, pebble: false, msr: false, msfr: false };
  for (const kind of KINDS) {
    assert.equal(M.cherenkov(M.PLANTS[kind], true), want[kind], kind);
    assert.equal(M.cherenkov(M.PLANTS[kind], false), false, `${kind} cool`);
  }
});

test("the containment holds the PWR primary, and the turbine is outside it", () => {
  for (const kind of ["pwr", "bwr"]) {
    const p = M.PLANTS[kind];
    const box = p.containment;
    const inside = (c) => c.x >= box.x && c.y >= box.y && c.x + c.w <= box.x + box.w && c.y + c.h <= box.y + box.h;
    assert.ok(inside(comp(p, "vessel")), `${kind} vessel`);
    assert.ok(!inside(comp(p, "turbine")), `${kind} turbine`);
  }
  const p = M.PLANTS.pwr;
  const box = p.containment;
  for (const id of ["vessel", "sg", "rcp", "pzr"]) {
    const c = comp(p, id);
    assert.ok(c.x >= box.x && c.x + c.w <= box.x + box.w, id);
  }
});
