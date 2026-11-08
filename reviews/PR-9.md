---
pr: 9
author: owner
reviewer: C
verdict: approve
reviewed_sha: 681e91162495a60330f812c8289c3b40a7311b69
---

## What I checked

- [x] Scope matches the PR: the bench seed moves from 100% to 62% power and rods (plant.ts seedRun, SEED_POWER_PCT), the seed test is updated, and the audit doc records the decision. Three files, nothing else.
- [x] The decision is the owner's, as recorded in the PR body and in docs/bench-style-audit.md. I did not change the percentage.
- [x] Frozen numbers unchanged: DT_BAND, DT_AT_UNIT, the flow floor, the scram limits, and the hold time are untouched.
- [x] Flow still comes from the plant design (seedRun keeps `flowPct = plant.flow`).
- [x] `npm test` on the head, in my sandbox: 83 run, 73 pass, 10 fail. The 10 are the same names as main. The seed test passes at 62.
- [x] Typecheck: no TS2304, TS2552, TS2305, TS2724, or TS2367.
- [x] The arithmetic in the audit doc holds: ΔT = (62 / 100) × 32 °C = 19.84 °C, shown as 19.8 °C. This matches the pinned value in thermal-state.test.mjs.
- [x] Searched src for other 100% seeds. The only other hit is a fixed reference point in the plant comparison card (ReactorTrainer.tsx:244), which is not a seed.

## Findings

1. Non-blocking, for the owner. At 62% power the PWR bench opens out of the ΔT band (19.8 °C against 28–36 °C). This is the intended drill. The player has to bring power up to get back in band, which the bench text already says.
2. Non-blocking, a gate mismatch. `scripts/check-cross-review.mjs` accepts only G or C as author, and this PR is owner-authored. This record says `author: owner` rather than assigning it to either AI, so the gate will report it as not satisfying the one-AI-author rule. The owner's merge decision stands on the owner's authority. Decide whether owner PRs should be exempt from the gate.

## Verdict reason

A one-value seed change, with the decision recorded where the owner asked for it, the arithmetic checked, and the test suite unchanged from main.
