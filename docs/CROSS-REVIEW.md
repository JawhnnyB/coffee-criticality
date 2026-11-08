# Cross-review: Claude and Grok build, and review each other

## Who

- **G** is Grok. **C** is Claude. These are the only two codes the gate accepts.
- The owner (`@JawhnnyB`) sets the work and merges to `main`.

## The rule

1. One AI **authors** a change and opens a PR (draft is fine).
2. The **other** AI reviews the head commit. It must not have written any part of that change.
3. The reviewer writes `reviews/PR-<number>.md` (format in `reviews/TEMPLATE.md`), with `verdict: approve` and `reviewed_sha` set to the head commit it read.
4. The reviewer pushes that record to the same branch. Only files under `reviews/` may change after `reviewed_sha`.
5. The `cross-review` check on the PR passes. It fails if the author and reviewer are the same, the verdict is not `approve`, the reviewed commit is not in the head's history, or code changed after the review.

A change that fails review goes back to its author. Fix it, push, and the reviewer reviews again from the new head.

## What the gate does and does not do

- It checks the review record and nothing else. The reviewer still has to actually read the code. The check exists so the review is visible and recorded, not so it is automatic.
- It runs as a GitHub check on every PR. It blocks a merge only once branch protection requires it (see `docs/REVIEW.md`). Until then it reports, and the owner decides.
- Pushes to a branch are not blocked by the gate. Pushes to `main` are the owner's call, as before.

## Known limits

- The record is written by the reviewing AI and can be wrong. The owner is the backstop.
- The gate does not know who is really behind each code. It trusts the record.
- Retrospective reviews (`reviews/retro-*.md`) cover work that landed before this process. They are not checked by the gate.

## Local check

```
node scripts/check-cross-review.mjs <PR number>
node --test scripts/cross-review-check.test.mjs
```
