# GROK HANDOFF: where the game is, what changed, and how to build the next step

For Grok Build, working in `coffee-criticality`. Read this first. It tells you what is already built, what the owner has decided, what is still open, and the order to work in. It does not replace the spec. It points at it.

## 0. Read these, in this order

1. `GROK_FEEL.md`: the week has to be visible. Its "Do not" list and the residue rules are binding.
2. `GROK_WORLD_100.md`: the world. Section F "Camera" is the in-world viewport. The new reactor window is called CORE CAM everywhere, so the two never get confused.
3. `GROK_ART_101.md`: the art rules.
4. `GROK_PHASES_1-4.md` (in this repo): the build spec for Parlor OS, CORE CAM, and the reactor-facing apps. Read every file it names in section 3 before you change anything.
5. This file, sections 1 to 4, then the milestone you are on.

If this file and `GROK_PHASES_1-4.md` disagree, the spec wins on app design and this file wins on what is already done. If either disagrees with the three game docs on game content, the game docs win, and you note the conflict in the PR.

## 1. Where the code is right now (verify, do not trust memory)

Base your work on **`origin/main`**. Do not base it on local `main`. See section 2.

| Branch | Commit | State | What it has |
|---|---|---|---|
| `origin/main` | `1601087` (and earlier) | On GitHub | Game-state and cabinet fixes, the Day-5 fuel shuffle fix (`639d78d`), the post-pass prototype behind `?postfx` (`c0c9da5`), cabinet replay caps and slower DELAY (`5e9f1e6`), and the approved cabinet and teaching fixes (`1601087`). |
| `feature/m1-shared-thermal` | `4c4bc93` | Draft PR #3 (base `main`) | One thermal function, `thermalState`, in `src/game/plant.ts`. The trainer calls it. Trainer numbers are unchanged. Test: `scripts/thermal-state.test.mjs`. |
| `feature/first-meeting-readability` | `96f36e0` | Draft PR #4 (base `feature/m1-shared-thermal`) | First-meeting dialogue rewritten. Intro text and labels made larger. The Priya speech column fixed. Lint: `scripts/first-meeting-lines.test.mjs`. Evaluation note: `docs/first-meeting-dialogue.md`. |
| `docs/grok-handoff` | this commit | Draft PR (base `feature/first-meeting-readability`) | This file and `GROK_PHASES_1-4.md`. |

Stacking note: PRs #3, #4, and the handoff PR form a stack. Merge them in order, or rebase them on `origin/main` after the owner decides section 2.

## 2. The owner must decide this before you merge anything

Local `main` has diverged from `origin/main`. Do not reset it, rebase it, or push over it.

- Local `main` has 2 commits that origin does not: `962feac` ("Turn the shore toward the player.") and `70767f1` ("Stand outside the shore, and keep the consequence."). Both by the owner, both dated 2026-10-25. They change `src/game/sim.ts` and `src/game/week.ts`, and they add a `.grok/` skills folder. The first of them, `962feac`, has no parent: it starts its own history.
- Origin `main` has 19 commits that local does not, all from 2026-10-27 and 2026-10-28.

Open question for the owner (write it in the PR, and use the default until answered): **Which history is canonical?** Default: `origin/main`. The two local commits are kept on their own branch and are not merged until someone compares the shore and week changes against the current `sim.ts` and `week.ts` by hand. Their GROK_FEEL-style changes may be needed. They may also conflict with the `beginDay` and residue rules.

## 3. What has been done, in plain terms

These facts were checked against the code on 2026-11-02.

- **Shared thermal model.** `plant.ts` now has `thermalState(plant, { powerPct, flowPct })` returning `dT`, `tCold`, `tHot`, `tFuel`, and `inBand`. It also has the teaching proxies `T_FUEL_RISE_AT_FULL` and `T_COLD_SLOPE`, each with a comment. The trainer uses it for its readouts and scram thresholds. Its output at 62% power and 100% flow is ΔT 19.84 °C, the same as before.
- **What is not done on the thermal side.** `ReactorTrainer.tsx` still keeps rods, flow, power, hold, and scram in local `useState`, and it still has its own plant-type selector. It does not run the designed plant. This is the central fix in spec section 5, and it is not done yet.
- **Dialogue.** The seven first-meeting scenes (Mabel, Elena, Tommy, Marcus, Jordan, Holt, Priya) are rewritten as plain speech. Stage directions are out of the spoken text and live only in camera fields and props. All trust, culture, and camera values are unchanged.
- **Readability.** The intro dialogue box is 10 canvas units of text (was 8), with 11 leading (was 9). It sits at `left: 78` and `width: 282`, which clears the portrait. Teach kickers and labels are 12 px with tracking (were 10 px with none). The Priya speech in the plant-type step wraps under a 3× portrait when its column is narrow.
- **Tests.** `thermal-state.test.mjs` (7 tests) and `first-meeting-lines.test.mjs` (4 tests) pass. `shuffle-model.test.mjs` passes with `ESBUILD` set. `cabinet-rewards.test.mjs` fails on `main` too, with `Cannot find package 'esbuild'`, because it imports a package that is not installed. Leave it alone and note it.
- **Typecheck.** No unresolved-name errors (TS2304, TS2552, TS2305, TS2724). Other errors come from missing React types in the sandbox.
- **Not started.** The spec's M1 desktop, setup, and boot screens, the save v2 format, Settings, Music, the Academy tiers, Radiation, NRC, News, the background map, and the impact audit. There is no `s.run` in `sim.ts` yet, and no `setup` or `desktop` state.

## 4. Non-negotiables (repeated from the spec, because breaking them is the most likely failure)

**Frozen. Do not change:**
- The ending formula: `hides < 3 && reports + catches > hides && culture >= 28`.
- The culture and trust values in `bumpTrust` and `bumpCulture`.
- `DELAY.CAB` `LAMBDA` and `N_MAX`.
- Any number already tuned in LOAD, ROD.BANK, PHYS.CAB, CATCH, or LOTOTO.
- `flags.hid`. It means "hid at least once." Do not reuse it.
- `residue` semantics: a hide leaves the lie up. `beginDay` does not clear residue. `incidentResolved` is "the day is over," not a catch flag.

If a feature seems to need one of these changed, stop. Write it as an open question in the PR, use the default, and keep going.

**Tone and look:** warm industrial, Stardew-like. Palette tokens only: cream `#f3e6d0`, copper `#c4783a`, leaf `#6b8f71`, ink `#16110d`, steel `#3d5c66`, gold `#c9a227`, wood `#6a4a32`. Check text contrast at 4.5:1 on every background. No red in art. No emoji in chrome. No letters on sprites.

**Stop-lines (write an open question and use the default):**
- A real-world value you cannot cite. Default: "Pending verification," never a guessed number.
- A real company, utility, paper, person, or city in fiction. Default: a fictional name, listed in the PR for the owner to check.
- Any runtime network call. Default: none. The only network access is the build-time news script.
- Copyrighted audio, image, or font. Default: original, procedural, or public domain, with a license for each file in a manifest.
- AI-generated text shipped in the game. Default: none in phases 1–4.
- Anything Microsoft-like. "Windows-esque" means the layout pattern only. The name "Parlor OS" lives in one constant.

**Academy calculus:** do not write any calculus content. Show a locked card: "Not in this build."

## 5. Open decisions the owner has not made yet

Write each as an open question in the PR, with the default. Do not block on them.

1. Which history is canonical (section 2). Default: `origin/main`.
2. Region placeholders. Start with one verified US Census division, and use placeholder town and paper names (default: Harrow Bend and The Harrow Bend Ledger). The owner checks names against real places before merge.
3. Music. The spec wants a manifest of at least four tracks, one per season, that are original or public domain. Default: procedural tracks until the owner supplies files. The music player must duck the procedural bed.
4. Background radiation values. Default: every region is `"pending"`. Only cite a source you can name and link (UNSCEAR, NCRP Report 160), and verify the report number and figures first.
5. NRC section titles and links. Default: "verify before publish." Build the index from the starter list in spec section 9. Do not write titles from memory.
6. News feeds. Default: World Nuclear News, the NRC news feed, and ANS Nuclear Newswire, each dropped if its feed is missing, non-public, or forbids reuse.
7. Whether "Show all apps" in Settings is off for players (default: off).

## 6. The process: what to do, in order

Work one milestone at a time, one branch and one PR each. Do not start a milestone until the previous one's Definition of Done passes. Never push to `main`. Never force-push. Never rewrite history.

### Step 0. Set up without touching anyone's history (about an hour)

1. `git fetch origin`. Create a branch from `origin/main`, or from `feature/first-meeting-readability` if you need the thermal and dialogue changes.
2. Run `npm install`, then `npm run typecheck`, then `npm test`. Note the failures that already exist. The spec says there are 8 og/platform failures on `main`, and `cabinet-rewards` also fails for the missing package. Do not add new ones.
3. Read every file in spec section 3. Read `sim.ts`'s `GameState`, `openCab`, and `finishBuilder`. Read `GameApp.tsx`, where `window.__controlsTest` is defined (around line 231). Use its hooks for screenshots and state (`bootPlay`, `setIntro`, `setBuild`, `openCab`, `setMinutes`, `warp`).

### Step 1. Finish M1: the shared run (spec section 5). This is the first real code change.

1. Add `run` to `GameState`, with the shape in spec section 5. Seed it from `s.plant` the first time a control app opens.
2. Move `scaleDt` and `tColdOf` out of `ReactorTrainer.tsx`. Make `thermalState` the only formula. The trainer, Reactor Control, CORE CAM, and Results will all call it.
3. Change Reactor Control to run `s.plant`. Remove the plant-type selector from the main view. Add the "Compare" card that shows all four types with their defaults. Mark this as a deliberate change in the PR, because the current trainer lets the player pick a type.
4. Only Reactor Control writes to `s.run`. Set `history` once per in-game minute while the control app is open, and once per in-game hour otherwise.
5. Put every teaching proxy in one table in `plant.ts`, each with a comment. Add the required test: `tFuel > tHot > tCold` whenever power is above zero.
6. Test: `thermalState` is monotone in power and flow. Use `scripts/thermal-state.test.mjs` as the model.

### Step 2. Save version 2 with migration (spec section 13)

1. Keep `SAVE_KEY = "cc.save.v1"` for reading. Write `cc.save.v2`. Set `SAVE_VERSION = 2`.
2. Migration fills defaults for `setup`, `run`, `desktop`, `results`, and `news`. Derive academy tiers from `academyDone`.
3. Keep `residue` exactly as `GROK_FEEL.md` defines it.
4. Test: create a real version 1 fixture from `origin/main`, and check every field, especially `residue`, `flags`, `plant`, `academyDone`, and `trust`.

### Step 3. The desktop shell, with no content yet

1. One constant for the name "Parlor OS."
2. An app registry that drives both the desktop and the phone layout. Apps do not know which frame they are in.
3. Window manager: title bar, drag, close, minimize to the taskbar, focus and z-order, minimum size, no dragging off screen.
4. Start menu and taskbar: app grid, open apps, clock (in-game time), season icon, sound toggle.
5. Phone layout under 720 px wide: apps open full-screen with a back control.
6. Keyboard routing: game keys on `window` fire only for the focused app. Shell keys (Escape closes a window) do not fire while a game is focused. Test every mini game with focus inside the desktop. This is a known trap.
7. Opening the desktop pauses in-world time. The existing pause key opens it.

### Step 4. Boot, sign-in, and setup (spec section 4.1 and 4.2)

1. Boot log: about 2.5 seconds, skippable by any key or click, final frame only under reduced motion.
2. Sign-in card: "Continue" if a save exists, or "New shift." No music until the first click.
3. Setup, for new shifts only: region (map of the nine divisions, only those with a verified value), season (Spring, Summer, Fall, Winter, fixed for this build), starting stance (Cautious, Steady, Bold, a display choice only), and the reactor (already chosen in the Builder).
4. Every setup choice must change at least three visible surfaces. Each choice shows a sentence saying what it will change.
5. Stance does not change trust or culture. Starting trust changes touch frozen numbers and need owner approval.

### Step 5. Apps for M1 (spec section 4.4)

Build these as apps, each wrapping an existing component, with its unlock and scores unchanged:
- Settings (section 4.5). Store in the save, not `localStorage`.
- Music (section 3 and decision 3). Ducks the procedural bed. Verify no two sources play at once.
- Reactor Control (step 1).
- Reactor Design (wraps `ReactorBuilder.tsx` and `NuclearDesk.tsx`).
- Academy, tier 1 wrap (`content.ts` `ACADEMY`, `AcademyQuiz`, `TeachFrame`).
- The mini games: LOAD.CAB, ROD.BANK, DELAY.CAB, PHYS.CAB, CATCH, LOTOTO, Bowl, Pebble, Golf, Horde. Route each through its existing `finish*` function. Do not reimplement.
- Mini game apps appear only after their in-world cabinet is found, using the same flags as today.

### Step 6. M1 Definition of Done

Run the spec's ten-minute walkthrough, steps 1–9 and 14 (spec section 14.4). Check at both 1100×720 and 390×844 with zero page errors. Then open the PR and list every changed file.

### Then M2 to M5

- **M2, Results, Core Map, CORE CAM** (spec sections 6 and 7). CORE CAM is a window onto the designed fuel, not a simulator. Glow and particles are teaching metaphors, and must be labeled as such. Results shows core health (four weighted components, never affecting the ending), burnup (show the honest, tiny number, and offer a labeled time-compressed view), a weekly trend, and "What to look at." Core Map has the shuffle mode, which reuses `shuffleModel.ts` without retuning it. Shuffles in Core Map never set `shuffleDone`.
- **M3, Academy tiers, radiation basics, NRC** (spec sections 8, 9, and the Basics tab of 12). Re-tag existing `ACADEMY` pages into tiers 1–3. Do not duplicate pages. Tier 1 has at least 12 pages, tier 3 at least 5. Radiation basics need cited numbers or none. NRC index is "verify before publish."
- **M4, News and background map** (spec sections 10, 11, 12). Build-time `scripts/fetch-news.mjs` writes `public/data/news.json`. The game must build with no network and use the committed file. The local news engine uses the save seed, never the real clock. A hide is never reported as a catch. Background map shows only verified values and "Pending verification" otherwise.
- **M5, Impact audit** (spec section 14.3). For each setup choice, load two saves that differ only in that choice, capture the same surfaces, and show the text and pixel differences in a table in the PR. Each choice changes at least three surfaces. A test confirms the frozen numbers match `main`.

## 7. Traps (from the spec, plus what I found)

1. **The trainer does not run the designed plant.** It takes only `site={type}` and keeps its controls in local state. Fix it in step 1.
2. **Game keys leak into the desktop.** Handlers on `window` fire while a desktop app is focused. Gate them by focus.
3. **Two music sources.** Ducking is required, or both play.
4. **Name collision.** Use CORE CAM, never "Camera," in labels and file names.
5. **Burnup looks broken.** The honest number is tiny at game-time scale. Say so on screen.
6. **Feeds break.** The build must succeed without the network.
7. **The news engine must not read the real clock.** Use the in-game day and the save seed.
8. **Region and season are set once, at setup.** They do not change mid-week.
9. **Stance is not a stat.** If stance seems to need a number, it is an open question.
10. **Intro layout depends on the canvas.** The intro paints on a 384×216 canvas (`NW`, `NH` in `introPaint.ts`). Text is positioned with `lineBox(zoom, y)`, where `zoom` is the on-screen scale. The portrait occupies roughly canvas x 21–71, so text must start at x ≥ 78. Check any change to these with a screenshot.
11. **Tailwind must be rebuilt before screenshots.** Without it, the screenshots come out blank. Run the Tailwind build after the app build.
12. **Teach labels use a pixel font at a fixed size.** Labels use `CCPixel3x5` at 12 px. That size was chosen for readability, not because it is a whole multiple of the font's native size, so glyphs may look uneven. If they do, try 10 or 15 px. Check any new label size on the cabinets, especially LOAD and the rod bank, before you ship it.

## 8. Verification, every milestone

- `npm run build`, then serve on port 8080. Use `scripts/shots.mjs` and `scripts/browser-smoke.mjs` as starting points for Playwright.
- `npm run typecheck`. Only new errors matter. Missing React types in a sandbox are expected.
- Load at 1100×720 and 390×844. Zero page errors and zero console errors. The audio autoplay warning is allowed.
- Every app opens, closes, and reopens without losing state.
- Every mini game returns its score to the same place its in-world cabinet does.
- Keyboard: every mini game works when opened from the desktop.
- New tests go under `scripts/`, use the `ESBUILD` environment variable (`ESBUILD=/opt/npm-tools/node_modules/.bin/esbuild` on this machine, or the local esbuild binary elsewhere), and never rely on `npx` reaching the network.

## 9. What to send back with each PR

- A summary of what changed, with the file list.
- The spec section numbers you implemented, and any you did not, with the reason.
- Test results: new tests, and the existing failures, unchanged.
- Browser check results with screenshots at both widths.
- Open questions, each with the default you used.
- For M5, the impact table.

Keep the PR description plain. No marketing copy.

## 10. Do not start these

- The AI bot for NRC regulations.
- The calculus tier of the Academy.
- A multi-year fuel-cycle calendar.
- City power as a game mechanic.
- Seasons that advance during play.
- Multiplayer.
- New rooms, portraits, or emotes. `GROK_FEEL.md` bans them.
