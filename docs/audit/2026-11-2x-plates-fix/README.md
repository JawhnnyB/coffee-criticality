# Night Watch plates fix, 21 November 2026

Branch `g/nw-plates`. Not merged. No GitHub review was posted.

## What changed

- State crops show. `blitFeather` builds the mask with source-over and applies it once, on a 960×540 canvas. Before, each edge strip erased the one before it, so a "ready" plate skipped the code drawing and the player saw nothing.
- Every state box is the measured change plus 8 px, clipped to 480×270. The numbers are in `plates.ts`. Re-run `node scripts/measure-states.mjs`.
- Signs are baked into the photos (`scripts/bake-signs.mjs`). `SIGNS_BAKED` is true, so a photo frame does not call `marks()`.
- Regenerated plates: corridor door (open, dark room beyond), freeze with the frost gone, cell heater zone dark, pool as a grid of cells, cavity with a concrete floor, low pool, tool bag, corridor hard hat (the yellow hat only, composited onto the corridor so the rest of the photo did not drift), rover walk (eight frames, torch, legs change).
- The hard-hat oddity is still the turbine camera (`hardhat-corridor` in the model). The corridor hat plate is not what that oddity draws. The turbine shows the code hat on the turbine photo. That was left alone on purpose: moving it would change which camera flashes.
- Intake was not regenerated. Chair was not regenerated; its box was moved to the chair that was already in the picture.
- Feed paints at 15 fps. The clock still updates on its own timer. Infrared desaturation is baked into the cached plate. Scanlines and the vignette are one overlay.

## Checked

- `node scripts/nw-visible.mjs`: every event and oddity visual, on every site, plus `rover:0.5` and `van:0.5` on the yard. All clear 0.4% of the frame. None of the plate counts are under half the code count. Page errors 0. Table in `visible.md`.
- Strong state counts (PWR, plate path): door ajar 8.0%, chair 1.7%, low pool 7.4%, tool bag 2.0%, debris 12.4%, frost gone 8.9%, dark heater 9.1%.
- `node scripts/nw-perf.mjs`, the review's own loop. Worst case at 4× CPU is the pool at 6.7 ms (was 28–60 ms). The 8 ms target is met. Table in `perf.md`.
- `npx tsc --noEmit` passes.
- Unit suite: 290 tests, 281 pass, 9 fail. The nine names match `docs/audit/2026-11-14-evidence/fail-baseline.txt`. The new box test passes. Plate files are 960×540, each ≤ 180 KB. The nightwatch folder is 904 KB (budget 3.5 MB). Rover sheet is 768×192.
- Frames in `shots/`: each state on and off through `paintCamera`, and rover poses 0–7.
- Production: `vite preview` still looks for `dist/server/server.js`, which the Vercel preset does not write. `node scripts/preview-built.mjs` serves the Nitro build with srvx (and links the three PGLite files the function bundle forgot). Both nights below were played on that server, 1280×720, real clicks after the labelled setup. Page errors 0. Failed requests 0. Main thread with the tablet up, 5 s at 4× CPU: busy 1.38 s of 5.00 s (28%).
- Night 1 (PWR) reached 06:00. Caught the radwaste weep and the pressurizer weep. The tool bag at the pool ran its course (no alarm until late; the day shift found it). False reports 0. Eight camera stills and the aux event are in `night/`.
- Night 3 (PWR) reached 06:00. Caught 4, missed the locked-high-radiation door (it does not move a gauge, so the camera never flashed; the open door was on the aux feed at 02:12, screenshot `night/night3-doorAjar.png`). The hard hat was on the turbine at 01:53 (`night/night3-hardhat.png`). The chair oddity was not drawn this night. Pool level was caught. Log: `night3.txt`.

## Not checked

- A human looking at the feeds. The visibility numbers and the screenshots are the check.
- Looping video underlays. Not in this pass.
- Whether baking the infrared grade makes a red beacon on an infrared camera read as white. The beacon is drawn white when the scene is infrared, instead of desaturating the whole frame every paint.
