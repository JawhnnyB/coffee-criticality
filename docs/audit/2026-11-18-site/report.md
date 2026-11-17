# Site reactor, 18 November

Branch `g/site-1118`. Part 1 is already on `main` at `657e0b5`. This report is the final pass for parts 2–7. Playthroughs used clicks and keys only. No `bootPlay`, `warp`, `setBuild`, `forceEod`, or `deskLaunch`.

Frozen files against `main`: `sim.ts`, `shuffleModel.ts`, `schematicMath.ts`, `save.ts`, and `DelayGame.tsx` have an empty diff.

## Part 1

Commit: `657e0b5` (merge of `g/review-1117`). Review: [review.md](review.md).

`reviews/PR-26.md` stays request-changes. This pass does not approve PR #26 and does not mark that draft ready.

## Part 2 — text

Commit: `693d11b`.

What changed: every type-specific line lives in `src/game/siteText.ts`, keyed by `pwr`, `bwr`, `pebble`, `msr`. PWR strings are the sentences that were already written. `speak()` swaps a nuclear-lab line only when the string is exactly the PWR sentence. The fast-salt card says fluoride (MSFR), matching the drawing.

Evidence: `scripts/site-text.test.mjs` (passes in [unit.txt](unit.txt)).

Not verified: the owner has not rewritten the new columns.

Decisions: [docs/decisions-pending.md](../../decisions-pending.md), "Text for owner review" and "Card that said chloride".

## Part 3 — controls

Commit: `823a957`.

What changed: `src/game/siteControls.ts` maps the bench onto power, flow, and rods. The sim was not edited.

- PWR: the bench numbers pass through.
- BWR: `bwrPower` rises with recirc flow at the same rods. US NRC BWR Reactor Concepts Manual, cited in the file. The panel says "Rods from below".
- Pebble: outlet is 750 °C (Zhang et al., HTR-PM, Engineering 2016). "Pass a pebble" raises burnup. Helium glow is 0.
- Salt: "Open the freeze valve" ends fission heat and scrams the run. βeff is shown as smaller than β. Display only. Haubenreich and Engel, MSRE / ORNL. Salt glow is 0.

Evidence: `scripts/site-controls.test.mjs`. Panel text from the walks is in the shift logs below.

Not verified: "Pass a pebble" and "Open the freeze valve" were not clicked in the browser. The panels still showed Passes 0 and Plug frozen. This pass did not re-run the tests against the parent tree, so the red-then-green step was not re-proven here.

Decisions: "Controls" in `docs/decisions-pending.md`.

## Part 4 — shift events

Commit: `56f2816`.

What changed: twelve events in `src/game/siteEvents.ts`, three per type. They are a call on Reactor Control. They are not on the frozen week-incident list. A right answer prints "Held." A wrong answer prints "Worse."

Evidence: `scripts/site-events.test.mjs`. One real-input call per walk:

| Walk | Call | Result |
| --- | --- | --- |
| PWR 1280 | Pressurizer spray stuck open | Held |
| BWR 1280 | Recirc pump trip | Held |
| Pebble 1280 | Pebble jam in the discharge | Held |
| MSR 1280 | Salt line cooling | Held |
| PWR 390 | Steam generator tube leak | Worse |
| BWR 390 | Feedwater heater out | Worse |
| Pebble 390 | Moisture in the helium | Worse |
| MSR 390 | Freeze-valve heater fault | Worse |

Logs: `shift-pwr.txt`, `shift-bwr.txt`, `shift-pebble.txt`, `shift-msr.txt`, `shift-pwr-390.txt`, `shift-bwr-390.txt`, `shift-pebble-390.txt`, `shift-msr-390.txt`. Stills: `*-event-right.png` and `*-event-wrong.png`.

Not verified: the other four events per type were not the call the walk happened to draw. The hall tube mark was not measured on a pixel crop after leaving the bench.

Decisions: "Shift events" in `docs/decisions-pending.md`.

## Part 5 — sound

Commit: `80417fb`.

What changed: Web Audio in `audio.ts`, driven by `hallTone()` in `siteAudio.ts`. No samples. PWR and BWR are a pump hum plus a hiss. Pebble is a blower. Salt is a cooler drone plus a heater tick. A scram leaves a decay-heat fan. Gain is 0 when sound is off, and 0 in the cafe.

Evidence: `scripts/site-audio.test.mjs`.

Not verified: the loops were not listened to in a browser. Mute was not toggled during a hall walk.

Decisions: "Hall sound" in `docs/decisions-pending.md`.

## Part 6 — characters

Commit: `54009c1`.

What changed: eight walk sheets redrawn by hand in `scripts/draw-cast.mjs`. Same 128×192 frame, four frames, three rows. Old sheets are in `reference/old-sprites/`. Player keeps the hoodie-picker key colors. NPC sheets use the palette. No Cherenkov on people.

Evidence: `sprites-before-after.png`.

Not verified: the walker was not frame-stepped in the browser against every facing.

Decisions: "Character sheets" in `docs/decisions-pending.md`.

## Part 7 — final pass

No product behavior was changed in this commit. The play scripts and this evidence folder were.

### Walks

Script: `scripts/site-shift.mjs`. Each job is a new browser context. Page errors 0 and HTTP 404s 0 on all eight logs.

Rooms entered, exact HUD name, all eight: cafe, lot, corridor, control room, reactor hall.

Panels at the open of Reactor Control:

- PWR: `Rods 62% out Flow 100% Power 62%`
- BWR: `Recirc 100% Rods from below 62% out Power 75%`
- Pebble: `Helium Blower 100% Outlet 750 °C Passes 0 Burnup 0 MWd/kg`
- MSR: `Salt Pump 100% Plug frozen Salt level 100% β 0.0065 βeff 0.0036 Fission heat 100%`

Hall stills match the type: PWR dome and CRDMs on the head (`pwr-1280x720-hall.png`, `pwr-390x844-hall.png`), BWR rods from below (`bwr-1280x720-hall.png`, `bwr-390x844-hall.png`), pebble vessel and loading tube with no water pool, salt loop room with no pool.

Lot still `pwr-1280x720-lot.png` shows the domed building and the stack. BWR lot `bwr-1280x720-lot.png` shows the torus and a stack.

### Blue

[hall-blue.txt](hall-blue.txt). Palette Cherenkov hexes are absent (within 24) from all eight hall stills. Pebble and salt Reactor Control stills also have 0 of those pixels. PWR and BWR Reactor Control stills, before the slider move, do contain them. That is the water core.

PWR scram: `shift-pwr.txt` and `shift-pwr-390.txt` both log `scram text: true` after the rods were filled to 100 and flow to 50. `pwr-1280x720-reactor-after.png` has 0 pixels within 24 of the Cherenkov hexes. The core on that still is dark.

BWR, pebble, and salt logs say `scram text: false` for the same slider move. Do not read those after-stills as a scram.

Helium and salt halls have 0 strong-blue pixels. The water halls have a small sight-glass disc whose screenshot color is (47, 127, 193), which is not one of the three palette hexes. It is the scaled Cherenkov port. It was not repainted.

### Screens

Script: `scripts/site-screens.mjs`. Logs: `screens-1280x720.txt`, `screens-390x844.txt`. Page errors 0. HTTP 404s 0. Both sizes opened, with real clicks: title, title settings, how to play, credits, setup (region "Pending verification"), pause map, pause Academy ("Heat has to leave"), and the desktop or phone-home apps Settings, Music, News, Radiation, NRC Regulations, Results, Core Map, CORE CAM, Academy, Reactor Control, and Reactor Design.

Type lock, both sizes: after Rebuild, the plant-type step showed `Unit 1 is built. The type stays.` The BWR button was disabled. A forced click left the line in place and the site button still read `PWR — this site`.

### Typecheck, build, unit suite

- [tsc.txt](tsc.txt) ends `TSC:0`.
- [build.txt](build.txt) ends `BUILD_EXIT:0`.
- [unit.txt](unit.txt): 249 tests, 240 pass, 9 fail. The nine names match `docs/audit/2026-11-14-evidence/fail-baseline.txt`: `cabinet-rewards.test.mjs`, `desk-verdict.test.mjs`, and the seven platform-chrome cases.

`@tanstack/react-start` is 1.168.60.

### Not verified

- End of day. Clocks in the logs stop between 07:10 and 07:21. Day 1 also needs the incident and the academy or the bench. `forceEod` was not used.
- Hot leg versus cold leg separating on the live cutaway while power rises. Not measured.
- Scram dimming on BWR, pebble, and salt. The slider move that scrammed the PWR did not print Scram on the other three.
- Freeze valve and "Pass a pebble" in the browser.
- Hall sound, by ear.
- Cabinet games (CATCH, FISH, PLOT, and the rest). They stay hidden until the parlor is found on foot. The pause button "Mabel's arcade" was not clicked.
- The scores board, the end-of-day paper, and every Academy page. One Academy page was open.
- A pixel crop of the hot and cold pipes on the hall floor after a power change.
- Whether (47, 127, 193) on the water sight glass should be snapped back to the exact Cherenkov hex. Left as drawn.

### Decisions added in this part

None. The choices from parts 2–6 are already in `docs/decisions-pending.md`.
