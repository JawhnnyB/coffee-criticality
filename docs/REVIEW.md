# Review path

How a change gets from a branch to `main` in this repo.

## The rule

Every change reaches `main` through a pull request that the owner (`@JawhnnyB`, see `.github/CODEOWNERS`) reviews and merges. Nobody pushes to `main` directly, and nobody force-pushes a shared branch.

Grok, Claude, and any other contributor open a **draft** PR first, then mark it ready when the checklist in `.github/pull_request_template.md` is complete.

## Cross-review between the two AIs

Every change is authored by one AI (G for Grok, C for Claude) and reviewed by the other. The rules and the gate are in `docs/CROSS-REVIEW.md`. The review record lives at `reviews/PR-<number>.md`. The owner still decides what reaches `main`.

## What a reviewer checks

1. **Scope.** The PR does what its description says, and nothing else. Stacked PRs name the one that must merge first.
2. **Frozen numbers.** Compare the diff against the list in `docs/GROK_HANDOFF.md` section 4. Any change needs owner approval, linked in the PR.
3. **Tests.** Run `npm test` on the branch and on `main`. The two failure lists must match, except for tests the PR adds or fixes.
4. **Visuals.** Screenshots at 1100×720 and 390×844, checked against `tools/artkit/STYLE-STANDARD.md` section 5. Art changes also run `npm run art:check`.
5. **Decisions.** Each choice is recorded with its reason, and the choice is easy to reverse.

## What blocks a merge

- A new failing test, or a new unresolved name in the typecheck.
- A changed frozen number without approval.
- A screen that fails STYLE-STANDARD section 5 (blurred or fractional scaling, text over art, colours outside the palette, a second pixel font, a CRT or glow effect).
- A real-world radiation or regulatory number without a source the owner can check.
- A real place, company, or person in player-visible text.
- Any push to `main` that did not come through a reviewed PR.

## Current state, and the open decision

GitHub branch protection is **not** set on `main` (checked 2026-11-07). That means the rule above is enforced by convention only. Options for the owner:

- **A. Protect `main`, require one approval, allow the owner to bypass.** Keeps your own quick fixes possible.
- **B. Protect `main`, require one approval, no bypass.** Strictest. Your own pushes also need a PR.
- **C. Stay with convention.** Relies on everyone following this document.

Recommendation: **A**. It stops accidental pushes without locking you out. Nothing here changes repository settings until you choose.

## When a change is already on main

If a change lands on `main` without review, the owner decides whether to keep it, revert it with a new commit, or review it after the fact in a PR. History is never rewritten to hide it.
