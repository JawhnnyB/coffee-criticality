---
commit: 4ae6277
author: G
reviewer: C
verdict: request-changes
reviewed_sha: 4ae6277
---

Retrospective review. These commits reached `main` before this process existed. Recorded so the history shows a review. The gate script does not check `retro-*` files.

## What I checked

- Frozen numbers: no change in the diff (LAMBDA, N_MAX, ending formula, culture and trust values, tuned mini-game numbers).
- `npm test`: the same 10 failures as before the commits (og/platform, cabinet-rewards, desk-verdict). Passing tests went from 52 to 55.
- Typecheck: no TS2304, TS2552, TS2305, TS2724.
- Builds and runs with zero page errors at 1100×720 and 390×844.

## Findings

1. **Blocking. `writeRun` runs every animation frame** (`ReactorTrainer.tsx`, the rAF loop calls `writeRef.current({ powerPct })` each frame). It writes to the shared run each frame, which is cheap, but it is an unthrottled write on every frame. Throttle it to the open-minute sampling or write only on change.
2. **Blocking. `ensureRun` mutates state during render** (`GameApp.tsx`, `if (mode === "reactor") ensureRun(s);` in the render body). It is idempotent, but a side effect in render breaks React's model. Move it to the open handler, which already calls it.
3. **Question for the owner, not a code defect.** The bench seeds at 100% power, already inside the ΔT band. The old drill started at 62%. Decide before the next milestone.
4. **Not blocking.** The bench still has the style problems in `docs/bench-style-audit.md`. Those are a separate PR.

## Verdict reason

Correct and tested, and the frozen numbers are intact. Two blocking code-quality items (1 and 2) must be fixed in a follow-up PR before the next milestone builds on this.
