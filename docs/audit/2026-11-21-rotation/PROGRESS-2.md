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
- R10 todo · Bot table (B6 and F5), at 8×, in the background
- R11 todo · The full rotation (F3 and F4) with the fast clock
- R12 todo · Prove the day week reaches the nights in a browser,
- R13 todo · Copy:
- R14 todo · Run the full suite once at the end,
