import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "cc-paper-"));
const entry = join(dir, "entry.ts");
writeFileSync(entry, `export { paperLines, writePaper, readPaper } from ${JSON.stringify(join(root, "src/game/nightwatch/paper.ts"))};\n`);
const out = join(dir, "paper.mjs");
const built = spawnSync(process.env.ESBUILD ?? "npx", [...(process.env.ESBUILD ? [] : ["esbuild"]), entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`], {
  encoding: "utf8",
  cwd: root,
});
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
const P = await import(out);

const open = { valve: "open", tag: "open", dose: "open", log: "open" };

test("the paper is the week's choices, short, and not the week save", () => {
  const thin = P.paperLines({ grades: [], hides: 0, ended: null, shuffleDone: false, discharged: false, dischargeMatch: false, ...open });
  assert.deepEqual(thin, ["A thin paper. Not much was written down."]);
  const full = P.paperLines({
    grades: ["A", "A", "A", "A"],
    hides: 1,
    ended: "a",
    shuffleDone: true,
    discharged: true,
    dischargeMatch: true,
    ...open,
    log: "hid",
  });
  assert.ok(full.includes("Nights A A A A."));
  assert.ok(full.includes("Four quiet nights."));
  assert.ok(full.includes("The map was signed. The discharge matched."));
  assert.ok(full.includes("The week held."));
  assert.equal(full.some((l) => l.includes("!")), false);
  for (const line of full) assert.ok(line.length <= 78, line);
  assert.ok(full.length <= 6);
  const stood = P.paperLines({ grades: ["B", "F", "", ""], hides: 3, ended: "c", shuffleDone: true, discharged: true, dischargeMatch: false, ...open });
  assert.ok(stood.includes("A night was stood again."));
  assert.ok(stood.includes("Three things were not said."));
  assert.ok(stood.includes("The map was signed. The discharge did not match."));
  assert.ok(stood.includes("The week ended early."));
  store.clear();
  P.writePaper(full);
  assert.deepEqual(P.readPaper(), full);
  assert.equal(store.has("cc.save.v2"), false);
  assert.equal(store.has("cc.paper"), true);
});
