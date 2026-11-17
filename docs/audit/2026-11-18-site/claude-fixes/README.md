# Claude's fixes on top of PR #28 (18 November)

Branch `c/site-fix-1118`, based on `g/site-1118` at `cb0f213`. Built from this branch and served for every check below. Setup used test hooks (boot, pick the type in the real builder, open the desk), and the scripts label that. Every check after setup used real keys, real slider moves and real button clicks. `getRun`, `getMinutes` and `getMode` only read.

| Fix | How it was checked | Result |
|---|---|---|
| Salt freeze valve ended in "BAND.HELD" at 93% power | `vfix.mjs MSR`: real click on "Open the freeze valve" | Power 62 → 50.5 → 25.5 → 0. Scram true. "BAND.HELD" never shown. Drained line shown. `msr-freeze-valve-drained.png` (before: `before-msr-drain-band-held.png`) |
| BWR power was a formula that the band hold did not use | `vfix.mjs BWR`: rods 80, recirc slider 70% then 120% | 60.5% at 70%, 84.5% at 120%. The bench kinetics give the power. |
| Pebble outlet was always 750 °C | `vfix.mjs Pebble`: blower slider 100% then 60% | 687 °C, then 860 °C |
| Event outcomes (pump trips zeroed flow; freeze-valve event backwards) | `site-events.test.mjs`: 8 tests over all 12 events. `vfix.mjs` answered a call on PWR and pebble. | Pass. On screen: PWR spray "Held.", pebble moisture "Held." with scram |
| Two lessons told every site it was a PWR | `site-text.test.mjs` walks every lesson field for BWR, pebble and salt | Pass. The same test fails on `cb0f213` (2 failures). |
| Mabel's "horns" | `draw-cast.mjs` reproduces `cb0f213`'s sheets byte for byte, then the head fix | `mabel-priya-before-after.png`, `cast-before-after.png` |
| "Clock stops at 07:10–07:21" | `clock.mjs`: hold a key 60 s, then stand 20 s | 412.0 → 433.6 minutes walking (0.36 per second), +1.0 standing. Not stuck: slow by design in `sim.ts`. |
| End of day never reached | `eod.mjs BWR` and `eod.mjs MSR`: real arrow keys until the day closed | Both reached the end-of-day paper at minute 1008, in 1505 s and 836 s. `data-site` bwr and msr. 0 page errors, 0 HTTP errors. `eod-*-real-keys.png` |

Unit suite: 261 tests, 252 pass, 9 fail. The nine match the baseline (`unit.txt`). Frozen files are unchanged against `main` (`657e0b5`).

Not verified here: the full project typecheck and production build. This environment has no React type definitions installed. A strict typecheck of the changed non-React modules (`siteControls`, `siteEvents`, `siteText`, `benchStep`, `plantLoops`, `cutawayPaint`, `hallPlant`) passed. `ReactorTrainer.tsx` was changed and was not typechecked here. Grok's CI must run `tsc` and `vite build` on this branch.
