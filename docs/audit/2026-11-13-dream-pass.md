# Dream pass — 2026-11-13

Branch `g/dream-1113` from `0d8e735` (`origin/c/walk-unblock`). Author G. Review is Claude's file, not this document.

Stopped after WP2. WP3 through WP9 were not started. The stop-lines are in `docs/OPEN-QUESTIONS.md`.

## Claims

| Claim | Command | Artifact | Result | Status |
|---|---|---|---|---|
| npm ci succeeds | `npm ci` | `docs/audit/2026-11-13-evidence/npm-ci.txt` | exit 0, 429 packages | PASS |
| Baseline tests are the known set, plus teaching-lab passing here | `node --test 'scripts/**/*.test.mjs'` | `docs/audit/2026-11-13-evidence/npm-test-before.txt` | 197 tests, 188 pass, 9 fail | PASS |
| Baseline tsc is clean | `npx tsc --noEmit --pretty false` | `docs/audit/2026-11-13-evidence/tsc-before.txt` | exit 0, empty stdout | PASS |
| Dev walk14 before the fix is 11 / 3 / 0 and 0 counted page errors | `node scripts/walk14.mjs docs/audit/2026-11-13-evidence/walk14-before` | that directory and `walk14-before-stdout.txt` | 11 pass, 3 pending-owner, 0 fail, 0 counted errors | PASS for the table. The 0 errors are the filter. See baseline doc. |
| Production boot before the fix throws React #419 | Playwright `pageerror` on the production server | `docs/audit/2026-11-13-evidence/pageerror-before.txt` | `Minified React error #419` | PASS |
| The throw is `window` at `GameApp.tsx` splash | dev server log | `docs/audit/2026-11-13-evidence/ssr-dev-before.txt` | `window is not defined` at `GameApp.tsx:1140` | PASS |
| After the guard, a production boot has no page error | same Playwright probe | `docs/audit/2026-11-13-evidence/pageerror-after.txt` | `(no page errors)` | PASS |
| Production server log after the fix has no render error | `grep` of `/tmp/dream-prod-after.log` | recorded in this file | `window is not defined` count 0, `Error in render` count 0 | PASS |
| Walk14 after the fix, production server | `node scripts/walk14.mjs docs/audit/2026-11-13-evidence/walk14-after` | that directory and `walk14-after-stdout.txt` | 11 pass, 3 pending-owner (2, 6, 13), 0 fail, 0 page errors at both widths | PASS |
| Tests after the two packages | `node --test 'scripts/**/*.test.mjs'` | `docs/audit/2026-11-13-evidence/npm-test-after.txt` | 201 tests, 192 pass, 9 fail. Same 9 names. | PASS |
| tsc after the two packages | `npx tsc --noEmit --pretty false` | empty file, exit 0 | 0 errors | PASS |
| Days 1–4 board text, and day 5 unchanged | `node --test scripts/board-mark.test.mjs` | `docs/audit/2026-11-13-evidence/new-tests.txt` | 3 pass | PASS |
| Server render of reduced-motion does not throw | `node --test scripts/reduced-motion.test.mjs` | same log | 1 pass | PASS |
| Hide and catch are different pictures | `node scripts/dream-room-shots.mjs screenshots/dream-1113` | `screenshots/dream-1113/02-hid-cafe-1280.png`, `02-caught-cafe-1280.png`, `room-shots.txt` | residue valve hid vs caught. Pillow difference bbox (50, 120, 876, 704), 4800 sampled changed pixels | PASS for "the pixels differ". The words are an owner visual check. |
| Board and paper read residue, not `incidentResolved` | `git grep` of the draw calls | `src/game/render.ts` calls `dayMark(s)` | both draws take `dayMark(s)` | PASS |
| `drawBoardA` / `drawPaperLog` were already on residue before this pass | read of `0d8e735:src/game/render.ts` | this file | the strings matched the slice-1 table except day 5 caught, which painted leaf | PASS |
| Nameplate is not drawn on this branch | search | `drawNameplate` has no caller | unused function | PASS |
| "Counter", "Shelf", "Window tab" are not in source | search of src and JSON | no matches | not found | PASS for "not in source". Whether they are baked into a PNG is UNVERIFIED. |
| Faces redrawn to the art rules | not run | none | not started | UNVERIFIED |
| Every desktop window measured for the inset | not run | the inset is not on this branch | not started | UNVERIFIED |
| Builder pixel plate | not run | none | not started | UNVERIFIED |
| Site plan redraw and SITE test | not run | none | not started | UNVERIFIED |
| News build script | not run | `news.json` still `[]` | not started | UNVERIFIED |
| Academy quiz on every tier 1 and tier 3 page | not counted | `content.ts` has `tier` fields. A `quiz:` field was not found by search | not a census | UNVERIFIED |
| `c/window-style` overlap list | not diffed | PR #24 left alone | not started | UNVERIFIED |

## What I saw in the two room shots

Both shots are the control room, not the cafe. The board and the paper log live there. The filenames are the ones the brief asked for.

Hide (`02-hid-cafe-1280.png`): gold `14-B OPEN` over the board. Paper log says `14-R CLOSED` and `HID` in the warning red. The card border is gold. The word `CAUGHT` is not on the card. The player stands on the floor in front of the board. A small white slip sits beside the head.

Catch (`02-caught-cafe-1280.png`): green `14-R CLOSED` over the board. Paper log says `14-R CLOSED` and `CAUGHT` in leaf green. The card border is green. The player stands on the brown chair. A small white slip sits on the board.

The player is not in the same spot. I did not cover the slip or the HUD. The paper-log words are readable in both. Owner visual check: whether that is "felt" is the owner's eye. The pixel diff says the files are not the same picture.

## Per package

### WP0

Not verified: a full production walk14 of the unfixed build. The #419 evidence is one page load.

No PASS here rests on my eye.

A false claim: treating the dev walk's "0 page errors" as "no React #419". The driver filters `window is not defined`.

### WP1

The splash `BootLog` read `window.matchMedia` during render. Server render threw. Dev showed the long message. Production minified it to #419, which the walk does not filter.

Fix: `systemReducedMotion()` returns false when `window` is missing. `GameApp.tsx` calls that. The preference still applies in the browser.

Not verified: a user who has "reduce motion" turned on. The node test only checks the server case.

What would make this false: a production boot whose `pageerror` is still #419. The after probe printed `(no page errors)`.

### WP2

`boardFace` is the text. `drawBoardA` and `drawPaperLog` paint it. Leaf only when the mark is `caught` and the day is 1–4. Day 5 is `SHUFFLE DAY` for open, caught, and hid, and it is not leaf. Before this pass, a caught day 5 painted leaf. That is the only picture change for day 5.

The four fields are `residueKey`: day 1 valve, 2 tag, 3 dose, 4 log, 5 none. The test checks that.

Steam audio was already `residue.valve !== "caught"` in `GameApp.tsx`. The `steam()` sprite in `pixel.ts` has no caller. I did not add one.

Not verified: maintenance hiss by ear. Not verified: days 2–4 as screenshots. The shots are day 1 only.

What would make the shot claim false: the two PNG files being byte-identical, or the hide card saying `CAUGHT`. They are not, and it does not.

### WP3–WP9

Not started.

## Hypotheses from the brief

- Residue is wired, and the two draw functions read it. Confirmed on `0d8e735`, before this pass.
- Ending formula was not touched.
- `g/heavy-pass-1113` files (`bowlModel.ts`, `lototoSlot.ts`, the window inset) are not on this branch.
- `LAMBDA` is `0.005`. The comment mentions `0.055`. Not changed.
- `news.json` empty and nine pending region slots: the existing tests still pass. Not edited.
- Goat faces, floating furniture words, and the builder plate were not changed.

## Frozen files

Not edited: `src/game/sim.ts`, `src/game/shuffleModel.ts`, `src/game/DelayGame.tsx`, `src/game/content.ts`, `src/game/schematicMath.ts`, `src/game/save.ts`.

## Screenshot index

| File | What it is |
|---|---|
| `screenshots/dream-1113/02-hid-cafe-1280.png` | Day 1 control room after Hide |
| `screenshots/dream-1113/02-caught-cafe-1280.png` | Day 1 control room after Report |
| `docs/audit/2026-11-13-evidence/walk14-before/` | Dev walk, before the splash fix |
| `docs/audit/2026-11-13-evidence/walk14-after/` | Production walk, after the splash fix |
