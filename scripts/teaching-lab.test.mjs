#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("full-core and depletion change k and the OpenMC letter", () => {
  const out = join(mkdtempSync(join(tmpdir(), "cc-lab-")), "lab.mjs");
  const bundled = spawnSync(
    "npx",
    ["esbuild", join(root, "src/game/nuclearLab.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
    { encoding: "utf8", cwd: root },
  );
  if (bundled.status !== 0) throw new Error(bundled.stderr || bundled.stdout || "esbuild failed");
  const runner = join(dirname(out), "run.mjs");
  writeFileSync(
    runner,
    `
import { computeKeff, generateOpenMCPython } from ${JSON.stringify(out)};
const base = {
  type: "pwr", powerMW: 1100, dT: 32, flow: 100, enrich: 4.5,
  fuelTempK: 900, coolantTempK: 580, fuelDensity: 10.97, coolantDensity: 0.7,
  scale: "core", depletion: false, fullCore: false, reflector: false,
  burnupMWd_kg: 0, sizeClass: 1,
};
const k0 = computeKeff(base).kCore;
const k1 = computeKeff({ ...base, fullCore: true }).kCore;
const kInf0 = computeKeff(base).kInf;
const kInfD = computeKeff({ ...base, depletion: true, burnupMWd_kg: 20 }).kInf;
const py0 = generateOpenMCPython(base);
const pyF = generateOpenMCPython({ ...base, fullCore: true, scale: "core" });
const pyD = generateOpenMCPython({ ...base, depletion: true, burnupMWd_kg: 20 });
if (!(k1 > k0)) throw new Error("full-core should raise k_core " + k0 + " -> " + k1);
if (!(kInfD < kInf0)) throw new Error("depletion should poison kInf");
if (!py0.includes("TEACHING MODEL ONLY")) throw new Error("disclaimer missing");
if (!pyF.includes("n_assy = 7")) throw new Error("full-core lattice missing");
if (!pyD.includes("DEPLETE = True")) throw new Error("depletion stub missing");
if (py0.length < 400) throw new Error("export too short");
console.log(JSON.stringify({ k0, k1, kInf0, kInfD, n0: py0.length, nF: pyF.length, nD: pyD.length }));
`,
  );
  const r = spawnSync(process.execPath, [runner], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || "runner failed");
  const j = JSON.parse(r.stdout.trim().split("\n").at(-1));
  assert.ok(j.k1 > j.k0);
  assert.ok(j.kInfD < j.kInf0);
  assert.ok(j.nD > 400);
});
