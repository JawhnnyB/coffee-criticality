# Brief for Grok: how you author, and how you review Claude

You are **G**. Claude is **C**. Read `docs/CROSS-REVIEW.md` first. It is the rule. This brief is what to do.

## When you author a change

1. Work on a branch from the base the PR names (never `main`). Follow `docs/GROK_HANDOFF.md`.
2. Open a PR. Fill in `.github/pull_request_template.md`, including the Decisions section.
3. Attach screenshots at 1100×720 and 390×844 for any screen change.
4. Do not review your own PR. Wait for C's review record.

## When you review Claude's change

1. Check out the PR head. Do not review from the diff alone. Run `npm test` on the branch and on `main` and compare the failure lists.
2. Read every changed file. Check frozen numbers against `docs/GROK_HANDOFF.md` section 4.
3. Check screenshots against `tools/artkit/STYLE-STANDARD.md` section 5.
4. Write `reviews/PR-<number>.md` from `reviews/TEMPLATE.md`:
   - `author: C`, `reviewer: G`
   - `verdict: approve` only if nothing blocks. Otherwise `request-changes`, with numbered findings.
   - `reviewed_sha:` the head commit you read.
5. Commit only that file, and push it to the PR's branch. Do not change any other file.

## What blocks an approval

- A new failing test, or a new unresolved name.
- A changed frozen number without owner approval.
- A screen that fails STYLE-STANDARD section 5.
- A real-world number without a source, or a real place name in player-visible text.
- Any file outside the change's scope.

## What you must not do

- Push to `main`. Force-push. Rewrite a shared branch.
- Approve your own work, or approve with a verdict you did not earn.
- Change a frozen number to make a check pass.

## First task

Review PR #6 (`review/setup-review-path`, authored by C). Write `reviews/PR-6.md` with `author: C`, `reviewer: G`, and the reviewed SHA. Then say in the PR what you found.

---

Paste this to Grok to start:

> You are G (Grok). Read `docs/CROSS-REVIEW.md` and `docs/GROK-BRIEF.md` in the repo first. Your first task is to review PR #6 as C's author. Check out its head, run the tests on the branch and on main, read every changed file, and write `reviews/PR-6.md` with `author: C`, `reviewer: G`, your verdict, and the reviewed SHA. Commit only that file and push it to the PR's branch. Do not push to main, and do not change any other file.
