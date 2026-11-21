# Rotation progress

Brief: `docs/grok/rotation-and-nights.md`. One line per item. Start at the first `todo`. Mark each `done` or `blocked: <reason>`, with one line on what changed.

Branch made by Claude: `g/nw-plates` + `c/crew-outage-1118` merged. Full suite at that point: 9 baseline failures only (checked 21 November).


## Part A

- A1 done · Visibility rule split. Events fail under 0.4%. Oddities fail under 0.12% and over 2.0%. Table is `visible.md` with Event rule and Oddity rule columns. Every event clears 0.4%. Fifteen oddity rows are over 2% (flicker, fog, hard hat, warm glow, shadow). Those drawings are later items, not this rule.
- A2 done · Salt-cell shadow is a soft multiply silhouette, about 70px, sway ±1px over 4s, no outline. Plate change 0.16% (inside the oddity band). The code glass changes more, so the row notes plate < half of code.
- A3 done · Tunnel condensate is four 1×2 drips with a short fading streak, and a dark wet patch under each. The model lists it as an oddity, so the patches sit at 1.05% (inside 0.12–2.0), not at event volume.
- A4 done · Puddles are a multiply wet sheen (about 0.7), a soft light reflection, and one drip. Radius follows the event's development. Containment 1.00%, drywell 0.76%, corridor 2.34%, all events.
- A5 done · Pool ripples are three expanding annuli that shift a copy of the pool plate, not white rings. Plate change 0.36% (oddity band). The tool bag stays an event at 1.87%.
- A6 done · Discharge status bar moved from (100, 150, 50, 8) onto the dark screen at (89, 128, 15, 6). MSIV bar moved from under the board onto its lower margin (364, 96, 64, 4). Freeze sign already sits on its wall board. Crops and the list are in visual/.
- A7 done · hardhat-corridor is on camera aux. The corridor state plate is what shows. The yellow code hat on the turbine is deleted. Oddities do not flash.
- A8 done · Pressurizer words were a small board on a larger white sign. They are rebaked to fill it (about 124×64). Before and after crops are in visual/.
- A9 done · Cherenkov is a vertical strip rising out of the cells, brighter at the bottom. Every fifth cell stays dark. The round lamp dots are gone.
- A10 done · Intake screens are flat framed mesh in the same three slots, not round columns. Debris is the same camera with kelp on the mesh. Screen edges stay within 8 px of 80, 144, 210, 274, 340 and 404. The beacon spot stays dark. New plates kept.
- A-band done · Flicker is one fixture (0.42%). Fog is two low wisps (0.48%). Cavity glow is a small warm patch (0.62%). The corridor hard hat is smaller so the plate change is 1.14%. `visible.md` exits clean: every event clears 0.4%, every oddity is inside 0.12–2.0%.
- A11 done · Before and after crops for the discharge bar, the steam-line bar, the freeze board, and the pressurizer sign are in visual/. The new intake plates are the after; the round columns are the previous commit.

## Part B

- B1 done · grade() starts at 100. Early +6, late +2, miss −18, finding −10 more, false report −8, trip is F. Clamp 0–100. Bands A 95, B 85, C 72, D 60. Worked check is 76, a C. Three early stays 100, an A.
- B2 done · Best grade is a flag night:N:grade:A (and so on). C or better sets night:N:done. Elena's trust is A+3 B+2 C+1 D 0 F−2 through bumpTrust. A replay does not write flags or trust. Her five lines, and five curt ones, are in turnover.ts.
- B3 done · The 06:00 card is a scrolling turnover: time, camera, title, how it ended, a still and a look-count for misses, oddities left alone, false reports.
- B4 done · Night 1 always has the door or the tool bag at 01:10, and one Jordan nudge six minutes later. Nights 2–4 do not nudge.
- B5 done · Coffee still drains while the tablet is up. The same feed for more than 4 game minutes fades contrast, at most 15%, and recovers on a switch.
- B6 blocked: a full night is 7.5 real minutes. Sixteen bot nights would be about two hours of Playwright. Not run. No bot table.

## Part C

- C1 done · The ending has Rotate to nights (data-testid rotate-nights) above New week. It sets rot:nights and opens days off. New week is unchanged.
- C2 done · Days-off card, three lines, the fatigue rule, Report for nights.
- C3 done · Opener, then the shift, then the turnover, then Sleep into the next opener. Flags only. A reload with rot:nights and rot:reported opens the next undone night's opener.
- C4 done · The desktop app says the rotation starts after this week until rot:nights is set, then it only replays finished nights. Replays do not move trust or grades. Plant Monitor is untouched.
- C5 done · NIGHTS is four rows: 3/2/1.3/3, 4/3/1.1/2, 5/4/1.0/2, 6/4/0.85/1. night:5:done is ignored.
- C6 done · After night 4, a dawn card on the lot. Three lines by average grade, Elena's last line, New week or Menu.
- C7 done · Night 4 pins the aux door and the pool level together at 04:30 and names both Finale on the turnover.

## Part D

- D1 done · valve hid adds Valve 14 packing weeping at 01:40 on night 1, escalating faster. valve caught is Jordan at 00:20. open is neither.
- D2 done · tag hid adds the missing clearance tag on feed pump B, night 2, turbine camera.
- D3 done · dose hid pulls night 3's radiation event 45 minutes earlier and Jordan mentions the dosimeter.
- D4 done · log hid uses Elena's curt lines. log caught has her read one day-log line on night 1.
- D5 done · maintDone false pins the feed pump B trip at 02:30 on night 2.
- D6 done · shuffleDone true adds the Plant Monitor line at 00:05 on night 4.
- D7 done · ended a uses Jordan's warm set. ended c uses the terse set. Both are next to radio().
- D8 done · Carried events are tagged "from days" on the turnover.
- D9 done · Unit tests cover each residue, a fresh week, and a replay of the same seed.

## Part E

- E1 done · A two-tone chime when a camera starts flashing, a squelch on a new radio line, and the hum ducks under the turnover. Web Audio, through the existing mute. No new audio files.
- E2 done · prefers-reduced-motion keeps the rolling bar and the switch static at 30% and drops camera fatigue.
- E3 done · Days-off, opener, dawn, and the turnover scroll on a phone. Those buttons are at least 44 px. No sideways scroll on the cards.
- E4 done · New lines are listed in README.md for approval. Short, no exclamation marks.

## Part F

- F1 todo · Tests
- F2 todo · Build
- F3 blocked: a full sweeper rotation is four nights at 7.5 real minutes each, plus the story week. Not run.
- F5 blocked: no bot table. See B6.
- F7 todo · Frame time
