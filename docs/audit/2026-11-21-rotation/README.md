# Rotation evidence, 21 November 2026

Branch `g/rotation-nights`. Not merged.

## What was checked

- Visibility: `docs/audit/2026-11-21-rotation/visible.md`, re-run after the lamp tweak. Events clear 0.4%. Oddities sit between 0.12% and 2.0%. The script exits 0. The van's headlights had shrunk under that floor (0.29%). They are a 26×18 lamp now, 0.58% of the frame, and 2 cells on the sweeper's thumbnail, under the 8-cell line.
- Night Watch unit tests, including the grade worked check, night 1's silent event, four nights, carryover, relief, the fast clock, and a logged camera. 23 pass.
- Full suite after the fix pass: 300 tests, 291 pass, 9 fail. The 9 names match `docs/audit/2026-11-14-evidence/fail-baseline.txt`. No new failures.
- `npm run typecheck` passes. `npm run build` passes.
- The built game was served with `scripts/preview-built.mjs`. Homepage HTTP 200. `vite preview` cannot: `dist/server/server.js` is not in the build.
- Frame time, retimed alone: `perf.txt`. Worst feed frame at 4× is the pool at 6.8 ms. The Cherenkov cache is still in. Tablet up, main thread busy 27% over 5 s at 4×.
- Mark crops and the pressurizer sign are in `visual/`.

## What was not checked

Nothing from the fix brief is still open. The bot table is in `bots.md`. The production playthrough, the reload, and the phone nights are in `r11/`. The day-week events are in `r12/`.

## Lines from the fix pass, for approval

These are the lines R3, R5, R7, and R8 added or changed. The older list above still stands.

Relief (R3). A night Elena takes over is an F. These replace her ordinary grade line:

- I have the chair. This night does not count.
- Relieved. The night is not done. (curt, when the day log was hidden. Same words as the curt F line above.)
- Six is the end of the night. This one ended early. (a C that did not reach 06:00)
- You did not reach six. (that same night, curt)

Leave the watch (R5). Rotation only. A replay still says "Leave the shift" and leaves at once.

- Leave the watch
- Leave the watch? Elena will log it as relieved.
- Yes
- No

A repeated night (R7), after a D or an F. A first try still says "Night N" and "18:00 turnover".

- Night N, again
- Stand it again
- Night N, again. Elena wants it stood properly.

Already logged (R8):

- Already logged. The crew is on it.

No number is spoken. A second report on that camera inside 40 game minutes gets this line, and no penalty. A new event on the camera still counts. The brief said 20 minutes. 40 is what a full lap of the cameras needs, so a correct catch is not punished when the crew clears the picture.

## New lines for the owner to approve

Elena, normal:

- You caught them before the board did. That is the job.
- The log is clean enough. Keep walking the quiet cameras.
- You made six. The ones you missed were already on a camera.
- I am taking the chair. Stand this night again.
- The plant does not get a second board. Stand the night again.

Elena, curt (the day log was hidden):

- Logged. The board agrees.
- Acceptable. Do not get comfortable.
- You reached six. The misses stand.
- Not good enough. Again.
- Relieved. The night is not done.

Jordan, warm:

- Yard lights are on. I am starting at the turbine.
- Aux corridor is quiet. Door latches look shut from here.
- Pool deck is dry. I am walking the rail.
- Containment entry is logged. Nobody else in the airlock.
- Steam valve room is warm, nothing weeping.
- Intake deck is clear. Screens are turning.
- Switchyard is dark except the sodium lamp.
- Back at the turbine. Call if a camera looks wrong.

Jordan, terse:

- Rounds.
- Turbine.
- Aux.
- Pool.
- Core.
- Steam line.
- Intake.
- Yard. Out.

Night 1 nudge (one of these):

- Jordan: aux corridor door looked wrong on my way past. Can you check the camera?
- Jordan: tool bag by the pool looked wrong on my way past. Can you check the camera?

Days off and the lot:

- Three days off. You sleep wrong for two of them.
- The week held. You still wake at the wrong hour.
- You keep replaying the things you did not say.
- The plant is someone else's problem until midnight.
- Fatigue rules: no more than 16 hours on in any 24, and at least 34 hours off in any 9 days.
- 18:00 turnover. Quiet board. At midnight the watch desk is yours.
- The lot is pale. Elena nods once and keeps walking.
- Dawn on the lot. The log is what it is.
- The lot is empty. A night like that has to be stood again.
- Your night rotation starts after this week.

From the day week:

- Jordan: Valve 14 repack is holding.
- Elena: From your day log. (then one existing log line)
- Jordan: Dosimeter's been chirping near the aux stairs.
- Plant Monitor: First nights on the new core.
- Valve 14 packing weeping
- Clearance tag missing on feed pump B

Turnover scraps:

- You left the chair. Good. (and the same shape for the hard hat, the gull, the fog, the flicker)
- It was on CAM03 from 02:12. You looked at CAM03 0 times after that.
- from days
