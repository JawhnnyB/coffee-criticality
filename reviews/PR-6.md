---
pr: 6
author: C
reviewer: G
verdict: request-changes
reviewed_sha: 76efb42095a6b3ad3b637087e7ac987a4754ae90
---

## What I checked

- [x] Scope matches the PR description. Docs, templates, and four screenshots. No game code. The earlier review record is still the only file under `reviews/`.
- [x] Frozen numbers. This diff does not change a value. I compared the new list in `docs/REVIEW.md` with the handoff's frozen list and with `finishDay` / `beginEndingWalk` in `src/game/sim.ts`. The formula matches the code. One frozen rule is missing from the list (finding 1).
- [x] `npm test` on this head and on `main`: both 65 tests, 56 pass, 9 fail, same nine names (`cabinet-rewards`, `desk-verdict`, and the seven platform-chrome cases). `scripts/teaching-lab.test.mjs` passes here (`ok 55`). The audit's note that it fails where `npx` cannot reach the registry matches that file: it shells out to `npx esbuild`. Not a regression.
- [x] Typecheck on this head: exit 0. No new TS2304, TS2552, TS2305, or TS2724.
- [x] Screenshots in `docs/audit/` are 1100×720 (three of them) and 390×844. They show the bench, Compare, and the phone bench. Claims I can measure match: blue sliders, vector schematic, SVG text about 9 / 8 px tall at 1100 and 5 / 4 px at 390, Compare content 987 px in a 720 px frame with all four plants reachable. No page errors on the live bench at those sizes.
- [x] Decisions. Branch protection is still the owner's choice, A recommended, and settings are not changed. The 100% power start is left to the owner.

## Findings

1. **Blocks.** [docs/REVIEW.md](docs/REVIEW.md) lines 11–20. The list says it is the whole frozen set, and it is not. The handoff's last frozen rule is missing: `incidentResolved` means "the day is over," not a catch flag. `beginDay` already resets that flag (`src/game/sim.ts` line 824) and does not clear residue, which is why the two rules are separate. Add that sentence. Without it, a later PR can turn the flag into a catch marker and a reviewer using only this list will not stop it.

These do not block. The three items from the review at `1981889` are fixed. Label font, HTML label size, and the Compare card are now under "Checked and not a finding," and the measurements match what I read on the live bench. Finding 2's sizes are bounding boxes, not SVG user units. The schematic text is already `CCPixel3x5`; the break is the fractional scale and the 4–9 px height, which is what finding 2 now says. Findings 1, 3, and 4 still match `ReactorTrainer.tsx`. The four pngs are in the commit at the sizes the audit names. The ending formula in the frozen list matches `sim.ts` lines 787–789 and 863–864.

## Verdict reason

The audit is now accurate and the test lists match, but the frozen list this PR installs is still one rule short of the list it claims to replace.
