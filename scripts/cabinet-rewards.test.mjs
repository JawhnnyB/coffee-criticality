#!/usr/bin/env node
// Cabinet rewards must not be buyable by replay. Before this change, every winning CATCH added a catch
// and every leisure win added culture, so the held ending (culture >= 28, reports + catches > hides)
// could be reached by playing cabinets. Culture now pays once per day per cabinet, CATCH adds no catch,
// and a good bowl or golf round pays its host trust.
import assert from "node:assert/strict";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(mkdtempSync(join(tmpdir(), "cc-cabinets-")), "sim.mjs");
// ESBUILD_PKG may point at esbuild's lib/main.js when the repo has no node_modules (sandbox).
const esb = await import(process.env.ESBUILD_PKG ? pathToFileURL(process.env.ESBUILD_PKG).href : "esbuild");
await esb.build({
  entryPoints: [join(root, "src/game/sim.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: out,
  loader: { ".png": "empty" },
  logLevel: "error",
  plugins: [
    {
      // chatter.ts and Chatter.tsx share a stem; resolve the module import to the lowercase .ts file.
      name: "chatter-stem",
      setup(build) {
        build.onResolve({ filter: /^\.\/chatter$/ }, () => ({ path: join(root, "src/game/chatter.ts") }));
      },
    },
  ],
});
globalThis.localStorage ??= { getItem: () => null, setItem() {}, removeItem() {} };
const S = await import(out);

function fresh(day = 1) {
  const s = S.createState();
  s.day = day;
  s.mode = "arcade";
  s.returnMode = "play";
  return s;
}

test("winning CATCH twice in one day pays culture once and adds no catch", () => {
  const s = fresh();
  const c0 = s.culture;
  S.finishArcade(s, 5, 10);
  assert.equal(s.culture, c0 + 6, "first win pays culture");
  assert.equal(s.catches, 0, "a CATCH win adds no catch credit");
  s.mode = "arcade";
  S.finishArcade(s, 5, 10);
  assert.equal(s.culture, c0 + 6, "second win the same day pays nothing");
  assert.equal(s.catches, 0);
});

test("CATCH culture pays again the next day", () => {
  const s = fresh(1);
  const c0 = s.culture;
  S.finishArcade(s, 5, 10);
  s.day = 2;
  s.mode = "arcade";
  S.finishArcade(s, 5, 10);
  assert.equal(s.culture, c0 + 12);
});

test("a losing CATCH run still reads as a lie, and its consolation pays once per day", () => {
  const s = fresh();
  const c0 = s.culture;
  S.finishArcade(s, 2, 0);
  assert.equal(s.culture, c0 + 2, "the first miss of the day pays the small consolation");
  assert.equal(s.flags.catchMiss, true);
  s.mode = "arcade";
  S.finishArcade(s, 1, 0);
  assert.equal(s.culture, c0 + 2, "repeat misses the same day pay nothing");
});

test("a delay survival pays culture once per day, not per replay", () => {
  const s = fresh();
  s.mode = "delay";
  const c0 = s.culture;
  S.finishLeisure(s, 9);
  s.mode = "delay";
  S.finishLeisure(s, 9);
  assert.equal(s.culture, c0 + 6);
});

test("a good bowl round pays Jordan trust and culture once", () => {
  const s = fresh();
  s.mode = "bowl";
  const c0 = s.culture;
  const t0 = s.trust.jordan;
  S.finishLeisure(s, 4);
  assert.equal(s.trust.jordan, t0 + 2, "host trust for a good round");
  assert.equal(s.culture, c0 + 4);
  s.mode = "bowl";
  S.finishLeisure(s, 4);
  assert.equal(s.culture, c0 + 4, "culture does not repeat the same day");
});

test("a good golf round pays Mabel trust; a poor one pays nothing", () => {
  const s = fresh();
  const m0 = s.trust.mabel;
  s.mode = "golf";
  S.finishLeisure(s, 1);
  assert.equal(s.trust.mabel, m0, "below the threshold pays no trust");
  s.mode = "golf";
  S.finishLeisure(s, 3);
  assert.equal(s.trust.mabel, m0 + 2);
});
