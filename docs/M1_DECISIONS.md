# M1 decisions (step 0)

Written before any milestone code. Nothing here is final until the owner merges. Each choice is one constant, one file, or one config entry, so it can be reversed without a redesign.

Future home for the constants, created when the feature that needs them is built, not in this commit: `src/game/setupChoices.ts`.

Stack: `origin/main` (`1601087`) → `feature/m1-shared-thermal` (`4c4bc93`, PR #3) → `feature/first-meeting-readability` (`96f36e0`, PR #4) → this branch. This pull request is based on `feature/first-meeting-readability` so the diff is only this file. Merge it after #3 and #4, or rebase it onto `origin/main` after those land. Do not merge those pull requests from this branch.

## Decisions

### 1. Git history (owner decides; recommendation only)

**Choice: A. Base on `origin/main`.** Local `main` in this sandbox was already `origin/main` at `1601087`. It was not reset, rebased, merged, or pushed.

**Reason:** The handoff default is `origin/main`. The two commits the handoff names, `962feac` ("Turn the shore toward the player.") and `70767f1` ("Stand outside the shore, and keep the consequence."), are already ancestors of `origin/main` in this clone. `962feac` has parent `9ec11d1` here. They are not a divergent tip on this machine. If the owner's own checkout still has a second history with the same messages, that history stays untouched until someone compares `sim.ts` and `week.ts` by hand. Not available: force-pushing local `main`.

### 2. First region

**Choice: C. East North Central, as flavor only. Radiation stays pending (item 5).**

**Reason:** No Census division has a verified background value, so none can appear as a verified setup region yet. The shipped campus has the lake on the north and the stacks on that shore (`GROK_WORLD_100.md`), which reads as an inland lake plant, not a coast. East North Central is the smallest change that matches that picture. It will be one constant, `FIRST_REGION_ID = "east-north-central"`. Dialogue must not name a real city, lake, or river. Swap the constant if the owner prefers another division.

### 3. Placeholder town and paper

**Choice: A. Harrow Bend, The Harrow Bend Ledger, Harrow Bend Light & Power.**

**Reason:** These are the spec's names (section 11.1), so they stay in one object and can be renamed in one place. A web search for the phrase "Harrow Bend" did not return a town by that name. "Harrow" alone is a real place: the London Borough of Harrow, and Harrow on the Hill. **The owner checks these names before they appear in player-visible text.** They are not cleared.

### 4. Music source

**Choice: A. Procedural tracks written in code, one per season.**

**Reason:** No audio files exist today (`audio.ts` is one `AudioContext` and procedural beds). Procedural tracks raise no license question. M1 minimum is four tracks, one each for Spring, Summer, Fall, and Winter. The player ducks the existing music bus while a track plays, so the bed and the track never sound together. Note-data tracks (option B) can replace the generators later without changing the player.

### 5. Background radiation

**Choice: A. Every region stays `"pending"`. No number is shown.**

**Reason:** Stop-line. A real-world sievert value needs a source the owner accepts. This pass does not look up or ship a number from UNSCEAR or NCRP 160. The owner may verify a source later and flip one entry to `"verified"` with its link and year.

### 6. NRC index

**Choice: A, when M3 starts. Not built in this commit.**

**Reason:** Use only the spec's starter list: Parts 19, 20, 21, 26, 50, 50 Appendix B, 50.59, 52, 55, and 100. Part 73 stays "exists, and is not described here." Every entry is marked "verify before publish." Titles and links are not written from memory. The owner confirms each one against eCFR before M3 merges. Until then the default is no index.

### 7. News feeds

**Choice: B, when M4 starts. One feed first. Not built in this commit.**

**Reason:** Smaller blast radius than wiring three feeds at once. The first feed is World Nuclear News RSS. If its terms fail, drop it and say so. The game builds from a committed `public/data/news.json` with no network. The other two feeds (NRC news releases, ANS Nuclear Newswire) wait. Local news uses the in-game day and the save seed, never the real clock. A hide is never reported as a catch.

### 8. "Show all apps"

**Choice: A. Off for players. On only when Vite's mode is development.**

**Reason:** Players should not see cabinets they have not found. A dev-only switch needs no hidden test hook, because `window.__controlsTest` already opens modes for screenshots. The save field `showAllApps` defaults to false. Development builds treat it as on. One boolean.

### 9. Starting path for M1

**Choice: A. Shared run, then save version 2, then the desktop shell, then setup, then the M1 apps.**

**Reason:** The trainer still keeps rods, flow, power, hold, and scram in local state, and it still has a plant-type selector. It does not run `s.plant`. That is the central bug (spec section 5), and CORE CAM and Results will read the same `s.run`. A placeholder desktop first (B) would show apps that are not the designed plant. Save version 2 first (C) would freeze fields before the run shape is proven. Neither shared run nor save version 2 will be skipped. Order inside the milestone:

1. `s.run` on `GameState`, seeded from `s.plant` the first time a control app opens. Only Reactor Control writes it.
2. `thermalState` stays the only thermal formula. `scaleDt` and `tColdOf` leave `ReactorTrainer.tsx`.
3. Save v2: keep reading `cc.save.v1`, write `cc.save.v2`, `SAVE_VERSION = 2`. Residue unchanged. `beginDay` still does not clear residue.
4. Desktop shell, empty of new content. One constant for the name "Parlor OS."
5. Boot, sign-in, setup.
6. M1 apps wrapping the existing components. Mini games still go through `openCab` and the existing `finish*` functions.

### 10. Dialogue variants

**Choice: Mabel and Jordan only, first day only, for region and for stance. Four new lines at most. Not written in this commit.**

**Reason:** Spec section 4.2 names those two. Region gets one variant from each that may mention weather or the fictional town, not a real river. Stance gets one variant from each (Cautious, Steady, or Bold), display only. Other characters stay as they are. Lines are not repeated. No trust or culture change. Each line must pass `scripts/first-meeting-lines.test.mjs`: curly-quoted, a full sentence, at least 4 words, at most 120 characters, no stage directions, no duplicate of another line. The test will be extended only if a new rule is required, and that extension will be called out in the PR that adds the lines.

## What was read for step 0

Spec section 3 files, on `96f36e0` (this branch's parent):

- `sim.ts`: `GameState` (line 100) has no `run`, `setup`, or `desktop`. `finishBuilder` (line 767) stores `s.plant`, sets `flags.built`, and sends the mode to intro. `beginDay` (line 777) does not clear `residue`. `openCab` (line 1185) sets `returnMode` and the cabinet mode. `flags.hid` is still only "hid at least once."
- `GameApp.tsx`: `window.__controlsTest` starts at line 231. Hooks present: `bootPlay`, `setIntro`, `setBuild`, `openCab` (line 479), `setMinutes`, `warp`.
- `plant.ts`: `thermalState` (line 65) is the one formula. Trainer at 62% power and 100% flow is covered by `scripts/thermal-state.test.mjs`.
- `ReactorTrainer.tsx` still uses local `useState` for rods, flow, power, hold, and scram, and still has a type selector.
- `save.ts`: `SAVE_KEY = "cc.save.v1"`, `SAVE_VERSION = 1`.
- `audio.ts`: one context, a music gain bus, `duckTo` for overlay modes. No audio files.
- Also read: `ReactorBuilder.tsx` (produces `s.plant`), `NuclearDesk.tsx` / `nuclearLab.ts`, `shuffleModel.ts` / `FuelShuffle.tsx`, `content.ts` `ACADEMY`, `week.ts`, `IntroScreens.tsx`, `TeachFrame.tsx`, `PixelMenu.tsx`, and the mini-game components named in section 3.

Frozen numbers were not changed. `DELAY.CAB` stays `LAMBDA = 0.005` and `N_MAX = 40`. The comment that says a smaller generation time means a faster climb disagrees with the measured times in that same comment (about 5 in 4 s, versus Λ 0.055 in 1.6 s). Left as-is. Open question below.

## Open questions

Each one uses the default until the owner answers. No frozen number was changed.

1. **Which git history is canonical?** Default: `origin/main`. See decision 1. Owner decides. No merge into `main` from this work.
2. **Do the placeholder names clear a real-place check?** Default: keep Harrow Bend in the decisions file only, and do not put the names on screen until the owner says they are clear. "Harrow" is a real London place.
3. **Background radiation source?** Default: every region `"pending"`. No sievert number.
4. **NRC titles and eCFR links?** Default: no index until M3, and then only the starter list, each marked "verify before publish."
5. **DELAY comment versus `LAMBDA`.** The frozen value stays `0.005`. The comment's "smaller means faster" sentence does not match the times written next to it. Default: do not edit `LAMBDA`, `N_MAX`, or the comment in M1.

## Not in this commit

No `s.run`, no save v2, no desktop, no setup screen, no apps, no dialogue lines, no news script, no radiation number.
