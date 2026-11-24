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
- Step 12b done · The pool level drops in the middle of the near edge: wet liner, then a lower waterline. The full-frame low plate is not used. Proof in step-12b/.
- Step 12c done · Events are judged by the largest changed region on a 480×270 pair, and the sheet is in step-12c/. Five pictures fail that look. They were not redrawn.
- Step 12d done · The night hum fades for 0.3 s, then the buffer is dropped. No click on the way out. Proof in step-12d/.
- Step 12e done · Frame rate is a global setting, on the main menu and on pause. New week does not clear it. Proof in step-12e/.
- Step 13 done · The menu loads without the night plates, the outage data, or the minigames. 0.39 MB transferred before the menu. Proof in step-13/.
- Step 12f done · An event passes on its best of six frames if the largest connected change is at least 0.3%. More than one place is allowed. Condensate is still too faint. Proof in step-12f/.
- Step 12g done · The pool waterline drops on a new plate, with a wet band and the cells kept. The drips land in the band. The insulator glow is 384 pixels (the line is 389) and the grating sheen is 229. Neither was enlarged. The far-rail tool bag is 236. Proof in step-12g/.
- Step 14 done · Volume, text size, reduced motion, and screen shake are on the menu and on pause. A new week keeps them. Proof in step-14/.
- Step 15 done · Arrows, the mouse, and a pad reach the menus and the cabinets. The controls card is on pause. Proof in step-15/.
- Step 16 done · Keys can be changed in Settings. Esc still pauses. A reload keeps the bind. Proof in step-16/.
- Step 17 done · Escape pauses a cabinet and a night without leaving. Resume stays in the game. The delay rods are frozen and keep moving. Proof in step-17/.
- Step 18 done · Alarms use a triangle as well as colour. The menu has a name. Focus is a 3 px amber ring. Proof in step-18/.
- Step 19 done · Menu, settings, pause, and the controls card read one chrome file. Lines stay under two phone rows. Scene text was not moved. Proof in step-19/.
- Step 20 done · The menu shows version 0.20, not in the save. Known issues sits beside How to play. Proof in step-20/.
- Step 1a done · A clash swaps the two keys. Down on E leaves Use on S. Reset keys restores the defaults. Nobody is None. Proof in step-1a/.
- Step 1b done · Frame rate uses the same filled button as text size. Proof in step-1b/.
- Step 1c done · A stubbed standard pad opens Settings, walks a day, pauses, and aims the fish cabinet. Proof in step-1c/.
- Step 1d done · Delay rods stop under the pause card. Left and right follow the binds. Proof in step-1d/.
- Step 1e done · Review accepted the arc, the containment sheen, and the far-rail tool bag. The pictures were not changed. Note in step-12g/visible.md.
- Steps 21–23 done · Tauri shell for Windows, Linux, and unsigned macOS, built on GitHub Actions. The sandbox has Rust but not WebKit, so the Linux binary is the CI artifact. Proof in step-21/.
- Step 24 done · Windowed, fullscreen, and borderless. The size is remembered and is not in the week save. Proof in step-24/.
- Step 25 done · Desktop weeks live in the OS app-data folder, with three older copies. The browser still uses localStorage. Proof in step-25/. The Tauri window was not opened here.
- Step 36 done · Day 1 teaches one control at a time, and the line goes away when it is done. Proof in step-36/.
- Step 37 done · Night 1 is a silent door, a gull, and one flashing camera. One line at a time. Proof in step-37/.
- Step 38 done · Night pace is Relaxed, Standard, or Nuke. It is a setting, not part of the week. Proof in step-38/.
- Step 39 done · A careful first night is a B (92). Night 4 is a C (82). One silent event a night. Proof in step-39/.
- Step 40 done · Six more events on each site, using pictures the cameras already draw. Proof in step-40/.
- Step 41 done · Eight faint oddities, all inside 0.12% to 2%. The accepted arc, sheen, and tool bag were not changed. Proof in step-41/.
- Step 42 done · The turnover shows the seed that dealt the night. Proof in step-42/.
- Step 43 done · Endless starts at night 5 from the dawn lot. The high score is not in the week save. Proof in step-43/.
- Step 44 done · Daily night uses one UTC seed and a local board. No Steam board. Proof in step-44/.
- Step 45 done · One more night consequence for each residue. Open still adds nothing. Proof in step-45/.





- Step 45a done · Every event picture is the fault that camera would show. A shared picture stays only where the board tiles differ. The list is in step-45a/events.md.
- Step 45b done · Night 2 says the board tells you what kind. The turnover names the tile. A shared picture must have different tiles. Proof: picture-tiles.test.mjs, 27 pass, 0 fail.
- Step 45c done · Each day-1 and night-1 teaching line, at 1280×720 and 390×844. Shots in step-45c/. Page errors 0.
- Step 45d done · R10 sweeper at 1×, seed 1. Night 1 is F at 01:07 (3 false reports). Night 4 is F at 01:55 (1 miss, 3 false reports). The careful model is 92 B and 82 C. Notes in step-45d/result.txt.
- Step 45e done · Daily night filed catches. The board stored that grade. The week save did not gain night:2. Proof in step-45e/.
- Step 46 done · Four A's unlock one Elena scene for a later day. It lives in cc.crew, not the week save, and it plays once.
- Step 47 done · The outage asks for a discharge before the shuffle. The score is overlap with fresh fuel on the rim. The pass rule is unchanged.
- Step 48 done · Cycle 1 opens as a worked example. The grid and the counts are the benchmark map already in the build. No new figures.
- Step 49 done · Ten loading puzzles. Each target peak is the model's best one-swap Fq. Met is stored outside the week save.
- Step 51 done · Dawn prints a plant paper from the week's choices. It is stored in cc.paper, not the week save. Step 50 was not started.
- Step 52 done · Photo mode on the night feed turns off breathing, grain, the rolling bar, and the vignette. The scene is not redrawn.
- Step 53 done · The turnover replays the night's gaze log at 10×. An empty log stays empty. Stopped here. Step 54 was not started.
- Step 47b done · Discharge left Fuel Shuffle. The outage scores 64 picks against the Cycle 2 from-map: 64 of the 65 1.6% assemblies, F14 stayed. The holes take fresh fuel before the shuffle. Proof in step-47b/.
- Step 49b done · Each loading puzzle takes 3 to 5 swaps. Search says none of them fall in one or two. Par is the minimum. The limit is two past par. Proof in step-49b/.
- Step 53b done · Dawn paper, discharge, a puzzle mid-solve and solved, photo on and off for three cameras, and the replay, at 1280 and 390. Page errors 0. Proof in step-53b/.
- Step 53c done · Crew, the paper, endless, and the daily board are one profile. The desktop bridge copies it and does not rotate it. A reload keeps all four. Proof in step-53c/.
- Step 54 done · The plant monitor sits in the corner on a day shift. It reads the live board and it leaves when nights start. Proof in step-54/.
- Step 55 done · Days add an office hum, the coffee machine, and a distant page. WebAudio only. Proof in step-55/.
- Step 57 done · Catches and brews flash. Grades pop. Reduced motion gets neither. Step 56 was not started. Proof in step-57/.
- Step 58 done · Catch, rods, pebble, fish, golf, bowl, horde, and plot show Level 3 on the glass. Delay, load, and phys are not on the ladder. Proof in step-58/.
- Step 60 done · Nights 2 and 3 have one pot, so the cup runs out. A good bowl pays Jordan enough trust to reach tier 2. Culture was already on the scale. Night 1 stays a B and night 4 stays a C. Proof in step-60/.
- Step 60a done · The bowl payout in sim.ts is +2 again. The extra +2 for Jordan and for Mabel is outside that file, once per cabinet per day. A quiet week ends Jordan +12 (tier 1) before and +14 (tier 2) after. Proof in step-60a/.
- Step 49c done · The ten puzzles are 36-cell flux goals: Fq under a line, rim under 50%, peak lower than the start. Search says no one-swap or two-swap map meets them. A three-swap line does. The board does not show it. Proof in step-49c/.
- Step 60b done · Nights 2 and 3 at 1×, one pot, seed 1. The R10 sweeper is relieved, F and F, on three false reports. Night 3 still had the pot. The careful player stays A or C, so the pot stays. Proof in step-60b/.
- Step 54b done · Day shift at 1280 and 390 shows the corner monitor. The outage map is on the paper, and the notes sit beside it on a desktop and under it on a phone. Proof in step-54b/.
- Step 61 done · Reactor lines are listed in docs/facts.md against public NRC and DOE pages. The pool gauge and the builder's pebble pressure do not match those pages. Proof in step-61/.
- Step 62 done · The NRC window has a draft codex, "How real is this?", thirty short notes. Proof in step-62/.
- Step 63 done · Codex notes stay locked until play opens them. The day steam leak and the night relief both open the relief-valve note. Proof in step-63/.
- Step 64 done · Watchstander notes are optional, off by default, and marked as a draft. Proof in step-64/.








- Step 58 done · Eight cabinets show Level 3 on the bezel, at 1280 and 390. Delay, load, and phys stay unlevelled. Proof in step-58/.













