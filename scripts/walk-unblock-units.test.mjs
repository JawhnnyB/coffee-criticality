// Unit checks for the walk unblock: Core Map memory, the Local news engine, the NRC index search,
// and the background data. Each module is bundled the same way as the other game tests.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-unblock-"));

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

const CM = await bundle("coreMapMemory");
const SM = await bundle("shuffleModel");
const LN = await bundle("localNews");
const NI = await bundle("nrcIndex");

// ---- Core Map memory (spec 14.2, step 12)
test("the Core Map keeps its grid and swap count, and never sets shuffleDone", () => {
  const results = { daily: [], shuffleBest: null, coreMap: null };
  const start = CM.readCoreMap(results.coreMap);
  assert.equal(start.swaps, 0);
  assert.deepEqual(start.grid, SM.startMap(), "no saved grid starts from startMap()");

  const grid = start.grid.slice();
  for (const [a, b] of [[13, 21], [25, 35], [0, 8]]) [grid[a], grid[b]] = [grid[b], grid[a]];
  results.coreMap = CM.rememberCoreMap(grid, 3);

  // Close and reopen: the component reads the saved value again.
  const reopened = CM.readCoreMap(results.coreMap);
  assert.deepEqual(reopened.grid, grid, "the same grid comes back");
  assert.equal(reopened.swaps, 3, "the same swap count comes back");
  assert.equal(results.shuffleDone, undefined, "results never carries shuffleDone");
  assert.equal(SM.passes(SM.fluxOf(reopened.grid, 4.5), reopened.swaps), true, "the saved map still passes");
});

test("a corrupt saved Core Map is ignored, not loaded", () => {
  assert.equal(CM.sanitizeCoreMap(null), null);
  assert.equal(CM.sanitizeCoreMap({ grid: [0, 1], swaps: 3 }), null, "wrong length");
  assert.equal(CM.sanitizeCoreMap({ grid: SM.startMap().map((v, i) => (i === 0 ? 7 : v)), swaps: 3 }), null, "a cell outside 0-2");
  assert.equal(CM.sanitizeCoreMap({ grid: SM.startMap(), swaps: -1 }), null, "negative swaps");
  assert.equal(CM.sanitizeCoreMap({ grid: SM.startMap(), swaps: 1.5 }), null, "fractional swaps");
  const ok = CM.sanitizeCoreMap({ grid: SM.startMap(), swaps: 2 });
  assert.equal(ok.swaps, 2);
});

// ---- Local news engine (spec 10)
const POOL = [
  { id: "a", kind: "catch", text: "A catch on the board." },
  { id: "b", kind: "note", text: "A note.", seasons: ["fall"] },
  { id: "c", kind: "note", text: "Winter only.", seasons: ["winter"] },
  { id: "d", kind: "hide", text: "A hide on the board.", residue: "hide" },
  { id: "e", kind: "note", text: "Cautious only.", stances: ["cautious"] },
  { id: "f", kind: "note", text: "After day three.", minDay: 3 },
  { id: "g", kind: "catch", text: "Clean board catch.", residue: "clean" },
  { id: "h", kind: "note", text: "Another note." },
];
const ctx = (over = {}) => ({ seed: 7, season: "fall", stance: "steady", day: 1, residueHides: 0, ...over });

test("the shipped pool is empty, so the Local tab has nothing to show", () => {
  assert.deepEqual(LN.SHIPPED_LOCAL_POOL, []);
  assert.deepEqual(LN.pickLocal(LN.SHIPPED_LOCAL_POOL, ctx()), []);
});

test("same seed, same items; a different seed can change the order", () => {
  const a = LN.pickLocal(POOL, ctx({ seed: 42 })).map((i) => i.id);
  const b = LN.pickLocal(POOL, ctx({ seed: 42 })).map((i) => i.id);
  assert.deepEqual(a, b);
});

test("a pick is 3 to 5 items when the pool has enough eligible items", () => {
  for (let seed = 1; seed <= 40; seed++) {
    const n = LN.pickLocal(POOL, ctx({ seed })).length;
    assert.ok(n >= 3 && n <= 5, `seed ${seed} gave ${n}`);
  }
});

test("conditions on season, stance, day and residue are respected", () => {
  for (let seed = 1; seed <= 40; seed++) {
    const picked = LN.pickLocal(POOL, ctx({ seed, season: "summer", stance: "bold", day: 1, residueHides: 0 })).map((i) => i.id);
    assert.ok(!picked.includes("b"), "fall-only item not shown in summer");
    assert.ok(!picked.includes("c"), "winter-only item not shown in summer");
    assert.ok(!picked.includes("e"), "cautious-only item not shown for bold");
    assert.ok(!picked.includes("f"), "day-3 item not shown on day 1");
    assert.ok(!picked.includes("d"), "hide-only item not shown with a clean residue");
  }
  for (let seed = 1; seed <= 40; seed++) {
    const picked = LN.pickLocal(POOL, ctx({ seed, residueHides: 1 })).map((i) => i.id);
    assert.ok(!picked.includes("g"), "clean-only item not shown with a hide");
  }
});

test("a residue hide is never labelled as a catch", () => {
  assert.equal(LN.localLabel("hide"), "Hide");
  assert.notEqual(LN.localLabel("hide"), "Catch");
  for (let seed = 1; seed <= 40; seed++) {
    for (const item of LN.pickLocal(POOL, ctx({ seed, residueHides: 2 }))) {
      if (item.kind === "hide") assert.equal(LN.localLabel(item.kind), "Hide");
    }
  }
});

// ---- NRC index search (spec 9, step 6)
test("the NRC search finds only what is on screen", () => {
  const ids = (rows) => rows.map((r) => r.label);
  assert.deepEqual(ids(NI.filterNrc(NI.NRC_ROWS, "50")), ["Part 50", "Part 50 Appendix B", "Section 50.59"]);
  assert.deepEqual(NI.filterNrc(NI.NRC_ROWS, "dose"), [], "dose has no hit: no titles yet");
  assert.equal(NI.filterNrc(NI.NRC_ROWS, "").length, NI.NRC_ROWS.length, "an empty query shows every row");
  assert.equal(NI.NRC_ROWS.length, 11, "ten starter parts plus Part 73");
});

// ---- Background data (spec 12): nine pending slots, no value
test("the background data has nine pending slots and no value or number", () => {
  const raw = readFileSync(join(root, "public/data/background.json"), "utf8");
  const data = JSON.parse(raw);
  assert.equal(data.regions.length, 9);
  for (const r of data.regions) {
    assert.equal(r.status, "pending", r.id);
    assert.equal(r.valueMsvPerYear, undefined, r.id);
    assert.equal(/verified/i.test(JSON.stringify(r)), false, `${r.id} says verified`);
  }
  // The id and the label carry the slot number. Nothing else may hold a number.
  for (const r of data.regions) {
    const { id, label, ...value } = r;
    assert.equal(/\d/.test(JSON.stringify(value)), false, `${id} has a number in its value fields`);
    assert.equal(typeof value.status, "string");
    assert.ok(/^Region slot \d$/.test(label), `${id} label is the slot name`);
  }
});

test("the committed news list is empty", () => {
  assert.deepEqual(JSON.parse(readFileSync(join(root, "public/data/news.json"), "utf8")), []);
});
