# Night Watch plates, 20 November 2026

Branch `g/nw-plates`. Not merged.

## Checked

- Seventeen base plates and eight state plates, 960×540 WebP, each under 180 KB. Rover sheet 768×192. Folder total under 1 MB (budget 3.5 MB).
- Unit suite: 289 tests, 280 pass, 9 fail. The nine names are the existing baseline in `docs/audit/2026-11-14-evidence/fail-baseline.txt`. `scripts/nightwatch.test.mjs` still passes with no plate loaded (node). `scripts/nightwatch-plates.test.mjs` passes.
- `npx tsc --noEmit` passes. `npm run build` passes. The built static tree contains `/nightwatch/plates/turbine.webp` (28,756 bytes, `image/webp`, HTTP 200 from the built files).
- Real clicks at 1280×720 and at 390×844: Night 1, tablet up, all eight cameras. Page errors 0. Failed requests 0. No horizontal overflow. Shots in `shots/`.
- Frame time with the tablet up, CPU throttled 4×, about 105 ms at 1280 and 79 ms at 390 over 40 frames. That is the whole page, not `paintCamera` alone, and it is over the 16 ms line in the brief. A cache of the decoded plate was added so the file is not rescaled every frame. It was not timed again.

## Not checked

- A full Night 1 through 06:00 on the production server. `vite preview` cannot start this repo: it looks for `dist/server/server.js`, and the Nitro build writes `.vercel/output` instead. The walk above used the dev server on port 8090, which serves the same plate files.
- Looping video underlays. Not made.
- Whether every event is easier to see than the code drawing. The events are still the code layers (beacons, steam, puddles, Cherenkov, the rover). They were not compared frame by frame against the old gallery.
