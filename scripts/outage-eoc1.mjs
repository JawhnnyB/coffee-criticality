// After scripts/outage-calibrate.mjs: deplete the plant's real Cycle 1 to its measured end (327.2 EFPD) with the
// preset set, and write each assembly's burnup to src/game/outage/eoc1.ts, so the outage opens without waiting.
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-eoc1-"));
const entry = join(dir, "entry.ts");
writeFileSync(entry, ["core", "preset", "calibration"].map((f) => `export * from ${JSON.stringify(join(root, `src/game/outage/${f}.ts`))};`).join("\n"));
const out = join(dir, "m.mjs");
const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], { encoding: "utf8" });
if (built.status !== 0) throw new Error(built.stderr);
const M = await import(out);
const set = M.presetSet(M.PRESET_FIT, "");
const r = M.runCycle(M.beavrsCycle1(), set, 0.5, 40, M.MEASURED.eocEfpd.cycle1);
const burnup = r.eoc.map((a) => (a ? +a.burnup.toFixed(4) : 0));
writeFileSync(
  join(root, "src/game/outage/eoc1.ts"),
  `/** Written by scripts/outage-eoc1.mjs from the preset and calibration. Assembly burnup (GWd/tHM) at the end of BEAVRS Cycle 1, 327.2 EFPD, row-major 15×15. */\nexport const PRESET_EOC1: number[] = ${JSON.stringify(burnup)};\n`,
);
const fuel = burnup.filter((b, i) => M.isFuel(i));
console.log(`wrote eoc1.ts: core average ${(fuel.reduce((a, b) => a + b, 0) / fuel.length).toFixed(3)} GWd/t, max ${Math.max(...fuel).toFixed(2)}`);
