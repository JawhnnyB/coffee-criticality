# GROK HANDOFF: where the game is now, what is on main, and what is not

For Grok Build, working in `JawhnnyB/coffee-criticality`. Read this first. It replaces the 2026-11-07 handoff, which described an older `main`. Dated 2026-11-08, written against `main` at `a6fd6f1`, the base of this PR.

## 0. Read these, in this order

1. `GROK_FEEL.md`: the week has to be visible. The "Do not" section is binding.
2. `GROK_WORLD_100.md`: the world. Section F, "Camera," is the in-world viewport. Do not confuse it with CORE CAM, the reactor window in spec section 6.
3. `GROK_ART_101.md` and `tools/artkit/STYLE-STANDARD.md`: the art rules. Section 5 is the acceptance list.
4. `GROK_PHASES_1-4.md`: the build spec for Parlor OS, CORE CAM, and the reactor-facing apps. Section 2 has the non-negotiables, section 15 has the milestones, and section 17 has the traps.
5. `docs/REVIEW.md`: the frozen list, the review rules, and the branch-protection decision.
6. `docs/CROSS-REVIEW.md`: the authorship and gate rules.
7. This file, sections 1 to 5.

## 1. The rules that do not change

- `main` moves only by merging a reviewed pull request. Never push to `main` directly, and never force-push.
- Do not touch the two local-only commits on the owner's local `main` (`962feac`, `70767f1`). They are not on `origin/main`, and the owner has not decided what to do with them.
- Branch protection stays off. The owner chose **option C**, convention only (see `docs/REVIEW.md`). Do not enable it.
- Reviews are files in `reviews/`, pushed to the pull request's branch. Do not post GitHub comments or reviews.
- Authorship: one AI writes a change and the other AI reviews its head commit. The gate accepts only `G` or `C` as author and reviewer. A change written by the owner has no AI author, so the gate cannot pass for it. Owner changes are reviewed and merged on the owner's authority, and the record says so.
- Frozen numbers and rules are in `docs/REVIEW.md`, "The frozen list." Do not change them. The list covers the ending formula, the culture and trust values, DELAY `LAMBDA` and `N_MAX`, the tuned LOAD, ROD.BANK, PHYS.CAB, CATCH, and LOTOTO numbers, `flags.hid`, residue, and `incidentResolved`.
- No runtime network call while the game runs. No real names in player-visible text. No AI-generated text or copyrighted assets in the shipped game. Radiation values stay "Pending verification" until a source is cited.

## 2. Branches and pull requests (as of this PR's base)

| PR | Branch | GitHub state | What it did | Review |
|---|---|---|---|---|
| #1 | `claude/stage-2c-security` | open, not draft | Site Access work. Not part of the 2026-11-08 merge set. Left alone. | not reviewed in this set |
| #2 | `claude/fix-shuffle-solvability` | merged | Fuel shuffle solvability fix | — |
| #3 | `feature/m1-shared-thermal` | merged (from draft) | Shared thermal model (`thermalState`) | — |
| #4 | `feature/first-meeting-readability` | closed, not merged | First-meeting readability and dialogue rewrite. Its content is on `main`. | — |
| #5 | `docs/grok-handoff` | closed, not merged | Previous handoff. Its content reached `main` by other routes. | — |
| #6 | `review/setup-review-path` | merged (from draft) | Review rules and the frozen list | `reviews/PR-6.md` |
| #7 | `review/cross-review-system` | closed, not merged | Cross-review gate. Its content is on `main` through a hand-made merge commit. There is no `reviews/PR-7.md`. | none. `reviews/retro-4ae6277.md` is a retrospective, not a PR-7 record. |
| #8 | `style/bench-schematic` | merged (from draft) | Pixel PWR bench | `reviews/PR-8.md` |
| #9 | `gameplay/bench-seed-62` | merged | The bench opens on the 62% drill | `reviews/PR-9.md` (author recorded as `owner`; the gate cannot pass for it) |
| #10 | `g/wp1-run-side-effects` | merged | Bench writes and `ensureRun` moved out of render and state updaters | `reviews/PR-10.md` (approve at `9453e29`) |
| #11 | `g/wp2-phone-layout` | merged | Phone room fits, notes panel starts closed, intro text 12px | `reviews/PR-11.md` (approve at `7b325da`) |
| #12 | `g/wp3-save-v2` | merged | Save version 2, version 1 migration, corrupt copies kept | `reviews/PR-12.md` (approve at `a5e881d`) |
| #13 | `c/continue-fix` | open, draft | Continue works from the title screen on a fresh load | needs review by G before merge |

PR #13 fixes a bug found while checking #12. On a fresh load the title is in the `splash` mode, and the saved flag was read only in `menu`, so Continue did nothing. The bug reproduces on `main` and is fixed on the branch at both sizes. The desktop does not start until #13 is on `main`.

## 3. What is on main

- The start screen, the room, and the first-meeting scenes (Mabel, Elena, Tommy, Marcus, Jordan, Holt, Priya), with the rewritten dialogue, linted by `scripts/first-meeting-lines.test.mjs`.
- The cafe and the cabinets: LOAD.CAB, ROD.BANK, DELAY.CAB, PHYS.CAB, CATCH, and LOTOTO.
- The PWR bench in the pixel style, opening on the 62% drill (`SEED_POWER_PCT` in `src/game/plant.ts`). The bench writes its run state outside any state updater, once per change.
- The shared run in `sim.ts` (`RunState`, `ensureRun`, `recordRun`, `noteRunHour`), and the Compare card.
- Academy: 22 entries in `src/game/content.ts`. No tier tags yet.
- Save version 2 (`cc.save.v2`). Version 1 (`cc.save.v1`) is read and migrated in memory, and never rewritten. A corrupt version 2 is kept on `cc.save.v2` and copied to `cc.save.v2.corrupt`. Version 1 is not loaded while a version 2 key exists.
- The phone layout: the whole room fits at 390 wide, and the notes panel starts closed below 720 px.
- Thermal and run tests, the pixel-schematic tests, the save-v2 tests, and the cross-review gate (`scripts/check-cross-review.mjs`).

Tests on `main` at `a6fd6f1`, run on 2026-11-08: 92 run, 82 pass, 10 fail. The 10 are the known set, and they are not game regressions:
- `cabinet-rewards`: the esbuild package is missing in some sandboxes.
- `desk-verdict` and seven og/platform-chrome cases (grok:app_id, x:creator, project id, twitter:card, app-name title): the app shell.
- `teaching-lab` "full-core and depletion": it calls `npx esbuild`, which needs the network. It passes where the network is available.

Do not change the game to turn those 10 green.

## 4. What is not built

Against the spec milestones in `GROK_PHASES_1-4.md` section 15:

- **M1 (shell and setup):** not done. No desktop, window manager, taskbar, or app registry. The desktop skeleton is the next stretch step, behind `?desktop`. No setup (region, season, stance). No Settings app: Settings is a sheet in the start menu only. No Music app: `audio.ts` has a music bus but no tracks. Reactor Design is the builder inside the game, not an app.
- **M2 (CORE CAM, Results, Core Map):** not started. Nothing reads the shared run yet.
- **M3 (Academy tiers, NRC index, news):** not started. The Academy has no tier tags, and there is no NRC index and no news of any kind.
- **M4 (background radiation map):** not started.
- **M5 (impact audit):** not started.

Visual items still open:
- The BWR, pebble bed, and MSR bench drawings are still the old SVG. They need the same pixel treatment as the PWR: native grid, whole-number scale, hard edges, palette only, HTML labels at 10px on a phone and 12px wide, no text on the canvas.
- The PWR is missing two facts: the rods coming from the top, and a steam dot.
- On a phone the room is at zoom 1, so the characters are small. A camera pass at zoom 2 with a pan is planned.
- The speaker's name line on the intro screen has not been measured against the 12px target.

## 5. How to check a change

- Install: `npm install`. Dev server: `npm run play` (port 8080).
- Build: `npm run build`. It must work offline.
- Tests: `npm test`. Typecheck: `npm run typecheck`. Only TS2304, TS2552, TS2305, TS2724, and TS2367 count here.
- Art check: `npm run art:check` for any art change.
- Browser: check at 1100×720 and 390×844 with zero page errors. Use `window.__controlsTest` (`bootPlay`, `setIntro`, `setBuild`, `openBench`, `openCab`, `getRun`, `save`, `load`, `hasSave`) to reach a state without playing through it.
- Gate: `node scripts/check-cross-review.mjs <PR number>`, run from the PR's head checkout, because the gate reads `reviews/PR-<n>.md` from the checkout it runs in.

Current screenshots of the bench, taken from `main` at `a6fd6f1` on 2026-11-08:
- `docs/audit/2026-11-08-bench-wide-1100x720.png`
- `docs/audit/2026-11-08-bench-phone-390x844.png`

The `docs/audit/after-bench-*.png` files are stale: they show the old overlapping labels. They are kept as history and are not overwritten. Use new dated names for new captures.

## 6. Owner decisions

Decided:
- Branch protection: **option C**, convention only (2026-11-08).
- The bench start: **62%** (PR #9, the owner's choice).
- Merge order for #9 through #12: done, as recorded in each PR.

Still open, for the owner:
- Which git history is canonical. `962feac` and `70767f1` exist only on the owner's local `main`.
- PR #4, #5, and #7 were closed without a merge. Their content reached `main` by other routes, including a hand-made merge commit for #7. The owner decides whether to record that on the closed PRs or leave it.
- Whether owner-authored changes should be exempt from the gate, which currently fails for them.
- PR #1 (Site Access): whether it is in scope at all.
- Real-world values and names: "Harrow Bend" is a real London borough and is not cleared. Radiation values stay "Pending verification" until a source is cited.

## 7. Next steps, in order

1. Grok reviews PR #13 and writes `reviews/PR-13.md` on its branch. Then the owner merges it.
2. Desktop skeleton (`?desktop` flag, off by default), after #13 is on `main`. Scope: one constant for "Parlor OS," an app registry that drives both the desktop and the phone layout, a window with title bar, drag, close, and focus, a taskbar with the in-game clock, full-screen apps under 720 px, keyboard routing so game keys fire only for the focused app, and placeholder panels that say "Not in this build." No new plot. No real app content.
3. BWR, pebble bed, and MSR drawings in the pixel system, plus the two missing PWR facts, with a geometry test and screenshots at both sizes.
4. Phone camera: zoom 2 with a pan that keeps the player on screen, and the speaker-name line measured and set to 12px.
5. Not in this stretch: CORE CAM, Results, Academy tiers, news, and the map.
