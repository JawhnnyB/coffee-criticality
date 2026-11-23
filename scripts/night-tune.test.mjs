/**
 * A careful first night: tablet up, report a camera only once its own gauge is out,
 * follow Jordan on night 1, and file one false report on the oddity.
 * Later nights do not file that false report.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-tune-"));
const entry = join(dir, "entry.ts");
writeFileSync(entry, `export * from ${JSON.stringify(join(root, "src/game/nightwatch/model.ts"))};\n`);
const out = join(dir, "tune.mjs");
const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], {
  encoding: "utf8",
  cwd: root,
});
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
const W = await import(out);

function ownAlarm(n, e) {
  if (n.minute < e.start || e.caughtAt !== null || e.doneAt !== null) return false;
  if (!Object.keys(e.def.effect).length) return false;
  const a = W.alarms({ ...n, events: [e] });
  return Object.keys(e.def.effect).some((id) => a.includes(id));
}

function careful(site, night, seed) {
  const n = W.newNight(site, night, seed);
  let lied = false;
  while (!n.over) {
    const hot = n.events.find((e) => ownAlarm(n, e));
    if (hot) {
      n.camera = hot.def.camera;
      W.report(n, hot.def.accept[0]);
    } else if (night === 1) {
      const silent = n.events.find(
        (e) =>
          (e.def.id === "lhra-door" || e.def.id === "pool-fme") &&
          e.caughtAt === null &&
          e.doneAt === null &&
          n.minute >= e.start + 6 &&
          n.minute < e.start + e.def.escalate,
      );
      if (silent) {
        n.camera = silent.def.camera;
        W.report(n, silent.def.accept[0]);
      } else if (!lied) {
        const odd = n.oddities.find(
          (o) =>
            n.minute >= o.start &&
            n.minute < o.end &&
            !n.events.some((e) => e.def.camera === o.def.camera && n.minute >= e.start && e.caughtAt === null && e.doneAt === null),
        );
        if (odd) {
          n.camera = odd.def.camera;
          W.report(n, "foreign");
          lied = true;
        }
      }
    }
    if (n.over) break;
    W.tick(n, 1);
  }
  return n;
}

test("a careful first-timer gets a B on night 1 and a C on night 4", () => {
  const lines = [];
  for (const site of ["pwr", "bwr", "pebble", "msr"]) {
    for (const seed of [1, 3, 7]) {
      const n1 = careful(site, 1, seed);
      const g1 = W.grade(n1);
      lines.push(`${site} night 1 seed ${seed}: ${g1.points} ${g1.letter} false ${n1.falseReports}`);
      assert.equal(g1.letter, "B", lines.at(-1));
      assert.equal(n1.falseReports, 1, lines.at(-1));
      const n4 = careful(site, 4, seed);
      const g4 = W.grade(n4);
      const silents = n4.events.filter((e) => Object.keys(e.def.effect).length === 0).length;
      lines.push(`${site} night 4 seed ${seed}: ${g4.points} ${g4.letter} silent ${silents} false ${n4.falseReports}`);
      assert.equal(silents, 1, lines.at(-1));
      assert.equal(n4.falseReports, 0, lines.at(-1));
      assert.equal(g4.letter, "C", lines.at(-1));
    }
  }
  console.log(lines.join("\n"));
});
