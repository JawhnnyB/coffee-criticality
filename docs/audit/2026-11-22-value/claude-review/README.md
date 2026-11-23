# Claude's review of g/value-100 at 72f2757 (22 November 2026)

`feeds-0..3.jpg`: every camera through the real `paintCamera`, plain and with its layers, from this branch.

Regressions to fix (they were made to pass the visibility number, and they read as stickers to a person):
- pool `toolBag`: a flat yellow rectangle sits on the photo above the real bag (feeds-3, top right).
- pool `poolLow`: no level change a person can see; the frame looks the same as the plain pool.
- yard `van`: the headlights are a flat white box on the gravel (feeds-3, middle).
- tunnel `condensate`: four solid black ovals on the floor, like holes (feeds-1, top right).
- drywell `puddle`: a pale rectangle on the floor (feeds-0, bottom middle).

Checked in code, not in a browser: plates reload on every shift after `releasePlates()` (`preload` misses the cleared cache and fetches again).
