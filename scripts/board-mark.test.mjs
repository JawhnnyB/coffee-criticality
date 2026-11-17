import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(mkdtempSync(join(tmpdir(), "cc-board-")), "board.mjs");
const built = spawnSync(
  process.env.ESBUILD ?? "npx",
  [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/boardMark.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`],
  { encoding: "utf8", cwd: root },
);
if (built.status !== 0) throw new Error(built.stderr || built.stdout || "esbuild failed");
const M = await import(out);

const MARKS = ["open", "caught", "hid"];

test("days 1 to 4 tell open, caught, and hid apart, and a hide is never a catch", () => {
  const expect = {
    1: {
      open: ["14-B OPEN", "14-R CLOSED", "!= 14-B", false],
      caught: ["14-R CLOSED", "14-R CLOSED", "CAUGHT", true],
      hid: ["14-B OPEN", "14-R CLOSED", "HID", false],
    },
    2: {
      open: ["2A IN SVC", "2A IN SVC", "CHECK", false],
      caught: ["2A LOCKED", "2A LOCKED", "CAUGHT", true],
      hid: ["2A IN SVC", "2A IN SVC", "HID", false],
    },
    3: {
      open: ["40 mSv/h", "40", "CHECK", false],
      caught: ["0.04 mSv/h", "0.04", "CAUGHT", true],
      hid: ["40 mSv/h", "40", "HID", false],
    },
    4: {
      open: ["NO INITIALS", "- 07:12", "BLANK", false],
      caught: ["LOG SIGNED", "SIGNED", "CAUGHT", true],
      hid: ["YOUR NAME", "YOUR NAME", "HID", false],
    },
  };
  for (const day of [1, 2, 3, 4]) {
    for (const mark of MARKS) {
      const face = M.boardFace(day, mark);
      const [line, mid, foot, leaf] = expect[day][mark];
      assert.equal(face.line, line, `day ${day} ${mark} line`);
      assert.equal(face.paperMid, mid, `day ${day} ${mark} mid`);
      assert.equal(face.paperFoot, foot, `day ${day} ${mark} foot`);
      assert.equal(face.leaf, leaf, `day ${day} ${mark} leaf`);
      if (mark === "hid") {
        assert.equal(face.leaf, false);
        assert.notEqual(face.paperFoot, "CAUGHT");
      }
    }
  }
});

test("day 5 is the same picture for open, caught, and hid", () => {
  const faces = MARKS.map((mark) => M.boardFace(5, mark));
  assert.deepEqual(faces[0], faces[1]);
  assert.deepEqual(faces[1], faces[2]);
  assert.equal(faces[0].line, "SHUFFLE DAY");
  assert.equal(faces[0].leaf, false);
  assert.equal(faces[0].paperFoot, "DAY");
});

test("the four residue fields are the four days, and day 5 has none", async () => {
  const cout = join(mkdtempSync(join(tmpdir(), "cc-key-")), "content.mjs");
  const cbuilt = spawnSync(
    process.env.ESBUILD ?? "npx",
    [...(process.env.ESBUILD ? [] : ["esbuild"]), join(root, "src/game/content.ts"), "--bundle", "--platform=node", "--format=esm", `--outfile=${cout}`],
    { encoding: "utf8", cwd: root },
  );
  if (cbuilt.status !== 0) throw new Error(cbuilt.stderr || cbuilt.stdout || "esbuild failed");
  const C = await import(cout);
  assert.deepEqual(
    [1, 2, 3, 4, 5].map((d) => C.residueKey(d)),
    ["valve", "tag", "dose", "log", null],
  );
});
