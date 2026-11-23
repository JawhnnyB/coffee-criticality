# Value pass: progress

Brief: `docs/grok/value-100.md`. One step, one commit. Real-input proof in this folder.

- Step 1 done · On `g/rotation-nights` at `5d5e3d6`. R1–R14 of the rotation fix pass. Not merged.
- Step 2 done · Four fresh tabs. Each one saves, reloads, and Continues. Play returns to the control room. The desktop keeps the 24-hour clock and comes back as the world, which is how a desktop is stored. Night 2's opener comes back. The outage keeps day 4 and the swapped fuel. Proof in step-02/.
- Step 3 done · The menu, under Continue, says "Saved 11:53, Night 2" (wall clock, then Day, Night, or Dawn). Proof in step-03/.
- Step 4 done · The nine baseline failures pass. Cabinet and desk tests find esbuild. The head-injector tests pass a context object. The share card now expects og:title, and an old twitter card is replaced. Suite: 308 pass, 0 fail. Notes in step-04/NOTES.md.
- Step 5 done · `npm run ship-check` runs typecheck, the production build, and the Nitro preview. Homepage HTTP 200. The command exits 0. Proof in step-05/.
- Step 6 done · `npm run preview` is the Nitro server (`node scripts/preview-built.mjs`). Homepage HTTP 200. `vite preview` is no longer the command. Proof in step-06/.
- Step 7 done · A render throw and a later throw each show one card: "The plant phone rang." Copy report is a real click and the clipboard reads back. Proof in step-07/.
- Step 8 done · A week and four nights at 1280×720 and 390×844. Two bugs: the phone night bar cuts off the buttons, and a short phone window cuts the end-of-day sheet. No console errors. Proof in step-08/.
- Step 9 done · The phone night buttons are on screen. A short window scrolls the end-of-day sheet instead of cutting it. The week was run again. Proof in step-09/.
- Step 10 done · Day shift at 4× CPU. The world steps 30 times a second. Worst busy time 30.5 percent. Target was under 40. Proof in step-10/.
- Step 10b done · The picture stays at the display rate. It steps down to a steady 30 when the thread hold stays over 6 ms, which is what a 4× CPU does. 60 Hz intervals were 16.67 ms. 4× intervals were 33.33 ms, with no 50s mixed in. Busy time 33.6 percent. A one-second walk covered 70 px at either rate. Proof in step-10b/.
- Step 4b done · esbuild 0.28.2 is a pinned devDependency, the same line Vite asks for. The Vercel CLI fallback is gone. Suite: 308 pass, 0 fail, with no ESBUILD override. Proof in step-04b/.
- Step 8b done · Week and four nights, R10 sweeper at 8×, seed 1. Desk A A A A. Phone A A A A. Dawn came up. No F. Proof in step-08b/.
- Step 11 done · One desk week and four nights. Heap after a forced collection went from 6.0 MB to 7.5 MB (+1.5 MB). Limit was 50. Proof in step-11/.
- Step 10c done · Auto stays at 60 unless pictures are late or the hold averages over 14 ms. 1× and 4× stayed at 16.67 ms. 6× stepped to a steady 33.33 ms. Settings can force Auto, 60, or 30, and the choice survived a reload. Proof in step-10c/.
- Step 11b done · Renderer RSS from day 1 morning to dawn grew 25.0 MB after a shift drops its plates and camera canvases. The first measure, which kept them, grew 98.1 MB. Limit was 50. Proof in step-11b/.
- Step 12 done · A production new shift, through the intro and into the cafe, logged no warnings and no errors. The audio context waits for a gesture. Proof in step-12/.
- Step 12a done · The yellow tool-bag box, the van rectangles, the solid condensate ovals, and the drywell puddle rectangle are gone. Proof in step-12a/.
- Step 12b todo · Make the pool level drop a lower waterline with a wet band, in one place.
- Step 12c todo · Judge events by the largest changed region, and show a contact sheet.
- Step 12d todo · Fade the night hum out over 0.3 s.
- Step 12e todo · Frame rate on a global settings screen, from the menu and from pause.
- Step 13 todo · Cut first load: lazy-load Night Watch plates, the outage data and minigames. Target under 3 MB before the menu shows.
