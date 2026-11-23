import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-res-"));
const entry = join(dir, "entry.ts");
writeFileSync(
  entry,
  `export * from ${JSON.stringify(join(root, "src/game/nightwatch/model.ts"))};\nexport * from ${JSON.stringify(join(root, "src/game/nightwatch/carryover.ts"))};\n`,
);
const out = join(dir, "res.mjs");
const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], {
  encoding: "utf8",
  cwd: root,
});
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
const W = await import(out);

const open = { residue: { valve: "open", tag: "open", dose: "open", log: "open" }, maintDone: true, shuffleDone: false, ended: null, weekLog: [] };
const ids = (n) => n.events.map((e) => e.def.id).sort();

test("each residue key has one more night consequence, and open adds none", () => {
  const base = W.newNight("pwr", 1, 4);
  const copy = W.newNight("pwr", 1, 4);
  W.applyCarry(copy, W.carryover(open, 1));
  assert.deepEqual(ids(copy), ids(base));
  assert.equal(W.carryover(open, 1).brewDelta, 0);
  assert.equal(W.carryover(open, 1).cut, null);

  const hidValve = W.carryover({ ...open, residue: { ...open.residue, valve: "hid" } }, 1);
  assert.ok(hidValve.radios.some((r) => r.text.includes("floor again")));
  const n1 = W.newNight("pwr", 1, 4);
  W.applyCarry(n1, hidValve);
  const weep = n1.events.find((e) => e.def.id === "valve-14");
  assert.equal(weep.start, 100);
  assert.ok(weep.def.escalate < 50);

  const caughtValve = W.carryover({ ...open, residue: { ...open.residue, valve: "caught" } }, 1);
  assert.ok(caughtValve.radios.some((r) => r.text.includes("repack is holding")));
  assert.ok(caughtValve.radios.some((r) => r.text.includes("still dry")));

  const n2 = W.newNight("pwr", 2, 4);
  const plain2 = ids(n2);
  W.applyCarry(n2, W.carryover({ ...open, residue: { ...open.residue, tag: "hid" }, maintDone: false }, 2));
  assert.ok(n2.events.some((e) => e.def.id === "tag-missing"));
  assert.ok(n2.events.some((e) => e.def.id === "tag-sticker" && e.start === 110 && e.def.escalate === 28));
  assert.ok(n2.events.some((e) => e.def.id === "feed-pump" && e.start === 150));
  const caughtTag = W.newNight("pwr", 2, 4);
  W.applyCarry(caughtTag, W.carryover({ ...open, residue: { ...open.residue, tag: "caught" } }, 2));
  assert.deepEqual(ids(caughtTag), plain2);
  assert.ok(caughtTag.carriedRadio.some((r) => r.text.includes("still on pump B")));

  const n3 = W.newNight("pwr", 3, 9);
  const before = n3.events.find((e) => e.def.accept.includes("radiation"));
  const start = before?.start;
  const esc = before?.def.escalate;
  W.applyCarry(n3, W.carryover({ ...open, residue: { ...open.residue, dose: "hid" } }, 3));
  const after = n3.events.find((e) => e.def.accept.includes("radiation"));
  if (start !== undefined) {
    assert.equal(after.start, Math.max(15, start - 45));
    assert.ok(after.def.escalate < esc);
  }
  assert.ok(n3.carriedRadio.some((r) => r.text.includes("Dosimeter")));
  const doseOk = W.carryover({ ...open, residue: { ...open.residue, dose: "caught" } }, 3);
  assert.ok(doseOk.radios.some((r) => r.text.includes("agrees")));
  assert.equal(doseOk.cut, null);

  const logged = W.newNight("pwr", 1, 4);
  const brews = logged.brewsLeft;
  W.applyCarry(logged, W.carryover({ ...open, residue: { ...open.residue, log: "hid" } }, 1));
  assert.equal(logged.curt, true);
  assert.equal(logged.brewsLeft, Math.max(1, brews - 1));
  const kept = W.carryover({ ...open, residue: { ...open.residue, log: "caught" }, weekLog: [{ text: "Caught the valve." }] }, 1);
  assert.ok(kept.radios.some((r) => r.text.includes("Caught the valve.")));
  assert.ok(kept.radios.some((r) => r.text.includes("kept the line")));
  assert.equal(kept.curt, false);
});
