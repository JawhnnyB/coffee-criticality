# Review of c/polish-1117

Reviewed against base `c0b12df`. Branch tip before this fix: `3a189ee`. The fix is on `g/review-1117` and is merged into `c/polish-1117`, then that branch is merged into `main`.

`reviews/PR-26.md` stays **request-changes**. This review does not approve it and does not mark the draft ready.

## R3

Closed on the claims row already, at `docs/audit/2026-11-14-dream-pass-5.md`: "Listener wiring checked by reading GameApp.tsx line 254, not by a test. Not walked in a browser."

A note was added on PR #26 so that row cannot be reopened against this branch: https://github.com/JawhnnyB/coffee-criticality/pull/26#issuecomment-6956688945

## Install, typecheck, build

The branch had not been typechecked or built in the environment that wrote it.

- `docs/audit/2026-11-18-site/tsc.txt` — `TSC_EXIT:0` after the `siteKind` fix below. The first run, before the fix, failed: `GameApp.tsx` and `render.ts` indexed `SITE_NAME` and `HALL_PIPES` with a `CutawayKind` (`msfr` and `fhr` included). Those records only have the four site types.
- `docs/audit/2026-11-18-site/build.txt` — production build exit 0.

## Unit suite

`docs/audit/2026-11-18-site/unit.txt` — 248 tests, 241 pass, 7 fail, `UNIT_EXIT:1`.

The seven failures are the platform-chrome names in `docs/audit/2026-11-14-evidence/fail-baseline.txt`.

The baseline also names `scripts/cabinet-rewards.test.mjs` and `scripts/desk-verdict.test.mjs`. Those two passed here because `esbuild` was importable. They fail in an environment that cannot load `esbuild`. The tests were not changed.

## Frozen files

Against `c0b12df`, `sim.ts`, `shuffleModel.ts`, `schematicMath.ts`, and `save.ts` are unchanged.

`DelayGame.tsx` differs only by `cabContext` / `cabFont` (the earlier cabinet canvas and font lines).

## Fix

`src/game/plantLoops.ts`: `siteKind` now returns `SiteKind` (`pwr | bwr | pebble | msr`) instead of `CutawayKind`. The function already returned only those four. The annotation was what broke the typecheck.

## Play, real input

Script: `scripts/site-shift.mjs`. Log: `docs/audit/2026-11-18-site/shift-log.txt`. Clicks and keys only. No `bootPlay`, `warp`, `setBuild`, `forceEod`, or `deskLaunch`.

What the PWR pass at 1280×720 actually did:

- Picked PWR, signed the unit, walked the intro, and reached the cafe. Clock `06:52`. HUD: Criticality Cafe. Screenshot `pwr-1280x720-cafe.png`.
- Walked out the east door to the lot. Screenshot `pwr-1280x720-lot.png`. The lot shows the domed building and the stack.
- Did not enter the main corridor, the control room, or the reactor hall. Several real-input attempts (straight east, then a north/south search along the plant face) left the player on the lot against the building. Screenshots `pwr-1280x720-corridor.png`, `pwr-1280x720-control.png`, `pwr-1280x720-hall.png` are that lot, not those rooms.
- Opened Reactor Control from the pause menu (Escape, desktop, Reactor Control). Two range inputs. After moving them, the panel said Scram. Screenshots `pwr-1280x720-reactor-control.png` and `pwr-1280x720-reactor-after.png`. The core on the cutaway is dark. Page errors 0. HTTP 404s 0.
- Clock after the attempt: `07:13`. End of day was not reached.

BWR, pebble, salt, and 390×844 were started on earlier runs of the same script. Those runs signed the chosen type and reached the cafe. They did not get a completed room walk. The last log file is the PWR-only smoke test, which is the one that reached the lot and the scram.

## Checked against the 17 November stills

| Check | Result |
| --- | --- |
| Lot matches a PWR (dome, stack) | Seen on `pwr-1280x720-lot.png` |
| Hall, mimic, skyline for each type | Not verified. The hall and the control room were not entered. |
| Type stays locked after clock-in | Not verified. The builder lock was not reopened after clock-in. |
| Hot leg and cold leg separate as power rises | Not verified. Not watched on a live cutaway before the scram. |
| After a scram, dim core | Seen on `pwr-1280x720-reactor-after.png` |
| Helium and salt never glow blue | Not verified in the browser. Those halls were not entered. |
| Reactor Control at 390×844 | Not verified. The phone pass did not finish. |

## Not verified

- A full shift to end of day. Walking adds about 0.36 game-minutes per real second (`sim.ts` move). From 06:52 to 14:00 is about 20 minutes of walking, and day 1 also needs the incident resolved and the academy or the bench. `forceEod` was not used. The clock in the log moved from 06:52 to 07:13.
- Corridor, control room, and reactor hall on foot.
- BWR, pebble, and salt halls, and the phone-size Reactor Control.
- Whether the type stays locked after clock-in, by trying to change it.
- Hot-leg / cold-leg separation while power is rising.
- Blue glow absent on a helium or salt hall, in the browser.
