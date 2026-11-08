#!/usr/bin/env node
// Cross-review gate. A PR may merge only when one AI authored it and the other AI reviewed the
// head commit. Rules live in docs/CROSS-REVIEW.md. Usage: node scripts/check-cross-review.mjs <PR number>
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const AI = new Set(["G", "C"]);

/** Parse the `key: value` frontmatter between the first two `---` lines. */
export function parseRecord(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const out = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].trim();
  }
  return out;
}

/**
 * @param {string} text   contents of reviews/PR-<n>.md
 * @param {object} ctx
 * @param {number} ctx.prNumber
 * @param {string} ctx.headSha
 * @param {(sha:string, head:string)=>boolean} ctx.isAncestor
 * @param {(sha:string, head:string)=>string[]} ctx.changedSince  paths changed from sha to head
 * @returns {{ok:boolean, reasons:string[]}}
 */
export function checkRecord(text, ctx) {
  const reasons = [];
  const r = parseRecord(text);
  if (!r) return { ok: false, reasons: ["record has no frontmatter"] };
  if (String(r.pr) !== String(ctx.prNumber)) reasons.push(`pr is "${r.pr}", expected ${ctx.prNumber}`);
  if (!AI.has(r.author)) reasons.push(`author must be G or C, got "${r.author}"`);
  if (!AI.has(r.reviewer)) reasons.push(`reviewer must be G or C, got "${r.reviewer}"`);
  if (r.author === r.reviewer) reasons.push("author and reviewer are the same AI; review must come from the other one");
  if (r.verdict !== "approve") reasons.push(`verdict is "${r.verdict}", must be "approve"`);
  if (!r.reviewed_sha) {
    reasons.push("reviewed_sha is missing");
  } else if (!ctx.isAncestor(r.reviewed_sha, ctx.headSha)) {
    reasons.push(`reviewed_sha ${r.reviewed_sha} is not in the history of the head`);
  } else {
    // Anything pushed after the review must be the review record itself.
    const later = ctx.changedSince(r.reviewed_sha, ctx.headSha);
    const stray = later.filter((p) => !p.startsWith("reviews/"));
    if (stray.length) reasons.push(`files changed after the reviewed commit: ${stray.join(", ")}`);
  }
  return { ok: reasons.length === 0, reasons };
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const pr = process.argv[2];
  if (!pr) {
    console.error("usage: check-cross-review.mjs <PR number>");
    process.exit(2);
  }
  const path = `reviews/PR-${pr}.md`;
  if (!existsSync(path)) {
    console.error(`No cross-review record at ${path}. Awaiting review by the other AI.`);
    process.exit(1);
  }
  const headSha = git(["rev-parse", "HEAD"]);
  const res = checkRecord(readFileSync(path, "utf8"), {
    prNumber: pr,
    headSha,
    isAncestor: (sha, head) => {
      try {
        execFileSync("git", ["merge-base", "--is-ancestor", sha, head]);
        return true;
      } catch {
        return false;
      }
    },
    changedSince: (sha, head) => {
      const out = git(["diff", "--name-only", `${sha}..${head}`]);
      return out ? out.split("\n") : [];
    },
  });
  if (res.ok) {
    console.log(`Cross-review OK for PR #${pr}.`);
  } else {
    console.error(`Cross-review FAILED for PR #${pr}:\n - ${res.reasons.join("\n - ")}`);
    process.exit(1);
  }
}
