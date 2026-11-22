# Rotation fix pass: progress

Brief: `docs/grok/rotation-fixes.md`. Start at the first `todo`. Mark each `done` or `blocked: <reason>`, with one line on what changed. Commit and push after every item.

- R1 done · Rotate to nights stands on the dusk lot (play, so writeSave can run) and world keys do not reach the sim. The save is written on rotate, report, start, the grade, sleep, and dawn. Reload then Continue: days off, night 2's opener with grade A and trust 35, and the dawn card with trust 44. Page errors 0.
- R2 done · The 06:00 sheet is a full paper card over the shift, list scrolls, Sleep stays at the bottom. A missed tool bag and a missed relief valve show the still and the look-count. Heights: 720, 900, and 844. No sideways scroll. Shots in visual/turnover-1280x720.png, turnover-1440x900.png, turnover-390x844.png.
- R3 done · Three false reports relieve you. That night is an F, not done, trust −2. An event that has already started and is still open is marked missed. The C line shows only at 06:00. A relieved night says "I have the chair. This night does not count." Unit test covers each.
- R4 done · The shift freezes its night number on mount, so the header stays on night 1 after the grade flag is written.
- R5 done · In the rotation the button says Leave the watch and asks before Elena logs it as relieved (an F, same as R3). Replays still leave immediately and change nothing. Shipped in bf2def3; the progress line was the part still open.
- R6 done · After dawn the save sets rot:complete. The overlay hides on the menu and comes back on Continue. New week still asks before wiping. Checked in a browser: Menu leaves the dawn card, Continue shows it again.
- R7 done · After a D or an F the opener says "Night N, again. Elena wants it stood properly." A first try still uses the plain opener.
- R8 done · A second report on a camera logged within 20 game minutes says "Already logged. The crew is on it." No penalty. A new event on that camera still counts. Unit test covers both.
- R9 done · __controlsTest.setNightSpeed(n) speeds the current shift only. Coffee, brewing, fatigue and escalation all follow game minutes, so 8× matches 1×. Not on any button.
- R10 done · Flash and sweeper, nights 1–4, seeds 1 and 2, at 8×. Flash average rank 1.50 (C or worse). Sweeper 3.50 (B or better). False reports 0.56 a night. Table in bots.md. A caught camera stays logged for 40 game minutes, the tool bag is yellow, the van and the rover's torch are smaller, and the switchyard arc stays lit once the grid tile has crossed.
- R11 done · Production build at 8×, real clicks. Desk: nights 1–3 A, night 4 F, stood again as A, then the dawn card. Reload between nights 2 and 3 still opened night 3 (plain opener, not "again"). Phone 390×844: night 1 A, night 4 A. Shots and grades in r11/.
- R12 done · Hooks setResidue and setMaintDone. Night 1 with the valve hidden: aux camera at 01:44 shows the weep, and the sheet says Valve 14 packing weeping, from days. Night 2 with maintenance not done: turbine camera at 02:34, feedwater low, and the sheet says Feed pump B tripped at 02:30, from days. Shots in r12/.
- R13 done · Every new line from R3, R5, R7, and R8 is listed in the rotation README for approval. The logged window is 40 game minutes and is not spoken.
- R14 done · Full suite 300 tests, 291 pass, 9 fail. The 9 names match the baseline. Typecheck and build pass. Visibility exits 0 after the van lamps were opened from 18×12 to 26×18 (0.58% of the frame, 2 thumbnail cells). Pool paint at 4× is 6.8 ms. The plates-fix perf file was not kept.
