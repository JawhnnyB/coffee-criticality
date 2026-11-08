import assert from "node:assert/strict";
import test from "node:test";
import { checkRecord, parseRecord } from "./check-cross-review.mjs";

const rec = (over = {}) => {
  const f = { pr: 7, author: "G", reviewer: "C", verdict: "approve", reviewed_sha: "abc1234", ...over };
  const lines = Object.entries(f).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}: ${v}`);
  return `---\n${lines.join("\n")}\n---\n\nNotes.\n`;
};
const ok = { prNumber: 7, headSha: "head999", isAncestor: () => true, changedSince: () => ["reviews/PR-7.md"] };

test("parses frontmatter keys", () => {
  assert.deepEqual(parseRecord(rec()).author, "G");
  assert.equal(parseRecord("no frontmatter"), null);
});

test("passes when the other AI approved and only the record changed since", () => {
  assert.deepEqual(checkRecord(rec(), ok), { ok: true, reasons: [] });
});

test("fails when one AI reviews its own work", () => {
  const r = checkRecord(rec({ author: "C", reviewer: "C" }), ok);
  assert.equal(r.ok, false);
  assert.match(r.reasons.join(), /same AI/);
});

test("fails on an unknown code, not G or C", () => {
  const r = checkRecord(rec({ author: "A" }), ok);
  assert.match(r.reasons.join(), /author must be G or C/);
});

test("fails without an approve verdict", () => {
  assert.match(checkRecord(rec({ verdict: "request-changes" }), ok).reasons.join(), /must be "approve"/);
});

test("fails if code changed after the reviewed commit", () => {
  const r = checkRecord(rec(), { ...ok, changedSince: () => ["src/game/sim.ts", "reviews/PR-7.md"] });
  assert.equal(r.ok, false);
  assert.match(r.reasons.join(), /src\/game\/sim\.ts/);
});

test("fails if the reviewed commit is not in the head's history", () => {
  const r = checkRecord(rec(), { ...ok, isAncestor: () => false });
  assert.match(r.reasons.join(), /not in the history/);
});

test("fails when the record is for another PR", () => {
  assert.match(checkRecord(rec({ pr: 8 }), ok).reasons.join(), /expected 7/);
});
