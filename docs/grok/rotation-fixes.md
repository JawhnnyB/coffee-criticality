# Grok Build: rotation fix pass (after Claude's playthrough)

- **Owner:** JawhnnyB.
- **Review by:** Claude, 21 November 2026, on `g/rotation-nights` at a18a305.
- **Branch:** keep working on `g/rotation-nights`.

**Rules:**
- Do not merge to `main`. Do not post GitHub reviews or comments.
- **Frozen files, never edited:** `sim.ts`, `shuffleModel.ts`, `schematicMath.ts`, `save.ts`, `DelayGame.tsx`. Story text in `content.ts` stays as it is.
- The save format does not change; progress is stored as flags in `s.flags`.
- Real clicks and keys only, with hooks for clearly labelled setup.
- Commit messages end with your own attribution.

## START HERE: a build task, start executing now

Do not reply with a plan or a summary. The owner is not watching.

```sh
git fetch origin g/rotation-nights
git checkout -B g/rotation-nights origin/g/rotation-nights
cat docs/audit/2026-11-21-rotation/PROGRESS-2.md
```

Start at the first item marked `todo`. **The same rules as last pass:**
- Every command finishes in under 25 seconds.
- After each item, run only `ESBUILD=node_modules/.bin/esbuild node --test scripts/nightwatch*.test.mjs` (about 2 s).
- The full suite, `npm run build` and every Playwright run go in the background with `nohup … > /tmp/x.log 2>&1 &`, and you read the log in short checks.
- Commit and push after **every** item, and mark it `done` or `blocked: <reason>` in `PROGRESS-2.md`.
- If the owner says "continue", run the three commands above and carry on.

## What Claude found

Claude played the rotation in a browser on the built game, with real input after labelled setup: from the week's ending, Rotate to nights, days off, then night 1 played twice. One run was **flash-only** (reacts to flashing cameras and red tiles only). The other was a crude **sweeper**. Logs, the script (`rot.mjs`) and screenshots are in `docs/audit/2026-11-21-rotation/claude-review/`.

**Working:**
- The ending's **Rotate to nights** button.
- The days-off card and the opener.
- Grades, and the grade arithmetic: the flash-only run scored 76, a C. That matches the brief's worked example.
- "You left the hard hat. Good."
- The missed-event line: "It was on CAM06 from 01:10. You looked at CAM06 0 times after that." That line is the heart of the game. Keep it.

**Broken (P0, fix in this order):**

- [ ] **R1. Nothing is saved after the week ends.** Right after a graded night, `hasSave()` was `false`. After a reload the menu's **Continue** was disabled. A player who closes the tab loses the rotation, every grade and Elena's trust.
  - **Cause:** `writeSave` (frozen `save.ts`) refuses to write in the `ending` mode, and nothing in the rotation asks it to write anyway.
  - **Fix without touching `save.ts`:**
    1. When **Rotate to nights** is pressed, move the game into a mode that can be saved: `play` at the dusk lot, the way `beginEndingWalk` leaves it.
    2. While `rot:nights` is set, make sure **no world input reaches the sim**. Keys 1–8, Space, B, R and E must only drive the night UI. Gate this in `GameApp`'s input handling: no walking, no interacting, no pause menu under the overlay.
    3. Call `writeSave(s, true)` at every rotation step: rotate, report for nights, start of a night, end of a night (after the grade and trust are written), sleep, dawn.
  - **Prove it** with a real tab reload, then **Continue**, at three points:
    - after days off;
    - after night 1's turnover (lands on night 2's opener, grade and trust still there);
    - after dawn.

  Setting the flags by hook does not count as proof.
- [ ] **R2. The turnover sheet is about 20 px tall at 1280×720.** It sits under the shift layout, so you see the tablet face down and a thin strip. See `turnover-1280-flash.jpg` and `turnover-sheet-element-20px.jpg`.
  - Make the 06:00 turnover its own full card on top of the shift, like the days-off card: a paper card, a scrolling list, and the **Sleep** button pinned at the bottom.
  - Shoot it at 1280×720, 1440×900 and 390×844 with a night that has a miss, so the still and the look-count show.
- [ ] **R3. A relieved night passes.** The sweeper made 3 false reports. The header said "02:19. Elena takes the chair", but the sheet said Grade C and the night counted as done.
  - **Being relieved is an F:** night not done, trust −2.
  - Any event still open when you are relieved counts as **missed.** Today relief at 02:19 leaves the pressurizer event "open" with no penalty, so relief is an escape hatch.
  - Elena's C line, "You made six", must only show when the night reached 06:00. Give a relieved night its own line.
  - Add a unit test for each of these.
- [ ] **R4. The header says "NIGHT 2" while night 1's turnover is on screen.** `nightNo` is recomputed from the flags the moment night 1 is marked done. Freeze the night number when the shift mounts.
- [ ] **R5. Leaving mid-night is a free retry.** "Back to the desk" during a rotation night leaves without a grade, so a player can bail out of a bad night and start it fresh.
  - In the rotation, rename it **Leave the watch**, ask "Leave the watch? Elena will log it as relieved." with Yes and No, and on Yes treat it as R3 (F).
  - **Replays keep today's behaviour.**
- [ ] **R6. Dawn → Menu probably cannot reach the menu.** `NightRotation` draws whenever `rot:nights` is set, whatever the mode, so the dawn card stays over the menu. Claude read this in the code; it is not confirmed in a browser.
  - **Confirm it in a browser.**
  - **Fix:** after dawn, set `rot:complete`.
    - With `rot:complete`, the overlay draws only the dawn card, and only when the player chooses Continue.
    - The menu shows normally.
    - **New week** behaves as today.
- [ ] **R7. A repeated night looks like a new one.** After a D or F, the opener should read "Night N, again. Elena wants it stood properly.", not the plain opener.

## Gameplay (P1)

- [ ] **R8. Reporting an event you already logged is punished.**
  - **What happened:** the sweeper logged the tool bag early, which was correct. When the crew then removed the bag, the picture changed again, and the next report on that camera was a false report. The same thing happened on aux.
  - **Rule:** a report on a camera whose current event is already logged, or was logged within the last 20 game minutes, answers "Already logged. The crew is on it." No penalty, no points.
  - Reports of a genuinely new event on that camera still count.
  - Add a unit test.
- [ ] **R9. A test-only fast clock,** so bots and full playthroughs fit in the background:
  - Add `__controlsTest.setNightSpeed(n)`. It multiplies `SECONDS_PER_MINUTE`'s inverse for the current shift only.
  - It is never reachable from the UI. Label every use of it as setup in the scripts.
  - Check that coffee drain, brewing, fatigue and escalation all scale with it, so an 8× night plays like a 1× night.
- [ ] **R10. Bot table (B6 and F5), at 8×, in the background.** Two policies, nights 1–4, two seeds each.
  - **Flash-only:** start from Claude's `rot.mjs` "flash" policy.
  - **Sweeper:** must be a fair player, not Claude's crude one, which got itself relieved:
    - Cycle every camera about every 3 game minutes.
    - Compare a 32×18 thumbnail with that camera's last look.
    - Take a new baseline after every report and after every camera switch-back.
    - Skip cameras with an event already logged in the last 20 minutes.
    - Guess the category from red tiles, else from the camera (aux → access, pool → foreign, otherwise equipment).
  - **Report** a table of grade per night and seed, false reports, early catches and misses. Targets from the brief:
    - flash-only averages C or worse;
    - sweeper averages B or better;
    - one false report or fewer per night on average.
  - If the targets fail, **tune the game (B1 points or event timing), not the bots,** and say what you changed.
- [ ] **R11. The full rotation (F3 and F4) with the fast clock.**
  1. Labelled setup: `bootPlay`, `beginEnding`, about 3 s of real walking on the lot, then click `close-shift`. That reaches the ending, as `rot.mjs` does.
  2. Real input from there: Rotate to nights → days off → nights 1–4 with the sweeper → turnovers → dawn.
  3. A real reload and **Continue** between nights 2 and 3.
  4. Run it at 1280×720, and at 390×844 for nights 1 and 4.
  5. Screenshot every card and every turnover.
- [ ] **R12. Prove the day week reaches the nights in a browser,** not only in unit tests:
  - Add a labelled test hook `setResidue(key, how)` and `setMaintDone(bool)`.
  - Run night 1 with `valve: hid` and show the Valve 14 event on camera and on the turnover with "from days".
  - Run night 2 with `maintDone: false` and show the feed pump B trip at about 02:30.

## Polish (P2)

- [ ] **R13. Copy:** put every line changed in R3, R5, R7 and R8 in the README list for the owner's approval.
- [ ] **R14. Run the full suite once at the end,** in the background. The only failures allowed are the 9 baseline ones. Record the totals.

## Report back

Plain words, short. Cover:
- R1–R14: done or blocked.
- The bot table.
- The grade of each night in R11.
- Whether reload and Continue worked at all three points.
- The branch and commit. **Not merged.**
