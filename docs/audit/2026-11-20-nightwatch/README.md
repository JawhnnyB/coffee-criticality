# Night Watch and the Plant Monitor (20 November, Claude)

The owner asked for a camera-watch mini game in the style of the five-nights games, eerie rather than horror, with reactor-safety alarms instead of monsters, plus a passive day-and-night plant monitor with a flashing red tab.

## The design and why

- **From the five-nights games:** five nights, 00:00 to 06:00, a fixed desk, a camera tablet, one scarce resource. Here the resource is coffee: watching the cameras drains it, and brewing takes time and is limited.
- **From the anomaly-spotting games** (The Exit 8 and I'm on Observation Duty, which made the liminal, Backrooms-style mood popular): nothing jumps out. Something is different on a camera, and the job is to report it from the right camera as the right kind of problem. Harmless oddities (a flickering light, a chair in the corridor, a gull) are there to be ignored. Three false reports and the supervisor sends you home.
- **The plant:** every anomaly is a real kind of problem, chosen per reactor type. It shows on its camera first, then moves its readings until an annunciator flashes and the camera's button flashes red. Unreported, a trip event trips the reactor and ends the night; a finding (an open locked high radiation door, a tool bag inside the pool's foreign-material line) is found by the day shift and counts against you. Catching something before its alarm is an "early" catch.

## Checks

| What | How | Result |
|---|---|---|
| A full Night 1, real input only after setup | `nw.mjs 1280x720 full`: the bot uses only what is on screen (flashing camera, red tiles) | 06:00 reached. Caught: radwaste leak (aux gamma red, radiation report) and pressurizer relief valve (pressure red, leak report). The tool bag at the pool, which never alarms, ran its course to a finding, as designed. Night 1 marked done. 0 page errors. `night1-run.log`, `night1-dawn.png` |
| Cameras | 8 PWR stills | `cameras-pwr.png` |
| Phone | 390×844 | Camera and report first, annunciators below. `shift-390.png` |
| Monitor alarm from a real trip | `mon.mjs`: salt plant, freeze valve opened by click, drained | Start button, Start-menu icon and taskbar tab all flash; trip tile TRIPPED. 0 errors. `monitor-trip.png` |
| Unit suite | `unit.txt` | 285 tests, 276 pass. The 9 failures match the baseline. New: `nightwatch` (11) |

Tests that caught real bugs before they shipped: event start times were read from the wrong field (no event would ever have developed), and the monitor would have alarmed on the normal low ΔT of a plant at reduced power.

## Not verified

- Nights 2 to 5 and the other three reactor types were not played through in a browser. They are covered by the model tests (every event alarms, shows on its camera, and draws on its camera for all four types).
- The full typecheck and production build (no React types here). The new modules pass strict `tsc` against a React stand-in.
