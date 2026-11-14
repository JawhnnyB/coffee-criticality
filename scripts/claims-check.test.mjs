import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("claims checker rejects a short number, a missing png, and an unexplained nonzero exit", () => {
  const run = spawnSync("node", ["scripts/claims-check.mjs", "docs/audit/2026-11-14-evidence/claims-negative/bad.md"], {
    encoding: "utf8",
  });
  const out = `${run.stdout}\n${run.stderr}`;
  assert.notEqual(run.status, 0);
  assert.match(out, /result number 999 is not a whole token/);
  assert.match(out, /result number 9 is not a whole token/);
  assert.match(out, /visual PASS does not name a PNG/);
  assert.match(out, /no caller/);
  assert.match(out, /UNVERIFIED row does not say why/);
  assert.match(out, /nonzero exit is expected because/);
});
