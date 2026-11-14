#!/usr/bin/env node
/**
 * Refuse a PASS that a reviewer cannot check from files in the repo.
 * Parses the claims table in docs/audit/2026-11-14-dream-pass-4.md.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const mdPath = join(root, "docs/audit/2026-11-14-dream-pass-4.md");
const text = readFileSync(mdPath, "utf8");
const failures = [];
const rows = [];

for (const line of text.split("\n")) {
  if (!line.startsWith("|")) continue;
  if (/^\|\s*-+/.test(line)) continue;
  const cells = line.split("|").slice(1, -1).map((s) => s.trim());
  if (cells.length < 5) continue;
  if (/^claim$/i.test(cells[0])) continue;
  rows.push({
    claim: cells[0],
    command: cells[1],
    artifact: cells[2],
    result: cells[3],
    status: cells[4],
    line,
  });
}

function pathsIn(cell) {
  return [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
}

function numbersIn(cell) {
  return [...cell.matchAll(/\d+(?:\.\d+)?/g)].map((m) => m[0]);
}

const banned = ["not used", "never", "no caller", "no call", "owner visual check"];

for (const row of rows) {
  const status = row.status;
  if (status !== "PASS" && status !== "UNVERIFIED") {
    failures.push(`${row.claim}: status ${JSON.stringify(status)} is not PASS or UNVERIFIED`);
    continue;
  }
  if (status === "UNVERIFIED") {
    if (row.result.trim().length < 24) {
      failures.push(`${row.claim}: UNVERIFIED row does not say why`);
    }
    continue;
  }
  const cited = pathsIn(row.artifact);
  if (!cited.length) {
    failures.push(`${row.claim}: PASS has no backticked artifact path`);
  }
  const bodies = [];
  for (const rel of cited) {
    const abs = join(root, rel);
    if (!existsSync(abs)) {
      failures.push(`${row.claim}: missing artifact ${rel}`);
      continue;
    }
    bodies.push(readFileSync(abs, "latin1"));
  }
  const blob = bodies.join("\n");
  for (const n of numbersIn(row.result)) {
    if (!blob.includes(n)) failures.push(`${row.claim}: result number ${n} is not in the artifact`);
  }
  const visual = cited.some((p) => p.endsWith(".png")) || /still/i.test(row.claim);
  if (visual) {
    const png = cited.filter((p) => p.endsWith(".png"));
    if (!png.length) failures.push(`${row.claim}: visual PASS does not name a PNG`);
  }
  const hit = banned.find((w) => row.line.toLowerCase().includes(w));
  if (hit) {
    const grep = /grep/i.test(row.command);
    const coversTree = (blob.match(/src\//g) || []).length >= 3 || /grep\s+-r/i.test(row.command);
    if (!grep || !coversTree) {
      failures.push(`${row.claim}: PASS says "${hit}" without a whole-tree grep or measurement`);
    }
  }
}

const pass = rows.filter((r) => r.status === "PASS").length;
const unverified = rows.filter((r) => r.status === "UNVERIFIED").length;
console.log(`rows ${rows.length}`);
console.log(`PASS ${pass}`);
console.log(`UNVERIFIED ${unverified}`);
console.log(`FAIL ${failures.length}`);
if (failures.length) {
  console.log("failures:");
  for (const f of failures) console.log(`- ${f}`);
}
process.exit(failures.length ? 1 : 0);
