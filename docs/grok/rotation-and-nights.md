# Grok Build: the night rotation, and Night Watch at full quality

## START HERE: this is a build task, start executing now

**This is a build request to carry out, not a document to summarise.** Do not reply with a plan, a summary or questions. Run step 0 immediately, then work through the parts in order. The owner is not watching and will not answer questions.

### Step 0 (run now; Claude already made the branch)

Claude created **`g/rotation-nights`** for you: `g/nw-plates` with `c/crew-outage-1118` merged in, plus `docs/audit/2026-11-21-rotation/PROGRESS.md`. Do not merge or rebuild anything. Just:

```sh
git fetch origin g/rotation-nights          # small: you already have g/nw-plates
git checkout -B g/rotation-nights origin/g/rotation-nights
cat docs/audit/2026-11-21-rotation/PROGRESS.md
```

Then start the first item marked `todo`.

### The 25-second rule (why the last turns died)

Each of your commands must finish in **under 25 seconds**. The repo is about 130 MB, and the full test suite takes about 2 minutes, so:

- **Never run the full test suite in the foreground.** After each item, run only the Night Watch tests:
  ```sh
  ESBUILD=node_modules/.bin/esbuild node --test scripts/nightwatch*.test.mjs
  ```
  That takes about 2 seconds. Add the new test files you write.
- **Anything long goes in the background with a log,** and you check the log in short reads:
  - the full suite: `nohup sh -c "ESBUILD=node_modules/.bin/esbuild node --test 'scripts/**/*.test.mjs'" > /tmp/suite.log 2>&1 &`
  - `npm run build`;
  - every Playwright run.
- **Never fetch or clone the whole repo again.** Fetch only `g/rotation-nights`.
- **Read only what the current item needs.** Do not read the whole brief and all of the Night Watch code before your first commit. Read the part you are on, then the files that item touches.

### Checkpoints: commit and push after every part

The work is long, and your turn may end or time out at any point. Protect it:

1. Do the parts **in order: A → B → C → D → E → F.** Each part is one checkpoint.
2. At the end of each part:
   - start the full suite in the background and record its totals in `PROGRESS.md` when it finishes (the 9 baseline failures only);
   - mark the part `done` in `PROGRESS.md`, with one line on what changed and anything skipped;
   - commit as `Part X: <what>`;
   - `git push origin g/rotation-nights`.
3. **Inside a big part** (A, B, C), also commit and push after each checkbox item, so at most one item can be lost.
4. Never leave work only in the sandbox. Pushed means safe.

### Resuming

If the owner sends "continue":
1. Run step 0 again (fetch and check out `g/rotation-nights`).
2. Read `PROGRESS.md`.
3. Start at the first part not marked `done`, at the first unchecked item.

Do not redo finished parts.

### If something blocks you

- Write it in `PROGRESS.md` as `blocked: <reason>`.
- Skip to the next item, and keep going.
- Only stop when every part is `done` or `blocked`.

- **Owner:** JawhnnyB.
- **Brief by:** Claude, 21 November 2026.
- **Owner's go-ahead:** "give Grok a big to do list to properly execute this."
- **Base:** `g/nw-plates` (bf21d05). First merge in `c/crew-outage-1118`, which carries this file.
- **Work branch:** `g/rotation-nights`.

**Rules (all of them, every time):**
- Do not merge to `main`. Do not post GitHub reviews or comments.
- **Frozen files, never edited:** `src/game/sim.ts`, `shuffleModel.ts`, `schematicMath.ts`, `save.ts`, `DelayGame.tsx`. `content.ts` is near-frozen: do not change story text or day structure.
- **Save format does not change.** All new progress is stored as flags in `s.flags`.
- Playthroughs use real clicks and keys. Test hooks only for clearly labelled setup.
- Evidence goes in the repo.
- Finish the whole list without stopping to ask. Where something cannot be done, say so plainly. Never fake a result.

---

## The vision, in one paragraph

You work a real plant rotation:
1. **Five day shifts.** The story week as it exists today.
2. **Days off.** A short interlude, because the fatigue rules require the break.
3. **Four night shifts** at the plant's watch desk.

The nights are the back half of a 12-hour night shift: you hold the desk from 00:00 to the 06:00 turnover with Elena.

**What you did on days follows you onto nights.** A valve you hid weeps on camera at 02:00. The maintenance you skipped trips a pump.

At the desk, the feeds are the one realistic, eerie part of the game. The job is noticing:
- **Events** grow, move gauges, and sometimes never flash at all.
- **Oddities** are quiet and harmless. Reporting one is a false report.
- **Every morning** Elena walks your log and shows you what you missed.

---

## Part A: fix what the last pass got wrong (visual quality)

The visibility check (≥ 0.4% of the frame changes) was written for **events**. Oddities were meant to be faint, and the last pass made several of them loud to clear the bar. Change the rule, then fix the drawings.

- [ ] **A1. Split the visibility rule in `scripts/nw-visible.mjs`:**
  - **Events:** ≥ 0.4% of the frame changes by ≥ 24 levels, in at least one of three frames.
  - **Oddities:** between 0.12% and 2.0%. Visible to someone looking, never loud. **Fail** on the high side too.
  - Write both columns to `visible.md`.
- [ ] **A2. Salt-cell `shadow` (oddity):** delete the outlined T boxes. Draw a soft humanoid silhouette behind the amber glass:
  - Darken 25–35% with a 6 px feathered edge, multiply blend.
  - Head, shoulders and torso only, about 70 logical px tall, standing at about x 228.
  - Sway ±1 px over 4 s. No outline, no rim light.
  - It must be **discoverable, not obvious.**
- [ ] **A3. Tunnel `condensate` (event):** delete the white sticks and balls. Draw:
  - 3–5 drips, each 1×2 logical px with a 4–6 px fading streak, falling from the steam-pipe undersides.
  - A dark wet patch on the floor under each, growing over the event's life. The patch carries the visibility, not the drips.
- [ ] **A4. Puddles** (containment, drywell, corridor):
  - Replace the white dashes with a wet sheen: the plate region under the puddle drawn darker (multiply about 0.7).
  - Add a soft, blurred highlight where a ceiling light would reflect, and keep the drip from above.
  - Grow it with the event (radius from development).
- [ ] **A5. Pool ripples and the tool-bag splash:** replace the white ellipse rings with 2–3 faint expanding rings at 10–15% opacity, slightly distorting the cells under them. Use a displaced copy of the plate strip, not lines.
- [ ] **A6. Discharge panel:** the green/red status bar floats off the panel. Measure the panel's dark status slot on the photo and move the bar onto it. Do the same check for the MSIV monitor bar, the freeze sign and every other code mark drawn on a photo. List each mark, its old and new rectangle, and a crop showing it sitting right.
- [ ] **A7. Hard hat on the wrong camera.** The `hardhat-corridor` oddity is on the turbine camera; the id says corridor and the plate exists for the corridor. This was Claude's bug.
  - Move it to camera `aux`. Oddities never flash, so this changes nothing in alarms.
  - Use the corridor hard-hat state plate. Delete the code hat on the turbine.
- [ ] **A8. Pressurizer sign:** the board is still about twice its words. Either crop the board in the photo to fit, or re-bake the words larger to fill it.
- [ ] **A9. The Cherenkov glow** reads as round lamps on a grid. Make it:
  - Light coming up **out of** the cells: soft vertical gradients from cell openings, brighter at the bottom.
  - Varying per cell. Some cells empty and dark.
  - No discs.
- [ ] **A10. Intake screens** are round columns; real travelling screens are flat framed mesh panels in guide slots.
  - Regenerate the intake plate and the debris state together: same camera, same water.
  - Keep the old plate if the new one fails the anchor check. Say which.
- [ ] **A11. Shoot the before-and-after sheet** for every changed scene (`docs/audit/2026-11-21-rotation/visual/`).

---

## Part B: make noticing matter (gameplay)

Today only a reactor trip or three false reports end a night. A player who reacts only to flashing cameras misses every silent event and still passes. Fix the incentives so both halves of the game count.

- [ ] **B1. Night grade.** Add `grade(score)` in `nightwatch/model.ts`, returning A, B, C, D or F. Start from 100:

  | Item | Change |
  | --- | --- |
  | Event caught before its alarm (early) | +6 |
  | Event caught after its alarm | +2 |
  | Event missed (ran its course) | −18 |
  | Finding (day shift found it) | −10, in addition to the miss |
  | False report | −8 |
  | Trip | the night is failed: F |

  - Clamp the score to 0–100. Grade bands: A ≥ 95, B ≥ 85, C ≥ 72, D ≥ 60, F below.
  - Worked check: night 1 played flash-only (2 caught late, 1 silent miss that became a finding) is 100 + 4 − 28 = 76, a C. A sweeper catching all 3 early stays at 100, an A.
  - Keep the arithmetic in one table at the top of the file, so it is tunable.
  - Unit test the edges.
- [ ] **B2. What a grade does.** Store the best grade per night as a flag, `night:N:grade:A` and so on.
  - A night counts as **done** only at C or better. D or F means Elena relieves you and the night must be stood again.
  - **Elena's trust:** A +3, B +2, C +1, D 0, F −2. This replaces the flat +2. Use the existing `bumpTrust`.
  - The night summary shows the grade, and the line that grade earns from Elena (write 5 lines in her voice, one per grade, in `nightwatch/turnover.ts`).
- [ ] **B3. The 06:00 turnover (the teaching moment).** Replace the bare summary with Elena's turnover sheet. For each event, in time order:
  - Time it began, camera, title, and how it ended: caught early, caught late, missed, or finding.
  - For **missed** events, a small still of that camera **at the minute it began**, re-rendered with `paintCamera` and its visuals at that time (deterministic), with one line: "It was on CAM03 from 02:12. You looked at CAM03 0 times after that."
  - Count the views from a per-camera view log you add to the night: minutes on each camera.
  - Then the oddities you correctly left alone ("You left the chair. Good."), and any false reports.
  - It must fit a phone screen and scroll.
- [ ] **B4. Teach scanning on night 1.** Night 1 always has one silent event (door or tool bag) at about 01:10, and Jordan's radio nudges it once at +6 minutes: "Jordan: aux corridor door looked wrong on my way past. Can you check the camera?" Nights 2–4 never nudge.
- [ ] **B5. Tension, not tedium:**
  - Coffee drain stays the cost of scanning.
  - Add **"camera fatigue"**: the same feed watched for over 4 continuous game minutes slowly loses contrast, about 15% at most. It recovers when you switch.
  - This rewards sweeping the cameras. Never make it hide an event fully.
- [ ] **B6. Two policy bots** in `scripts/nw-bots.mjs`, Playwright, on the production build, real clicks:
  - **Flash-only:** reacts only to flashing cameras and red tiles.
  - **Sweeper:** cycles every camera about every 3 game minutes and reports what differs from its first look at that camera.
  - **Required outcomes, nights 1–4, two seeds each:**
    - Flash-only averages C or worse and never gets an A.
    - Sweeper averages B or better.
    - Neither gets more than one false report a night on average.
  - If the numbers say otherwise, tune B1 or the event timings, not the bots. Record the table.

---

## Part C: the rotation (where and when the nights happen)

**Decision (Claude's recommendation, taken by the owner's go-ahead):** keep the 5 story days unchanged, then days off, then 4 nights. A true 4-on/4-on needs the frozen files and is **out of scope.**

- [ ] **C1. From the ending into the rotation.** On the ending screen (`GameApp.tsx`, `mode === "ending"`, `data-testid="paper-ending"`), add a primary button **"Rotate to nights"** (`data-testid="rotate-nights"`) above "New week".
  - Pressing it sets `rot:nights` = true.
  - It then opens the days-off interlude (C2).
  - "New week" keeps working as today.
- [ ] **C2. Days off.** A short full-screen paper card (`data-testid="days-off"`), in the game's style, not the camera realism:
  - "Three days off. You sleep wrong for two of them."
  - Plus one line chosen from the week: `s.ended === "a"`, or `s.hides >= 3`, or the default. Write 3 lines.
  - Then a small grey line: "Fatigue rules: no more than 16 hours on in any 24, and at least 34 hours off in any 9 days."
  - One button: "Report for nights" (`data-testid="report-nights"`).
- [ ] **C3. The watch desk is a place.** Nights start from the rotation, not from the desktop app.
  - **Night opener card:** "18:00 turnover. Quiet board. At midnight the watch desk is yours." Then the shift begins at 00:00 as today.
  - **After each night:** turnover sheet (B3), then "Sleep" → the next night's opener.
  - **After night 4:** a closing card at the lot at dawn (C6).
  - **Track progress with flags only:**
    - `rot:night` = the current night number;
    - `night:N:done`, and the grade flags from B2.
  - **Reloading** a save mid-rotation resumes at the next night's opener.
- [ ] **C4. The desktop Night Watch app becomes "Replay nights."** Before the rotation starts it says "Your night rotation starts after this week." and offers nothing. After a night is done, it lets you replay that night. Replays never change trust or grade flags. Keep the Plant Monitor app as it is.
- [ ] **C5. Four nights, not five.** Retune `NIGHTS` to 4 entries:

  | Night | Events | Oddities | escalateScale | Brews | Role |
  | --- | --- | --- | --- | --- | --- |
  | 1 | 3 | 2 | 1.3 | 3 | teaching night, one silent event plus the nudge (B4) |
  | 2 | 4 | 3 | 1.1 | 2 | |
  | 3 | 5 | 4 | 1.0 | 2 | |
  | 4 | 6 | 4 | 0.85 | 1 | the finale (C7) |

  - Old saves with `night:5:done` are harmless: ignore the flag.
- [ ] **C6. Dawn after night 4.** A paper card at the lot, the same style as the ending:
  - one of 3 lines by the average grade;
  - Elena's last turnover line;
  - "New week" (same as the ending's) or "Menu".
- [ ] **C7. The finale.** Night 4 adds one scripted, site-specific event at about 04:30 that stacks two camera cues and one gauge, using existing kinds and categories only (no new rules):
  - PWR: the door ajar on aux **plus** the pool level dropping.
  - Each other site gets the nearest equivalent pair from its own event list.
  - Name it in the turnover sheet.

---

## Part D: the day week follows you onto nights (the lifeline)

Read only existing state: `s.residue` (`valve`, `tag`, `dose`, `log`: open, caught or hid), `s.maintDone`, `s.shuffleDone`, `s.hides`, `s.catches`, `s.ended`, `s.trust`, `s.flags`.

Add `carryover(s): NightSeed` in `nightwatch/carryover.ts`. It feeds `newNight` as **extra or changed events**, never new rules, and is deterministic.

- [ ] **D1. `residue.valve`:**
  - **`hid`:** night 1 gains "Valve 14 packing weeping" (category leak, camera aux or the site's nearest), starting 01:40, escalating 30% faster.
  - **`caught`:** at 00:20 Jordan says "Valve 14 repack is holding."
  - **`open`:** neither.
- [ ] **D2. `residue.tag`:** **`hid`** gives night 2 "Clearance tag missing on feed pump B" (category access, turbine camera). It appears as a missing yellow tag on the pump, as a state plate or a small code mark sitting on the photo.
- [ ] **D3. `residue.dose`:** **`hid`** brings night 3's radiation event 45 minutes earlier and adds Jordan: "Dosimeter's been chirping near the aux stairs."
- [ ] **D4. `residue.log`:**
  - **`hid`:** Elena's turnover lines are curt all rotation, from a second set of 5 lines.
  - **`caught`:** she reads one line of your day log back to you on night 1.
- [ ] **D5. `maintDone`:** **false** guarantees the feed-pump-B trip event on night 2 at about 02:30.
- [ ] **D6. `shuffleDone`:** **true** gives night 4 a Plant Monitor note at 00:05: "First nights on the new core." Purely flavour.
- [ ] **D7. Crew warmth from the ending:**
  - **`s.ended === "a"`:** Jordan's radio uses his warm set.
  - **`"c"`:** his terse set.
  - Write both sets, about 8 lines each, in `nightwatch/model.ts` next to `radio()`.
- [ ] **D8. Show the thread.** The turnover sheet marks carried-over events with a small "from days" tag, so the player sees cause and effect.
- [ ] **D9. Unit tests:** each residue value produces exactly the change above; a fresh week with no residue produces the plain night; carryover is replayable for the same save.

---

## Part E: polish

- [ ] **E1. Sound:**
  - A soft two-tone chime when a camera starts flashing.
  - A radio squelch on each radio line.
  - The hum ducks under Elena's turnover.
  - All Web Audio, through the master mute. No new files over 50 KB.
- [ ] **E2. Reduced motion:** with `prefers-reduced-motion`, keep the rolling bar and switching static but at 30% strength, and drop camera fatigue (B5).
- [ ] **E3. Phone:** the turnover sheet, the days-off card and the opener cards at 390×844 with no sideways scroll; buttons ≥ 44 px.
- [ ] **E4. Copy pass.** Every new line in the game's voice:
  - short sentences;
  - no exclamation marks;
  - plant words used correctly (turnover, rounds, tag-out, finding).
  - Put every new player-visible line in one list in the evidence README, for the owner to approve.

---

## Part F: proof

- [ ] **F1. Tests:**
  - Everything passes except the 9 known baseline failures (listed in `docs/grok/night-watch-imagine.md` §7). **No new failures.**
  - New tests cover B1, B2, C3 resume-from-save, C5, and every D item.
- [ ] **F2. Build:** `npm run build` and `npm run typecheck` pass. Serve the **built** game the way the last pass did (Nitro), and say why `vite preview` cannot.
- [ ] **F3. Full rotation playthrough on the production build, real input, at 1280×720:**
  1. Play the story week to the ending with hooks only for labelled setup. Set residue `valve: hid` and `maintDone: false`, so D1 and D5 fire.
  2. Rotate to nights, then the days-off card.
  3. Nights 1–4 played by the **sweeper** policy.
  4. Turnover sheets, the dawn card.
  5. Reload the save between nights 2 and 3 and show it resumes at night 3's opener.
  6. Screenshots of every card and every turnover sheet.
- [ ] **F4.** The same at 390×844 for nights 1 and 4.
- [ ] **F5. Bot table** from B6.
- [ ] **F6.** `visible.md` from A1.
- [ ] **F7. Frame time:** `paintCamera` at 4× slower CPU, and main-thread busy % with the tablet up, before and after. Stay at or under the last pass's numbers (about 8 ms per feed frame).

**Evidence** goes in `docs/audit/2026-11-21-rotation/`, with a README that says what was checked, what was not, and the list of new lines for approval.

---

## Report back

Plain words, short. Cover:
- What changed in each part (A–F), and the bot table.
- The grade each night got in F3.
- What you could not do and why.
- The branch and commit. **Not merged.**
- Commit messages end with your own attribution, not Claude's.
