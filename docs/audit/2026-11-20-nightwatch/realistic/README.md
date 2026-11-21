# Night Watch: realistic camera feeds (20 November 2026)

The owner asked for the cameras to be the one realistic, eerie part of the game. Evidence:

- `gal0.png` to `gal3.png`: every scene, plain and with its event, oddity and visitor layers (`gallery.html` draws them with the real `paintCamera`; `gal.mjs` shoots it).
- `night1-run.log`, `shift-1280.png`, `shift-390.png`: `nw.mjs`, a full night 1 with real input only (hooks only to boot and open the desk). 2 events caught from flashing cameras, 1 ran its course, 0 false reports, survived to 06:00, flag set. No page errors.
- `nw-rover-shift.png`, `nw-switch-turbine.png`, `nw-rover-turbine.png`: `rover.mjs` waits in real time for Jordan's radio call, clicks the camera he named, and finds him on it (first frame mid-static).
- Unit: `scripts/nightwatch.test.mjs`, 13 pass. Every visual changes its camera's draw calls in some frame; Cherenkov blue only in the pool; static while switching; red cast after a trip; the rover's rounds are replayable, called in on the radio, and reporting him is a false report; the van arrives at 05:45. Full suite: 287 tests, the same 9 failures as the baseline (Grok platform chrome tests and two older scripts), nothing new.

Not checked: the ambience by ear (no audio output here; it is built from Web Audio nodes and goes through the master mute), nights 2 to 5 and the other reactor types in a browser.
